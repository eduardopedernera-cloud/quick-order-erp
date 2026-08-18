import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Fila = {
  codigo: string;
  nombre: string;
  marca: string | null;
  unidad: string;
  unidades_por_bulto: number;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
};

const ALIAS: Record<string, keyof Fila> = {
  codigo: "codigo",
  código: "codigo",
  cod: "codigo",
  sku: "codigo",
  nombre: "nombre",
  producto: "nombre",
  descripcion: "nombre",
  descripción: "nombre",
  marca: "marca",
  unidad: "unidad",
  unidades_por_bulto: "unidades_por_bulto",
  "unidades por bulto": "unidades_por_bulto",
  bulto: "unidades_por_bulto",
  precio_costo: "precio_costo",
  costo: "precio_costo",
  precio_venta: "precio_venta",
  precio: "precio_venta",
  venta: "precio_venta",
  stock: "stock",
  stock_minimo: "stock_minimo",
  "stock minimo": "stock_minimo",
  "stock mínimo": "stock_minimo",
};

const numero = (v: unknown) => {
  const n = Number(
    String(v ?? "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}\b)/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) ? n : 0;
};

function normalizar(matriz: unknown[][]): Fila[] {
  const [cabecera, ...cuerpo] = matriz.filter((f) => f.some((c) => String(c ?? "").trim() !== ""));
  if (!cabecera) return [];
  const mapa = cabecera.map((c) => ALIAS[String(c ?? "").trim().toLowerCase()] ?? null);
  const tieneCabecera = mapa.some(Boolean);
  const filas = tieneCabecera ? cuerpo : matriz;
  const columnas: (keyof Fila | null)[] = tieneCabecera
    ? mapa
    : ["codigo", "nombre", "marca", "precio_costo", "precio_venta", "stock"];

  return filas
    .map((f) => {
      const o: Record<string, unknown> = {};
      columnas.forEach((k, i) => {
        if (k) o[k] = f[i];
      });
      const codigo = String(o["codigo"] ?? "").trim();
      const nombre = String(o["nombre"] ?? "").trim();
      if (!codigo || !nombre) return null;
      return {
        codigo,
        nombre,
        marca: String(o["marca"] ?? "").trim() || null,
        unidad: String(o["unidad"] ?? "").trim() || "unidad",
        unidades_por_bulto: numero(o["unidades_por_bulto"]) || 1,
        precio_costo: numero(o["precio_costo"]),
        precio_venta: numero(o["precio_venta"]),
        stock: numero(o["stock"]),
        stock_minimo: numero(o["stock_minimo"]),
      } satisfies Fila;
    })
    .filter((f): f is Fila => f !== null);
}

export function ImportarProductos({ onListo }: { onListo: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [guardando, setGuardando] = useState(false);

  const leerPegado = (valor: string) => {
    setTexto(valor);
    const matriz = valor
      .split(/\r?\n/)
      .map((l) => l.split(l.includes("\t") ? "\t" : ";"))
      .filter((f) => f.length > 1);
    setFilas(normalizar(matriz));
  };

  const leerArchivo = async (file: File) => {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const libro = XLSX.read(buffer, { type: "array" });
    const hoja = libro.Sheets[libro.SheetNames[0]!];
    const matriz = XLSX.utils.sheet_to_json<unknown[]>(hoja!, { header: 1, raw: true });
    const parsed = normalizar(matriz);
    setFilas(parsed);
    setTexto("");
    if (!parsed.length) toast.error("No se detectaron filas válidas en el archivo");
  };

  const guardar = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from("productos")
      .upsert(filas, { onConflict: "codigo", ignoreDuplicates: false });
    setGuardando(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${filas.length} productos importados`);
    setFilas([]);
    setTexto("");
    setAbierto(false);
    onListo();
  };

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 rounded-full">
          <Upload className="mr-1 h-4 w-4" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar productos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Columnas: código, nombre, marca, unidad, unidades por bulto, costo, precio, stock, stock
            mínimo. Los códigos existentes se actualizan.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="archivo">Archivo Excel (.xlsx)</Label>
            <input
              id="archivo"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="w-full rounded-xl border border-input bg-background p-2 text-sm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void leerArchivo(f);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pegado">O pegá las celdas copiadas desde Excel</Label>
            <textarea
              id="pegado"
              value={texto}
              onChange={(e) => leerPegado(e.target.value)}
              rows={6}
              placeholder={"codigo\tnombre\tmarca\tcosto\tprecio\tstock"}
              className="w-full rounded-xl border border-input bg-background p-3 font-mono text-xs"
            />
          </div>

          {filas.length > 0 && (
            <div className="rounded-2xl border border-border p-3">
              <p className="text-sm font-bold">{filas.length} productos listos</p>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {filas.slice(0, 20).map((f) => (
                  <li key={f.codigo} className="truncate">
                    {f.codigo} · {f.nombre} · ${f.precio_venta}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            className="w-full rounded-full"
            disabled={!filas.length || guardando}
            onClick={() => void guardar()}
          >
            {guardando ? "Importando…" : "Importar y actualizar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
