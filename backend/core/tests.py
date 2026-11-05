from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

User = get_user_model()


class RegistrationTests(APITestCase):
    def setUp(self):
        self.url = "/api/register/"
        self.valid_data = {
            "username": "test_signup_user",
            "email": "signup@example.com",
            "password": "StrongTestPassword!927"
        }

    def test_registration_success(self):
        response = self.client.post(
            self.url, self.valid_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(username="test_signup_user").exists()
        )
        self.assertNotIn("password", response.data)

    def test_email_is_required(self):
        data = self.valid_data.copy()
        data.pop("email")

        response = self.client.post(
            self.url, data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_duplicate_email_is_rejected(self):
        User.objects.create_user(
            username="existing_user",
            email="signup@example.com",
            password="AnotherStrongPassword!927"
        )

        response = self.client.post(
            self.url, self.valid_data, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_is_hashed(self):
        self.client.post(
            self.url, self.valid_data, format="json"
        )

        user = User.objects.get(username="test_signup_user")
        self.assertNotEqual(user.password, self.valid_data["password"])
        self.assertTrue(user.check_password(self.valid_data["password"]))
