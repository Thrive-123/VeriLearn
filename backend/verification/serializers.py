from rest_framework import serializers

from .models import Evidence


class EvidenceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Evidence

        fields = [
            "id",
            "task",
            "file",
            "status",
            "completion_percentage",
            "ai_feedback",
            "uploaded_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "completion_percentage",
            "ai_feedback",
            "uploaded_at",
        ]
        