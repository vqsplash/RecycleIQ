from django.contrib import admin

from apps.reports.models import WasteReport


@admin.register(WasteReport)
class WasteReportAdmin(admin.ModelAdmin):
    list_display = ("id", "category", "status", "user", "created_at", "reviewed_by")
    list_filter = ("status", "category", "created_at")
    search_fields = ("description", "user__username")
    readonly_fields = ("created_at", "updated_at", "reviewed_by")