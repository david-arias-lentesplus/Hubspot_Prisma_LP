/**
 * CampaignsView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — vista "Campañas" del sidebar.
 *
 * Tabla completa (no solo Top 5) de las campañas del dataset ya
 * filtrado (país/fecha) que recibe desde `App.jsx`. Componente de
 * presentación puro: no filtra ni ordena datos "de negocio" más allá
 * de un orden de despliegue fijo (fecha de envío descendente), y no
 * hace fetch — todo eso vive en `useHubspotData` / `dataService.js`.
 *
 * FILAS CLICKEABLES (2026-07-09): cada fila invoca `onSelectCampaign(row)`
 * al hacer click, que `App.jsx` usa para mostrar `CampaignDetailView`
 * (embudo de conversión + análisis comparativo + tarjeta de vista previa,
 * ver CampaignDetailView.jsx).
 *
 * TOOLTIPS DE VALOR ABSOLUTO (2026-07-09): cada celda de % (Apertura/
 * Clics/Rebote) muestra al hacer hover el conteo absoluto detrás de esa
 * tasa (ej. "3,095 aperturas de 20,413 entregados"), vía `Tooltip.jsx`
 * (CSS puro, sin librerías).
 *
 * BUSCADOR + PAGINACIÓN (2026-07-09, fase "Enterprise"): la vista ya no
 * renderiza las 436+ filas del dataset filtrado de una sola vez — pagina
 * en memoria de a `DEFAULT_PAGE_SIZE` (15) filas (`utils/pagination.js`,
 * Agente de Datos) y agrega un buscador local que filtra por Asunto o
 * Nombre del correo (`filterCampaignsBySearch`, `reportAggregations.js`).
 * `searchTerm` y `currentPage` son estado puramente de presentación de
 * esta vista (no viven en `App.jsx`, no son "filtros" del dashboard como
 * país/tipo/fecha) — cada paso pesado (ordenar, filtrar, paginar) está
 * envuelto en `useMemo` con las dependencias mínimas necesarias, para
 * que escribir en el buscador NO dispare un recálculo del ordenamiento
 * completo, y cambiar de página NO dispare un recálculo del filtro de
 * búsqueda. Ver handoff.md sección 3/8 para la decisión de arquitectura
 * completa (paginación + useMemo en vez de `localStorage`).
 * ------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from "react";
import Tooltip from "../common/Tooltip";
import { filterCampaignsBySearch } from "../../utils/reportAggregations";
import { paginate, DEFAULT_PAGE_SIZE } from "../../utils/pagination";

const COUNTRY_LABELS = { MX: "MX", CO: "CO", CL: "CL", AR: "AR", OTHER: "Otros" };

function EmptyState({ message }) {
  return <div className="h-40 flex items-center justify-center text-sm text-[#AAA] dark:text-white/40">{message}</div>;
}

function LoadingSkeleton() {
  return <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm h-96 animate-pulse" />;
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 shrink-0 text-[#666]">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="m21 21-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
    </svg>
  );
}

/** Buscador local (no es un "filtro" del dashboard — solo re-ordena qué se ve dentro de la página actual). */
function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="relative w-full sm:w-64 shrink-0">
      <label htmlFor="campaigns-search" className="sr-only">
        Buscar por asunto o nombre del correo
      </label>
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <SearchIcon />
      </span>
      <input
        id="campaigns-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por asunto o nombre..."
        className="h-9 w-full pl-8 pr-3 bg-white dark:bg-white/5 border-[1.5px] border-[#DDD] dark:border-white/20 rounded-input text-xs font-body text-[#111] dark:text-white
                   placeholder:text-[#AAA] hover:border-[#AAA] focus:outline-none focus:border-livo-blue-500
                   focus:shadow-focus-input transition-shadow"
      />
      {value && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#AAA] dark:text-white/40">{resultCount}</span>
      )}
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-livo-gray dark:border-white/10">
      <span className="text-xs text-[#666] dark:text-white/60 mr-auto">
        Página {currentPage} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="h-8 px-3 rounded-btn border-[1.5px] border-[#DDD] dark:border-white/20 text-xs font-bold text-[#666] dark:text-white/60
                   hover:border-livo-blue-500 hover:text-livo-blue-600 dark:hover:text-livo-blue-300 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:border-[#DDD] disabled:hover:text-[#666] transition-colors"
      >
        Anterior
      </button>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="h-8 px-3 rounded-btn border-[1.5px] border-[#DDD] dark:border-white/20 text-xs font-bold text-[#666] dark:text-white/60
                   hover:border-livo-blue-500 hover:text-livo-blue-600 dark:hover:text-livo-blue-300 disabled:opacity-40 disabled:cursor-not-allowed
                   disabled:hover:border-[#DDD] disabled:hover:text-[#666] transition-colors"
      >
        Siguiente
      </button>
    </div>
  );
}

