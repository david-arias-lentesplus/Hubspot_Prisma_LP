/**
 * ConversionFunnel.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — visualización de embudo de conversión
 * (Enviados → Entregados → Aperturas → Clics) para el detalle de una
 * campaña (`CampaignDetailView.jsx`). Reemplaza la grilla de tarjetas de
 * KPI sueltas (2026-07-09, a pedido explícito: mostrar visualmente cómo
 * se va reduciendo el volumen en cada paso, no solo listar números).
 *
 * Componente de presentación puro: recibe los pasos ya resueltos
 * (label + value, en orden decreciente esperado) y solo dibuja barras
 * proporcionales al primer paso + el % de conversión contra el paso
 * anterior y contra el total. No calcula nada de negocio — los valores
 * ya vienen de `dataService.js` (sentCount/deliveredCount/opensCount/
 * clicksCount).
 *
 * Solo usa tonos de `livo-blue` ya definidos en tailwind.config.js
 * (500→400→300→200), sin introducir colores fuera del sistema de diseño.
 * ------------------------------------------------------------------
 */

const STEP_BAR_CLASSES = ["bg-livo-blue-500", "bg-livo-blue-400", "bg-livo-blue-300", "bg-livo-blue-200"];
const STEP_TEXT_CLASSES = ["text-white", "text-white", "text-livo-blue-900", "text-livo-blue-900"];

/**
 * @param {object} props
 * @param {Array<{label:string, value:number}>} props.steps - pasos del embudo, en orden decreciente esperado
 */
export default function ConversionFunnel({ steps = [] }) {
  const maxValue = steps.length ? steps[0].value : 0;

  if (steps.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1C1C24] rounded-card p-6 border border-livo-gray dark:border-white/10 shadow-sm">
      <h3 className="font-display font-bold text-lg text-black dark:text-white mb-1">Embudo de conversión</h3>
      <p className="text-xs text-[#666] dark:text-white/60 mb-5">
        {steps.map((s) => s.label).join(" → ")}
      </p>

      <div className="flex flex-col gap-3">
        {steps.map((step, i) => {
          // Ancho mínimo 4% para que el último paso (normalmente el más
          // chico, ej. Clics) siga siendo visible/clickeable como barra.
          const widthPct = maxValue > 0 ? Math.max((step.value / maxValue) * 100, 4) : 0;
          const prevStep = i > 0 ? steps[i - 1] : null;
          const stepConversion = prevStep && prevStep.value > 0 ? (step.value / prevStep.value) * 100 : null;
          const overallConversion = maxValue > 0 ? (step.value / maxValue) * 100 : 0;

          return (
            <div key={step.label}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-1 text-xs">
                <span className="font-bold text-[#666] dark:text-white/50 tracking-[0.5px]">{step.label.toUpperCase()}</span>
                <span className="text-[#666] dark:text-white/60">
                  {stepConversion !== null && (
                    <span className="mr-2">
                      {stepConversion.toFixed(1)}% vs. {prevStep.label.toLowerCase()}
                    </span>
                  )}
                  <span className="font-mono font-bold text-black dark:text-white">{overallConversion.toFixed(1)}% del total</span>
                </span>
              </div>
              <div className="w-full h-9 bg-livo-gray dark:bg-white/10 rounded-input overflow-hidden">
                <div
                  className={`h-full ${STEP_BAR_CLASSES[i % STEP_BAR_CLASSES.length]} ${STEP_TEXT_CLASSES[i % STEP_TEXT_CLASSES.length]} flex items-center px-3 rounded-input transition-all duration-300`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="font-mono font-bold text-sm whitespace-nowrap">
                    {step.value.toLocaleString("es-MX")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
