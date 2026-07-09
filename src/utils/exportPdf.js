/**
 * exportPdf.js
 * ------------------------------------------------------------------
 * Agente de Datos / Utils — exportación del contenido visible del
 * Dashboard a PDF (2026-07-09, fase "Enterprise"), usado por el botón
 * "Exportar informe" en el header de `DashboardLayout.jsx`.
 *
 * Usa `html2canvas` (captura el nodo del DOM como un `<canvas>`) +
 * `jspdf` (arma el PDF a partir de esa imagen, paginando si el
 * contenido es más alto que una hoja A4). Ambas librerías se importan
 * de forma DINÁMICA (`import()`) desde `DashboardLayout.jsx`, no en el
 * top-level de este archivo — así el bundle inicial no crece por una
 * función que solo se usa al hacer click en "Exportar informe" (el
 * bundle ya tenía un warning de Vite por superar los 500 kB, ver
 * handoff.md sección 8; sumar ~200 kB más de librerías de PDF de forma
 * estática hubiera empeorado eso para todos los usuarios que nunca
 * exportan un PDF).
 *
 * Este archivo solo exporta la función que arma el PDF a partir de un
 * nodo del DOM ya resuelto (`node`) y las clases de html2canvas/jsPDF ya
 * cargadas — no sabe nada de React ni de qué vista está activa.
 * ------------------------------------------------------------------
 */

/**
 * Arma un slug de archivo seguro a partir de un título de vista (ej.
 * "Resumen" → "resumen", "Países" → "paises").
 */
function slugify(text = "") {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "informe";
}

/**
 * Captura `node` con html2canvas y arma un PDF (A4, multi-página si hace
 * falta) con jsPDF. Recibe las clases `Html2Canvas`/`JsPDF` ya
 * resueltas (importadas dinámicamente por quien llama) para no acoplar
 * este archivo al mecanismo de import.
 *
 * @param {HTMLElement} node - elemento del DOM a capturar (ej. el `<main>` del layout)
 * @param {object} deps
 * @param {(el: HTMLElement, options?: object) => Promise<HTMLCanvasElement>} deps.html2canvas
 * @param {new (options?: object) => any} deps.JsPDF - constructor `jsPDF` (named export `{ jsPDF }` de la librería `jspdf`)
 * @param {object} [options]
 * @param {string} [options.title] - título de la vista actual, usado para el nombre del archivo
 * @param {string} [options.backgroundColor] - color de fondo detrás del contenido capturado (ej. blanco o el fondo del modo oscuro)
 * @returns {Promise<void>} dispara la descarga del PDF (`pdf.save()`)
 */
export async function exportNodeToPdf(node, { html2canvas, JsPDF }, { title = "informe", backgroundColor = "#FFFFFF" } = {}) {
  if (!node) throw new Error("exportNodeToPdf: no se recibió un nodo del DOM para capturar.");

  const canvas = await html2canvas(node, {
    backgroundColor,
    scale: 2, // resolución más nítida que 1:1, sin llegar al costo de scale:3+
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new JsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Si el contenido capturado es más alto que una hoja A4, se agregan
  // páginas adicionales reposicionando la misma imagen hacia arriba
  // (mismo patrón que usan la mayoría de los ejemplos de "html a PDF
  // multi-página" con jsPDF: la imagen es una sola, se va desplazando).
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const dateSlug = new Date().toISOString().slice(0, 10);
  pdf.save(`prisma-informe-${slugify(title)}-${dateSlug}.pdf`);
}
