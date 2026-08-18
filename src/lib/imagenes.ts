import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const BUCKET_PRODUCTOS = "productos";

/** Una URL externa se usa tal cual; cualquier otro valor es una ruta dentro del bucket privado. */
export const esUrlExterna = (valor: string | null | undefined) =>
  !!valor && /^(https?:|data:|blob:)/.test(valor);

export async function subirImagenProducto(file: File, referencia: string) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const limpio = referencia
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  const path = `${limpio || "producto"}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_PRODUCTOS)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Firma en lote las rutas privadas y devuelve un mapa ruta -> url usable en <img>. */
export function useImagenesFirmadas(valores: (string | null | undefined)[]) {
  const rutas = Array.from(
    new Set(valores.filter((v): v is string => !!v && !esUrlExterna(v))),
  ).sort();

  const { data } = useQuery({
    queryKey: ["imagenes-firmadas", rutas],
    enabled: rutas.length > 0,
    staleTime: 45 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.storage
        .from(BUCKET_PRODUCTOS)
        .createSignedUrls(rutas, 60 * 60);
      const mapa: Record<string, string> = {};
      (data ?? []).forEach((f) => {
        if (f.path && f.signedUrl) mapa[f.path] = f.signedUrl;
      });
      return mapa;
    },
  });

  return (valor: string | null | undefined) => {
    if (!valor) return null;
    if (esUrlExterna(valor)) return valor;
    return data?.[valor] ?? null;
  };
}

export async function urlFirmada(valor: string | null | undefined) {
  if (!valor) return null;
  if (esUrlExterna(valor)) return valor;
  const { data } = await supabase.storage.from(BUCKET_PRODUCTOS).createSignedUrl(valor, 60 * 60);
  return data?.signedUrl ?? null;
}
