# HANDOFF — Dashboard de HubSpot (Lentesplus)

> Fuente de la verdad del proyecto. Se actualiza cada vez que se hace un cambio importante en la arquitectura, se agrega una nueva librería, o se resuelve un bug complejo ("Actualiza el handoff").
> Owner: David · Última actualización: 2026-07-09 (Fase 1 y 2 de UI: layout, filtros, tarjetas de métricas y gráficos de reportes)

---

## 1. NOMBRE Y DESCRIPCIÓN DEL PROYECTO

**Dashboard de HubSpot** — aplicación web (React + Tailwind CSS) que consume en tiempo real un CSV publicado desde Google Sheets con métricas de campañas de email de HubSpot (Lentesplus SAS). Permite visualizar tasa de apertura, tasa de clics, rebotes y fecha de envío, segmentado por país (MX, CO, CL, AR) según el prefijo del nombre de campaña (`MKT_MX`, `MKT_CO`, `MKT_CL`, `MKT_AR`).

**Fuente del CSV (consumo en tiempo real, usada por `dataService.js`) — CAMBIADA el 2026-07-09:**
`https://drive.google.com/uc?export=download&id=16NDo9dY2VgvisYIz9Lmf7w5K4_0Lynej`

Antes se usaba la URL pub de Google Sheets (`.../pub?gid=0&single=true&output=csv`); David indicó que la fuente cambió a este archivo CSV alojado en Google Drive (`BD_Emails_Hubspot_Livo.csv`). El endpoint de descarga directa redirige (303) a `drive.usercontent.google.com` y trae CORS abierto (`access-control-allow-origin: *`), así que `fetch()` funciona igual que antes sin cambios en la lógica de red.

Validado en producción el 2026-07-09: 437 filas, 56 columnas. **Este archivo trae dos bugs de formato en el origen** (ver sección 4 para el detalle y el fix aplicado en `dataService.js`):
1. Pérdida del punto decimal en columnas de tasas cuando el valor original tenía 3 decimales (ej. `"15.162"` → `"15162"`).
2. Auto-conversión a fecha de valores de tasa que "parecen" día.mes (ej. `"12.5"` → `"2026-05-12 00:00:00"`).

Ambos se corrigen en `parseRateValue()` dentro de `dataService.js`, validado contra las 436 filas de la fuente anterior con >99% de coincidencia exacta.

---

## 2. ESTRUCTURA DE CARPETAS ACTUALIZADA

