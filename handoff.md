# HANDOFF — Dashboard de HubSpot (Lentesplus)

> Fuente de la verdad del proyecto. Se actualiza cada vez que se hace un cambio importante en la arquitectura, se agrega una nueva librería, o se resuelve un bug complejo ("Actualiza el handoff").
> Owner: David · Última actualización: 2026-07-09 (analítica avanzada: Insight del Asunto, Salud del dominio, Mejor horario de envío; embudo de conversión reemplaza las tarjetas de KPI de campaña; iframe de vista previa eliminado — reemplazado por tarjeta + botón a HubSpot; toggle Día/Semana/Mes en tendencia; tooltips de valor absoluto en tablas)

---

## 1. NOMBRE Y DESCRIPCIÓN DEL PROYECTO

**Prisma** (nombre de marca del dashboard, antes "LIVO" — cambiado el 2026-07-09; ver sección 6.2) — aplicación web (React + Tailwind CSS) que consume en tiempo real un CSV publicado desde Google Sheets con métricas de campañas de email de HubSpot (Lentesplus SAS). Permite visualizar tasa de apertura, tasa de clics, rebotes y fecha de envío, segmentado por país (MX, CO, CL, AR) y por tipo de envío (Marketing, Automatizado, Flujo de trabajo — ver sección 1.1).

### 1.1 Segmentación de campañas — respuesta a "¿cómo se agrupan las 436 campañas?"

**No hay ninguna agrupación ni deduplicación: 1 fila del CSV = 1 "campaña"** en toda la app (tabla de Campañas, KPIs, gráficos). Las 436 filas de la fuente de datos son 436 registros independientes — cada país (MX/CO/CL/AR) de un mismo envío es su propia fila (ej. `MKT_MX_EMMBrand_(Liquidos-MSV)_080726` y `MKT_CL_EMMBrand_(Liquidos-MSV)_080726` son 2 filas distintas, no una campaña "agrupada" en 4 países).

Si en algún momento la vista "Campañas" mostraba menos de 436, **no era una agrupación** — era el filtro de "Rango de fechas" (por defecto mostraba solo "Últimos 30 días"). Esto se corrigió: el preset por defecto ahora es **"Todo el periodo"** (ver sección 6.2), así que sin tocar filtros se ven las 436 de entrada.

Adicionalmente, el nombre de cada campaña (columna `"Nombre del correo"`) trae un prefijo que clasifica el **tipo de envío**, usado ahora como filtro general (ver sección 6.2):

| Prefijo en el nombre | Tipo | Filas (2026-07-09) |
|---|---|---|
| `MKT_...` | Marketing | 149 |
| `AUTO_...` | Automatizado | 67 |
| `WorkFlow_...` / `Workflow_...` (dos variantes de mayúscula de HubSpot, se agrupan igual) | Flujo de trabajo | 158 + 62 = 220 |
| **Total** | | **436** ✓ |

**Fuente del CSV (consumo en tiempo real, usada por `dataService.js`) — ESTABLE desde 2026-07-09:**
`https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMjhgnoi0H2fH9GLFgD-3f1VyIEC_EKeixdOZDpc0OeVaY0WWqSeojUdTUoVzdh_07W0OATyvSP2J/pub?gid=0&single=true&output=csv` (URL "Publicar en la web" de Google Sheets).

**Historial del mismo día (2026-07-09) — por qué se probó y se descartó Google Drive como fuente:**
1. Se cambió temporalmente a un CSV alojado en Google Drive (`BD_Emails_Hubspot_Livo.csv`) por indicación de David.
2. Se detectó que `https://drive.google.com/uc?export=download&id=...` responde **403** a cualquier `fetch()` real de navegador (envía header `Origin`; `curl` no, por eso "funcionaba" en pruebas con curl). Fix intentado: apuntar directo al endpoint final `drive.usercontent.google.com/download?id=...`, que sí acepta `Origin`.
3. Ese endpoint corregido igual falló en el navegador real del usuario: Google aplica una **cuota de vistas/descargas por archivo compartido públicamente**, y ya estaba agotada por las propias pruebas repetidas (confirmado con Chrome real vía Claude in Chrome: **503 en 4 de 4 intentos**, mientras `curl` desde otra IP seguía recibiendo 200). Un 503 sin los headers CORS de éxito se reporta en el navegador como `"Failed to fetch"`, indistinguible de un bloqueo CORS.
4. Se volvió a la URL de Sheets pub, que no tiene ese límite de cuota (pensada para consumo público). Verificada repetidas veces con `Origin` real: siempre 200 + `access-control-allow-origin: *`.

⚠️ **Si en el futuro el dato maestro se mueve definitivamente a un archivo de Drive (no un Sheet), NO apuntar el fetch del navegador ahí directamente** — hace falta un proxy server-side (p. ej. función serverless en Vercel) que descargue el archivo del lado del servidor, sin CORS ni cuota por IP de usuario final, y se lo sirva al frontend.

Validado el 2026-07-09: 436 filas, 55 columnas. **Las columnas de tasa (`Tasa de apertura`, `Tasa de clics`, `Tasa de rebote`, etc.) que exporta HubSpot vienen con un bug de formato que pierde el punto decimal, y el patrón es distinto/inconsistente entre columnas** (ver sección 4 para el detalle completo). En vez de intentar reconstruir ese texto, `dataService.js` **calcula las tasas directamente desde los conteos crudos** (`Abierto`, `Con clic`, `Rebotes`, `Enviado`, `Entregado`), que no tienen ningún problema de formato — validado con diferencia máxima de 0.0005 puntos porcentuales contra el cálculo manual fila por fila.

---

## 2. ESTRUCTURA DE CARPETAS ACTUALIZADA

