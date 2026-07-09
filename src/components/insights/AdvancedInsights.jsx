/**
 * AdvancedInsights.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — sección de analítica avanzada del Dashboard
 * (2026-07-09), montada en la vista "Resumen" debajo de `ReportsView`.
 * Compone 3 tarjetas de presentación pura sobre los resultados ya
 * calculados por el hook `useAdvancedAnalytics` (Agente de Datos, ver
 * `src/utils/advancedAnalytics.js`):
 *
 *   1. EmojiInsightCard        — Insight del Asunto (apertura con/sin emoji)
 *   2. DeliverabilityHealthCard — Salud del dominio (rebotes/spam/cancelaciones + alertas)
 *   3. BestSendTimeCard        — Mejor horario de envío (texto + mapa de calor básico)
 *
 * Este componente no calcula nada — solo recibe los 3 resultados ya
 * resueltos (`emojiInsight`, `deliverabilityHealth`, `bestSendTime`) y los
 * renderiza siguiendo DESIGN_SYSTEM-LIVO.md.
 * ------------------------------------------------------------------
 */

import { formatHourLabel } from "../../utils/advancedAnalytics";

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
      <h3 className="font-display font-bold text-lg text-black mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-[#666] mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="text-sm text-[#AAA]">{message}</p>;
}

// ---------------------------------------------------------------------
// 1. Insight del Asunto
// ---------------------------------------------------------------------

