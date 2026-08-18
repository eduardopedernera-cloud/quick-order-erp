import { money } from "@/lib/format";
import { urlFirmada } from "@/lib/imagenes";

export type ProductoPdf = {
  nombre: string;
  codigo?: string | null;
  marca?: string | null;
  precio_venta: number | string;
  unidad?: string | null;
  unidades_por_bulto?: number | string | null;
  imagen_url?: string | null;
};

/** Descarga la imagen y la recorta a un cuadrado 1:1 centrado (equivalente a object-fit: cover). */
async function cuadrada(url: string | null, lado = 400): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lado, lado);
    const escala = Math.max(lado / bitmap.width, lado / bitmap.height);
    const w = bitmap.width * escala;
    const h = bitmap.height * escala;
    ctx.drawImage(bitmap, (lado - w) / 2, (lado - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

/** Genera un PDF de fichas de productos (grilla con foto 1:1) y devuelve el archivo. */
export async function generarCatalogoPdf(productos: ProductoPdf[], titulo = "Catálogo") {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margen = 12;
  const ancho = 210 - margen * 2;
  const cols = 3;
  const gap = 6;
  const celda = (ancho - gap * (cols - 1)) / cols;
  const altoFicha = celda + 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(titulo, margen, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("es-AR"), 210 - margen, 16, { align: "right" });

  let x = margen;
  let y = 24;

  for (const p of productos) {
    if (y + altoFicha > 297 - margen) {
      doc.addPage();
      x = margen;
      y = margen;
    }

    const img = await cuadrada(await urlFirmada(p.imagen_url ?? null));
    if (img) {
      doc.addImage(img, "JPEG", x, y, celda, celda);
    } else {
      doc.setDrawColor(220);
      doc.setFillColor(244, 244, 246);
      doc.roundedRect(x, y, celda, celda, 2, 2, "FD");
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text("Sin imagen", x + celda / 2, y + celda / 2, { align: "center" });
      doc.setTextColor(0);
    }

    const bulto = Number(p.unidades_por_bulto ?? 1) || 1;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(doc.splitTextToSize(p.nombre, celda).slice(0, 2), x, y + celda + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      [p.codigo, p.marca].filter(Boolean).join(" · ").slice(0, 40) || " ",
      x,
      y + celda + 13,
    );
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(money(p.precio_venta), x, y + celda + 19);
    if (bulto > 1) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`bulto x${bulto}`, x + celda, y + celda + 19, { align: "right" });
      doc.setTextColor(0);
    }

    x += celda + gap;
    if (x + celda > 210 - margen + 0.1) {
      x = margen;
      y += altoFicha;
    }
  }

  return doc;
}

export async function descargarCatalogoPdf(productos: ProductoPdf[], titulo = "Catálogo") {
  const doc = await generarCatalogoPdf(productos, titulo);
  const nombre = `${titulo.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  doc.save(nombre);
  return nombre;
}
