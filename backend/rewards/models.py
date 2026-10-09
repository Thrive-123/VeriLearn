
from django.conf import settings
from django.db import models
from tasks.models import Task


class RewardTransaction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reward_transactions",
    )
    task = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        related_name="reward_transaction",
    )
    xp_earned = models.PositiveIntegerField(default=0)
    coins_earned = models.PositiveIntegerField(default=0)
    reason = models.CharField(
        max_length=255,
        default="Task completed and verified",
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.task.title} - {self.xp_earned} XP"


class RewardItem(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255)
    coin_cost = models.PositiveIntegerField()
    icon = models.CharField(max_length=20, default="🎁")
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.coin_cost} coins"


class RewardRedemption(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reward_redemptions",
    )
    item = models.ForeignKey(
        RewardItem,
        on_delete=models.PROTECT,
        related_name="redemptions",
    )
    coins_spent = models.PositiveIntegerField()
    redeemed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.item.name}"
