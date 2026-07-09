# HANDOFF — Dashboard de HubSpot (Lentesplus)

> Fuente de la verdad del proyecto. Se actualiza cada vez que se hace un cambio importante en la arquitectura, se agrega una nueva librería, o se resuelve un bug complejo ("Actualiza el handoff").
> Owner: David · Última actualización: 2026-07-09 (popover de fechas compactado; detalle de campaña clickeable con iframe de vista previa; Configuración con nombre/link de la hoja de cálculo)

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
    │   └── dataService.js               # fetch + PapaParse + normalización + país + campaignId/previewUrl/subject
    ├── hooks/
    │   └── useHubspotData.js            # data, loading, error, filtros, KPIs globales
    ├── utils/
    │   ├── reportAggregations.js        # agregaciones puras: tendencia, país (volumen), país (métricas), top 5, insights de campaña
    │   └── dateRangePresets.js          # cálculo de rangos (Ayer/7d/28d/90d/semana/mes/año/personalizado) + grilla de calendario
    └── components/
        ├── layout/
        │   └── DashboardLayout.jsx      # Sidebar (logo Prisma/Lentesplus) + área principal + navegación real
        ├── metrics/
        │   ├── MetricCard.jsx           # card de KPI (título/valor/crecimiento) — con hover:shadow-md
        │   └── DashboardSummary.jsx     # grid de 4 MetricCard + estados loading/error
        ├── filters/
        │   ├── FiltersBar.jsx           # barra superior de filtros (país + tipo de envío + rango de fechas)
        │   ├── DateRangeFilter.jsx      # popover de fechas estilo Google Analytics (presets + calendario 2 meses, tamaño compactado 2026-07-09)
        │   └── Filters.jsx              # ⚠️ LEGACY — sustituido por FiltersBar.jsx (ver sección 8)
        ├── reports/
        │   └── ReportsView.jsx          # vista "Resumen": LineChart + BarChart (recharts) + tabla Top 5
        ├── campaigns/
        │   ├── CampaignsView.jsx        # vista "Campañas": tabla completa del dataset filtrado, filas clickeables (2026-07-09)
        │   └── CampaignDetailView.jsx   # NUEVO (2026-07-09) — detalle de 1 campaña: KPIs, análisis comparativo vs. pares, iframe de vista previa
        ├── countries/
        │   └── CountriesView.jsx        # vista "Países": tarjetas + tabla comparativa por país
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

### Falta

- [ ] Estados visuales `LoadingState` / `ErrorState` genéricos y reutilizables (hoy cada componente nuevo implementa su propio skeleton/error inline; conviene extraerlos)
- [ ] Retirar `Filters.jsx` (legacy) una vez se confirme que ninguna vista lo necesita
- [ ] Cálculo real de `growth` (variación vs. período anterior) para `DashboardSummary` — hoy el prop existe pero nadie lo calcula todavía
- [ ] Tests para servicios de datos y agregaciones (parseo, filtros, cálculo de KPIs, `reportAggregations.js`, `dateRangePresets.js`)
- [ ] Code-splitting / `manualChunks` — Vite advierte que el bundle JS (~586 kB) supera los 500 kB recomendados; no bloquea el desarrollo pero conviene revisarlo antes de producción
- [ ] `DateRangeFilter.jsx`: el popover en mobile podría afinarse más (hoy se ve pero es angosto con 2 meses lado a lado en pantallas muy chicas); considerar mostrar 1 solo mes en `sm` como ya hace parcialmente
- [ ] `CampaignDetailView.jsx`: el iframe de vista previa puede aparecer en blanco para algunas campañas por la restricción de cookies de terceros del navegador (ver sección 4) — hoy se mitiga con una nota visible + el link "Abrir en pestaña nueva", pero no hay una forma confiable de detectar el fallo en JS y mostrar el fallback automáticamente

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

---

## 5. DEPENDENCIAS INSTALADAS

> Nota: el proyecto aún no tiene `package.json` formal (scaffold pendiente, ver sección 3). Estas son las dependencias que el código ya generado asume/requiere.

| Paquete | Uso |
|---|---|
| `react` | Componentes funcionales + Hooks |
| `tailwindcss` | Estilos, vía `tailwind.config.js` con tokens LIVO |
| `papaparse` | Parseo del CSV de HubSpot a JSON |
| `recharts` | Gráficos — **implementado** en `ReportsView.jsx` (`LineChart`, `BarChart`) desde 2026-07-09 |

