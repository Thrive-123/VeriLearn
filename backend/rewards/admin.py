
from django.contrib import admin

from .models import (
    RewardTransaction,
    RewardItem,
    RewardRedemption,
)


@admin.register(RewardTransaction)
class RewardTransactionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "task",
        "xp_earned",
        "coins_earned",
        "awarded_at",
    )
    list_filter = ("awarded_at",)


@admin.register(RewardItem)
class RewardItemAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "coin_cost",
        "active",
    )
    list_editable = ("coin_cost", "active")
    search_fields = ("name",)


@admin.register(RewardRedemption)
class RewardRedemptionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "item",
        "coins_spent",
        "redeemed_at",
    )
    list_filter = ("redeemed_at",)