function EmojiInsightCard({ insight }) {
  const { withEmojiCount, withoutEmojiCount, withEmojiAvgOpenRate, withoutEmojiAvgOpenRate, diff } = insight;

  if (withEmojiCount === 0 || withoutEmojiCount === 0) {
    return (
      <SectionCard title="Insight del asunto" subtitle="Apertura con emoji vs. sin emoji">
        <EmptyState message="No hay suficiente variedad (con/sin emoji) en el filtro actual para comparar." />
      </SectionCard>
    );
  }

  const emojiWins = diff !== null && diff > 0;

  return (
    <SectionCard title="Insight del asunto" subtitle="Apertura con emoji vs. sin emoji en el filtro actual">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-input bg-livo-gray/40 p-3">
          <p className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">CON EMOJI</p>
          <p className="font-mono font-bold text-2xl text-black">{withEmojiAvgOpenRate}%</p>
          <p className="text-xs text-[#666] mt-0.5">{withEmojiCount} campañas</p>
        </div>
        <div className="rounded-input bg-livo-gray/40 p-3">
          <p className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">SIN EMOJI</p>
          <p className="font-mono font-bold text-2xl text-black">{withoutEmojiAvgOpenRate}%</p>
          <p className="text-xs text-[#666] mt-0.5">{withoutEmojiCount} campañas</p>
        </div>
      </div>
      <p className="text-sm text-[#111]">
        Los asuntos <strong>{emojiWins ? "con" : "sin"} emoji</strong> abren en promedio{" "}
        <span className="font-mono font-bold">{Math.abs(diff).toFixed(1)} pts</span> más que{" "}
        {emojiWins ? "los que no tienen" : "los que sí tienen"} emoji.
      </p>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------
// 2. Salud del dominio (deliverability)
// ---------------------------------------------------------------------

function HealthStat({ label, value }) {
  return (
    <div className="rounded-input bg-livo-gray/40 p-3">
      <p className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">{label}</p>
      <p className="font-mono font-bold text-xl text-black">{value}%</p>
    </div>
  );
}

function DeliverabilityHealthCard({ health }) {
  if (health.campaignCount === 0) {
    return (
      <SectionCard title="Salud del dominio" subtitle="Deliverability">
        <EmptyState message="No hay campañas en el filtro actual." />
      </SectionCard>
    );
  }

  const hasAlerts = health.alerts.length > 0;

  return (
    <SectionCard title="Salud del dominio" subtitle="Deliverability — promedios sobre el filtro actual">
      {hasAlerts && (
        <div className="mb-4 rounded-input bg-[#FFF5F5] border border-[#DC2626]/30 p-3">
          {health.alerts.map((alert) => (
            <p key={alert.metric} className="text-sm text-[#B91C1C] flex gap-2">
              <span aria-hidden="true">⚠️</span>
              {alert.message}
            </p>
          ))}
        </div>
      )}
      {!hasAlerts && (
        <div className="mb-4 rounded-input bg-[#DCFCE7] p-3">
          <p className="text-sm text-[#15803D]">Sin alertas — rebote duro y spam dentro de los umbrales normales.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <HealthStat label="REBOTE DURO" value={health.avgHardBounceRate} />
        <HealthStat label="REBOTE SUAVE" value={health.avgSoftBounceRate} />
        <HealthStat label="SPAM" value={health.avgSpamRate} />
        <HealthStat label="CANCELACIONES" value={health.avgUnsubscribeRate} />
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------
// 3. Mejor horario de envío
// ---------------------------------------------------------------------

const DAY_SHORT_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOUR_TICKS = [0, 4, 8, 12, 16, 20]; // horas que sí llevan etiqueta arriba, para no saturar

function Heatmap({ cells }) {
  const maxOpenRate = cells.reduce((max, c) => Math.max(max, c.avgOpenRate), 0);
  const byKey = new Map(cells.map((c) => [`${c.dayIndex}-${c.hour}`, c]));

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: "28px repeat(24, 12px)" }}>
        {/* Fila de horas */}
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-[9px] text-[#AAA] text-center leading-none">
            {HOUR_TICKS.includes(h) ? h : ""}
          </div>
        ))}

        {/* Filas por día */}
        {DAY_SHORT_LABELS.map((label, d) => (
          <div key={label} className="contents">
            <div className="text-[10px] text-[#666] font-bold flex items-center">{label}</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const cell = byKey.get(`${d}-${h}`);
              const opacity = cell && maxOpenRate > 0 ? 0.15 + 0.85 * (cell.avgOpenRate / maxOpenRate) : 0;
              return (
                <div
                  key={h}
                  title={cell ? `${label} ${formatHourLabel(h)} — ${cell.avgOpenRate}% (${cell.count} envíos)` : undefined}
                  className="w-3 h-3 rounded-[2px] bg-livo-blue-500"
                  style={{ opacity: cell ? opacity : 0.06 }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function BestSendTimeCard({ bestSendTime }) {
  if (!bestSendTime.best) {
    return (
      <SectionCard title="Mejor horario de envío" subtitle="Basado en tasa de apertura">
        <EmptyState message="No hay suficientes campañas con fecha de envío en el filtro actual." />
      </SectionCard>
    );
  }

  const { day, hour, avgOpenRate, count } = bestSendTime.best;

  return (
    <SectionCard title="Mejor horario de envío" subtitle="Basado en tasa de apertura del filtro actual">
      <p className="text-sm text-[#111] mb-1">
        Los mejores resultados están{" "}
        <strong>
          los {day.toLowerCase()} a las {formatHourLabel(hour)}
        </strong>
        , con <span className="font-mono font-bold">{avgOpenRate}%</span> de apertura promedio.
      </p>
      <p className="text-xs text-[#666] mb-4">
        {bestSendTime.usedFallback
          ? `Basado en una sola campaña — hay poco volumen en este horario dentro del filtro actual.`
          : `Basado en ${count} campaña${count === 1 ? "" : "s"} enviada${count === 1 ? "" : "s"} en ese día y hora.`}
      </p>
      <Heatmap cells={bestSendTime.heatmap} />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------

/**
 * @param {object} props
 * @param {ReturnType<typeof import("../../hooks/useAdvancedAnalytics").useAdvancedAnalytics>} props - resultado de useAdvancedAnalytics
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 */
export default function AdvancedInsights({ emojiInsight, deliverabilityHealth, bestSendTime, loading = false, error = null }) {
  if (error) return null; // el error ya se muestra en DashboardSummary/ReportsView, no se duplica acá

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-card p-6 border border-livo-gray shadow-sm h-56 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <EmojiInsightCard insight={emojiInsight} />
      <DeliverabilityHealthCard health={deliverabilityHealth} />
      <BestSendTimeCard bestSendTime={bestSendTime} />
    </div>
  );
}
