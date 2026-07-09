/**
 * benchmarks.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — benchmarks estáticos de industria
 * (2026-07-09, fase "Enterprise") para el indicador semafórico de
 * `MetricCard.jsx` (verde/amarillo/rojo junto al valor de Tasa de
 * apertura / Tasa de clics).
 *
 * Metas pedidas explícitamente por David: Tasa de apertura esperada =
 * 20%, Tasa de clics esperada = 2%. Son valores ESTÁTICOS (no vienen
 * del CSV ni se recalculan) — representan una meta de industria de
 * referencia, no un promedio histórico propio. Si en el futuro se
 * quiere una meta dinámica (ej. percentil propio de Lentesplus), este
 * archivo es el único lugar a tocar.
 *
 * Funciones puras: no hacen fetch, no conocen React ni Tailwind. Los
 * colores semánticos (verde/amarillo/rojo) se resuelven en la capa de
 * UI (`MetricCard.jsx`) a partir del `status` que devuelven estas
 * funciones — este archivo solo decide QUÉ status corresponde, no CÓMO
 * se ve.
 * ------------------------------------------------------------------
 */

// Metas de industria (%) — ver nota de arriba.
export const INDUSTRY_BENCHMARKS = {
  openRate: 20,
  clickRate: 2,
};

// Un valor se considera "amarillo" (cerca de la meta, no la alcanzó) si
// llega al menos a este % de la meta; por debajo de eso es "rojo".
// Ej. con meta 20% y umbral 0.75, el corte amarillo/rojo es 15%.
const WARNING_THRESHOLD_RATIO = 0.75;

/**
 * Compara `value` contra la meta de industria para `metricKey`
 * ("openRate" | "clickRate") y devuelve un status semafórico.
 *
 * @param {"openRate"|"clickRate"} metricKey
 * @param {number} value - valor real (%), ej. 24.8
 * @returns {{status:"success"|"warning"|"danger"|null, benchmark:number|null, diff:number|null}}
 *          `status` es `null` si `metricKey` no tiene benchmark definido
 *          (ej. "Total enviados", "Tasa de rebote" — sin meta de industria
 *          en este alcance, ver `handoff.md`).
 */
export function getBenchmarkStatus(metricKey, value) {
  const benchmark = INDUSTRY_BENCHMARKS[metricKey];
  if (typeof benchmark !== "number" || typeof value !== "number" || Number.isNaN(value)) {
    return { status: null, benchmark: benchmark ?? null, diff: null };
  }

  const diff = Number((value - benchmark).toFixed(2));
  let status;
  if (value >= benchmark) status = "success";
  else if (value >= benchmark * WARNING_THRESHOLD_RATIO) status = "warning";
  else status = "danger";

  return { status, benchmark, diff };
}
