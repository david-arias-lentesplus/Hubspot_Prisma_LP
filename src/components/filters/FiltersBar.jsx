/**
 * FiltersBar.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — barra de filtros superior del Dashboard.
 *
 * Vive dentro del área principal, encima de `DashboardSummary` y
 * `ReportsView`. Es un componente puro de presentación: no filtra
 * datos por sí mismo — reporta la selección de país, tipo de envío y
 * rango de fechas al padre, que llama a `filterByCountry` /
 * `filterByType` / `filterByDateRange` del hook `useHubspotData`.
 *
 * FILTRO GENERAL (2026-07-09): el selector "Tipo de envío" (Todos /
 * Marketing / Automatizado / Flujo de trabajo) es un filtro global del
 * dashboard — aplica en Resumen, Campañas y Países por igual, ya que
 * `App.jsx` monta una sola `FiltersBar` compartida y deriva el dataset
 * filtrado antes de pasarlo a cada vista.
 *
 * NOTA (Agente Documentador, 2026-07-09): este componente sustituye a
 * `src/components/filters/Filters.jsx` como barra de filtros oficial
 * del Dashboard (mismo propósito, layout adaptado a "barra superior" +
 * selector de rango por presets). `Filters.jsx` queda marcado como
 * legacy — ver comentario en ese archivo y sección "Siguientes pasos"
 * de handoff.md.
 *
 * NOTA 2 (2026-07-09): el rango de fechas ya no es un <select> simple —
 * se reemplazó por `DateRangeFilter.jsx`, un popover estilo Google
 * Analytics (lista de presets + calendario de 2 meses + Cancelar/
 * Actualizar). Los presets y el cálculo de rangos viven en
 * `src/utils/dateRangePresets.js`.
 *
 * BARRA COMPACTA EN EL HEADER (2026-07-09): se rediseñó de tarjeta
 * propia (`bg-white` + `border` + `p-4/5`, ocupando una fila completa
 * arriba del contenido) a una fila compacta sin envoltorio, pensada
 * para vivir dentro del header de `DashboardLayout` junto al título de
 * la vista (`title` a la izquierda, filtros a la derecha vía el prop
 * `headerActions`). Esto libera espacio vertical para mostrar más
 * contenido en una sola pantalla — ver `handoff.md` sección 4. Las
 * etiquetas ("PAÍS", "TIPO DE ENVÍO"...) que antes iban arriba de cada
 * control ahora son `sr-only` (accesibles pero no ocupan espacio
 * visual); el `<select>` sigue comunicando el filtro activo mediante su
 * opción seleccionada.
 * ------------------------------------------------------------------
 */

import DateRangeFilter from "./DateRangeFilter";

const COUNTRY_OPTIONS = [
  { value: "TODOS", label: "Todos los países" },
  { value: "MX", label: "México (MX)" },
  { value: "CO", label: "Colombia (CO)" },
  { value: "CL", label: "Chile (CL)" },
  { value: "AR", label: "Argentina (AR)" },
];

// Códigos alineados con `campaignType` de dataService.js (getCampaignTypeFromName).
const TYPE_OPTIONS = [
  { value: "TODOS", label: "Todos los tipos" },
  { value: "MKT", label: "Marketing" },
  { value: "AUTO", label: "Automatizado" },
  { value: "WORKFLOW", label: "Flujo de trabajo" },
];

// Clases compartidas — versión compacta de sección 8 (Inputs & Forms) de
// DESIGN_SYSTEM-LIVO.md, adaptada para vivir en el header (h-9 en vez de h-11).
const selectClasses =
  "h-9 w-full pl-2.5 pr-7 bg-white border-[1.5px] border-[#DDD] rounded-input text-xs font-body text-[#111] " +
  "appearance-none cursor-pointer hover:border-[#AAA] focus:outline-none focus:border-livo-blue-500 " +
  "focus:shadow-focus-input transition-shadow";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className="w-3.5 h-3.5 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#666]"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} [props.country] - "TODOS" | "MX" | "CO" | "CL" | "AR"
 * @param {(country:string)=>void} props.onCountryChange
 * @param {string} [props.campaignType] - "TODOS" | "MKT" | "AUTO" | "WORKFLOW"
 * @param {(type:string)=>void} [props.onCampaignTypeChange]
 * @param {string} [props.datePreset] - value de DATE_PRESET_OPTIONS (dateRangePresets.js), default "all"
 * @param {(preset:string)=>void} [props.onDatePresetChange]
 * @param {string} [props.startDate] - yyyy-mm-dd, solo relevante si datePreset === "custom"
 * @param {string} [props.endDate] - yyyy-mm-dd
 * @param {(date:string)=>void} [props.onStartDateChange]
 * @param {(date:string)=>void} [props.onEndDateChange]
 */
export default function FiltersBar({
  country = "TODOS",
  onCountryChange,
  campaignType = "TODOS",
  onCampaignTypeChange,
  datePreset = "all",
  onDatePresetChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
}) {
  function handleReset() {
    onCountryChange?.("TODOS");
    onCampaignTypeChange?.("TODOS");
    onDatePresetChange?.("all");
    onStartDateChange?.("");
    onEndDateChange?.("");
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* --- País --- */}
      <div className="relative w-[9.5rem]">
        <label htmlFor="filters-country" className="sr-only">
          País
        </label>
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

      {/* --- Tipo de envío (filtro general: Marketing/Automatizado/Flujo de trabajo) --- */}
      <div className="relative w-[9.5rem]">
        <label htmlFor="filters-type" className="sr-only">
          Tipo de envío
        </label>
        <select
          id="filters-type"
          value={campaignType}
          onChange={(e) => onCampaignTypeChange?.(e.target.value)}
          className={selectClasses}
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon />
      </div>

      {/* --- Rango de fechas (popover: presets + calendario de 2 meses) --- */}
      <DateRangeFilter
        preset={datePreset}
        startDate={startDate}
        endDate={endDate}
        onPresetChange={onDatePresetChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        compact
        align="right"
      />

      {/* --- Limpiar filtros --- */}
      <button
        type="button"
        onClick={handleReset}
        className="h-9 px-3 rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] text-livo-blue-500
                   font-bold text-xs tracking-[0.5px] whitespace-nowrap
                   hover:bg-[#E8E8FF] active:bg-[#D0D0FF]
                   focus:outline-none focus:shadow-focus-primary transition-colors shrink-0"
      >
        Limpiar filtros
      </button>
    </div>
  );
}
