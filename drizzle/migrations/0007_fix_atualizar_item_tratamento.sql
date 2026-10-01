CREATE OR REPLACE FUNCTION public.atualizar_item_tratamento(p_item uuid, p_status text, p_observacao text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i orcamento_itens%ROWTYPE; v_abertos int;
BEGIN
  SELECT * INTO i FROM orcamento_itens WHERE id = p_item FOR UPDATE;
  IF NOT FOUND OR i.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_status NOT IN ('planejado','agendado','em_execucao','concluido') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF NOT i.aprovado OR i.status = 'recusado' THEN RAISE EXCEPTION 'Item não aprovado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM orcamentos WHERE id = i.orcamento_id AND status IN ('aprovado','em_execucao','concluido')) THEN
    RAISE EXCEPTION 'Orçamento ainda não aprovado';
  END IF;
  UPDATE orcamento_itens SET status = p_status WHERE id = i.id;
  UPDATE tratamento_sessoes SET status = p_status,
      realizado_em = CASE WHEN p_status = 'concluido' THEN now() ELSE NULL END,
      observacao = coalesce(p_observacao, observacao)
    WHERE id = (SELECT id FROM tratamento_sessoes WHERE orcamento_item_id = i.id ORDER BY numero DESC LIMIT 1);
  IF i.marcacao_id IS NOT NULL AND p_status IN ('planejado','em_execucao','concluido') THEN
    UPDATE odontograma_marcacoes SET status = p_status WHERE id = i.marcacao_id;
  END IF;
  SELECT count(*) INTO v_abertos FROM orcamento_itens WHERE orcamento_id = i.orcamento_id AND aprovado AND status <> 'concluido';
  UPDATE orcamentos SET status = CASE WHEN v_abertos = 0 THEN 'concluido'::orcamento_status ELSE 'em_execucao'::orcamento_status END
    WHERE id = i.orcamento_id;
END $$;