/**
 * advancedAnalytics.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — agregaciones "avanzadas" (2026-07-09),
 * separadas de `reportAggregations.js` porque responden a preguntas
 * analíticas distintas (insights de contenido, salud del dominio,
 * mejor horario de envío) en vez de reportes descriptivos por
 * país/campaña. Mismo contrato que el resto de la capa de datos:
 * funciones puras, reciben el dataset ya normalizado/filtrado de
 * `useHubspotData`, no hacen fetch, no conocen React ni Tailwind.
 *
 * Consumidas por el hook `useAdvancedAnalytics.js`, que las memoiza.
 * ------------------------------------------------------------------
 */

// ---------------------------------------------------------------------
// 1. Insight del Asunto — apertura con emoji vs. sin emoji
// ---------------------------------------------------------------------

/**
 * Compara el promedio de `openRate` entre campañas cuyo `subject` tiene al
 * menos un emoji (`row.hasEmoji`, calculado en `dataService.js`) y las que
 * no. Pensado para una tarjeta corta tipo "Los asuntos con emoji abren
 * X pts más/menos que los que no tienen".
 *
 * @param {Array<object>} data - filas normalizadas (ya filtradas) de useHubspotData
 * @returns {{withEmojiCount:number, withoutEmojiCount:number,
 *            withEmojiAvgOpenRate:number|null, withoutEmojiAvgOpenRate:number|null,
 *            diff:number|null}}
 */
export function buildEmojiInsight(data = []) {
  const withEmoji = data.filter((row) => row.hasEmoji);
  const withoutEmoji = data.filter((row) => !row.hasEmoji);

  const avgOpenRate = (rows) =>
    rows.length ? Number((rows.reduce((sum, row) => sum + row.openRate, 0) / rows.length).toFixed(2)) : null;

  const withEmojiAvgOpenRate = avgOpenRate(withEmoji);
  const withoutEmojiAvgOpenRate = avgOpenRate(withoutEmoji);

  return {
    withEmojiCount: withEmoji.length,
    withoutEmojiCount: withoutEmoji.length,
    withEmojiAvgOpenRate,
    withoutEmojiAvgOpenRate,
    diff:
      withEmojiAvgOpenRate !== null && withoutEmojiAvgOpenRate !== null
        ? Number((withEmojiAvgOpenRate - withoutEmojiAvgOpenRate).toFixed(2))
        : null,
  };
}

// ---------------------------------------------------------------------
// 2. Salud del dominio (deliverability)
// ---------------------------------------------------------------------

// Umbrales de alerta pedidos explícitamente por David (2026-07-09).
export const SPAM_RATE_ALERT_THRESHOLD = 0.1; // % sobre entregados
export const HARD_BOUNCE_RATE_ALERT_THRESHOLD = 2; // % sobre enviados

/**
 * Promedia `hardBounceRate` / `softBounceRate` / `spamRate` / `unsubscribeRate`
 * (todas calculadas desde conteos crudos en `dataService.js`, mismo criterio
 * que `openRate`/`clickRate`/`bounceRate` — nunca se leen las columnas de
 * tasa precalculadas de HubSpot) sobre el dataset recibido, y genera
 * alertas visuales cuando se superan los umbrales de arriba.
 *
 * @param {Array<object>} data - filas normalizadas (ya filtradas) de useHubspotData
 * @returns {{campaignCount:number, avgHardBounceRate:number, avgSoftBounceRate:number,
 *            avgSpamRate:number, avgUnsubscribeRate:number,
 *            alerts:Array<{level:"danger", metric:string, message:string}>}}
 */
