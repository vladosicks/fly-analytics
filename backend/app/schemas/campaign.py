import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    traffic_source: str | None = Field(default=None, max_length=50)
    offer_name: str | None = Field(default=None, max_length=150)
    geo: str | None = Field(default=None, max_length=100)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    status: str = Field(default="draft", max_length=20)
    start_date: date | None = None


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    traffic_source: str | None = Field(default=None, max_length=50)
    offer_name: str | None = Field(default=None, max_length=150)
    geo: str | None = Field(default=None, max_length=100)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    status: str | None = Field(default=None, max_length=20)
    start_date: date | None = None


class CampaignResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    traffic_source: str | None
    offer_name: str | None
    geo: str | None
    currency: str
    status: str
    start_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
