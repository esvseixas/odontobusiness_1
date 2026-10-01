-- 1. papéis por clínica
UPDATE public.user_roles ur SET clinica_id = p.clinica_id
  FROM public.profiles p WHERE p.id = ur.user_id AND ur.clinica_id IS NULL;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_clinica_role_key UNIQUE (user_id, clinica_id, role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role, _clinica uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role AND clinica_id = _clinica)
$$;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, _role, public.current_clinica_id())
$$;
CREATE OR REPLACE FUNCTION public.tem_papel(VARIADIC _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND clinica_id = public.current_clinica_id() AND role = ANY(_roles))
$$;

-- 2. bloqueio de troca de clínica no perfil
CREATE OR REPLACE FUNCTION public.proteger_vinculo_perfil()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (NEW.clinica_id IS DISTINCT FROM OLD.clinica_id OR NEW.unidade_id IS DISTINCT FROM OLD.unidade_id)
     AND auth.uid() IS NOT NULL
     AND coalesce(current_setting('app.vinculo', true), '') <> 'on' THEN
    RAISE EXCEPTION 'Vínculo com clínica só pode ser alterado por convite ou onboarding';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN RAISE EXCEPTION 'id imutável'; END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_proteger_vinculo_perfil ON public.profiles;
CREATE TRIGGER trg_proteger_vinculo_perfil BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.proteger_vinculo_perfil();

-- 3. colunas de cancelamento
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS cancelado_motivo text, ADD COLUMN IF NOT EXISTS cancelado_em timestamptz;
ALTER TABLE public.financeiro_recebimentos ADD COLUMN IF NOT EXISTS cancelado_motivo text, ADD COLUMN IF NOT EXISTS cancelado_em timestamptz;
ALTER TABLE public.financeiro_pagamentos ADD COLUMN IF NOT EXISTS cancelado_motivo text, ADD COLUMN IF NOT EXISTS cancelado_em timestamptz;

-- 4. convites
CREATE TABLE IF NOT EXISTS public.convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id),
  email text NOT NULL,
  papel app_role NOT NULL,
  token text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  expira_em timestamptz NOT NULL DEFAULT now() + interval '7 days',
  aceito_em timestamptz,
  aceito_por uuid,
  revogado_em timestamptz,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

-- 5. reset de políticas
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT tablename, policyname FROM pg_policies WHERE schemaname='public' AND tablename IN
   ('clinicas','profiles','user_roles','unidades','procedimentos','convenios','profissionais','pacientes','agendamentos',
    'orcamentos','orcamento_itens','odontograma_marcacoes','evolucoes_clinicas','documentos_emitidos','plano_contas',
    'financeiro_recebimentos','financeiro_pagamentos','estoque_itens','estoque_lotes','estoque_movimentacoes','auditoria_logs','convites')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename); END LOOP;
END $$;
REVOKE INSERT, UPDATE, DELETE ON public.auditoria_logs FROM authenticated, anon;

CREATE POLICY "clinica select" ON public.clinicas FOR SELECT TO authenticated USING (id = current_clinica_id());
CREATE POLICY "clinica update gestao" ON public.clinicas FOR UPDATE TO authenticated
  USING (id = current_clinica_id() AND tem_papel('owner','admin')) WITH CHECK (id = current_clinica_id());

CREATE POLICY "perfil select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR clinica_id = current_clinica_id());
CREATE POLICY "perfil insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND clinica_id IS NULL AND unidade_id IS NULL);
CREATE POLICY "perfil update proprio" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "papeis select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (clinica_id = current_clinica_id() AND tem_papel('owner','admin')));
CREATE POLICY "papeis insert gestao" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin') AND role <> 'owner'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.clinica_id = current_clinica_id()));
CREATE POLICY "papeis delete gestao" ON public.user_roles FOR DELETE TO authenticated
  USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin') AND role <> 'owner' AND user_id <> auth.uid());

-- cadastros (gestão)
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['unidades','procedimentos','convenios','profissionais'] LOOP
    EXECUTE format('CREATE POLICY "tenant select" ON public.%I FOR SELECT TO authenticated USING (clinica_id = current_clinica_id())', t);
    EXECUTE format('CREATE POLICY "gestao insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin''))', t);
    EXECUTE format('CREATE POLICY "gestao update" ON public.%I FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin'')) WITH CHECK (clinica_id = current_clinica_id())', t);
    EXECUTE format('CREATE POLICY "gestao delete" ON public.%I FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin''))', t);
  END LOOP;
