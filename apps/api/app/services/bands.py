from app.schemas import AmountBand


def classify_amount(mode: str, amount: float) -> AmountBand:
    if mode == "buy":
        if amount <= 250000:
            return "small"
        if amount <= 1000000:
            return "medium"
        return "large"

    if amount <= 500:
        return "small"
    if amount <= 2000:
        return "medium"
    return "large"
