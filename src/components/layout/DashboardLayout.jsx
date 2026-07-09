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
 * ------------------------------------------------------------------
 */

import { useState } from "react";

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
 */
export default function DashboardLayout({
  children,
  title = "Resumen",
  navItems = DEFAULT_NAV_ITEMS,
  activeItemId,
  onNavigate,
}) {
  // Si el padre no controla el item activo, el layout mantiene su propio estado interno.
  const [internalActiveId, setInternalActiveId] = useState(navItems[0]?.id);
  const activeId = activeItemId ?? internalActiveId;

  function handleNavigate(id) {
    if (onNavigate) onNavigate(id);
    else setInternalActiveId(id);
  }

  return (
    <div className="min-h-screen flex bg-livo-gray font-body">
      {/* ---------- Sidebar ---------- */}
      <aside className="w-64 shrink-0 bg-black text-white flex flex-col">
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-white/10">
          {/* Logo ficticio Prisma / Lentesplus */}
          <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-card bg-livo-lime-500 text-black font-display font-extrabold text-sm">
            P
          </span>
          <div className="leading-tight">
            <p className="font-display font-extrabold text-base tracking-[0.5px]">Prisma</p>
            <p className="font-body text-[10px] text-white/50 -mt-0.5">Lentesplus · HubSpot</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
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

        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/50">
          Lentesplus SAS · Prisma
        </div>
      </aside>

      {/* ---------- Área principal ---------- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-livo-gray flex items-center px-8 shrink-0">
          <h1 className="font-display font-bold text-2xl text-black">{title}</h1>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
