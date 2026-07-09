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
 * (KPIs completos + análisis comparativo + iframe de vista previa del
 * correo, usando el campo `previewUrl` de dataService.js).
 * ------------------------------------------------------------------
 */

const COUNTRY_LABELS = { MX: "MX", CO: "CO", CL: "CL", AR: "AR", OTHER: "Otros" };

function EmptyState({ message }) {
  return <div className="h-40 flex items-center justify-center text-sm text-[#AAA]">{message}</div>;
}

function LoadingSkeleton() {
  return <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm h-96 animate-pulse" />;
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "2-digit" });
}

/**
 * @param {object} props
 * @param {Array<object>} [props.data] - dataset ya filtrado (país/fecha), proveniente de `useHubspotData`
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {(campaign:object)=>void} [props.onSelectCampaign] - abre el detalle de la fila clickeada
 */
export default function CampaignsView({ data = [], loading = false, error = null, onSelectCampaign }) {
  if (error) {
    return (
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-card p-6 text-sm text-[#B91C1C]">
        No se pudieron cargar las campañas: {error}
      </div>
    );
  }

  if (loading) return <LoadingSkeleton />;

  const rows = [...data].sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));

  return (
    <div className="bg-white rounded-card p-6 border border-livo-gray shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-lg text-black">Campañas</h3>
        <span className="text-xs font-bold text-[#666] tracking-[0.5px]">{rows.length} campañas</span>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No hay campañas para el país/rango de fechas seleccionado." />
      ) : (
        <div className="overflow-auto max-h-[560px] -mx-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs font-bold text-[#666] tracking-[0.5px] border-b border-livo-gray">
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
              {rows.map((row, i) => (
                <tr
                  key={row.campaignId || `${row.campaignName}-${i}`}
                  onClick={() => onSelectCampaign?.(row)}
                  className="border-b border-livo-gray last:border-0 hover:bg-livo-gray/50 transition-colors cursor-pointer"
                >
                  <td
                    className="px-2 py-3 font-body text-livo-blue-600 font-medium underline decoration-transparent hover:decoration-livo-blue-500 truncate max-w-[260px] transition-colors"
                    title={row.campaignName}
                  >
                    {row.campaignName || "(Sin nombre)"}
                  </td>
                  <td className="px-2 py-3">
                    <span className="inline-flex items-center px-[10px] py-[2px] rounded-badge text-xs font-bold bg-[#E8E8FF] border border-livo-blue-600 text-livo-blue-600">
                      {COUNTRY_LABELS[row.country] || row.country}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-[#666]">{formatDate(row.sentDate)}</td>
                  <td className="px-2 py-3 text-right font-mono text-[#111]">
                    {row.sentCount.toLocaleString("es-MX")}
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-[#666]">{row.openRate.toFixed(1)}%</td>
                  <td className="px-2 py-3 text-right font-mono font-bold text-black">
                    {row.clickRate.toFixed(1)}%
                  </td>
                  <td className="px-2 py-3 text-right font-mono text-[#666]">{row.bounceRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
