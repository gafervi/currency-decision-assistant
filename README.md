# ESPAÑOL

## Asistente de Decisión de Divisas (CRC/USD)

Una herramienta basada en datos para analizar el tipo de cambio CRC/USD y 
ayudar a decidir cuándo comprar dólares utilizando
tendencias, señales y escenarios según los datos del BCCR.

### Problema

Muchas personas no saben cuándo comprar dólares debido a la fluctuación del tipo de cambio y el momento.  
La mayoría de decisiones se basan en viajes o noticias, lo que puede generar malos resultados aunque los cambios de la moneda sean pequeños.

### Solución

Este proyecto ofrece un enfoque estructurado y basado en datos para analizar el tipo de cambio.

El sistema evalúa condiciones actuales y sugiere si es buen momento para:

- Comprar  
- Vender  
- Esperar  
- Comprar parcialmente  

### Funcionalidades

- Seguimiento histórico del tipo de cambio (CRC/USD)  
- Promedios (7, 30, 90 días)  
- Señales de decisión: Comprar / Vender / Esperar / Compra parcial  
- Lista de entidades donde se puede comprar dólares, con filtros por:
  - Tipo de entidad  
  - Entidad autorizada  
  - Precio de compra/venta  
  - Última actualización  
- Análisis de tendencia y volatilidad  

### Tecnologías

- Frontend: React / Next.js  
- Backend: Python (FastAPI)  
- Base de datos: Supabase (PostgreSQL)  
- Fuente de datos: Banco Central de Costa Rica (BCCR)  

### Cómo Funciona

El sistema analiza datos históricos y calcula:

- Promedios  
- Desviación del precio respecto a tendencias recientes  
- Volatilidad a corto plazo  
- Probabilidad de cada condición  

Con base en estos indicadores, genera una recomendación:

- Comprar → condiciones favorables  
- Vender → condiciones favorables si ya tienes dólares  
- Esperar → precio alto o inestable  
- Compra parcial → condiciones intermedias  

El objetivo no es predecir el futuro, sino reducir la incertidumbre y mejorar la toma de decisiones.

### Instalación

```bash
git clone https://github.com/your-username/currency-decision-assistant.git
cd currency-decision-assistant

```
---

# ENGLISH

## Currency Decision Assistant (CRC/USD)

A data-driven tool to analyze CRC/USD exchange rates and 
help decide when to buy USD using
trends, signals, and scenarios based on BCCR data.

### Problem

Many people do not know when to buy USD due to exchange rate fluctuations and timing.  
Most decisions are based on trips or news, which can lead to poor results even when currency changes are small.

### Solution

This project provides a structured, data-driven approach to analyze exchange rates.

The system evaluates current conditions and suggests whether it is a good moment to:

- Buy  
- Sell  
- Wait  
- Partially buy  

### Features

- Historical exchange rate tracking (CRC/USD)  
- Averages (7, 30, 90 days)  
- Decision signals: Buy / Sell / Wait / Partial Buy  
- List of entities where USD can be purchased, with filters by:
  - Entity type  
  - Authorized entity  
  - Buy/Sell price  
  - Last update  
- Trend and volatility analysis  

### Technologies

- Frontend: React / Next.js  
- Backend: Python (FastAPI)  
- Database: Supabase (PostgreSQL)  
- Data Source: Central Bank of Costa Rica (BCCR)  

### How It Works

The system analyzes historical data and calculates:

- Averages  
- Price deviation from recent trends  
- Short-term volatility  
- Probability of each condition  

Based on these indicators, it generates a recommendation:

- Buy → favorable conditions  
- Sell → favorable conditions if you already have USD  
- Wait → high or unstable price  
- Partial buy → moderate conditions  

The goal is not to predict the future, but to reduce uncertainty and improve decision-making.

### Installation

```bash
git clone https://github.com/your-username/currency-decision-assistant.git
cd currency-decision-assistant

```
