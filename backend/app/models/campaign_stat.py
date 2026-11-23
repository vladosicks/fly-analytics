import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CampaignStat(Base):
    __tablename__ = "campaign_stats"

    __table_args__ = (
        UniqueConstraint(
            "campaign_id",
            "stat_date",
            name="uq_campaign_stats_campaign_date",
        ),
        Index("ix_campaign_stats_stat_date", "stat_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    campaign_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    stat_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    impressions: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )

    clicks: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )

    leads: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )

    conversions: Mapped[int] = mapped_column(
        BigInteger,
        default=0,
        nullable=False,
    )

    spend: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    revenue: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        default=Decimal("0.00"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
