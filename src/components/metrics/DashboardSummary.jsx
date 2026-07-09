/**
 * DashboardSummary.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — cuadrícula de tarjetas de KPI del Dashboard.
 *
 * Componente de presentación: recibe las métricas ya calculadas —
 * típicamente el resultado de `getGlobalMetrics()` / `globalMetrics`
 * del hook `useHubspotData` — y las distribuye en un CSS Grid de 4
 * `MetricCard`. No hace fetch ni cálculos: esa lógica vive en la capa
 * de datos (`useHubspotData.js` / `dataService.js`).
 * ------------------------------------------------------------------
 */

import MetricCard from "./MetricCard";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm animate-pulse">
      <div className="h-3 w-24 bg-livo-gray rounded mb-3" />
      <div className="h-8 w-20 bg-livo-gray rounded" />
    </div>
  );
}

/**
 * @param {object} props
 * @param {object} props.metrics - { totalSent, avgOpenRate, avgClickRate, avgBounceRate }
 * @param {object} [props.growth] - variación vs. período anterior, mismas claves que `metrics` (opcional)
 * @param {boolean} [props.loading] - muestra skeletons en vez de valores
 * @param {string|null} [props.error] - si viene definido, muestra un estado de error en vez de la grilla
 */
export default function DashboardSummary({ metrics, growth, loading = false, error = null }) {
  if (error) {
    return (
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-card p-6 text-sm text-[#B91C1C]">
        No se pudieron calcular las métricas: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const { totalSent = 0, avgOpenRate = 0, avgClickRate = 0, avgBounceRate = 0 } = metrics || {};

  const cards = [
    {
      titulo: "Total enviados",
      valor: totalSent.toLocaleString("es-MX"),
      porcentajeCrecimiento: growth?.totalSent,
    },
    {
      titulo: "Tasa de apertura promedio",
      valor: `${avgOpenRate.toFixed(1)}%`,
      porcentajeCrecimiento: growth?.avgOpenRate,
    },
    {
      titulo: "Tasa de clics promedio",
      valor: `${avgClickRate.toFixed(1)}%`,
      porcentajeCrecimiento: growth?.avgClickRate,
    },
    {
      titulo: "Tasa de rebote",
      valor: `${avgBounceRate.toFixed(1)}%`,
      // Para el rebote, una variación negativa vs. el período anterior es "buena";
      // se invierte el signo antes de pasarlo a MetricCard para que el badge
      // (verde/rojo) refleje correctamente si mejoramos o empeoramos.
      porcentajeCrecimiento:
        typeof growth?.avgBounceRate === "number" ? -growth.avgBounceRate : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => (
        <MetricCard key={card.titulo} {...card} />
      ))}
    </div>
  );
}
