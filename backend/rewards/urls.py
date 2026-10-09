
from django.urls import path

from .views import (
    RewardHistoryView,
    RewardItemListView,
    RewardRedeemView,
    RewardRedemptionHistoryView,
)

urlpatterns = [
    path("", RewardHistoryView.as_view(), name="reward-history"),
    path("shop/", RewardItemListView.as_view(), name="reward-shop"),
    path("redeem/", RewardRedeemView.as_view(), name="reward-redeem"),
    path(
        "redemptions/",
        RewardRedemptionHistoryView.as_view(),
        name="redemption-history",
    ),
]
