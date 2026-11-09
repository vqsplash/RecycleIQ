from django.contrib import admin

from apps.guidance.models import GuidanceEntry, WasteCategory


class GuidanceEntryInline(admin.TabularInline):
    model = GuidanceEntry
    extra = 0


@admin.register(WasteCategory)
class WasteCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (GuidanceEntryInline,)


@admin.register(GuidanceEntry)
class GuidanceEntryAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "updated_at", "updated_by")
    list_filter = ("category",)
    search_fields = ("title", "body", "category__name")