-- ===================== 1. CADASTROS =====================
CREATE TYPE public.estoque_mov_tipo AS ENUM ('entrada','saida_uso','ajuste','perda','vencido','transferencia','devolucao');

CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text,
  contato text,
  telefone text,
  email text,
  prazo_entrega_dias integer NOT NULL DEFAULT 7 CHECK (prazo_entrega_dias >= 0),
  condicoes_pagamento text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "forn_select" ON public.fornecedores FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "forn_insert" ON public.fornecedores FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque'));
CREATE POLICY "forn_update" ON public.fornecedores FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque')) WITH CHECK (clinica_id = public.current_clinica_id());
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.auditar();

ALTER TABLE public.estoque_itens
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS codigo_barras text,
  ADD COLUMN IF NOT EXISTS unidade_compra text,
  ADD COLUMN IF NOT EXISTS fator_conversao numeric(12,3) NOT NULL DEFAULT 1 CHECK (fator_conversao > 0),
  ADD COLUMN IF NOT EXISTS custo_medio numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS controla_lote boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS controla_validade boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS registro_anvisa text,
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.estoque_itens.quantidade IS 'DEPRECATED: saldo vem da soma dos lotes (view estoque_saldos)';
COMMENT ON COLUMN public.estoque_itens.validade IS 'DEPRECATED: validade fica nos lotes';
COMMENT ON COLUMN public.estoque_itens.fornecedor IS 'DEPRECATED: use fornecedor_id';

ALTER TABLE public.estoque_lotes
  ADD COLUMN IF NOT EXISTS custo_unitario numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS nota_fiscal text;
ALTER TABLE public.estoque_lotes ADD CONSTRAINT estoque_lotes_saldo_nao_negativo CHECK (quantidade >= 0);

-- Escritas em lotes/movimentações só via RPC
REVOKE INSERT, UPDATE, DELETE ON public.estoque_lotes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.estoque_movimentacoes FROM authenticated;
REVOKE DELETE ON public.estoque_itens FROM authenticated;
DROP POLICY IF EXISTS "estoque delete" ON public.estoque_itens;
DROP POLICY IF EXISTS "estoque insert" ON public.estoque_lotes;
DROP POLICY IF EXISTS "estoque update" ON public.estoque_lotes;
DROP POLICY IF EXISTS "estoque delete" ON public.estoque_lotes;
DROP POLICY IF EXISTS "estoque insert" ON public.estoque_movimentacoes;
DROP POLICY IF EXISTS "estoque insert" ON public.estoque_itens;
DROP POLICY IF EXISTS "estoque update" ON public.estoque_itens;
CREATE POLICY "itens_insert" ON public.estoque_itens FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque'));
CREATE POLICY "itens_update" ON public.estoque_itens FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque')) WITH CHECK (clinica_id = public.current_clinica_id());

