import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CampaignStatCreate(BaseModel):
    stat_date: date
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    leads: int = Field(default=0, ge=0)
    conversions: int = Field(default=0, ge=0)
    spend: Decimal = Field(default=Decimal("0.00"), ge=0)
    revenue: Decimal = Field(default=Decimal("0.00"), ge=0)


class CampaignStatUpdate(BaseModel):
    stat_date: date | None = None
    impressions: int | None = Field(default=None, ge=0)
    clicks: int | None = Field(default=None, ge=0)
    leads: int | None = Field(default=None, ge=0)
    conversions: int | None = Field(default=None, ge=0)
    spend: Decimal | None = Field(default=None, ge=0)
    revenue: Decimal | None = Field(default=None, ge=0)


class CampaignStatResponse(BaseModel):
    id: uuid.UUID
    campaign_id: uuid.UUID
    stat_date: date
    impressions: int
    clicks: int
    leads: int
    conversions: int
    spend: Decimal
    revenue: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
