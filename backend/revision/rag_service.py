
import math

from .embedding_service import generate_embedding
from .models import RevisionMemory


def cosine_similarity(vector_a, vector_b):
    if not vector_a or not vector_b:
        return 0.0

    if len(vector_a) != len(vector_b):
        return 0.0

    dot_product = sum(a * b for a, b in zip(vector_a, vector_b))

    magnitude_a = math.sqrt(sum(a * a for a in vector_a))
    magnitude_b = math.sqrt(sum(b * b for b in vector_b))

    if magnitude_a == 0 or magnitude_b == 0:
        return 0.0

    return dot_product / (magnitude_a * magnitude_b)


def search_revision_memories(user, query, limit=5):
    query_vector = generate_embedding(query)

    if not query_vector:
        return []

    memories = RevisionMemory.objects.filter(
        user=user
    ).exclude(embedding=[])

    results = []

    for memory in memories.iterator():
        score = cosine_similarity(
            query_vector,
            memory.embedding,
        )

        results.append({
            "id": memory.id,
            "task_id": memory.task_id,
            "topic": memory.topic,
            "content": memory.content,
            "similarity": round(score, 4),
            "updated_at": memory.updated_at.isoformat(),
        })

    results.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return results[:limit]
