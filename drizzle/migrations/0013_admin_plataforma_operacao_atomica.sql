CREATE OR REPLACE FUNCTION public.administrar_cliente_plataforma(
  p_clinica uuid,
  p_plano text,
  p_status text,
  p_ciclo text,
  p_valor numeric,
  p_trial_ate date DEFAULT NULL,
  p_proxima_cobranca date DEFAULT NULL,
  p_motivo text DEFAULT NULL,
  p_nota text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_antes jsonb; v_depois jsonb; v_nota_id uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito ao administrador da plataforma'; END IF;
  IF p_plano NOT IN ('solo','clinica','rede') OR p_status NOT IN ('teste','ativo','inadimplente','suspenso','cancelado','cortesia') OR p_ciclo NOT IN ('mensal','anual') THEN RAISE EXCEPTION 'Plano, situação ou ciclo inválido'; END IF;
  IF p_valor < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF p_status IN ('suspenso','cancelado','inadimplente') AND coalesce(trim(p_motivo),'') = '' THEN RAISE EXCEPTION 'Informe o motivo da alteração'; END IF;
  IF coalesce(trim(p_nota),'') <> '' AND length(trim(p_nota)) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'A observação deve ter entre 3 e 2000 caracteres'; END IF;

  SELECT to_jsonb(a) INTO v_antes FROM public.assinaturas_plataforma a WHERE a.clinica_id = p_clinica FOR UPDATE;
  IF v_antes IS NULL THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;

  UPDATE public.assinaturas_plataforma
  SET plano = p_plano, status = p_status, ciclo = p_ciclo, valor_mensal = round(p_valor,2),
      trial_ate = p_trial_ate, proxima_cobranca = p_proxima_cobranca,
      motivo_status = nullif(trim(p_motivo),''), atualizado_por = auth.uid(), updated_at = now()
  WHERE clinica_id = p_clinica;

  IF coalesce(trim(p_nota),'') <> '' THEN
    INSERT INTO public.suporte_notas (clinica_id, nota, autor_id)
    VALUES (p_clinica, trim(p_nota), auth.uid()) RETURNING id INTO v_nota_id;
  END IF;

  SELECT to_jsonb(a) INTO v_depois FROM public.assinaturas_plataforma a WHERE a.clinica_id = p_clinica;
  INSERT INTO public.auditoria_plataforma (clinica_id, usuario_id, acao, detalhes)
  VALUES (p_clinica, auth.uid(), 'administrou cliente', jsonb_build_object('antes',v_antes,'depois',v_depois,'nota_id',v_nota_id));
END
$$;
GRANT EXECUTE ON FUNCTION public.administrar_cliente_plataforma(uuid,text,text,text,numeric,date,date,text,text) TO authenticated;