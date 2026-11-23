import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.schemas.campaign_stat import (
    CampaignStatCreate,
    CampaignStatUpdate,
)


async def create_campaign_stat(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    user_id: uuid.UUID,
    data: CampaignStatCreate,
) -> CampaignStat | None:
    campaign_result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.user_id == user_id,
        )
    )
    campaign = campaign_result.scalar_one_or_none()

    if campaign is None:
        return None

    stat = CampaignStat(
        campaign_id=campaign_id,
        **data.model_dump(),
    )

    db.add(stat)
    await db.commit()
    await db.refresh(stat)

    return stat


async def get_campaign_stats(
    db: AsyncSession,
    campaign_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[CampaignStat] | None:
    campaign_result = await db.execute(
        select(Campaign.id).where(
            Campaign.id == campaign_id,
            Campaign.user_id == user_id,
        )
    )

    if campaign_result.scalar_one_or_none() is None:
        return None

    result = await db.execute(
        select(CampaignStat)
        .where(CampaignStat.campaign_id == campaign_id)
        .order_by(CampaignStat.stat_date.desc())
    )

    return list(result.scalars().all())


async def get_campaign_stat(
    db: AsyncSession,
    stat_id: uuid.UUID,
    campaign_id: uuid.UUID,
    user_id: uuid.UUID,
) -> CampaignStat | None:
    result = await db.execute(
        select(CampaignStat)
        .join(Campaign)
        .where(
            CampaignStat.id == stat_id,
            CampaignStat.campaign_id == campaign_id,
            Campaign.user_id == user_id,
        )
    )

    return result.scalar_one_or_none()


async def update_campaign_stat(
    db: AsyncSession,
    stat: CampaignStat,
    data: CampaignStatUpdate,
) -> CampaignStat:
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(stat, field, value)

    await db.commit()
    await db.refresh(stat)

    return stat


async def delete_campaign_stat(
    db: AsyncSession,
    stat: CampaignStat,
) -> None:
    await db.delete(stat)
    await db.commit()
