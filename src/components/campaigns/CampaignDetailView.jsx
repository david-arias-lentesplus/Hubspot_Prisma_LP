/**
 * CampaignDetailView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — página de detalle de una campaña individual,
 * accesible al hacer click en una fila de `CampaignsView.jsx`.
 *
 * Muestra el embudo de conversión de la campaña (Enviados → Entregados →
 * Aperturas → Clics, `ConversionFunnel.jsx`), un análisis comparativo
 * contra el promedio de campañas del mismo tipo de envío (calculado por
 * `buildCampaignInsights` en `reportAggregations.js`, Agente de Datos) y
 * una tarjeta de vista previa con el asunto + botón hacia el diseño
 * original en HubSpot.
 *
 * OPCIÓN A — SIN IFRAME (2026-07-09, decisión explícita): la versión
 * anterior embebía `previewUrl` (`preview.hs-sites.com`) en un iframe,
 * pero HubSpot bloquea esa vista quedando en blanco — la página de
 * preview necesita una navegación de nivel superior para validar su
 * cookie de sesión, algo que los navegadores bloquean dentro de un
 * iframe de terceros (ver handoff.md sección 4 para el detalle completo,
 * incluida la investigación de por qué tampoco es reconstruible la URL
 * pública sin login de `info.lentesplus.com`). En vez de seguir peleando
 * contra esa limitación, se quitó el iframe por completo y se reemplazó
 * por una tarjeta con el `subject` + `previewText` de la fila y un botón
 * primario que abre `previewUrl` en pestaña nueva.
 *
 * Componente de presentación puro: no filtra ni hace fetch — recibe la
 * campaña ya resuelta y el dataset (para el comparativo) desde `App.jsx`.
 * ------------------------------------------------------------------
 */

import { useMemo } from "react";
import { buildCampaignInsights } from "../../utils/reportAggregations";
import { CAMPAIGN_TYPES } from "../../services/dataService";
import ConversionFunnel from "../metrics/ConversionFunnel";

const COUNTRY_LABELS = { MX: "México", CO: "Colombia", CL: "Chile", AR: "Argentina", OTHER: "Otros" };
const COUNTRY_FLAGS = { MX: "🇲🇽", CO: "🇨🇴", CL: "🇨🇱", AR: "🇦🇷", OTHER: "🌐" };

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5h5v5M19 5l-9 9M9 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"
      />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "2-digit" });
}

/**
 * Frase corta de análisis a partir de la diferencia (en puntos porcentuales)
 * contra el promedio de pares del mismo tipo de envío.
 */
function diffPhrase(diff, metricLabel) {
  if (diff === null || diff === undefined) return null;
  if (Math.abs(diff) < 0.1) return `${metricLabel} está en línea con el promedio de campañas similares.`;
  const direction = diff > 0 ? "por encima" : "por debajo";
  return `${metricLabel} está ${Math.abs(diff).toFixed(1)} pts ${direction} del promedio de campañas similares.`;
}

/**
 * @param {object} props
 * @param {object} props.campaign - fila normalizada seleccionada (dataService.js)
 * @param {Array<object>} [props.dataset] - dataset filtrado actual (para el comparativo de pares)
 * @param {() => void} props.onBack
 */
