/**
 * CampaignDetailView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — página de detalle de una campaña individual,
 * accesible al hacer click en una fila de `CampaignsView.jsx`.
 *
 * Muestra los KPIs completos de la campaña, un análisis comparativo
 * contra el promedio de campañas del mismo tipo de envío (calculado por
 * `buildCampaignInsights` en `reportAggregations.js`, Agente de Datos) y
 * el correo real embebido vía iframe usando el "Enlace de vista previa"
 * que HubSpot expone por fila (`previewUrl`, ver dataService.js).
 *
 * Componente de presentación puro: no filtra ni hace fetch — recibe la
 * campaña ya resuelta y el dataset (para el comparativo) desde `App.jsx`.
 * ------------------------------------------------------------------
 */

import { buildCampaignInsights } from "../../utils/reportAggregations";
import { CAMPAIGN_TYPES } from "../../services/dataService";
import MetricCard from "../metrics/MetricCard";

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
  if (!campaign) {
    return (
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <p className="text-sm text-[#666] mb-4">No se encontró la campaña seleccionada.</p>
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

  const insights = buildCampaignInsights(campaign, dataset);

  const analysisLines = [
    diffPhrase(insights?.openRateDiff, "La tasa de apertura"),
    diffPhrase(insights?.clickRateDiff, "La tasa de clics"),
    diffPhrase(insights?.bounceRateDiff, "La tasa de rebote"),
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* --- Header --- */}
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-livo-blue-500 hover:text-livo-blue-600 transition-colors mb-4"
        >
          <BackIcon /> Volver a Campañas
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl text-black break-words">
              {campaign.campaignName || "(Sin nombre)"}
            </h2>
            {campaign.subject && <p className="text-sm text-[#666] mt-1 break-words">{campaign.subject}</p>}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-[#E8E8FF] border border-livo-blue-600 text-livo-blue-600">
              {COUNTRY_FLAGS[campaign.country] || "🌐"} {COUNTRY_LABELS[campaign.country] || campaign.country}
            </span>
            <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-livo-gray/70 border border-[#DDD] text-[#111]">
              {CAMPAIGN_TYPES[campaign.campaignType] || campaign.campaignType}
            </span>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 mt-4 text-xs text-[#666]">
          <div>
            <dt className="font-bold tracking-[0.5px] mb-0.5">FECHA DE ENVÍO</dt>
            <dd className="text-[#111]">{formatDate(campaign.sentDate)}</dd>
          </div>
          {campaign.senderName && (
            <div>
              <dt className="font-bold tracking-[0.5px] mb-0.5">REMITENTE</dt>
              <dd className="text-[#111]">
                {campaign.senderName} {campaign.senderAddress && `· ${campaign.senderAddress}`}
              </dd>
            </div>
          )}
          {campaign.campaignId && (
            <div>
              <dt className="font-bold tracking-[0.5px] mb-0.5">ID DE CAMPAÑA</dt>
              <dd className="font-mono text-[#111]">{campaign.campaignId}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* --- KPIs --- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
        <MetricCard titulo="Enviados" valor={campaign.sentCount.toLocaleString("es-MX")} />
        <MetricCard titulo="Entregados" valor={campaign.deliveredCount.toLocaleString("es-MX")} />
        <MetricCard
          titulo="Tasa de apertura"
          valor={`${campaign.openRate.toFixed(1)}%`}
          porcentajeCrecimiento={insights?.openRateDiff ?? undefined}
        />
        <MetricCard
          titulo="Tasa de clics"
          valor={`${campaign.clickRate.toFixed(1)}%`}
          porcentajeCrecimiento={insights?.clickRateDiff ?? undefined}
        />
        {/* Sin badge de variación: en "Tasa de rebote" un valor MÁS BAJO es
            mejor, al revés que en apertura/clics — el badge de MetricCard
            asume que "más alto = verde", así que mostrarlo aquí invertido
            sería confuso junto al texto de Análisis. El contexto vive solo
            en la sección de Análisis de abajo. */}
        <MetricCard titulo="Tasa de rebote" valor={`${campaign.bounceRate.toFixed(1)}%`} />
      </div>

      {/* --- Análisis --- */}
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <h3 className="font-display font-bold text-lg text-black mb-3">Análisis</h3>
        {insights && insights.peerCount > 0 ? (
          <>
            <p className="text-xs text-[#666] mb-3">
              Comparado contra {insights.peerCount} campaña{insights.peerCount === 1 ? "" : "s"} de tipo "
              {CAMPAIGN_TYPES[campaign.campaignType] || campaign.campaignType}" dentro del filtro actual.
            </p>
            <ul className="space-y-1.5 text-sm text-[#111]">
              {analysisLines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-livo-blue-500">•</span>
                  {line}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-[#666]">
            No hay otras campañas del mismo tipo dentro del filtro actual para comparar.
          </p>
        )}

        <div className="flex flex-wrap gap-x-8 gap-y-2 mt-4 pt-4 border-t border-livo-gray text-xs text-[#666]">
          <span>
            Clics: <span className="font-mono font-bold text-black">{campaign.clicksCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Aperturas: <span className="font-mono font-bold text-black">{campaign.opensCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Rebotes: <span className="font-mono font-bold text-black">{campaign.bounceCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Spam: <span className="font-mono font-bold text-black">{campaign.spamCount.toLocaleString("es-MX")}</span>
          </span>
          <span>
            Cancelaciones: <span className="font-mono font-bold text-black">{campaign.unsubscribeCount.toLocaleString("es-MX")}</span>
          </span>
        </div>
      </div>

      {/* --- Vista previa del correo --- */}
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-lg text-black">Vista previa del correo</h3>
          {campaign.previewUrl && (
            <a
              href={campaign.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-livo-blue-500 hover:text-livo-blue-600 transition-colors"
            >
              Abrir en pestaña nueva <ExternalLinkIcon />
            </a>
          )}
        </div>

        {campaign.previewUrl ? (
          <div className="rounded-input border border-livo-gray overflow-hidden">
            {/*
              NOTA (2026-07-09, verificado en navegador real): el enlace de
              "preview.hs-sites.com" carga bien como pestaña propia, pero
              HubSpot necesita hacer una navegación de nivel superior para
              validar la sesión de vista previa — dentro de un iframe esa
              validación puede fallar por las restricciones de cookies de
              terceros del navegador, dejando el recuadro en blanco. Por eso
              siempre se deja visible el link "Abrir en pestaña nueva" como
              alternativa garantizada, además del intento de iframe.
            */}
            <p className="px-3 py-2 text-xs text-[#666] bg-livo-gray/40 border-b border-livo-gray">
              Si el recuadro aparece vacío, tu navegador está bloqueando la vista embebida (cookies de terceros) —
              usa "Abrir en pestaña nueva" arriba para ver el correo.
            </p>
            <iframe
              src={campaign.previewUrl}
              title={`Vista previa: ${campaign.campaignName}`}
              className="w-full h-[720px] bg-white"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        ) : (
          <p className="text-sm text-[#AAA]">Esta campaña no tiene un enlace de vista previa disponible.</p>
        )}
      </div>
    </div>
  );
}