-- ===================== 2. MOVIMENTAÇÕES =====================
ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS tipo_mov public.estoque_mov_tipo,
  ADD COLUMN IF NOT EXISTS delta numeric(12,3),
  ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES public.estoque_lotes(id),
  ADD COLUMN IF NOT EXISTS unidade_id uuid REFERENCES public.unidades(id),
  ADD COLUMN IF NOT EXISTS agendamento_id uuid REFERENCES public.agendamentos(id),
  ADD COLUMN IF NOT EXISTS procedimento_id uuid REFERENCES public.procedimentos(id),
  ADD COLUMN IF NOT EXISTS paciente_id uuid REFERENCES public.pacientes(id),
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES public.profissionais(id),
  ADD COLUMN IF NOT EXISTS custo_unitario numeric(12,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custo_total numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referencia_id uuid;
UPDATE public.estoque_movimentacoes SET
  tipo_mov = CASE WHEN tipo = 'entrada' THEN 'entrada'::public.estoque_mov_tipo ELSE 'saida_uso'::public.estoque_mov_tipo END,
  delta = CASE WHEN tipo = 'entrada' THEN quantidade ELSE -abs(quantidade) END
WHERE tipo_mov IS NULL;
COMMENT ON COLUMN public.estoque_movimentacoes.tipo IS 'DEPRECATED: use tipo_mov (enum)';
CREATE INDEX IF NOT EXISTS estoque_mov_item_idx ON public.estoque_movimentacoes (clinica_id, item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS estoque_mov_lote_idx ON public.estoque_movimentacoes (lote_id);
CREATE INDEX IF NOT EXISTS estoque_mov_ag_idx ON public.estoque_movimentacoes (agendamento_id);

-- Imutabilidade (mesmo para funções privilegiadas)
CREATE OR REPLACE FUNCTION public.bloquear_alteracao_movimentacao()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Movimentações de estoque não podem ser alteradas nem excluídas; registre um ajuste com motivo.'; END $$;
CREATE TRIGGER trg_mov_imutavel BEFORE UPDATE OR DELETE ON public.estoque_movimentacoes FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_movimentacao();

-- Saldos (view com RLS do chamador)
CREATE OR REPLACE VIEW public.estoque_saldos WITH (security_invoker = true) AS
  SELECT l.clinica_id, l.item_id, l.unidade_id,
         sum(l.quantidade)::numeric(12,3) AS saldo,
         round(sum(l.quantidade * l.custo_unitario), 2)::numeric(12,2) AS valor,
         min(l.validade) FILTER (WHERE l.quantidade > 0) AS proxima_validade
  FROM public.estoque_lotes l GROUP BY l.clinica_id, l.item_id, l.unidade_id;
CREATE OR REPLACE VIEW public.estoque_saldo_itens WITH (security_invoker = true) AS
  SELECT i.id AS item_id, i.clinica_id, i.nome, i.categoria, i.unidade_medida, i.estoque_minimo, i.custo_medio, i.ativo,
         coalesce(sum(l.quantidade),0)::numeric(12,3) AS saldo,
         round(coalesce(sum(l.quantidade * l.custo_unitario),0), 2)::numeric(12,2) AS valor,
         min(l.validade) FILTER (WHERE l.quantidade > 0) AS proxima_validade
  FROM public.estoque_itens i LEFT JOIN public.estoque_lotes l ON l.item_id = i.id
  GROUP BY i.id;
GRANT SELECT ON public.estoque_saldos, public.estoque_saldo_itens TO authenticated;

-- Núcleo interno: aplica delta no lote e grava movimentação (sem checar papel)
CREATE OR REPLACE FUNCTION public._estoque_mov(p_lote uuid, p_tipo public.estoque_mov_tipo, p_delta numeric, p_motivo text,
  p_agendamento uuid DEFAULT NULL, p_procedimento uuid DEFAULT NULL, p_paciente uuid DEFAULT NULL, p_profissional uuid DEFAULT NULL, p_ref uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l estoque_lotes%ROWTYPE; v_id uuid;
BEGIN
  SELECT * INTO l FROM estoque_lotes WHERE id = p_lote FOR UPDATE;
  IF NOT FOUND OR l.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF p_delta = 0 THEN RAISE EXCEPTION 'Quantidade deve ser diferente de zero'; END IF;
  IF l.quantidade + p_delta < 0 THEN
    RAISE EXCEPTION 'Saldo insuficiente no lote % (disponível %, solicitado %)', coalesce(l.numero_lote,'s/n'), l.quantidade, abs(p_delta);
  END IF;
  UPDATE estoque_lotes SET quantidade = quantidade + p_delta WHERE id = l.id;
  INSERT INTO estoque_movimentacoes (clinica_id, item_id, tipo, tipo_mov, quantidade, delta, motivo, lote_id, unidade_id, agendamento_id,
    procedimento_id, paciente_id, profissional_id, custo_unitario, custo_total, referencia_id, created_by)
  VALUES (l.clinica_id, l.item_id, CASE WHEN p_delta > 0 THEN 'entrada' ELSE 'saida' END, p_tipo, abs(p_delta), p_delta, p_motivo, l.id, l.unidade_id,
    p_agendamento, p_procedimento, p_paciente, p_profissional, l.custo_unitario, round(abs(p_delta) * l.custo_unitario, 2), p_ref, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE EXECUTE ON FUNCTION public._estoque_mov(uuid, public.estoque_mov_tipo, numeric, text, uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Entrada: cria lote, recalcula custo médio ponderado
CREATE OR REPLACE FUNCTION public._estoque_entrada(p_item uuid, p_unidade uuid, p_lote text, p_validade date, p_qtd numeric, p_custo numeric,
  p_fornecedor uuid, p_nota text, p_tipo public.estoque_mov_tipo, p_motivo text, p_ref uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE i estoque_itens%ROWTYPE; v_saldo numeric; v_lote uuid;
BEGIN
  SELECT * INTO i FROM estoque_itens WHERE id = p_item FOR UPDATE;
  IF NOT FOUND OR i.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  IF coalesce(p_qtd,0) <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;
  IF coalesce(p_custo,0) < 0 THEN RAISE EXCEPTION 'Custo inválido'; END IF;
  IF i.controla_lote AND coalesce(trim(p_lote),'') = '' THEN RAISE EXCEPTION 'Informe o número do lote de "%"', i.nome; END IF;
  IF i.controla_validade AND p_validade IS NULL THEN RAISE EXCEPTION 'Informe a validade de "%"', i.nome; END IF;
  IF p_unidade IS NOT NULL AND NOT EXISTS (SELECT 1 FROM unidades WHERE id = p_unidade AND clinica_id = i.clinica_id) THEN RAISE EXCEPTION 'Unidade inválida'; END IF;
  SELECT coalesce(sum(quantidade),0) INTO v_saldo FROM estoque_lotes WHERE item_id = i.id;
  IF p_tipo = 'entrada' THEN
    UPDATE estoque_itens SET custo_medio = round(CASE WHEN v_saldo + p_qtd > 0 THEN (v_saldo * custo_medio + p_qtd * coalesce(p_custo,0)) / (v_saldo + p_qtd) ELSE coalesce(p_custo,0) END, 4)
      WHERE id = i.id;
  END IF;
  INSERT INTO estoque_lotes (clinica_id, item_id, unidade_id, numero_lote, quantidade, validade, custo_unitario, fornecedor_id, nota_fiscal, created_by)
    VALUES (i.clinica_id, i.id, p_unidade, nullif(trim(p_lote),''), 0, p_validade, coalesce(p_custo,0), p_fornecedor, nullif(trim(p_nota),''), auth.uid())
    RETURNING id INTO v_lote;
  PERFORM _estoque_mov(v_lote, p_tipo, p_qtd, p_motivo, NULL, NULL, NULL, NULL, p_ref);
  RETURN v_lote;
END $$;
REVOKE EXECUTE ON FUNCTION public._estoque_entrada(uuid, uuid, text, date, numeric, numeric, uuid, text, public.estoque_mov_tipo, text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_entrada_estoque(p_item uuid, p_unidade uuid, p_lote text, p_validade date, p_quantidade numeric,
  p_custo_unitario numeric, p_fornecedor uuid DEFAULT NULL, p_nota text DEFAULT NULL, p_motivo text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para movimentar estoque'; END IF;
  RETURN _estoque_entrada(p_item, p_unidade, p_lote, p_validade, round(p_quantidade,3), p_custo_unitario, p_fornecedor, p_nota, 'entrada', coalesce(nullif(trim(p_motivo),''),'Entrada manual'));
END $$;

-- Ajuste / perda / vencido / devolução / saída avulsa
CREATE OR REPLACE FUNCTION public.registrar_movimento_estoque(p_lote uuid, p_tipo text, p_quantidade numeric, p_motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_tipo estoque_mov_tipo; v_delta numeric;
BEGIN
  IF p_tipo NOT IN ('ajuste','perda','vencido','devolucao','saida_uso') THEN RAISE EXCEPTION 'Tipo de movimento inválido'; END IF;
  v_tipo := p_tipo::estoque_mov_tipo;
  IF v_tipo = 'saida_uso' THEN
    IF NOT tem_papel('owner','admin','estoque','dentista','esteticista','auxiliar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  ELSIF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para movimentar estoque'; END IF;
  IF length(trim(coalesce(p_motivo,''))) < 3 THEN RAISE EXCEPTION 'Informe o motivo'; END IF;
  v_delta := round(CASE WHEN v_tipo = 'ajuste' THEN p_quantidade WHEN v_tipo = 'devolucao' THEN -abs(p_quantidade) ELSE -abs(p_quantidade) END, 3);
  RETURN _estoque_mov(p_lote, v_tipo, v_delta, trim(p_motivo));
END $$;

-- Transferência entre unidades (atômica)
CREATE OR REPLACE FUNCTION public.transferir_estoque(p_lote uuid, p_unidade_destino uuid, p_quantidade numeric, p_motivo text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE l estoque_lotes%ROWTYPE; v_novo uuid; v_ref uuid := gen_random_uuid(); v_q numeric := round(abs(p_quantidade),3);
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para transferir estoque'; END IF;
  SELECT * INTO l FROM estoque_lotes WHERE id = p_lote;
  IF NOT FOUND OR l.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Lote não encontrado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM unidades WHERE id = p_unidade_destino AND clinica_id = l.clinica_id) THEN RAISE EXCEPTION 'Unidade de destino inválida'; END IF;
  IF l.unidade_id IS NOT DISTINCT FROM p_unidade_destino THEN RAISE EXCEPTION 'O lote já está nesta unidade'; END IF;
  PERFORM _estoque_mov(l.id, 'transferencia', -v_q, coalesce(nullif(trim(p_motivo),''),'Transferência entre unidades'), NULL, NULL, NULL, NULL, v_ref);
  SELECT id INTO v_novo FROM estoque_lotes WHERE item_id = l.item_id AND unidade_id = p_unidade_destino
    AND numero_lote IS NOT DISTINCT FROM l.numero_lote AND validade IS NOT DISTINCT FROM l.validade AND custo_unitario = l.custo_unitario LIMIT 1;
  IF v_novo IS NULL THEN
    INSERT INTO estoque_lotes (clinica_id, item_id, unidade_id, numero_lote, quantidade, validade, custo_unitario, fornecedor_id, nota_fiscal, entrada_em, created_by)
      VALUES (l.clinica_id, l.item_id, p_unidade_destino, l.numero_lote, 0, l.validade, l.custo_unitario, l.fornecedor_id, l.nota_fiscal, current_date, auth.uid()) RETURNING id INTO v_novo;
  END IF;
  PERFORM _estoque_mov(v_novo, 'transferencia', v_q, coalesce(nullif(trim(p_motivo),''),'Transferência entre unidades'), NULL, NULL, NULL, NULL, v_ref);
  RETURN v_novo;
END $$;

-- ===================== 3. FICHA TÉCNICA E BAIXA =====================
CREATE TABLE public.procedimento_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  procedimento_id uuid NOT NULL REFERENCES public.procedimentos(id),
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id),
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (procedimento_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.procedimento_insumos TO authenticated;
GRANT ALL ON public.procedimento_insumos TO service_role;
ALTER TABLE public.procedimento_insumos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_select" ON public.procedimento_insumos FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "pi_write" ON public.procedimento_insumos FOR ALL TO authenticated
  USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque'))
  WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','estoque')
    AND EXISTS (SELECT 1 FROM public.procedimentos p WHERE p.id = procedimento_id AND p.clinica_id = public.current_clinica_id())
    AND EXISTS (SELECT 1 FROM public.estoque_itens i WHERE i.id = item_id AND i.clinica_id = public.current_clinica_id()));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.procedimento_insumos FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.estoque_baixas_atendimento (
  agendamento_id uuid PRIMARY KEY REFERENCES public.agendamentos(id),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  custo_total numeric(12,2) NOT NULL DEFAULT 0,
  realizado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.estoque_baixas_atendimento TO authenticated;
GRANT ALL ON public.estoque_baixas_atendimento TO service_role;
ALTER TABLE public.estoque_baixas_atendimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "baixa_select" ON public.estoque_baixas_atendimento FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.estoque_baixas_atendimento FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.paciente_lotes_aplicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  lote_id uuid NOT NULL REFERENCES public.estoque_lotes(id),
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id),
  procedimento_id uuid REFERENCES public.procedimentos(id),
  agendamento_id uuid REFERENCES public.agendamentos(id),
  profissional_id uuid REFERENCES public.profissionais(id),
  implante_id uuid REFERENCES public.implantes(id),
  quantidade numeric(12,3) NOT NULL,
  dente text,
  aplicado_em timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);
CREATE INDEX ON public.paciente_lotes_aplicados (lote_id);
CREATE INDEX ON public.paciente_lotes_aplicados (paciente_id);
GRANT SELECT ON public.paciente_lotes_aplicados TO authenticated;
GRANT ALL ON public.paciente_lotes_aplicados TO service_role;
ALTER TABLE public.paciente_lotes_aplicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pla_select" ON public.paciente_lotes_aplicados FOR SELECT TO authenticated
  USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao','estoque'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.paciente_lotes_aplicados FOR EACH ROW EXECUTE FUNCTION public.auditar();

ALTER TABLE public.implantes ADD COLUMN IF NOT EXISTS estoque_lote_id uuid REFERENCES public.estoque_lotes(id);

-- p_insumos: [{"item_id": "...", "quantidade": 1.5, "lote_id": "... (opcional)"}]
CREATE OR REPLACE FUNCTION public.baixar_insumos_atendimento(p_agendamento uuid, p_insumos jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a agendamentos%ROWTYPE; v_exige boolean; r record; v_rest numeric; v_tirar numeric; l record; v_lote estoque_lotes%ROWTYPE;
  v_custo numeric := 0; v_itens int := 0; v_dente text; v_implante uuid;
BEGIN
  IF NOT tem_papel('owner','admin','estoque','dentista','esteticista','auxiliar') THEN RAISE EXCEPTION 'Sem permissão para baixar insumos'; END IF;
  SELECT * INTO a FROM agendamentos WHERE id = p_agendamento FOR UPDATE;
  IF NOT FOUND OR a.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Agendamento não encontrado'; END IF;
  IF EXISTS (SELECT 1 FROM estoque_baixas_atendimento WHERE agendamento_id = a.id) THEN
    RETURN jsonb_build_object('ja_baixado', true, 'itens', 0, 'custo', 0);
  END IF;
  SELECT coalesce(exige_lote_aplicado,false) INTO v_exige FROM procedimentos WHERE id = a.procedimento_id;
  v_exige := coalesce(v_exige,false);
  IF p_insumos IS NULL THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object('item_id', item_id, 'quantidade', quantidade)), '[]'::jsonb) INTO p_insumos
      FROM procedimento_insumos WHERE procedimento_id = a.procedimento_id;
  END IF;
  FOR r IN SELECT (x->>'item_id')::uuid AS item_id, round((x->>'quantidade')::numeric,3) AS qtd, nullif(x->>'lote_id','')::uuid AS lote_id, nullif(x->>'dente','') AS dente
           FROM jsonb_array_elements(p_insumos) x WHERE coalesce((x->>'quantidade')::numeric,0) > 0 LOOP
    IF NOT EXISTS (SELECT 1 FROM estoque_itens WHERE id = r.item_id AND clinica_id = a.clinica_id) THEN RAISE EXCEPTION 'Item inválido'; END IF;
    v_itens := v_itens + 1;
    IF r.lote_id IS NOT NULL THEN
      SELECT * INTO v_lote FROM estoque_lotes WHERE id = r.lote_id AND item_id = r.item_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Lote não pertence ao item'; END IF;
      IF v_lote.validade IS NOT NULL AND v_lote.validade < current_date THEN RAISE EXCEPTION 'Lote % está vencido', coalesce(v_lote.numero_lote,'s/n'); END IF;
      PERFORM _estoque_mov(v_lote.id, 'saida_uso', -r.qtd, 'Uso em atendimento', a.id, a.procedimento_id, a.paciente_id, a.profissional_id);
      v_custo := v_custo + r.qtd * v_lote.custo_unitario;
      IF a.paciente_id IS NOT NULL THEN
        v_dente := r.dente; v_implante := NULL;
        IF v_dente IS NOT NULL THEN
          SELECT id INTO v_implante FROM implantes WHERE paciente_id = a.paciente_id AND dente = v_dente AND ativo AND estoque_lote_id IS NULL ORDER BY created_at DESC LIMIT 1;
          IF v_implante IS NOT NULL THEN
            UPDATE implantes SET estoque_lote_id = v_lote.id, lote = coalesce(lote, v_lote.numero_lote) WHERE id = v_implante;
          END IF;
        END IF;
        INSERT INTO paciente_lotes_aplicados (clinica_id, paciente_id, lote_id, item_id, procedimento_id, agendamento_id, profissional_id, implante_id, quantidade, dente)
          VALUES (a.clinica_id, a.paciente_id, v_lote.id, r.item_id, a.procedimento_id, a.id, a.profissional_id, v_implante, r.qtd, v_dente);
      END IF;
    ELSE
      IF v_exige THEN RAISE EXCEPTION 'Este procedimento exige informar o lote aplicado de cada insumo'; END IF;
      v_rest := r.qtd;
      FOR l IN SELECT * FROM estoque_lotes
               WHERE item_id = r.item_id AND quantidade > 0 AND (validade IS NULL OR validade >= current_date)
                 AND (a.unidade_id IS NULL OR unidade_id = a.unidade_id OR unidade_id IS NULL)
               ORDER BY validade NULLS LAST, entrada_em, created_at FOR UPDATE LOOP
        EXIT WHEN v_rest <= 0;
        v_tirar := least(v_rest, l.quantidade);
        PERFORM _estoque_mov(l.id, 'saida_uso', -v_tirar, 'Uso em atendimento (FEFO)', a.id, a.procedimento_id, a.paciente_id, a.profissional_id);
        v_custo := v_custo + v_tirar * l.custo_unitario;
        v_rest := v_rest - v_tirar;
      END LOOP;
      IF v_rest > 0 THEN
        RAISE EXCEPTION 'Saldo insuficiente (válido) de "%": faltam %', (SELECT nome FROM estoque_itens WHERE id = r.item_id), v_rest;
      END IF;
    END IF;
  END LOOP;
  INSERT INTO estoque_baixas_atendimento (agendamento_id, clinica_id, custo_total) VALUES (a.id, a.clinica_id, round(v_custo,2));
  RETURN jsonb_build_object('ja_baixado', false, 'itens', v_itens, 'custo', round(v_custo,2));
END $$;

-- Atendimento completo: status + cobrança + baixa de insumos numa única transação
CREATE OR REPLACE FUNCTION public.finalizar_atendimento(p_agendamento uuid, p_cobrar boolean DEFAULT true, p_insumos jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v1 jsonb; v2 jsonb;
BEGIN
  v1 := marcar_atendido(p_agendamento, p_cobrar);
  v2 := baixar_insumos_atendimento(p_agendamento, p_insumos);
  RETURN v1 || jsonb_build_object('estoque', v2);
END $$;

-- ===================== 4. COMPRAS =====================
CREATE TABLE public.pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  unidade_id uuid REFERENCES public.unidades(id),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id),
  numero serial,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviado','recebido_parcial','recebido','cancelado')),
  previsao_entrega date,
  observacao text,
  cancelado_motivo text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.pedido_compra_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  pedido_id uuid NOT NULL REFERENCES public.pedidos_compra(id),
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id),
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  quantidade_recebida numeric(12,3) NOT NULL DEFAULT 0,
  custo_unitario numeric(12,4) NOT NULL DEFAULT 0 CHECK (custo_unitario >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.pedido_compra_itens.quantidade IS 'Na unidade de compra do item (convertida por fator_conversao ao receber)';
GRANT SELECT ON public.pedidos_compra, public.pedido_compra_itens TO authenticated;
GRANT ALL ON public.pedidos_compra, public.pedido_compra_itens TO service_role;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_compra_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_select" ON public.pedidos_compra FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "pci_select" ON public.pedido_compra_itens FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.pedidos_compra FOR EACH ROW EXECUTE FUNCTION public.auditar();
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.pedido_compra_itens FOR EACH ROW EXECUTE FUNCTION public.auditar();
ALTER TABLE public.financeiro_pagamentos ADD COLUMN IF NOT EXISTS fornecedor_id uuid REFERENCES public.fornecedores(id),
  ADD COLUMN IF NOT EXISTS pedido_compra_id uuid REFERENCES public.pedidos_compra(id);

-- p_itens: [{"item_id","quantidade","custo_unitario"}]
CREATE OR REPLACE FUNCTION public.criar_pedido_compra(p_fornecedor uuid, p_unidade uuid, p_previsao date, p_observacao text, p_itens jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_id uuid; v_n int;
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para compras'; END IF;
  IF NOT EXISTS (SELECT 1 FROM fornecedores WHERE id = p_fornecedor AND clinica_id = v_clinica) THEN RAISE EXCEPTION 'Fornecedor inválido'; END IF;
  SELECT count(*) INTO v_n FROM jsonb_array_elements(coalesce(p_itens,'[]')) x WHERE coalesce((x->>'quantidade')::numeric,0) > 0;
  IF v_n = 0 THEN RAISE EXCEPTION 'Inclua ao menos um item'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_itens) x LEFT JOIN estoque_itens i ON i.id = (x->>'item_id')::uuid AND i.clinica_id = v_clinica WHERE i.id IS NULL) THEN
    RAISE EXCEPTION 'Item inválido no pedido';
  END IF;
  INSERT INTO pedidos_compra (clinica_id, unidade_id, fornecedor_id, previsao_entrega, observacao)
    VALUES (v_clinica, p_unidade, p_fornecedor, p_previsao, nullif(trim(p_observacao),'')) RETURNING id INTO v_id;
  INSERT INTO pedido_compra_itens (clinica_id, pedido_id, item_id, quantidade, custo_unitario)
    SELECT v_clinica, v_id, (x->>'item_id')::uuid, round((x->>'quantidade')::numeric,3), round(coalesce((x->>'custo_unitario')::numeric,0),4)
    FROM jsonb_array_elements(p_itens) x WHERE coalesce((x->>'quantidade')::numeric,0) > 0;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.atualizar_status_pedido(p_pedido uuid, p_status text, p_motivo text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p pedidos_compra%ROWTYPE;
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para compras'; END IF;
  SELECT * INTO p FROM pedidos_compra WHERE id = p_pedido FOR UPDATE;
  IF NOT FOUND OR p.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p_status = 'enviado' AND p.status = 'rascunho' THEN
    UPDATE pedidos_compra SET status = 'enviado' WHERE id = p.id;
  ELSIF p_status = 'cancelado' AND p.status IN ('rascunho','enviado') THEN
    IF length(trim(coalesce(p_motivo,''))) < 5 THEN RAISE EXCEPTION 'Informe o motivo do cancelamento'; END IF;
    UPDATE pedidos_compra SET status = 'cancelado', cancelado_motivo = trim(p_motivo) WHERE id = p.id;
  ELSE RAISE EXCEPTION 'Mudança de status não permitida'; END IF;
END $$;

-- p_itens: [{"pedido_item_id","quantidade","numero_lote","validade","custo_unitario"}] (quantidade/custo na unidade de compra)
CREATE OR REPLACE FUNCTION public.receber_pedido(p_pedido uuid, p_itens jsonb, p_nota text, p_vencimento date DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE p pedidos_compra%ROWTYPE; r record; pi pedido_compra_itens%ROWTYPE; i estoque_itens%ROWTYPE; v_total numeric := 0;
  v_pag uuid; v_conta uuid; v_forn fornecedores%ROWTYPE; v_n int := 0;
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para receber pedidos'; END IF;
  SELECT * INTO p FROM pedidos_compra WHERE id = p_pedido FOR UPDATE;
  IF NOT FOUND OR p.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p.status NOT IN ('enviado','recebido_parcial','rascunho') THEN RAISE EXCEPTION 'Pedido não pode ser recebido no status atual'; END IF;
  SELECT * INTO v_forn FROM fornecedores WHERE id = p.fornecedor_id;
  FOR r IN SELECT (x->>'pedido_item_id')::uuid AS pid, round((x->>'quantidade')::numeric,3) AS qtd, x->>'numero_lote' AS lote,
                  nullif(x->>'validade','')::date AS validade, (x->>'custo_unitario')::numeric AS custo
           FROM jsonb_array_elements(coalesce(p_itens,'[]')) x WHERE coalesce((x->>'quantidade')::numeric,0) > 0 LOOP
    SELECT * INTO pi FROM pedido_compra_itens WHERE id = r.pid AND pedido_id = p.id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Item não pertence ao pedido'; END IF;
    IF pi.quantidade_recebida + r.qtd > pi.quantidade THEN RAISE EXCEPTION 'Quantidade recebida maior que a pedida'; END IF;
    SELECT * INTO i FROM estoque_itens WHERE id = pi.item_id;
    PERFORM _estoque_entrada(i.id, p.unidade_id, r.lote, r.validade, round(r.qtd * i.fator_conversao,3),
      round(coalesce(r.custo, pi.custo_unitario) / i.fator_conversao, 4), p.fornecedor_id, p_nota, 'entrada', 'Recebimento do pedido #' || p.numero, p.id);
    UPDATE pedido_compra_itens SET quantidade_recebida = quantidade_recebida + r.qtd WHERE id = pi.id;
    v_total := v_total + r.qtd * coalesce(r.custo, pi.custo_unitario);
    v_n := v_n + 1;
  END LOOP;
  IF v_n = 0 THEN RAISE EXCEPTION 'Informe ao menos um item recebido'; END IF;
  IF v_total > 0 THEN
    SELECT id INTO v_conta FROM plano_contas WHERE clinica_id = p.clinica_id AND tipo = 'despesa' ORDER BY (nome = 'Materiais e insumos') DESC, created_at LIMIT 1;
    INSERT INTO financeiro_pagamentos (clinica_id, unidade_id, conta_id, fornecedor, fornecedor_id, pedido_compra_id, descricao, valor, vencimento)
      VALUES (p.clinica_id, p.unidade_id, v_conta, coalesce(v_forn.nome_fantasia, v_forn.razao_social), p.fornecedor_id, p.id,
        'Compra #' || p.numero || coalesce(' — NF ' || nullif(trim(p_nota),''), ''), round(v_total,2), coalesce(p_vencimento, current_date + 30))
      RETURNING id INTO v_pag;
  END IF;
  UPDATE pedidos_compra SET status = CASE WHEN EXISTS (SELECT 1 FROM pedido_compra_itens WHERE pedido_id = p.id AND quantidade_recebida < quantidade)
    THEN 'recebido_parcial' ELSE 'recebido' END WHERE id = p.id;
  RETURN v_pag;
END $$;

CREATE OR REPLACE FUNCTION public.sugestao_compra()
RETURNS TABLE(item_id uuid, nome text, unidade_medida text, saldo numeric, estoque_minimo numeric, consumo_diario numeric,
  prazo_dias integer, fornecedor_id uuid, fornecedor text, sugerido numeric, custo_medio numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  WITH c AS (
    SELECT m.item_id, sum(-m.delta) / 90.0 AS diario FROM estoque_movimentacoes m
    WHERE m.clinica_id = current_clinica_id() AND m.tipo_mov IN ('saida_uso','perda','vencido') AND m.created_at > now() - interval '90 days'
    GROUP BY m.item_id
  ), s AS (
    SELECT i.*, coalesce((SELECT sum(quantidade) FROM estoque_lotes l WHERE l.item_id = i.id AND (l.validade IS NULL OR l.validade >= current_date)),0) AS saldo
    FROM estoque_itens i WHERE i.clinica_id = current_clinica_id() AND i.ativo
  )
  SELECT s.id, s.nome, s.unidade_medida, s.saldo, s.estoque_minimo, round(coalesce(c.diario,0),3), coalesce(f.prazo_entrega_dias,7),
         s.fornecedor_id, coalesce(f.nome_fantasia, f.razao_social),
         greatest(ceil(s.estoque_minimo + coalesce(c.diario,0) * (coalesce(f.prazo_entrega_dias,7) + 30) - s.saldo), 0),
         s.custo_medio
  FROM s LEFT JOIN c ON c.item_id = s.id LEFT JOIN fornecedores f ON f.id = s.fornecedor_id
  WHERE tem_papel('owner','admin','estoque','recepcao','auxiliar')
    AND (s.saldo < s.estoque_minimo OR s.saldo < coalesce(c.diario,0) * (coalesce(f.prazo_entrega_dias,7) + 7))
  ORDER BY s.nome
$$;

-- ===================== 5. INVENTÁRIO =====================
CREATE TABLE public.inventarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  unidade_id uuid REFERENCES public.unidades(id),
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','finalizado','cancelado')),
  motivo text,
  aberto_por uuid DEFAULT auth.uid(),
  finalizado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.inventario_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  inventario_id uuid NOT NULL REFERENCES public.inventarios(id),
  lote_id uuid NOT NULL REFERENCES public.estoque_lotes(id),
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id),
  quantidade_sistema numeric(12,3) NOT NULL,
  quantidade_contada numeric(12,3),
  diferenca numeric(12,3) GENERATED ALWAYS AS (coalesce(quantidade_contada, quantidade_sistema) - quantidade_sistema) STORED,
  UNIQUE (inventario_id, lote_id)
);
GRANT SELECT ON public.inventarios, public.inventario_itens TO authenticated;
GRANT ALL ON public.inventarios, public.inventario_itens TO service_role;
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select" ON public.inventarios FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "invi_select" ON public.inventario_itens FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.inventarios FOR EACH ROW EXECUTE FUNCTION public.auditar();
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.inventario_itens FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE OR REPLACE FUNCTION public.abrir_inventario(p_unidade uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_id uuid;
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para inventário'; END IF;
  IF EXISTS (SELECT 1 FROM inventarios WHERE clinica_id = v_clinica AND status = 'aberto' AND unidade_id IS NOT DISTINCT FROM p_unidade) THEN
    RAISE EXCEPTION 'Já existe um inventário aberto para esta unidade';
  END IF;
  INSERT INTO inventarios (clinica_id, unidade_id) VALUES (v_clinica, p_unidade) RETURNING id INTO v_id;
  INSERT INTO inventario_itens (clinica_id, inventario_id, lote_id, item_id, quantidade_sistema)
    SELECT v_clinica, v_id, l.id, l.item_id, l.quantidade FROM estoque_lotes l
    WHERE l.clinica_id = v_clinica AND l.quantidade > 0 AND (p_unidade IS NULL OR l.unidade_id = p_unidade);
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_contagem(p_inventario_item uuid, p_quantidade numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para inventário'; END IF;
  IF p_quantidade IS NOT NULL AND p_quantidade < 0 THEN RAISE EXCEPTION 'Contagem não pode ser negativa'; END IF;
  UPDATE inventario_itens ii SET quantidade_contada = round(p_quantidade,3)
    FROM inventarios v WHERE ii.id = p_inventario_item AND v.id = ii.inventario_id AND v.status = 'aberto' AND v.clinica_id = current_clinica_id();
  IF NOT FOUND THEN RAISE EXCEPTION 'Inventário não está aberto'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.finalizar_inventario(p_inventario uuid, p_motivo text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v inventarios%ROWTYPE; r record; v_n int := 0; v_atual numeric;
BEGIN
  IF NOT tem_papel('owner','admin','estoque') THEN RAISE EXCEPTION 'Sem permissão para inventário'; END IF;
  SELECT * INTO v FROM inventarios WHERE id = p_inventario FOR UPDATE;
  IF NOT FOUND OR v.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Inventário não encontrado'; END IF;
  IF v.status <> 'aberto' THEN RAISE EXCEPTION 'Inventário já encerrado'; END IF;
  IF length(trim(coalesce(p_motivo,''))) < 3 THEN RAISE EXCEPTION 'Informe o motivo dos ajustes'; END IF;
  FOR r IN SELECT * FROM inventario_itens WHERE inventario_id = v.id AND quantidade_contada IS NOT NULL LOOP
    SELECT quantidade INTO v_atual FROM estoque_lotes WHERE id = r.lote_id;
    IF r.quantidade_contada <> v_atual THEN
      PERFORM _estoque_mov(r.lote_id, 'ajuste', r.quantidade_contada - v_atual, 'Inventário: ' || trim(p_motivo), NULL, NULL, NULL, NULL, v.id);
      v_n := v_n + 1;
    END IF;
  END LOOP;
  UPDATE inventarios SET status = 'finalizado', motivo = trim(p_motivo), finalizado_em = now() WHERE id = v.id;
  RETURN v_n;
END $$;

-- ===================== 6. RELATÓRIO DE CUSTO =====================
CREATE OR REPLACE FUNCTION public.relatorio_custo_procedimentos(p_inicio date, p_fim date)
RETURNS TABLE(procedimento_id uuid, procedimento text, atendimentos bigint, custo_total numeric, custo_medio numeric, custo_estimado numeric, valor numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.id, p.nome, count(b.agendamento_id), coalesce(sum(b.custo_total),0)::numeric(12,2),
         round(coalesce(avg(b.custo_total),0),2)::numeric(12,2), p.custo_estimado, p.valor
  FROM estoque_baixas_atendimento b JOIN agendamentos a ON a.id = b.agendamento_id JOIN procedimentos p ON p.id = a.procedimento_id
  WHERE b.clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','financeiro')
    AND a.inicio::date BETWEEN p_inicio AND p_fim
  GROUP BY p.id ORDER BY 4 DESC
$$;

REVOKE EXECUTE ON FUNCTION public.registrar_entrada_estoque(uuid,uuid,text,date,numeric,numeric,uuid,text,text), public.registrar_movimento_estoque(uuid,text,numeric,text),
  public.transferir_estoque(uuid,uuid,numeric,text), public.baixar_insumos_atendimento(uuid,jsonb), public.finalizar_atendimento(uuid,boolean,jsonb),
  public.criar_pedido_compra(uuid,uuid,date,text,jsonb), public.atualizar_status_pedido(uuid,text,text), public.receber_pedido(uuid,jsonb,text,date),
  public.sugestao_compra(), public.abrir_inventario(uuid), public.registrar_contagem(uuid,numeric), public.finalizar_inventario(uuid,text),
  public.relatorio_custo_procedimentos(date,date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_entrada_estoque(uuid,uuid,text,date,numeric,numeric,uuid,text,text), public.registrar_movimento_estoque(uuid,text,numeric,text),
  public.transferir_estoque(uuid,uuid,numeric,text), public.baixar_insumos_atendimento(uuid,jsonb), public.finalizar_atendimento(uuid,boolean,jsonb),
  public.criar_pedido_compra(uuid,uuid,date,text,jsonb), public.atualizar_status_pedido(uuid,text,text), public.receber_pedido(uuid,jsonb,text,date),
  public.sugestao_compra(), public.abrir_inventario(uuid), public.registrar_contagem(uuid,numeric), public.finalizar_inventario(uuid,text),
  public.relatorio_custo_procedimentos(date,date) TO authenticated;