export function buildDeliverabilityHealth(data = []) {
  if (!data || data.length === 0) {
    return {
      campaignCount: 0,
      avgHardBounceRate: 0,
      avgSoftBounceRate: 0,
      avgSpamRate: 0,
      avgUnsubscribeRate: 0,
      alerts: [],
    };
  }

  const avg = (key) => Number((data.reduce((sum, row) => sum + row[key], 0) / data.length).toFixed(3));

  const avgHardBounceRate = avg("hardBounceRate");
  const avgSoftBounceRate = avg("softBounceRate");
  const avgSpamRate = avg("spamRate");
  const avgUnsubscribeRate = avg("unsubscribeRate");

  const alerts = [];
  if (avgSpamRate > SPAM_RATE_ALERT_THRESHOLD) {
    alerts.push({
      level: "danger",
      metric: "spamRate",
      message: `Tasa de spam promedio (${avgSpamRate.toFixed(2)}%) por encima del umbral de ${SPAM_RATE_ALERT_THRESHOLD}% — riesgo para la reputación del dominio de envío.`,
    });
  }
  if (avgHardBounceRate > HARD_BOUNCE_RATE_ALERT_THRESHOLD) {
    alerts.push({
      level: "danger",
      metric: "hardBounceRate",
      message: `Tasa de rebote duro promedio (${avgHardBounceRate.toFixed(2)}%) por encima del umbral de ${HARD_BOUNCE_RATE_ALERT_THRESHOLD}% — conviene limpiar la lista de contactos.`,
    });
  }

  return { campaignCount: data.length, avgHardBounceRate, avgSoftBounceRate, avgSpamRate, avgUnsubscribeRate, alerts };
}

// ---------------------------------------------------------------------
// 3. Análisis de mejor horario de envío
// ---------------------------------------------------------------------

// Lunes-primero, mismo criterio que dateRangePresets.js.
export const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function mondayIndexOf(date) {
  const day = date.getDay(); // 0=Dom..6=Sáb (JS nativo)
  return day === 0 ? 6 : day - 1; // remapeado a 0=Lunes..6=Domingo
}

/**
 * Formatea una hora 0-23 como "10:00 a.m." / "3:00 p.m.".
 */
export function formatHourLabel(hour) {
  const period = hour < 12 ? "a.m." : "p.m.";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

/**
 * Agrupa las filas por (día de la semana, hora de envío) y promedia
 * `openRate` en cada celda, usando `"Fecha de envío (tu zona horaria)"`
 * (ya parseada en `sentDate` por dataService.js — la hora que trae es la
 * hora local configurada en HubSpot, no se hace ninguna conversión de
 * zona horaria adicional acá). Devuelve las celdas con datos (para un
 * mapa de calor básico) y la mejor combinación día+hora.
 *
 * Para evitar recomendar un horario basado en una sola campaña que tuvo
 * suerte, `best` prioriza celdas con al menos `minSampleSize` campañas;
 * si ninguna celda alcanza ese mínimo, cae de vuelta a la celda con mejor
 * promedio general y lo marca con `usedFallback: true` para que la UI
 * pueda avisarlo.
 *
 * @param {Array<object>} data - filas normalizadas (ya filtradas) de useHubspotData
 * @param {{minSampleSize?: number}} [options]
 * @returns {{heatmap: Array<{day:string, dayIndex:number, hour:number, avgOpenRate:number, count:number}>,
 *            best: object|null, usedFallback: boolean, sampleSize: number}}
 */
export function buildBestSendTime(data = [], { minSampleSize = 2 } = {}) {
  if (!data || data.length === 0) {
    return { heatmap: [], best: null, usedFallback: false, sampleSize: 0 };
  }

  // grid[díaISOLunes0][hora0-23] = { openSum, count }
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ openSum: 0, count: 0 })));

  for (const row of data) {
    if (!row.sentDate) continue;
    const parsed = new Date(row.sentDate);
    if (Number.isNaN(parsed.getTime())) continue;

    const dayIndex = mondayIndexOf(parsed);
    const hour = parsed.getHours();
    const cell = grid[dayIndex][hour];
    cell.openSum += row.openRate;
    cell.count += 1;
  }

  const heatmap = [];
  let best = null;
  let bestFallback = null;

  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const cell = grid[d][h];
      if (cell.count === 0) continue;

      const entry = {
        day: DAY_LABELS[d],
        dayIndex: d,
        hour: h,
        avgOpenRate: Number((cell.openSum / cell.count).toFixed(2)),
        count: cell.count,
      };
      heatmap.push(entry);

      if (!bestFallback || entry.avgOpenRate > bestFallback.avgOpenRate) bestFallback = entry;
      if (entry.count >= minSampleSize && (!best || entry.avgOpenRate > best.avgOpenRate)) best = entry;
    }
  }

  return {
    heatmap,
    best: best || bestFallback,
    usedFallback: !best && !!bestFallback,
    sampleSize: data.length,
  };
}