---

## 5.1 ARQUITECTURA DEL ESTADO DE DATOS UNIFICADO

Stack: **React (Hooks) + Tailwind CSS + PapaParse + Recharts**, sin librería de estado global (Redux/Zustand) — el estado vive en el árbol de componentes vía Hooks nativos. Flujo de datos de una sola vía (unidireccional):

```
dataService.js (fetch + PapaParse + normalización)
        │
        ▼
useHubspotData()  ← única fuente de verdad del dataset completo
        │  data, loading, error
        │  filterByCountry(code, dataset?)
        │  filterByDateRange(start, end, dataset?)
        │  getGlobalMetrics(dataset?) / globalMetrics
        ▼
App.jsx (página contenedora — implementada 2026-07-09)
   ├── estado local: view ("resumen"|"campanas"|"paises"|"configuracion")
   ├── estado local: country, datePreset, startDate, endDate
   ├── dataset derivado = filterByCountry(filterByDateRange(data))
   │
   ├─▶ DashboardLayout   (activeItemId=view, onNavigate=setView) ← navegación real del sidebar
   ├─▶ FiltersBar        (country, datePreset, startDate, endDate + callbacks onChange) — en resumen/campañas/países
   ├─▶ view "resumen":       DashboardSummary (metrics = getGlobalMetrics(dataset derivado)) + ReportsView
   ├─▶ view "campanas":      CampaignsView (data = dataset derivado)
   ├─▶ view "paises":        CountriesView (data = dataset derivado)
   └─▶ view "configuracion": SettingsView (csvUrl, rowCount, lastFetchedAt, onRefetch=refetch)
                │
                ▼
        reportAggregations.js (agregación pura, sin estado)
          buildTrendSeries · buildCountryVolume · buildCountryMetrics · getTopCampaigns
```

Reglas clave:
- **Ningún componente de UI hace `fetch` ni usa PapaParse directamente** — todo pasa por `dataService.js` → `useHubspotData.js`.
- **Ningún componente de UI agrega datos "a mano"** para los charts/tablas — toda agregación (por fecha, por país, top N) vive en `reportAggregations.js`, funciones puras y testeables por separado.
- Los filtros (país / rango de fechas) y la navegación (`view`) son **estado de `App.jsx`**, no de `useHubspotData` ni de `FiltersBar`/`DashboardLayout` — estos solo reportan cambios vía callbacks (`onCountryChange`, `onDatePresetChange`, `onNavigate`), siguiendo el patrón "componente controlado".
- Todo componente que consume datos derivados (`DashboardSummary`, `ReportsView`, `CampaignsView`, `CountriesView`) acepta `loading` y `error` como props explícitas y maneja su propio estado visual (skeleton / mensaje de error / estado vacío) — no asume que el dataset siempre tiene filas.
- Las tasas (`openRate`, `clickRate`, `bounceRate`) se calculan en `dataService.js` desde conteos crudos, nunca desde las columnas de texto de tasa de HubSpot (ver sección 4, última fila) — cualquier componente que las use ya las recibe correctas, no necesita re-validarlas.

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

1. Calcular `growth` real (variación vs. período anterior) para alimentar los badges de `DashboardSummary` — hoy el prop existe pero no hay lógica que lo produzca.
2. Extraer `LoadingState` / `ErrorState` genéricos si el patrón inline actual (skeleton + mensaje de error por componente) se vuelve repetitivo al sumar más vistas.
3. Retirar `Filters.jsx` (legacy) una vez se confirme que no hace falta en ninguna vista.
4. Tests para `dataService.js`, `useHubspotData.js` y `reportAggregations.js` (parseo, filtros, KPIs, agregaciones).
5. Revisar tamaño de bundle (`build.rollupOptions.output.manualChunks` en `vite.config.js`) antes de desplegar a producción.
6. Deploy a Vercel (import del repo de GitHub, framework preset "Vite", sin variables de entorno necesarias por ahora).

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

Validado en este entorno el 2026-07-09: `npm install`, `npm run build` (bundle OK, CSS con tokens LIVO correctos) y `npm run dev` (responde 200 y sirve HMR de React) — sin errores en ninguno de los tres pasos.

Validado además en el navegador real del usuario (Chrome, macOS, vía Claude in Chrome) el mismo día: las 4 vistas del sidebar (Resumen, Campañas, Países, Configuración) cargan datos reales y coherentes, y la navegación entre ellas funciona correctamente.
