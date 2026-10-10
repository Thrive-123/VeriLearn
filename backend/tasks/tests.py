
from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task


User = get_user_model()


class TaskPrivacyTests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="TestPassword123!"
        )

        self.user2 = User.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="TestPassword123!"
        )

        self.task1 = Task.objects.create(
            user=self.user1,
            title="Student 1 Task",
            description="My private study task",
            task_date=date.today(),
            estimated_minutes=30
        )

        self.task2 = Task.objects.create(
            user=self.user2,
            title="Student 2 Task",
            description="Another student's private task",
            task_date=date.today(),
            estimated_minutes=30
        )

    def test_user_sees_only_own_tasks(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get("/api/tasks/")

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        task_ids = [task["id"] for task in response.data]

        self.assertIn(self.task1.id, task_ids)
        self.assertNotIn(self.task2.id, task_ids)

    def test_user_cannot_access_another_users_task(self):
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(
            f"/api/tasks/{self.task2.id}/"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_unauthenticated_user_cannot_list_tasks(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/tasks/")

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
