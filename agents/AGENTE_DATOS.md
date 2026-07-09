# Agente de Datos y Análisis

## Rol

Eres el **"Agente de Datos y Análisis"**.

## Skills

- Procesamiento de datos en JavaScript
- PapaParse
- Lógica de arreglos (`map`, `filter`, `reduce`)
- Optimización de rendimiento

## Contexto

Tenemos un archivo CSV exportado de HubSpot con métricas de correos (aperturas, clics, rebotes, fechas, campañas). Los nombres de los correos incluyen el prefijo del país, ej. `MKT_MX`, `MKT_CO`, `MKT_CL`, `MKT_AR`.

Fuente del CSV (ver `handoff.md` sección 1 — **cambiada el 2026-07-09** de Sheets pub a Google Drive):
`https://drive.google.com/uc?export=download&id=16NDo9dY2VgvisYIz9Lmf7w5K4_0Lynej`

## Tarea

1. Crear un servicio en React (`src/services/dataService.js`) que haga `fetch` a la URL del CSV y use **PapaParse** para devolver un JSON.
2. Crear un Custom Hook (`src/hooks/useHubspotData.js`) que reciba estos datos y exponga funciones para:
   - Filtrar datos por un rango de fechas (`Fecha de envío`).
   - Filtrar por país, extraído del nombre de la campaña (prefijo `MKT_XX`).
   - Calcular métricas globales: suma de envíos, promedio de tasa de apertura, promedio de tasa de clics.

## Instrucción

Generar el código de estos dos archivos asegurando siempre el manejo de estados de `loading` y `error`.

## Archivos entregados

| Archivo | Contenido |
|---|---|
| `src/services/dataService.js` | `fetchHubspotData()`: fetch + PapaParse + normalización de filas + extracción de país desde el nombre de campaña |
| `src/hooks/useHubspotData.js` | Hook `useHubspotData()`: `{ data, loading, error, filterByDateRange, filterByCountry, getGlobalMetrics }` |

## Reglas de implementación

- Los componentes UI **nunca** llaman a PapaParse o `fetch` directamente — siempre pasan por `useHubspotData`.
- Toda función de cálculo (KPIs, filtros) debe ser una función pura, testeable de forma aislada.
- Los nombres de columnas del CSV en español deben normalizarse a claves en inglés/camelCase dentro de `dataService.js`, para que el resto de la app no dependa de strings en español. **Validado contra el CSV real el 2026-07-09** (436 filas). Headers reales usados: `"Nombre del correo"` (país), `"Fecha de envío (tu zona horaria)"`, `"Tasa de apertura"`, `"Tasa de clics"`, `"Tasa de rebote"` (tasa) + `"Rebotes"` (conteo), `"Enviado"`, `"Entregado"`, `"Abierto"`, `"Con clic"`.
- La extracción de país usa el prefijo `MKT_XX` (o `_XX_`) en la columna **`"Nombre del correo"`** — NO en `"Campaña"` (esa columna trae slugs en minúscula sin ese patrón y clasificaba todo como `"OTHER"`, bug corregido, ver `handoff.md` sección 4). Países soportados: `MX`, `CO`, `CL`, `AR`. Filas sin prefijo reconocido devuelven `"OTHER"`.
- **El CSV de Drive (fuente actual) trae valores de tasa corruptos en el origen** — nunca leer `"Tasa de apertura"`, `"Tasa de clics"` o `"Tasa de rebote"` con un `parseFloat` directo. Siempre usar `parseRateValue()` en `dataService.js`, que revierte dos bugs de formato: (1) pérdida del punto decimal cuando el original tenía 3 decimales (`"15.162"` → `"15162"`), y (2) auto-conversión a fecha de valores tipo "día.mes" (`"12.5"` → `"2026-05-12 00:00:00"`). Ambos están documentados y validados en `handoff.md` sección 4.

## Checklist de calidad

- [ ] `dataService.js` maneja fetch fallido (red, CORS, CSV vacío) y lanza/retorna error legible.
- [ ] `useHubspotData.js` inicializa `loading: true` y lo apaga en `finally`.
- [ ] Los filtros (`filterByDateRange`, `filterByCountry`) no mutan el array original.
- [ ] `getGlobalMetrics` maneja el caso de dataset vacío (evitar `NaN` / división por cero).

## Referencia

Ver [[AGENTE_UIUX]] para cómo estos datos se consumen en componentes, y [[AGENTE_DOCUMENTADOR]] para el registro de esta funcionalidad en el handoff.
