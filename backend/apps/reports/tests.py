from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.guidance.models import WasteCategory
from apps.reports.models import WasteReport


class WasteReportApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.owner = User.objects.create_user(username="owner", password="Password-42!")
        self.other = User.objects.create_user(username="other", password="Password-42!")
        self.admin = User.objects.create_superuser(
            username="moderator", email="moderator@example.com", password="Password-42!"
        )
        self.category = WasteCategory.objects.get(slug="glass")
        self.pending = self.make_report(self.owner, "pending")
        self.other_pending = self.make_report(self.other, "pending")
        self.approved = self.make_report(self.other, "approved")
        self.rejected = self.make_report(self.other, "rejected")

    def make_report(self, user, status):
        return WasteReport.objects.create(
            user=user,
            category=self.category,
            description="Waste accumulation near the campus walkway.",
            latitude=23.8103,
            longitude=90.4125,
            status=status,
        )

    def test_anonymous_list_exposes_only_approved_reports_even_with_filters(self):
        response = self.client.get("/api/reports/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data["results"]], [self.approved.id])

        pending_filter = self.client.get("/api/reports/?status=pending")
        self.assertEqual(pending_filter.status_code, 200)
        self.assertEqual(pending_filter.data["results"], [])

    def test_authenticated_list_includes_approved_and_own_reports_only(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get("/api/reports/")
        ids = {item["id"] for item in response.data["results"]}
        self.assertEqual(ids, {self.pending.id, self.approved.id})
        self.assertNotIn(self.other_pending.id, ids)
        self.assertNotIn(self.rejected.id, ids)

    def test_report_submission_requires_auth_and_forces_pending_status(self):
        data = {
            "category": "glass",
            "description": "Broken glass near the campus walkway.",
            "latitude": "23.81",
            "longitude": "90.41",
            "status": "approved",
        }
        anonymous = self.client.post("/api/reports/", data, format="json")
        self.assertEqual(anonymous.status_code, 401)

        self.client.force_authenticate(self.owner)
        created = self.client.post("/api/reports/", data, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.data["status"], "pending")
        self.assertEqual(created.data["category"], {
            "id": self.category.id,
            "slug": "glass",
            "name": "Glass",
        })

    def test_report_validation_rejects_bad_coordinates_and_short_description(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            "/api/reports/",
            {
                "category": "glass",
                "description": "short",
                "latitude": 91,
                "longitude": 181,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("latitude", response.data)
        self.assertIn("longitude", response.data)
        self.assertIn("description", response.data)

    def test_detail_and_delete_are_limited_to_owners_and_pending_reports(self):
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.get(f"/api/reports/{self.other_pending.id}/").status_code, 404)
        self.assertEqual(self.client.delete(f"/api/reports/{self.approved.id}/").status_code, 403)
        deleted = self.client.delete(f"/api/reports/{self.pending.id}/")
        self.assertEqual(deleted.status_code, 204)

    def test_admin_can_moderate_and_must_follow_report_status_transitions(self):
        self.client.force_authenticate(self.owner)
        denied = self.client.get("/api/admin/reports/")
        self.assertEqual(denied.status_code, 403)

        self.client.force_authenticate(self.admin)
        approved = self.client.patch(
            f"/api/admin/reports/{self.pending.id}/",
            {"status": "approved"},
            format="json",
        )
        self.assertEqual(approved.status_code, 200)
        self.assertEqual(approved.data["status"], "approved")
        self.assertEqual(approved.data["reviewed_by"], self.admin.id)

        resolved = self.client.patch(
            f"/api/admin/reports/{self.pending.id}/",
            {"status": "resolved"},
            format="json",
        )
        self.assertEqual(resolved.status_code, 200)
        self.assertEqual(resolved.data["status"], "resolved")

        invalid = self.client.patch(
            f"/api/admin/reports/{self.rejected.id}/",
            {"status": "resolved"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)

    def test_report_list_filters_by_category_and_date(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get("/api/reports/?category=glass&date_from=2020-01-01")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 2)

        invalid = self.client.get("/api/reports/?date_from=not-a-date")
        self.assertEqual(invalid.status_code, 400)