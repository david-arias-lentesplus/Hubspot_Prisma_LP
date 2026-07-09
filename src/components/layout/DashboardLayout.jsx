/**
 * DashboardLayout.jsx
 * ------------------------------------------------------------------
 * Agente UI/UX Frontend — layout base del Dashboard de HubSpot.
 *
 * Estructura: Sidebar de navegación (fijo, fondo negro/estructura) +
 * área principal con header y contenido. Sigue DESIGN_SYSTEM-LIVO.md:
 * paleta LIVO, tipografía Ballinger/Poppins, spacing base-4px, radios
 * y sombras de foco definidos en tailwind.config.js.
 *
 * Este componente es puramente de presentación: no hace fetch ni
 * conoce la lógica de datos. Recibe el contenido de cada vista via
 * `children` y el título de la vista actual via `title`.
 *
 * BARRA DE FILTROS EN EL HEADER (2026-07-09): el header ahora acepta un
 * prop `headerActions` (ej. la `FiltersBar` compacta) que se renderiza
 * a la derecha del título, en la misma fila. Esto libera el espacio que
 * antes ocupaba la `FiltersBar` como tarjeta propia dentro de `<main>`,
 * mostrando más contenido en una sola pantalla. `App.jsx` decide qué
 * vista recibe `headerActions` (Resumen/Campañas/Países la reciben,
 * Configuración y el detalle de campaña no).
 *
 * EXPORTAR INFORME A PDF (2026-07-09, fase "Enterprise"): botón fijo en
 * la esquina superior derecha del header (a la derecha de
 * `headerActions`, visible en TODAS las vistas). Captura el `<main>`
 * actual (`mainRef`) con `html2canvas` y arma el PDF con `jsPDF` — la
 * lógica de armado vive en `src/utils/exportPdf.js` (Agente de Datos),
 * este componente solo dispara la captura y maneja el estado de carga /
 * error del botón. Ambas librerías se cargan con `import()` dinámico
 * dentro de `handleExportPdf`, no en el top-level del archivo, para no
 * sumarlas al bundle inicial de todos los usuarios (ver el comentario
 * completo en `exportPdf.js`).
 *
 * MODO OSCURO (2026-07-09, fase "Enterprise"): props `isDark`/
 * `onToggleTheme` (de `useTheme()` en `App.jsx`) — este componente solo
 * renderiza el botón sol/luna en el sidebar y aplica las clases `dark:`
 * a su propio shell (fondo, header). El resto de las vistas manejan sus
 * propias clases `dark:` internamente.
 * ------------------------------------------------------------------
 */

import { useRef, useState } from "react";
import { exportNodeToPdf } from "../../utils/exportPdf";

// Íconos inline (sin dependencias externas) — trazos simples estilo outline.
const icons = {
  home: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"
    />
  ),
  campaigns: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M4 6h16M4 12h16M4 18h10"
    />
  ),
  globe: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5 0 4-4 4-9s-1.5-9-4-9-4 4-4 9 1.5 9 4 9ZM3.5 9h17M3.5 15h17"
    />
  ),
  settings: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M10.3 3.3a1.5 1.5 0 0 1 3.4 0l.2.7a1.5 1.5 0 0 0 2.1 1l.6-.4a1.5 1.5 0 0 1 2.4 1.7l-.3.6a1.5 1.5 0 0 0 1 2.1l.7.2a1.5 1.5 0 0 1 0 2.9l-.7.2a1.5 1.5 0 0 0-1 2.1l.3.6a1.5 1.5 0 0 1-2.4 1.7l-.6-.4a1.5 1.5 0 0 0-2.1 1l-.2.7a1.5 1.5 0 0 1-3.4 0l-.2-.7a1.5 1.5 0 0 0-2.1-1l-.6.4a1.5 1.5 0 0 1-2.4-1.7l.3-.6a1.5 1.5 0 0 0-1-2.1l-.7-.2a1.5 1.5 0 0 1 0-2.9l.7-.2a1.5 1.5 0 0 0 1-2.1l-.3-.6a1.5 1.5 0 0 1 2.4-1.7l.6.4a1.5 1.5 0 0 0 2.1-1l.2-.7ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  ),
};

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 shrink-0">
      <circle cx="12" cy="12" r="4" strokeWidth={1.75} />
      <path
        strokeLinecap="round"
        strokeWidth={1.75}
        d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4 shrink-0">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5a8.5 8.5 0 1 0 11.2 11.2Z"
      />
    </svg>
  );
}

const DEFAULT_NAV_ITEMS = [
  { id: "resumen", label: "Resumen", icon: "home" },
  { id: "campanas", label: "Campañas", icon: "campaigns" },
  { id: "paises", label: "Países", icon: "globe" },
  { id: "configuracion", label: "Configuración", icon: "settings" },
];

/**
 * @param {object} props
 * @param {React.ReactNode} props.children - contenido principal de la vista
 * @param {string} [props.title] - título mostrado en el header del área principal
 * @param {Array<{id:string,label:string,icon:string}>} [props.navItems] - items del sidebar
 * @param {string} [props.activeItemId] - id del item activo (controlado desde afuera, opcional)
 * @param {(id:string)=>void} [props.onNavigate] - callback al hacer click en un item del sidebar
 * @param {React.ReactNode} [props.headerActions] - contenido a la derecha del header (ej. FiltersBar compacta)
 * @param {boolean} [props.isDark] - tema activo (de useTheme() en App.jsx)
 * @param {() => void} [props.onToggleTheme] - alterna claro/oscuro
 */
