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

✅ Build de producción validado el 2026-07-09 (última corrida, ronda de analítica avanzada): 850 módulos, `dist/assets/index-*.js` ~611 kB (~176 kB gzip), `dist/assets/index-*.css` ~19 kB (~4.5 kB gzip), sin errores. Validado también en navegador real (Chrome, macOS). Ver sección 3, 8 y 9 de `handoff.md` para el detalle completo.

### Ya construido

- Servicio de datos (`dataService.js`): fetch del CSV + PapaParse + normalización + clasificación por país. Las tasas (apertura/clics/rebote/rebote duro/rebote suave/spam/cancelación) se calculan desde conteos crudos, no desde las columnas de texto de HubSpot (tenían bugs de formato — ver `handoff.md` sección 4). Incluye `hasEmoji()` para detectar emojis en el asunto vía regex Unicode
- Hook de datos (`useHubspotData.js`): `data`, `loading`, `error`, `refetch()`, `lastFetchedAt`, filtros por país/fecha/tipo de envío, KPIs globales
- Hook de analítica avanzada (`useAdvancedAnalytics.js` + `utils/advancedAnalytics.js`): memoiza sobre el dataset filtrado y expone 3 insights — **Insight del Asunto** (tasa de apertura promedio con vs. sin emoji), **Salud del dominio / Deliverability** (rebote duro, rebote suave, spam, cancelación de suscripción, con alertas si spam > 0.1% o rebote duro > 2%) y **Mejor horario de envío** (heatmap día × hora de tasa de apertura, con fallback si la muestra es muy chica)
- Layout (`DashboardLayout.jsx`): sidebar con logo Prisma/Lentesplus + navegación real entre vistas + header con título a la izquierda y **filtros a la derecha** (prop `headerActions`, ver nota abajo)
- Barra de filtros (`FiltersBar.jsx`): país + **tipo de envío** (Todos/Marketing/Automatizado/Flujo de trabajo — filtro general, aplica a Resumen/Campañas/Países) + **rango de fechas** (`DateRangeFilter.jsx`: popover estilo Google Analytics con lista de presets + calendario de 2 meses + Cancelar/Actualizar; cálculo de rangos en `dateRangePresets.js`) + botón "Limpiar filtros". Vive en la misma fila que el título de cada vista (header de `DashboardLayout`), no como tarjeta propia — libera espacio vertical para mostrar más contenido en una sola pantalla. Solo aparece en Resumen, Países y en Campañas sin detalle abierto
- Vista "Resumen": tarjetas de KPI (`MetricCard.jsx`, `DashboardSummary.jsx`) + `ReportsView.jsx` (tendencia LineChart con **toggle Día/Semana/Mes**, BarChart por país, Top 5 campañas) + `AdvancedInsights.jsx` (las 3 tarjetas de analítica avanzada descritas arriba)
- Vista "Campañas" (`CampaignsView.jsx`): tabla completa del dataset filtrado, con filas clickeables que abren `CampaignDetailView.jsx` y tooltips de valor absoluto (ver abajo) en las columnas de porcentaje — detalle de campaña con **embudo de conversión** (`ConversionFunnel.jsx`: Enviados→Entregados→Aperturas→Clics), análisis comparativo contra el promedio de campañas del mismo tipo de envío (`buildCampaignInsights` en `reportAggregations.js`) y una tarjeta con Asunto + Texto de vista previa + botón "Ver diseño original en HubSpot" (sin iframe — ver nota abajo)
- Vista "Países" (`CountriesView.jsx`): tarjetas + tabla comparativa por país, con tooltips de valor absoluto en cada porcentaje
- Vista "Configuración" (`SettingsView.jsx`): panel 100% informativo — nombre de la hoja de cálculo origen ("BD Emails Hubspot"), URL del CSV publicado y URL de la hoja en Google Sheets (ambas en campos deshabilitados, no editables) + botón para abrir la hoja en pestaña nueva + última actualización + botón "Refrescar datos"
- `Tooltip.jsx` (`components/common/`): tooltip nativo con Tailwind puro (`group`/`group-hover`, sin librería) — muestra el conteo absoluto detrás de cada porcentaje al hacer hover, usado en Campañas y Países
- `reportAggregations.js`: agregaciones puras (tendencia con granularidad día/semana/mes, volumen por país, métricas por país con totales absolutos, top N, insights de campaña vs. pares)
- `App.jsx`: página contenedora que ensambla todo lo anterior, controla el estado de filtros, qué vista del sidebar está activa, qué campaña está seleccionada en el detalle y la analítica avanzada memoizada

