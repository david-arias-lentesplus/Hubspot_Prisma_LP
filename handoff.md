# HANDOFF — Dashboard de HubSpot (Lentesplus)

> Fuente de la verdad del proyecto. Se actualiza cada vez que se hace un cambio importante en la arquitectura, se agrega una nueva librería, o se resuelve un bug complejo ("Actualiza el handoff").
> Owner: David · Última actualización: 2026-07-09

---

## 1. NOMBRE Y DESCRIPCIÓN DEL PROYECTO

**Dashboard de HubSpot** — aplicación web (React + Tailwind CSS) que consume en tiempo real un CSV publicado desde Google Sheets con métricas de campañas de email de HubSpot (Lentesplus SAS). Permite visualizar tasa de apertura, tasa de clics, rebotes y fecha de envío, segmentado por país (MX, CO, CL, AR) según el prefijo del nombre de campaña (`MKT_MX`, `MKT_CO`, `MKT_CL`, `MKT_AR`).

**Fuente del CSV:**
`https://docs.google.com/spreadsheets/d/e/2PACX-1vQVMjhgnoi0H2fH9GLFgD-3f1VyIEC_EKeixdOZDpc0OeVaY0WWqSeojUdTUoVzdh_07W0OATyvSP2J/pub?gid=0&single=true&output=csv`

---

## 2. ESTRUCTURA DE CARPETAS ACTUALIZADA

```
mails hubspot lentesplus/
├── handoff.md                          # este archivo
├── DESIGN_SYSTEM-LIVO.md                # sistema de diseño (fuente de la verdad de UI)
├── tailwind.config.js                   # tokens LIVO (colores, fuentes, radios, sombras)
├── agents/
│   ├── AGENTE_DOCUMENTADOR.md
│   ├── AGENTE_DATOS.md
│   └── AGENTE_UIUX.md
└── src/
    ├── services/
    │   └── dataService.js               # fetch + PapaParse + normalización + país
    ├── hooks/
    │   └── useHubspotData.js            # data, loading, error, filtros, KPIs globales
    └── components/
        ├── layout/
        │   └── DashboardLayout.jsx      # Sidebar + área principal
        ├── metrics/
        │   └── MetricCard.jsx           # card de KPI (título/valor/crecimiento)
        └── filters/
            └── Filters.jsx              # dropdown país + rango de fechas
```

---

## 3. ESTADO ACTUAL DEL DESARROLLO

### Hecho

- [x] Sistema de diseño recibido y documentado (`DESIGN_SYSTEM-LIVO.md`)
- [x] Docs de agentes de rol (Documentador, Datos, UI/UX) creados y detallados
- [x] `tailwind.config.js` con tokens LIVO (colores, fuentes, radios, sombras)
- [x] Servicio de datos `dataService.js` (fetch + PapaParse + normalización + clasificación por país)
- [x] Custom hook `useHubspotData.js` (loading/error, filtro por fecha, filtro por país, KPIs globales)
- [x] Componente `DashboardLayout.jsx` (sidebar + main)
- [x] Componente `MetricCard.jsx`
- [x] Componente `Filters.jsx` (país + rango de fechas)

### Falta

- [ ] Scaffold formal del proyecto (decidir Vite vs Next.js, `package.json`, entrypoint)
- [ ] Confirmar los nombres exactos de columnas del CSV real (actualmente `dataService.js` asume nombres en español y normaliza — **validar contra el CSV en producción**)
- [ ] Componentes de gráficos (`OpenRateChart`, `ClickRateChart`, `BounceRateChart`) con Recharts/Chart.js
- [ ] Estados visuales `LoadingState` / `ErrorState` reutilizables
- [ ] Vista/página que integre `DashboardLayout` + `Filters` + `MetricCard` + gráficos usando `useHubspotData`
- [ ] Tests para servicios de datos (parseo, filtros, cálculo de KPIs)

---

## 4. REGISTRO DE ERRORES CONOCIDOS Y CÓMO SE SOLUCIONARON

_(vacío por ahora — se registra aquí cada bug complejo resuelto, con causa raíz y fix)_

| Fecha | Error | Causa | Solución |
|---|---|---|---|
| — | — | — | — |

---

## 5. DEPENDENCIAS INSTALADAS

> Nota: el proyecto aún no tiene `package.json` formal (scaffold pendiente, ver sección 3). Estas son las dependencias que el código ya generado asume/requiere.

| Paquete | Uso |
|---|---|
| `react` | Componentes funcionales + Hooks |
| `tailwindcss` | Estilos, vía `tailwind.config.js` con tokens LIVO |
| `papaparse` | Parseo del CSV de HubSpot a JSON |
| `recharts` | Gráficos (pendiente de implementar componentes) |

---

## 6. REGLAS DEL SISTEMA DE DISEÑO (basado en `DESIGN_SYSTEM-LIVO.md`)

- **Colores**: solo tokens LIVO — Electric Blue `#0000E1` (acción/CTA), Lime `#DEFF00` (highlight/energía, **nunca sobre blanco**), Black/White (estructura/base), Orange `#FC4F00` (urgencia/alertas), Pink `#D92D8E` (promos/campañas), Gray `#F0F0F0` (neutral). No inventar colores nuevos.
- **Tipografía**: Ballinger (`font-display`) para headings, Poppins (`font-body`) para texto/UI, T29 Carbon (`font-mono`) para números y precios.
- **Spacing**: escala base-4px (`p-1`…`p-24`), padding de card = `p-6` (24px).
- **Radios**: botones `rounded-full`, inputs `rounded-lg` (8px), cards `rounded-card` (12px) / `rounded-card-lg` (16px).
- **Breakpoints**: móvil 375px (4 cols), tablet 768px (8 cols), desktop 1440px (12 cols).
- **Foco**: todo elemento interactivo debe tener un `focus-ring` visible (ver sombras `focus-primary`, `focus-input`, `focus-secondary` en `tailwind.config.js`).
- **Accesibilidad**: nunca texto blanco sobre Lime (usar `text-black`); estados disabled con `opacity-40` + `cursor-not-allowed`.

Detalle completo en `DESIGN_SYSTEM-LIVO.md`.

---

## 7. ARCHIVOS DE REFERENCIA EN ESTA CARPETA

| Archivo | Propósito |
|---|---|
| `DESIGN_SYSTEM-LIVO.md` | Sistema de diseño obligatorio |
| `tailwind.config.js` | Tokens LIVO para Tailwind |
| `agents/AGENTE_DOCUMENTADOR.md` | Rol y checklist para mantener este handoff |
| `agents/AGENTE_DATOS.md` | Rol para lógica de parseo/KPIs/CSV |
| `agents/AGENTE_UIUX.md` | Rol para construcción de UI con Tailwind |

## 8. PRÓXIMOS PASOS SUGERIDOS

1. Confirmar headers reales del CSV y ajustar el mapeo en `dataService.js` si difiere de lo asumido.
2. Decidir Vite vs Next.js y generar el scaffold formal (`package.json`, entrypoint, instalación de dependencias).
3. Construir gráficos (`OpenRateChart`, `ClickRateChart`, `BounceRateChart`) y estados `LoadingState`/`ErrorState`.
4. Ensamblar la página principal integrando todos los componentes con `useHubspotData`.
