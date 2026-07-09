/**
 * ReportsView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX + Agente de Datos — sección de reportes y gráficos del
 * Dashboard. Se ubica debajo de `DashboardSummary`.
 *
 * Es un componente de presentación: toda la agregación de datos vive en
 * `src/utils/reportAggregations.js` (funciones puras, Agente de Datos).
 * Este componente solo llama a esas funciones sobre el dataset ya
 * filtrado (país / rango de fechas) que le pasa el padre — típicamente
 * el resultado de `filterByCountry` + `filterByDateRange` de
 * `useHubspotData` — y renderiza:
 *   1. LineChart:  Tasa de apertura vs. Tasa de clics en el tiempo, con
 *      toggle de granularidad Día/Semana/Mes (2026-07-09) — el estado del
 *      toggle es puramente de presentación y vive en este componente, no
 *      en App.jsx: no filtra el dataset, solo cambia cómo se agrupan los
 *      mismos puntos (`buildTrendSeries(data, granularity)`).
 *   2. BarChart:   Enviados vs. Abiertos por país
 *   3. Tabla:      Top 5 campañas por tasa de clics
 *
 * @requires recharts — ver handoff.md sección 5 (dependencias)
 *
 * MODO OSCURO Y RECHARTS (2026-07-09, fase "Enterprise"): Recharts pinta
 * con SVG/inline styles, no con className — las clases `dark:` de
 * Tailwind no le llegan. Por eso este componente recibe el prop `isDark`
 * (de `useTheme()` en App.jsx) y arma `chartColors` una sola vez por
 * render con los valores hex correctos para grilla/ejes/tooltip/leyenda
 * según el tema activo, y esos hex se pasan directo a los props de
 * Recharts (`stroke`, `tick.fill`, `contentStyle`, etc.).
 * ------------------------------------------------------------------
 */

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  buildTrendSeries,
  buildCountryVolume,
  getTopCampaigns,
  COUNTRY_LABELS,
  TREND_GRANULARITY_OPTIONS,
} from "../../utils/reportAggregations";

