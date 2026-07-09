/**
 * MetricCard.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — card de KPI para el Dashboard de HubSpot.
 *
 * Componente puro de presentación: recibe título, valor y variación
 * porcentual ya calculados (por `useHubspotData` / getGlobalMetrics)
 * y solo se encarga de mostrarlos siguiendo DESIGN_SYSTEM-LIVO.md.
 *
 * BENCHMARK SEMAFÓRICO (2026-07-09, fase "Enterprise"): prop opcional
 * `benchmark` — resultado de `getBenchmarkStatus()` en
 * `src/utils/benchmarks.js` (Agente de Datos). `MetricCard` no calcula
 * nada: solo traduce `status` ("success"|"warning"|"danger") a un punto
 * de color junto al título, con un `Tooltip` explicando la meta de
 * industria vs. el valor real. `DashboardSummary.jsx` es quien decide
 * a qué tarjetas les corresponde benchmark (hoy solo Tasa de apertura y
 * Tasa de clics — Total enviados y Tasa de rebote no tienen meta de
 * industria en este alcance).
 * ------------------------------------------------------------------
 */

import Tooltip from "../common/Tooltip";

// Flechas inline (sin dependencias externas).
function ArrowUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

// Punto semafórico verde/amarillo/rojo — traduce `benchmark.status` a color.
const BENCHMARK_DOT_CLASSES = {
  success: "bg-[#22C55E]",
  warning: "bg-[#F59E0B]",
  danger: "bg-[#EF4444]",
};

const BENCHMARK_STATUS_LABEL = {
  success: "alcanzó la meta",
  warning: "cerca de la meta",
  danger: "por debajo de la meta",
};

function BenchmarkDot({ benchmark }) {
  if (!benchmark || !benchmark.status) return null;

  const sign = benchmark.diff >= 0 ? "+" : "";

  return (
    <Tooltip
      label={`Meta de industria: ${benchmark.benchmark}% · ${BENCHMARK_STATUS_LABEL[benchmark.status]} (${sign}${benchmark.diff} pts)`}
    >
      <span
        aria-hidden="true"
        className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${BENCHMARK_DOT_CLASSES[benchmark.status]}`}
      />
    </Tooltip>
  );
}

/**
 * @param {object} props
 * @param {string} props.titulo - etiqueta del KPI (ej. "Tasa de apertura")
 * @param {string|number} props.valor - valor principal a mostrar (ej. "24.8%", "12,340")
 * @param {number} [props.porcentajeCrecimiento] - variación vs. período anterior (ej. 3.2 o -1.5)
 * @param {{status:"success"|"warning"|"danger"|null, benchmark:number|null, diff:number|null}} [props.benchmark] -
 *        resultado de `getBenchmarkStatus()` (`src/utils/benchmarks.js`); si `status` es `null`/omitido, no se muestra el punto
 */
export default function MetricCard({ titulo, valor, porcentajeCrecimiento, benchmark }) {
  const hasGrowth = typeof porcentajeCrecimiento === "number" && !Number.isNaN(porcentajeCrecimiento);
  const isPositive = hasGrowth && porcentajeCrecimiento >= 0;

  return (
    <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm hover:shadow-md hover:border-livo-blue-200 dark:hover:border-livo-blue-400/40 transition-shadow duration-200">
      {/* Título — Poppins, texto secundario — + punto semafórico de benchmark si aplica */}
      <div className="flex items-center gap-1.5 mb-2">
        <p className="font-body text-sm text-[#666] dark:text-white/60">{titulo}</p>
        <BenchmarkDot benchmark={benchmark} />
      </div>

      <div className="flex items-end justify-between gap-4">
        {/* Valor — T29 Carbon (numérico) */}
        <p className="font-mono font-bold text-3xl text-black dark:text-white leading-none">{valor}</p>

        {/* Badge de variación — Success/Error semántico del design system */}
        {hasGrowth && (
          <span
            className={[
              "inline-flex items-center gap-1 px-[10px] py-[4px] rounded-badge text-xs font-bold shrink-0",
              isPositive
                ? "bg-[#DCFCE7] text-[#15803D]"
                : "bg-[#FEE2E2] text-[#B91C1C]",
            ].join(" ")}
          >
            {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {Math.abs(porcentajeCrecimiento).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
