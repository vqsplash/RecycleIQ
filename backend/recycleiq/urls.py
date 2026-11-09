from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.classification.views import PredictionViewSet
from apps.guidance.views import GuidanceViewSet
from apps.reports.views import AdminWasteReportViewSet, WasteReportViewSet
from recycleiq.health import health_check


router = DefaultRouter()
router.register("classify", PredictionViewSet, basename="prediction")
router.register("guidance", GuidanceViewSet, basename="guidance")
router.register("reports", WasteReportViewSet, basename="report")
router.register("admin/reports", AdminWasteReportViewSet, basename="admin-report")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)