from io import BytesIO
import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from apps.classification.models import Prediction, PredictionCorrection
from apps.guidance.models import WasteCategory


def image_upload(name="sample.png"):
    stream = BytesIO()
    Image.new("RGB", (2, 2), color="green").save(stream, format="PNG")
    return SimpleUploadedFile(name, stream.getvalue(), content_type="image/png")


class PredictionApiTests(APITestCase):
    def setUp(self):
        self.temp_media = tempfile.mkdtemp()
        self.enterContext(override_settings(MEDIA_ROOT=self.temp_media))
        self.addCleanup(shutil.rmtree, self.temp_media, ignore_errors=True)
        User = get_user_model()
        self.owner = User.objects.create_user(username="owner", password="Password-42!")
        self.other = User.objects.create_user(username="other", password="Password-42!")
        self.category = WasteCategory.objects.get(slug="plastic")
        self.prediction = Prediction.objects.create(
            user=self.owner,
            image=image_upload(),
            predicted_label="plastic",
            confidence=0.87,
            is_uncertain=False,
            top3_json=[{"label": "plastic", "score": 0.87}],
            category=self.category,
        )

    def test_prediction_detail_is_owner_only_and_has_api_shape(self):
        response = self.client.get(f"/api/classify/{self.prediction.id}/")
        self.assertEqual(response.status_code, 401)

        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(f"/api/classify/{self.prediction.id}/").status_code, 404)

        self.client.force_authenticate(self.owner)
        detail = self.client.get(f"/api/classify/{self.prediction.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["predicted_label"], "plastic")
        self.assertEqual(detail.data["top3"][0]["label"], "plastic")
        self.assertEqual(detail.data["guidance_url"], "/api/guidance/plastic/")

    def test_classification_validates_image_then_reports_unavailable_model(self):
        invalid = self.client.post(
            "/api/classify/", {"image": "not-an-image"}, format="multipart"
        )
        self.assertEqual(invalid.status_code, 400)

        response = self.client.post(
            "/api/classify/", {"image": image_upload()}, format="multipart"
        )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["detail"], "The classification model is not loaded.")

    def test_authenticated_owner_can_submit_valid_correction(self):
        self.client.force_authenticate(self.owner)
        response = self.client.post(
            f"/api/classify/{self.prediction.id}/correct/",
            {"correct_label": "cardboard"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["prediction"], self.prediction.id)
        self.assertEqual(response.data["correct_label"], "cardboard")
        self.assertEqual(PredictionCorrection.objects.count(), 1)

        invalid = self.client.post(
            f"/api/classify/{self.prediction.id}/correct/",
            {"correct_label": "unknown"},
            format="json",
        )
        self.assertEqual(invalid.status_code, 400)