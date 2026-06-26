from pydantic import BaseModel, Field
from datetime import datetime, UTC

class StatisticGet:
    start_timestamp: int = 0
    end_timestamp: int = datetime.now(UTC)