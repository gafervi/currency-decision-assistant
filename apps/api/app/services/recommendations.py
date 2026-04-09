from app.schemas import InsightItem, RecommendationPayload, RecommendationResponse
from app.services.bands import classify_amount
from app.services.market_data import MarketContext, get_market_context
from app.services.snapshot_view import get_mode_snapshot


def _valid_values(points: list) -> list[float]:
    return [point.value for point in points if not point.future_dated]


def _moving_average(values: list[float], window: int) -> float:
    sample = values[-window:] if len(values) >= window else values
    return sum(sample) / len(sample)


def _volatility(values: list[float], window: int = 7) -> float:
    sample = values[-window:] if len(values) >= window else values
    if len(sample) < 2:
        return 0.0
    diffs = [abs(current - previous) for previous, current in zip(sample, sample[1:])]
    return sum(diffs) / len(diffs)


def _build_payload(
    mode: str, amount: float, values: list[float], locale: str = "es"
) -> RecommendationPayload:
    amount_band = classify_amount(mode, amount)
    current = values[-1]
    avg_7 = _moving_average(values, 7)
    avg_30 = _moving_average(values, 30)
    avg_90 = _moving_average(values, 90)
    volatility = _volatility(values)

    if mode == "buy":
        deviation = avg_30 - current
        favorable = current <= avg_30 and avg_7 <= avg_30
    else:
        deviation = current - avg_30
        favorable = current >= avg_30 and avg_7 >= avg_30

    base_confidence = 55
    if favorable:
        base_confidence += 12
    if deviation > 0.4:
        base_confidence += 8
    if volatility < 0.65:
        base_confidence += 6
    if avg_7 > avg_90 and mode == "sell":
        base_confidence += 4
    if avg_7 < avg_90 and mode == "buy":
        base_confidence += 4

    if amount_band == "medium":
        base_confidence -= 4
    elif amount_band == "large":
        base_confidence -= 10

    confidence = max(35, min(92, round(base_confidence)))

    if mode == "buy":
        if confidence >= 74 and amount_band == "small":
            action = "buy"
        elif confidence >= 58:
            action = "partial"
        else:
            action = "wait"
        if locale == "en":
            rationale = [
                f"Current official sell rate: {current:.2f} versus the 30-day average of {avg_30:.2f}.",
                f"Estimated short-term volatility: {volatility:.2f} colones per day.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Official sell-rate reading",
                    description="The recommendation uses the BCCR official sell series as the main reference for buying USD.",
                ),
                InsightItem(
                    type="info",
                    title="Adjust by amount",
                    description="For medium and large amounts, a partial entry reduces timing risk.",
                ),
            ]
        else:
            rationale = [
                f"Venta oficial actual: {current:.2f} frente al promedio de 30 dias de {avg_30:.2f}.",
                f"Volatilidad corta estimada: {volatility:.2f} colones por dia.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Lectura de venta oficial",
                    description="La recomendacion prioriza la serie oficial de venta del BCCR para comprar USD.",
                ),
                InsightItem(
                    type="info",
                    title="Conviene ajustar por monto",
                    description="Para montos medianos y grandes se prioriza una ejecucion parcial para reducir timing risk.",
                ),
            ]
    else:
        if confidence >= 74 and amount_band == "small":
            action = "sell"
        elif confidence >= 58:
            action = "partial"
        else:
            action = "wait"
        if locale == "en":
            rationale = [
                f"Current official buy rate: {current:.2f} versus the 30-day average of {avg_30:.2f}.",
                f"Short vs medium trend: {avg_7:.2f} / {avg_90:.2f}.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Official buy-rate reading",
                    description="The recommendation uses the BCCR official buy series as the main reference for selling USD.",
                ),
                InsightItem(
                    type="warning",
                    title="Signal sensitive to volatility",
                    description="If the market accelerates, a partial strategy protects larger amounts better.",
                ),
            ]
        else:
            rationale = [
                f"Compra oficial actual: {current:.2f} frente al promedio de 30 dias de {avg_30:.2f}.",
                f"Tendencia corta vs media: {avg_7:.2f} / {avg_90:.2f}.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Lectura de compra oficial",
                    description="La recomendacion prioriza la serie oficial de compra del BCCR para vender USD.",
                ),
                InsightItem(
                    type="warning",
                    title="Senal sensible a la volatilidad",
                    description="Si el mercado se acelera, la estrategia parcial protege mejor los montos altos.",
                ),
            ]

    return RecommendationPayload(
        mode=mode,
        action=action,
        confidence=confidence,
        amount=amount,
        amount_band=amount_band,
        rationale=rationale,
        insights=insights,
    )


def get_recommendation(
    mode: str, amount: float, locale: str = "es"
) -> RecommendationResponse:
    context = get_market_context()
    values = _valid_values(
        context.sell_history if mode == "buy" else context.buy_history
    )
    return RecommendationResponse(
        source=context.source,
        snapshot=get_mode_snapshot(mode, context.snapshot),
        recommendation=_build_payload(
            mode=mode, amount=amount, values=values, locale=locale
        ),
    )


def get_recommendation_payload(
    mode: str, amount: float, context: MarketContext | None = None, locale: str = "es"
) -> RecommendationPayload:
    context = context or get_market_context()
    values = _valid_values(
        context.sell_history if mode == "buy" else context.buy_history
    )
    return _build_payload(mode=mode, amount=amount, values=values, locale=locale)
