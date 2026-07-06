from decimal import Decimal, ROUND_HALF_UP

def ngn_to_kobo(amount_ngn: float | str | int) -> int:
    """Safely converts NGN to Kobo without float precision loss."""
    return int((Decimal(str(amount_ngn)) * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

def kobo_to_ngn_str(amount_kobo: int) -> str:
    """Converts kobo to a strict 2-decimal NGN string for external APIs."""
    return str((Decimal(amount_kobo) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
