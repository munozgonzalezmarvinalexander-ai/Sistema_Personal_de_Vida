from pydantic import BaseModel


class InsightOut(BaseModel):
    id: str
    type: str
    title: str
    message: str
    recommendation: str
    category: str
    priority: str
    confidence: str
    period_days: int
    related_metric: str
    created_from: str
    action_label: str | None = None
    action_target: str | None = None


class InsightSummaryOut(BaseModel):
    total: int
    high_priority: int
    medium_priority: int
    low_priority: int
    best_metric: str | None
    needs_attention: str | None
    general_message: str


class CorrelationPointOut(BaseModel):
    date: str
    x: float
    y: float


class CorrelationOut(BaseModel):
    id: str
    metric_x: str
    metric_y: str
    label_x: str
    label_y: str
    coefficient: float
    strength: str
    direction: str
    sample_size: int
    message: str
    recommendation: str
    confidence: str
    lag_days: int = 0
    data_points: list[CorrelationPointOut] = []


class CorrelationsResponse(BaseModel):
    days: int
    sample_size: int
    correlations: list[CorrelationOut]
    message: str
    lag_days: int = 0
