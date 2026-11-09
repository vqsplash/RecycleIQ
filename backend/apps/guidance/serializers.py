from rest_framework import serializers

from apps.guidance.models import GuidanceEntry, WasteCategory


class GuidanceEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = GuidanceEntry
        fields = ("title", "body", "updated_at")
        read_only_fields = ("updated_at",)


class WasteCategorySerializer(serializers.ModelSerializer):
    guidance = serializers.SerializerMethodField()

    class Meta:
        model = WasteCategory
        fields = ("id", "slug", "name", "icon_url", "guidance")

    def get_guidance(self, category):
        entry = category.guidance_entries.first()
        if entry is None:
            return None
        return GuidanceEntrySerializer(entry).data