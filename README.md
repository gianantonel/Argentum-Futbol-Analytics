# Argentum Fútbol Analytics

Primera versión de una app dark/minimalista de fútbol analytics con backend sobre datos públicos de StatsBomb.

## Qué incluye

- Backend Next.js API routes:
  - `/api/competitions`
  - `/api/matches?competition_id=43&season_id=106`
  - `/api/events?match_id=3869685&team=Argentina&chart=pass-map`
- Frontend con dropdowns para:
  - torneo / temporada;
  - partido;
  - equipo;
  - tipo de gráfica;
  - jugador.
- Cancha SVG oscura con líneas blancas gruesas, inspirada en el flujo de la notebook Tiki-Tiki.
- Visualizaciones v0.1:
  - mapa de pases;
  - pases al último tercio;
  - mapa de tiros;
  - carries progresivos;
  - resumen y top de pases por jugador.

## Datos

Usa `statsbomb/open-data` desde GitHub raw. Caso default: Argentina vs Francia, Final Mundial 2022.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
