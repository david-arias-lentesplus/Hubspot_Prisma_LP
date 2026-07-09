/**
 * useTheme.js
 * ------------------------------------------------------------------
 * Agente de Datos / Utils — hook de modo oscuro (2026-07-09, fase
 * "Enterprise").
 *
 * DECISIÓN DE ARQUITECTURA — SIN localStorage (ver handoff.md sección
 * 3/8 para el detalle completo): la preferencia de tema NO se persiste
 * entre recargas. Cada carga de la página arranca en **modo claro por
 * defecto** (pedido explícito de David, 2026-07-09 — se dejó de seguir
 * `prefers-color-scheme` del sistema operativo como estado inicial), y
 * el toggle del sidebar solo cambia el estado en memoria para la sesión
 * actual. Esto es intencional — David pidió explícitamente no usar
 * `localStorage` en esta fase (ligado al objetivo de mantener la app
 * liviana con miles de correos, evitando cachear cualquier estado en
 * disco del navegador) y, aunque la restricción original apuntaba a la
 * DATA CRUDA del CSV, se aplicó el mismo criterio conservador acá para
 * no introducir un uso de `localStorage` que no fue pedido. Si en el
 * futuro se quiere persistir la preferencia de tema entre sesiones, es
 * un cambio de una línea (useEffect que lea/escriba `localStorage`) —
 * ver "Próximos pasos" en handoff.md.
 *
 * SIN CONTEXT API: el árbol de componentes de este dashboard es corto
 * (App → DashboardLayout / vistas, 1-2 niveles), así que `isDark` y
 * `toggleTheme` se pasan por props explícitos ("prop drilling") desde
 * `App.jsx`, siguiendo el mismo patrón ya usado para los filtros
 * (`country`, `campaignType`, etc.) — agregar React Context solo para
 * esto sería complejidad injustificada en un árbol tan chico.
 *
 * La clase `dark` se aplica a `document.documentElement` (el `<html>`),
 * el patrón estándar para `darkMode: 'class'` de Tailwind — así
 * cualquier `dark:` utility en cualquier componente (incluido contenido
 * que se renderice fuera del árbol de `<App />`, si lo hubiera) queda
 * cubierto.
 * ------------------------------------------------------------------
 */

import { useState, useEffect, useCallback } from "react";

// Modo claro por defecto (2026-07-09) — ya NO se consulta
// `prefers-color-scheme` del sistema operativo como estado inicial.
// El usuario puede seguir alternando a oscuro con el toggle del
// sidebar; ese cambio vive en memoria para la sesión (ver comentario
// de cabecera — sin localStorage).
function getInitialIsDark() {
  return false;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(getInitialIsDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggleTheme };
}

export default useTheme;
