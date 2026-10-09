
import logging
from datetime import timedelta

from django.db import transaction

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import NotFound

from .models import Evidence
from .serializers import EvidenceSerializer
from .ai_service import analyze_evidence

from tasks.models import Task
from rewards.models import RewardTransaction
from revision.memory_service import save_revision_memory


logger = logging.getLogger(__name__)


class EvidenceCreateView(generics.CreateAPIView):
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        task_id = self.request.data.get("task")

        try:
            task = Task.objects.get(
                id=task_id,
                user=self.request.user
            )
        except (Task.DoesNotExist, ValueError, TypeError):
            raise NotFound(
                "Task not found or you do not have permission "
                "to use this task."
            )

        evidence = serializer.save(
            task=task,
            user=self.request.user
        )

        try:
            evidence.status = "processing"
            evidence.save(update_fields=["status"])

            result = analyze_evidence(task, evidence.file)

            percentage = int(result["completion_percentage"])
            percentage = max(0, min(100, percentage))

            covered = result.get("covered_areas", [])
            missing = result.get("missing_areas", [])

            evidence.completion_percentage = percentage
            evidence.ai_feedback = (
                "Covered Areas:\n"
                + "\n".join(f"- {item}" for item in covered)
                + "\n\nMissing Areas:\n"
                + "\n".join(f"- {item}" for item in missing)
                + "\n\nFeedback:\n"
                + result.get("feedback", "")
                + "\n\nRecommendation:\n"
                + result.get("recommendation", "")
            )

            if percentage == 100:
                evidence.status = "verified"
            elif percentage > 0:
                evidence.status = "partial"
            else:
                evidence.status = "rejected"

            # Save learning memory separately.
            # A RAG failure must not stop evidence verification.
            try:
                memory_content = (
                    f"Task: {task.title}\n"
                    f"Task goal: {task.description}\n"
                    f"Completion: {percentage}%\n"
                    f"Covered areas: {', '.join(map(str, covered))}\n"
                    f"Missing areas: {', '.join(map(str, missing))}\n"
                    f"Feedback: {result.get('feedback', '')}\n"
                    f"Recommendation: "
                    f"{result.get('recommendation', '')}"
                )

                save_revision_memory(
                    user=self.request.user,
                    task=task,
                    topic=task.title,
                    content=memory_content,
                )

            except Exception:
                logger.exception(
                    "Could not save RAG memory for task %s",
                    task.id,
                )

            with transaction.atomic():
                evidence.save()

                task.completion_percentage = percentage

                if percentage == 100:
                    task.status = "completed"
                elif percentage > 0:
                    task.status = "partial"
                else:
                    task.status = "pending"

                task.ai_feedback = evidence.ai_feedback
                task.save(
                    update_fields=[
                        "completion_percentage",
                        "status",
                        "ai_feedback",
                    ]
                )

                task_date = task.task_date

                daily_tasks = Task.objects.filter(
                    user=self.request.user,
                    task_date=task_date
                )

                all_tasks_completed = (
                    daily_tasks.exists()
                    and not daily_tasks.exclude(
                        completion_percentage=100
                    ).exists()
                )

                if not all_tasks_completed:
                    return

                reward_exists = RewardTransaction.objects.filter(
                    user=self.request.user,
                    task__task_date=task_date
                ).exists()

                if reward_exists:
                    return

                RewardTransaction.objects.create(
                    user=self.request.user,
                    task=task,
                    xp_earned=100,
                    coins_earned=50,
                    reason="All daily tasks completed"
                )

                user = self.request.user
                user.xp += 100
                user.coins += 50

                last_date = user.last_streak_date

                if last_date is None:
                    user.current_streak = 1
                    user.last_streak_date = task_date

                elif task_date > last_date:
                    if task_date == last_date + timedelta(days=1):
                        user.current_streak += 1
                    else:
                        user.current_streak = 1

                    user.last_streak_date = task_date

                if user.current_streak > user.longest_streak:
                    user.longest_streak = user.current_streak

                user.save(
                    update_fields=[
                        "xp",
                        "coins",
                        "current_streak",
                        "longest_streak",
                        "last_streak_date",
                    ]
                )

        except Exception:
            logger.exception(
                "AI verification failed for evidence %s",
                evidence.id,
            )

            evidence.status = "uploaded"
            evidence.ai_feedback = (
                "AI verification failed. Please try uploading "
                "the evidence again."
            )
            evidence.save(
                update_fields=["status", "ai_feedback"]
            )


class EvidenceHistoryView(generics.ListAPIView):
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]

        return Evidence.objects.filter(
            task_id=task_id,
            user=self.request.user
        ).order_by("-uploaded_at")
