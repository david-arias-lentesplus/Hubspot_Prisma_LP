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

Fuente del CSV (ver `handoff.md` sección 1):
`https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMjhgnoi0H2fH9GLFgD-3f1VyIEC_EKeixdOZDpc0OeVaY0WWqSeojUdTUoVzdh_07W0OATyvSP2J/pub?gid=0&single=true&output=csv`

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
- Los nombres de columnas del CSV en español (`Tasa de apertura`, `Tasa de clics`, `Rebotes`, `Fecha de envío`, `Nombre de campaña`) deben normalizarse a claves en inglés/camelCase dentro de `dataService.js`, para que el resto de la app no dependa de strings en español. **Pendiente de validar contra el CSV real** — si los headers exactos difieren, ajustar el mapeo en `dataService.js` (ver nota en el propio archivo).
- La extracción de país usa el prefijo `MKT_XX` en el nombre de campaña; países soportados: `MX`, `CO`, `CL`, `AR`. Campañas sin prefijo reconocido devuelven `"OTHER"`.

## Checklist de calidad

- [ ] `dataService.js` maneja fetch fallido (red, CORS, CSV vacío) y lanza/retorna error legible.
- [ ] `useHubspotData.js` inicializa `loading: true` y lo apaga en `finally`.
- [ ] Los filtros (`filterByDateRange`, `filterByCountry`) no mutan el array original.
- [ ] `getGlobalMetrics` maneja el caso de dataset vacío (evitar `NaN` / división por cero).

## Referencia

Ver [[AGENTE_UIUX]] para cómo estos datos se consumen en componentes, y [[AGENTE_DOCUMENTADOR]] para el registro de esta funcionalidad en el handoff.
