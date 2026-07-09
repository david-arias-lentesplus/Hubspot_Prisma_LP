/**
 * useAdvancedAnalytics.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — custom hook que memoiza las 3 agregaciones
 * "avanzadas" de `src/utils/advancedAnalytics.js` (Insight del Asunto,
 * Salud del dominio, Mejor horario de envío) sobre un dataset ya filtrado
 * (país/fecha/tipo de envío), para que las vistas no tengan que llamar a
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
import { buildEmojiInsight, buildDeliverabilityHealth, buildBestSendTime } from "../utils/advancedAnalytics";

/**
 * @param {Array<object>} data - dataset ya normalizado y filtrado (país/fecha/tipo)
 * @returns {{
 *   emojiInsight: ReturnType<typeof buildEmojiInsight>,
 *   deliverabilityHealth: ReturnType<typeof buildDeliverabilityHealth>,
 *   bestSendTime: ReturnType<typeof buildBestSendTime>,
 * }}
 */
export function useAdvancedAnalytics(data = []) {
  const emojiInsight = useMemo(() => buildEmojiInsight(data), [data]);
  const deliverabilityHealth = useMemo(() => buildDeliverabilityHealth(data), [data]);
  const bestSendTime = useMemo(() => buildBestSendTime(data), [data]);

  return { emojiInsight, deliverabilityHealth, bestSendTime };
}

export default useAdvancedAnalytics;