/**
 * @param {object} props
 * @param {Array<object>} [props.data] - dataset ya filtrado (país/fecha), proveniente de `useHubspotData`
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {(campaign:object)=>void} [props.onSelectCampaign] - abre el detalle de la fila clickeada
 */
export default function CampaignsView({ data = [], loading = false, error = null, onSelectCampaign }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 1) Orden por fecha de envío descendente — solo depende de `data`
  //    (cambia cuando los filtros globales de App.jsx cambian, NO cuando
  //    el usuario escribe en el buscador o cambia de página).
  const sortedRows = useMemo(
    () => [...data].sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate)),
    [data]
  );

  // 2) Filtro de búsqueda (Asunto / Nombre del correo) — depende de
  //    `sortedRows` + `searchTerm`, no se recalcula al cambiar de página.
  const filteredRows = useMemo(
    () => filterCampaignsBySearch(sortedRows, searchTerm),
    [sortedRows, searchTerm]
  );

  // 3) Paginación en memoria (15 por página) — depende de `filteredRows` +
  //    `currentPage`, no se recalcula al tipear en el buscador (ese cambio
  //    ya está capturado por el paso 2, que corre antes).
  const { items: pageRows, totalPages, totalItems } = useMemo(
    () => paginate(filteredRows, currentPage, DEFAULT_PAGE_SIZE),
    [filteredRows, currentPage]
  );

  // Si el buscador o el dataset filtrado (país/tipo/fecha) cambian, volver
  // a la página 1 — evita quedar "atrapado" en una página que ya no existe.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, data]);

  if (error) {
    return (
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-card p-6 text-sm text-[#B91C1C]">
        No se pudieron cargar las campañas: {error}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-display font-bold text-lg text-black dark:text-white">Campañas</h3>
          <span className="text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px]">
            {totalItems} campaña{totalItems === 1 ? "" : "s"}
          </span>
        </div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} resultCount={totalItems} />
      </div>

      {totalItems === 0 ? (
        <EmptyState
          message={
            searchTerm
              ? `Ninguna campaña coincide con "${searchTerm}".`
              : "No hay campañas para el país/rango de fechas seleccionado."
          }
        />
      ) : (
        <>
          <div className="overflow-auto -mx-2">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-[#1C1C24]">
                <tr className="text-left text-xs font-bold text-[#666] dark:text-white/50 tracking-[0.5px] border-b border-livo-gray dark:border-white/10">
                  <th className="px-2 py-2">Campaña</th>
                  <th className="px-2 py-2">País</th>
                  <th className="px-2 py-2">Fecha de envío</th>
                  <th className="px-2 py-2 text-right">Enviados</th>
                  <th className="px-2 py-2 text-right">Apertura</th>
                  <th className="px-2 py-2 text-right">Clics</th>
                  <th className="px-2 py-2 text-right">Rebote</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, i) => (
                  <tr
                    key={row.campaignId || `${row.campaignName}-${i}`}
                    onClick={() => onSelectCampaign?.(row)}
                    className="border-b border-livo-gray dark:border-white/10 last:border-0 hover:bg-livo-gray/50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td
                      className="px-2 py-3 font-body text-livo-blue-600 dark:text-livo-blue-300 font-medium underline decoration-transparent hover:decoration-livo-blue-500 truncate max-w-[260px] transition-colors"
                      title={row.campaignName}
                    >
                      {row.campaignName || "(Sin nombre)"}
                    </td>
                    <td className="px-2 py-3">
                      <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-[#E8E8FF] border border-livo-blue-600 text-livo-blue-600">
                        {COUNTRY_LABELS[row.country] || row.country}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[#666] dark:text-white/60">{formatDate(row.sentDate)}</td>
                    <td className="px-2 py-3 text-right font-mono text-[#111] dark:text-white/90">
                      {row.sentCount.toLocaleString("es-MX")}
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[#666] dark:text-white/60">
                      <Tooltip
                        label={`${row.opensCount.toLocaleString("es-MX")} aperturas de ${row.deliveredCount.toLocaleString("es-MX")} entregados`}
                      >
                        {row.openRate.toFixed(1)}%
                      </Tooltip>
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-bold text-black dark:text-white">
                      <Tooltip
                        label={`${row.clicksCount.toLocaleString("es-MX")} clics de ${row.deliveredCount.toLocaleString("es-MX")} entregados`}
                      >
                        {row.clickRate.toFixed(1)}%
                      </Tooltip>
                    </td>
                    <td className="px-2 py-3 text-right font-mono text-[#666] dark:text-white/60">
                      <Tooltip
                        label={`${row.bounceCount.toLocaleString("es-MX")} rebotes de ${row.sentCount.toLocaleString("es-MX")} enviados`}
                      >
                        {row.bounceRate.toFixed(1)}%
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  );
}
