
from decimal import Decimal, ROUND_HALF_UP
from typing import Any


ZERO = Decimal("0")
HUNDRED = Decimal("100")
THOUSAND = Decimal("1000")
TWO_PLACES = Decimal("0.01")
FOUR_PLACES = Decimal("0.0001")


def decimal_value(value: Any) -> Decimal:
    """Safely convert numeric values to Decimal."""
    if value is None:
        return ZERO
    return Decimal(str(value))


def safe_divide(
    numerator: Decimal,
    denominator: Decimal,
) -> Decimal | None:
    """Return None when division by zero would occur."""
    if denominator == ZERO:
        return None
    return numerator / denominator


def round_value(
    value: Decimal | None,
    places: Decimal = TWO_PLACES,
) -> Decimal | None:
    """Round a Decimal value using half-up rounding."""
    if value is None:
        return None
    return value.quantize(places, rounding=ROUND_HALF_UP)


def calculate_analytics(
    *,
    impressions: int = 0,
    clicks: int = 0,
    leads: int = 0,
    conversions: int = 0,
    spend: Any = ZERO,
    revenue: Any = ZERO,
) -> dict[str, Decimal | int | None]:
    """Calculate performance metrics from aggregated campaign data."""

    spend_value = decimal_value(spend)
    revenue_value = decimal_value(revenue)

    profit = revenue_value - spend_value

    roi = safe_divide(profit, spend_value)
    roas = safe_divide(revenue_value, spend_value)
    ctr = safe_divide(Decimal(clicks) * HUNDRED, Decimal(impressions))
    cpm = safe_divide(spend_value * THOUSAND, Decimal(impressions))
    cpc = safe_divide(spend_value, Decimal(clicks))
    cpl = safe_divide(spend_value, Decimal(leads))
    cpa = safe_divide(spend_value, Decimal(conversions))
    conversion_rate = safe_divide(
        Decimal(conversions) * HUNDRED,
        Decimal(clicks),
    )
    epc = safe_divide(revenue_value, Decimal(clicks))

    return {
        "impressions": impressions,
        "clicks": clicks,
        "leads": leads,
        "conversions": conversions,
        "spend": round_value(spend_value),
        "revenue": round_value(revenue_value),
        "profit": round_value(profit),
        "roi": round_value(roi * HUNDRED if roi is not None else None),
        "roas": round_value(roas, FOUR_PLACES),
        "ctr": round_value(ctr),
        "cpm": round_value(cpm),
        "cpc": round_value(cpc, FOUR_PLACES),
        "cpl": round_value(cpl),
        "cpa": round_value(cpa),
        "cr": round_value(conversion_rate),
        "epc": round_value(epc, FOUR_PLACES),
    }
