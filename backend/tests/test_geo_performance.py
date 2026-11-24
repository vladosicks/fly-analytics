from datetime import date
from decimal import Decimal

from app.core.security import create_access_token
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.models.user import User


async def test_geo_performance_groups_campaigns_and_separates_currencies(
    client, db_session
):
    user = User(
        email="geo_user@test.local",
        password_hash="test_hash",
        full_name="GEO User",
    )
    db_session.add(user)
    await db_session.flush()

    campaigns = [
        Campaign(user_id=user.id, name="Mexico USD 1", geo="Mexico", currency="USD"),
        Campaign(user_id=user.id, name="Mexico USD 2", geo="Mexico", currency="USD"),
        Campaign(user_id=user.id, name="Mexico EUR", geo="Mexico", currency="EUR"),
        Campaign(user_id=user.id, name="Unknown GEO", geo=None, currency="USD"),
    ]
    db_session.add_all(campaigns)
    await db_session.flush()

    stats = [
        CampaignStat(
            campaign_id=campaigns[0].id,
            stat_date=date(2026, 11, 22),
            impressions=1000,
            clicks=100,
            leads=10,
            conversions=2,
            spend=Decimal("50.00"),
            revenue=Decimal("100.00"),
        ),
        CampaignStat(
            campaign_id=campaigns[1].id,
            stat_date=date(2026, 11, 22),
            impressions=2000,
            clicks=200,
            leads=20,
            conversions=4,
            spend=Decimal("100.00"),
            revenue=Decimal("200.00"),
        ),
        CampaignStat(
            campaign_id=campaigns[2].id,
            stat_date=date(2026, 11, 22),
            spend=Decimal("30.00"),
            revenue=Decimal("60.00"),
        ),
    ]
    db_session.add_all(stats)
    await db_session.flush()

    token = create_access_token(user.id)
    response = await client.get(
        "/api/v1/analytics/geo-performance/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    mexico_usd = next(
        item for item in data if item["geo"] == "Mexico" and item["currency"] == "USD"
    )
    mexico_eur = next(
        item for item in data if item["geo"] == "Mexico" and item["currency"] == "EUR"
    )
    unknown = next(item for item in data if item["geo"] == "Unknown")

    assert mexico_usd["campaign_count"] == 2
    assert mexico_usd["impressions"] == 3000
    assert mexico_usd["clicks"] == 300
    assert mexico_usd["spend"] == 150
    assert mexico_usd["revenue"] == 300
    assert mexico_usd["profit"] == 150

    assert mexico_eur["campaign_count"] == 1
    assert mexico_eur["spend"] == 30
    assert mexico_eur["revenue"] == 60

    assert unknown["campaign_count"] == 1
    assert unknown["spend"] == 0
    assert unknown["revenue"] == 0


async def test_geo_performance_only_returns_current_users_data(client, db_session):
    user_a = User(
        email="geo_a@test.local",
        password_hash="test_hash",
        full_name="GEO A",
    )
    user_b = User(
        email="geo_b@test.local",
        password_hash="test_hash",
        full_name="GEO B",
    )
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    campaign_a = Campaign(
        user_id=user_a.id,
        name="My Campaign",
        geo="Mexico",
        currency="USD",
    )
    campaign_b = Campaign(
        user_id=user_b.id,
        name="Other Campaign",
        geo="Brazil",
        currency="USD",
    )
    db_session.add_all([campaign_a, campaign_b])
    await db_session.flush()

    db_session.add_all(
        [
            CampaignStat(
                campaign_id=campaign_a.id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("10.00"),
                revenue=Decimal("20.00"),
            ),
            CampaignStat(
                campaign_id=campaign_b.id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("500.00"),
                revenue=Decimal("1000.00"),
            ),
        ]
    )
    await db_session.flush()

    token = create_access_token(user_a.id)
    response = await client.get(
        "/api/v1/analytics/geo-performance/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["geo"] == "Mexico"
    assert data[0]["spend"] == 10
    assert data[0]["revenue"] == 20


async def test_geo_performance_rejects_invalid_date_range(client, db_session):
    user = User(
        email="geo_dates@test.local",
        password_hash="test_hash",
        full_name="GEO Dates",
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id)
    response = await client.get(
        "/api/v1/analytics/geo-performance/",
        params={
            "date_from": "2026-11-23",
            "date_to": "2026-11-22",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
