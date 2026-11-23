from datetime import date
from decimal import Decimal
import pytest_asyncio

from app.core.security import create_access_token
from app.models.campaign import Campaign
from app.models.campaign_stat import CampaignStat
from app.models.user import User


@pytest_asyncio.fixture
async def tenant_data(db_session):
    user_a = User(
        email="tenant_a@test.local",
        password_hash="test_hash_a",
        full_name="Tenant A",
    )
    user_b = User(
        email="tenant_b@test.local",
        password_hash="test_hash_b",
        full_name="Tenant B",
    )

    db_session.add_all([user_a, user_b])
    await db_session.flush()

    campaign_a = Campaign(
        user_id=user_a.id,
        name="Campaign A",
    )
    campaign_b = Campaign(
        user_id=user_b.id,
        name="Campaign B",
    )

    db_session.add_all([campaign_a, campaign_b])
    await db_session.flush()

    stat_a = CampaignStat(
        campaign_id=campaign_a.id,
        stat_date=date(2026, 11, 22),
        impressions=1000,
        clicks=100,
        leads=10,
        conversions=2,
        spend=Decimal("50.00"),
        revenue=Decimal("100.00"),
    )
    db_session.add(stat_a)
    await db_session.flush()

    return {
        "user_a": user_a,
        "user_b": user_b,
        "campaign_a": campaign_a,
        "campaign_b": campaign_b,
        "stat_a": stat_a,
        "token_a": create_access_token(user_a.id),
        "token_b": create_access_token(user_b.id),
    }


async def test_users_only_see_their_own_campaigns(client, tenant_data):
    response_a = await client.get(
        "/api/v1/campaigns/",
        headers={"Authorization": f"Bearer {tenant_data['token_a']}"},
    )
    response_b = await client.get(
        "/api/v1/campaigns/",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
    )

    assert response_a.status_code == 200
    assert response_b.status_code == 200

    campaigns_a = response_a.json()
    campaigns_b = response_b.json()

    assert len(campaigns_a) == 1
    assert len(campaigns_b) == 1

    assert campaigns_a[0]["name"] == "Campaign A"
    assert campaigns_b[0]["name"] == "Campaign B"


async def test_user_cannot_get_another_users_campaign(client, tenant_data):
    response = await client.get(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


async def test_user_cannot_update_another_users_campaign(client, tenant_data):
    response = await client.patch(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
        json={"name": "Hacked Campaign"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"


async def test_user_cannot_delete_another_users_campaign(client, tenant_data, db_session):
    response = await client.delete(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found"

    campaign = await db_session.get(Campaign, tenant_data['campaign_a'].id)
    assert campaign is not None
    assert campaign.name == "Campaign A"


async def test_user_cannot_create_stats_for_another_users_campaign(
    client, tenant_data
):
    response = await client.post(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}/stats/",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
        json={
            "stat_date": "2026-11-23",
            "impressions": 1000,
            "clicks": 100,
            "leads": 10,
            "conversions": 2,
            "spend": "50.00",
            "revenue": "100.00",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found."



async def test_user_cannot_list_stats_for_another_users_campaign(client, tenant_data):
    response = await client.get(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}/stats/",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign not found."



async def test_user_cannot_get_another_users_stat(client, tenant_data):
    response = await client.get(
        f"/api/v1/campaigns/{tenant_data['campaign_a'].id}/stats/{tenant_data['stat_a'].id}",
        headers={"Authorization": f"Bearer {tenant_data['token_b']}"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Campaign statistics not found."
