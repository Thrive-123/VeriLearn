from django.contrib import admin

from .models import Evidence


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "task",
        "user",
        "file",
        "status",
        "completion_percentage",
        "uploaded_at",
    )

    list_filter = (
        "status",
        "uploaded_at",
    )