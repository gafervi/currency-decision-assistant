from datetime import datetime, timezone

import httpx

from app.core.config import get_settings
from app.schemas import HistoryPoint


class BccrSddeClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.bccr_sdde_token.strip())

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.settings.bccr_sdde_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _get(self, url: str) -> dict:
        response = httpx.get(url, headers=self._headers(), timeout=20.0)
        response.raise_for_status()
        return response.json()

    def indicator_metadata_url(self, indicator_code: int) -> str:
        return (
            f"{self.settings.bccr_sdde_base_url}/indicadoresEconomicos/"
            f"{indicator_code}/metadata?idioma={self.settings.bccr_sdde_language}"
        )

    def indicator_series_url(
        self, indicator_code: int, start_date: str, end_date: str
    ) -> str:
        return (
            f"{self.settings.bccr_sdde_base_url}/indicadoresEconomicos/{indicator_code}/series"
            f"?fechaInicio={start_date}&fechaFin={end_date}&idioma={self.settings.bccr_sdde_language}"
        )

    def get_indicator_metadata(self, indicator_code: int) -> dict:
        return self._get(self.indicator_metadata_url(indicator_code))

    def _extract_rows(self, payload: object) -> list[dict]:
        if isinstance(payload, list):
            dict_items = [item for item in payload if isinstance(item, dict)]
            if dict_items and any(
                "fecha" in item or "Fecha" in item for item in dict_items
            ):
                return dict_items
            rows: list[dict] = []
            for item in payload:
                rows.extend(self._extract_rows(item))
            return rows

        if isinstance(payload, dict):
            if any(key.lower() == "fecha" for key in payload):
                return [payload]
            rows: list[dict] = []
            for value in payload.values():
                rows.extend(self._extract_rows(value))
            return rows

        return []

    def get_indicator_series(
        self, indicator_code: int, start_date: str, end_date: str
    ) -> list[HistoryPoint]:
        payload = self._get(
            self.indicator_series_url(indicator_code, start_date, end_date)
        )
        rows = self._extract_rows(payload)
        points: list[HistoryPoint] = []

        for row in rows:
            fecha = row.get("fecha") or row.get("Fecha")
            valor = (
                row.get("valor")
                or row.get("Valor")
                or row.get("valorDatoPorPeriodo")
                or row.get("ValorDatoPorPeriodo")
                or row.get("valorTotalPeriodo")
                or row.get("ValorTotalPeriodo")
            )
            if not fecha or valor is None:
                continue

            observed_on = datetime.fromisoformat(
                str(fecha).replace("Z", "+00:00")
            ).date()
            points.append(
                HistoryPoint(
                    date=observed_on,
                    value=float(valor),
                    future_dated=observed_on > datetime.now(timezone.utc).date(),
                )
            )

        if not points:
            raise ValueError(f"No series points parsed for indicator {indicator_code}")

        return sorted(points, key=lambda point: point.date)

    def last_observed_at(
        self, indicator_code: int, points: list[HistoryPoint]
    ) -> datetime:
        del indicator_code
        latest = max(points, key=lambda point: point.date)
        return datetime.combine(latest.date, datetime.min.time(), tzinfo=timezone.utc)
