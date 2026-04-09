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


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def _build_payload(
    mode: str, amount: float, values: list[float], locale: str = "es"
) -> RecommendationPayload:
    if not values:
        raise ValueError("No valid market values available for recommendation")

    amount_band = classify_amount(mode, amount)
    current = values[-1]
    avg_7 = _moving_average(values, 7)
    avg_30 = _moving_average(values, 30)
    avg_90 = _moving_average(values, 90)
    volatility = _volatility(values)

    if mode == "buy":
        deviation = avg_30 - current
        short_trend = avg_30 - avg_7
        long_trend = avg_90 - avg_7
    else:
        deviation = current - avg_30
        short_trend = avg_7 - avg_30
        long_trend = avg_7 - avg_90

    favorable = deviation >= 0 and short_trend >= 0
    avg_30_safe = max(avg_30, 1e-6)
    avg_90_safe = max(avg_90, 1e-6)
    volatility_safe = max(volatility, 0.05)

    deviation_pct = (deviation / avg_30_safe) * 100
    short_trend_pct = (short_trend / avg_30_safe) * 100
    long_trend_pct = (long_trend / avg_90_safe) * 100
    volatility_pct = (volatility / avg_30_safe) * 100
    signal_to_noise = deviation / volatility_safe

    base_confidence = 50.0
    base_confidence += _clamp(signal_to_noise * 8, -12, 18)
    base_confidence += _clamp(deviation_pct * 45, -10, 14)
    base_confidence += _clamp(short_trend_pct * 35, -8, 10)
    base_confidence += _clamp(long_trend_pct * 25, -6, 8)

    if favorable:
        base_confidence += 5

    if volatility_pct <= 0.12:
        base_confidence += 6
    elif volatility_pct <= 0.22:
        base_confidence += 3
    elif volatility_pct >= 0.35:
        base_confidence -= 6

    if amount_band == "medium":
        base_confidence -= 4
    elif amount_band == "large":
        base_confidence -= 9

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
                f"Current official sell rate: {current:.2f} versus the 30-day average of {avg_30:.2f} ({deviation_pct:.2f}% relative gap).",
                f"Recent signal strength vs volatility: {signal_to_noise:.2f}, with short/long trend readings of {short_trend_pct:.2f}% and {long_trend_pct:.2f}%.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Official sell-rate reading",
                    description="The recommendation uses the BCCR official sell series as the main reference for buying USD, weighted by deviation from the 30-day average and recent volatility.",
                ),
                InsightItem(
                    type="info",
                    title="Adjust by amount",
                    description="For medium and large amounts, the score is penalized so partial execution becomes more likely when timing is less clear.",
                ),
            ]
        else:
            rationale = [
                f"Venta oficial actual: {current:.2f} frente al promedio de 30 días de {avg_30:.2f} ({deviation_pct:.2f}% de separación relativa).",
                f"Fuerza de la señal frente a volatilidad: {signal_to_noise:.2f}, con tendencias corta/larga de {short_trend_pct:.2f}% y {long_trend_pct:.2f}%.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Lectura de venta oficial",
                    description="La recomendación prioriza la serie oficial de venta del BCCR para comprar USD, ponderando desvío frente al promedio de 30 días y volatilidad reciente.",
                ),
                InsightItem(
                    type="info",
                    title="Conviene ajustar por monto",
                    description="Para montos medianos y grandes el puntaje se penaliza, así que una ejecución parcial es más probable cuando el timing no es tan claro.",
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
                f"Current official buy rate: {current:.2f} versus the 30-day average of {avg_30:.2f} ({deviation_pct:.2f}% relative gap).",
                f"Recent signal strength vs volatility: {signal_to_noise:.2f}, with short/long trend readings of {short_trend_pct:.2f}% and {long_trend_pct:.2f}%.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Official buy-rate reading",
                    description="The recommendation uses the BCCR official buy series as the main reference for selling USD, weighted by deviation from the 30-day average and recent volatility.",
                ),
                InsightItem(
                    type="warning",
                    title="Signal sensitive to volatility",
                    description="If the market accelerates, the score falls faster because volatility reduces confidence, especially for larger amounts.",
                ),
            ]
        else:
            rationale = [
                f"Compra oficial actual: {current:.2f} frente al promedio de 30 días de {avg_30:.2f} ({deviation_pct:.2f}% de separación relativa).",
                f"Fuerza de la señal frente a volatilidad: {signal_to_noise:.2f}, con tendencias corta/larga de {short_trend_pct:.2f}% y {long_trend_pct:.2f}%.",
            ]
            insights = [
                InsightItem(
                    type="success" if favorable else "warning",
                    title="Lectura de compra oficial",
                    description="La recomendación prioriza la serie oficial de compra del BCCR para vender USD, ponderando desvío frente al promedio de 30 días y volatilidad reciente.",
                ),
                InsightItem(
                    type="warning",
                    title="Señal sensible a la volatilidad",
                    description="Si el mercado se acelera, el puntaje cae más rápido porque la volatilidad reduce confianza, especialmente en montos altos.",
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
