
from django.urls import path
from .views import RevisionSearchView

urlpatterns = [
    path("search/", RevisionSearchView.as_view(), name="revision-search"),
]
