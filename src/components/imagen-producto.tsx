import { ImagePlus, Package, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subirImagenProducto, urlFirmada } from "@/lib/imagenes";
import { cn } from "@/lib/utils";

/** Contenedor cuadrado 1:1 con recorte centrado, usado en panel, catálogo y PDF. */
export function ImagenProducto({
  src,
  alt,
  className,
  rounded = "rounded-xl",
}: {
  src: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={cn(
        "aspect-square w-full shrink-0 overflow-hidden bg-accent",
        rounded,
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-accent-foreground/70">
          <Package className="h-1/3 w-1/3" />
        </span>
      )}
    </div>
  );
}

/** Campo de carga: archivo al bucket o URL pública pegada. Devuelve el valor para imagen_url. */
export function CampoImagenProducto({
  valor,
  onChange,
  referencia,
}: {
  valor: string;
  onChange: (v: string) => void;
  referencia: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);

  const subir = async (file: File) => {
    setSubiendo(true);
    try {
      const path = await subirImagenProducto(file, referencia || file.name);
      onChange(path);
      setPreview(await urlFirmada(path));
      toast.success("Imagen cargada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
    }
  };

  const mostrar = preview ?? (/^https?:/.test(valor) ? valor : null);

  return (
    <div className="space-y-1.5">
      <Label htmlFor="imagen_url">Imagen del producto (cuadrada 1:1)</Label>
      <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3">
        <ImagenProducto src={mostrar} alt="Vista previa" className="w-20" />
        <div className="space-y-2">
          <input
            ref={inputFile}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void subir(f);
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputFile.current?.click()}
              disabled={subiendo}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-xs font-semibold"
            >
              <ImagePlus className="h-4 w-4" />
              {subiendo ? "Subiendo…" : "Subir archivo"}
            </button>
            {valor && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setPreview(null);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-input px-3 text-xs font-semibold text-muted-foreground"
              >
                <X className="h-4 w-4" /> Quitar
              </button>
            )}
          </div>
          <Input
            id="imagen_url"
            name="imagen_url"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder="o pegá una URL pública https://…"
            className="h-9 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