```
mails hubspot lentesplus/
├── handoff.md                          # este archivo
├── README.md                            # onboarding rápido del repo
├── DESIGN_SYSTEM-LIVO.md                # sistema de diseño (fuente de la verdad de UI)
├── tailwind.config.js                   # tokens LIVO (colores, fuentes, radios, sombras)
├── package.json                         # NUEVO — scaffold formal (Vite), scripts dev/build/preview
├── vite.config.js                       # NUEVO — config de Vite (@vitejs/plugin-react)
├── postcss.config.js                    # NUEVO — tailwindcss + autoprefixer
├── index.html                           # NUEVO — entrypoint HTML de Vite
├── agents/
│   ├── AGENTE_DOCUMENTADOR.md
│   ├── AGENTE_DATOS.md
│   └── AGENTE_UIUX.md
└── src/
    ├── main.jsx                          # NUEVO — entrypoint de React (monta <App />)
    ├── App.jsx                           # NUEVO — página contenedora: ensambla layout+filtros+summary+reportes
    ├── index.css                         # NUEVO — directivas @tailwind base/components/utilities
    ├── services/
    │   └── dataService.js               # fetch + PapaParse + normalización + país + campaignId/previewUrl/subject/previewText/hasEmoji + tasas de deliverability
    ├── hooks/
    │   ├── useHubspotData.js            # data, loading, error, filtros, KPIs globales
    │   └── useAdvancedAnalytics.js      # NUEVO — memoiza buildEmojiInsight/buildDeliverabilityHealth/buildBestSendTime sobre el dataset filtrado
    ├── utils/
    │   ├── reportAggregations.js        # agregaciones puras: tendencia (con granularidad día/semana/mes), país (volumen), país (métricas + sumas absolutas), top 5, insights de campaña
    │   ├── advancedAnalytics.js         # NUEVO — funciones puras: buildEmojiInsight, buildDeliverabilityHealth (+ alertas), buildBestSendTime (+ heatmap)
    │   └── dateRangePresets.js          # cálculo de rangos (Ayer/7d/28d/90d/semana/mes/año/personalizado) + grilla de calendario
    └── components/
        ├── layout/
        │   └── DashboardLayout.jsx      # Sidebar (logo Prisma/Lentesplus) + área principal + navegación real
        ├── metrics/
        │   ├── MetricCard.jsx           # card de KPI (título/valor/crecimiento) — con hover:shadow-md
        │   ├── DashboardSummary.jsx     # grid de 4 MetricCard + estados loading/error
        │   └── ConversionFunnel.jsx     # NUEVO — embudo Enviados→Entregados→Aperturas→Clics, usado en CampaignDetailView
        ├── common/
        │   └── Tooltip.jsx              # NUEVO — tooltip reutilizable 100% CSS (Tailwind group-hover), sin librerías
        ├── insights/
        │   └── AdvancedInsights.jsx     # NUEVO — compone Insight del Asunto + Salud del dominio + Mejor horario, vista "Resumen"
        ├── filters/
        │   ├── FiltersBar.jsx           # barra superior de filtros (país + tipo de envío + rango de fechas)
        │   ├── DateRangeFilter.jsx      # popover de fechas estilo Google Analytics (presets + calendario 2 meses, tamaño compactado 2026-07-09)
        │   └── Filters.jsx              # ⚠️ LEGACY — sustituido por FiltersBar.jsx (ver sección 8)
        ├── reports/
        │   └── ReportsView.jsx          # vista "Resumen": LineChart (con toggle Día/Semana/Mes) + BarChart (recharts) + tabla Top 5
        ├── campaigns/
        │   ├── CampaignsView.jsx        # vista "Campañas": tabla completa del dataset filtrado, filas clickeables, tooltips de valor absoluto
        │   └── CampaignDetailView.jsx   # detalle de 1 campaña: ConversionFunnel + análisis comparativo vs. pares + tarjeta de vista previa (SIN iframe, ver sección 4)
        ├── countries/
        │   └── CountriesView.jsx        # vista "Países": tarjetas + tabla comparativa por país, tooltips de valor absoluto
        └── settings/
            └── SettingsView.jsx         # vista "Configuración": nombre/URL de la hoja + link a Google Sheets (todo solo lectura) + botón "Refrescar"
```

---

## 3. ESTADO ACTUAL DEL DESARROLLO

### Hecho

- [x] Sistema de diseño recibido y documentado (`DESIGN_SYSTEM-LIVO.md`)
- [x] Docs de agentes de rol (Documentador, Datos, UI/UX) creados y detallados
- [x] `tailwind.config.js` con tokens LIVO (colores, fuentes, radios, sombras)
- [x] Servicio de datos `dataService.js` (fetch + PapaParse + normalización + clasificación por país)
- [x] Custom hook `useHubspotData.js` (loading/error, filtro por fecha, filtro por país, KPIs globales)
- [x] Componente `DashboardLayout.jsx` (sidebar + main)
- [x] Componente `MetricCard.jsx`
- [x] Componente `Filters.jsx` (país + rango de fechas) — ver nota legacy

- [x] Headers reales del CSV validados en producción (436 filas, 2026-07-09) y `dataService.js` corregido para usarlos (ver sección 4)
- [x] Fuente de datos migrada a CSV de Google Drive; corrección de 2 bugs de formato de origen (decimales perdidos + auto-fecha) en `parseRateValue()` (ver sección 4)

**Fase 1 — Layout, filtros y tarjetas de métricas (2026-07-09):**
- [x] `DashboardSummary.jsx` — grid CSS de 4 `MetricCard` (Total enviados, Tasa de apertura, Tasa de clics, Tasa de rebote), con estados `loading` (skeletons) y `error`
- [x] `FiltersBar.jsx` — barra superior de filtros: dropdown de país + dropdown de rango de fechas (presets 7/30/90/personalizado), responsiva (stack en móvil)
- [x] Logo ficticio LIVO/Lentesplus en el sidebar de `DashboardLayout.jsx`
- [x] Micro-interacción hover (`hover:shadow-md`) en `MetricCard.jsx`

**Fase 2 — Reportes y gráficos / Data Visualization (2026-07-09):**
- [x] `src/utils/reportAggregations.js` — agregaciones puras: `buildTrendSeries` (por fecha), `buildCountryVolume` (por país), `getTopCampaigns` (Top N por tasa de clics)
- [x] `ReportsView.jsx` — `LineChart` (Tasa de apertura vs. Tasa de clics en el tiempo), `BarChart` (Enviados vs. Abiertos por país) y tabla Top 5 campañas por tasa de clics, con estados `loading`/`error`/vacío
- [x] `recharts` agregado formalmente como dependencia implementada (antes solo estaba anotada como pendiente)

**Scaffold y arranque local (2026-07-09):**
- [x] Scaffold formal con Vite (`package.json`, `vite.config.js`, `postcss.config.js`, `index.html`, `src/main.jsx`, `src/index.css`)
- [x] `App.jsx` — página contenedora que ensambla `DashboardLayout` + `FiltersBar` + vistas del sidebar, con el estado de filtros (país, preset de fecha, fechas personalizadas) conectado a `useHubspotData`
- [x] Validado en el entorno de build: `npm install`, `npm run build` (bundle sin errores, tokens LIVO confirmados en el CSS compilado) y `npm run dev` (servidor responde `200 OK` y sirve vía HMR)

**Estabilización de datos + navegación real (2026-07-09, sesión de debugging con Claude in Chrome sobre el navegador real del usuario):**
- [x] Diagnosticado y resuelto: el Dashboard no traía datos ("Failed to fetch") — causa raíz era la fuente de Google Drive (403 por header `Origin`, y luego cuota de descargas agotada devolviendo 503). Se estabilizó de vuelta en la URL de Sheets pub (ver sección 1 para el historial completo)
- [x] Diagnosticado y resuelto: KPIs con valores imposibles (213% clics, 488% rebote) — causa raíz era el mismo tipo de corrupción de formato en las columnas de tasa de HubSpot, con un patrón distinto al ya conocido. Fix: `dataService.js` ya no lee esas columnas, calcula `openRate`/`clickRate`/`bounceRate` directamente desde los conteos crudos (`safeRate()`, ver sección 4)
- [x] Diagnosticado y resuelto: los links del sidebar ("Campañas", "Países", "Configuración") no navegaban a ningún lado. `App.jsx` ahora controla `activeItemId`/`onNavigate` de `DashboardLayout` y renderiza una vista real por cada item
- [x] `useHubspotData.js` — se agregó `refetch()` (fuerza una nueva descarga del CSV) y `lastFetchedAt` (timestamp del último fetch exitoso)
- [x] `reportAggregations.js` — se agregó `buildCountryMetrics()` (totales y promedios por país) para la vista "Países"
- [x] `CampaignsView.jsx`, `CountriesView.jsx`, `SettingsView.jsx` — nuevas vistas de presentación para el sidebar
- [x] Verificado visualmente en el navegador real del usuario (vía Claude in Chrome): las 4 vistas cargan datos coherentes y la navegación cambia de vista correctamente

**Rebrand + filtro por tipo de envío + "Todo el periodo" (2026-07-09):**
- [x] Rebrand de marca visible "LIVO" → "Prisma" (sidebar, `<title>`, copy de Configuración) — sin tocar `DESIGN_SYSTEM-LIVO.md` ni los tokens `livo-*` de Tailwind (ver sección 6.2)
- [x] Filtro general "Tipo de envío" (Marketing/Automatizado/Flujo de trabajo/Todos) en `FiltersBar.jsx`, aplicado a Resumen/Campañas/Países (ver sección 6.3 y 1.1 para el conteo validado: 149+67+220=436)
- [x] Preset "Todo el periodo" agregado y puesto como default, para que la vista Campañas muestre las 436 filas sin necesidad de tocar filtros

