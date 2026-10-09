from django.urls import path

from .views import (
    EvidenceCreateView,
    EvidenceHistoryView,
)


urlpatterns = [

    path(
        "",
        EvidenceCreateView.as_view(),
        name="evidence-create"
    ),

    path(
        "task/<int:task_id>/",
        EvidenceHistoryView.as_view(),
        name="evidence-history"
    ),
]