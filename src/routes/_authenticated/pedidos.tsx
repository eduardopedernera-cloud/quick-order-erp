import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Package, Plus, Search, Send, ShoppingCart, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { usePerfil } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { enviarPedidoWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Nuevo pedido · Mayorista" },
      { name: "description", content: "Catálogo y carga rápida de pedidos desde el celular." },
      { property: "og:title", content: "Nuevo pedido · Mayorista" },
      { property: "og:description", content: "Tomá pedidos en segundos desde el catálogo." },
    ],
  }),
  component: TomaPedidos,
});

type Item = { id: string; nombre: string; precio: number; cantidad: number };

function TomaPedidos() {
  const qc = useQueryClient();
  const { data: perfil } = usePerfil();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<Record<string, Item>>({});
  const [abierto, setAbierto] = useState(false);
  const [clienteId, setClienteId] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () =>
      (await supabase.from("categorias").select("*").eq("activo", true).order("orden")).data ?? [],
  });

  const { data: productos = [], isLoading } = useQuery({
    queryKey: ["productos-catalogo"],
    queryFn: async () =>
      (
        await supabase
          .from("productos")
          .select(
            "id, nombre, marca, codigo, precio_venta, stock, unidad, unidades_por_bulto, categoria_id, imagen_url",
          )
          .eq("activo", true)
          .order("nombre")
      ).data ?? [],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () =>
      (
        await supabase
          .from("clientes")
          .select("id, nombre, saldo, limite_credito")
          .eq("activo", true)
          .order("nombre")
      ).data ?? [],
  });

  const clienteEfectivo = perfil?.esStaff ? clienteId : (perfil?.perfil?.cliente_id ?? "");
  const cliente = clientes.find((c) => c.id === clienteEfectivo);
  const limite = Number(cliente?.limite_credito ?? 0);
  const disponible = limite > 0 ? Math.max(limite - Number(cliente?.saldo ?? 0), 0) : null;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) =>
        (!categoria || p.categoria_id === categoria) &&
        (!q ||
          p.nombre.toLowerCase().includes(q) ||
          (p.marca ?? "").toLowerCase().includes(q) ||
          (p.codigo ?? "").toLowerCase().includes(q)),
    );
  }, [productos, busqueda, categoria]);

  const items = Object.values(carrito);
  const total = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const unidades = items.reduce((acc, i) => acc + i.cantidad, 0);
  const excedeCredito = disponible !== null && total > disponible;

  function sumar(p: (typeof productos)[number], delta: number) {
    setCarrito((prev) => {
      const actual = prev[p.id];
      const cantidad = (actual?.cantidad ?? 0) + delta;
      if (cantidad <= 0) {
        const { [p.id]: _quitado, ...resto } = prev;
        return resto;
      }
      return {
        ...prev,
        [p.id]: { id: p.id, nombre: p.nombre, precio: Number(p.precio_venta), cantidad },
      };
    });
  }

  const confirmar = useMutation({
    mutationFn: async () => {
      if (!clienteEfectivo) throw new Error("Elegí un cliente para el pedido");
      if (!items.length) throw new Error("El carrito está vacío");
      const { data, error } = await supabase.rpc("crear_pedido", {
        p_cliente_id: clienteEfectivo,
        p_items: items.map((i) => ({ producto_id: i.id, cantidad: i.cantidad })),
        p_observaciones: observaciones || null,
      });
      if (error) throw error;
      const fila = Array.isArray(data) ? data[0] : data;
      return fila as { pedido_id: string; numero: number };
    },
    onSuccess: (pedido) => {
      toast.success(`Pedido #${pedido.numero} confirmado`, {
        action: {
          label: "WhatsApp",
          onClick: () =>
            enviarPedidoWhatsApp({
              numero: pedido.numero,
              cliente: cliente?.nombre ?? "Cliente",
              items,
              total,
              observaciones,
            }),
        },
      });
      enviarPedidoWhatsApp({
        numero: pedido.numero,
        cliente: cliente?.nombre ?? "Cliente",
        items,
        total,
        observaciones,
      });
      setCarrito({});
      setObservaciones("");
      setAbierto(false);
      qc.invalidateQueries();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo confirmar"),
  });

  return (
    <main className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate text-xl font-extrabold tracking-tight">Nuevo pedido</h1>
          <Link
            to="/mis-pedidos"
            className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Ver pedidos
          </Link>
        </div>
        <div className="mx-auto mt-3 max-w-3xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto, marca o código"
              className="h-12 rounded-full pl-10"
              inputMode="search"
            />
          </div>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip activo={!categoria} onClick={() => setCategoria(null)}>
              Todo
            </Chip>
            {categorias.map((c) => (
              <Chip key={c.id} activo={categoria === c.id} onClick={() => setCategoria(c.id)}>
                {c.nombre}
              </Chip>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-4">
        {perfil?.esStaff && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-3 shadow-soft">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cliente
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">Elegí un cliente…</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · saldo {money(c.saldo)}
                </option>
              ))}
            </select>
          </div>
        )}

        {cliente && (
          <p className="mb-4 rounded-2xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground shadow-soft">
            Crédito disponible{" "}
            <span
              className={cn(
                "font-extrabold",
                excedeCredito ? "text-destructive" : "text-foreground",
              )}
            >
              {disponible === null ? "sin límite" : money(disponible)}
            </span>
          </p>
        )}

        {isLoading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Cargando catálogo…</p>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((p) => {
              const cantidad = carrito[p.id]?.cantidad ?? 0;
              const bulto = Number(p.unidades_por_bulto) || 1;
              return (
                <li
                  key={p.id}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border bg-card p-3.5 shadow-soft transition-colors",
                    cantidad ? "border-primary/40 bg-accent/40" : "border-border",
                  )}
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-accent">
                    {p.imagen_url ? (
                      <img
                        src={p.imagen_url}
                        alt={p.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-accent-foreground">
                        <Package className="h-6 w-6" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.nombre}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {p.marca ?? "Sin marca"} · {p.unidad}
                      {bulto > 1 ? ` · bulto x${bulto}` : ""} · stock {Number(p.stock)}
                    </p>
                    <p className="mt-1 text-base font-extrabold text-primary">
                      {money(p.precio_venta)}
                      {bulto > 1 && (
                        <span className="ml-2 text-xs font-semibold text-muted-foreground">
                          bulto {money(Number(p.precio_venta) * bulto)}
                        </span>
                      )}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {cantidad > 0 && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full"
                            onClick={() => sumar(p, -1)}
                            aria-label="Quitar una unidad"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-7 text-center text-sm font-bold">{cantidad}</span>
                        </>
                      )}
                      <Button
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => sumar(p, 1)}
                        aria-label="Agregar una unidad"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {bulto > 1 && (
                        <Button
                          variant="outline"
                          className="h-9 rounded-full px-3 text-xs font-semibold"
                          onClick={() => sumar(p, bulto)}
                        >
                          + bulto ({bulto})
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {!filtrados.length && (
              <li className="py-16 text-center text-sm text-muted-foreground">
                No encontramos productos con ese filtro.
              </li>
            )}
          </ul>
        )}
      </section>

      {items.length > 0 && (
        <button
          onClick={() => setAbierto(true)}
          className="fixed bottom-20 left-1/2 z-40 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-between rounded-full bg-gradient-primary px-5 py-4 text-primary-foreground shadow-lift md:bottom-6"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-4 w-4" />
            {unidades} {unidades === 1 ? "ítem" : "ítems"}
          </span>
          <span className="text-base font-extrabold">{money(total)}</span>
        </button>
      )}

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Resumen del pedido</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <ul className="divide-y divide-border">
              {items.map((i) => (
                <li key={i.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{i.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.cantidad} × {money(i.precio)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold">{money(i.precio * i.cantidad)}</span>
                    <button
                      onClick={() => setCarrito(({ [i.id]: _q, ...resto }) => resto)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Quitar producto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones para el reparto (opcional)"
              className="rounded-xl"
            />

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-extrabold">{money(total)}</span>
            </div>

            {excedeCredito && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                El pedido supera el crédito disponible ({money(disponible ?? 0)}).
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setCarrito({})}
                aria-label="Vaciar carrito"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                className="h-12 flex-1 gap-2 rounded-full text-base font-bold"
                disabled={confirmar.isPending || excedeCredito}
                onClick={() => confirmar.mutate()}
              >
                <Send className="h-4 w-4" />
                {confirmar.isPending ? "Confirmando…" : "Confirmar y enviar"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </main>
  );
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
