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

✅ Build de producción validado el 2026-07-09 (última corrida, **Fase Enterprise**): 1237 módulos, `dist/assets/index-*.js` ~629 kB (~181 kB gzip), más `jspdf`/`html2canvas` en chunks lazy separados (no forman parte del bundle inicial). Validado también en navegador real (Chrome, macOS), incluyendo modo oscuro en las 6 vistas/estados de la app. Ver secciones 3, 9 y 10 de `handoff.md` para el detalle completo.

### Ya construido

- Servicio de datos (`dataService.js`): fetch del CSV + PapaParse + normalización + clasificación por país. Las tasas (apertura/clics/rebote/rebote duro/rebote suave/spam/cancelación) se calculan desde conteos crudos, no desde las columnas de texto de HubSpot (tenían bugs de formato — ver `handoff.md` sección 4). Incluye `hasEmoji()` para detectar emojis en el asunto vía regex Unicode y `communicationType` (nuevo, Fase Enterprise)
- Hook de datos (`useHubspotData.js`): `data`, `loading`, `error`, `refetch()`, `lastFetchedAt`, filtros por país/fecha/tipo de envío/**tipo de comunicación (nuevo)**, KPIs globales
- Hook de analítica avanzada (`useAdvancedAnalytics.js` + `utils/advancedAnalytics.js`): memoiza sobre el dataset filtrado y expone 4 insights — **Insight del Asunto**, **Salud del dominio / Deliverability**, **Mejor horario de envío** y **Rendimiento por palabras clave (nuevo, Fase Enterprise)** — extrae las 3-5 palabras más repetidas del Asunto en las campañas con mayor tasa de apertura, filtrando stop words en español
- **Benchmarks semafóricos (nuevo, Fase Enterprise)**: `utils/benchmarks.js` compara Tasa de apertura (meta 20%) y Tasa de clics (meta 2%) contra metas de industria y expone un estado success/warning/danger, mostrado como un punto de color junto a cada métrica en `MetricCard.jsx`
- Layout (`DashboardLayout.jsx`): sidebar con logo Prisma/Lentesplus + navegación real entre vistas + header con título a la izquierda y **filtros a la derecha** (prop `headerActions`) + **botón "Exportar informe" a PDF** y **toggle de modo oscuro** (ambos nuevos, Fase Enterprise). **Sidebar fijo al viewport (nuevo, 2026-07-09)**: `h-screen overflow-hidden` en el shell — solo el contenido de `<main>` scrollea, el sidebar y el header quedan siempre visibles
- Barra de filtros (`FiltersBar.jsx`): país + tipo de envío + **tipo de comunicación (nuevo, Fase Enterprise)** + rango de fechas (`DateRangeFilter.jsx`) + botón "Limpiar filtros". Vive en el header, no como tarjeta propia
- Vista "Resumen": tarjetas de KPI con benchmarks (`MetricCard.jsx`, `DashboardSummary.jsx`) + `ReportsView.jsx` (tendencia LineChart con toggle Día/Semana/Mes, **paleta theme-aware para modo oscuro**, BarChart por país, Top 5 campañas) + `AdvancedInsights.jsx` (4 tarjetas de analítica avanzada, incluida la nueva de palabras clave)
- Vista "Campañas" (`CampaignsView.jsx`): **buscador por Asunto/Nombre + paginación de 15 filas por página (nuevo, Fase Enterprise)** — evita renderizar las 436 filas de golpe; filas clickeables que abren `CampaignDetailView.jsx` con embudo de conversión, análisis comparativo vs. pares y tarjeta de preview sin iframe
- Vista "Países" (`CountriesView.jsx`): tarjetas + tabla comparativa por país, con tooltips de valor absoluto en cada porcentaje
- Vista "Configuración" (`SettingsView.jsx`): panel 100% informativo — nombre de la hoja de cálculo origen, URLs (deshabilitadas) + botón "Refrescar datos"
- **Modo oscuro (Fase Enterprise)**: `useTheme.js` (hook) + Tailwind `darkMode: "class"`, toggle sol/luna en el sidebar. **Arranca siempre en modo claro por defecto** (2026-07-09, ya no sigue `prefers-color-scheme` del sistema), **sin `localStorage`** (decisión explícita — ver `handoff.md` sección 5.2), así que el toggle manual dura solo la sesión actual
- `Tooltip.jsx` (`components/common/`): tooltip nativo con Tailwind puro (`group`/`group-hover`, sin librería)
- `reportAggregations.js`: agregaciones puras + `filterCampaignsBySearch` (nuevo, Fase Enterprise)
- `pagination.js` (nuevo, Fase Enterprise): `paginate()` en memoria, sin `localStorage`
- `exportPdf.js` (nuevo, Fase Enterprise): `exportNodeToPdf()` — html2canvas + jsPDF, ambas cargadas con `import()` dinámico
- `App.jsx`: página contenedora que ensambla todo lo anterior, controla el estado de filtros (incluido tipo de comunicación), navegación, campaña seleccionada, analítica avanzada memoizada y el estado del tema

> ⚠️ **Vista previa del correo sin iframe (2026-07-09):** se intentó embeber la vista previa de HubSpot (`preview.hs-sites.com`) en un iframe, pero algunos navegadores bloquean la validación de sesión de HubSpot dentro de un iframe por restricciones de cookies de terceros (confirmado vía inspección de red: redirige a un 503 de `app.hubspot.com`). No es un bug de la app. Se reemplazó por una tarjeta con Asunto + Texto de vista previa (columnas del CSV) y un botón "Ver diseño original en HubSpot" que abre `previewUrl` en pestaña nueva. Se investigó también reconstruir la URL pública sin login (`info.lentesplus.com/...`) a partir de los datos del CSV — con 12 ejemplos reales se descartó definitivamente: ninguna de las hipótesis de orden probadas (ID de correo, ID interno, fecha de publicación) se cumple de forma consistente. Detalle completo de ambas investigaciones en `handoff.md` sección 4.

### Pendiente

- Abrir/inspeccionar manualmente un PDF exportado para confirmar el corte correcto entre páginas A4
- Cálculo de `growth` (variación vs. período anterior) para los badges de KPI
- Tests de la capa de datos (`dataService.js`, `useHubspotData.js`, `reportAggregations.js`, `advancedAnalytics.js`, `benchmarks.js`, `pagination.js`)
- Tooltips de valor absoluto en la tabla "Top 5 campañas" de `ReportsView.jsx` (fuera de alcance de esta ronda, seguimiento natural)
- Revisar tamaño del chunk principal antes de desplegar a producción (Vite advierte >500 kB; jspdf/html2canvas ya están correctamente separados en chunks lazy)
- Deploy a Vercel
- Afinar `DateRangeFilter.jsx` en mobile (2 meses lado a lado en pantallas muy chicas)
- Verificar en viewport móvil real el header con filtros (ahora con 4 selects), solo validado en desktop por ahora
- Decidir si el modo oscuro debería persistir entre sesiones (hoy vuelve siempre a `prefers-color-scheme`, decisión explícita de no usar `localStorage`)

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
    ├── hooks/
    │   ├── useHubspotData.js
    │   ├── useAdvancedAnalytics.js
    │   └── useTheme.js                     # NUEVO — modo oscuro, sin localStorage
    ├── utils/
    │   ├── reportAggregations.js
    │   ├── advancedAnalytics.js
    │   ├── dateRangePresets.js
    │   ├── benchmarks.js                   # NUEVO — semáforo apertura/clics vs. metas de industria
    │   ├── pagination.js                   # NUEVO — paginación en memoria
    │   └── exportPdf.js                    # NUEVO — exportación a PDF (html2canvas + jsPDF)
    └── components/
        ├── layout/DashboardLayout.jsx      # + botón Exportar PDF, toggle de tema
        ├── metrics/{MetricCard,DashboardSummary,ConversionFunnel}.jsx   # MetricCard + benchmarks
        ├── common/Tooltip.jsx                  # tooltip CSS puro (Tailwind group-hover)
        ├── filters/{FiltersBar,DateRangeFilter,Filters}.jsx   # Filters.jsx es legacy, ver handoff.md
        ├── reports/ReportsView.jsx             # vista "Resumen" — tendencia, país, top 5, paleta theme-aware
        ├── insights/AdvancedInsights.jsx       # vista "Resumen" — 4 tarjetas, incluye palabras clave
        ├── campaigns/{CampaignsView,CampaignDetailView}.jsx   # Campañas + buscador/paginación + detalle
        ├── countries/CountriesView.jsx         # vista "Países"
        └── settings/SettingsView.jsx           # vista "Configuración" (solo lectura)
```

## Fuente de datos

El dashboard consume la URL "Publicar en la web" de un Google Sheet (ver `HUBSPOT_CSV_URL` en `dataService.js`). Se probó también un CSV alojado en Google Drive pero se descartó: Google aplica una cuota de descargas/vistas a archivos compartidos públicamente que se agota rápido y no es apta para que cada usuario final haga `fetch()` directo desde su navegador. Detalle completo y bugs de formato de origen en `handoff.md` secciones 1 y 4.

## Sistema de diseño

Toda la UI sigue estrictamente `DESIGN_SYSTEM-LIVO.md`: paleta de marca (Electric Blue, Lime, Orange, Pink), tipografía (Ballinger / Poppins / T29 Carbon), spacing base-4px y componentes con sus variantes/estados exactos. No se introducen colores o estilos fuera de esa guía.

## Dependencias

`jspdf` y `html2canvas` se agregaron en la Fase Enterprise (`npm install jspdf html2canvas --save`) para el botón "Exportar informe" — se cargan con `import()` dinámico dentro del handler del botón, así que no forman parte del bundle inicial (confirmado en build: quedan en chunks lazy separados). Los tooltips de valor absoluto siguen usando Tailwind puro (`group`/`group-hover`, componente `Tooltip.jsx`), sin Radix UI ni Headless UI. La paginación y el modo oscuro tampoco agregaron dependencias (funciones/hooks propios). Detalle completo en `handoff.md` sección 5.

## Sin `localStorage` — decisión de arquitectura

Por pedido explícito de David, ninguna parte de la app usa `localStorage` para persistir datos: ni la data cruda del CSV, ni el estado de paginación/búsqueda de Campañas, ni la preferencia de modo oscuro (que siempre vuelve a `prefers-color-scheme` del sistema al recargar). Paginación resuelta con `useMemo` sobre el dataset ya filtrado; ver el razonamiento completo en `handoff.md` sección 5.2.

## Cómo continuar

Ver `handoff.md` sección 8 ("Próximos pasos sugeridos") para el detalle completo: inspección manual del PDF exportado, verificación de `FiltersBar` en mobile, cálculo de `growth`, tests de la capa de datos (incluidos `benchmarks.js`/`pagination.js`), tooltips en "Top 5 campañas", retiro de `Filters.jsx` (legacy), revisión de tamaño de bundle, deploy a Vercel y decisión sobre persistencia del modo oscuro.
