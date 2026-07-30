from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class AnalyticsBase(BaseModel):
    metric_key: str
    metric_value: float
    group_name: Optional[str] = None
    recorded_date: Optional[date] = None

class AnalyticsResponse(AnalyticsBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