export default function CampaignDetailView({ campaign, dataset = [], onBack }) {
  // Memoización estricta (2026-07-09) — el comparativo contra "pares"
  // filtra `dataset` completo; se llama antes que cualquier return
  // temprano para respetar las Rules of Hooks (buildCampaignInsights ya
  // devuelve null internamente si no hay `campaign`, así que es seguro
  // llamarlo incondicionalmente acá).
  const insights = useMemo(() => buildCampaignInsights(campaign, dataset), [campaign, dataset]);

  if (!campaign) {
    return (
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
        <p className="text-sm text-[#666] dark:text-white/60 mb-4">No se encontró la campaña seleccionada.</p>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-btn border-[1.5px] border-livo-blue-500 text-livo-blue-500 font-bold text-sm hover:bg-[#E8E8FF] transition-colors"
        >
          <BackIcon /> Volver a Campañas
        </button>
      </div>
    );
  }

  const analysisLines = [
    diffPhrase(insights?.openRateDiff, "La tasa de apertura"),
    diffPhrase(insights?.clickRateDiff, "La tasa de clics"),
    diffPhrase(insights?.bounceRateDiff, "La tasa de rebote"),
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* --- Header --- */}
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-livo-blue-500 hover:text-livo-blue-600 transition-colors mb-4"
        >
          <BackIcon /> Volver a Campañas
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl text-black dark:text-white break-words">
              {campaign.campaignName || "(Sin nombre)"}
            </h2>
            {campaign.subject && <p className="text-sm text-[#666] dark:text-white/60 mt-1 break-words">{campaign.subject}</p>}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-[#E8E8FF] border border-livo-blue-600 text-livo-blue-600">
              {COUNTRY_FLAGS[campaign.country] || "🌐"} {COUNTRY_LABELS[campaign.country] || campaign.country}
            </span>
            <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-livo-gray/70 dark:bg-white/10 border border-[#DDD] dark:border-white/20 text-[#111] dark:text-white/90">
              {CAMPAIGN_TYPES[campaign.campaignType] || campaign.campaignType}
            </span>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-xs text-[#666] dark:text-white/60">
          <div>
            <dt className="font-bold tracking-[0.5px] mb-0.5">FECHA DE ENVÍO</dt>
            <dd className="text-[#111] dark:text-white/90">{formatDate(campaign.sentDate)}</dd>
          </div>
          {campaign.senderName && (
            <div>
              <dt className="font-bold tracking-[0.5px] mb-0.5">REMITENTE</dt>
              <dd className="text-[#111] dark:text-white/90">
                {campaign.senderName} {campaign.senderAddress && `· ${campaign.senderAddress}`}
              </dd>
            </div>
          )}
          {campaign.campaignId && (
            <div>
              <dt className="font-bold tracking-[0.5px] mb-0.5">ID DE CAMPAÑA</dt>
              <dd className="font-mono text-[#111] dark:text-white/90">{campaign.campaignId}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* --- Embudo de conversión (reemplaza la grilla de tarjetas de KPI, 2026-07-09) --- */}
      <ConversionFunnel
        steps={[
          { label: "Enviados", value: campaign.sentCount },
          { label: "Entregados", value: campaign.deliveredCount },
          { label: "Aperturas", value: campaign.opensCount },
          { label: "Clics", value: campaign.clicksCount },
        ]}
      />

      {/* --- Tasas (compactas: el detalle narrativo vs. pares vive en "Análisis" abajo) --- */}
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-4 border border-livo-gray dark:border-white/10 shadow-sm flex flex-wrap gap-x-8 gap-y-2">
        <span className="text-sm text-[#666] dark:text-white/60">
          Tasa de apertura: <span className="font-mono font-bold text-black dark:text-white">{campaign.openRate.toFixed(1)}%</span>
        </span>
        <span className="text-sm text-[#666] dark:text-white/60">
          Tasa de clics: <span className="font-mono font-bold text-black dark:text-white">{campaign.clickRate.toFixed(1)}%</span>
        </span>
        <span className="text-sm text-[#666] dark:text-white/60">
          Tasa de rebote: <span className="font-mono font-bold text-black dark:text-white">{campaign.bounceRate.toFixed(1)}%</span>
        </span>
      </div>

      {/* --- Análisis --- */}
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
        <h3 className="font-display font-bold text-lg text-black dark:text-white mb-3">Análisis</h3>
        {insights && insights.peerCount > 0 ? (
          <>
            <p className="text-xs text-[#666] dark:text-white/60 mb-3">
              Comparado contra {insights.peerCount} campaña{insights.peerCount === 1 ? "" : "s"} de tipo "
              {CAMPAIGN_TYPES[campaign.campaignType] || campaign.campaignType}" dentro del filtro actual.
            </p>
            <ul className="space-y-1.5 text-sm text-[#111] dark:text-white/90">
              {analysisLines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-livo-blue-500">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-[#666] dark:text-white/60">
            No hay otras campañas del mismo tipo dentro del filtro actual para comparar.
          </p>
        )}

        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 pt-4 border-t border-livo-gray dark:border-white/10 text-xs text-[#666] dark:text-white/60">
          <span>
            Clics: <span className="font-mono font-bold text-black dark:text-white">{campaign.clicksCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Aperturas: <span className="font-mono font-bold text-black dark:text-white">{campaign.opensCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Rebotes: <span className="font-mono font-bold text-black dark:text-white">{campaign.bounceCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Spam: <span className="font-mono font-bold text-black dark:text-white">{campaign.spamCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Cancelaciones: <span className="font-mono font-bold text-black dark:text-white">{campaign.unsubscribeCount.toLocaleString("es-MX")}</span>
          </span>
        </div>
      </div>

      {/* --- Vista previa del correo (Opción A — sin iframe, 2026-07-09) --- */}
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
        <h3 className="font-display font-bold text-lg text-black dark:text-white mb-1">Vista previa del correo</h3>
        <p className="text-xs text-[#666] dark:text-white/60 mb-4">
          El diseño no se puede embeber directamente en el dashboard — HubSpot bloquea la vista previa dentro de un
          iframe. Usa el botón de abajo para verlo en HubSpot.
        </p>

        <div className="bg-livo-gray/40 dark:bg-white/5 rounded-input p-4 mb-5">
          <p className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] mb-1">ASUNTO</p>
          <p className="text-sm text-[#111] dark:text-white/90 mb-3 break-words">{campaign.subject || "—"}</p>

          <p className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] mb-1">TEXTO DE VISTA PREVIA</p>
          <p className="text-sm text-[#111] dark:text-white/90 break-words">{campaign.previewText || "—"}</p>
        </div>

        {campaign.previewUrl ? (
          <a
            href={campaign.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 w-full sm:w-auto rounded-btn bg-livo-blue-500 text-white
                       font-bold text-sm tracking-[0.5px] hover:bg-livo-blue-600 active:bg-livo-blue-700
                       focus:outline-none focus:shadow-focus-primary transition-colors"
          >
            Ver diseño original en HubSpot <ExternalLinkIcon />
          </a>
        ) : (
          <p className="text-sm text-[#AAA] dark:text-white/40">Esta campaña no tiene un enlace de vista previa disponible.</p>
        )}
      </div>
    </div>
  );
}
