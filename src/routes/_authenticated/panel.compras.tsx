import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PackageCheck, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { fecha, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel/compras")({
  head: () => ({
    meta: [
      { title: "Compras · Panel Mayorista" },
      { name: "description", content: "Órdenes de compra e ingreso de mercadería al stock." },
      { property: "og:title", content: "Compras · Panel Mayorista" },
      { property: "og:description", content: "Cargá compras y actualizá el stock automáticamente." },
    ],
  }),
  component: ComprasPage,
});

type Linea = { producto_id: string; cantidad: number; costo: number };

function ComprasPage() {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [comprobante, setComprobante] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);

  const { data: proveedores = [] } = useQuery({
    queryKey: ["proveedores"],
    queryFn: async () =>
      (await supabase.from("proveedores").select("id, nombre").order("nombre")).data ?? [],
  });

  const { data: productos = [] } = useQuery({
    queryKey: ["productos-compra"],
    queryFn: async () =>
      (await supabase.from("productos").select("id, nombre, precio_costo").order("nombre")).data ??
      [],
  });

  const { data: compras = [] } = useQuery({
    queryKey: ["compras"],
    queryFn: async () =>
      (
        await supabase
          .from("compras")
          .select("*, proveedores(nombre), compra_items(id, nombre_producto, cantidad, subtotal)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const total = lineas.reduce((a, l) => a + l.cantidad * l.costo, 0);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!proveedorId) throw new Error("Elegí un proveedor");
      if (!lineas.length) throw new Error("Agregá al menos un producto");
      const { data: compra, error } = await supabase
        .from("compras")
        .insert({ proveedor_id: proveedorId, comprobante: comprobante || null, total })
        .select("id")
        .single();
      if (error) throw error;

      const { error: errItems } = await supabase.from("compra_items").insert(
        lineas.map((l) => ({
          compra_id: compra.id,
          producto_id: l.producto_id,
          nombre_producto: productos.find((p) => p.id === l.producto_id)?.nombre ?? "Producto",
          cantidad: l.cantidad,
          costo_unitario: l.costo,
          subtotal: l.cantidad * l.costo,
        })),
      );
      if (errItems) throw errItems;
    },
    onSuccess: () => {
      toast.success("Orden de compra creada");
      setLineas([]);
      setComprobante("");
      setAbierto(false);
      qc.invalidateQueries({ queryKey: ["compras"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const recibir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("recibir_compra", { p_compra_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mercadería ingresada y stock actualizado");
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">Compras</h1>
        <Button className="shrink-0 gap-2 rounded-full" onClick={() => setAbierto((v) => !v)}>
          <Plus className="h-4 w-4" /> Nueva orden
        </Button>
      </header>

      {abierto && (
        <section className="mt-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proveedor">Proveedor</Label>
              <select
                id="proveedor"
                value={proveedorId}
                onChange={(e) => setProveedorId(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Elegí un proveedor…</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comprobante">Comprobante</Label>
              <Input
                id="comprobante"
                value={comprobante}
                onChange={(e) => setComprobante(e.target.value)}
                placeholder="FA-A 0001-00001234"
              />
            </div>
          </div>

          <form
            className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_100px_120px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const producto_id = String(fd.get("producto") ?? "");
              if (!producto_id) return;
              setLineas((prev) => [
                ...prev,
                {
                  producto_id,
                  cantidad: Number(fd.get("cantidad")) || 1,
                  costo: Number(fd.get("costo")) || 0,
                },
              ]);
              e.currentTarget.reset();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="producto">Producto</Label>
              <select
                id="producto"
                name="producto"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="">Elegí…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" name="cantidad" type="number" step="any" defaultValue={1} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costo">Costo</Label>
              <Input id="costo" name="costo" type="number" step="any" defaultValue={0} />
            </div>
            <Button type="submit" variant="outline" className="self-end rounded-full">
              Agregar
            </Button>
          </form>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            {lineas.map((l, idx) => (
              <li key={idx} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                <p className="truncate text-sm font-semibold">
                  {productos.find((p) => p.id === l.producto_id)?.nombre}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {l.cantidad} × {money(l.costo)}
                  </span>
                </p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold">{money(l.cantidad * l.costo)}</span>
                  <button
                    onClick={() => setLineas((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Quitar línea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-extrabold">{money(total)}</span>
          </div>
          <Button
            className="mt-3 rounded-full"
            disabled={guardar.isPending}
            onClick={() => guardar.mutate()}
          >
            Guardar orden
          </Button>
        </section>
      )}

      <ul className="mt-6 space-y-2">
        {compras.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {c.proveedores?.nombre} · {c.comprobante || "sin comprobante"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fecha(c.fecha)} · {c.compra_items?.length ?? 0} ítems · {c.estado}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold">{money(c.total)}</span>
            </div>
            {c.estado === "pendiente" && (
              <Button
                variant="outline"
                className="mt-3 gap-2 rounded-full"
                disabled={recibir.isPending}
                onClick={() => recibir.mutate(c.id)}
              >
                <PackageCheck className="h-4 w-4" /> Ingresar mercadería
              </Button>
            )}
          </li>
        ))}
        {!compras.length && (
          <li className="py-10 text-center text-sm text-muted-foreground">Sin órdenes de compra.</li>
        )}
      </ul>
    </div>
  );
}
