import uuid
from pathlib import Path

from django.conf import settings
from django.db import models


def prediction_image_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"predictions/{uuid.uuid4()}{extension}"


class Prediction(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="predictions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    image = models.ImageField(upload_to=prediction_image_path)
    predicted_label = models.CharField(max_length=50)
    confidence = models.FloatField()
    is_uncertain = models.BooleanField(default=False)
    top3_json = models.JSONField(default=list, blank=True)
    category = models.ForeignKey(
        "guidance.WasteCategory",
        related_name="predictions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.predicted_label} ({self.confidence:.0%})"


class PredictionCorrection(models.Model):
    prediction = models.ForeignKey(
        Prediction, related_name="corrections", on_delete=models.CASCADE
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="prediction_corrections",
        on_delete=models.CASCADE,
    )
    correct_label = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Prediction {self.prediction_id} corrected to {self.correct_label}"