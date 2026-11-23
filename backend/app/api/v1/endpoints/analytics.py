
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.services.analytics import calculate_analytics


router = APIRouter(
    prefix="/campaigns/{campaign_id}/analytics",
    tags=["Analytics"],
)

dashboard_router = APIRouter(
    prefix="/analytics",
    tags=["Dashboard Analytics"],
)




@router.get("/")
async def get_campaign_analytics(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    campaign_query = select(Campaign.id).where(
        Campaign.id == campaign_id,
        Campaign.user_id == user_id,
    )

    campaign = await db.scalar(campaign_query)

    if campaign is None:
        raise HTTPException(
            status_code=404,
            detail="Campaign not found",
        )

    stats_query = select(
        func.coalesce(func.sum(CampaignStat.impressions), 0),
        func.coalesce(func.sum(CampaignStat.clicks), 0),
        func.coalesce(func.sum(CampaignStat.leads), 0),
        func.coalesce(func.sum(CampaignStat.conversions), 0),
        func.coalesce(func.sum(CampaignStat.spend), 0),
        func.coalesce(func.sum(CampaignStat.revenue), 0),
    ).where(
        CampaignStat.campaign_id == campaign_id
    )

    result = await db.execute(stats_query)
    row = result.one()

    analytics = calculate_analytics(
        impressions=int(row[0]),
        clicks=int(row[1]),
        leads=int(row[2]),
        conversions=int(row[3]),
        spend=row[4],
        revenue=row[5],
    )

    return {
        "campaign_id": str(campaign_id),
        "metrics": analytics,
    }

@dashboard_router.get("/profit-over-time/")
async def get_profit_over_time(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    start_date = date.today() - timedelta(days=29)

    query = (
        select(
            CampaignStat.stat_date,
            func.coalesce(func.sum(CampaignStat.spend), 0).label("spend"),
            func.coalesce(func.sum(CampaignStat.revenue), 0).label("revenue"),
        )
        .join(Campaign, Campaign.id == CampaignStat.campaign_id)
        .where(
            Campaign.user_id == user_id,
            CampaignStat.stat_date >= start_date,
        )
        .group_by(CampaignStat.stat_date)
        .order_by(CampaignStat.stat_date)
    )

    result = await db.execute(query)

    data = []

    for row in result.all():
        spend = row.spend
        revenue = row.revenue

        data.append({
            "date": row.stat_date.isoformat(),
            "spend": spend,
            "revenue": revenue,
            "profit": revenue - spend,
        })

    return {"data": data}
