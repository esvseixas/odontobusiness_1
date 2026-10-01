ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS desconto_tipo text NOT NULL DEFAULT 'valor' CHECK (desconto_tipo IN ('valor','percentual')),
  ADD COLUMN IF NOT EXISTS desconto_percentual numeric(5,2) NOT NULL DEFAULT 0 CHECK (desconto_percentual >= 0 AND desconto_percentual <= 100),
  ADD COLUMN IF NOT EXISTS validade date,
  ADD COLUMN IF NOT EXISTS aceite_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS aceite_token_expira timestamptz,
  ADD COLUMN IF NOT EXISTS aceito_em timestamptz;

ALTER TABLE public.orcamento_itens
  ADD COLUMN IF NOT EXISTS aprovado boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','agendado','em_execucao','concluido','recusado')),
  ADD COLUMN IF NOT EXISTS marcacao_id uuid REFERENCES public.odontograma_marcacoes(id);

CREATE TABLE public.orcamento_aceites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id),
  nome text NOT NULL,
  documento text,
  canal text NOT NULL CHECK (canal IN ('tela','link')),
  assinatura_base64 text NOT NULL,
  registrado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orcamento_aceites TO authenticated;
GRANT ALL ON public.orcamento_aceites TO service_role;
ALTER TABLE public.orcamento_aceites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aceites_select" ON public.orcamento_aceites FOR SELECT TO authenticated
  USING (clinica_id = public.current_clinica_id());
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_aceites FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.tratamento_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  orcamento_item_id uuid NOT NULL REFERENCES public.orcamento_itens(id),
  agendamento_id uuid REFERENCES public.agendamentos(id),
  numero integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado','agendado','em_execucao','concluido','cancelado')),
  observacao text,
  realizado_em timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tratamento_sessoes TO authenticated;
GRANT ALL ON public.tratamento_sessoes TO service_role;
ALTER TABLE public.tratamento_sessoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessoes_select" ON public.tratamento_sessoes FOR SELECT TO authenticated
  USING (clinica_id = public.current_clinica_id());
CREATE POLICY "sessoes_insert" ON public.tratamento_sessoes FOR INSERT TO authenticated
  WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao'));
CREATE POLICY "sessoes_update" ON public.tratamento_sessoes FOR UPDATE TO authenticated
  USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.tratamento_sessoes FOR EACH ROW EXECUTE FUNCTION public.auditar();

-- Gera orçamento a partir das marcações planejadas, de forma atômica
CREATE OR REPLACE FUNCTION public.gerar_orcamento(p_paciente uuid, p_validade_dias integer DEFAULT 30)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_orc uuid; v_versao int; v_total numeric(12,2); v_qtd int;
BEGIN
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao') THEN RAISE EXCEPTION 'Sem permissão para gerar orçamentos'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pacientes WHERE id = p_paciente AND clinica_id = v_clinica) THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
  SELECT count(*), coalesce(sum(p.valor),0) INTO v_qtd, v_total
    FROM odontograma_marcacoes m JOIN procedimentos p ON p.id = m.procedimento_id
    WHERE m.paciente_id = p_paciente AND m.clinica_id = v_clinica AND m.ativo AND m.status = 'planejado' AND m.orcamento_id IS NULL;
  IF v_qtd = 0 THEN RAISE EXCEPTION 'Marque procedimentos planejados no odontograma primeiro.'; END IF;
  SELECT coalesce(max(versao),0)+1 INTO v_versao FROM orcamentos WHERE paciente_id = p_paciente;
  INSERT INTO orcamentos (clinica_id, paciente_id, versao, valor_total, validade, created_by)
    VALUES (v_clinica, p_paciente, v_versao, v_total, current_date + greatest(coalesce(p_validade_dias,30),1), auth.uid()) RETURNING id INTO v_orc;
  INSERT INTO orcamento_itens (clinica_id, orcamento_id, procedimento_id, descricao, dente, faces, quantidade, valor_unitario, marcacao_id)
    SELECT v_clinica, v_orc, p.id, p.nome || ' — dente ' || m.dente, m.dente, CASE WHEN m.face IS NULL THEN NULL ELSE ARRAY[m.face] END, 1, p.valor, m.id
    FROM odontograma_marcacoes m JOIN procedimentos p ON p.id = m.procedimento_id
    WHERE m.paciente_id = p_paciente AND m.clinica_id = v_clinica AND m.ativo AND m.status = 'planejado' AND m.orcamento_id IS NULL;
  UPDATE odontograma_marcacoes SET orcamento_id = v_orc
    WHERE paciente_id = p_paciente AND clinica_id = v_clinica AND ativo AND status = 'planejado' AND orcamento_id IS NULL AND procedimento_id IS NOT NULL;
  RETURN v_orc;
