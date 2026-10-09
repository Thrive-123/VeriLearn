from django.conf import settings
from django.db import models


class Task(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("partial", "Partially Completed"),
        ("completed", "Completed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks"
    )

    title = models.CharField(max_length=200)

    description = models.TextField()

    task_date = models.DateField()

    estimated_minutes = models.PositiveIntegerField(
        default=30
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    completion_percentage = models.PositiveIntegerField(
        default=0
    )

    ai_feedback = models.TextField(
        blank=True,
        default=""
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return self.title