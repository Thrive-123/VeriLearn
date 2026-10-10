
from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task
from .models import Evidence


User = get_user_model()


class EvidenceHistoryTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="StrongPass123!",
        )

        self.user2 = User.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="StrongPass123!",
        )

        self.task1 = Task.objects.create(
            user=self.user1,
            title="DBMS Normalization",
            description="Study 1NF, 2NF and 3NF",
            task_date=date.today(),
            estimated_minutes=60,
        )

        self.task2 = Task.objects.create(
            user=self.user2,
            title="Java OOP",
            description="Study inheritance and polymorphism",
            task_date=date.today(),
            estimated_minutes=60,
        )

        self.evidence = Evidence.objects.create(
            user=self.user1,
            task=self.task1,
            file=SimpleUploadedFile(
                "notes.txt",
                b"DBMS normalization notes",
                content_type="text/plain",
            ),
            status="uploaded",
        )

        self.history_url = (
            f"/api/evidence/task/{self.task1.id}/"
        )

    def test_unauthenticated_user_cannot_view_history(self):
        response = self.client.get(self.history_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_user_can_view_own_evidence_history(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.history_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["id"],
            self.evidence.id,
        )

    def test_user_cannot_view_another_users_evidence(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(self.history_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(len(response.data), 0)


class EvidenceVerificationTests(EvidenceHistoryTests):

    def setUp(self):
        super().setUp()
        self.upload_url = "/api/evidence/"

    @patch("verification.views.save_revision_memory")
    @patch("verification.views.analyze_evidence")
    def test_fully_covered_evidence_completes_task(
        self,
        mock_analyze,
        mock_memory,
    ):
        self.client.force_authenticate(user=self.user1)

        mock_analyze.return_value = {
            "completion_percentage": 100,
            "covered_areas": ["1NF", "2NF", "3NF"],
            "missing_areas": [],
            "feedback": "All topics covered.",
            "recommendation": "Revise the concepts.",
        }

        response = self.client.post(
            self.upload_url,
            {
                "task": self.task1.id,
                "file": SimpleUploadedFile(
                    "complete_notes.txt",
                    b"DBMS normalization notes",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.task1.refresh_from_db()

        evidence = Evidence.objects.filter(
            task=self.task1
        ).latest("uploaded_at")

        self.assertEqual(evidence.status, "verified")
        self.assertEqual(
            evidence.completion_percentage,
            100,
        )
        self.assertEqual(self.task1.status, "completed")
        self.assertEqual(
            self.task1.completion_percentage,
            100,
        )
        self.assertIn("All topics covered.", evidence.ai_feedback)

    @patch("verification.views.save_revision_memory")
    @patch("verification.views.analyze_evidence")
    def test_partially_covered_evidence_updates_task(
        self,
        mock_analyze,
        mock_memory,
    ):
        self.client.force_authenticate(user=self.user1)

        mock_analyze.return_value = {
            "completion_percentage": 60,
            "covered_areas": ["1NF", "2NF"],
            "missing_areas": ["3NF"],
            "feedback": "Some topics are missing.",
            "recommendation": "Study 3NF.",
        }

        response = self.client.post(
            self.upload_url,
            {
                "task": self.task1.id,
                "file": SimpleUploadedFile(
                    "partial_notes.txt",
                    b"Some normalization notes",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
            response.data,
        )

        self.task1.refresh_from_db()

        evidence = Evidence.objects.filter(
            task=self.task1
        ).latest("uploaded_at")

        self.assertEqual(evidence.status, "partial")
        self.assertEqual(
            evidence.completion_percentage,
            60,
        )
        self.assertEqual(self.task1.status, "partial")
        self.assertEqual(
            self.task1.completion_percentage,
            60,
        )
        self.assertIn("3NF", evidence.ai_feedback)

    @patch("verification.views.analyze_evidence")
    def test_user_cannot_upload_to_another_users_task(
        self,
        mock_analyze,
    ):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.upload_url,
            {
                "task": self.task2.id,
                "file": SimpleUploadedFile(
                    "private_notes.txt",
                    b"Private notes",
                    content_type="text/plain",
                ),
            },
            format="multipart",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )
        mock_analyze.assert_not_called()