```
mails hubspot lentesplus/
├── handoff.md                          # este archivo
├── README.md                            # onboarding rápido del repo
├── DESIGN_SYSTEM-LIVO.md                # sistema de diseño (fuente de la verdad de UI)
├── tailwind.config.js                   # tokens LIVO (colores, fuentes, radios, sombras)
├── agents/
│   ├── AGENTE_DOCUMENTADOR.md
│   ├── AGENTE_DATOS.md
│   └── AGENTE_UIUX.md
└── src/
    ├── services/
    │   └── dataService.js               # fetch + PapaParse + normalización + país
    ├── hooks/
    │   └── useHubspotData.js            # data, loading, error, filtros, KPIs globales
    ├── utils/
    │   └── reportAggregations.js        # NUEVO — agregaciones puras para ReportsView (tendencia, país, top 5)
    └── components/
        ├── layout/
        │   └── DashboardLayout.jsx      # Sidebar (logo LIVO/Lentesplus) + área principal
        ├── metrics/
        │   ├── MetricCard.jsx           # card de KPI (título/valor/crecimiento) — ahora con hover:shadow-md
        │   └── DashboardSummary.jsx     # NUEVO — grid de 4 MetricCard + estados loading/error
        ├── filters/
        │   ├── FiltersBar.jsx           # NUEVO — barra superior de filtros (país + rango de fechas con presets)
        │   └── Filters.jsx              # ⚠️ LEGACY — sustituido por FiltersBar.jsx (ver sección 8)
        └── reports/
            └── ReportsView.jsx          # NUEVO — LineChart + BarChart (recharts) + tabla Top 5
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

### Falta

- [ ] Scaffold formal del proyecto (decidir Vite vs Next.js, `package.json`, entrypoint) — bloquea poder correr/instalar dependencias real (`npm install recharts`, etc.)
- [ ] Página/vista que ensamble `DashboardLayout` + `FiltersBar` + `DashboardSummary` + `ReportsView`, conectando estado de filtros (país, rango de fechas) con `useHubspotData`
- [ ] Estados visuales `LoadingState` / `ErrorState` genéricos y reutilizables (hoy cada componente nuevo implementa su propio skeleton/error inline; conviene extraerlos)
- [ ] Retirar `Filters.jsx` (legacy) una vez la página principal use `FiltersBar.jsx` en todas las vistas
- [ ] Cálculo real de `growth` (variación vs. período anterior) para `DashboardSummary` — hoy el prop existe pero nadie lo calcula todavía
- [ ] Tests para servicios de datos y agregaciones (parseo, filtros, cálculo de KPIs, `reportAggregations.js`)

---

## 4. REGISTRO DE ERRORES CONOCIDOS Y CÓMO SE SOLUCIONARON

| Fecha | Error | Causa | Solución |
|---|---|---|---|
| 2026-07-09 | El fetch al CSV parecía no funcionar | El `web_fetch` inicial devolvió el CSV completo pero excedió el límite de tokens de una sola respuesta y se truncó visualmente; no era un fallo real del fetch/CORS. Se confirmó con `curl` (436 filas descargadas sin error). | Se validó el fetch en un entorno Node real (`curl` + PapaParse) fuera del límite de contexto del chat. La URL pub de Sheets funciona correctamente para consumo en tiempo real. |
| 2026-07-09 | Clasificación de país siempre devolvía `OTHER` para el 100% de las filas | `dataService.js` tomaba el país desde la columna `"Campaña"` (slugs en minúscula tipo `lts-xxx-mx-...-080726`, sin el patrón `MKT_XX`/`_XX_` que espera `getCountryFromCampaign`). El header real que sí trae el prefijo de país es `"Nombre del correo"` (ej. `MKT_MX_EMMBrand_..._080726`). | Se reordenó `COLUMN_ALIASES.campaignName` en `dataService.js` para priorizar `"Nombre del correo"`. Verificado con PapaParse sobre las 436 filas reales: MX 105, CO 113, CL 106, AR 110, OTHER 2 (2 filas de workflow sin país). |
| 2026-07-09 | `bounceRate` mezclaba conteo con tasa | La columna `"Rebotes"` es un conteo absoluto (rebote duro + suave), no un porcentaje. La tasa real está en `"Tasa de rebote"`. | Se separaron los campos: `bounceRate` ahora lee `"Tasa de rebote"`; se agregó `bounceCount` para el conteo absoluto (`"Rebotes"`). |
| 2026-07-09 | `sentCount` no encontraba columna | Los alias asumían `"Enviados"` (plural); el header real es `"Enviado"` (singular). | Se agregó `"Enviado"` como alias principal. También se agregaron `deliveredCount` (`"Entregado"`), `opensCount` (`"Abierto"`) y `clicksCount` (`"Con clic"`) como campos adicionales normalizados. |
| 2026-07-09 | Al cambiar la fuente al CSV de Drive, las tasas (`Tasa de apertura`, `Tasa de clics`, `Tasa de rebote`, etc.) mostraban valores absurdos tipo `15162` en vez de `15.16` | El archivo de Drive pierde el punto decimal cada vez que el valor original tenía exactamente 3 decimales (ej. `"15.162"` → `"15162"`). Confirmado comparando 436 filas contra la fuente anterior (Sheets pub): el patrón es 100% consistente y sin decimales de 0-2 dígitos no se ve afectado. | Se creó `parseRateValue()` en `dataService.js`: si el valor no trae punto y es `>= 1000`, se divide entre 1000 (reconstruye el decimal perdido); si es `< 1000`, se deja igual (es un valor genuino sin decimales). Se comprobó que no hay solape de rangos (corruptos siempre ≥1000, genuinos siempre <1000 en las 436 filas de referencia) — regla segura. |
| 2026-07-09 | Un puñado de filas (~1%) traían una fecha completa (ej. `"2026-05-12 00:00:00"`) en columnas de tasa | Valores de tasa con formato "día.mes" (ej. `"12.5"`, `"21.06"`) fueron auto-convertidos a fecha por la herramienta que generó el CSV de Drive. | `parseRateValue()` detecta el patrón de fecha ISO al inicio del string, extrae día y mes, y reconstruye `día.mes` como número. Nota: hay ambigüedad inherente entre 1 y 2 decimales originales (ej. `12.5` vs `12.05` dan la misma fecha) — validado que esta interpretación da el menor error total (7 de 1308 comparaciones, <1% desvío). |

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
Página contenedora (pendiente, ver "Falta" en sección 3)
   ├── estado local: country, datePreset, startDate, endDate
   ├── dataset derivado = filterByCountry(filterByDateRange(data))
   │
   ├─▶ FiltersBar        (country, datePreset, startDate, endDate + callbacks onChange)
   ├─▶ DashboardSummary   (metrics = getGlobalMetrics(dataset derivado), loading, error)
   └─▶ ReportsView        (data = dataset derivado, loading, error)
                │
                ▼
        reportAggregations.js (agregación pura, sin estado)
          buildTrendSeries · buildCountryVolume · getTopCampaigns
```

Reglas clave:
- **Ningún componente de UI hace `fetch` ni usa PapaParse directamente** — todo pasa por `dataService.js` → `useHubspotData.js`.
- **Ningún componente de UI agrega datos "a mano"** para los charts — toda agregación (por fecha, por país, top N) vive en `reportAggregations.js`, funciones puras y testeables por separado.
- Los filtros (país / rango de fechas) son **estado de la página contenedora**, no de `useHubspotData` ni de `FiltersBar` — estos solo reportan cambios vía callbacks (`onCountryChange`, `onDatePresetChange`, etc.), siguiendo el patrón "componente controlado" ya usado en `Filters.jsx`.
- Todo componente que consume datos derivados (`DashboardSummary`, `ReportsView`) acepta `loading` y `error` como props explícitas y maneja su propio estado visual (skeleton / mensaje de error / estado vacío) — no asume que el dataset siempre tiene filas.

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

1. Decidir Vite vs Next.js y generar el scaffold formal (`package.json`, entrypoint, `npm install react react-dom papaparse recharts tailwindcss`).
2. Ensamblar la página principal (`App.jsx` o `pages/index`) que integre `DashboardLayout` + `FiltersBar` + `DashboardSummary` + `ReportsView`, con el estado de filtros y el dataset derivado (ver arquitectura en sección 5.1).
3. Retirar `Filters.jsx` (legacy) una vez `FiltersBar.jsx` esté en uso en la página principal.
4. Calcular `growth` real (variación vs. período anterior) para alimentar los badges de `DashboardSummary` — hoy el prop existe pero no hay lógica que lo produzca.
5. Extraer `LoadingState` / `ErrorState` genéricos si el patrón inline actual (skeleton + mensaje de error por componente) se vuelve repetitivo al sumar más vistas.
6. Tests para `dataService.js`, `useHubspotData.js` y `reportAggregations.js` (parseo, filtros, KPIs, agregaciones).
