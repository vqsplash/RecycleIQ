from django.db import transaction
from rest_framework import mixins, permissions, serializers, viewsets

from apps.guidance.models import GuidanceEntry, WasteCategory
from apps.guidance.serializers import WasteCategorySerializer


class GuidanceUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=200)
    body = serializers.CharField(allow_blank=False)


class GuidanceViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = WasteCategory.objects.prefetch_related("guidance_entries").all()
    serializer_class = WasteCategorySerializer
    lookup_field = "slug"
    pagination_class = None
    http_method_names = ("get", "put", "head", "options")

    def get_permissions(self):
        if self.action == "update":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        category = self.get_object()
        serializer = GuidanceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            entry = category.guidance_entries.first()
            if entry is None:
                entry = GuidanceEntry(category=category)
            entry.title = serializer.validated_data["title"]
            entry.body = serializer.validated_data["body"]
            entry.updated_by = request.user
            entry.save()
        return self.retrieve(request, *args, **kwargs)