export const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const fecha = (value: string | null | undefined) =>
  value
    ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(value),
      )
    : "—";

export const num = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("es-AR").format(Number(value ?? 0));
