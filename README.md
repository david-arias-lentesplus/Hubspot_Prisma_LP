# Prisma — Dashboard de HubSpot (Lentesplus)

Dashboard analítico para métricas de campañas de email de HubSpot (Lentesplus SAS), segmentado por país (MX, CO, CL, AR) y por tipo de envío (Marketing / Automatizado / Flujo de trabajo). Consume en tiempo real un CSV con datos de envíos, apertura, clics y rebotes.

> 📌 Documentación completa y bitácora del proyecto: [`handoff.md`](./handoff.md) — fuente de la verdad, léelo antes de continuar el desarrollo.

## Stack

- **Frontend:** React (componentes funcionales + Hooks)
- **Estilos:** Tailwind CSS — tokens de marca en [`tailwind.config.js`](./tailwind.config.js), reglas completas en [`DESIGN_SYSTEM-LIVO.md`](./DESIGN_SYSTEM-LIVO.md)
- **Datos:** PapaParse (parseo de CSV) + Fetch API nativo
- **Gráficos:** Recharts

## Cómo correr el proyecto localmente

Requisitos: Node.js 18+ y npm.

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`. El dashboard hace fetch del CSV en tiempo real, así que se necesita conexión a internet.

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de `dist/` (simula producción) |

## Estado del proyecto

✅ Scaffold formal (Vite) funcionando: `npm install`, `npm run build` y `npm run dev` validados sin errores. Ver sección 3 y 8 de `handoff.md` para el detalle de qué falta antes de producción.

### Ya construido

- Servicio de datos (`dataService.js`): fetch del CSV + PapaParse + normalización + clasificación por país. Las tasas (apertura/clics/rebote) se calculan desde conteos crudos, no desde las columnas de texto de HubSpot (tenían bugs de formato — ver `handoff.md` sección 4)
- Hook de datos (`useHubspotData.js`): `data`, `loading`, `error`, `refetch()`, `lastFetchedAt`, filtros por país/fecha/tipo de envío, KPIs globales
- Layout (`DashboardLayout.jsx`): sidebar con logo Prisma/Lentesplus + navegación real entre vistas
- Barra de filtros (`FiltersBar.jsx`): país + **tipo de envío** (Todos/Marketing/Automatizado/Flujo de trabajo — filtro general, aplica a Resumen/Campañas/Países) + **rango de fechas** (`DateRangeFilter.jsx`: popover estilo Google Analytics con lista de presets + calendario de 2 meses + Cancelar/Actualizar; cálculo de rangos en `dateRangePresets.js`)
- Vista "Resumen": tarjetas de KPI (`MetricCard.jsx`, `DashboardSummary.jsx`) + `ReportsView.jsx` (tendencia LineChart, BarChart por país, Top 5 campañas)
- Vista "Campañas" (`CampaignsView.jsx`): tabla completa del dataset filtrado, con filas clickeables que abren `CampaignDetailView.jsx` — detalle de la campaña con sus 5 KPIs, un análisis comparativo contra el promedio de campañas del mismo tipo de envío (`buildCampaignInsights` en `reportAggregations.js`) y un iframe con la vista previa real del correo (`previewUrl` del CSV, con link "Abrir en pestaña nueva" como alternativa — ver nota abajo)
- Vista "Países" (`CountriesView.jsx`): tarjetas + tabla comparativa por país
- Vista "Configuración" (`SettingsView.jsx`): panel 100% informativo — nombre de la hoja de cálculo origen ("BD Emails Hubspot"), URL del CSV publicado y URL de la hoja en Google Sheets (ambas en campos deshabilitados, no editables) + botón para abrir la hoja en pestaña nueva + última actualización + botón "Refrescar datos"
- `reportAggregations.js`: agregaciones puras (tendencia, volumen por país, métricas por país, top N, insights de campaña vs. pares)
- `App.jsx`: página contenedora que ensambla todo lo anterior, controla el estado de filtros, qué vista del sidebar está activa y qué campaña está seleccionada en el detalle

> ⚠️ El iframe de vista previa del correo puede aparecer en blanco para algunas campañas: el enlace de HubSpot (`preview.hs-sites.com`) funciona perfecto como pestaña propia, pero dentro de un iframe algunos navegadores bloquean la validación de sesión de HubSpot por restricciones de cookies de terceros. No es un bug de la app — el link "Abrir en pestaña nueva" siempre funciona como alternativa. Detalle completo en `handoff.md` sección 4.

### Pendiente

- Cálculo de `growth` (variación vs. período anterior) para los badges de KPI
- Tests de la capa de datos
- Revisar tamaño de bundle antes de desplegar a producción (Vite advierte >500 kB)
- Deploy a Vercel
- Afinar `DateRangeFilter.jsx` en mobile (2 meses lado a lado en pantallas muy chicas)

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
    │   ├── reportAggregations.js
    │   └── dateRangePresets.js
    └── components/
        ├── layout/DashboardLayout.jsx
        ├── metrics/{MetricCard,DashboardSummary}.jsx
        ├── filters/{FiltersBar,DateRangeFilter,Filters}.jsx   # Filters.jsx es legacy, ver handoff.md
        ├── reports/ReportsView.jsx             # vista "Resumen"
        ├── campaigns/{CampaignsView,CampaignDetailView}.jsx   # vista "Campañas" + detalle de una campaña
        ├── countries/CountriesView.jsx         # vista "Países"
        └── settings/SettingsView.jsx           # vista "Configuración" (solo lectura)
```

## Fuente de datos

El dashboard consume la URL "Publicar en la web" de un Google Sheet (ver `HUBSPOT_CSV_URL` en `dataService.js`). Se probó también un CSV alojado en Google Drive pero se descartó: Google aplica una cuota de descargas/vistas a archivos compartidos públicamente que se agota rápido y no es apta para que cada usuario final haga `fetch()` directo desde su navegador. Detalle completo y bugs de formato de origen en `handoff.md` secciones 1 y 4.

## Sistema de diseño

Toda la UI sigue estrictamente `DESIGN_SYSTEM-LIVO.md`: paleta de marca (Electric Blue, Lime, Orange, Pink), tipografía (Ballinger / Poppins / T29 Carbon), spacing base-4px y componentes con sus variantes/estados exactos. No se introducen colores o estilos fuera de esa guía.

## Cómo continuar

Ver `handoff.md` sección 8 ("Próximos pasos sugeridos") para el detalle: cálculo de `growth`, extracción de `LoadingState`/`ErrorState` reutilizables, retiro de `Filters.jsx` (legacy), tests, revisión de tamaño de bundle y deploy a Vercel.
