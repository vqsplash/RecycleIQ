from django.contrib import admin

from apps.classification.models import Prediction, PredictionCorrection


class PredictionCorrectionInline(admin.TabularInline):
    model = PredictionCorrection
    extra = 0
    readonly_fields = ("user", "correct_label", "created_at")


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "predicted_label", "confidence", "is_uncertain", "user", "created_at")
    list_filter = ("predicted_label", "is_uncertain", "created_at")
    readonly_fields = ("created_at",)
    inlines = (PredictionCorrectionInline,)