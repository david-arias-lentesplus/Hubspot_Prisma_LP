/**
 * Tooltip.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — tooltip reutilizable, 100% CSS (Tailwind
 * `group`/`group-hover`), sin ninguna librería externa (2026-07-09, ver
 * handoff.md sección 5 — se evaluó Radix UI / Headless UI y se descartó
 * a favor de esta implementación con `group-hover` porque cubre el caso
 * de uso completo: texto corto, sin necesidad de posicionamiento
 * dinámico ni portal).
 *
 * Envuelve cualquier `children` y muestra `label` en un globo flotante al
 * pasar el mouse por encima, usando únicamente CSS (`group`/`group-hover`)
 * — no depende de JS ni de estado de React, así que no hay riesgo de
 * quedarse "pegado" abierto ni de listeners que limpiar.
 * ------------------------------------------------------------------
 */

/**
 * @param {object} props
 * @param {string} props.label - texto del tooltip (ej. "3,095 aperturas de 20,413 entregados")
 * @param {React.ReactNode} props.children - elemento sobre el que se hace hover (ej. el "15.2%")
 * @param {"top"|"bottom"} [props.position="top"]
 */
export default function Tooltip({ label, children, position = "top" }) {
  const positionClasses =
    position === "bottom" ? "top-full left-1/2 -translate-x-1/2 mt-2" : "bottom-full left-1/2 -translate-x-1/2 mb-2";

  return (
    <span className="relative inline-block group cursor-help">
      {children}
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute z-40 hidden group-hover:block",
          "whitespace-nowrap bg-[#111] text-white text-xs font-body px-2.5 py-1.5 rounded-input shadow-tooltip",
          positionClasses,
        ].join(" ")}
      >
        {label}
      </span>
    </span>
  );
}
