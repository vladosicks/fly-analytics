from datetime import date
from decimal import Decimal

from app.core.security import create_access_token
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.models.user import User


async def test_financial_summary_groups_currencies(client, db_session):
    user = User(
        email="financial_summary@test.local",
        password_hash="test_hash",
        full_name="Financial Summary",
    )
    db_session.add(user)
    await db_session.flush()

    campaigns = [
        Campaign(user_id=user.id, name="USD Campaign 1", currency="USD"),
        Campaign(user_id=user.id, name="USD Campaign 2", currency="USD"),
        Campaign(user_id=user.id, name="EUR Campaign", currency="EUR"),
    ]
    db_session.add_all(campaigns)
    await db_session.flush()

    db_session.add_all(
        [
            CampaignStat(
                campaign_id=campaigns[0].id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("100.00"),
                revenue=Decimal("200.00"),
            ),
            CampaignStat(
                campaign_id=campaigns[1].id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("50.00"),
                revenue=Decimal("100.00"),
            ),
            CampaignStat(
                campaign_id=campaigns[2].id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("30.00"),
                revenue=Decimal("60.00"),
            ),
        ]
    )
    await db_session.flush()

    token = create_access_token(user.id)
    response = await client.get(
        "/api/v1/financial-reports/summary/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    usd = next(item for item in data if item["currency"] == "USD")
    eur = next(item for item in data if item["currency"] == "EUR")

    assert usd["campaign_count"] == 2
    assert usd["spend"] == 150
    assert usd["revenue"] == 300
    assert usd["profit"] == 150
    assert usd["roi"] == 100
    assert usd["roas"] == 2

    assert eur["campaign_count"] == 1
    assert eur["spend"] == 30
    assert eur["revenue"] == 60
    assert eur["profit"] == 30


async def test_financial_daily_report_filters_dates_and_currency(client, db_session):
    user = User(
        email="financial_daily@test.local",
        password_hash="test_hash",
        full_name="Financial Daily",
    )
    db_session.add(user)
    await db_session.flush()

    usd_campaign = Campaign(
        user_id=user.id,
        name="USD Campaign",
        currency="USD",
    )
    eur_campaign = Campaign(
        user_id=user.id,
        name="EUR Campaign",
        currency="EUR",
    )
    db_session.add_all([usd_campaign, eur_campaign])
    await db_session.flush()

    db_session.add_all(
        [
            CampaignStat(
                campaign_id=usd_campaign.id,
                stat_date=date(2026, 11, 21),
                spend=Decimal("50.00"),
                revenue=Decimal("100.00"),
            ),
            CampaignStat(
                campaign_id=usd_campaign.id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("100.00"),
                revenue=Decimal("250.00"),
            ),
            CampaignStat(
                campaign_id=eur_campaign.id,
                stat_date=date(2026, 11, 22),
                spend=Decimal("30.00"),
                revenue=Decimal("60.00"),
            ),
        ]
    )
    await db_session.flush()

    token = create_access_token(user.id)
    response = await client.get(
        "/api/v1/financial-reports/daily/",
        params={
            "date_from": "2026-11-22",
            "date_to": "2026-11-22",
            "currency": "USD",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["date"] == "2026-11-22"
    assert data[0]["currency"] == "USD"
    assert data[0]["spend"] == 100
    assert data[0]["revenue"] == 250
    assert data[0]["profit"] == 150


async def test_financial_campaign_report_only_returns_current_users_data(
    client, db_session
):
    user_a = User(
        email="financial_a@test.local",
        password_hash="test_hash",
        full_name="Financial A",
    )
    user_b = User(
        email="financial_b@test.local",
        password_hash="test_hash",
        full_name="Financial B",
    )
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    campaign_a = Campaign(
        user_id=user_a.id,
        name="My Campaign",
        currency="USD",
    )
    campaign_b = Campaign(
        user_id=user_b.id,
        name="Other Campaign",
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
        "/api/v1/financial-reports/campaigns/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert len(data) == 1
    assert data[0]["campaign_name"] == "My Campaign"
    assert data[0]["spend"] == 10
    assert data[0]["revenue"] == 20
    assert data[0]["profit"] == 10


async def test_financial_reports_reject_invalid_date_range(client, db_session):
    user = User(
        email="financial_dates@test.local",
        password_hash="test_hash",
        full_name="Financial Dates",
    )
    db_session.add(user)
    await db_session.flush()

    token = create_access_token(user.id)
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "/api/v1/financial-reports/summary/",
        "/api/v1/financial-reports/daily/",
        "/api/v1/financial-reports/campaigns/",
    ]

    for endpoint in endpoints:
        response = await client.get(
            endpoint,
            params={
                "date_from": "2026-11-23",
                "date_to": "2026-11-22",
            },
            headers=headers,
        )

        assert response.status_code == 422
