/**
 * useHubspotData.js
 * ------------------------------------------------------------------
 * Agente de Datos y Análisis — custom hook de consumo de datos de
 * HubSpot para el Dashboard.
 *
 * Expone:
 *   - data:              array normalizado (ver dataService.js)
 *   - loading:           boolean
 *   - error:             string | null
 *   - lastFetchedAt:     Date | null — momento del último fetch exitoso
 *   - refetch:           () => void — vuelve a descargar el CSV bajo demanda
 *   - filterByDateRange: (startDate, endDate) => array
 *   - filterByCountry:   (countryCode) => array
 *   - filterByType:      (campaignType) => array — Marketing/Automatizado/Flujo de trabajo/Todos
 *   - getGlobalMetrics:  (dataset?) => { totalSent, avgOpenRate, avgClickRate, avgBounceRate }
 *
 * Los componentes UI (Agente UI/UX) consumen exclusivamente este hook:
 * nunca deben llamar a PapaParse o fetch directamente.
 * ------------------------------------------------------------------
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchHubspotData } from "../services/dataService";

export function useHubspotData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  // Incrementar este contador desde `refetch()` vuelve a disparar el useEffect
  // de abajo y repite la descarga del CSV bajo demanda (botón "Refrescar datos").
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchHubspotData();
        if (isMounted) {
          setData(rows);
          setLastFetchedAt(new Date());
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Error desconocido al cargar los datos de HubSpot.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  /**
   * Filtra un dataset (por defecto, `data`) por rango de fechas de envío.
   * Ambos límites son inclusivos. Si no se pasa alguno, no se aplica ese límite.
   * No muta el array original.
   */
  const filterByDateRange = useCallback(
    (startDate, endDate, dataset = data) => {
      if (!startDate && !endDate) return dataset;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      return dataset.filter((row) => {
        if (!row.sentDate) return false;
        const rowDate = new Date(row.sentDate);
        if (Number.isNaN(rowDate.getTime())) return false;
        if (start && rowDate < start) return false;
        if (end && rowDate > end) return false;
        return true;
      });
    },
    [data]
  );

  /**
   * Filtra un dataset (por defecto, `data`) por país, extraído del nombre
   * de campaña en dataService.js (prefijo MKT_XX). "TODOS" o falsy devuelve
   * el dataset completo sin filtrar. No muta el array original.
   */
  const filterByCountry = useCallback(
    (countryCode, dataset = data) => {
      if (!countryCode || countryCode.toUpperCase() === "TODOS") return dataset;
      const code = countryCode.toUpperCase();
      return dataset.filter((row) => row.country === code);
    },
    [data]
  );

  /**
   * Filtra un dataset (por defecto, `data`) por tipo de envío, extraído del
   * prefijo del nombre de campaña en dataService.js (`campaignType`:
   * "MKT" | "AUTO" | "WORKFLOW" | "OTHER"). "TODOS" o falsy devuelve el
   * dataset completo sin filtrar. Es un filtro general del dashboard —
   * aplica igual en Resumen, Campañas y Países. No muta el array original.
   */
  const filterByType = useCallback(
    (campaignType, dataset = data) => {
      if (!campaignType || campaignType.toUpperCase() === "TODOS") return dataset;
      const type = campaignType.toUpperCase();
      return dataset.filter((row) => row.campaignType === type);
    },
    [data]
  );

  /**
   * Calcula métricas globales sobre un dataset (por defecto, `data`):
   * suma de envíos, promedio de tasa de apertura y promedio de tasa de clics.
   * Devuelve ceros si el dataset está vacío (evita NaN / división por cero).
   */
  const getGlobalMetrics = useCallback((dataset = data) => {
    if (!dataset || dataset.length === 0) {
      return { totalSent: 0, avgOpenRate: 0, avgClickRate: 0, avgBounceRate: 0 };
    }

    const totalSent = dataset.reduce((sum, row) => sum + row.sentCount, 0);
    const avgOpenRate =
      dataset.reduce((sum, row) => sum + row.openRate, 0) / dataset.length;
    const avgClickRate =
      dataset.reduce((sum, row) => sum + row.clickRate, 0) / dataset.length;
    const avgBounceRate =
      dataset.reduce((sum, row) => sum + row.bounceRate, 0) / dataset.length;

    return {
      totalSent,
      avgOpenRate: Number(avgOpenRate.toFixed(2)),
      avgClickRate: Number(avgClickRate.toFixed(2)),
      avgBounceRate: Number(avgBounceRate.toFixed(2)),
    };
  }, [data]);

  // Métricas globales sobre el dataset completo, memoizadas para evitar recálculo innecesario.
  const globalMetrics = useMemo(() => getGlobalMetrics(data), [data, getGlobalMetrics]);

  return {
    data,
    loading,
    error,
    lastFetchedAt,
    refetch,
    filterByDateRange,
    filterByCountry,
    filterByType,
    getGlobalMetrics,
    globalMetrics,
  };
}

export default useHubspotData;
