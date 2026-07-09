/**
 * SettingsView.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — vista "Configuración" del sidebar.
 *
 * Panel INFORMATIVO de solo lectura: nombre y origen de la fuente de
 * datos, estado de la última carga y un botón para forzar un refetch
 * manual (usa `refetch()` de `useHubspotData`). No filtra ni transforma
 * datos, y no expone ningún campo editable — la URL del CSV y el enlace
 * a la hoja de cálculo se muestran en inputs deshabilitados (2026-07-09,
 * a pedido explícito: esta página es solo para consulta).
 * ------------------------------------------------------------------
 */

function formatTimestamp(date) {
  if (!date) return "—";
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5h5v5M19 5l-9 9M9 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3"
      />
    </svg>
  );
}

// Clases compartidas para los "campos" de solo lectura de esta vista — se
// ven como inputs del sistema de diseño pero con `disabled`, para dejar
// visualmente claro que no son editables desde aquí.
const readOnlyFieldClasses =
  "h-11 w-full px-3 bg-livo-gray/60 border-[1.5px] border-[#DDD] rounded-input text-xs font-mono text-[#666] " +
  "truncate cursor-not-allowed disabled:opacity-100";

/**
 * @param {object} props
 * @param {string} props.csvUrl - URL del CSV consumido (HUBSPOT_CSV_URL de dataService.js)
 * @param {string} [props.sheetName] - nombre de la hoja de cálculo origen de los datos
 * @param {string} [props.sheetUrl] - URL de la hoja de cálculo en Google Sheets (para abrir en pestaña nueva)
 * @param {number} props.rowCount - filas actualmente cargadas (data.length)
 * @param {Date|null} props.lastFetchedAt
 * @param {boolean} props.loading
 * @param {() => void} props.onRefetch
 */
export default function SettingsView({
  csvUrl,
  sheetName = "BD Emails Hubspot",
  sheetUrl,
  rowCount = 0,
  lastFetchedAt,
  loading = false,
  onRefetch,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 max-w-2xl">
      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-black">Fuente de datos</h3>
          <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-livo-gray/70 border border-[#DDD] text-[#666]">
            Solo lectura
          </span>
        </div>

        <dl className="grid grid-cols-1 gap-4 text-sm">
          <div>
            <dt className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">NOMBRE DE LA HOJA DE CÁLCULO</dt>
            <dd className="font-body font-bold text-[#111]">{sheetName}</dd>
          </div>

          <div>
            <dt className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">URL DEL CSV PUBLICADO</dt>
            <input type="text" readOnly disabled value={csvUrl} className={readOnlyFieldClasses} />
          </div>

          {sheetUrl && (
            <div>
              <dt className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">HOJA DE CÁLCULO EN GOOGLE SHEETS</dt>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" readOnly disabled value={sheetUrl} className={readOnlyFieldClasses} />
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] text-livo-blue-500
                             font-bold text-xs tracking-[0.5px] whitespace-nowrap shrink-0
                             hover:bg-[#E8E8FF] active:bg-[#D0D0FF]
                             focus:outline-none focus:shadow-focus-primary transition-colors"
                >
                  Abrir hoja <ExternalLinkIcon />
                </a>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">FILAS CARGADAS</dt>
              <dd className="font-mono font-bold text-xl text-black">{rowCount.toLocaleString("es-MX")}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-[#666] tracking-[0.5px] mb-1">ÚLTIMA ACTUALIZACIÓN</dt>
              <dd className="font-mono text-sm text-[#111]">{formatTimestamp(lastFetchedAt)}</dd>
            </div>
          </div>
        </dl>

        <button
          type="button"
          onClick={onRefetch}
          disabled={loading}
          className="mt-6 h-11 px-[18px] rounded-btn bg-livo-blue-500 text-white font-bold text-sm tracking-[0.5px]
                     hover:bg-livo-blue-600 active:bg-livo-blue-700
                     focus:outline-none focus:shadow-focus-primary transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Actualizando…" : "Refrescar datos"}
        </button>
        <p className="mt-2 text-xs text-[#AAA]">
          Este botón solo vuelve a consultar la fuente — ningún campo de esta página es editable.
        </p>
      </div>

      <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
        <h3 className="font-display font-bold text-lg text-black mb-2">Sistema de diseño</h3>
        <p className="text-sm text-[#666]">
          Toda la UI sigue <code className="font-mono text-xs bg-livo-gray/60 px-1.5 py-0.5 rounded">DESIGN_SYSTEM-LIVO.md</code> —
          paleta de marca Prisma, tipografía Ballinger/Poppins/T29 Carbon y spacing base-4px. No configurable desde aquí.
        </p>
      </div>
    </div>
  );
}
