/**
 * DateRangeFilter.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — selector de rango de fechas estilo
 * Google Analytics: botón que abre un popover con lista de presets a
 * la izquierda y un calendario de 2 meses a la derecha, dropdown
 * "Personalizado" + campos de fecha, y botones Cancelar/Actualizar.
 *
 * Componente de presentación + estado de interacción local (qué mes se
 * está mostrando, selección "en progreso" antes de confirmar). La
 * agregación/cálculo real de rangos vive en `dateRangePresets.js`
 * (Agente de Datos, funciones puras). El commit final hacia afuera
 * ocurre solo al presionar "Actualizar" — hasta entonces todo es estado
 * interno ("staged"), igual que el diseño de referencia.
 * ------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import { DATE_PRESET_OPTIONS, computeDateRangeForPreset, buildCalendarMonth } from "../../utils/dateRangePresets";

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function parseISODate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function isSameDate(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isStrictlyBetween(date, start, end) {
  if (!start || !end) return false;
  const t = date.getTime();
  return t > start.getTime() && t < end.getTime();
}

function formatShort(date) {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function formatLong(date) {
  if (!date) return "";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 shrink-0 text-[#666]">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

function ChevronIcon({ direction = "left" }) {
  const d = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}

function RadioDot({ checked }) {
  return (
    <span
      className={[
        "w-[18px] h-[18px] rounded-full border-[1.5px] shrink-0 flex items-center justify-center transition-colors",
        checked ? "bg-livo-blue-500 border-livo-blue-500" : "bg-[#F5F5F5] border-[#AAA]",
      ].join(" ")}
    >
      {checked && <span className="w-2 h-2 rounded-full bg-white" />}
    </span>
  );
}

/**
 * Un mes del calendario (encabezado + grilla de días), usado dos veces
 * (mes actual + mes siguiente) dentro del popover.
 */
