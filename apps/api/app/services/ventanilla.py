from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from app.schemas import EntitiesResponse, EntityQuote


VENTANILLA_URL = (
    "https://gee.bccr.fi.cr/IndicadoresEconomicos/Cuadros/frmConsultaTCVentanilla.aspx"
)


def _parse_decimal(value: str) -> float:
    return float(value.replace(".", "").replace(",", ".").strip())


def _parse_timestamp(value: str) -> datetime:
    normalized = value.replace("a.m.", "AM").replace("p.m.", "PM")
    return datetime.strptime(normalized, "%d/%m/%Y %I:%M %p").replace(
        tzinfo=timezone.utc
    )


def get_live_entities(mode: str) -> EntitiesResponse:
    response = httpx.get(VENTANILLA_URL, timeout=20.0)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table", id="DG")
    if table is None:
        raise ValueError("Ventanilla table not found")

    rows = table.find_all("tr")[1:]
    current_type = ""
    entities: list[EntityQuote] = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) != 6:
            continue

        values = [cell.get_text(" ", strip=True) for cell in cells]
        if not any(values):
            continue

        type_label = values[0]
        if type_label:
            current_type = type_label

        name = values[1]
        if not name:
            continue

        buy_price = _parse_decimal(values[2])
        sell_price = _parse_decimal(values[3])
        spread = _parse_decimal(values[4])
        last_updated = _parse_timestamp(" ".join(values[5].split()))

        entities.append(
            EntityQuote(
                id=name.lower().replace(" ", "-")[:60],
                type=current_type or "Entidad autorizada",
                name=name,
                buy_price=buy_price,
                sell_price=sell_price,
                spread=spread,
                last_updated=last_updated,
                highlighted_for_mode=False,
            )
        )

    if not entities:
        raise ValueError("No ventanilla entities parsed")

    best_buy = max(entity.buy_price for entity in entities)
    best_sell = min(entity.sell_price for entity in entities)
    highlighted = []

    for entity in entities:
        highlighted.append(
            entity.model_copy(
                update={
                    "highlighted_for_mode": entity.sell_price == best_sell
                    if mode == "buy"
                    else entity.buy_price == best_buy
                }
            )
        )

    return EntitiesResponse(mode=mode, source="live", entities=highlighted)
