import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.campaign import Campaign
from app.schemas.campaign import CampaignCreate, CampaignUpdate


async def create_campaign(
    db: AsyncSession,
    user_id: uuid.UUID,
    campaign_data: CampaignCreate,
) -> Campaign:
    campaign = Campaign(
        user_id=user_id,
        **campaign_data.model_dump(),
    )

    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    return campaign


async def get_campaigns(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[Campaign]:
    result = await db.execute(
        select(Campaign)
        .where(Campaign.user_id == user_id)
        .order_by(Campaign.created_at.desc())
    )

    return list(result.scalars().all())


async def get_campaign(
    db: AsyncSession,
    user_id: uuid.UUID,
    campaign_id: uuid.UUID,
) -> Campaign | None:
    result = await db.execute(
        select(Campaign).where(
            Campaign.id == campaign_id,
            Campaign.user_id == user_id,
        )
    )

    return result.scalar_one_or_none()


async def update_campaign(
    db: AsyncSession,
    campaign: Campaign,
    campaign_data: CampaignUpdate,
) -> Campaign:
    update_data = campaign_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(campaign, field, value)

    await db.commit()
    await db.refresh(campaign)

    return campaign


async def delete_campaign(
    db: AsyncSession,
    campaign: Campaign,
) -> None:
    await db.delete(campaign)
    await db.commit()