function MonthGrid({ year, month, pendingStart, pendingEnd, onDayClick }) {
  const weeks = buildCalendarMonth(year, month);

  return (
    <div className="w-full">
      <p className="text-center font-body font-bold text-xs text-[#111] mb-2 capitalize">
        {MONTH_NAMES[month]} {year}
      </p>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {WEEKDAY_LABELS.map((d) => (
              <th key={d} className="text-[10px] font-bold text-[#666] font-body pb-1">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, di) => {
                if (!cell) return <td key={di} className="p-0.5" />;

                const isStart = isSameDate(cell.date, pendingStart);
                const isEnd = isSameDate(cell.date, pendingEnd);
                const inRange = isStrictlyBetween(cell.date, pendingStart, pendingEnd);

                return (
                  <td
                    key={di}
                    className={[
                      "p-0.5 text-center",
                      inRange ? "bg-livo-blue-100" : "",
                      isStart ? "rounded-l-full" : "",
                      isEnd ? "rounded-r-full" : "",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      onClick={() => onDayClick(cell.date)}
                      className={[
                        "w-7 h-7 flex items-center justify-center text-xs rounded-full transition-colors",
                        isStart || isEnd
                          ? "bg-livo-blue-500 text-white font-bold"
                          : "text-[#111] hover:bg-livo-gray",
                      ].join(" ")}
                    >
                      {cell.day}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {object} props
 * @param {string} [props.preset] - value de DATE_PRESET_OPTIONS (default "all")
 * @param {string} [props.startDate] - yyyy-mm-dd (solo relevante si preset === "custom")
 * @param {string} [props.endDate] - yyyy-mm-dd
 * @param {(preset:string)=>void} props.onPresetChange
 * @param {(date:string)=>void} props.onStartDateChange
 * @param {(date:string)=>void} props.onEndDateChange
 */
export default function DateRangeFilter({
  preset = "all",
  startDate = "",
  endDate = "",
  onPresetChange,
  onStartDateChange,
  onEndDateChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPreset, setPendingPreset] = useState(preset);
  const [pendingStart, setPendingStart] = useState(() => parseISODate(startDate));
  const [pendingEnd, setPendingEnd] = useState(() => parseISODate(endDate));
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth() - 1);
  const containerRef = useRef(null);

  // Al abrir el popover, resincroniza el estado "en progreso" con lo ya
  // confirmado (props) y centra el calendario alrededor del rango actual.
  useEffect(() => {
    if (!isOpen) return;
    setPendingPreset(preset);
    const s = parseISODate(startDate);
    const e = parseISODate(endDate);
    setPendingStart(s);
    setPendingEnd(e);

    const anchor = e || s || new Date();
    let y = anchor.getFullYear();
    let m = anchor.getMonth() - 1;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar (y descartar cambios sin confirmar) al hacer click afuera o Escape.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function shiftMonth(delta) {
    let y = viewYear;
    let m = viewMonth + delta;
    while (m < 0) {
      m += 12;
      y -= 1;
    }
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function jumpViewToRange(start, end) {
    const anchor = end || start || new Date();
    let y = anchor.getFullYear();
    let m = anchor.getMonth() - 1;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    setViewYear(y);
    setViewMonth(m);
  }

  function handlePresetSelect(value) {
    setPendingPreset(value);
    if (value === "custom") return; // el usuario elige los días a mano en el calendario

    const range = computeDateRangeForPreset(value);
    const s = parseISODate(range.start);
    const e = parseISODate(range.end);
    setPendingStart(s);
    setPendingEnd(e);
    jumpViewToRange(s, e);
  }

  function handleDayClick(date) {
    // Cualquier click manual en el calendario pasa el preset a "Personalizado".
    setPendingPreset("custom");

    if (!pendingStart || pendingEnd || date < pendingStart) {
      setPendingStart(date);
      setPendingEnd(null);
      return;
    }
    setPendingEnd(date);
  }

  function handleUpdate() {
    onPresetChange?.(pendingPreset);
    if (pendingPreset === "custom") {
      onStartDateChange?.(pendingStart ? toISODateLocal(pendingStart) : "");
      onEndDateChange?.(pendingEnd ? toISODateLocal(pendingEnd) : "");
    }
    setIsOpen(false);
  }

  function handleCancel() {
    setIsOpen(false);
  }

  function toISODateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const committedRange = computeDateRangeForPreset(preset, startDate, endDate);
  const triggerLabel =
    committedRange.start && committedRange.end
      ? `${formatShort(parseISODate(committedRange.start))} – ${formatShort(parseISODate(committedRange.end))}`
      : DATE_PRESET_OPTIONS.find((o) => o.value === preset)?.label || "Rango de fechas";

  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="h-11 w-full md:min-w-[220px] px-3 flex items-center gap-2 bg-white border-[1.5px] border-[#DDD] rounded-input text-sm font-body text-[#111]
                   hover:border-[#AAA] focus:outline-none focus:border-livo-blue-500 focus:shadow-focus-input transition-shadow"
      >
        <CalendarIcon />
        <span className="truncate">{triggerLabel}</span>
      </button>

      {isOpen && (
        <div
          className="absolute z-30 mt-2 left-0 bg-white rounded-card border border-livo-gray shadow-tooltip p-3
                     w-[min(92vw,620px)] max-h-[80vh] overflow-y-auto"
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* --- Lista de presets --- */}
            <div className="md:w-36 shrink-0 md:border-r md:border-livo-gray md:pr-3 flex flex-row md:flex-col flex-wrap gap-0.5">
              {DATE_PRESET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePresetSelect(opt.value)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-card hover:bg-livo-gray/60 transition-colors text-left"
                >
                  <RadioDot checked={pendingPreset === opt.value} />
                  <span className="text-xs text-[#111] whitespace-nowrap">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* --- Calendario --- */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="w-7 h-7 flex items-center justify-center rounded-card text-[#666] hover:bg-livo-gray transition-colors"
                  aria-label="Mes anterior"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-card text-[#666] hover:bg-livo-gray transition-colors md:hidden"
                  aria-label="Mes siguiente"
                >
                  <ChevronIcon direction="right" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <MonthGrid
                  year={viewYear}
                  month={viewMonth}
                  pendingStart={pendingStart}
                  pendingEnd={pendingEnd}
                  onDayClick={handleDayClick}
                />
                <div className="hidden md:block relative">
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="absolute -right-1 -top-1 w-7 h-7 flex items-center justify-center rounded-card text-[#666] hover:bg-livo-gray transition-colors"
                    aria-label="Mes siguiente"
                  >
                    <ChevronIcon direction="right" />
                  </button>
                  <MonthGrid
                    year={nextYear}
                    month={nextMonth}
                    pendingStart={pendingStart}
                    pendingEnd={pendingEnd}
                    onDayClick={handleDayClick}
                  />
                </div>
              </div>

              {/* --- Dropdown "Personalizado" + fechas --- */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <div className="relative sm:w-32">
                  <select
                    value={pendingPreset}
                    onChange={(e) => handlePresetSelect(e.target.value)}
                    className="h-9 w-full px-2 pr-7 bg-white border-[1.5px] border-[#DDD] rounded-input text-xs font-body text-[#111]
                               appearance-none cursor-pointer hover:border-[#AAA] focus:outline-none focus:border-livo-blue-500
                               focus:shadow-focus-input transition-shadow"
                  >
                    {DATE_PRESET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-3.5 h-3.5 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#666]"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                  </svg>
                </div>
                <input
                  type="text"
                  readOnly
                  value={formatLong(pendingStart)}
                  placeholder="Fecha inicio"
                  className="h-9 flex-1 min-w-0 px-2 bg-[#F5F5F5] border-[1.5px] border-[#DDD] rounded-input text-xs font-body text-[#111] truncate"
                />
                <input
                  type="text"
                  readOnly
                  value={formatLong(pendingEnd)}
                  placeholder="Fecha fin"
                  className="h-9 flex-1 min-w-0 px-2 bg-[#F5F5F5] border-[1.5px] border-[#DDD] rounded-input text-xs font-body text-[#111] truncate"
                />
              </div>

              {/* --- Resumen + acciones --- */}
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <p className="text-xs text-[#111] font-medium">
                  {pendingStart && pendingEnd
                    ? `${formatShort(pendingStart)} – ${formatShort(pendingEnd)}`
                    : "Selecciona un rango en el calendario"}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="h-9 px-3 rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] text-livo-blue-500
                               font-bold text-xs tracking-[0.5px] hover:bg-[#E8E8FF] active:bg-[#D0D0FF]
                               focus:outline-none focus:shadow-focus-primary transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="h-9 px-3 rounded-btn bg-livo-blue-500 text-white font-bold text-xs tracking-[0.5px]
                               hover:bg-livo-blue-600 active:bg-livo-blue-700
                               focus:outline-none focus:shadow-focus-primary transition-colors"
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
