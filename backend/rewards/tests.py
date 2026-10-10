
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import RewardItem, RewardRedemption, RewardTransaction

User = get_user_model()


class RewardAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="rewardstudent1",
            email="rewardstudent1@example.com",
            password="StrongPass123!",
            coins=100,
            xp=50,
        )

        self.user2 = User.objects.create_user(
            username="rewardstudent2",
            email="rewardstudent2@example.com",
            password="StrongPass123!",
            coins=20,
            xp=10,
        )

        self.active_item = RewardItem.objects.create(
            name="Focus Badge Test",
            description="A test reward badge",
            coin_cost=30,
            active=True,
        )

        self.inactive_item = RewardItem.objects.create(
            name="Inactive Badge Test",
            description="An unavailable test reward",
            coin_cost=10,
            active=False,
        )

        self.shop_url = "/api/rewards/shop/"
        self.redeem_url = "/api/rewards/redeem/"
        self.history_url = "/api/rewards/"
        self.redemption_history_url = "/api/rewards/redemptions/"

    def test_unauthenticated_user_cannot_access_shop(self):
        response = self.client.get(self.shop_url)

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    def test_shop_shows_only_active_rewards(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.shop_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        names = [item["name"] for item in response.data]

        self.assertIn(self.active_item.name, names)
        self.assertNotIn(self.inactive_item.name, names)

    def test_user_can_redeem_reward_with_enough_coins(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.redeem_url,
            {"item_id": self.active_item.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.user1.refresh_from_db()

        self.assertEqual(self.user1.coins, 70)
        self.assertEqual(
            RewardRedemption.objects.filter(
                user=self.user1,
                item=self.active_item,
            ).count(),
            1,
        )

    def test_redemption_fails_when_coins_are_insufficient(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.post(
            self.redeem_url,
            {"item_id": self.active_item.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.user2.refresh_from_db()

        self.assertEqual(self.user2.coins, 20)
        self.assertFalse(
            RewardRedemption.objects.filter(
                user=self.user2,
                item=self.active_item,
            ).exists()
        )

    def test_user_cannot_redeem_inactive_reward(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.redeem_url,
            {"item_id": self.inactive_item.id},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.user1.refresh_from_db()
        self.assertEqual(self.user1.coins, 100)

    def test_invalid_item_id_is_rejected(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.post(
            self.redeem_url,
            {"item_id": "invalid"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_user_sees_only_own_reward_history(self):
        from tasks.models import Task
        from datetime import date

        task1 = Task.objects.create(
            user=self.user1,
            title="Reward task 1",
            description="Test task",
            task_date=date.today(),
            estimated_minutes=30,
        )

        task2 = Task.objects.create(
            user=self.user2,
            title="Reward task 2",
            description="Test task",
            task_date=date.today(),
            estimated_minutes=30,
        )

        RewardTransaction.objects.create(
            user=self.user1,
            task=task1,
            xp_earned=100,
            coins_earned=50,
        )

        RewardTransaction.objects.create(
            user=self.user2,
            task=task2,
            xp_earned=100,
            coins_earned=50,
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]["task"],
            task1.id,
        )

    def test_user_sees_only_own_redemption_history(self):
        RewardRedemption.objects.create(
            user=self.user1,
            item=self.active_item,
            coins_spent=30,
        )

        RewardRedemption.objects.create(
            user=self.user2,
            item=self.active_item,
            coins_spent=30,
        )

        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.redemption_history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