**Rediseño del selector de rango de fechas (2026-07-09):**
- [x] `src/utils/dateRangePresets.js` — funciones puras: `computeDateRangeForPreset()` (Ayer/7d/28d/90d/Esta semana/Este mes/Este año/La semana pasada/El mes pasado/Personalizado/Todo el periodo) y `buildCalendarMonth()` (grilla de un mes, semanas Lunes→Domingo)
- [x] `src/components/filters/DateRangeFilter.jsx` — popover estilo Google Analytics: lista de presets (radios) + calendario de 2 meses navegable + dropdown "Personalizado" + campos de fecha + resumen + botones Cancelar/Actualizar (selección "en progreso" hasta confirmar)
- [x] `FiltersBar.jsx` actualizado para usar `DateRangeFilter` en vez del `<select>` simple anterior; `App.jsx` actualizado para usar `computeDateRangeForPreset` (se eliminó la función local duplicada)
- [x] Verificado en el navegador real: abrir popover, elegir "Últimos 90 días" (calendario resalta el rango, campos se completan), Actualizar aplica el filtro y recalcula KPIs/gráfico correctamente

**Ajustes de UI + detalle de campaña + Configuración informativa (2026-07-09):**
- [x] `DateRangeFilter.jsx` — popover compactado (paddings, alturas de botones/inputs, tamaño de celdas del calendario y ancho de la lista de presets todos reducidos) para que no se salga de la pantalla en el ancho por defecto del sidebar
- [x] `dataService.js` — nuevos campos normalizados por fila: `campaignId` (`"ID del correo de marketing"`, único por fila, 436/436 pobladas), `previewUrl` (`"Enlace de vista previa"`), `subject` (`"Asunto"`), `senderName`/`senderAddress`, `spamCount`, `unsubscribeCount`
- [x] `reportAggregations.js` — `buildCampaignInsights(campaign, dataset)`: compara una campaña contra el promedio de sus "pares" (mismo `campaignType`) dentro del dataset ya filtrado, para dar contexto en el detalle (no hay serie histórica por campaña individual en el CSV)
- [x] `CampaignsView.jsx` — filas ahora clickeables (`onSelectCampaign`), estilo de link en la celda de nombre
- [x] `CampaignDetailView.jsx` (nuevo) — página de detalle: header (nombre, asunto, país, tipo, fecha, remitente, ID), 5 KPIs (Enviados/Entregados/Apertura/Clics/Rebote — con badge de variación vs. pares en apertura/clics, sin badge en rebote por la razón semántica explicada en el comentario del componente), sección "Análisis" con frases generadas desde `buildCampaignInsights`, e iframe con el `previewUrl` de la fila + link "Abrir en pestaña nueva"
- [x] `App.jsx` — estado `selectedCampaignId`; la campaña se busca en `data` completo (no en `filteredData`) para que el detalle no desaparezca si el usuario toca los filtros mientras lo ve; `handleNavigate` limpia la selección al cambiar de sección del sidebar
- [x] `SettingsView.jsx` — agregado "Nombre de la hoja de cálculo" (`"BD Emails Hubspot"`), la URL del CSV y la URL de la hoja de Google Sheets ahora se muestran en inputs `disabled` (no editables), botón "Abrir hoja" (`target="_blank"`) hacia `https://docs.google.com/spreadsheets/d/1ujjNuu8V4po-mFheWYR9nwyb-1wOXmHxh-vVv88fyEk/edit?usp=sharing`, badge "Solo lectura" y nota explícita de que ningún campo de la página es editable
- [x] Verificado en el navegador real (Claude in Chrome): popover de fechas ya no desborda la pantalla; click en una fila de Campañas abre el detalle con KPIs y análisis correctos; Configuración muestra el nombre de la hoja, ambas URLs deshabilitadas y el link "Abrir hoja" — ver sección 4 para el hallazgo sobre el iframe de vista previa

**Investigación: reconstruir la URL pública ("versión web") del correo (2026-07-09) — DESCARTADA, ver sección 4:**
- [x] David propuso usar la URL pública de `info.lentesplus.com` (sin login, a diferencia de `preview.hs-sites.com`) en vez de `previewUrl`. Se investigó si su estructura es reconstruible desde las columnas del CSV — conclusión: NO de forma confiable. Detalle completo del hallazgo y por qué en sección 4. No se tocó código por esto — `previewUrl` (`preview.hs-sites.com`) se mantiene como está.

**Analítica avanzada + Embudo de conversión + Fix del preview + Tooltips (2026-07-09):**

Ronda grande de trabajo pedida explícitamente por David, dividida por rol (Agente de Datos / Agente UI/UX):

- [x] **Agente de Datos — `dataService.js`**: nuevos campos normalizados por fila: `previewText` (`"Línea del asunto y clasificación del texto de vista previa"`), `hasEmoji` (boolean, regex Unicode sobre `subject`), `hardBounceCount`/`softBounceCount` (`"Rebote duro"`/`"Rebote suave"`) y sus tasas `hardBounceRate`/`softBounceRate`/`spamRate`/`unsubscribeRate` — todas calculadas con `safeRate()` desde conteos crudos, **nunca** desde columnas de tasa precalculadas de HubSpot (mismo criterio que `openRate`/`clickRate`/`bounceRate`, ver sección 4).
- [x] **Agente de Datos — `src/utils/advancedAnalytics.js`** (nuevo archivo): `buildEmojiInsight(data)` (compara `openRate` promedio de campañas con/sin emoji en el asunto), `buildDeliverabilityHealth(data)` (promedia las 4 tasas de deliverability + genera alertas si `spamRate > 0.1%` o `hardBounceRate > 2%`, umbrales pedidos explícitamente), `buildBestSendTime(data)` (agrupa por día de semana × hora de envío, devuelve celdas con datos para un mapa de calor + la mejor combinación día/hora, con mínimo de 2 muestras antes de recomendarla — si no alcanza ese mínimo, cae a la mejor celda disponible marcada con `usedFallback: true`).
- [x] **Agente de Datos — `src/hooks/useAdvancedAnalytics.js`** (nuevo archivo): memoiza las 3 funciones de arriba sobre el dataset ya filtrado, mismo contrato que `useHubspotData.js`.
- [x] **Agente de Datos — `reportAggregations.js`**: `buildTrendSeries(data, granularity)` ahora acepta `"day"|"week"|"month"` (bucket por lunes de la semana / día 1 del mes, conversión local-safe sin `toISOString()`); `buildCountryMetrics()` ahora también suma los valores absolutos (`totalDelivered`/`totalOpens`/`totalClicks`/`totalBounces`) para los tooltips de país.
- [x] **Agente UI/UX — Fix del Preview (Opción A)**: se **eliminó por completo el iframe** de `CampaignDetailView.jsx` (bloqueado por HubSpot — ver sección 4). Se reemplazó por una tarjeta con `subject` + `previewText` y un botón primario grande "Ver diseño original en HubSpot" (`target="_blank"` hacia `previewUrl`).
- [x] **Agente UI/UX — `ConversionFunnel.jsx`** (nuevo componente): reemplaza la grilla de 5 `MetricCard` del detalle de campaña por un embudo visual Enviados→Entregados→Aperturas→Clics (barras proporcionales al primer paso, tonos `livo-blue` 500→400→300→200, % de conversión contra el paso anterior y contra el total). Las tasas de apertura/clics/rebote se conservan en una fila compacta debajo del embudo; el detalle narrativo vs. pares sigue en "Análisis".
- [x] **Agente UI/UX — Toggle Día/Semana/Mes**: `ReportsView.jsx` agrega un toggle tipo "pill" sobre el `LineChart` de tendencia (estado local del componente, no filtra `data` — solo cambia cómo se agrupan los mismos puntos vía `buildTrendSeries(data, granularity)`).
- [x] **Agente UI/UX — `Tooltip.jsx`** (nuevo componente, común): tooltip 100% CSS (`group`/`group-hover` de Tailwind), sin Radix UI ni Headless UI — decisión explícita de David ("se prefiere CSS puro con Tailwind group-hover si es posible"). Aplicado en `CampaignsView.jsx` (celdas de Apertura/Clics/Rebote) y `CountriesView.jsx` (tarjetas + tabla comparativa), mostrando el valor absoluto detrás de cada % (ej. "3,095 aperturas de 20,413 entregados"). Fuera de alcance explícito de este pedido: la tabla "Top 5" de `ReportsView.jsx` no lleva tooltips todavía (el pedido especificaba "las tablas (Campañas y Comparativo por país)").
- [x] **Agente UI/UX — `AdvancedInsights.jsx`** (nuevo componente): compone las 3 tarjetas de analítica avanzada y se monta en la vista "Resumen", debajo de `ReportsView`. Incluye un mapa de calor básico (7 días × 24 horas, opacidad de `livo-blue-500` proporcional a la tasa de apertura de cada celda) para "Mejor horario de envío".
- [x] Verificado en el navegador real (Claude in Chrome): toggle Día/Semana/Mes cambia la gráfica correctamente en los 3 modos; detalle de campaña muestra el embudo con barras y % correctos y la tarjeta de preview sin iframe (incluido el campo `previewText`, confirmado mostrando "Question Format" tal como viene en el CSV crudo); tooltips muestran el valor absoluto correcto en Campañas y Países; las 3 tarjetas de analítica avanzada renderizan con datos reales (incluida al menos una alerta/estado "sin alertas" de Salud del dominio). Nota: el bug del badge de "Tasa de rebote" en `MetricCard` (fila de la sección 4) quedó automáticamente resuelto de raíz al quitar la grilla de `MetricCard` del detalle de campaña — `MetricCard` ya no se usa en `CampaignDetailView.jsx`.