> ⚠️ **Vista previa del correo sin iframe (2026-07-09):** se intentó embeber la vista previa de HubSpot (`preview.hs-sites.com`) en un iframe, pero algunos navegadores bloquean la validación de sesión de HubSpot dentro de un iframe por restricciones de cookies de terceros (confirmado vía inspección de red: redirige a un 503 de `app.hubspot.com`). No es un bug de la app. Se reemplazó por una tarjeta con Asunto + Texto de vista previa (columnas del CSV) y un botón "Ver diseño original en HubSpot" que abre `previewUrl` en pestaña nueva. Se investigó también reconstruir la URL pública sin login (`info.lentesplus.com/...`) a partir de los datos del CSV — con 12 ejemplos reales se descartó definitivamente: ninguna de las hipótesis de orden probadas (ID de correo, ID interno, fecha de publicación) se cumple de forma consistente. Detalle completo de ambas investigaciones en `handoff.md` sección 4.

### Pendiente

- Cálculo de `growth` (variación vs. período anterior) para los badges de KPI
- Tests de la capa de datos (`dataService.js`, `useHubspotData.js`, `reportAggregations.js`, `advancedAnalytics.js`)
- Tooltips de valor absoluto en la tabla "Top 5 campañas" de `ReportsView.jsx` (fuera de alcance de esta ronda, seguimiento natural)
- Revisar tamaño de bundle antes de desplegar a producción (Vite advierte >500 kB)
- Deploy a Vercel
- Afinar `DateRangeFilter.jsx` en mobile (2 meses lado a lado en pantallas muy chicas)
- Verificar en viewport móvil real el header con filtros (`FiltersBar` movida ahí, solo validado en desktop por ahora)

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
    │   ├── useHubspotData.js
    │   └── useAdvancedAnalytics.js
    ├── utils/
    │   ├── reportAggregations.js
    │   ├── advancedAnalytics.js
    │   └── dateRangePresets.js
    └── components/
        ├── layout/DashboardLayout.jsx
        ├── metrics/{MetricCard,DashboardSummary,ConversionFunnel}.jsx
        ├── common/Tooltip.jsx                  # tooltip CSS puro (Tailwind group-hover)
        ├── filters/{FiltersBar,DateRangeFilter,Filters}.jsx   # Filters.jsx es legacy, ver handoff.md
        ├── reports/ReportsView.jsx             # vista "Resumen" — tendencia, país, top 5
        ├── insights/AdvancedInsights.jsx       # vista "Resumen" — insight asunto/deliverability/mejor horario
        ├── campaigns/{CampaignsView,CampaignDetailView}.jsx   # vista "Campañas" + detalle de una campaña
        ├── countries/CountriesView.jsx         # vista "Países"
        └── settings/SettingsView.jsx           # vista "Configuración" (solo lectura)
```

## Fuente de datos

El dashboard consume la URL "Publicar en la web" de un Google Sheet (ver `HUBSPOT_CSV_URL` en `dataService.js`). Se probó también un CSV alojado en Google Drive pero se descartó: Google aplica una cuota de descargas/vistas a archivos compartidos públicamente que se agota rápido y no es apta para que cada usuario final haga `fetch()` directo desde su navegador. Detalle completo y bugs de formato de origen en `handoff.md` secciones 1 y 4.

## Sistema de diseño

Toda la UI sigue estrictamente `DESIGN_SYSTEM-LIVO.md`: paleta de marca (Electric Blue, Lime, Orange, Pink), tipografía (Ballinger / Poppins / T29 Carbon), spacing base-4px y componentes con sus variantes/estados exactos. No se introducen colores o estilos fuera de esa guía.

## Dependencias

Sin librerías nuevas en la ronda de analítica avanzada: los tooltips de valor absoluto usan Tailwind puro (`group`/`group-hover`, componente `Tooltip.jsx`), no Radix UI ni Headless UI. Detalle en `handoff.md` sección 5.

## Cómo continuar

Ver `handoff.md` sección 8 ("Próximos pasos sugeridos") para el detalle: cálculo de `growth`, tests de la capa de datos y de analítica avanzada, tooltips de valor absoluto en "Top 5 campañas", extracción de `LoadingState`/`ErrorState` reutilizables, retiro de `Filters.jsx` (legacy), revisión de tamaño de bundle y deploy a Vercel.
