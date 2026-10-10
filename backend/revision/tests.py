
from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class RevisionSearchTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="revisionstudent",
            email="revisionstudent@example.com",
            password="StrongPass123!",
        )

        self.url = "/api/revision/search/"

    def test_unauthenticated_user_cannot_search(self):
        response = self.client.get(
            self.url,
            {"q": "Java polymorphism"},
        )

        self.assertIn(
            response.status_code,
            [
                status.HTTP_401_UNAUTHORIZED,
                status.HTTP_403_FORBIDDEN,
            ],
        )

    @patch("revision.views.search_revision_memories")
    def test_authenticated_user_can_search(self, mock_search):
        self.client.force_authenticate(user=self.user)

        mock_search.return_value = [
            {
                "topic": "Java Polymorphism",
                "content": "Polymorphism allows one interface to have multiple forms.",
                "similarity": 0.85,
            }
        ]

        response = self.client.get(
            self.url,
            {"q": "Java polymorphism"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(response.data["query"], "Java polymorphism")
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(
            response.data["results"][0]["topic"],
            "Java Polymorphism",
        )

        mock_search.assert_called_once_with(
            user=self.user,
            query="Java polymorphism",
            limit=5,
        )

    @patch("revision.views.search_revision_memories")
    def test_empty_query_is_rejected(self, mock_search):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.url, {"q": "   "})

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        mock_search.assert_not_called()

    @patch("revision.views.search_revision_memories")
    def test_query_longer_than_500_characters_is_rejected(
        self,
        mock_search,
    ):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            self.url,
            {"q": "a" * 501},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        mock_search.assert_not_called()

    @patch("revision.views.search_revision_memories")
    def test_search_failure_returns_service_unavailable(
        self,
        mock_search,
    ):
        self.client.force_authenticate(user=self.user)
        mock_search.side_effect = Exception("Simulated search failure")

        response = self.client.get(
            self.url,
            {"q": "Java polymorphism"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        self.assertIn("error", response.data)
