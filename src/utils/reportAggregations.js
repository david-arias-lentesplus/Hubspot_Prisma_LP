/**
 * reportAggregations.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — funciones puras de agregación para la
 * vista de reportes (`ReportsView.jsx`).
 *
 * Reciben el dataset ya normalizado por `dataService.js` y ya filtrado
 * (país / rango de fechas, vía `useHubspotData`) y devuelven estructuras
 * listas para consumir por Recharts o por una tabla. No hacen fetch, no
 * conocen React ni Tailwind: son funciones puras y testeables por
 * separado del resto de la lógica de negocio.
 * ------------------------------------------------------------------
 */

const COUNTRY_LABELS = { MX: "México", CO: "Colombia", CL: "Chile", AR: "Argentina", OTHER: "Otros" };
const COUNTRY_ORDER = ["MX", "CO", "CL", "AR", "OTHER"];

/**
 * Agrupa las filas por día de `sentDate` y promedia `openRate` / `clickRate`
 * para ese día. Devuelve la serie ordenada cronológicamente, lista para un
 * `LineChart` de Recharts (claves ya en español para usarse directo como
 * `dataKey` + leyenda).
 *
 * @param {Array<object>} data - filas normalizadas de useHubspotData
 * @returns {Array<{date: string, "Tasa de apertura": number, "Tasa de clics": number}>}
 */
export function buildTrendSeries(data) {
  if (!data || data.length === 0) return [];

  const byDate = new Map();

  for (const row of data) {
    if (!row.sentDate) continue;
    const parsed = new Date(row.sentDate);
    if (Number.isNaN(parsed.getTime())) continue;

    const key = parsed.toISOString().slice(0, 10); // yyyy-mm-dd
    if (!byDate.has(key)) {
      byDate.set(key, { date: key, openSum: 0, clickSum: 0, count: 0 });
    }
    const bucket = byDate.get(key);
    bucket.openSum += row.openRate;
    bucket.clickSum += row.clickRate;
    bucket.count += 1;
  }

  return Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((bucket) => ({
      date: bucket.date,
      "Tasa de apertura": Number((bucket.openSum / bucket.count).toFixed(2)),
      "Tasa de clics": Number((bucket.clickSum / bucket.count).toFixed(2)),
    }));
}

/**
 * Agrupa las filas por país y suma `sentCount` (Enviados) y `opensCount`
 * (Abiertos). Devuelve solo los países con datos, en el orden fijo
 * MX → CO → CL → AR → OTHER, listo para un `BarChart` de Recharts.
 *
 * @param {Array<object>} data - filas normalizadas de useHubspotData
 * @returns {Array<{country: string, label: string, Enviados: number, Abiertos: number}>}
 */
export function buildCountryVolume(data) {
  const byCountry = new Map(
    COUNTRY_ORDER.map((code) => [code, { country: code, label: COUNTRY_LABELS[code], Enviados: 0, Abiertos: 0 }])
  );

  for (const row of data || []) {
    const code = COUNTRY_ORDER.includes(row.country) ? row.country : "OTHER";
    const bucket = byCountry.get(code);
    bucket.Enviados += row.sentCount;
    bucket.Abiertos += row.opensCount;
  }

  return COUNTRY_ORDER.map((code) => byCountry.get(code)).filter(
    (bucket) => bucket.Enviados > 0 || bucket.Abiertos > 0
  );
}

/**
 * Devuelve el Top N de campañas ordenadas de mayor a menor por `clickRate`.
 * No muta el array original.
 *
 * @param {Array<object>} data - filas normalizadas de useHubspotData
 * @param {number} [limit=5]
 * @returns {Array<{campaignName: string, country: string, clickRate: number, openRate: number, sentCount: number}>}
 */
export function getTopCampaigns(data, limit = 5) {
  if (!data || data.length === 0) return [];

  return [...data]
    .sort((a, b) => b.clickRate - a.clickRate)
    .slice(0, limit)
    .map((row) => ({
      campaignName: row.campaignName || "(Sin nombre)",
      country: row.country,
      clickRate: row.clickRate,
      openRate: row.openRate,
      sentCount: row.sentCount,
    }));
}

