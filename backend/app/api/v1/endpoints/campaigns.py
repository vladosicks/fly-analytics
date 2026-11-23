import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.schemas.campaign import (
    CampaignCreate,
    CampaignResponse,
    CampaignUpdate,
)
from app.services.campaign import (
    create_campaign,
    delete_campaign,
    get_campaign,
    get_campaigns,
    update_campaign,
)

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


@router.post(
    "/",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign_endpoint(
    campaign_data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await create_campaign(db, user_id, campaign_data)


@router.get("/", response_model=list[CampaignResponse])
async def get_campaigns_endpoint(
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    return await get_campaigns(db, user_id)


@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign_endpoint(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    campaign = await get_campaign(db, user_id, campaign_id)

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    return campaign


@router.patch("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign_endpoint(
    campaign_id: uuid.UUID,
    campaign_data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    campaign = await get_campaign(db, user_id, campaign_id)

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    return await update_campaign(db, campaign, campaign_data)


@router.delete(
    "/{campaign_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_campaign_endpoint(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    campaign = await get_campaign(db, user_id, campaign_id)

    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found",
        )

    await delete_campaign(db, campaign)
