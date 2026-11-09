from rest_framework import serializers

from apps.classification.models import Prediction, PredictionCorrection
from apps.guidance.models import WasteCategory
from apps.image_validation import validate_image_file


class PredictionSerializer(serializers.ModelSerializer):
    top3 = serializers.JSONField(source="top3_json", read_only=True)
    guidance_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Prediction
        fields = (
            "id",
            "predicted_label",
            "confidence",
            "is_uncertain",
            "top3",
            "guidance_url",
            "image_url",
            "created_at",
        )

    def get_guidance_url(self, prediction):
        if not prediction.category_id:
            return None
        return f"/api/guidance/{prediction.category.slug}/"

    def get_image_url(self, prediction):
        if not prediction.image:
            return None
        url = prediction.image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


class ClassifyUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()

    def validate_image(self, image):
        return validate_image_file(image)


class PredictionCorrectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionCorrection
        fields = ("id", "prediction", "correct_label", "created_at")
        read_only_fields = ("id", "prediction", "created_at")

    def validate_correct_label(self, value):
        if not WasteCategory.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Unknown waste category.")
        return value