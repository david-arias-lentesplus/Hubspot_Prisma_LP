/**
 * Filters.jsx
 * ------------------------------------------------------------------
 * ⚠️ LEGACY (2026-07-09): sustituido por `FiltersBar.jsx` en este mismo
 * directorio, que cubre el mismo caso de uso como "barra superior"
 * dentro del área principal (país + rango de fechas con presets).
 * Se conserva por ahora sin cambios funcionales; usar `FiltersBar.jsx`
 * en cualquier vista nueva. Ver handoff.md → "Siguientes pasos" para
 * el retiro definitivo de este archivo.
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — barra de filtros del Dashboard de HubSpot.
 *
 * Componente puro de presentación: no filtra datos por sí mismo.
 * Reporta selección de país y rango de fechas al padre, que a su vez
 * llama a `filterByCountry` / `filterByDateRange` del hook
 * `useHubspotData`.
 * ------------------------------------------------------------------
 */

const COUNTRY_OPTIONS = [
  { value: "TODOS", label: "Todos los países" },
  { value: "MX", label: "México (MX)" },
  { value: "CO", label: "Colombia (CO)" },
  { value: "CL", label: "Chile (CL)" },
  { value: "AR", label: "Argentina (AR)" },
];

// Clases compartidas por los controles, siguiendo la sección 8 (Inputs & Forms) del design system.
const inputClasses =
  "w-full h-11 px-3 py-2.5 bg-white border-[1.5px] border-[#DDD] rounded-input text-sm font-body text-[#111] " +
  "focus:outline-none focus:border-livo-blue-500 focus:shadow-focus-input transition-shadow";

/**
 * @param {object} props
 * @param {string} props.country - país actualmente seleccionado ("TODOS" | "MX" | "CO" | "CL" | "AR")
 * @param {(country:string)=>void} props.onCountryChange
 * @param {string} [props.startDate] - fecha inicio (formato yyyy-mm-dd, para <input type="date">)
 * @param {string} [props.endDate] - fecha fin (formato yyyy-mm-dd)
 * @param {(startDate:string)=>void} props.onStartDateChange
 * @param {(endDate:string)=>void} props.onEndDateChange
 */
export default function Filters({
  country = "TODOS",
  onCountryChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
}) {
  return (
    <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm flex flex-col sm:flex-row sm:items-end gap-4">
      {/* --- Filtro por país --- */}
      <div className="flex-1 min-w-[180px]">
        <label htmlFor="country-filter" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
          PAÍS
        </label>
        <select
          id="country-filter"
          value={country}
          onChange={(e) => onCountryChange?.(e.target.value)}
          className={inputClasses}
        >
          {COUNTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* --- Rango de fechas --- */}
      <div className="flex-1 min-w-[160px]">
        <label htmlFor="start-date" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
          DESDE
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange?.(e.target.value)}
          className={inputClasses}
        />
      </div>

      <div className="flex-1 min-w-[160px]">
        <label htmlFor="end-date" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
          HASTA
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange?.(e.target.value)}
          className={inputClasses}
        />
      </div>

      {/* --- Limpiar filtros --- */}
      <button
        type="button"
        onClick={() => {
          onCountryChange?.("TODOS");
          onStartDateChange?.("");
          onEndDateChange?.("");
        }}
        className="h-11 px-[18px] rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] text-livo-blue-500
                   font-bold text-sm tracking-[0.5px] hover:bg-[#E8E8FF] active:bg-[#D0D0FF]
                   focus:outline-none focus:shadow-focus-primary transition-colors shrink-0"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
