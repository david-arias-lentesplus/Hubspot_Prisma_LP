/**
 * App.jsx
 * ------------------------------------------------------------------
 * Página contenedora del Dashboard — ensambla `DashboardLayout`,
 * `FiltersBar` y las vistas del sidebar ("Resumen", "Campañas",
 * "Países", "Configuración") alrededor del hook `useHubspotData`,
 * siguiendo la arquitectura de estado unificado documentada en
 * handoff.md sección 5.1.
 *
 * Responsabilidad de este archivo: mantener el estado de filtros
 * (país, tipo de envío, preset de rango de fechas, fechas
 * personalizadas) y el estado de navegación (qué item del sidebar está
 * activo), derivar el dataset filtrado y pasarlo hacia la vista
 * correspondiente. No contiene lógica de parseo/agregación de datos
 * (eso vive en dataService.js, useHubspotData.js y
 * reportAggregations.js).
 *
 * FILTRO GENERAL "Tipo de envío" (2026-07-09): Marketing / Automatizado /
 * Flujo de trabajo / Todos, extraído del prefijo del nombre de campaña
 * (`MKT_`, `AUTO_`, `WorkFlow_`/`Workflow_`). Se aplica en la misma
 * cadena de filtros que país y fecha, así que afecta por igual a
 * Resumen, Campañas y Países.
 *
 * DETALLE DE CAMPAÑA (2026-07-09): la vista "Campañas" alterna entre la
 * tabla (`CampaignsView`) y el detalle de una fila (`CampaignDetailView`)
 * mediante el estado local `selectedCampaignId`. La campaña se busca en
 * `data` (dataset completo, sin filtrar) por `campaignId` para que el
 * detalle siga siendo accesible aunque el usuario ajuste los filtros
 * mientras lo ve; el comparativo de KPIs contra pares sí usa
 * `filteredData` (el filtro activo) — ver `CampaignDetailView.jsx`.
 *
 * FILTROS EN EL HEADER (2026-07-09): `FiltersBar` ya no se renderiza
 * dentro de `<main>` como una tarjeta propia — se pasa como
 * `headerActions` a `DashboardLayout`, que la ubica en la misma fila
 * que el título de la vista (título a la izquierda, filtros a la
 * derecha). Esto libera espacio vertical para mostrar más contenido en
 * una sola pantalla. Solo se muestra en Resumen, Países y en Campañas
 * cuando no hay una campaña seleccionada (`showFilters`); en
 * Configuración y en el detalle de campaña no aplica.
 *
 * MODO OSCURO (2026-07-09, fase "Enterprise"): `useTheme()` vive acá
 * (nivel más alto con estado) y se pasa por props explícitos —
 * `isDark`/`onToggleTheme` a `DashboardLayout` (toggle en el sidebar +
 * clase `dark` en `<html>`) e `isDark` a `ReportsView` (colores de
 * Recharts, que no pueden usar clases `dark:` de Tailwind porque
 * Recharts pinta con SVG/inline styles, no con className). Sin
 * `localStorage` — arranca según `prefers-color-scheme` del sistema en
 * cada carga, ver `useTheme.js` para el detalle de la decisión.
 * ------------------------------------------------------------------
 */

import { useMemo, useState } from "react";
import DashboardLayout from "./components/layout/DashboardLayout";
import FiltersBar from "./components/filters/FiltersBar";
import DashboardSummary from "./components/metrics/DashboardSummary";
import ReportsView from "./components/reports/ReportsView";
import AdvancedInsights from "./components/insights/AdvancedInsights";
import CampaignsView from "./components/campaigns/CampaignsView";
import CampaignDetailView from "./components/campaigns/CampaignDetailView";
import CountriesView from "./components/countries/CountriesView";
import SettingsView from "./components/settings/SettingsView";
import useHubspotData from "./hooks/useHubspotData";
import useAdvancedAnalytics from "./hooks/useAdvancedAnalytics";
import useTheme from "./hooks/useTheme";
import { HUBSPOT_CSV_URL } from "./services/dataService";
import { computeDateRangeForPreset } from "./utils/dateRangePresets";

// Título mostrado en el header de `DashboardLayout` según el item activo del sidebar.
const VIEW_TITLES = {
  resumen: "Resumen",
  campanas: "Campañas",
  paises: "Países",
  configuracion: "Configuración",
};

