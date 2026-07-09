/**
 * MetricCard.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — card de KPI para el Dashboard de HubSpot.
 *
 * Componente puro de presentación: recibe título, valor y variación
 * porcentual ya calculados (por `useHubspotData` / getGlobalMetrics)
 * y solo se encarga de mostrarlos siguiendo DESIGN_SYSTEM-LIVO.md.
 * ------------------------------------------------------------------
 */

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

/**
 * @param {object} props
 * @param {string} props.titulo - etiqueta del KPI (ej. "Tasa de apertura")
 * @param {string|number} props.valor - valor principal a mostrar (ej. "24.8%", "12,340")
 * @param {number} [props.porcentajeCrecimiento] - variación vs. período anterior (ej. 3.2 o -1.5)
 */
export default function MetricCard({ titulo, valor, porcentajeCrecimiento }) {
  const hasGrowth = typeof porcentajeCrecimiento === "number" && !Number.isNaN(porcentajeCrecimiento);
  const isPositive = hasGrowth && porcentajeCrecimiento >= 0;

  return (
    <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
      {/* Título — Poppins, texto secundario */}
      <p className="font-body text-sm text-[#666] mb-2">{titulo}</p>

      <div className="flex items-end justify-between gap-4">
        {/* Valor — T29 Carbon (numérico) */}
        <p className="font-mono font-bold text-3xl text-black leading-none">{valor}</p>

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
