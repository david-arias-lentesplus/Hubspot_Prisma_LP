/**
 * dataService.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — servicio de obtención y normalización
 * del CSV de métricas de HubSpot (Lentesplus).
 *
 * Responsabilidad única: hacer fetch al CSV publicado desde Google
 * Sheets, parsearlo con PapaParse, y devolver un array de objetos JS
 * ya normalizados (nombres de campo en camelCase, números como number,
 * país extraído del nombre de campaña).
 *
 * Ningún componente UI debe importar PapaParse ni usar fetch
 * directamente: siempre a través de este servicio (consumido por el
 * hook `useHubspotData`).
 * ------------------------------------------------------------------
 */

import Papa from "papaparse";

// URL del CSV (ver handoff.md sección 1 — actualizada el 2026-07-09: ahora
// se consume el archivo CSV alojado en Google Drive, no el pub de Sheets).
// Formato de descarga directa de Drive; el fetch sigue el redirect 303 hacia
// drive.usercontent.google.com automáticamente y trae CORS abierto (*).
export const HUBSPOT_CSV_URL =
  "https://drive.google.com/uc?export=download&id=16NDo9dY2VgvisYIz9Lmf7w5K4_0Lynej";

// Prefijos de país reconocidos en el nombre de campaña (ej. "MKT_MX_Verano2026")
const COUNTRY_PREFIXES = ["MX", "CO", "CL", "AR"];

/**
 * NOTA (validado contra el CSV real el 2026-07-09, ver handoff.md sección 3/4):
 * El CSV real de HubSpot expone, entre otras, estas columnas exactas:
 * "Nombre del correo", "Campaña", "Fecha de envío (tu zona horaria)",
 * "Tasa de apertura", "Tasa de clics", "Tasa de rebote", "Rebotes",
 * "Enviado", "Entregado", "Abierto", "Con clic".
 *
 * OJO — dos bugs detectados y corregidos contra la primera versión de este
 * archivo:
 * 1) La clasificación de país por prefijo `MKT_XX` funciona con la columna
 *    "Nombre del correo" (ej. "MKT_MX_EMMBrand_..."), NO con "Campaña"
 *    (que trae slugs en minúscula tipo "lts-xxx-mx-..." sin el patrón
 *    `MKT_XX`/`_XX_` esperado por `getCountryFromCampaign`). Por eso
 *    "Nombre del correo" va primero en el alias de `campaignName`.
 * 2) "Rebotes" es un CONTEO absoluto (rebote duro + suave), no una tasa.
 *    La tasa real está en "Tasa de rebote". Se prioriza esta última para
 *    `bounceRate` y se agrega `bounceCount` aparte para el conteo.
 *
 * Si el CSV cambia sus headers, ajustar únicamente `COLUMN_ALIASES` — el
 * resto del servicio no necesita cambios.
 */
const COLUMN_ALIASES = {
  campaignName: ["Nombre del correo", "Nombre de campaña", "Nombre de la campaña", "Campaña", "Campaign", "Campaign name"],
  sentDate: ["Fecha de envío (tu zona horaria)", "Fecha de envío", "Fecha envío", "Send date", "Fecha"],
  openRate: ["Tasa de apertura", "Open rate", "% Apertura"],
  clickRate: ["Tasa de clics", "Click rate", "% Clics"],
  bounceRate: ["Tasa de rebote", "Bounce rate", "% Rebote"],
  bounceCount: ["Rebotes", "Bounces"],
  sentCount: ["Enviado", "Enviados", "Envíos", "Sent", "Total enviados"],
  deliveredCount: ["Entregado", "Delivered"],
  opensCount: ["Abierto", "Opens"],
  clicksCount: ["Con clic", "Clicks"],
};

/**
 * Busca en una fila cruda del CSV el primer header que coincida con
 * alguno de los alias conocidos para un campo.
 */
function pickField(row, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(row, alias)) {
      return row[alias];
    }
  }
  return undefined;
}

/**
 * Convierte valores tipo "23%", "23,5%", "0.23" o 23 en un número (23 o 23.5).
 * Devuelve 0 si el valor es inválido/vacío, para no romper cálculos posteriores.
 */
