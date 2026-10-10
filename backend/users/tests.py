
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationTests(APITestCase):

    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.profile_url = "/api/auth/profile/"

        self.user_data = {
            "username": "teststudent",
            "email": "teststudent@example.com",
            "password": "StrongTestPass123!",
        }

    def test_user_can_register(self):
        response = self.client.post(
            self.register_url,
            self.user_data,
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )
        self.assertTrue(
            User.objects.filter(username="teststudent").exists()
        )
        self.assertNotIn("password", response.data)

    def test_registered_password_is_hashed(self):
        self.client.post(
            self.register_url,
            self.user_data,
            format="json"
        )

        user = User.objects.get(username="teststudent")

        self.assertNotEqual(
            user.password,
            self.user_data["password"]
        )
        self.assertTrue(
            user.check_password(self.user_data["password"])
        )

    def test_profile_requires_authentication(self):
        response = self.client.get(self.profile_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )

    def test_authenticated_user_can_view_own_profile(self):
        user = User.objects.create_user(
            username="profileuser",
            email="profileuser@example.com",
            password="AnotherStrongPass123!",
        )

        self.client.force_authenticate(user=user)

        response = self.client.get(self.profile_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )
        self.assertEqual(response.data["username"], user.username)
        self.assertEqual(response.data["email"], user.email)
        self.assertIn("coins", response.data)
        self.assertIn("xp", response.data)