export default function DashboardLayout({
  children,
  title = "Resumen",
  navItems = DEFAULT_NAV_ITEMS,
  activeItemId,
  onNavigate,
  headerActions,
  isDark = false,
  onToggleTheme,
}) {
  // Si el padre no controla el item activo, el layout mantiene su propio estado interno.
  const [internalActiveId, setInternalActiveId] = useState(navItems[0]?.id);
  const activeId = activeItemId ?? internalActiveId;

  function handleNavigate(id) {
    if (onNavigate) onNavigate(id);
    else setInternalActiveId(id);
  }

  // --- Exportar informe a PDF (2026-07-09) ---
  const mainRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  async function handleExportPdf() {
    if (!mainRef.current || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      await exportNodeToPdf(mainRef.current, { html2canvas, JsPDF: jsPDF }, { title });
    } catch (err) {
      console.error("No se pudo exportar el informe a PDF:", err);
      setExportError("No se pudo generar el PDF. Intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="h-screen flex bg-livo-gray dark:bg-[#0B0B0F] font-body overflow-hidden">
      {/* ---------- Sidebar ----------
          FIJO AL VIEWPORT (2026-07-09): el shell pasó de `min-h-screen` a
          `h-screen overflow-hidden`, así que este `<aside>` (hijo directo,
          `align-items: stretch` por defecto) siempre ocupa exactamente el
          alto de pantalla, nunca más. Antes, con `min-h-screen`, el shell
          crecía junto con el contenido de `<main>` y arrastraba al sidebar
          con él, obligando a scrollear la página completa para ver el
          nav/el toggle de tema en secciones largas. Ahora solo `<main>`
          scrollea (ver `overflow-y-auto` más abajo); si el listado de
          `navItems` llegara a no entrar en la altura disponible, `<nav>`
          scrollea de forma independiente (`overflow-y-auto` propio) sin
          tapar el logo de arriba ni el footer/toggle de abajo. */}
      <aside className="w-64 shrink-0 h-full bg-black text-white flex flex-col">
        <div className="h-16 shrink-0 flex items-center gap-2.5 px-6 border-b border-white/10">
          {/* Logo ficticio Prisma / Lentesplus */}
          <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-card bg-livo-lime-500 text-black font-display font-extrabold text-sm">
            P
          </span>
          <div className="leading-tight">
            <p className="font-display font-extrabold text-base tracking-[0.5px]">Prisma</p>
            <p className="font-body text-[10px] text-white/50 -mt-0.5">Lentesplus · HubSpot</p>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={[
                  "w-full flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium transition-colors",
                  "focus:outline-none focus:shadow-focus-primary",
                  isActive
                    ? "bg-livo-blue-500 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <svg
                  className="w-5 h-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  {icons[item.icon]}
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Toggle de modo oscuro (2026-07-09) — estado en memoria, ver useTheme.js */}
        <div className="shrink-0 px-3 pb-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-pressed={isDark}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium text-white/70
                       hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:shadow-focus-primary"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
            {isDark ? "Modo claro" : "Modo oscuro"}
          </button>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-white/10 text-xs text-white/50">
          Lentesplus SAS · Prisma
        </div>
      </aside>

      {/* ---------- Área principal ----------
          `min-h-0` es necesario acá (gotcha clásico de Flexbox): sin esto,
          este contenedor no se deja "encoger" por debajo del alto de su
          contenido, y el `overflow-y-auto` de `<main>` de abajo nunca
          entraría en efecto — el scroll se iría de nuevo a la página
          completa en vez de quedarse dentro de `<main>`. */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="min-h-16 shrink-0 bg-white dark:bg-[#15151B] border-b border-livo-gray dark:border-white/10 flex items-center justify-between flex-wrap gap-x-4 gap-y-2 px-8 py-2.5">
          <h1 className="font-display font-bold text-2xl text-black dark:text-white shrink-0">{title}</h1>
          <div className="flex items-center gap-2 flex-wrap justify-end ml-auto">
            {headerActions}
            {exportError && <span className="text-xs text-[#B91C1C] dark:text-red-400">{exportError}</span>}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="h-9 px-3 inline-flex items-center gap-1.5 rounded-btn border-[1.5px] border-livo-blue-500 bg-[#F5F5F5] dark:bg-white/5
                         text-livo-blue-500 dark:text-livo-blue-300 font-bold text-xs tracking-[0.5px] whitespace-nowrap
                         hover:bg-[#E8E8FF] dark:hover:bg-white/10 active:bg-[#D0D0FF] disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:shadow-focus-primary transition-colors shrink-0"
            >
              {isExporting ? <SpinnerIcon /> : <DownloadIcon />}
              {isExporting ? "Generando…" : "Exportar informe"}
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 p-8 overflow-y-auto bg-livo-gray dark:bg-[#0B0B0F]">
          {children}
        </main>
      </div>
    </div>
  );
}
