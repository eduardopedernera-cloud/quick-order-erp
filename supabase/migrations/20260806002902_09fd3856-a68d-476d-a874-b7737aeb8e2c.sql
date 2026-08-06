REVOKE EXECUTE ON FUNCTION public.crear_pedido(uuid, jsonb, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.recibir_compra(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.crear_pedido(uuid, jsonb, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recibir_compra(uuid) TO authenticated;