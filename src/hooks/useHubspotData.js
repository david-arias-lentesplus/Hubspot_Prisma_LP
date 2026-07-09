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
 *   - filterByDateRange: (startDate, endDate) => array
 *   - filterByCountry:   (countryCode) => array
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

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchHubspotData();
        if (isMounted) setData(rows);
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
    filterByDateRange,
    filterByCountry,
    getGlobalMetrics,
    globalMetrics,
  };
}

export default useHubspotData;
