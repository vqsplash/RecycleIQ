from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework import mixins, permissions, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from apps.reports.models import WasteReport
from apps.reports.serializers import ReportStatusSerializer, WasteReportSerializer


class ReportPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class WasteReportViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = WasteReportSerializer
    pagination_class = ReportPagination

    def get_permissions(self):
        if self.action == "list":
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            queryset = WasteReport.objects.select_related("user", "category")
        elif user.is_authenticated:
            queryset = WasteReport.objects.select_related("user", "category").filter(
                Q(status=WasteReport.Status.APPROVED) | Q(user=user)
            )
        else:
            queryset = WasteReport.objects.select_related("user", "category").filter(
                status=WasteReport.Status.APPROVED
            )

        status_filter = self.request.query_params.get("status")
        if status_filter:
            valid_statuses = WasteReport.Status.values
            if status_filter not in valid_statuses:
                raise ValidationError({"status": "Invalid report status."})
            queryset = queryset.filter(status=status_filter)

        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)

        for parameter, lookup in (("date_from", "created_at__date__gte"), ("date_to", "created_at__date__lte")):
            raw_date = self.request.query_params.get(parameter)
            if raw_date:
                parsed_date = parse_date(raw_date)
                if parsed_date is None:
                    raise ValidationError({parameter: "Use an ISO 8601 date (YYYY-MM-DD)."})
                queryset = queryset.filter(**{lookup: parsed_date})

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id or instance.status != WasteReport.Status.PENDING:
            raise PermissionDenied("Only your own pending reports can be deleted.")
        instance.delete()


class AdminWasteReportViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = WasteReport.objects.select_related("user", "category")
    serializer_class = WasteReportSerializer
    pagination_class = ReportPagination
    permission_classes = (permissions.IsAdminUser,)

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return ReportStatusSerializer
        return WasteReportSerializer

    def perform_update(self, serializer):
        serializer.save(reviewed_by=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        response = super().partial_update(request, *args, **kwargs)
        report = self.get_object()
        return Response(WasteReportSerializer(report, context=self.get_serializer_context()).data)