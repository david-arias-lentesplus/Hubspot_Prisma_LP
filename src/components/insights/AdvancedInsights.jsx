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
 *   4. KeywordPerformanceCard  — Rendimiento por palabras clave (2026-07-09, fase "Enterprise")
 *
 * Este componente no calcula nada — solo recibe los 4 resultados ya
 * resueltos (`emojiInsight`, `deliverabilityHealth`, `bestSendTime`,
 * `keywordPerformance`) y los renderiza siguiendo DESIGN_SYSTEM-LIVO.md.
 * ------------------------------------------------------------------
 */

import { formatHourLabel } from "../../utils/advancedAnalytics";

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
      <h3 className="font-display font-bold text-lg text-black dark:text-white mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-[#666] dark:text-white/60 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="text-sm text-[#AAA] dark:text-white/40">{message}</p>;
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
        <div className="rounded-input bg-livo-gray/40 dark:bg-white/5 p-3">
          <p className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] mb-1">CON EMOJI</p>
          <p className="font-mono font-bold text-2xl text-black dark:text-white">{withEmojiAvgOpenRate}%</p>
          <p className="text-xs text-[#666] dark:text-white/60 mt-0.5">{withEmojiCount} campañas</p>
        </div>
        <div className="rounded-input bg-livo-gray/40 dark:bg-white/5 p-3">
          <p className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] mb-1">SIN EMOJI</p>
          <p className="font-mono font-bold text-2xl text-black dark:text-white">{withoutEmojiAvgOpenRate}%</p>
          <p className="text-xs text-[#666] dark:text-white/60 mt-0.5">{withoutEmojiCount} campañas</p>
        </div>
      </div>
      <p className="text-sm text-[#111] dark:text-white/90">
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
    <div className="rounded-input bg-livo-gray/40 dark:bg-white/5 p-3">
      <p className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] mb-1">{label}</p>
      <p className="font-mono font-bold text-xl text-black dark:text-white">{value}%</p>
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
          <p className="text-sm text-[#15803D] dark:text-[#4ADE80]">Sin alertas — rebote duro y spam dentro de los umbrales normales.</p>
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
          <div key={h} className="text-[9px] text-[#AAA] dark:text-white/40 text-center leading-none">
            {HOUR_TICKS.includes(h) ? h : ""}
          </div>
        ))}

        {/* Filas por día */}
        {DAY_SHORT_LABELS.map((label, d) => (
          <div key={label} className="contents">
            <div className="text-[10px] text-[#666] dark:text-white/50 font-bold flex items-center">{label}</div>
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
      <p className="text-sm text-[#111] dark:text-white/90 mb-1">
        Los mejores resultados están{" "}
        <strong>
          los {day.toLowerCase()} a las {formatHourLabel(hour)}
        </strong>
        , con <span className="font-mono font-bold">{avgOpenRate}%</span> de apertura promedio.
      </p>
      <p className="text-xs text-[#666] dark:text-white/60 mb-4">
        {bestSendTime.usedFallback
          ? `Basado en una sola campaña — hay poco volumen en este horario dentro del filtro actual.`
          : `Basado en ${count} campaña${count === 1 ? "" : "s"} enviada${count === 1 ? "" : "s"} en ese día y hora.`}
      </p>
      <Heatmap cells={bestSendTime.heatmap} />
    </SectionCard>
  );
}

// ---------------------------------------------------------------------
// 4. Rendimiento por palabras clave
// ---------------------------------------------------------------------

function KeywordPerformanceCard({ keywordPerformance }) {
  const { analyzedCount, thresholdOpenRate, keywords } = keywordPerformance;

  if (!keywords || keywords.length === 0) {
    return (
      <SectionCard title="Palabras clave" subtitle="Asuntos con mayor apertura">
        <EmptyState message="No hay suficientes asuntos con texto en el filtro actual para analizar." />
      </SectionCard>
    );
  }

  const maxCount = keywords[0].count;

  return (
    <SectionCard
      title="Palabras clave"
      subtitle={`Top ${keywords.length} en el 30% de asuntos con mayor apertura (${analyzedCount} correos, ≥${thresholdOpenRate}%)`}
    >
      <ul className="space-y-2">
        {keywords.map((kw) => (
          <li key={kw.word} className="flex items-center gap-2">
            <span className="text-sm font-body text-[#111] dark:text-white/90 font-medium w-20 truncate shrink-0" title={kw.word}>
              {kw.word}
            </span>
            <div className="flex-1 h-2 rounded-full bg-livo-gray/60 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-livo-blue-500 rounded-full"
                style={{ width: `${Math.max(8, (kw.count / maxCount) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[#666] dark:text-white/60 w-16 text-right shrink-0">
              {kw.count} correo{kw.count === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
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
export default function AdvancedInsights({
  emojiInsight,
  deliverabilityHealth,
  bestSendTime,
  keywordPerformance,
  loading = false,
  error = null,
}) {
  if (error) return null; // el error ya se muestra en DashboardSummary/ReportsView, no se duplica acá

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm h-56 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <EmojiInsightCard insight={emojiInsight} />
      <DeliverabilityHealthCard health={deliverabilityHealth} />
      <BestSendTimeCard bestSendTime={bestSendTime} />
      <KeywordPerformanceCard keywordPerformance={keywordPerformance} />
    </div>
  );
}
