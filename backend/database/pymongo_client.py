import os
from datetime import timezone, timedelta
from pymongo import MongoClient

KST = timezone(timedelta(hours=9))
MONGO_HOST = os.getenv("MONGO_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGO_PORT", 27017))
_client = MongoClient(MONGO_HOST, MONGO_PORT, tz_aware=True, tzinfo=KST)