function ChartCard({ title, headerExtra, children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-lg text-black dark:text-white">{title}</h3>
        {headerExtra}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="h-72 flex items-center justify-center text-sm text-[#AAA] dark:text-white/40">{message}</div>;
}

/**
 * Toggle tipo "pill" (Día/Semana/Mes) para la granularidad del LineChart de
 * tendencia. Componente puro de presentación: recibe el valor activo y
 * reporta el cambio al padre, sin lógica propia de agregación.
 */
function GranularityToggle({ value, onChange }) {
  return (
    <div className="inline-flex p-1 bg-livo-gray/60 dark:bg-white/10 rounded-btn shrink-0" role="group" aria-label="Agrupar tendencia por">
      {TREND_GRANULARITY_OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              "px-3 py-1.5 rounded-btn text-xs font-bold tracking-[0.5px] transition-colors",
              active ? "bg-livo-blue-500 text-white shadow-sm" : "text-[#666] dark:text-white/50 hover:text-[#111] dark:hover:text-white",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Formatea la etiqueta del eje X del LineChart de tendencia según la
 * granularidad activa: día ("08 jul"), semana ("Sem. 08 jul" — el lunes de
 * esa semana) o mes ("julio 2026").
 */
function formatDateTick(value, granularity = "day") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  if (granularity === "month") {
    return parsed.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  }
  if (granularity === "week") {
    return `Sem. ${parsed.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`;
  }
  return parsed.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm h-80 animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm h-80 animate-pulse" />
        <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm h-80 animate-pulse" />
      </div>
    </div>
  );
}

// Paleta de Recharts según el tema — ver nota "MODO OSCURO Y RECHARTS" arriba.
const CHART_COLORS = {
  light: {
    grid: "#F0F0F0",
    tick: "#666",
    tooltipBg: "#FFFFFF",
    tooltipBorder: "#F0F0F0",
    tooltipText: "#111",
    legendText: "#111",
  },
  dark: {
    grid: "#2A2A33",
    tick: "#999",
    tooltipBg: "#1C1C24",
    tooltipBorder: "#333",
    tooltipText: "#FFFFFF",
    legendText: "#CCC",
  },
};

/**
 * @param {object} props
 * @param {Array<object>} [props.data] - dataset ya filtrado (país/fecha), proveniente de `useHubspotData`
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {boolean} [props.isDark] - tema activo (useTheme() en App.jsx), ver nota arriba
 */
export default function ReportsView({ data = [], loading = false, error = null, isDark = false }) {
  // Granularidad del LineChart de tendencia (2026-07-09) — solo cambia cómo
  // se agrupan los mismos puntos, no filtra `data`. Ver nota junto a
  // ChartCard/GranularityToggle más arriba.
  const [granularity, setGranularity] = useState("day");
  const c = isDark ? CHART_COLORS.dark : CHART_COLORS.light;

  // Memoización estricta (2026-07-09, fase "Enterprise"): estas 3
  // agregaciones recorren `data` entero — con miles de filas potenciales,
  // no queremos repetirlas en cada render de ReportsView (ej. si el padre
  // re-renderiza por una razón ajena a `data`/`granularity`). Los hooks se
  // llaman ANTES de los `return` tempranos de abajo (error/loading) para
  // respetar las Rules of Hooks — no pueden quedar detrás de un return
  // condicional, o React lanza "Rendered more hooks than during the
  // previous render" en cuanto el estado cambia de loading→listo.
  const trendSeries = useMemo(() => buildTrendSeries(data, granularity), [data, granularity]);
  const countryVolume = useMemo(() => buildCountryVolume(data), [data]);
  const topCampaigns = useMemo(() => getTopCampaigns(data, 5), [data]);

  if (error) {
    return (
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-card p-6 text-sm text-[#B91C1C]">
        No se pudieron cargar los reportes: {error}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  const tickFormatter = (value) => formatDateTick(value, granularity);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* --- 1. Tendencia en el tiempo --- */}
      <ChartCard
        title="Tendencia de apertura y clics"
        headerExtra={<GranularityToggle value={granularity} onChange={setGranularity} />}
      >
        {trendSeries.length === 0 ? (
          <EmptyState message="No hay datos suficientes para graficar la tendencia." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendSeries} margin={{ top: 4, right: 12, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
              <XAxis dataKey="date" tickFormatter={tickFormatter} tick={{ fontSize: 12, fill: c.tick }} />
              <YAxis tick={{ fontSize: 12, fill: c.tick }} unit="%" />
              <Tooltip
                labelFormatter={tickFormatter}
                formatter={(value) => [`${value}%`]}
                contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8 }}
                labelStyle={{ color: c.tooltipText }}
                itemStyle={{ color: c.tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 13, color: c.legendText }} />
              <Line
                type="monotone"
                dataKey="Tasa de apertura"
                stroke="#0000E1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="Tasa de clics"
                stroke="#FC4F00"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- 2. Rendimiento por país --- */}
        <ChartCard title="Enviados vs. abiertos por país">
          {countryVolume.length === 0 ? (
            <EmptyState message="No hay datos suficientes para este país/rango." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryVolume} margin={{ top: 4, right: 12, left: -8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                <XAxis
                  dataKey="country"
                  tickFormatter={(code) => code}
                  tick={{ fontSize: 12, fill: c.tick }}
                />
                <YAxis tick={{ fontSize: 12, fill: c.tick }} />
                <Tooltip
                  labelFormatter={(code) => COUNTRY_LABELS[code] || code}
                  contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8 }}
                  labelStyle={{ color: c.tooltipText }}
                  itemStyle={{ color: c.tooltipText }}
                />
                <Legend wrapperStyle={{ fontSize: 13, color: c.legendText }} />
                <Bar dataKey="Enviados" fill="#0000E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Abiertos" fill="#D92D8E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* --- 3. Top 5 campañas por tasa de clics --- */}
        <ChartCard title="Top 5 campañas por tasa de clics">
          {topCampaigns.length === 0 ? (
            <EmptyState message="No hay campañas para mostrar." />
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] border-b border-livo-gray dark:border-white/10">
                    <th className="px-2 py-2">Campaña</th>
                    <th className="px-2 py-2">País</th>
                    <th className="px-2 py-2 text-right">Apertura</th>
                    <th className="px-2 py-2 text-right">Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((row, i) => (
                    <tr
                      key={`${row.campaignName}-${i}`}
                      className="border-b border-livo-gray dark:border-white/10 last:border-0 hover:bg-livo-gray/50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td
                        className="px-2 py-3 font-body text-[#111] dark:text-white/90 truncate max-w-[220px]"
                        title={row.campaignName}
                      >
                        {row.campaignName}
                      </td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-[#E8E8FF] border border-livo-blue-600 text-livo-blue-600">
                          {row.country}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right font-mono text-[#666] dark:text-white/60">{row.openRate.toFixed(1)}%</td>
                      <td className="px-2 py-3 text-right font-mono font-bold text-black dark:text-white">
                        {row.clickRate.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
