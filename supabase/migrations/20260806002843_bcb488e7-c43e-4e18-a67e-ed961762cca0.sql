ALTER TABLE public.movimientos_cc
  ADD COLUMN IF NOT EXISTS metodo_pago text,
  ADD COLUMN IF NOT EXISTS referencia text;

CREATE OR REPLACE FUNCTION public.crear_pedido(
  p_cliente_id uuid,
  p_items jsonb,
  p_observaciones text DEFAULT NULL
)
RETURNS TABLE (pedido_id uuid, numero bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric := 0;
  v_pedido public.pedidos%ROWTYPE;
  v_item jsonb;
  v_prod public.productos%ROWTYPE;
  v_cant numeric;
  v_cliente public.clientes%ROWTYPE;
  v_permitido boolean;
BEGIN
  SELECT * INTO v_cliente FROM public.clientes WHERE id = p_cliente_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cliente inexistente'; END IF;

  v_permitido := public.is_staff(auth.uid()) OR p_cliente_id = public.my_cliente_id();
  IF NOT v_permitido THEN RAISE EXCEPTION 'No autorizado'; END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El pedido no tiene items';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_cant := (v_item->>'cantidad')::numeric;
    SELECT * INTO v_prod FROM public.productos WHERE id = (v_item->>'producto_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Producto inexistente'; END IF;
    IF v_cant <= 0 THEN RAISE EXCEPTION 'Cantidad invalida para %', v_prod.nombre; END IF;
    IF v_prod.stock < v_cant THEN
      RAISE EXCEPTION 'Stock insuficiente de %: quedan %', v_prod.nombre, v_prod.stock;
    END IF;
    v_total := v_total + v_cant * v_prod.precio_venta;
  END LOOP;

  IF v_cliente.limite_credito > 0 AND (v_cliente.saldo + v_total) > v_cliente.limite_credito THEN
    RAISE EXCEPTION 'Supera el limite de credito: disponible %',
      GREATEST(v_cliente.limite_credito - v_cliente.saldo, 0);
  END IF;

  INSERT INTO public.pedidos (cliente_id, vendedor_id, subtotal, total, observaciones, estado)
  VALUES (p_cliente_id, auth.uid(), v_total, v_total, NULLIF(p_observaciones, ''), 'pendiente')
  RETURNING * INTO v_pedido;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_cant := (v_item->>'cantidad')::numeric;
    SELECT * INTO v_prod FROM public.productos WHERE id = (v_item->>'producto_id')::uuid;

    INSERT INTO public.pedido_items
      (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
    VALUES
      (v_pedido.id, v_prod.id, v_prod.nombre, v_cant, v_prod.precio_venta, v_cant * v_prod.precio_venta);

    UPDATE public.productos SET stock = stock - v_cant WHERE id = v_prod.id;
  END LOOP;

  INSERT INTO public.movimientos_cc (cliente_id, tipo, monto, concepto, pedido_id)
  VALUES (p_cliente_id, 'debe', v_total, 'Pedido #' || v_pedido.numero, v_pedido.id);

  pedido_id := v_pedido.id;
  numero := v_pedido.numero;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.crear_pedido(uuid, jsonb, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.recibir_compra(p_compra_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compra public.compras%ROWTYPE;
  v_item public.compra_items%ROWTYPE;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'No autorizado'; END IF;

  SELECT * INTO v_compra FROM public.compras WHERE id = p_compra_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Compra inexistente'; END IF;
  IF v_compra.estado = 'recibida' THEN RAISE EXCEPTION 'La compra ya fue recibida'; END IF;

  FOR v_item IN SELECT * FROM public.compra_items WHERE compra_id = p_compra_id LOOP
    IF v_item.producto_id IS NOT NULL THEN
      UPDATE public.productos
      SET stock = stock + v_item.cantidad,
          precio_costo = v_item.costo_unitario
      WHERE id = v_item.producto_id;
    END IF;
  END LOOP;

  UPDATE public.compras SET estado = 'recibida' WHERE id = p_compra_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recibir_compra(uuid) TO authenticated;