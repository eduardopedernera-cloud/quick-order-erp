-- Trigger-only functions: no direct execution by API roles
REVOKE ALL ON FUNCTION public.aplicar_movimiento_saldo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Business RPCs and RLS helpers: signed-in users only
REVOKE ALL ON FUNCTION public.crear_pedido(uuid, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crear_pedido(uuid, jsonb, text) TO authenticated;

REVOKE ALL ON FUNCTION public.recibir_compra(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.recibir_compra(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.my_cliente_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_cliente_id() TO authenticated;