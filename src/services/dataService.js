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

// URL del CSV publicado (ver handoff.md sección 1)
export const HUBSPOT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMjhgnoi0H2fH9GLFgD-3f1VyIEC_EKeixdOZDpc0OeVaY0WWqSeojUdTUoVzdh_07W0OATyvSP2J/pub?gid=0&single=true&output=csv";

// Prefijos de país reconocidos en el nombre de campaña (ej. "MKT_MX_Verano2026")
const COUNTRY_PREFIXES = ["MX", "CO", "CL", "AR"];

/**
 * NOTA IMPORTANTE (pendiente de validar contra el CSV real, ver handoff.md sección 3):
 * Los nombres de columna abajo son los esperados según el contexto del proyecto
 * ("Tasa de apertura", "Tasa de clics", "Rebotes", "Fecha de envío", nombre de
 * campaña). Si el CSV real usa otros headers, ajustar únicamente el objeto
 * `COLUMN_ALIASES` — el resto del servicio no necesita cambios.
 */
const COLUMN_ALIASES = {
  campaignName: ["Nombre de campaña", "Nombre de la campaña", "Campaña", "Campaign", "Campaign name"],
  sentDate: ["Fecha de envío", "Fecha envío", "Send date", "Fecha"],
  openRate: ["Tasa de apertura", "Open rate", "% Apertura"],
  clickRate: ["Tasa de clics", "Click rate", "% Clics"],
  bounceRate: ["Rebotes", "Tasa de rebote", "Bounce rate", "% Rebote"],
  sentCount: ["Enviados", "Envíos", "Sent", "Total enviados"],
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
    openRate: toNumber(pickField(rawRow, COLUMN_ALIASES.openRate)),
    clickRate: toNumber(pickField(rawRow, COLUMN_ALIASES.clickRate)),
    bounceRate: toNumber(pickField(rawRow, COLUMN_ALIASES.bounceRate)),
    sentCount: toNumber(pickField(rawRow, COLUMN_ALIASES.sentCount)),
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
