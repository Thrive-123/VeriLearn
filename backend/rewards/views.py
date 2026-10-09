
from django.contrib.auth import get_user_model
from django.db import transaction

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    RewardTransaction,
    RewardItem,
    RewardRedemption,
)
from .serializers import (
    RewardTransactionSerializer,
    RewardItemSerializer,
    RewardRedemptionSerializer,
)

User = get_user_model()


class RewardHistoryView(generics.ListAPIView):
    serializer_class = RewardTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RewardTransaction.objects.filter(
            user=self.request.user
        ).order_by("-awarded_at")


class RewardItemListView(generics.ListAPIView):
    serializer_class = RewardItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RewardItem.objects.filter(
            active=True
        ).order_by("coin_cost")


class RewardRedemptionHistoryView(generics.ListAPIView):
    serializer_class = RewardRedemptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RewardRedemption.objects.filter(
            user=self.request.user
        ).select_related("item").order_by("-redeemed_at")


class RewardRedeemView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            item_id = int(request.data.get("item_id"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "A valid item_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(
                    pk=request.user.pk
                )

                item = RewardItem.objects.get(
                    pk=item_id,
                    active=True,
                )

                if user.coins < item.coin_cost:
                    return Response(
                        {
                            "detail": "Not enough coins to redeem this reward.",
                            "coins_balance": user.coins,
                            "required_coins": item.coin_cost,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                user.coins -= item.coin_cost
                user.save(update_fields=["coins"])

                redemption = RewardRedemption.objects.create(
                    user=user,
                    item=item,
                    coins_spent=item.coin_cost,
                )

                response_data = {
                    "message": f"{item.name} redeemed successfully!",
                    "coins_balance": user.coins,
                    "redemption": RewardRedemptionSerializer(
                        redemption
                    ).data,
                }

            return Response(
                response_data,
                status=status.HTTP_201_CREATED,
            )

        except RewardItem.DoesNotExist:
            return Response(
                {"detail": "Reward not found or unavailable."},
                status=status.HTTP_404_NOT_FOUND,
            )
