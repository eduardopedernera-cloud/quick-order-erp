import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, Smartphone, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mayorista · ERP + app de pedidos para distribuidoras" },
      {
        name: "description",
        content:
          "Gestioná clientes, productos, stock y cuentas corrientes desde un panel, y tomá pedidos en segundos desde el celular.",
      },
      { property: "og:title", content: "Mayorista · ERP + app de pedidos" },
      {
        property: "og:description",
        content: "Panel de gestión y toma de pedidos móvil para distribuidoras mayoristas.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Smartphone,
    title: "Pedidos en segundos",
    text: "Catálogo con búsqueda instantánea y carrito flotante pensado para el celular del vendedor.",
  },
  {
    icon: Boxes,
    title: "Productos y stock",
    text: "Costos, precios, IVA, bultos y alertas de stock mínimo siempre a mano.",
  },
  {
    icon: Wallet,
    title: "Cuentas corrientes",
    text: "Saldos por cliente, movimientos de debe y haber y registro de pagos.",
  },
  {
    icon: BarChart3,
    title: "Panel ERP",
    text: "Ventas del día, pedidos pendientes y deuda total en una sola vista.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <span className="text-lg font-extrabold tracking-tight">
          mayorista<span className="text-primary">.</span>
        </span>
        <Link
          to="/auth"
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          Ingresar
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 md:pt-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Distribuidora mayorista
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] md:text-6xl">
          El ERP de tu distribuidora y la app de pedidos, en un solo lugar.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Cargá pedidos desde el celular en la puerta del cliente y controlá stock, precios y
          cuentas corrientes desde el panel.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5"
          >
            Empezar ahora <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-bold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
