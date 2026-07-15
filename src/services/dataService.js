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

// URL del CSV (ver handoff.md sección 1 y 4 — historial completo del cambio).
//
// OJO — dos problemas encontrados y descartados el 2026-07-09 con la URL de
// Google Drive ("https://drive.google.com/uc?export=download&id=..." y su
// destino final "https://drive.usercontent.google.com/download?id=..."):
//   1. La primera responde 403 a cualquier fetch() real de navegador (envía
//      header Origin; curl no, por eso "funcionaba" en pruebas con curl).
//   2. Su destino final SÍ acepta Origin, pero Google aplica una cuota de
//      vistas/descargas por archivo compartido públicamente — una vez
//      agotada (confirmado con Chrome real: 503 en 4/4 intentos, mientras
//      curl seguía recibiendo 200 desde otra IP) el navegador lo reporta
//      como "Failed to fetch" porque la respuesta 503 no trae los headers
//      CORS de éxito.
//
// Fix: se volvió a la URL "Publicar en la web" de Google Sheets, pensada
// específicamente para consumo público sin límite de cuota. Verificada
// repetidas veces con `Origin` real: siempre 200 + `access-control-allow-origin: *`.
//
// Si en el futuro el dato maestro se mueve definitivamente a un archivo de
// Drive (no un Sheet), NO volver a apuntar el fetch del navegador ahí
// directamente — habría que meter un proxy server-side (p. ej. función
// serverless en Vercel) que descargue el archivo del lado del servidor
// (sin CORS ni cuota por IP de usuario final) y se lo sirva al frontend.
//
// ACTUALIZACIÓN 2026-07-15 — `gid` cambió al actualizar los datos del CSV:
// tras cargar datos nuevos en la hoja, la publicación con `gid=0` empezó a
// responder 400 ("No se pudo abrir el archivo en este momento"). Causa:
// Google le asignó un `gid` interno nuevo a la pestaña al recrearla/
// reordenarla, aunque el nombre visible de la pestaña no cambió — esto
// invalida cualquier link "Publicar en la web" que ya apuntaba al `gid`
// viejo. Se republicó la hoja desde Sheets y David compartió el nuevo
// link (`gid=137777016`), verificado con `curl` antes de aplicarlo acá:
// 200 OK, `content-type: text/csv`, 11,102 filas / 79 columnas (antes:
// 436 filas). Si esto vuelve a pasar tras una futura actualización de
// datos, repetir el mismo diagnóstico: `curl -sIL <URL>` — un 400 con
// "No se pudo abrir el archivo" (a diferencia de un CORS/network error)
// significa que el `gid` publicado ya no es válido y hay que republicar
// desde Google Sheets (Archivo → Compartir → Publicar en la web).
export const HUBSPOT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMjhgnoi0H2fH9GLFgD-3f1VyIEC_EKeixdOZDpc0OeVaY0WWqSeojUdTUoVzdh_07W0OATyvSP2J/pub?gid=137777016&single=true&output=csv";

// Prefijos de país reconocidos en el nombre de campaña (ej. "MKT_MX_Verano2026")
const COUNTRY_PREFIXES = ["MX", "CO", "CL", "AR"];

/**
 * NOTA (validado contra el CSV real el 2026-07-09, ver handoff.md sección 3/4):
 * El CSV real de HubSpot expone, entre otras, estas columnas exactas:
 * "Nombre del correo", "Campaña", "Fecha de envío (tu zona horaria)",
 * "Tasa de apertura", "Tasa de clics", "Tasa de rebote", "Rebotes",
 * "Enviado", "Entregado", "Abierto", "Con clic".
 *
 * OJO — bugs detectados y corregidos contra la primera versión de este
 * archivo:
 * 1) La clasificación de país por prefijo `MKT_XX` funciona con la columna
 *    "Nombre del correo" (ej. "MKT_MX_EMMBrand_..."), NO con "Campaña"
 *    (que trae slugs en minúscula tipo "lts-xxx-mx-..." sin el patrón
 *    `MKT_XX`/`_XX_` esperado por `getCountryFromCampaign`). Por eso
 *    "Nombre del correo" va primero en el alias de `campaignName`.
 * 2) "Rebotes" es un CONTEO absoluto (rebote duro + suave), no una tasa.
 * 3) Las columnas de tasa PRECALCULADAS por HubSpot ("Tasa de apertura",
 *    "Tasa de clics", "Tasa de rebote", etc.) llegan con formato corrupto
 *    de forma INCONSISTENTE tanto en el CSV de Drive como en el pub de
 *    Sheets — ver la nota extensa junto a `safeRate()` más abajo sobre por
 *    qué se dejó de usar esas columnas por completo.
 *
 * Si el CSV cambia sus headers, ajustar únicamente `COLUMN_ALIASES` — el
 * resto del servicio no necesita cambios.
 */