### Falta

- [ ] Estados visuales `LoadingState` / `ErrorState` genéricos y reutilizables (hoy cada componente nuevo implementa su propio skeleton/error inline; conviene extraerlos)
- [ ] Retirar `Filters.jsx` (legacy) una vez se confirme que ninguna vista lo necesita
- [ ] Cálculo real de `growth` (variación vs. período anterior) para `DashboardSummary` — hoy el prop existe pero nadie lo calcula todavía
- [ ] Tests para servicios de datos y agregaciones (parseo, filtros, cálculo de KPIs, `reportAggregations.js`, `dateRangePresets.js`)
- [ ] Code-splitting / `manualChunks` — Vite advierte que el bundle JS (~586 kB) supera los 500 kB recomendados; no bloquea el desarrollo pero conviene revisarlo antes de producción
- [ ] `DateRangeFilter.jsx`: el popover en mobile podría afinarse más (hoy se ve pero es angosto con 2 meses lado a lado en pantallas muy chicas); considerar mostrar 1 solo mes en `sm` como ya hace parcialmente
- [ ] **Mejorar la vista previa del correo con la URL pública real (`info.lentesplus.com`), no reconstruida** — la forma correcta de hacer esto es agregar la URL pública como columna del export de HubSpot (o vía su API con un backend), NO adivinándola desde el Asunto — ver sección 4 para por qué se descartó la reconstrucción. Con la Opción A ya implementada (tarjeta + botón, sin iframe) esto ya no es urgente, pero seguiría siendo una mejora si la URL se vuelve exportable.
- [ ] Tests para `advancedAnalytics.js` (`buildEmojiInsight`, `buildDeliverabilityHealth`, `buildBestSendTime`) — mismo pendiente que el resto de la capa de datos, ver ítem de tests más abajo
- [ ] Tooltips de valor absoluto (`Tooltip.jsx`) en la tabla "Top 5 campañas" de `ReportsView.jsx` — quedó fuera del alcance explícito del pedido ("las tablas (Campañas y Comparativo por país)"), pero sería consistente agregarlos ahí también
- [ ] Mapa de calor de "Mejor horario de envío" (`AdvancedInsights.jsx`): es básico a propósito (celdas de 12px, sin zoom/interacción); si se vuelve un feature importante, vale la pena revisar una librería de heatmap dedicada o mejorar la accesibilidad (hoy el detalle de cada celda solo está en el atributo `title` nativo del navegador)
- [ ] `buildBestSendTime()` no hace ninguna conversión de zona horaria — usa la hora tal cual viene en `"Fecha de envío (tu zona horaria)"` (ya la zona horaria configurada en HubSpot). Si en el futuro se necesita comparar entre países con zonas horarias distintas, esto habría que revisarlo.

---

## 4. REGISTRO DE ERRORES CONOCIDOS Y CÓMO SE SOLUCIONARON

