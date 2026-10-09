from django.conf import settings
from django.db import models

from tasks.models import Task


class Evidence(models.Model):

    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("processing", "Processing"),
        ("verified", "Verified"),
        ("partial", "Partially Verified"),
        ("rejected", "Rejected"),
    ]

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="evidence",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="evidence",
    )

    file = models.FileField(
        upload_to="evidence/",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="uploaded",
    )

    completion_percentage = models.PositiveIntegerField(
        default=0,
    )

    ai_feedback = models.TextField(
        blank=True,
        default="",
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return f"{self.task.title} - Evidence {self.id}"