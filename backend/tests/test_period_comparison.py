from datetime import date
from decimal import Decimal

from app.core.security import create_access_token
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.models.user import User


async def test_period_comparison_calculates_changes_and_separates_currencies(
    client, db_session
):
    user = User(
        email="comparison@test.local",
        password_hash="test_hash",
        full_name="Comparison User",
    )
    db_session.add(user)
    await db_session.flush()

    usd_campaign = Campaign(
        user_id=user.id,
        name="USD Campaign",
        geo="Mexico",
        currency="USD",
    )
    eur_campaign = Campaign(
        user_id=user.id,
        name="EUR Campaign",
        geo="Spain",
        currency="EUR",
    )
    db_session.add_all([usd_campaign, eur_campaign])
    await db_session.flush()

    db_session.add_all(
        [
            CampaignStat(
                campaign_id=usd_campaign.id,
                stat_date=date(2026, 11, 21),
                impressions=1000,
                clicks=100,
                leads=10,
                conversions=5,
                spend=Decimal("100.00"),
                revenue=Decimal("150.00"),
            ),
            CampaignStat(
                campaign_id=usd_campaign.id,
                stat_date=date(2026, 11, 23),
                impressions=2000,
                clicks=200,
                leads=20,
                conversions=10,
                spend=Decimal("150.00"),
                revenue=Decimal("300.00"),
            ),
            CampaignStat(
                campaign_id=eur_campaign.id,
                stat_date=date(2026, 11, 23),
                impressions=500,
                clicks=50,
                leads=5,
                conversions=2,
                spend=Decimal("30.00"),
                revenue=Decimal("60.00"),
            ),
        ]
    )
    await db_session.flush()

    token = create_access_token(user.id)

    response = await client.get(
        "/api/v1/analytics/period-comparison/",
        params={
            "date_from": "2026-11-23",
            "date_to": "2026-11-24",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    result = response.json()

    assert result["previous_date_from"] == "2026-11-21"
    assert result["previous_date_to"] == "2026-11-22"

    usd = next(item for item in result["data"] if item["currency"] == "USD")
    eur = next(item for item in result["data"] if item["currency"] == "EUR")

    assert usd["current"]["spend"] == 150
    assert usd["previous"]["spend"] == 100
    assert usd["current"]["revenue"] == 300
    assert usd["previous"]["revenue"] == 150
    assert usd["current"]["profit"] == 150
    assert usd["previous"]["profit"] == 50

    assert usd["changes"]["spend"]["delta"] == 50
    assert usd["changes"]["spend"]["change_percent"] == 50
    assert usd["changes"]["revenue"]["change_percent"] == 100

    assert usd["current"]["roi"] == 100
    assert usd["previous"]["roi"] == 50

    assert usd["current"]["roas"] == 2
    assert usd["previous"]["roas"] == 1.5

    assert eur["current"]["spend"] == 30
    assert eur["previous"]["spend"] == 0
    assert eur["changes"]["spend"]["change_percent"] is None


async def test_period_comparison_only_returns_current_users_data(
    client, db_session
):
    user_a = User(
        email="comparison_a@test.local",
        password_hash="test_hash",
        full_name="Comparison A",
    )
    user_b = User(
        email="comparison_b@test.local",
        password_hash="test_hash",
        full_name="Comparison B",
    )
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    campaign_a = Campaign(
        user_id=user_a.id,
        name="A Campaign",
        geo="Mexico",
        currency="USD",
    )
    campaign_b = Campaign(
        user_id=user_b.id,
        name="B Campaign",
        geo="Brazil",
        currency="USD",
    )
    db_session.add_all([campaign_a, campaign_b])
    await db_session.flush()

    db_session.add_all(
        [
            CampaignStat(
                campaign_id=campaign_a.id,
                stat_date=date(2026, 11, 23),
                spend=Decimal("10.00"),
                revenue=Decimal("20.00"),
            ),
            CampaignStat(
                campaign_id=campaign_b.id,
                stat_date=date(2026, 11, 23),
                spend=Decimal("500.00"),
                revenue=Decimal("1000.00"),
            ),
        ]
    )
    await db_session.flush()

    token = create_access_token(user_a.id)

    response = await client.get(
        "/api/v1/analytics/period-comparison/",
        params={
            "date_from": "2026-11-23",
            "date_to": "2026-11-23",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["currency"] == "USD"
    assert data[0]["current"]["spend"] == 10
    assert data[0]["current"]["revenue"] == 20


async def test_period_comparison_rejects_invalid_date_range(
    client, db_session
):
    user = User(
        email="comparison_dates@test.local",
        password_hash="test_hash",
        full_name="Comparison Dates",
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id)

    response = await client.get(
        "/api/v1/analytics/period-comparison/",
        params={
            "date_from": "2026-11-24",
            "date_to": "2026-11-23",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 422
