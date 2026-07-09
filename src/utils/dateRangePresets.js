/**
 * dateRangePresets.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — cálculo de rangos de fecha para el
 * selector de fechas (`DateRangeFilter.jsx`). Funciones puras: reciben
 * un preset y una fecha de referencia ("hoy") y devuelven { start, end }
 * en formato yyyy-mm-dd, listos para `filterByDateRange` del hook
 * `useHubspotData`. No conocen React, el DOM ni Tailwind.
 * ------------------------------------------------------------------
 */

// Opciones del selector — mismo orden en que se muestran en la lista de
// presets y en el <select> "Personalizado" de DateRangeFilter.jsx.
// "all" no existe en el diseño de referencia (Google-Analytics-like) pero
// se agregó porque el CSV de HubSpot es un histórico fijo: sin esta opción
// el usuario no tiene forma de ver todas las filas sin calcular a mano un
// rango de fechas que las cubra todas (ver handoff.md sección 1.1).
export const DATE_PRESET_OPTIONS = [
  { value: "all", label: "Todo el periodo" },
  { value: "yesterday", label: "Ayer" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "28d", label: "Últimos 28 días" },
  { value: "90d", label: "Últimos 90 días" },
  { value: "thisWeek", label: "Esta semana" },
  { value: "thisMonth", label: "Este mes" },
  { value: "thisYear", label: "Este año" },
  { value: "lastWeek", label: "La semana pasada" },
  { value: "lastMonth", label: "El mes pasado" },
  { value: "custom", label: "Personalizado" },
];

/**
 * Convierte un Date a "yyyy-mm-dd" usando los componentes LOCALES
 * (no UTC) — a diferencia de `date.toISOString().slice(0,10)`, que puede
 * correr la fecha un día para zonas horarias con offset positivo respecto
 * a UTC. Como todas las fechas del dashboard son fechas de calendario
 * "sin hora" (día de envío), este es el conversor seguro a usar aquí.
 */
function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Índice de día de semana con Lunes=0 ... Domingo=6 (Date#getDay() usa Domingo=0).
function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function startOfWeek(date) {
  return addDays(date, -mondayIndex(date));
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Calcula { start, end } (strings "yyyy-mm-dd", o `null` = sin límite)
 * para un preset del selector de fechas.
 *
 * @param {string} preset - uno de los `value` de DATE_PRESET_OPTIONS
 * @param {string} [customStart] - yyyy-mm-dd, solo se usa si preset === "custom"
 * @param {string} [customEnd] - yyyy-mm-dd, solo se usa si preset === "custom"
 * @param {Date} [referenceDate] - "hoy"; inyectable para tests (default: new Date())
 * @returns {{start: string|null, end: string|null}}
 */
export function computeDateRangeForPreset(preset, customStart, customEnd, referenceDate = new Date()) {
  const today = startOfDay(referenceDate);

  switch (preset) {
    case "all":
      return { start: null, end: null };

    case "custom":
      return { start: customStart || null, end: customEnd || null };

    case "yesterday": {
      const y = addDays(today, -1);
      return { start: toISODate(y), end: toISODate(y) };
    }

    case "7d":
      return { start: toISODate(addDays(today, -6)), end: toISODate(today) };

    case "28d":
      return { start: toISODate(addDays(today, -27)), end: toISODate(today) };

    case "90d":
      return { start: toISODate(addDays(today, -89)), end: toISODate(today) };

    case "thisWeek":
      return { start: toISODate(startOfWeek(today)), end: toISODate(today) };

    case "thisMonth":
      return { start: toISODate(startOfMonth(today)), end: toISODate(today) };

    case "thisYear":
      return { start: toISODate(new Date(today.getFullYear(), 0, 1)), end: toISODate(today) };

    case "lastWeek": {
      const thisMonday = startOfWeek(today);
      const lastMonday = addDays(thisMonday, -7);
      const lastSunday = addDays(thisMonday, -1);
      return { start: toISODate(lastMonday), end: toISODate(lastSunday) };
    }

    case "lastMonth": {
      const firstOfThisMonth = startOfMonth(today);
      const lastMonthEnd = addDays(firstOfThisMonth, -1);
      const lastMonthStart = startOfMonth(lastMonthEnd);
      return { start: toISODate(lastMonthStart), end: toISODate(lastMonthEnd) };
    }

    default:
      return { start: null, end: null };
  }
}

/**
 * Genera la grilla de un mes calendario (semanas Lunes→Domingo) para
 * renderizar un mes en `DateRangeFilter.jsx`. Las celdas fuera del mes
 * son `null` (no se muestran números de meses adyacentes, igual que el
 * diseño de referencia).
 *
 * @param {number} year
 * @param {number} month - 0-indexado (0 = enero)
 * @returns {Array<Array<{date: Date, day: number} | null>>}
 */
export function buildCalendarMonth(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = endOfMonth(first).getDate();
  const leadingBlanks = mondayIndex(first);

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), day });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export { toISODate };
