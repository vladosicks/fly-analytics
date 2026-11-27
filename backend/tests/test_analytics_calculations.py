from decimal import Decimal

from app.services.analytics import calculate_analytics


def test_calculates_all_metrics_correctly():
    result = calculate_analytics(
        impressions=10000,
        clicks=500,
        leads=25,
        conversions=50,
        spend=100,
        revenue=250,
    )

    assert result["profit"] == Decimal("150.00")
    assert result["roi"] == Decimal("150.00")
    assert result["roas"] == Decimal("2.5000")
    assert result["ctr"] == Decimal("5.00")
    assert result["cpm"] == Decimal("10.00")
    assert result["cpc"] == Decimal("0.2000")
    assert result["cpl"] == Decimal("4.00")
    assert result["cpa"] == Decimal("2.00")
    assert result["cr"] == Decimal("10.00")
    assert result["epc"] == Decimal("0.5000")


def test_handles_zero_denominators():
    result = calculate_analytics(
        impressions=0,
        clicks=0,
        leads=0,
        conversions=0,
        spend=0,
        revenue=0,
    )

    assert result["profit"] == Decimal("0.00")
    assert result["roi"] is None
    assert result["roas"] is None
    assert result["ctr"] is None
    assert result["cpm"] is None
    assert result["cpc"] is None
    assert result["cpl"] is None
    assert result["cpa"] is None
    assert result["cr"] is None
    assert result["epc"] is None


def test_handles_negative_profit():
    result = calculate_analytics(
        impressions=1000,
        clicks=100,
        leads=10,
        conversions=5,
        spend=100,
        revenue=50,
    )

    assert result["profit"] == Decimal("-50.00")
    assert result["roi"] == Decimal("-50.00")
    assert result["roas"] == Decimal("0.5000")
