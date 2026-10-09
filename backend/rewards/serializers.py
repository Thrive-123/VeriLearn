
from rest_framework import serializers

from .models import (
    RewardTransaction,
    RewardItem,
    RewardRedemption,
)


class RewardTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardTransaction
        fields = [
            "id",
            "task",
            "xp_earned",
            "coins_earned",
            "reason",
            "awarded_at",
        ]
        read_only_fields = fields


class RewardItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RewardItem
        fields = [
            "id",
            "name",
            "description",
            "coin_cost",
            "icon",
        ]


class RewardRedemptionSerializer(serializers.ModelSerializer):
    item = RewardItemSerializer(read_only=True)

    class Meta:
        model = RewardRedemption
        fields = [
            "id",
            "item",
            "coins_spent",
            "redeemed_at",
        ]
