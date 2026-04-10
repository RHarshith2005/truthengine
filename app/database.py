from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings


# Keep the MongoDB client in module scope for reuse across requests.
client: AsyncIOMotorClient | None = None
# Store a reference to the selected database for easy access.
database: AsyncIOMotorDatabase | None = None


def _ensure_collection_name() -> str:
    return settings.mongodb_predictions_collection


async def connect_to_mongo() -> None:
    """Create a MongoDB client if the service is enabled and available."""
    global client, database

    try:
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=3000,
        )
        database = client[settings.mongodb_db_name]

        # Force a round-trip so connection issues appear early.
        await client.admin.command("ping")

        # Create the predictions collection up front so the service layer can rely on it.
        await ensure_predictions_collection()
    except Exception:
        client = None
        database = None


async def close_mongo_connection() -> None:
    """Close the MongoDB client safely during shutdown."""
    global client, database

    if client is not None:
        client.close()

    client = None
    database = None


def get_database() -> AsyncIOMotorDatabase:
    """Return the active database or raise a clear error."""
    if database is None:
        raise RuntimeError("MongoDB is not connected")

    return database


def get_predictions_collection():
    """Return the predictions collection from the active database."""
    return get_database()[_ensure_collection_name()]


async def ensure_predictions_collection() -> None:
    """Create the predictions collection if it does not exist yet."""
    db = get_database()
    collection_name = _ensure_collection_name()

    if collection_name not in await db.list_collection_names():
        await db.create_collection(collection_name)

    # Keep the most common query path fast for history lookups.
    await db[collection_name].create_index("user_id")
    await db[collection_name].create_index("created_at")
