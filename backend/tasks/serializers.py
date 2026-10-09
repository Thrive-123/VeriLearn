from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Task

        fields = [
            "id",
            "title",
            "description",
            "task_date",
            "estimated_minutes",
            "status",
            "completion_percentage",
            "ai_feedback",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "completion_percentage",
            "ai_feedback",
            "created_at",
        ]