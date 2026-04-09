from app.schemas import RateSnapshot


def get_mode_snapshot(mode: str, snapshot: RateSnapshot) -> RateSnapshot:
    return snapshot.model_copy(
        update={
            "current_rate": snapshot.official_sell_rate
            if mode == "buy"
            else snapshot.official_buy_rate,
        }
    )
