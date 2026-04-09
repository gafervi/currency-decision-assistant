from app.schemas import CatalogIndicator, CatalogResponse


def get_catalog_summary() -> CatalogResponse:
    return CatalogResponse(
        indicators=[
            CatalogIndicator(
                code=317,
                name="Tipo de cambio de compra del USD",
                description="Indicador SDDE asumido para compra oficial en el MVP.",
                source="BCCR SDDE API",
            ),
            CatalogIndicator(
                code=318,
                name="Tipo de cambio de venta del USD",
                description="Indicador SDDE asumido para venta oficial en el MVP.",
                source="BCCR SDDE API",
            ),
        ],
        notes=[
            "Validar metadata real de 317 y 318 con el token del proyecto antes de usar datos productivos.",
            "La tabla de ventanilla seguirá siendo una fuente separada para entidades y precios comerciales.",
        ],
    )
