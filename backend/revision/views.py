
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .rag_service import search_revision_memories


class RevisionSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()

        if not query:
            return Response(
                {"error": "Please provide a search query using ?q=..."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(query) > 500:
            return Response(
                {"error": "Search query must be 500 characters or fewer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            memories = search_revision_memories(
                user=request.user,
                query=query,
                limit=5,
            )

            return Response({
                "query": query,
                "count": len(memories),
                "results": memories,
            })

        except Exception:
            return Response(
                {"error": "Revision search failed. Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