const COLUMN_ALIASES = {
  campaignName: ["Nombre del correo", "Nombre de campaña", "Nombre de la campaña", "Campaña", "Campaign", "Campaign name"],
  sentDate: ["Fecha de envío (tu zona horaria)", "Fecha de envío", "Fecha envío", "Send date", "Fecha"],
  bounceCount: ["Rebotes", "Bounces"],
  sentCount: ["Enviado", "Enviados", "Envíos", "Sent", "Total enviados"],
  deliveredCount: ["Entregado", "Delivered"],
  opensCount: ["Abierto", "Opens"],
  clicksCount: ["Con clic", "Clicks"],
  // Campos añadidos (2026-07-09) para la vista de detalle de campaña.
  campaignId: ["ID del correo de marketing", "ID de correo", "Campaign ID"],
  previewUrl: ["Enlace de vista previa", "Preview URL"],
  subject: ["Asunto", "Subject"],
  senderName: ["Nombre del remitente", "Sender name"],
  senderAddress: ["Dirección del remitente", "Sender address"],
  spamCount: ["Informes de spam", "Spam reports"],
  unsubscribeCount: ["Suscripción cancelada", "Unsubscribed"],
  // Campos añadidos (2026-07-09) para analítica avanzada (deliverability +
  // insights de asunto) y el reemplazo del iframe de preview.
  previewText: ["Línea del asunto y clasificación del texto de vista previa", "Preview text"],
  hardBounceCount: ["Rebote duro", "Hard bounces"],
  softBounceCount: ["Rebote suave", "Soft bounces"],
  // Campo añadido (2026-07-09, fase "Enterprise") para el filtro "Tipo de
  // comunicación". Columna confirmada contra el CSV real en vivo (curl,
  // 436 filas): "Clasificación del tipo de comunicación", con 6 valores
  // distintos en inglés ("Promotional Offer" 163, "Account Management" 30,
  // "Event Invitation or Reminder" 10, "Educational" 9, "Initial Engagement" 1,
  // "Feedback" 1) y 222 filas vacías (mayormente AUTO/WORKFLOW sin
  // clasificar — ver `COMMUNICATION_TYPE_OPTIONS` en `FiltersBar.jsx`, que
  // mapea estos 6 valores + "Sin clasificar" para las vacías).
  communicationType: ["Clasificación del tipo de comunicación", "Communication type classification"],
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
 * DECISIÓN DE ARQUITECTURA (2026-07-09): ya NO se usan las columnas de tasa
 * precalculadas por HubSpot ("Tasa de apertura", "Tasa de clics", "Tasa de
 * rebote", etc.) para nada — `openRate`, `clickRate` y `bounceRate` se
 * calculan siempre a partir de los conteos crudos (`Abierto`, `Con clic`,
 * `Rebotes`, `Enviado`, `Entregado`), que no muestran ninguna corrupción de
 * formato en ninguna de las dos fuentes probadas.
 *
 * Por qué: se detectaron DOS bugs de formato distintos e inconsistentes
 * entre sí en las columnas de tasa, en ambas fuentes (Drive y Sheets pub):
 *   1. En el CSV de Drive, un valor con exactamente 3 decimales pierde el
 *      punto ("15.162" → "15162"). El rango resultante siempre caía ≥1000,
 *      así que en su momento se "arregló" dividiendo entre 1000 solo los
 *      enteros ≥1000 (ver historial en handoff.md sección 4).
 *   2. Al volver a la fuente de Sheets pub (mismo día, por la cuota de
 *      descargas de Drive — ver handoff.md), se encontró que columnas de
 *      tasas con escala naturalmente pequeña ("Tasa de clics", "Tasa de
 *      rebote", típicamente <2%) sufren la MISMA pérdida de punto decimal,
 *      pero el resultado corrompido cae POR DEBAJO de 1000 (ej. "0.147" →
 *      "147"), rompiendo la regla ">=1000" de arriba. Esto producía KPIs
 *      imposibles en el dashboard (ej. "213% de tasa de clics").
 *
 * En vez de perseguir una tercera heurística de texto (fragil y difícil de
 * validar a futuro), se calculan las tasas nosotros mismos:
 *   openRate   = Abierto / Entregado * 100
 *   clickRate  = Con clic / Entregado * 100
 *   bounceRate = Rebotes / Enviado * 100
 *
 * Validado contra las 435 filas reales de la fuente de Sheets pub comparando
 * este cálculo contra las columnas de tasa (ya corregidas manualmente fila
 * por fila): diferencia máxima 0.0005 puntos porcentuales — coincide
 * esencialmente perfecto salvo redondeo. Esto además hace la app inmune a
 * que HubSpot/Sheets/Drive vuelvan a corromper el formato de esas columnas
 * de texto en el futuro, ya que ni siquiera se leen.
 */
function safeRate(numerator, denominator) {
  if (!denominator || denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(3));
}

/**
 * Detecta si un texto contiene al menos un emoji (2026-07-09, para el
 * "Insight del Asunto" — comparar tasa de apertura con/sin emoji en el
 * `"Asunto"`). Rango Unicode amplio (símbolos misceláneos, pictogramas,
 * transporte, banderas regionales, dingbats, flechas/símbolos con
 * variation selector como 👁️) — suficiente para el texto en español de
 * este dataset, no pretende ser un detector universal de emoji.
 */
const EMOJI_REGEX =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}️]/u;

export function hasEmoji(text = "") {
  return EMOJI_REGEX.test(text);
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
 * Clasificación por tipo de envío ("Nombre del correo"), pensada como filtro
 * general del dashboard (aplica a Resumen, Campañas y Países).
 *
 * Validado el 2026-07-09 contra las 436 filas reales de la fuente Sheets pub
 * — los 4 prefijos cubren el 100% de las filas sin solapes:
 *   MKT       (149 filas) → Marketing
 *   AUTO      ( 67 filas) → Automatizado
 *   WorkFlow  (158 filas) → Flujo de trabajo (nota: HubSpot exporta esta
 *   Workflow  ( 62 filas)   categoría con el prefijo en dos variantes de
 *             capitalización distintas — "WorkFlow_..." y "Workflow_...".
 *             Se normaliza a mayúsculas antes de comparar, así que ambas
 *             caen en el mismo grupo "WORKFLOW".
 * Total: 149 + 67 + 158 + 62 = 436 ✓ (coincide con el total de filas).
 */
export const CAMPAIGN_TYPES = {
  MKT: "Marketing",
  AUTO: "Automatizado",
  WORKFLOW: "Flujo de trabajo",
  OTHER: "Otros",
};

export function getCampaignTypeFromName(campaignName = "") {
  const upper = campaignName.toUpperCase();
  if (upper.startsWith("MKT")) return "MKT";
  if (upper.startsWith("AUTO")) return "AUTO";
  if (upper.startsWith("WORKFLOW")) return "WORKFLOW";
  return "OTHER";
}

/**
 * Normaliza una fila cruda del CSV (headers en español, strings) a un
 * objeto con claves en camelCase y tipos correctos.
 */
function normalizeRow(rawRow) {
  const campaignName = pickField(rawRow, COLUMN_ALIASES.campaignName) || "";

  const bounceCount = toNumber(pickField(rawRow, COLUMN_ALIASES.bounceCount));
  const sentCount = toNumber(pickField(rawRow, COLUMN_ALIASES.sentCount));
  const deliveredCount = toNumber(pickField(rawRow, COLUMN_ALIASES.deliveredCount));
  const opensCount = toNumber(pickField(rawRow, COLUMN_ALIASES.opensCount));
  const clicksCount = toNumber(pickField(rawRow, COLUMN_ALIASES.clicksCount));
  const spamCount = toNumber(pickField(rawRow, COLUMN_ALIASES.spamCount));
  const unsubscribeCount = toNumber(pickField(rawRow, COLUMN_ALIASES.unsubscribeCount));
  const hardBounceCount = toNumber(pickField(rawRow, COLUMN_ALIASES.hardBounceCount));
  const softBounceCount = toNumber(pickField(rawRow, COLUMN_ALIASES.softBounceCount));
  const subject = pickField(rawRow, COLUMN_ALIASES.subject) || "";

  return {
    campaignId: pickField(rawRow, COLUMN_ALIASES.campaignId) || "",
    campaignName,
    country: getCountryFromCampaign(campaignName),
    campaignType: getCampaignTypeFromName(campaignName),
    sentDate: pickField(rawRow, COLUMN_ALIASES.sentDate) || null,
    // Tasas calculadas desde los conteos crudos, no leídas de las columnas
    // de texto de HubSpot — ver nota junto a `safeRate()` más arriba. Se
    // mantiene el mismo criterio (2026-07-09) para las tasas de
    // deliverability nuevas: nunca se leen las columnas de tasa
    // precalculadas de HubSpot ("Tasa de rebote duro", "Tasa de spam", etc.).
    openRate: safeRate(opensCount, deliveredCount),
    clickRate: safeRate(clicksCount, deliveredCount),
    bounceRate: safeRate(bounceCount, sentCount),
    hardBounceRate: safeRate(hardBounceCount, sentCount),
    softBounceRate: safeRate(softBounceCount, sentCount),
    spamRate: safeRate(spamCount, deliveredCount),
    unsubscribeRate: safeRate(unsubscribeCount, deliveredCount),
    bounceCount,
    hardBounceCount,
    softBounceCount,
    sentCount,
    deliveredCount,
    opensCount,
    clicksCount,
    spamCount,
    unsubscribeCount,
    // Campos para la vista de detalle de campaña (2026-07-09).
    previewUrl: pickField(rawRow, COLUMN_ALIASES.previewUrl) || "",
    subject,
    hasEmoji: hasEmoji(subject),
    previewText: pickField(rawRow, COLUMN_ALIASES.previewText) || "",
    senderName: pickField(rawRow, COLUMN_ALIASES.senderName) || "",
    senderAddress: pickField(rawRow, COLUMN_ALIASES.senderAddress) || "",
    // "" (string vacío) para filas sin clasificar — nunca null/undefined,
    // así el filtro "Sin clasificar" de FiltersBar.jsx puede comparar con
    // `=== ""` de forma consistente.
    communicationType: (pickField(rawRow, COLUMN_ALIASES.communicationType) || "").trim(),
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
