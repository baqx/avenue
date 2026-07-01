from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_wallets: int
    active_wallets: int
    frozen_wallets: int
    closed_wallets: int
    total_volume_kobo: int       # All-time total credits in kobo
    volume_today_kobo: int
    volume_7d_kobo: int
    volume_30d_kobo: int
    total_transactions: int
    pending_suspense_count: int
    webhook_delivery_rate: float  # 0.0 to 1.0


class VolumeDataPoint(BaseModel):
    date: str       # "2026-07-01"
    amount_kobo: int
    count: int


class TransactionTimeseries(BaseModel):
    period: str     # "7d" | "30d" | "90d"
    data: list[VolumeDataPoint]


class WalletBreakdown(BaseModel):
    active: int
    frozen: int
    closed: int
    total: int


class SuspenseStats(BaseModel):
    pending: int
    resolved: int
    flagged: int
    resolution_rate: float
    breakdown_by_reason: dict[str, int]


class WebhookStats(BaseModel):
    delivered: int
    failed: int
    dead: int
    delivery_rate: float