function toNumber(value) {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace("%", "").replace(",", ".").trim();
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * BUG DE ORIGEN (detectado el 2026-07-09 al cambiar la fuente del CSV a
 * Google Drive, ver handoff.md sección 4): el nuevo archivo pierde el punto
 * decimal en los valores de las columnas de tasas ("Tasa de apertura",
 * "Tasa de clics", "Tasa de rebote", "Tasa de entregas", "Tasa de
 * clickthrough") cada vez que el valor original tenía exactamente 3
 * decimales — ej. "15.162" llega como "15162". Los valores con 0, 1 o 2
 * decimales llegan intactos.
 *
 * Se validó comparando las 436 filas contra la fuente anterior (Sheets pub):
 * el patrón es 100% consistente y, más importante, los rangos NO se
 * solapan — los valores corrompidos (reconstruidos) caen siempre en
 * [1000, ~99999], mientras que los valores genuinos sin decimales (que
 * nunca fueron tocados) caen siempre por debajo de 1000 (máx. observado 988).
 * Esto permite reconstruir el valor original de forma segura:
 *   - si el string trae ".", se respeta tal cual (no fue corrompido).
 *   - si es un entero sin "." y >= 1000, se asume que perdió 3 decimales
 *     fusionados y se divide entre 1000.
 *   - si es un entero sin "." y < 1000, es un valor genuino sin decimales.
 *
 * Aplicar solo a columnas de tasas/porcentajes (`parseRateValue`), nunca a
 * columnas de conteo absoluto (Enviado, Entregado, Abierto, Con clic,
 * Rebotes), que no se ven afectadas por este bug.
 *
 * SEGUNDO BUG DE ORIGEN (mismo archivo, detectado en la misma validación):
 * un puñado de valores de tasa que "parecen fecha" en formato día.mes
 * (ej. "21.06", "12.5") fueron auto-convertidos a fecha completa por la
 * herramienta que generó el CSV — ej. "21.06" → "2026-06-21 00:00:00".
 * Afecta ~1% de las filas (4-7 filas por columna de tasa). Se revierte
 * extrayendo día y mes de la fecha y reconstruyendo "día.mes" como número.
 * OJO: esto es una reconstrucción con ambigüedad inherente — no hay forma
 * de saber si el original tenía 1 o 2 decimales (ej. "12.5" y "12.05" dan
 * la misma fecha "12 de mayo"), así que se asume 2 decimales (mes tal cual,
 * sin forzar el padding). El error resultante es pequeño y afecta <2% de
 * las filas; documentar si se necesita mayor precisión en el futuro.
 */
function parseRateValue(value) {
  if (value === undefined || value === null || value === "") return 0;
  const str = String(value).trim();

  const dateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const day = parseInt(dateMatch[3], 10);
    const month = parseInt(dateMatch[2], 10);
    return Number(`${day}.${month}`);
  }

  if (str.includes(".") || str.includes(",")) return toNumber(str);

  const asInt = parseInt(str, 10);
  if (Number.isNaN(asInt)) return 0;
  return asInt >= 1000 ? asInt / 1000 : asInt;
}

/**
 * Extrae el código de país (MX, CO, CL, AR) desde el nombre de campaña
 * buscando el prefijo "MKT_XX". Devuelve "OTHER" si no reconoce ninguno.
 */
export function getCountryFromCampaign(campaignName = "") {
  const upper = campaignName.toUpperCase();
  for (const code of COUNTRY_PREFIXES) {
    if (upper.includes(`MKT_${code}`) || upper.includes(`_${code}_`) || upper.endsWith(`_${code}`)) {
      return code;
    }
  }
  return "OTHER";
}

/**
 * Normaliza una fila cruda del CSV (headers en español, strings) a un
 * objeto con claves en camelCase y tipos correctos.
 */
function normalizeRow(rawRow) {
  const campaignName = pickField(rawRow, COLUMN_ALIASES.campaignName) || "";

  return {
    campaignName,
    country: getCountryFromCampaign(campaignName),
    sentDate: pickField(rawRow, COLUMN_ALIASES.sentDate) || null,
    openRate: parseRateValue(pickField(rawRow, COLUMN_ALIASES.openRate)),
    clickRate: parseRateValue(pickField(rawRow, COLUMN_ALIASES.clickRate)),
    bounceRate: parseRateValue(pickField(rawRow, COLUMN_ALIASES.bounceRate)),
    bounceCount: toNumber(pickField(rawRow, COLUMN_ALIASES.bounceCount)),
    sentCount: toNumber(pickField(rawRow, COLUMN_ALIASES.sentCount)),
    deliveredCount: toNumber(pickField(rawRow, COLUMN_ALIASES.deliveredCount)),
    opensCount: toNumber(pickField(rawRow, COLUMN_ALIASES.opensCount)),
    clicksCount: toNumber(pickField(rawRow, COLUMN_ALIASES.clicksCount)),
    raw: rawRow, // se conserva la fila original por si se necesita depurar
  };
}

/**
 * Descarga el CSV publicado y lo devuelve parseado y normalizado.
 *
 * @param {string} url - URL del CSV (por defecto, HUBSPOT_CSV_URL)
 * @returns {Promise<Array<object>>} filas normalizadas
 * @throws {Error} si el fetch falla, la respuesta no es OK, o el CSV está vacío/corrupto
 */
export async function fetchHubspotData(url = HUBSPOT_CSV_URL) {
  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    throw new Error(
      `No se pudo conectar con la fuente de datos de HubSpot: ${networkError.message}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `La fuente de datos respondió con error ${response.status} (${response.statusText})`
    );
  }

  const csvText = await response.text();

  if (!csvText || !csvText.trim()) {
    throw new Error("El CSV de HubSpot está vacío.");
  }

  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false, // normalizamos tipos nosotros mismos en normalizeRow
  });

  if (errors && errors.length > 0) {
    // PapaParse puede reportar errores de fila individuales sin que todo el parseo falle;
    // los dejamos como warning en consola pero no interrumpimos si hay datos utilizables.
    console.warn("Advertencias al parsear el CSV de HubSpot:", errors);
  }

  if (!data || data.length === 0) {
    throw new Error("El CSV de HubSpot no contiene filas de datos.");
  }

  return data.map(normalizeRow);
}
