import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.services.analytics import calculate_analytics

router = APIRouter(
    prefix="/financial-reports",
    tags=["Financial Reports"],
)


def validate_dates(
    date_from: date | None,
    date_to: date | None,
) -> None:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=422,
            detail="date_from cannot be later than date_to",
        )


def build_join_condition(
    date_from: date | None,
    date_to: date | None,
):
    condition = Campaign.id == CampaignStat.campaign_id

    if date_from:
        condition = and_(
            condition,
            CampaignStat.stat_date >= date_from,
        )

    if date_to:
        condition = and_(
            condition,
            CampaignStat.stat_date <= date_to,
        )

    return condition


def build_metrics(row):
    return calculate_analytics(
        impressions=int(row.impressions or 0),
        clicks=int(row.clicks or 0),
        leads=int(row.leads or 0),
        conversions=int(row.conversions or 0),
        spend=row.spend,
        revenue=row.revenue,
    )


def build_filters(user_id, currency):
    filters = [Campaign.user_id == user_id]

    if currency:
        filters.append(Campaign.currency == currency.upper())

    return filters


@router.get("/summary/")
async def get_financial_summary(
    date_from: date | None = None,
    date_to: date | None = None,
    currency: str | None = None,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    validate_dates(date_from, date_to)

    query = (
        select(
            Campaign.currency.label("currency"),
            func.count(func.distinct(Campaign.id)).label("campaign_count"),
            func.coalesce(func.sum(CampaignStat.impressions), 0).label("impressions"),
            func.coalesce(func.sum(CampaignStat.clicks), 0).label("clicks"),
            func.coalesce(func.sum(CampaignStat.leads), 0).label("leads"),
            func.coalesce(func.sum(CampaignStat.conversions), 0).label("conversions"),
            func.coalesce(func.sum(CampaignStat.spend), 0).label("spend"),
            func.coalesce(func.sum(CampaignStat.revenue), 0).label("revenue"),
        )
        .outerjoin(
            CampaignStat,
            build_join_condition(date_from, date_to),
        )
        .where(*build_filters(user_id, currency))
        .group_by(Campaign.currency)
        .order_by(Campaign.currency)
    )

    result = await db.execute(query)
    data = []

    for row in result.all():
        data.append(
            {
                "currency": row.currency,
                "campaign_count": row.campaign_count,
                **build_metrics(row),
            }
        )

    return {
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None,
        "data": data,
    }


@router.get("/daily/")
async def get_daily_financial_report(
    date_from: date | None = None,
    date_to: date | None = None,
    currency: str | None = None,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    validate_dates(date_from, date_to)

    query = (
        select(
            CampaignStat.stat_date.label("date"),
            Campaign.currency.label("currency"),
            func.coalesce(func.sum(CampaignStat.spend), 0).label("spend"),
            func.coalesce(func.sum(CampaignStat.revenue), 0).label("revenue"),
        )
        .join(
            Campaign,
            Campaign.id == CampaignStat.campaign_id,
        )
        .where(
            *build_filters(user_id, currency),
            *([CampaignStat.stat_date >= date_from] if date_from else []),
            *([CampaignStat.stat_date <= date_to] if date_to else []),
        )
        .group_by(CampaignStat.stat_date, Campaign.currency)
        .order_by(CampaignStat.stat_date, Campaign.currency)
    )

    result = await db.execute(query)
    data = []

    for row in result.all():
        metrics = calculate_analytics(
            spend=row.spend,
            revenue=row.revenue,
        )

        data.append(
            {
                "date": row.date.isoformat(),
                "currency": row.currency,
                "spend": metrics["spend"],
                "revenue": metrics["revenue"],
                "profit": metrics["profit"],
            }
        )

    return {
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None,
        "data": data,
    }


@router.get("/campaigns/")
async def get_campaign_financial_report(
    date_from: date | None = None,
    date_to: date | None = None,
    currency: str | None = None,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    validate_dates(date_from, date_to)

    query = (
        select(
            Campaign.id.label("campaign_id"),
            Campaign.name.label("campaign_name"),
            Campaign.traffic_source.label("traffic_source"),
            Campaign.offer_name.label("offer_name"),
            Campaign.geo.label("geo"),
            Campaign.status.label("status"),
            Campaign.currency.label("currency"),
            func.coalesce(func.sum(CampaignStat.impressions), 0).label("impressions"),
            func.coalesce(func.sum(CampaignStat.clicks), 0).label("clicks"),
            func.coalesce(func.sum(CampaignStat.leads), 0).label("leads"),
            func.coalesce(func.sum(CampaignStat.conversions), 0).label("conversions"),
            func.coalesce(func.sum(CampaignStat.spend), 0).label("spend"),
            func.coalesce(func.sum(CampaignStat.revenue), 0).label("revenue"),
        )
        .outerjoin(
            CampaignStat,
            build_join_condition(date_from, date_to),
        )
        .where(*build_filters(user_id, currency))
        .group_by(
            Campaign.id,
            Campaign.name,
            Campaign.traffic_source,
            Campaign.offer_name,
            Campaign.geo,
            Campaign.status,
            Campaign.currency,
        )
        .order_by(Campaign.name)
    )

    result = await db.execute(query)
    data = []

    for row in result.all():
        data.append(
            {
                "campaign_id": str(row.campaign_id),
                "campaign_name": row.campaign_name,
                "traffic_source": row.traffic_source,
                "offer_name": row.offer_name,
                "geo": row.geo,
                "status": row.status,
                "currency": row.currency,
                **build_metrics(row),
            }
        )

    return {
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None,
        "data": data,
    }
