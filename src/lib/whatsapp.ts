import { money } from "./format";

const CLAVE = "wa_logistica";
export const NUMERO_POR_DEFECTO = "5491100000000";

export function numeroLogistica() {
  if (typeof window === "undefined") return NUMERO_POR_DEFECTO;
  return window.localStorage.getItem(CLAVE) || NUMERO_POR_DEFECTO;
}

export function guardarNumeroLogistica(numero: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLAVE, numero.replace(/\D/g, ""));
  }
}

export type ResumenPedido = {
  numero: number | string;
  cliente: string;
  items: { nombre: string; cantidad: number; precio: number }[];
  total: number;
  observaciones?: string;
};

export function mensajePedido(p: ResumenPedido) {
  const lineas = [
    `*Pedido #${p.numero}*`,
    `Cliente: ${p.cliente}`,
    "",
    ...p.items.map((i) => `• ${i.cantidad} x ${i.nombre} — ${money(i.precio * i.cantidad)}`),
    "",
    `*Total: ${money(p.total)}*`,
  ];
  if (p.observaciones) lineas.push("", `Obs: ${p.observaciones}`);
  return lineas.join("\n");
}

export function enviarPedidoWhatsApp(p: ResumenPedido) {
  const url = `https://wa.me/${numeroLogistica()}?text=${encodeURIComponent(mensajePedido(p))}`;
  if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer");
}
