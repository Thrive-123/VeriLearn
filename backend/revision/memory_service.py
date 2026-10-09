
from .embedding_service import generate_embedding
from .models import RevisionMemory


def save_revision_memory(user, task, topic, content):
    topic = topic.strip()
    content = content.strip()

    if not topic or not content:
        return None

    embedding = generate_embedding(
        f"Topic: {topic}\nLearning feedback: {content}"
    )

    memory, created = RevisionMemory.objects.update_or_create(
        user=user,
        task=task,
        topic=topic,
        defaults={
            "content": content,
            "embedding": embedding,
        },
    )

    return memory
