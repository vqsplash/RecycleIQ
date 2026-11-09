from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.guidance.models import GuidanceEntry, WasteCategory


class GuidanceApiTests(APITestCase):
    def setUp(self):
        self.category = WasteCategory.objects.get(slug="plastic")

    def test_public_guidance_list_and_detail(self):
        response = self.client.get("/api/guidance/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 6)
        plastic = next(item for item in response.data if item["slug"] == "plastic")
        self.assertEqual(plastic["guidance"]["title"], "Recycling Plastic")

        detail = self.client.get("/api/guidance/plastic/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["name"], "Plastic")

    def test_only_admin_can_update_guidance(self):
        user = get_user_model().objects.create_user(
            username="member", password="Correct-Horse-42!"
        )
        self.client.force_authenticate(user)
        denied = self.client.put(
            "/api/guidance/plastic/",
            {"title": "Updated", "body": "Updated guidance."},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)

        admin = get_user_model().objects.create_superuser(
            username="admin", email="admin@example.com", password="Correct-Horse-42!"
        )
        self.client.force_authenticate(admin)
        updated = self.client.put(
            "/api/guidance/plastic/",
            {"title": "Updated title", "body": "Use local rules."},
            format="json",
        )
        self.assertEqual(updated.status_code, 200)
        entry = GuidanceEntry.objects.filter(category=self.category).first()
        self.assertEqual(entry.title, "Updated title")
        self.assertEqual(entry.updated_by, admin)

    def test_guidance_unknown_category_returns_404(self):
        response = self.client.get("/api/guidance/not-a-category/")
        self.assertEqual(response.status_code, 404)