END $$;

-- Ajustes de orçamento pendente: itens aprovados e desconto
CREATE OR REPLACE FUNCTION public.ajustar_orcamento(p_orcamento uuid, p_itens_aprovados uuid[], p_desconto_tipo text, p_desconto numeric, p_validade date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o orcamentos%ROWTYPE; v_bruto numeric(12,2);
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF o.status <> 'pendente' THEN RAISE EXCEPTION 'Somente orçamentos pendentes podem ser ajustados'; END IF;
  IF p_desconto_tipo NOT IN ('valor','percentual') OR coalesce(p_desconto,0) < 0 THEN RAISE EXCEPTION 'Desconto inválido'; END IF;
  IF p_desconto_tipo = 'percentual' AND p_desconto > 100 THEN RAISE EXCEPTION 'Percentual acima de 100%%'; END IF;
  UPDATE orcamento_itens SET aprovado = (id = ANY(coalesce(p_itens_aprovados,'{}'))) WHERE orcamento_id = o.id;
  SELECT coalesce(sum(quantidade*valor_unitario),0) INTO v_bruto FROM orcamento_itens WHERE orcamento_id = o.id AND aprovado;
  UPDATE orcamentos SET
    desconto_tipo = p_desconto_tipo,
    desconto_percentual = CASE WHEN p_desconto_tipo = 'percentual' THEN p_desconto ELSE 0 END,
    desconto = CASE WHEN p_desconto_tipo = 'percentual' THEN round(v_bruto * p_desconto / 100, 2) ELSE least(round(p_desconto,2), v_bruto) END,
    valor_total = v_bruto,
    validade = coalesce(p_validade, validade)
  WHERE id = o.id;
END $$;

-- Aprovação: considera apenas itens aprovados; recusa os demais e libera marcações
CREATE OR REPLACE FUNCTION public.aprovar_orcamento(p_orcamento uuid, p_parcelas integer, p_dia_vencimento integer, p_forma_pagamento text DEFAULT 'A definir'::text, p_entrada numeric DEFAULT 0)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE o orcamentos%ROWTYPE; v_total numeric(12,2); v_resto numeric(12,2); v_parcela numeric(12,2);
  v_acum numeric(12,2) := 0; v_n int; v_total_parc int; v_k int; v_mes date; v_ult int; v_conta uuid; v_valor numeric(12,2);
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão para aprovar orçamentos'; END IF;
  IF o.status <> 'pendente' THEN RAISE EXCEPTION 'Somente orçamentos pendentes podem ser aprovados'; END IF;
  IF o.validade IS NOT NULL AND o.validade < current_date THEN RAISE EXCEPTION 'Orçamento vencido em %; ajuste a validade antes de aprovar', to_char(o.validade,'DD/MM/YYYY'); END IF;
  IF NOT EXISTS (SELECT 1 FROM orcamento_itens WHERE orcamento_id = o.id AND aprovado) THEN RAISE EXCEPTION 'Selecione ao menos um item para aprovar'; END IF;
  IF p_parcelas < 1 OR p_parcelas > 48 THEN RAISE EXCEPTION 'Número de parcelas inválido'; END IF;
  IF p_dia_vencimento < 1 OR p_dia_vencimento > 31 THEN RAISE EXCEPTION 'Dia de vencimento inválido'; END IF;
  SELECT coalesce(sum(quantidade*valor_unitario),0) INTO v_total FROM orcamento_itens WHERE orcamento_id = o.id AND aprovado;
  v_total := round(v_total - least(o.desconto, v_total), 2);
  p_entrada := round(coalesce(p_entrada,0), 2);
  IF v_total <= 0 THEN RAISE EXCEPTION 'Valor do orçamento inválido'; END IF;
  IF p_entrada < 0 OR p_entrada > v_total THEN RAISE EXCEPTION 'Entrada inválida'; END IF;
  SELECT id INTO v_conta FROM plano_contas WHERE clinica_id = o.clinica_id AND tipo = 'receita' ORDER BY (nome = 'Receita de procedimentos') DESC, created_at LIMIT 1;
  v_resto := v_total - p_entrada;
  v_n := CASE WHEN v_resto > 0 THEN p_parcelas ELSE 0 END;
  v_total_parc := v_n + CASE WHEN p_entrada > 0 THEN 1 ELSE 0 END;
  v_k := 0;
  IF p_entrada > 0 THEN
    v_k := 1;
    INSERT INTO financeiro_recebimentos (clinica_id, paciente_id, orcamento_id, profissional_id, conta_id, descricao, parcela, total_parcelas, forma_pagamento, valor, vencimento)
    VALUES (o.clinica_id, o.paciente_id, o.id, o.profissional_id, v_conta, format('Orçamento v%s — entrada', o.versao), 1, v_total_parc, p_forma_pagamento, p_entrada, current_date);
  END IF;
  IF v_n > 0 THEN
    v_parcela := trunc(v_resto / v_n, 2);
    FOR i IN 1..v_n LOOP
      v_valor := CASE WHEN i = v_n THEN v_resto - v_acum ELSE v_parcela END;
      v_acum := v_acum + v_valor;
      v_mes := (date_trunc('month', current_date) + make_interval(months => i - CASE WHEN p_entrada > 0 THEN 0 ELSE 1 END
                 + CASE WHEN p_entrada = 0 AND p_dia_vencimento < extract(day FROM current_date) THEN 1 ELSE 0 END))::date;
      v_ult := extract(day FROM (v_mes + interval '1 month - 1 day'))::int;
      INSERT INTO financeiro_recebimentos (clinica_id, paciente_id, orcamento_id, profissional_id, conta_id, descricao, parcela, total_parcelas, forma_pagamento, valor, vencimento)
      VALUES (o.clinica_id, o.paciente_id, o.id, o.profissional_id, v_conta, format('Orçamento v%s — tratamento', o.versao),
              v_k + i, v_total_parc, p_forma_pagamento, v_valor, v_mes + (least(p_dia_vencimento, v_ult) - 1));
    END LOOP;
  END IF;
  UPDATE orcamento_itens SET status = 'recusado' WHERE orcamento_id = o.id AND NOT aprovado;
  UPDATE odontograma_marcacoes SET orcamento_id = NULL
    WHERE id IN (SELECT marcacao_id FROM orcamento_itens WHERE orcamento_id = o.id AND NOT aprovado AND marcacao_id IS NOT NULL);
  INSERT INTO tratamento_sessoes (clinica_id, orcamento_item_id, numero)
    SELECT o.clinica_id, i.id, 1 FROM orcamento_itens i WHERE i.orcamento_id = o.id AND i.aprovado;
  UPDATE orcamentos SET status = 'aprovado' WHERE id = o.id;
END $function$;

-- Atualiza status de um item do plano e sincroniza o odontograma
CREATE OR REPLACE FUNCTION public.atualizar_item_tratamento(p_item uuid, p_status text, p_observacao text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i orcamento_itens%ROWTYPE; v_orc uuid; v_abertos int;
BEGIN
  SELECT * INTO i FROM orcamento_itens WHERE id = p_item FOR UPDATE;
  IF NOT FOUND OR i.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_status NOT IN ('planejado','agendado','em_execucao','concluido') THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF NOT i.aprovado OR i.status = 'recusado' THEN RAISE EXCEPTION 'Item não aprovado'; END IF;
  SELECT status::text INTO STRICT v_orc FROM orcamentos WHERE id = i.orcamento_id AND status IN ('aprovado','em_execucao','concluido');
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
EXCEPTION WHEN no_data_found THEN RAISE EXCEPTION 'Orçamento ainda não aprovado';
END $$;

-- Aceite do paciente na tela
CREATE OR REPLACE FUNCTION public.registrar_aceite_orcamento(p_orcamento uuid, p_nome text, p_documento text, p_assinatura text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o orcamentos%ROWTYPE;
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF coalesce(trim(p_nome),'') = '' OR coalesce(p_assinatura,'') NOT LIKE 'data:image/%' THEN RAISE EXCEPTION 'Informe nome e assinatura'; END IF;
  INSERT INTO orcamento_aceites (clinica_id, orcamento_id, nome, documento, canal, assinatura_base64, registrado_por)
    VALUES (o.clinica_id, o.id, trim(p_nome), nullif(trim(p_documento),''), 'tela', p_assinatura, auth.uid());
  UPDATE orcamentos SET aceito_em = now() WHERE id = o.id;
END $$;

-- Link de aceite remoto
CREATE OR REPLACE FUNCTION public.gerar_link_aceite_orcamento(p_orcamento uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o orcamentos%ROWTYPE; v_token text;
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  v_token := replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
  UPDATE orcamentos SET aceite_token = v_token, aceite_token_expira = now() + interval '7 days' WHERE id = o.id;
  RETURN v_token;
END $$;

CREATE OR REPLACE FUNCTION public.ver_orcamento_aceite(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object(
    'clinica', c.nome, 'paciente', split_part(p.nome,' ',1), 'versao', o.versao, 'validade', o.validade,
    'desconto', o.desconto, 'aceito', o.aceito_em IS NOT NULL,
    'valido', o.aceite_token_expira > now() AND o.aceito_em IS NULL,
    'itens', (SELECT coalesce(jsonb_agg(jsonb_build_object('descricao', i.descricao, 'quantidade', i.quantidade, 'valor', i.valor_unitario) ORDER BY i.created_at), '[]'::jsonb)
              FROM orcamento_itens i WHERE i.orcamento_id = o.id AND i.aprovado))
  FROM orcamentos o JOIN clinicas c ON c.id = o.clinica_id JOIN pacientes p ON p.id = o.paciente_id
  WHERE o.aceite_token = p_token
$$;

CREATE OR REPLACE FUNCTION public.aceitar_orcamento_link(p_token text, p_nome text, p_documento text, p_assinatura text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE o orcamentos%ROWTYPE;
BEGIN
  SELECT * INTO o FROM orcamentos WHERE aceite_token = p_token FOR UPDATE;
  IF NOT FOUND OR o.aceite_token_expira <= now() OR o.aceito_em IS NOT NULL THEN RAISE EXCEPTION 'Link inválido ou expirado'; END IF;
  IF coalesce(trim(p_nome),'') = '' OR coalesce(p_assinatura,'') NOT LIKE 'data:image/%' OR length(p_assinatura) > 500000 THEN RAISE EXCEPTION 'Informe nome e assinatura'; END IF;
  INSERT INTO orcamento_aceites (clinica_id, orcamento_id, nome, documento, canal, assinatura_base64)
    VALUES (o.clinica_id, o.id, trim(p_nome), nullif(trim(p_documento),''), 'link', p_assinatura);
  UPDATE orcamentos SET aceito_em = now(), aceite_token_expira = now() WHERE id = o.id;
END $$;

REVOKE EXECUTE ON FUNCTION public.ver_orcamento_aceite(text), public.aceitar_orcamento_link(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ver_orcamento_aceite(text), public.aceitar_orcamento_link(text,text,text,text) TO anon, authenticated;