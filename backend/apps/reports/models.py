import uuid
from pathlib import Path

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


def report_photo_path(instance, filename):
    extension = Path(filename).suffix.lower()
    return f"reports/{uuid.uuid4()}{extension}"


class WasteReport(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        RESOLVED = "resolved", "Resolved"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="waste_reports",
        on_delete=models.CASCADE,
    )
    category = models.ForeignKey(
        "guidance.WasteCategory",
        related_name="waste_reports",
        on_delete=models.PROTECT,
    )
    description = models.CharField(max_length=500)
    photo = models.ImageField(upload_to=report_photo_path, blank=True, null=True)
    latitude = models.FloatField(
        validators=(MinValueValidator(-90), MaxValueValidator(90))
    )
    longitude = models.FloatField(
        validators=(MinValueValidator(-180), MaxValueValidator(180))
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="reviewed_waste_reports",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=models.Q(latitude__gte=-90, latitude__lte=90),
                name="report_latitude_range",
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=-180, longitude__lte=180),
                name="report_longitude_range",
            ),
        ]

    def __str__(self):
        return f"Report {self.pk}: {self.category.slug} ({self.status})"