END $$;

-- pacientes: toda a equipe cadastra; sem exclusão
CREATE POLICY "tenant select" ON public.pacientes FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "tenant insert" ON public.pacientes FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "tenant update" ON public.pacientes FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id()) WITH CHECK (clinica_id = current_clinica_id());

-- agenda
CREATE POLICY "tenant select" ON public.agendamentos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "tenant insert" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "tenant update" ON public.agendamentos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id()) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "gestao delete" ON public.agendamentos FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','recepcao'));

-- orçamentos
CREATE POLICY "tenant select" ON public.orcamentos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.orcamentos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','recepcao'));
CREATE POLICY "clinico update" ON public.orcamentos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','recepcao')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "pendente delete" ON public.orcamentos FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND status = 'pendente' AND tem_papel('owner','admin','dentista','esteticista'));
CREATE POLICY "tenant select" ON public.orcamento_itens FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.orcamento_itens FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','recepcao'));
CREATE POLICY "clinico update" ON public.orcamento_itens FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','recepcao')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "pendente delete" ON public.orcamento_itens FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista')
  AND EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.status = 'pendente'));

-- clínico (sem exclusão)
CREATE POLICY "tenant select" ON public.odontograma_marcacoes FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.odontograma_marcacoes FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar'));
CREATE POLICY "clinico update" ON public.odontograma_marcacoes FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "clinico select" ON public.evolucoes_clinicas FOR SELECT TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar'));
CREATE POLICY "clinico insert" ON public.evolucoes_clinicas FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar'));
CREATE POLICY "tenant select" ON public.documentos_emitidos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.documentos_emitidos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista'));

-- financeiro
CREATE POLICY "tenant select" ON public.plano_contas FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "fin insert" ON public.plano_contas FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin update" ON public.plano_contas FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "fin delete" ON public.plano_contas FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin select" ON public.financeiro_recebimentos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro','recepcao'));
CREATE POLICY "fin insert" ON public.financeiro_recebimentos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin update" ON public.financeiro_recebimentos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "fin delete nao pago" ON public.financeiro_recebimentos FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND status <> 'pago' AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin select" ON public.financeiro_pagamentos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin insert" ON public.financeiro_pagamentos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro'));
CREATE POLICY "fin update" ON public.financeiro_pagamentos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','financeiro')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "fin delete nao pago" ON public.financeiro_pagamentos FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND status <> 'pago' AND tem_papel('owner','admin','financeiro'));

-- estoque
CREATE POLICY "tenant select" ON public.estoque_itens FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "estoque insert" ON public.estoque_itens FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','auxiliar'));
CREATE POLICY "estoque update" ON public.estoque_itens FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','auxiliar')) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "estoque delete" ON public.estoque_itens FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque'));
CREATE POLICY "tenant select" ON public.estoque_lotes FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "estoque insert" ON public.estoque_lotes FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','auxiliar')
  AND EXISTS (SELECT 1 FROM public.estoque_itens i WHERE i.id = item_id AND i.clinica_id = current_clinica_id()));
CREATE POLICY "estoque update" ON public.estoque_lotes FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','auxiliar'))
  WITH CHECK (clinica_id = current_clinica_id() AND EXISTS (SELECT 1 FROM public.estoque_itens i WHERE i.id = item_id AND i.clinica_id = current_clinica_id()));
CREATE POLICY "estoque delete" ON public.estoque_lotes FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque'));
CREATE POLICY "tenant select" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "estoque insert" ON public.estoque_movimentacoes FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','estoque','auxiliar'));

CREATE POLICY "gestao select" ON public.auditoria_logs FOR SELECT TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin'));

CREATE POLICY "gestao select" ON public.convites FOR SELECT TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin'));
CREATE POLICY "gestao insert" ON public.convites FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin') AND papel <> 'owner');
CREATE POLICY "gestao update" ON public.convites FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin')) WITH CHECK (clinica_id = current_clinica_id());

