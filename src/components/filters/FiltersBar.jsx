/**
 * FiltersBar.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — barra de filtros superior del Dashboard.
 *
 * Vive dentro del área principal, encima de `DashboardSummary` y
 * `ReportsView`. Es un componente puro de presentación: no filtra
 * datos por sí mismo — reporta la selección de país y rango de fechas
 * al padre, que llama a `filterByCountry` / `filterByDateRange` del
 * hook `useHubspotData`.
 *
 * NOTA (Agente Documentador, 2026-07-09): este componente sustituye a
 * `src/components/filters/Filters.jsx` como barra de filtros oficial
 * del Dashboard (mismo propósito, layout adaptado a "barra superior" +
 * selector de rango por presets). `Filters.jsx` queda marcado como
 * legacy — ver comentario en ese archivo y sección "Siguientes pasos"
 * de handoff.md.
 * ------------------------------------------------------------------
 */

const COUNTRY_OPTIONS = [
  { value: "TODOS", label: "Todos los países" },
  { value: "MX", label: "México (MX)" },
  { value: "CO", label: "Colombia (CO)" },
  { value: "CL", label: "Chile (CL)" },
  { value: "AR", label: "Argentina (AR)" },
];

const DATE_PRESETS = [
  { value: "7", label: "Últimos 7 días" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 90 días" },
  { value: "custom", label: "Personalizado" },
];

// Clases compartidas — sección 8 (Inputs & Forms) de DESIGN_SYSTEM-LIVO.md.
const selectClasses =
  "h-11 w-full px-3 pr-9 bg-white border-[1.5px] border-[#DDD] rounded-input text-sm font-body text-[#111] " +
  "appearance-none cursor-pointer hover:border-[#AAA] focus:outline-none focus:border-livo-blue-500 " +
  "focus:shadow-focus-input transition-shadow";

const inputClasses =
  "h-11 w-full px-3 bg-white border-[1.5px] border-[#DDD] rounded-input text-sm font-body text-[#111] " +
  "focus:outline-none focus:border-livo-blue-500 focus:shadow-focus-input transition-shadow";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="w-4 h-4 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#666]"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.country] - "TODOS" | "MX" | "CO" | "CL" | "AR"
 * @param {(country:string)=>void} props.onCountryChange
 * @param {string} [props.datePreset] - "7" | "30" | "90" | "custom"
 * @param {(preset:string)=>void} [props.onDatePresetChange]
 * @param {string} [props.startDate] - yyyy-mm-dd, solo relevante si datePreset === "custom"
 * @param {string} [props.endDate] - yyyy-mm-dd
 * @param {(date:string)=>void} [props.onStartDateChange]
 * @param {(date:string)=>void} [props.onEndDateChange]
 */
export default function FiltersBar({
  country = "TODOS",
  onCountryChange,
  datePreset = "30",
  onDatePresetChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
}) {
  const isCustomRange = datePreset === "custom";

  function handleReset() {
    onCountryChange?.("TODOS");
    onDatePresetChange?.("30");
    onStartDateChange?.("");
    onEndDateChange?.("");
  }

  return (
    <div className="bg-white rounded-card border border-livo-gray shadow-sm p-4 sm:p-5 mb-6 sm:mb-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        {/* --- País --- */}
        <div className="w-full md:w-56">
          <label htmlFor="filters-country" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
            PAÍS
          </label>
          <div className="relative">
            <select
              id="filters-country"
              value={country}
              onChange={(e) => onCountryChange?.(e.target.value)}
              className={selectClasses}
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
        </div>

        {/* --- Rango de fechas (preset) --- */}
        <div className="w-full md:w-56">
          <label htmlFor="filters-date-preset" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
            RANGO DE FECHAS
          </label>
          <div className="relative">
            <select
              id="filters-date-preset"
              value={datePreset}
              onChange={(e) => onDatePresetChange?.(e.target.value)}
              className={selectClasses}
            >
              {DATE_PRESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon />
          </div>
        </div>

        {/* --- Fechas personalizadas (solo si datePreset === "custom") --- */}
        {isCustomRange && (
          <>
            <div className="w-full md:w-44">
              <label htmlFor="filters-start" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
                DESDE
              </label>
              <input
                id="filters-start"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className={inputClasses}
              />
            </div>
            <div className="w-full md:w-44">
              <label htmlFor="filters-end" className="block text-xs font-bold text-[#666] mb-1.5 tracking-[0.5px]">
                HASTA
              </label>
              <input
                id="filters-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className={inputClasses}
              />
            </div>
          </>
        )}

        {/* --- Limpiar filtros --- */}
        <button
          type="button"
          onClick={handleReset}
          className="h-11 px-[18px] rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] text-livo-blue-500
                     font-bold text-sm tracking-[0.5px] whitespace-nowrap
                     hover:bg-[#E8E8FF] active:bg-[#D0D0FF]
                     focus:outline-none focus:shadow-focus-primary transition-colors shrink-0 md:ml-auto"
        >
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}