| Fecha | Error | Causa | Solución |
|---|---|---|---|
| 2026-07-09 | El fetch al CSV parecía no funcionar | El `web_fetch` inicial devolvió el CSV completo pero excedió el límite de tokens de una sola respuesta y se truncó visualmente; no era un fallo real del fetch/CORS. Se confirmó con `curl` (436 filas descargadas sin error). | Se validó el fetch en un entorno Node real (`curl` + PapaParse) fuera del límite de contexto del chat. La URL pub de Sheets funciona correctamente para consumo en tiempo real. |
| 2026-07-09 | Clasificación de país siempre devolvía `OTHER` para el 100% de las filas | `dataService.js` tomaba el país desde la columna `"Campaña"` (slugs en minúscula tipo `lts-xxx-mx-...-080726`, sin el patrón `MKT_XX`/`_XX_` que espera `getCountryFromCampaign`). El header real que sí trae el prefijo de país es `"Nombre del correo"` (ej. `MKT_MX_EMMBrand_..._080726`). | Se reordenó `COLUMN_ALIASES.campaignName` en `dataService.js` para priorizar `"Nombre del correo"`. Verificado con PapaParse sobre las 436 filas reales: MX 105, CO 113, CL 106, AR 110, OTHER 2 (2 filas de workflow sin país). |
| 2026-07-09 | `bounceRate` mezclaba conteo con tasa | La columna `"Rebotes"` es un conteo absoluto (rebote duro + suave), no un porcentaje. La tasa real está en `"Tasa de rebote"`. | Se separaron los campos: `bounceRate` ahora lee `"Tasa de rebote"`; se agregó `bounceCount` para el conteo absoluto (`"Rebotes"`). |
| 2026-07-09 | `sentCount` no encontraba columna | Los alias asumían `"Enviados"` (plural); el header real es `"Enviado"` (singular). | Se agregó `"Enviado"` como alias principal. También se agregaron `deliveredCount` (`"Entregado"`), `opensCount` (`"Abierto"`) y `clicksCount` (`"Con clic"`) como campos adicionales normalizados. |
| 2026-07-09 | Al cambiar la fuente al CSV de Drive, las tasas (`Tasa de apertura`, `Tasa de clics`, `Tasa de rebote`, etc.) mostraban valores absurdos tipo `15162` en vez de `15.16` | El archivo de Drive pierde el punto decimal cada vez que el valor original tenía exactamente 3 decimales (ej. `"15.162"` → `"15162"`). Confirmado comparando 436 filas contra la fuente anterior (Sheets pub): el patrón parecía 100% consistente con la regla "corruptos siempre ≥1000, genuinos siempre <1000". | Se creó `parseRateValue()` en `dataService.js` con esa regla de umbral 1000. **Superado el mismo día** — ver dos filas más abajo: la regla no cubría columnas de tasa con escala pequeña, y terminó reemplazándose por completo por `safeRate()` (cálculo desde conteos crudos). |
| 2026-07-09 | Un puñado de filas (~1%) traían una fecha completa (ej. `"2026-05-12 00:00:00"`) en columnas de tasa | Valores de tasa con formato "día.mes" (ej. `"12.5"`, `"21.06"`) fueron auto-convertidos a fecha por la herramienta que generó el CSV de Drive. | Mitigado en `parseRateValue()` (detectaba el patrón de fecha ISO y reconstruía "día.mes"). **Ya no aplica** — `dataService.js` dejó de leer las columnas de tasa por completo (ver dos filas más abajo), así que este bug de origen ya no puede afectar a la app sin importar qué haga la fuente con esas columnas de texto. |
| 2026-07-09 | Al correr el proyecto local (`npm run dev`) el Dashboard mostraba "No se pudo conectar con la fuente de datos de HubSpot: Failed to fetch" | **CORS.** `HUBSPOT_CSV_URL` apuntaba a `https://drive.google.com/uc?export=download&id=...`. Ese endpoint responde 303 (redirect) a peticiones sin header `Origin` (como `curl`), pero responde **403 Forbidden** en cuanto la petición trae un header `Origin` — que es siempre el caso en un `fetch()` real desde el navegador. `curl` no envía `Origin` por defecto, así que "funcionaba" en pruebas previas pero jamás iba a funcionar desde React. Confirmado con `curl -H "Origin: http://localhost:5173"` (403) y reproducido con `fetch()` real en Node. | Se cambió `HUBSPOT_CSV_URL` para apuntar directo al endpoint final al que redirige ese enlace — `https://drive.usercontent.google.com/download?id=...&export=download` — saltando el hop que bloquea peticiones con `Origin`. **Este fix resultó incompleto** — ver la fila siguiente. Lección: **validar URLs de datos con `fetch()`/header `Origin` explícito, nunca solo con `curl` sin headers**. |
| 2026-07-09 | El fix anterior (apuntar a `drive.usercontent.google.com/download`) seguía sin traer datos: seguía apareciendo "Failed to fetch" al correr `npm run dev` en la máquina real de David | Diagnosticado conectando Claude in Chrome al navegador real del usuario (no solo `curl`/Node desde el sandbox): la petición de red mostraba **503** en 4 de 4 intentos, mientras `curl` desde otra IP seguía recibiendo 200 al mismo tiempo. Causa: Google aplica una **cuota de vistas/descargas por archivo compartido públicamente en Drive**, ya agotada para la IP del usuario por las pruebas repetidas del propio debugging. Un 503 sin headers CORS de éxito se reporta en el navegador como `"Failed to fetch"`, indistinguible de un bloqueo CORS. | Se abandonó Google Drive como fuente y se volvió a la URL "Publicar en la web" de Google Sheets (pensada para consumo público sin cuota). Verificada repetidas veces con `Origin` real: siempre 200. Lección: un link de Google Drive compartido públicamente **no es apto para fetch() directo desde el navegador de cada usuario final** — la cuota es compartida entre todos los visitantes del dashboard, no solo entre desarrolladores probando. Si se necesita Drive como fuente real a futuro, hace falta un proxy server-side. |
| 2026-07-09 | Con la fuente de Sheets ya funcionando, los KPIs mostraban valores imposibles: "213.0%" de tasa de clics promedio y "488.7%" de tasa de rebote | Las columnas `"Tasa de clics"` y `"Tasa de rebote"` de HubSpot sufren el mismo bug de pérdida de punto decimal que `"Tasa de apertura"` (fila de arriba), pero como su escala natural es mucho más chica (tasas <2%), el valor corrompido cae **por debajo de 1000** (ej. `"0.147"` → `"147"`), rompiendo la regla ">=1000" de `parseRateValue()` que asumía que todo lo corrupto sería ≥1000. | Se eliminó `parseRateValue()` y la lectura de las columnas de texto de tasa por completo. `dataService.js` ahora calcula `openRate = Abierto/Entregado*100`, `clickRate = Con clic/Entregado*100`, `bounceRate = Rebotes/Enviado*100` directamente desde los conteos crudos (función `safeRate()`), que no muestran ningún problema de formato. Validado contra las 435 filas reales: diferencia máxima 0.0005 puntos porcentuales vs. el cálculo manual fila por fila. Esta arquitectura es inmune a futuras corrupciones de formato en las columnas de texto, porque ya no se leen. |
| 2026-07-09 | El badge de variación en la card "Tasa de rebote" del detalle de campaña mostraba una flecha verde hacia arriba junto a un texto que decía "por debajo del promedio" — contradictorio a simple vista | `MetricCard` asume que "diferencia positiva = bueno = flecha verde arriba" (válido para apertura/clics). En rebote es al revés (menor = mejor), así que se invertía el signo antes de pasarlo (`-insights.bounceRateDiff`) para forzar el color correcto, pero eso invertía también la flecha, generando un ícono que visualmente decía "subió" sobre una métrica que en realidad bajó (bien). | Se quitó el badge de variación de la card de "Tasa de rebote" en `CampaignDetailView.jsx` — el contexto de si está por encima/debajo del promedio de pares ya se explica en texto en la sección "Análisis", sin depender del componente `MetricCard` (pensado para métricas donde "más alto" siempre es mejor). |
| 2026-07-09 | El iframe de "Vista previa del correo" en `CampaignDetailView.jsx` aparecía en blanco (ícono de imagen rota) para todas las campañas probadas | Verificado con Claude in Chrome: el mismo `previewUrl` (`https://preview.hs-sites.com/_hcms/preview/content/...`) carga perfecto cuando se abre como pestaña propia (top-level), pero dentro del iframe la petición de red mostraba un redirect a `https://app.hubspot.com/content-tools-menu/api/v1/tools-menu/login-verify?...` que devolvía **503**. Causa: la página de vista previa de HubSpot necesita hacer una navegación de nivel superior para validar/setear la cookie de sesión de preview; los navegadores modernos bloquean esa validación cuando ocurre dentro de un iframe de terceros (restricción de cookies de terceros), y HubSpot no tiene un fallback para ese caso. | No es un bug de la app — es una limitación real de cómo HubSpot arma sus enlaces de vista previa. Se dejó el iframe (puede funcionar según el estado de cookies/sesión del navegador del usuario) más una nota visible arriba del recuadro explicando la limitación, y el link "Abrir en pestaña nueva" (que sí funciona siempre) se mantiene visible en todo momento como alternativa garantizada. Ver sección 3 "Falta" — no hay forma confiable de detectar el fallo en JS para ocultar el iframe automáticamente. |
| 2026-07-09 | David propuso reemplazar `previewUrl` (que requiere login para el iframe, ver fila de arriba) por la URL pública "versión web" del correo (dominio propio `info.lentesplus.com`, sin login) — pasó primero 1 ejemplo real y luego, a pedido de la investigación, **12 ejemplos reales más** (3 grupos de 4 países: "Líquidos", "CajaFabricante", "Afecciones") para buscar el patrón del sufijo numérico del slug | Confirmado: `info.lentesplus.com` SÍ es apto para iframe (sin login, sin `X-Frame-Options`, CSP sin `frame-ancestors`) y el slug base sí se deriva de `"Asunto"` (minúsculas, sin `¿`/`?`/emoji, espacios→guiones). El problema sigue siendo el sufijo de desambiguación cuando el `"Asunto"` se repite entre países (el caso normal: incluso "Afecciones" comparte el mismo asunto en las 4 filas). Con los 12 ejemplos se probaron 3 hipótesis de orden (ID del correo de marketing asc., ID interno de HubSpot asc., fecha de publicación asc.) contra los grupos "Líquidos" y "CajaFabricante": **ninguna predice el orden real de sufijos en ambos grupos a la vez** — "ID de correo asc." acierta en "Líquidos" (CO=ninguno, CL=`-1`, MX=`-2`) pero falla en "CajaFabricante" (predice MX/CL/CO, la realidad es CO/CL/MX — orden invertido); las otras dos hipótesis fallan en los dos grupos. Evidencia adicional de que el sufijo depende del historial completo del dominio (no solo de estas filas): en "Afecciones", CO usa `cómoda-1` (con guion) y CL usa `cómoda1` (sin guion) — mismo número, formato distinto, señal de que HubSpot va probando variantes contra slugs ya existentes en todo el dominio; y el AR de "CajaFabricante" salió con sufijo `-23`, un número que un contador local de 4 filas nunca produciría. | **Se descartó definitivamente reconstruir/adivinar esta URL** — no es que falte encontrar la fórmula correcta, el dato (historial de slugs de todo el dominio) simplemente no existe en el CSV bajo ninguna combinación de columnas. Con asuntos repetidos (el caso común de esta cuenta), adivinar el sufijo no da un 404 limpio — puede **mostrar silenciosamente el correo equivocado de otro país**, peor que el iframe en blanco actual. No se tocó código: `previewUrl`/`CampaignDetailView.jsx` se dejaron como están. Caminos reales hacia adelante (ver sección 3 "Falta"): (1) revisar si el editor de columnas del reporte de HubSpot permite exportar la URL pública/"live URL" directamente — sin API key, sin backend, cambio de una línea en `dataService.js` si existe; (2) si no existe esa columna, consumir la API de Marketing Emails de HubSpot (requiere token de app privada → backend/proxy, fuera del alcance actual del proyecto por decisión de David de no usar API keys). |

