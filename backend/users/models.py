from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)

    coins = models.PositiveIntegerField(default=0)

    xp = models.PositiveIntegerField(default=0)

    current_streak = models.PositiveIntegerField(default=0)

    longest_streak = models.PositiveIntegerField(default=0)

    total_study_minutes = models.PositiveIntegerField(default=0)

    last_streak_date = models.DateField(
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.username