-- 6. auditoria por trigger
CREATE OR REPLACE FUNCTION public.auditar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old jsonb; v_new jsonb; v_clinica uuid; v_id uuid; v_nome text; v_acao text;
BEGIN
  v_old := CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END;
  v_new := CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END;
  v_old := v_old - 'assinatura_base64'; v_new := v_new - 'assinatura_base64';
  IF TG_TABLE_NAME = 'clinicas' THEN v_clinica := coalesce(v_new->>'id', v_old->>'id')::uuid;
  ELSE v_clinica := coalesce(v_new->>'clinica_id', v_old->>'clinica_id')::uuid; END IF;
  IF v_clinica IS NULL THEN RETURN coalesce(NEW, OLD); END IF;
  v_id := coalesce(v_new->>'id', v_old->>'id')::uuid;
  SELECT nome INTO v_nome FROM public.profiles WHERE id = auth.uid();
  v_acao := CASE TG_OP WHEN 'INSERT' THEN 'criou' WHEN 'UPDATE' THEN 'alterou' ELSE 'excluiu' END || ' registro em ' || TG_TABLE_NAME;
  INSERT INTO public.auditoria_logs (clinica_id, usuario_id, usuario_nome, acao, tabela, registro_id, detalhes)
  VALUES (v_clinica, auth.uid(), v_nome, v_acao, TG_TABLE_NAME, v_id,
          jsonb_build_object('operacao', TG_OP, 'antes', v_old, 'depois', v_new));
  RETURN coalesce(NEW, OLD);
END $$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['clinicas','profiles','user_roles','convites','unidades','procedimentos','convenios','profissionais',
    'pacientes','agendamentos','orcamentos','orcamento_itens','odontograma_marcacoes','evolucoes_clinicas','documentos_emitidos',
    'plano_contas','financeiro_recebimentos','financeiro_pagamentos','estoque_itens','estoque_lotes','estoque_movimentacoes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_auditar ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.auditar()', t);
  END LOOP;
END $$;

-- 7. onboarding transacional
CREATE OR REPLACE FUNCTION public.criar_clinica(p_nome text, p_cnpj text DEFAULT NULL, p_telefone text DEFAULT NULL,
  p_endereco text DEFAULT NULL, p_regime text DEFAULT NULL, p_unidade text DEFAULT 'Unidade principal',
  p_profissional text DEFAULT NULL, p_cro text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_clinica uuid; v_unidade uuid; v_email text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  IF coalesce(trim(p_nome),'') = '' THEN RAISE EXCEPTION 'Informe o nome da clínica'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_uid AND clinica_id IS NOT NULL) THEN RAISE EXCEPTION 'Usuário já vinculado a uma clínica'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  PERFORM set_config('app.vinculo','on',true);
  INSERT INTO clinicas (nome, cnpj, telefone, endereco, regime_tributario, email)
    VALUES (p_nome, nullif(p_cnpj,''), nullif(p_telefone,''), nullif(p_endereco,''), p_regime, v_email) RETURNING id INTO v_clinica;
  INSERT INTO unidades (clinica_id, nome) VALUES (v_clinica, coalesce(nullif(p_unidade,''),'Unidade principal')) RETURNING id INTO v_unidade;
  INSERT INTO profiles (id, nome, email, clinica_id, unidade_id) VALUES (v_uid, coalesce(v_email,''), v_email, v_clinica, v_unidade)
    ON CONFLICT (id) DO UPDATE SET clinica_id = EXCLUDED.clinica_id, unidade_id = EXCLUDED.unidade_id;
  INSERT INTO user_roles (user_id, clinica_id, role) VALUES (v_uid, v_clinica, 'owner');
  INSERT INTO procedimentos (clinica_id, codigo, nome, categoria, valor, duracao_minutos) VALUES
    (v_clinica,'81000103','Consulta odontológica inicial','Clínica geral',150,30),
    (v_clinica,'81000210','Profilaxia / limpeza','Prevenção',180,40),
    (v_clinica,'85100048','Restauração em resina composta','Dentística',250,50),
    (v_clinica,'84000031','Tratamento endodôntico','Endodontia',900,90),
    (v_clinica,'82000355','Raspagem periodontal','Periodontia',320,60),
    (v_clinica,'83000210','Exodontia simples','Cirurgia',300,45),
    (v_clinica,'87000212','Coroa em cerâmica','Prótese',1600,60),
    (v_clinica,'86000036','Manutenção ortodôntica','Ortodontia',200,30),
    (v_clinica,'85500062','Clareamento dental','Estética',750,60);
  INSERT INTO plano_contas (clinica_id, nome, tipo) VALUES
    (v_clinica,'Receita de procedimentos','receita'),(v_clinica,'Receita de convênios','receita'),
    (v_clinica,'Aluguel','despesa'),(v_clinica,'Folha de pagamento','despesa'),(v_clinica,'Materiais e insumos','despesa'),
    (v_clinica,'Laboratório de prótese','despesa'),(v_clinica,'Marketing','despesa'),(v_clinica,'Impostos e taxas','despesa');
  IF coalesce(trim(p_profissional),'') <> '' THEN
    INSERT INTO profissionais (clinica_id, unidade_id, user_id, nome, cro, comissao_percentual)
      VALUES (v_clinica, v_unidade, v_uid, p_profissional, nullif(p_cro,''), 0);
  END IF;
  RETURN v_clinica;