---

## 5. DEPENDENCIAS INSTALADAS

> Nota: el proyecto aún no tiene `package.json` formal (scaffold pendiente, ver sección 3). Estas son las dependencias que el código ya generado asume/requiere.

| Paquete | Uso |
|---|---|
| `react` | Componentes funcionales + Hooks |
| `tailwindcss` | Estilos, vía `tailwind.config.js` con tokens LIVO |
| `papaparse` | Parseo del CSV de HubSpot a JSON |
| `recharts` | Gráficos — **implementado** en `ReportsView.jsx` (`LineChart`, `BarChart`) desde 2026-07-09 |

**Decisión explícita (2026-07-09): NO se agregó ninguna librería de tooltips.** El pedido de "tooltips de valores absolutos" en las tablas se evaluó contra Radix UI / Headless UI, pero se resolvió con `src/components/common/Tooltip.jsx` — CSS puro (Tailwind `group`/`group-hover`), cero dependencias nuevas, siguiendo la preferencia explícita de David ("se prefiere CSS puro con Tailwind group-hover si es posible"). Este archivo sigue teniendo exactamente las mismas 4 dependencias de producción desde que se hizo el scaffold formal.

---

## 5.1 ARQUITECTURA DEL ESTADO DE DATOS UNIFICADO

Stack: **React (Hooks) + Tailwind CSS + PapaParse + Recharts**, sin librería de estado global (Redux/Zustand) y sin librería de tooltips/overlays (Radix UI / Headless UI evaluadas y descartadas, ver sección 5) — el estado vive en el árbol de componentes vía Hooks nativos. Flujo de datos de una sola vía (unidireccional). Actualizado 2026-07-09 para incorporar el segundo hook de datos (`useAdvancedAnalytics`) que se sumó a `useHubspotData`:

```
dataService.js (fetch + PapaParse + normalización)
        │
        ▼
useHubspotData()  ← única fuente de verdad del dataset completo
        │  data, loading, error
        │  filterByCountry(code, dataset?) · filterByType(type, dataset?) · filterByDateRange(start, end, dataset?)
        │  getGlobalMetrics(dataset?) / globalMetrics · refetch() · lastFetchedAt
        ▼
App.jsx (página contenedora)
   ├── estado local: view ("resumen"|"campanas"|"paises"|"configuracion")
   ├── estado local: selectedCampaignId (detalle de campaña dentro de "campanas")
   ├── estado local: country, campaignType, datePreset, startDate, endDate
   ├── filteredData = filterByType(filterByCountry(filterByDateRange(data)))
   ├── selectedCampaign = data.find(campaignId)  ← sobre `data` completo, no filteredData (ver sección 3)
   ├── advancedAnalytics = useAdvancedAnalytics(filteredData)  ← NUEVO (2026-07-09), memoizado sobre el mismo filteredData
   │
   ├─▶ DashboardLayout   (activeItemId=view, onNavigate=handleNavigate) ← navegación real + limpia selectedCampaignId
   ├─▶ FiltersBar        (country, campaignType, datePreset, startDate, endDate + callbacks) — en resumen/campañas/países
   ├─▶ view "resumen":
   │     ├─▶ DashboardSummary   (metrics = getGlobalMetrics(filteredData))
   │     ├─▶ ReportsView        (data = filteredData) — granularidad día/semana/mes es estado LOCAL del componente
   │     └─▶ AdvancedInsights   ({...advancedAnalytics}) — NUEVO, puramente presentación de lo que ya calculó el hook
   ├─▶ view "campanas":
   │     ├─▶ CampaignsView      (data = filteredData) — sin selectedCampaignId
   │     └─▶ CampaignDetailView (campaign = selectedCampaign, dataset = filteredData) — con selectedCampaignId
   ├─▶ view "paises":        CountriesView (data = filteredData)
   └─▶ view "configuracion": SettingsView (csvUrl, sheetName, sheetUrl, rowCount, lastFetchedAt, onRefetch=refetch)
                │
                ▼
        reportAggregations.js                              advancedAnalytics.js (NUEVO)
          buildTrendSeries(data, granularity)                 buildEmojiInsight(data)
          buildCountryVolume · buildCountryMetrics            buildDeliverabilityHealth(data)
          getTopCampaigns · buildCampaignInsights              buildBestSendTime(data)
        (agregación pura, sin estado — ambos archivos)
```

