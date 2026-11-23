import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.schemas.campaign_stat import (
    CampaignStatCreate,
    CampaignStatResponse,
    CampaignStatUpdate,
)
from app.services.campaign_stat import (
    create_campaign_stat,
    delete_campaign_stat,
    get_campaign_stat,
    get_campaign_stats,
    update_campaign_stat,
)

router = APIRouter(prefix="/campaigns/{campaign_id}/stats", tags=["Campaign Stats"])


@router.post(
    "/",
    response_model=CampaignStatResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_stat(
    campaign_id: uuid.UUID,
    data: CampaignStatCreate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    try:
        stat = await create_campaign_stat(db, campaign_id, user_id, data)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Statistics for this date already exist.",
        )

    if stat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    return stat


@router.get("/", response_model=list[CampaignStatResponse])
async def read_stats(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stats = await get_campaign_stats(db, campaign_id, user_id)

    if stats is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found.",
        )

    return stats


@router.get("/{stat_id}", response_model=CampaignStatResponse)
async def read_stat(
    campaign_id: uuid.UUID,
    stat_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stat = await get_campaign_stat(db, stat_id, campaign_id, user_id)

    if stat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign statistics not found.",
        )

    return stat


@router.patch("/{stat_id}", response_model=CampaignStatResponse)
async def update_stat(
    campaign_id: uuid.UUID,
    stat_id: uuid.UUID,
    data: CampaignStatUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stat = await get_campaign_stat(db, stat_id, campaign_id, user_id)

    if stat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign statistics not found.",
        )

    try:
        return await update_campaign_stat(db, stat, data)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Statistics for this date already exist.",
        )


@router.delete("/{stat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_stat(
    campaign_id: uuid.UUID,
    stat_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: uuid.UUID = Depends(get_current_user_id),
):
    stat = await get_campaign_stat(db, stat_id, campaign_id, user_id)

    if stat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign statistics not found.",
        )

    await delete_campaign_stat(db, stat)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