/**
 * Agrupa las filas por país y calcula, por país: total enviados y los
 * promedios de tasa de apertura/clics/rebote. Pensado para la vista
 * "Países" (tabla de rendimiento por país). Solo devuelve países con
 * al menos una fila.
 *
 * @param {Array<object>} data - filas normalizadas de useHubspotData
 * @returns {Array<{country: string, label: string, totalSent: number, avgOpenRate: number, avgClickRate: number, avgBounceRate: number, campaignCount: number}>}
 */
export function buildCountryMetrics(data) {
  const byCountry = new Map();

  for (const row of data || []) {
    const code = COUNTRY_ORDER.includes(row.country) ? row.country : "OTHER";
    if (!byCountry.has(code)) {
      byCountry.set(code, {
        country: code,
        label: COUNTRY_LABELS[code],
        totalSent: 0,
        openSum: 0,
        clickSum: 0,
        bounceSum: 0,
        campaignCount: 0,
      });
    }
    const bucket = byCountry.get(code);
    bucket.totalSent += row.sentCount;
    bucket.openSum += row.openRate;
    bucket.clickSum += row.clickRate;
    bucket.bounceSum += row.bounceRate;
    bucket.campaignCount += 1;
  }

  return COUNTRY_ORDER.map((code) => byCountry.get(code))
    .filter(Boolean)
    .map((bucket) => ({
      country: bucket.country,
      label: bucket.label,
      totalSent: bucket.totalSent,
      campaignCount: bucket.campaignCount,
      avgOpenRate: Number((bucket.openSum / bucket.campaignCount).toFixed(2)),
      avgClickRate: Number((bucket.clickSum / bucket.campaignCount).toFixed(2)),
      avgBounceRate: Number((bucket.bounceSum / bucket.campaignCount).toFixed(2)),
    }));
}

/**
 * Compara una campaña puntual contra sus "pares" (mismo `campaignType`,
 * dentro del mismo dataset ya filtrado por país/fecha que recibe la vista
 * activa) para dar contexto en la página de detalle de campaña
 * (`CampaignDetailView.jsx`). No hay serie histórica por campaña individual
 * en el CSV, así que el análisis se basa en esta comparación contra el
 * promedio de campañas del mismo tipo de envío.
 *
 * @param {object} campaign - fila normalizada de la campaña seleccionada
 * @param {Array<object>} dataset - dataset ya filtrado (país/fecha/tipo) de useHubspotData
 * @returns {{peerCount:number, peerAvgOpenRate:number|null, peerAvgClickRate:number|null,
 *            peerAvgBounceRate:number|null, openRateDiff:number|null, clickRateDiff:number|null,
 *            bounceRateDiff:number|null}}
 */
export function buildCampaignInsights(campaign, dataset = []) {
  if (!campaign) return null;

  const peers = (dataset || []).filter(
    (row) => row.campaignType === campaign.campaignType && row.campaignId !== campaign.campaignId
  );

  const avg = (key) =>
    peers.length ? Number((peers.reduce((sum, r) => sum + r[key], 0) / peers.length).toFixed(2)) : null;

  const peerAvgOpenRate = avg("openRate");
  const peerAvgClickRate = avg("clickRate");
  const peerAvgBounceRate = avg("bounceRate");

  return {
    peerCount: peers.length,
    peerAvgOpenRate,
    peerAvgClickRate,
    peerAvgBounceRate,
    openRateDiff: peerAvgOpenRate === null ? null : Number((campaign.openRate - peerAvgOpenRate).toFixed(2)),
    clickRateDiff: peerAvgClickRate === null ? null : Number((campaign.clickRate - peerAvgClickRate).toFixed(2)),
    bounceRateDiff: peerAvgBounceRate === null ? null : Number((campaign.bounceRate - peerAvgBounceRate).toFixed(2)),
  };
}

export { COUNTRY_LABELS };