Reglas clave:
- **Ningún componente de UI hace `fetch` ni usa PapaParse directamente** — todo pasa por `dataService.js` → `useHubspotData.js`.
- **Ningún componente de UI agrega datos "a mano"** para los charts/tablas/insights — toda agregación (por fecha, por país, top N, insights avanzados) vive en `reportAggregations.js` / `advancedAnalytics.js`, funciones puras y testeables por separado.
- `useAdvancedAnalytics` sigue el mismo contrato que `useHubspotData`: recibe el dataset como parámetro (no filtra, no hace fetch) y solo memoiza (`useMemo`) sobre las funciones puras — es un hook "de presentación de agregados", no una segunda fuente de verdad. Vive separado de `useHubspotData` a propósito: responde preguntas analíticas distintas (insights de contenido / salud del dominio / mejor horario) en vez de reportes descriptivos, y así ninguno de los dos hooks crece indefinidamente.
- Los filtros (país / tipo de envío / rango de fechas) y la navegación (`view`, `selectedCampaignId`) son **estado de `App.jsx`**, no de `useHubspotData` ni de `FiltersBar`/`DashboardLayout`/`CampaignsView` — estos solo reportan cambios vía callbacks (`onCountryChange`, `onDatePresetChange`, `onNavigate`, `onSelectCampaign`), siguiendo el patrón "componente controlado".
- Excepción deliberada: la granularidad del `LineChart` de tendencia (Día/Semana/Mes) es estado **local** de `ReportsView.jsx`, no de `App.jsx` — no filtra `data`, solo cambia cómo se agrupan los mismos puntos, así que no necesita vivir "arriba" en el árbol.
- Todo componente que consume datos derivados (`DashboardSummary`, `ReportsView`, `AdvancedInsights`, `CampaignsView`, `CountriesView`) acepta `loading` y `error` como props explícitas y maneja su propio estado visual (skeleton / mensaje de error / estado vacío) — no asume que el dataset siempre tiene filas.
- Las tasas (`openRate`, `clickRate`, `bounceRate`, y desde 2026-07-09 también `hardBounceRate`/`softBounceRate`/`spamRate`/`unsubscribeRate`) se calculan en `dataService.js` desde conteos crudos, nunca desde las columnas de texto de tasa de HubSpot (ver sección 4) — cualquier componente/hook que las use ya las recibe correctas, no necesita re-validarlas.

---

## 6. REGLAS DEL SISTEMA DE DISEÑO (basado en `DESIGN_SYSTEM-LIVO.md`)

- **Colores**: solo tokens LIVO — Electric Blue `#0000E1` (acción/CTA), Lime `#DEFF00` (highlight/energía, **nunca sobre blanco**), Black/White (estructura/base), Orange `#FC4F00` (urgencia/alertas), Pink `#D92D8E` (promos/campañas), Gray `#F0F0F0` (neutral). No inventar colores nuevos.
- **Tipografía**: Ballinger (`font-display`) para headings, Poppins (`font-body`) para texto/UI, T29 Carbon (`font-mono`) para números y precios.
- **Spacing**: escala base-4px (`p-1`…`p-24`), padding de card = `p-6` (24px).
- **Radios**: botones `rounded-full`, inputs `rounded-lg` (8px), cards `rounded-card` (12px) / `rounded-card-lg` (16px).
- **Breakpoints**: móvil 375px (4 cols), tablet 768px (8 cols), desktop 1440px (12 cols).
- **Foco**: todo elemento interactivo debe tener un `focus-ring` visible (ver sombras `focus-primary`, `focus-input`, `focus-secondary` en `tailwind.config.js`).
- **Accesibilidad**: nunca texto blanco sobre Lime (usar `text-black`); estados disabled con `opacity-40` + `cursor-not-allowed`.

Detalle completo en `DESIGN_SYSTEM-LIVO.md`.

### 6.1 Mapeo de colores de acento — gráficos (Recharts, nuevo 2026-07-09)

`ReportsView.jsx` usa colores del sistema como valores hexadecimales directos (Recharts no soporta clases de Tailwind en sus props `stroke`/`fill`), respetando la jerarquía semántica de la sección 4 del design system:

| Elemento del chart | Color | Token / semántica |
|---|---|---|
| `LineChart` → "Tasa de apertura" | `#0000E1` | Electric Blue — acción/brand, métrica primaria |
| `LineChart` → "Tasa de clics" | `#FC4F00` | Vivid Orange — urgencia/secundaria, resalta la métrica de conversión |
| `BarChart` → "Enviados" | `#0000E1` | Electric Blue — volumen base |
| `BarChart` → "Abiertos" | `#D92D8E` | Pink — campañas/engagement |
| Badge de país (tabla Top 5) | `bg-[#E8E8FF] border-livo-blue-600 text-livo-blue-600` | Variante "Info" de badges (sección 9.1) |
| Grid / ejes de los charts | `#F0F0F0` / `#666` | Gray neutral + texto secundario |

**Nota de accesibilidad aplicada:** se evitó deliberadamente usar Lime (`#DEFF00`) como color de línea/barra sobre fondo blanco de los charts, siguiendo la regla explícita de la sección 14 ("Never use Lime on white — insufficient contrast"). Si se necesita un tercer color de serie en el futuro (p. ej. tasa de rebote en el mismo `LineChart`), usar Pink (`#D92D8E`) o un tono de Blue más oscuro (`blue-700` `#00009D`) antes que Lime.

**Ampliación 2026-07-09 — `ConversionFunnel.jsx` y `AdvancedInsights.jsx`:** ningún color nuevo, solo tokens ya existentes en `tailwind.config.js`, usados vía clases de Tailwind (no hex directo, a diferencia de Recharts arriba, porque estos sí son elementos DOM normales):

| Elemento | Clase Tailwind | Token / semántica |
|---|---|---|
| `ConversionFunnel` — barra "Enviados" | `bg-livo-blue-500` + `text-white` | Electric Blue base — primer paso del embudo |
| `ConversionFunnel` — barra "Entregados" | `bg-livo-blue-400` + `text-white` | Blue más claro — degradado del embudo, mismo tono |
| `ConversionFunnel` — barra "Aperturas" | `bg-livo-blue-300` + `text-livo-blue-900` | Blue claro — texto oscuro por contraste (fondo claro) |
| `ConversionFunnel` — barra "Clics" | `bg-livo-blue-200` + `text-livo-blue-900` | Blue muy claro — mismo criterio de contraste |
| Heatmap "Mejor horario de envío" | `bg-livo-blue-500` con `opacity` inline (0.06–1) | Un solo tono de Blue, intensidad = tasa de apertura relativa — evita la ambigüedad de usar 2 colores (rojo/verde) para una métrica donde no hay "bueno/malo" binario |
| Alertas de "Salud del dominio" (rojo) | `bg-[#FFF5F5] border-[#DC2626]/30 text-[#B91C1C]` | Reutiliza el mismo semantic-red ya usado en los estados de error de `CampaignsView.jsx`/`CountriesView.jsx`/`ReportsView.jsx` — no es un color nuevo |
| Estado "sin alertas" (verde) | `bg-[#DCFCE7] text-[#15803D]` | Reutiliza el mismo semantic-green ya usado en `MetricCard.jsx` para variación positiva |
| `Tooltip.jsx` (fondo del globo) | `bg-[#111]` + `text-white` + `shadow-tooltip` | Neutral oscuro — patrón estándar de tooltip (no forma parte de la paleta de marca a propósito, igual que en la mayoría de sistemas de diseño); usa el token `shadow-tooltip` que ya existía en `tailwind.config.js` desde el scaffold inicial, pensado justamente para este caso |

### 6.2 Rebrand LIVO → Prisma (2026-07-09)

Se cambió el nombre de marca visible en la UI de "LIVO" a **"Prisma"**, a pedido de David. Alcance del cambio — **solo texto/branding visible**, nada estructural:

- `DashboardLayout.jsx`: badge del logo del sidebar (`"L"` → `"P"`), texto del logo (`"LIVO"` → `"Prisma"`), footer del sidebar (`"Lentesplus SAS · livo.com"` → `"Lentesplus SAS · Prisma"`)
- `index.html`: `<title>` (`"... (LIVO)"` → `"... (Prisma)"`)
- `SettingsView.jsx`: copy de la tarjeta "Sistema de diseño" (`"paleta LIVO"` → `"paleta de marca Prisma"`)

