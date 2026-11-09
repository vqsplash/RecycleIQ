from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase


class AuthenticationApiTests(APITestCase):
    def test_registration_login_and_current_user(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "username": "recycler",
                "email": "recycler@example.com",
                "password": "Correct-Horse-42!",
                "password_confirm": "Correct-Horse-42!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data), {"id", "username", "email"})

        user = get_user_model().objects.get(username="recycler")
        self.assertTrue(user.check_password("Correct-Horse-42!"))
        self.assertFalse(user.is_staff)

        token_response = self.client.post(
            "/api/auth/token/",
            {"username": "recycler", "password": "Correct-Horse-42!"},
            format="json",
        )
        self.assertEqual(token_response.status_code, 200)
        self.assertIn("access", token_response.data)
        self.assertIn("refresh", token_response.data)

        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {token_response.data['access']}"
        )
        current_user = self.client.get("/api/auth/me/")
        self.assertEqual(current_user.status_code, 200)
        self.assertEqual(current_user.data["username"], "recycler")
        self.assertFalse(current_user.data["is_staff"])

    def test_registration_rejects_mismatched_and_weak_passwords(self):
        payload = {
            "username": "recycler",
            "email": "recycler@example.com",
            "password": "password",
            "password_confirm": "different",
        }
        response = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password_confirm", response.data)

    def test_current_user_requires_authentication(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)