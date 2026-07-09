# Dashboard de HubSpot — Lentesplus (LIVO)

Dashboard analítico para métricas de campañas de email de HubSpot (Lentesplus SAS), segmentado por país (MX, CO, CL, AR). Consume en tiempo real un CSV con datos de envíos, apertura, clics y rebotes.

> 📌 Documentación completa y bitácora del proyecto: [`handoff.md`](./handoff.md) — fuente de la verdad, léelo antes de continuar el desarrollo.

## Stack

- **Frontend:** React (componentes funcionales + Hooks)
- **Estilos:** Tailwind CSS — tokens de marca en [`tailwind.config.js`](./tailwind.config.js), reglas completas en [`DESIGN_SYSTEM-LIVO.md`](./DESIGN_SYSTEM-LIVO.md)
- **Datos:** PapaParse (parseo de CSV) + Fetch API nativo
- **Gráficos:** Recharts

## Estado del proyecto

⚠️ El scaffold formal (Vite/Next.js, `package.json`, entrypoint) todavía **no existe** — este repo contiene la capa de servicios, el hook de datos y los componentes de UI ya construidos, listos para integrarse en cuanto se decida el scaffold. Ver sección 3 y 8 de `handoff.md` para el detalle de qué falta.

### Ya construido

- Servicio de datos (`dataService.js`): fetch del CSV + PapaParse + normalización + clasificación por país
- Hook de datos (`useHubspotData.js`): `data`, `loading`, `error`, filtros por país/fecha, KPIs globales
- Layout (`DashboardLayout.jsx`): sidebar con logo LIVO/Lentesplus + navegación
- Barra de filtros (`FiltersBar.jsx`): país + rango de fechas (presets)
- Tarjetas de KPI (`MetricCard.jsx`, `DashboardSummary.jsx`): total enviados, tasa de apertura, tasa de clics, tasa de rebote
- Reportes (`ReportsView.jsx` + `reportAggregations.js`): tendencia en el tiempo (LineChart), rendimiento por país (BarChart) y Top 5 campañas por tasa de clics

### Pendiente

- Scaffold formal del proyecto e instalación real de dependencias
- Página principal que ensamble todos los componentes con `useHubspotData`
- Cálculo de `growth` (variación vs. período anterior) para los badges de KPI
- Tests de la capa de datos

## Estructura de carpetas

```
├── handoff.md                  # fuente de la verdad del proyecto
├── DESIGN_SYSTEM-LIVO.md       # sistema de diseño (obligatorio para UI)
├── tailwind.config.js          # tokens de marca (colores, tipografía, radios, sombras)
├── agents/                     # roles de los "agentes" de desarrollo (Documentador, Datos, UI/UX)
└── src/
    ├── services/
    │   └── dataService.js
    ├── hooks/
    │   └── useHubspotData.js
    ├── utils/
    │   └── reportAggregations.js
    └── components/
        ├── layout/DashboardLayout.jsx
        ├── metrics/{MetricCard,DashboardSummary}.jsx
        ├── filters/{FiltersBar,Filters}.jsx   # Filters.jsx es legacy, ver handoff.md
        └── reports/ReportsView.jsx
```

## Fuente de datos

El dashboard consume un CSV publicado en tiempo real (ver `HUBSPOT_CSV_URL` en `dataService.js` y el detalle histórico/bugs de origen en `handoff.md` sección 1 y 4).

## Sistema de diseño

Toda la UI sigue estrictamente `DESIGN_SYSTEM-LIVO.md`: paleta de marca (Electric Blue, Lime, Orange, Pink), tipografía (Ballinger / Poppins / T29 Carbon), spacing base-4px y componentes con sus variantes/estados exactos. No se introducen colores o estilos fuera de esa guía.

## Cómo continuar

1. Revisar `handoff.md` sección 8 ("Próximos pasos sugeridos").
2. Elegir Vite o Next.js y generar el scaffold (`package.json`, entrypoint).
3. `npm install react react-dom papaparse recharts tailwindcss` (y configurar Tailwind con `tailwind.config.js` ya existente).
4. Ensamblar la página principal integrando `DashboardLayout` + `FiltersBar` + `DashboardSummary` + `ReportsView` vía `useHubspotData`.