**Deliberadamente NO se tocó:**
- El archivo `DESIGN_SYSTEM-LIVO.md` (nombre de archivo y contenido) — sigue siendo la fuente de la verdad del sistema de diseño, su nombre de archivo es solo un identificador técnico, no la marca visible.
- Los tokens de Tailwind (`livo-blue-500`, `livo-lime-500`, `livo-gray`, etc. en `tailwind.config.js`) y todas las clases que los usan en el código — son nombres internos de implementación, renombrarlos sería un refactor grande y riesgoso sin ningún beneficio visible para el usuario. Los valores hexadecimales de color NO cambiaron.

Si más adelante se quiere renombrar también los tokens internos o el archivo del sistema de diseño, es un cambio aparte a discutir (no incluido en este "ajuste rápido").

### 6.3 Filtro general "Tipo de envío" (2026-07-09)

Nuevo selector en `FiltersBar.jsx`, junto a País y Rango de fechas: **Todos los tipos / Marketing / Automatizado / Flujo de trabajo**. Es un filtro **global** — como `FiltersBar` es compartida por `App.jsx` y el dataset filtrado se deriva una sola vez (`filterByDateRange` → `filterByCountry` → `filterByType`), afecta por igual a las vistas Resumen, Campañas y Países (Configuración no consume datos filtrados, no aplica).

Clasificación (`getCampaignTypeFromName()` en `dataService.js`, ver sección 1.1 para el conteo validado): prefijo del nombre de campaña, comparado en mayúsculas — `MKT` → Marketing, `AUTO` → Automatizado, `WORKFLOW` → Flujo de trabajo (cubre tanto `WorkFlow_` como `Workflow_`, las dos variantes de capitalización que trae HubSpot).

Verificado en el navegador real: al filtrar por "Flujo de trabajo" la tabla de Campañas pasa de 436 a 220 filas (158 + 62, coincide exactamente).

### 6.4 Componentes de UI — mapeo de esta iteración (2026-07-09)

| Componente | Tipo | Dónde se usa | Reemplaza / se agrega a |
|---|---|---|---|
| `ConversionFunnel.jsx` | Nuevo | `CampaignDetailView.jsx` | Reemplaza la grilla de 5 `MetricCard` del detalle de campaña |
| `Tooltip.jsx` | Nuevo (común) | `CampaignsView.jsx`, `CountriesView.jsx` | Se agrega — no reemplaza nada |
| `AdvancedInsights.jsx` | Nuevo | Vista "Resumen" (`App.jsx`), debajo de `ReportsView` | Se agrega — no reemplaza nada |
| `GranularityToggle` (subcomponente interno) | Nuevo | Dentro de `ReportsView.jsx` (no es archivo aparte) | Se agrega sobre el `LineChart` de tendencia existente |
| `MetricCard.jsx` | Existente, sin cambios | `DashboardSummary.jsx` (Resumen) | Ya NO se usa en `CampaignDetailView.jsx` (ver arriba) |
| `CampaignDetailView.jsx` | Modificado | Vista "Campañas" (detalle) | Se quitó el `<iframe>`; se agregó tarjeta de preview + `ConversionFunnel` |
| `ReportsView.jsx` | Modificado | Vista "Resumen" | `ChartCard` ahora acepta `headerExtra` (usado para el toggle) |
| `CampaignsView.jsx` / `CountriesView.jsx` | Modificados | Vistas "Campañas" / "Países" | Celdas de % envueltas en `<Tooltip>` |
| `reportAggregations.js` | Modificado | Agente de Datos | `buildTrendSeries` con granularidad; `buildCountryMetrics` con sumas absolutas |
| `advancedAnalytics.js` | Nuevo | Agente de Datos | — |
| `useAdvancedAnalytics.js` | Nuevo | Agente de Datos (hook) | — |

---

## 7. ARCHIVOS DE REFERENCIA EN ESTA CARPETA

| Archivo | Propósito |
|---|---|
| `DESIGN_SYSTEM-LIVO.md` | Sistema de diseño obligatorio |
| `tailwind.config.js` | Tokens LIVO para Tailwind |
| `agents/AGENTE_DOCUMENTADOR.md` | Rol y checklist para mantener este handoff |
| `agents/AGENTE_DATOS.md` | Rol para lógica de parseo/KPIs/CSV |
| `agents/AGENTE_UIUX.md` | Rol para construcción de UI con Tailwind |
| `README.md` | Onboarding rápido: stack, estructura, cómo continuar el proyecto |

## 8. PRÓXIMOS PASOS SUGERIDOS

1. Revisar en el editor de columnas del reporte de HubSpot si se puede exportar la URL pública ("ver en el navegador") del correo — si existe, reemplazar la tarjeta de preview de `CampaignDetailView.jsx` por un iframe real de esa URL (sin login, ya confirmado que `info.lentesplus.com` no bloquea iframes). Ver sección 4 para el detalle completo de la investigación.
2. Calcular `growth` real (variación vs. período anterior) para alimentar los badges de `DashboardSummary` — hoy el prop existe pero no hay lógica que lo produzca.
3. Tests para `dataService.js`, `useHubspotData.js`, `reportAggregations.js` y `advancedAnalytics.js` (parseo, filtros, KPIs, agregaciones, insights avanzados).
4. Agregar tooltips de valor absoluto (`Tooltip.jsx`) también en la tabla "Top 5 campañas" de `ReportsView.jsx`, por consistencia con Campañas/Países.
5. Extraer `LoadingState` / `ErrorState` genéricos si el patrón inline actual (skeleton + mensaje de error por componente) se vuelve repetitivo al sumar más vistas.
6. Retirar `Filters.jsx` (legacy) una vez se confirme que no hace falta en ninguna vista.
7. Revisar tamaño de bundle (`build.rollupOptions.output.manualChunks` en `vite.config.js`) antes de desplegar a producción — sigue creciendo con cada feature (ahora ~611 kB).
8. Deploy a Vercel (import del repo de GitHub, framework preset "Vite", sin variables de entorno necesarias por ahora).

---

## 9. CÓMO CORRER EL PROYECTO LOCALMENTE

Requisitos: Node.js 18+ y npm.

```bash
cd "mails hubspot lentesplus"
npm install        # instala react, recharts, papaparse, tailwindcss, vite, etc.
npm run dev         # levanta el servidor de desarrollo (por defecto http://localhost:5173)
```

Abrir `http://localhost:5173` en el navegador — el dashboard hace fetch del CSV en tiempo real (ver `HUBSPOT_CSV_URL` en `dataService.js`), así que se necesita conexión a internet.

Otros comandos disponibles (`package.json`):

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload (Vite) |
| `npm run build` | Build de producción en `dist/` (ya validado sin errores) |
| `npm run preview` | Sirve localmente el build de `dist/` para probarlo como en producción |

Validado en este entorno el 2026-07-09 (última corrida, tras la ronda de analítica avanzada): `npm run build` — 850 módulos, `dist/assets/index-*.js` ~611 kB (~176 kB gzip), `dist/assets/index-*.css` ~19 kB (~4.5 kB gzip), sin errores (el warning de chunk >500 kB sigue siendo el único aviso, ver sección 8, ítem 7).

Validado además en el navegador real del usuario (Chrome, macOS, vía Claude in Chrome) el mismo día: las 4 vistas del sidebar cargan datos reales y coherentes, la navegación entre ellas funciona correctamente, y específicamente para esta ronda: el toggle Día/Semana/Mes de la tendencia, el embudo de conversión y la tarjeta de preview sin iframe del detalle de campaña, los tooltips de valor absoluto en Campañas/Países, y las 3 tarjetas de analítica avanzada (Insight del asunto, Salud del dominio, Mejor horario de envío) en la vista Resumen.
