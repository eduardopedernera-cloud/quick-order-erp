import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { money, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/panel/productos")({
  head: () => ({
    meta: [
      { title: "Productos y stock · Panel Mayorista" },
      { name: "description", content: "Catálogo, precios, costos y control de stock." },
      { property: "og:title", content: "Productos y stock · Panel Mayorista" },
      { property: "og:description", content: "Administrá el catálogo mayorista y su stock." },
    ],
  }),
  component: ProductosPage,
});

function ProductosPage() {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const { data: productos = [] } = useQuery({
    queryKey: ["productos"],
    queryFn: async () =>
      (await supabase.from("productos").select("*, categorias(nombre)").order("nombre")).data ?? [],
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => (await supabase.from("categorias").select("*").order("orden")).data ?? [],
  });

  const crear = useMutation({
    mutationFn: async (form: Record<string, string>) => {
      const { error } = await supabase.from("productos").insert({
        codigo: form["codigo"] || null,
        nombre: form["nombre"] ?? "",
        marca: form["marca"] || null,
        categoria_id: form["categoria_id"] || null,
        unidad: form["unidad"] || "unidad",
        unidades_por_bulto: Number(form["unidades_por_bulto"] || 1),
        precio_costo: Number(form["precio_costo"] || 0),
        precio_venta: Number(form["precio_venta"] || 0),
        stock: Number(form["stock"] || 0),
        stock_minimo: Number(form["stock_minimo"] || 0),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Producto creado");
      setAbierto(false);
      qc.invalidateQueries({ queryKey: ["productos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo crear"),
  });

  const ajustarStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("productos").update({ stock }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["productos"] }),
  });

  const filtrados = productos.filter((p) =>
    `${p.nombre} ${p.marca ?? ""} ${p.codigo ?? ""}`.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h1 className="truncate text-2xl font-extrabold tracking-tight">Productos</h1>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button className="shrink-0 rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Nuevo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo producto</DialogTitle>
            </DialogHeader>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                crear.mutate(
                  Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>,
                );
              }}
            >
              <Campo name="nombre" label="Nombre" required />
              <Campo name="codigo" label="Código" />
              <Campo name="marca" label="Marca" />
              <div className="space-y-1.5">
                <Label htmlFor="categoria_id">Categoría</Label>
                <select
                  id="categoria_id"
                  name="categoria_id"
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <Campo name="unidad" label="Unidad (unidad/bulto/caja)" />
              <Campo name="unidades_por_bulto" label="Unidades por bulto" type="number" />
              <Campo name="precio_costo" label="Costo" type="number" />
              <Campo name="precio_venta" label="Precio de venta" type="number" required />
              <Campo name="stock" label="Stock" type="number" />
              <Campo name="stock_minimo" label="Stock mínimo" type="number" />
              <Button
                type="submit"
                className="mt-2 w-full rounded-full sm:col-span-2"
                disabled={crear.isPending}
              >
                Guardar producto
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto"
        className="mt-4 h-11 rounded-full"
      />

      <ul className="mt-4 space-y-2">
        {filtrados.map((p) => {
          const critico = Number(p.stock) <= Number(p.stock_minimo);
          return (
            <li
              key={p.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{p.nombre}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[p.codigo, p.marca, p.categorias?.nombre].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  costo {money(p.precio_costo)} · venta{" "}
                  <span className="font-bold text-primary">{money(p.precio_venta)}</span>
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-extrabold ${critico ? "text-destructive" : ""}`}>
                  {num(p.stock)}
                </p>
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={() =>
                      ajustarStock.mutate({ id: p.id, stock: Math.max(Number(p.stock) - 1, 0) })
                    }
                    className="h-7 w-7 rounded-full border border-border text-sm"
                    aria-label="Restar stock"
                  >
                    −
                  </button>
                  <button
                    onClick={() => ajustarStock.mutate({ id: p.id, stock: Number(p.stock) + 1 })}
                    className="h-7 w-7 rounded-full border border-border text-sm"
                    aria-label="Sumar stock"
                  >
                    +
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!filtrados.length && (
          <li className="py-16 text-center text-sm text-muted-foreground">Sin productos.</li>
        )}
      </ul>
    </div>
  );
}

function Campo({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} step="any" />
    </div>
  );
}