END $$;

-- 8. convites: consulta pública e aceite
CREATE OR REPLACE FUNCTION public.ver_convite(p_token text)
RETURNS TABLE (clinica_nome text, email text, papel app_role, expira_em timestamptz, valido boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.nome, v.email, v.papel, v.expira_em,
         (v.aceito_em IS NULL AND v.revogado_em IS NULL AND v.expira_em > now())
  FROM convites v JOIN clinicas c ON c.id = v.clinica_id WHERE v.token = p_token
$$;
CREATE OR REPLACE FUNCTION public.aceitar_convite(p_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v convites%ROWTYPE; v_email text; v_atual uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
  SELECT * INTO v FROM convites WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Convite não encontrado'; END IF;
  IF v.aceito_em IS NOT NULL OR v.revogado_em IS NOT NULL OR v.expira_em <= now() THEN RAISE EXCEPTION 'Convite inválido ou expirado'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF lower(v_email) <> lower(v.email) THEN RAISE EXCEPTION 'Este convite foi enviado para outro e-mail'; END IF;
  SELECT clinica_id INTO v_atual FROM profiles WHERE id = v_uid;
  IF v_atual IS NOT NULL AND v_atual <> v.clinica_id THEN RAISE EXCEPTION 'Usuário já vinculado a outra clínica'; END IF;
  PERFORM set_config('app.vinculo','on',true);
  INSERT INTO profiles (id, nome, email, clinica_id, unidade_id) VALUES (v_uid, coalesce(v_email,''), v_email, v.clinica_id, v.unidade_id)
    ON CONFLICT (id) DO UPDATE SET clinica_id = EXCLUDED.clinica_id, unidade_id = coalesce(EXCLUDED.unidade_id, profiles.unidade_id);
  INSERT INTO user_roles (user_id, clinica_id, role) VALUES (v_uid, v.clinica_id, v.papel) ON CONFLICT DO NOTHING;
  UPDATE convites SET aceito_em = now(), aceito_por = v_uid WHERE id = v.id;
  RETURN v.clinica_id;
END $$;

-- 9. aprovação de orçamento
CREATE OR REPLACE FUNCTION public.aprovar_orcamento(p_orcamento uuid, p_parcelas int, p_dia_vencimento int,
  p_forma_pagamento text DEFAULT 'A definir', p_entrada numeric DEFAULT 0)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o orcamentos%ROWTYPE; v_total numeric(12,2); v_resto numeric(12,2); v_parcela numeric(12,2);
  v_acum numeric(12,2) := 0; v_n int; v_total_parc int; v_k int; v_mes date; v_ult int; v_conta uuid; v_valor numeric(12,2);
BEGIN
  SELECT * INTO o FROM orcamentos WHERE id = p_orcamento FOR UPDATE;
  IF NOT FOUND OR o.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão para aprovar orçamentos'; END IF;
  IF o.status <> 'pendente' THEN RAISE EXCEPTION 'Somente orçamentos pendentes podem ser aprovados'; END IF;
  IF p_parcelas < 1 OR p_parcelas > 48 THEN RAISE EXCEPTION 'Número de parcelas inválido'; END IF;
  IF p_dia_vencimento < 1 OR p_dia_vencimento > 31 THEN RAISE EXCEPTION 'Dia de vencimento inválido'; END IF;
  v_total := round(o.valor_total - o.desconto, 2);
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
  UPDATE orcamentos SET status = 'aprovado' WHERE id = o.id;
END $$;

REVOKE EXECUTE ON FUNCTION public.criar_clinica(text,text,text,text,text,text,text,text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.aceitar_convite(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.aprovar_orcamento(uuid,int,int,text,numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.criar_clinica(text,text,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aceitar_convite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aprovar_orcamento(uuid,int,int,text,numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ver_convite(text) TO anon, authenticated;