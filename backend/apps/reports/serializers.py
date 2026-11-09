from rest_framework import serializers

from apps.guidance.models import WasteCategory
from apps.image_validation import validate_image_file
from apps.reports.models import WasteReport


class ReportUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)


class ReportCategoryField(serializers.RelatedField):
    def to_representation(self, value):
        return {"id": value.id, "slug": value.slug, "name": value.name}

    def to_internal_value(self, data):
        try:
            return WasteCategory.objects.get(slug=data)
        except (WasteCategory.DoesNotExist, TypeError):
            raise serializers.ValidationError("Unknown waste category.")


class WasteReportSerializer(serializers.ModelSerializer):
    user = ReportUserSerializer(read_only=True)
    category = ReportCategoryField(queryset=WasteCategory.objects.all())
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    photo_url = serializers.SerializerMethodField()
    reviewed_by = serializers.PrimaryKeyRelatedField(read_only=True)
    status = serializers.ChoiceField(
        choices=WasteReport.Status.choices, read_only=True
    )

    class Meta:
        model = WasteReport
        fields = (
            "id",
            "user",
            "category",
            "description",
            "photo",
            "photo_url",
            "latitude",
            "longitude",
            "status",
            "reviewed_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "user", "status", "created_at", "updated_at")
        extra_kwargs = {"description": {"min_length": 10, "max_length": 500}}

    def validate_photo(self, photo):
        return validate_image_file(photo)

    def get_photo_url(self, report):
        if not report.photo:
            return None
        url = report.photo.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url


class ReportStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteReport
        fields = ("status",)

    def validate_status(self, value):
        report = self.instance
        if report is None or value == report.status:
            return value

        allowed_transitions = {
            WasteReport.Status.PENDING: {
                WasteReport.Status.APPROVED,
                WasteReport.Status.REJECTED,
            },
            WasteReport.Status.APPROVED: {WasteReport.Status.RESOLVED},
            WasteReport.Status.REJECTED: set(),
            WasteReport.Status.RESOLVED: set(),
        }
        if value not in allowed_transitions[report.status]:
            raise serializers.ValidationError("Invalid report status transition.")
        return value