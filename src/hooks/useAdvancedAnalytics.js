/**
 * useAdvancedAnalytics.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — custom hook que memoiza las 4 agregaciones
 * "avanzadas" de `src/utils/advancedAnalytics.js` (Insight del Asunto,
 * Salud del dominio, Mejor horario de envío, Rendimiento por palabras
 * clave — esta última agregada 2026-07-09, fase "Enterprise") sobre un
 * dataset ya filtrado (país/fecha/tipo de envío), para que las vistas no tengan que llamar a
 * las funciones puras directamente ni preocuparse por recalcularlas en
 * cada render.
 *
 * Sigue el mismo contrato que `useHubspotData.js`: recibe el dataset como
 * parámetro (no hace fetch, no filtra) y expone los resultados listos
 * para renderizar. Pensado para usarse junto a `useHubspotData` +
 * `filteredData`, no en su reemplazo.
 * ------------------------------------------------------------------
 */

import { useMemo } from "react";
import {
  buildEmojiInsight,
  buildDeliverabilityHealth,
  buildBestSendTime,
  buildKeywordPerformance,
} from "../utils/advancedAnalytics";

/**
 * @param {Array<object>} data - dataset ya normalizado y filtrado (país/fecha/tipo)
 * @returns {{
 *   emojiInsight: ReturnType<typeof buildEmojiInsight>,
 *   deliverabilityHealth: ReturnType<typeof buildDeliverabilityHealth>,
 *   bestSendTime: ReturnType<typeof buildBestSendTime>,
 *   keywordPerformance: ReturnType<typeof buildKeywordPerformance>,
 * }}
 */
export function useAdvancedAnalytics(data = []) {
  const emojiInsight = useMemo(() => buildEmojiInsight(data), [data]);
  const deliverabilityHealth = useMemo(() => buildDeliverabilityHealth(data), [data]);
  const bestSendTime = useMemo(() => buildBestSendTime(data), [data]);
  // Rendimiento por palabras clave (2026-07-09): tokeniza cada Asunto del
  // 30% superior por tasa de apertura — cálculo O(n) sobre el dataset ya
  // filtrado, memoizado igual que el resto para no recorrerlo en cada
  // render (ej. al escribir en el buscador de Campañas, que es estado
  // local de otra vista y no toca `data`).
  const keywordPerformance = useMemo(() => buildKeywordPerformance(data), [data]);

  return { emojiInsight, deliverabilityHealth, bestSendTime, keywordPerformance };
}

export default useAdvancedAnalytics;