export default function App() {
  const {
    data,
    loading,
    error,
    lastFetchedAt,
    refetch,
    filterByCountry,
    filterByType,
    filterByCommunicationType,
    filterByDateRange,
    getGlobalMetrics,
  } = useHubspotData();

  const [view, setView] = useState("resumen");
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  // Al navegar a otra sección del sidebar, se descarta cualquier detalle
  // de campaña abierto (evita volver a "Campañas" y quedar atrapado en
  // el detalle de una fila que ya no tiene contexto de navegación).
  function handleNavigate(nextView) {
    setSelectedCampaignId(null);
    setView(nextView);
  }

  const [country, setCountry] = useState("TODOS");
  const [campaignType, setCampaignType] = useState("TODOS");
  const [communicationType, setCommunicationType] = useState("TODOS");
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { start, end } = computeDateRangeForPreset(datePreset, startDate, endDate);

  // Dataset derivado: fecha → país → tipo de envío → tipo de comunicación.
  // No muta `data`. Memoizado: React solo recalcula esta cadena de filtros
  // cuando `data` o alguno de los filtros cambia — escribir en el buscador
  // de Campañas (estado local de esa vista, ver CampaignsView.jsx) o
  // cambiar de página NO dispara este cálculo de nuevo.
  const filteredData = useMemo(() => {
    const byDate = filterByDateRange(start, end);
    const byCountry = filterByCountry(country, byDate);
    const byType = filterByType(campaignType, byCountry);
    return filterByCommunicationType(communicationType, byType);
  }, [
    data,
    country,
    campaignType,
    communicationType,
    start,
    end,
    filterByDateRange,
    filterByCountry,
    filterByType,
    filterByCommunicationType,
  ]);

  const metrics = useMemo(() => getGlobalMetrics(filteredData), [filteredData, getGlobalMetrics]);

  // Analítica avanzada (2026-07-09): Insight del Asunto, Salud del dominio,
  // Mejor horario de envío — memoizada sobre el mismo `filteredData` que
  // usan DashboardSummary/ReportsView, así que respeta los filtros activos.
  const advancedAnalytics = useAdvancedAnalytics(filteredData);

  // Campaña seleccionada para el detalle: se busca en `data` completo (no
  // en `filteredData`) para que siga siendo accesible aunque el usuario
  // toque los filtros mientras ve el detalle.
  const selectedCampaign = useMemo(
    () => data.find((row) => row.campaignId === selectedCampaignId) || null,
    [data, selectedCampaignId]
  );

  const filtersBar = (
    <FiltersBar
      country={country}
      onCountryChange={setCountry}
      campaignType={campaignType}
      onCampaignTypeChange={setCampaignType}
      communicationType={communicationType}
      onCommunicationTypeChange={setCommunicationType}
      datePreset={datePreset}
      onDatePresetChange={setDatePreset}
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
    />
  );

  // La barra de filtros solo aplica a las vistas con dataset filtrable
  // (Resumen, Países, Campañas sin detalle abierto). Configuración es
  // puramente informativa y el detalle de campaña no tiene filtros propios.
  const showFilters = view === "resumen" || view === "paises" || (view === "campanas" && !selectedCampaignId);

  return (
    <DashboardLayout
      title={VIEW_TITLES[view] || "Resumen"}
      activeItemId={view}
      onNavigate={handleNavigate}
      headerActions={showFilters ? filtersBar : null}
      isDark={isDark}
      onToggleTheme={toggleTheme}
    >
      {view === "resumen" && (
        <>
          <div className="mb-6 sm:mb-8">
            <DashboardSummary metrics={metrics} loading={loading} error={error} />
          </div>
          <ReportsView data={filteredData} loading={loading} error={error} isDark={isDark} />
          <div className="mt-6 sm:mt-8">
            <AdvancedInsights {...advancedAnalytics} loading={loading} error={error} />
          </div>
        </>
      )}

      {view === "campanas" && (
        <>
          {selectedCampaignId ? (
            <CampaignDetailView
              campaign={selectedCampaign}
              dataset={filteredData}
              onBack={() => setSelectedCampaignId(null)}
            />
          ) : (
            <CampaignsView
              data={filteredData}
              loading={loading}
              error={error}
              onSelectCampaign={(row) => setSelectedCampaignId(row.campaignId)}
            />
          )}
        </>
      )}

      {view === "paises" && <CountriesView data={filteredData} loading={loading} error={error} />}

      {view === "configuracion" && (
        <SettingsView
          csvUrl={HUBSPOT_CSV_URL}
          sheetName="BD Emails Hubspot"
          sheetUrl="https://docs.google.com/spreadsheets/d/1ujjNuu8V4po-mFheWYR9nwyb-1wOXmHxh-vVv88fyEk/edit?usp=sharing"
          rowCount={data.length}
          lastFetchedAt={lastFetchedAt}
          loading={loading}
          onRefetch={refetch}
        />
      )}
    </DashboardLayout>
  );
}
