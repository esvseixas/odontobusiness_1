CREATE OR REPLACE FUNCTION public.cancelar_orcamento(p_orcamento uuid, p_motivo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o orcamentos%ROWTYPE;
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','financeiro') THEN RAISE EXCEPTION 'Sem permissão para cancelar orçamentos'; END IF;
  IF length(trim(coalesce(p_motivo,''))) < 5 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento (mínimo 5 caracteres)'; END IF;
  IF o.status IN ('recusado','concluido') OR o.cancelado_em IS NOT NULL THEN RAISE EXCEPTION 'Este orçamento não pode mais ser cancelado'; END IF;
  IF EXISTS (SELECT 1 FROM orcamento_itens WHERE orcamento_id = o.id AND status IN ('em_execucao','concluido')) THEN
    RAISE EXCEPTION 'Há procedimentos em execução ou concluídos; cancele apenas os itens pendentes no plano';
  END IF;
  UPDATE orcamentos SET status = 'recusado', cancelado_motivo = trim(p_motivo), cancelado_em = now() WHERE id = o.id;
  UPDATE orcamento_itens SET status = 'recusado' WHERE orcamento_id = o.id;
  UPDATE tratamento_sessoes SET status = 'cancelado' WHERE orcamento_item_id IN (SELECT id FROM orcamento_itens WHERE orcamento_id = o.id) AND status <> 'concluido';
  UPDATE odontograma_marcacoes SET orcamento_id = NULL WHERE orcamento_id = o.id AND status = 'planejado';
  UPDATE financeiro_recebimentos SET status = 'cancelado', cancelado_motivo = 'Orçamento cancelado: ' || trim(p_motivo), cancelado_em = now()
    WHERE orcamento_id = o.id AND status IN ('pendente','atrasado');
END $$;

CREATE OR REPLACE FUNCTION public.cancelar_lancamento(p_tipo text, p_id uuid, p_motivo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid; v_status lancamento_status;
BEGIN
  IF NOT tem_papel('owner','admin','financeiro') THEN RAISE EXCEPTION 'Sem permissão para cancelar lançamentos'; END IF;
  IF length(trim(coalesce(p_motivo,''))) < 5 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento (mínimo 5 caracteres)'; END IF;
  IF p_tipo = 'receber' THEN
    SELECT clinica_id, status INTO v_clinica, v_status FROM financeiro_recebimentos WHERE id = p_id FOR UPDATE;
  ELSIF p_tipo = 'pagar' THEN
    SELECT clinica_id, status INTO v_clinica, v_status FROM financeiro_pagamentos WHERE id = p_id FOR UPDATE;
  ELSE RAISE EXCEPTION 'Tipo inválido'; END IF;
  IF v_clinica IS NULL OR v_clinica <> current_clinica_id() THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;
  IF v_status NOT IN ('pendente','atrasado') THEN RAISE EXCEPTION 'Somente lançamentos em aberto podem ser cancelados'; END IF;
  IF p_tipo = 'receber' THEN
    UPDATE financeiro_recebimentos SET status = 'cancelado', cancelado_motivo = trim(p_motivo), cancelado_em = now() WHERE id = p_id;
  ELSE
    UPDATE financeiro_pagamentos SET status = 'cancelado', cancelado_motivo = trim(p_motivo), cancelado_em = now() WHERE id = p_id;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.cancelar_orcamento(uuid,text), public.cancelar_lancamento(text,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancelar_orcamento(uuid,text), public.cancelar_lancamento(text,uuid,text) TO authenticated;