/**
 * CountriesView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX + Agente de Datos — vista "Países" del sidebar.
 *
 * Desglose de rendimiento por país (MX, CO, CL, AR) sobre el dataset ya
 * filtrado (país/fecha) recibido desde `App.jsx`. La agregación por país
 * vive en `reportAggregations.js` (`buildCountryMetrics`, función pura);
 * este componente solo la llama y renderiza tarjetas + tabla con
 * Tailwind, sin lógica de negocio propia.
 *
 * TOOLTIPS DE VALOR ABSOLUTO (2026-07-09): cada % (tarjetas y tabla
 * comparativa) muestra al hacer hover el conteo absoluto agregado del
 * país detrás de ese promedio, vía `Tooltip.jsx` (CSS puro, sin librerías).
 * ------------------------------------------------------------------
 */

import { buildCountryMetrics } from "../../utils/reportAggregations";
import Tooltip from "../common/Tooltip";

const COUNTRY_FLAGS = { MX: "🇲🇽", CO: "🇨🇴", CL: "🇨🇱", AR: "🇦🇷", OTHER: "🌐" };

function EmptyState({ message }) {
  return <div className="h-40 flex items-center justify-center text-sm text-[#AAA]">{message}</div>;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white rounded-card p-6 border border-livo-gray shadow-sm h-32 animate-pulse" />
      ))}
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array<object>} [props.data] - dataset ya filtrado (país/fecha), proveniente de `useHubspotData`
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 */
export default function CountriesView({ data = [], loading = false, error = null }) {
  if (error) {
    return (
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-card p-6 text-sm text-[#B91C1C]">
        No se pudo cargar el desglose por país: {error}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  const countryMetrics = buildCountryMetrics(data);

  if (countryMetrics.length === 0) {
    return (
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <EmptyState message="No hay datos para el país/rango de fechas seleccionado." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* --- Tarjetas resumen por país --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {countryMetrics.map((c) => (
          <div
            key={c.country}
            className="bg-white rounded-card p-6 border border-livo-gray shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg leading-none">{COUNTRY_FLAGS[c.country] || "🌐"}</span>
              <p className="font-display font-bold text-base text-black">{c.label}</p>
            </div>
            <p className="font-mono font-bold text-2xl text-black leading-none mb-3">
              {c.totalSent.toLocaleString("es-MX")}
              <span className="font-body font-normal text-xs text-[#666] ml-1.5">enviados</span>
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#666]">
              <span>
                Apertura:{" "}
                <Tooltip
                  label={`${c.totalOpens.toLocaleString("es-MX")} aperturas de ${c.totalDelivered.toLocaleString("es-MX")} entregados`}
                >
                  <span className="font-mono font-bold text-black">{c.avgOpenRate}%</span>
                </Tooltip>
              </span>
              <span>
                Clics:{" "}
                <Tooltip
                  label={`${c.totalClicks.toLocaleString("es-MX")} clics de ${c.totalDelivered.toLocaleString("es-MX")} entregados`}
                >
                  <span className="font-mono font-bold text-black">{c.avgClickRate}%</span>
                </Tooltip>
              </span>
              <span>
                Rebote:{" "}
                <Tooltip
                  label={`${c.totalBounces.toLocaleString("es-MX")} rebotes de ${c.totalSent.toLocaleString("es-MX")} enviados`}
                >
                  <span className="font-mono font-bold text-black">{c.avgBounceRate}%</span>
                </Tooltip>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- Tabla comparativa --- */}
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <h3 className="font-display font-bold text-lg text-black mb-4">Comparativo por país</h3>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-[#666] tracking-[0.5px] border-b border-livo-gray">
                <th className="px-2 py-2">País</th>
                <th className="px-2 py-2 text-right">Campañas</th>
                <th className="px-2 py-2 text-right">Enviados</th>
                <th className="px-2 py-2 text-right">Apertura prom.</th>
                <th className="px-2 py-2 text-right">Clics prom.</th>
                <th className="px-2 py-2 text-right">Rebote prom.</th>
              </tr>
            </thead>
            <tbody>
              {countryMetrics.map((c) => (
                <tr key={c.country} className="border-b border-livo-gray last:border-0 hover:bg-livo-gray/50 transition-colors">
                  <td className="px-2 py-3 font-body text-[#111]">
                    {COUNTRY_FLAGS[c.country] || "🌐"} {c.label}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-[#666]">{c.campaignCount}</td>
                  <td className="px-2 py-3 text-right font-mono text-[#111]">{c.totalSent.toLocaleString("es-MX")}</td>
                  <td className="px-2 py-3 text-right font-mono text-[#666]">
                    <Tooltip
                      label={`${c.totalOpens.toLocaleString("es-MX")} aperturas de ${c.totalDelivered.toLocaleString("es-MX")} entregados`}
                    >
                      {c.avgOpenRate}%
                    </Tooltip>
                  </td>
                  <td className="px-2 py-3 text-right font-mono font-bold text-black">
                    <Tooltip
                      label={`${c.totalClicks.toLocaleString("es-MX")} clics de ${c.totalDelivered.toLocaleString("es-MX")} entregados`}
                    >
                      {c.avgClickRate}%
                    </Tooltip>
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-[#666]">
                    <Tooltip
                      label={`${c.totalBounces.toLocaleString("es-MX")} rebotes de ${c.totalSent.toLocaleString("es-MX")} enviados`}
                    >
                      {c.avgBounceRate}%
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
