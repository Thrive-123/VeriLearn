
from django.conf import settings
from django.db import models


class RevisionMemory(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="revision_memories",
    )

    task = models.ForeignKey(
        "tasks.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revision_memories",
    )

    topic = models.CharField(max_length=200)

    content = models.TextField()

    embedding = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.topic} - {self.user.username}"
