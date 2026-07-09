/**
 * pagination.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — paginación genérica en memoria
 * (2026-07-09, fase "Enterprise").
 *
 * DECISIÓN DE ARQUITECTURA (ver handoff.md sección 3/8 para el detalle
 * completo): con miles de filas potenciales, renderizar la tabla
 * completa de "Campañas" en el DOM de una sola vez degrada el
 * rendimiento del navegador (miles de <tr> con Tooltips, listeners de
 * click, etc.). La solución NO es cachear la data cruda en
 * `localStorage` (eso no reduce nodos del DOM, solo evita un re-fetch) —
 * es paginar en memoria: `useHubspotData` sigue trayendo el dataset
 * completo una sola vez (fetch en el montaje o al refrescar
 * explícitamente), y `CampaignsView.jsx` solo renderiza la "rebanada"
 * de la página actual (`PAGE_SIZE` filas), recalculada con `useMemo`
 * para que escribir en el buscador o cambiar de página no dispare
 * ningún trabajo pesado sobre el dataset completo (el filtro de
 * búsqueda y el corte de página son O(n) sobre un array ya en memoria,
 * no hay I/O de por medio).
 *
 * Función pura: no conoce React ni el DOM.
 * ------------------------------------------------------------------
 */

export const DEFAULT_PAGE_SIZE = 15;

/**
 * Devuelve la "rebanada" de `items` correspondiente a `page` (1-indexado),
 * junto con el total de páginas y la página efectivamente aplicada
 * (recortada a un rango válido — nunca menor a 1 ni mayor al total).
 *
 * @param {Array<any>} items
 * @param {number} page - página deseada, 1-indexada
 * @param {number} [pageSize=DEFAULT_PAGE_SIZE]
 * @returns {{items:Array<any>, currentPage:number, totalPages:number, totalItems:number}}
 */
export function paginate(items = [], page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems,
  };
}
