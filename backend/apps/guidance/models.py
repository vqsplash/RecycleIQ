from django.conf import settings
from django.db import models


class WasteCategory(models.Model):
    slug = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    icon_url = models.URLField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "waste categories"

    def __str__(self):
        return self.name


class GuidanceEntry(models.Model):
    category = models.ForeignKey(
        WasteCategory, related_name="guidance_entries", on_delete=models.CASCADE
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="updated_guidance_entries",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        ordering = ("-updated_at",)

    def __str__(self):
        return f"{self.category.name}: {self.title}"