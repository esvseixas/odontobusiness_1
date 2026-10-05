-- ========== BLOCO 5: especialidades ==========
CREATE TABLE public.periogramas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  dados jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacao text,
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.periogramas TO authenticated;
GRANT ALL ON public.periogramas TO service_role;
ALTER TABLE public.periogramas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perio_select" ON public.periogramas FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao'));
CREATE POLICY "perio_insert" ON public.periogramas FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.periogramas FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.implantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  dente text NOT NULL,
  marca text,
  modelo text,
  diametro numeric(5,2),
  comprimento numeric(5,2),
  lote text,
  instalado_em date,
  componentes text,
  observacao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.implantes TO authenticated;
GRANT ALL ON public.implantes TO service_role;
ALTER TABLE public.implantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impl_select" ON public.implantes FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao'));
CREATE POLICY "impl_insert" ON public.implantes FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','auxiliar'));
CREATE POLICY "impl_update" ON public.implantes FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','auxiliar'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.implantes FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.orto_contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  profissional_id uuid REFERENCES public.profissionais(id),
  aparelho text NOT NULL,
  inicio date NOT NULL DEFAULT current_date,
  meses integer NOT NULL CHECK (meses BETWEEN 1 AND 60),
  mensalidade numeric(12,2) NOT NULL CHECK (mensalidade >= 0),
  dia_vencimento integer NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','concluido','cancelado')),
  observacao text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orto_contratos TO authenticated;
GRANT ALL ON public.orto_contratos TO service_role;
ALTER TABLE public.orto_contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orto_select" ON public.orto_contratos FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','auxiliar','recepcao','financeiro'));
CREATE POLICY "orto_update" ON public.orto_contratos FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.orto_contratos FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.orto_manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  contrato_id uuid NOT NULL REFERENCES public.orto_contratos(id),
  realizada_em date NOT NULL DEFAULT current_date,
  descricao text NOT NULL,
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orto_manutencoes TO authenticated;
GRANT ALL ON public.orto_manutencoes TO service_role;
ALTER TABLE public.orto_manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manut_select" ON public.orto_manutencoes FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "manut_insert" ON public.orto_manutencoes FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','auxiliar'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.orto_manutencoes FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.laboratorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  nome text NOT NULL,
  telefone text,
  email text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.laboratorios TO authenticated;
GRANT ALL ON public.laboratorios TO service_role;
ALTER TABLE public.laboratorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lab_select" ON public.laboratorios FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "lab_insert" ON public.laboratorios FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','financeiro'));
CREATE POLICY "lab_update" ON public.laboratorios FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','financeiro'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.laboratorios FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE TABLE public.ordens_laboratorio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  laboratorio_id uuid NOT NULL REFERENCES public.laboratorios(id),
  trabalho text NOT NULL,
  dente text,
  cor text,
  enviado_em date NOT NULL DEFAULT current_date,
  prazo date,
  retornado_em date,
  custo numeric(12,2) NOT NULL DEFAULT 0 CHECK (custo >= 0),
  status text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado','retornado','instalado','cancelado')),
  pagamento_id uuid REFERENCES public.financeiro_pagamentos(id),
  observacao text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.ordens_laboratorio TO authenticated;
GRANT ALL ON public.ordens_laboratorio TO service_role;
ALTER TABLE public.ordens_laboratorio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ordem_select" ON public.ordens_laboratorio FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "ordem_update" ON public.ordens_laboratorio FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','auxiliar'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.ordens_laboratorio FOR EACH ROW EXECUTE FUNCTION public.auditar();

CREATE OR REPLACE FUNCTION public.criar_contrato_orto(p_paciente uuid, p_profissional uuid, p_aparelho text, p_inicio date, p_meses integer, p_mensalidade numeric, p_dia integer, p_observacao text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_id uuid; v_conta uuid; v_mes date; v_ult int;
BEGIN
  IF NOT tem_papel('owner','admin','dentista') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pacientes WHERE id = p_paciente AND clinica_id = v_clinica) THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
  IF coalesce(trim(p_aparelho),'') = '' THEN RAISE EXCEPTION 'Informe o aparelho'; END IF;
  INSERT INTO orto_contratos (clinica_id, paciente_id, profissional_id, aparelho, inicio, meses, mensalidade, dia_vencimento, observacao)
    VALUES (v_clinica, p_paciente, p_profissional, trim(p_aparelho), coalesce(p_inicio,current_date), p_meses, round(p_mensalidade,2), p_dia, p_observacao) RETURNING id INTO v_id;
  IF p_mensalidade > 0 THEN
    SELECT id INTO v_conta FROM plano_contas WHERE clinica_id = v_clinica AND tipo = 'receita' ORDER BY (nome = 'Receita de procedimentos') DESC, created_at LIMIT 1;
    FOR i IN 0..p_meses-1 LOOP
      v_mes := (date_trunc('month', coalesce(p_inicio,current_date)) + make_interval(months => i))::date;
      v_ult := extract(day FROM (v_mes + interval '1 month - 1 day'))::int;
      INSERT INTO financeiro_recebimentos (clinica_id, paciente_id, profissional_id, conta_id, descricao, parcela, total_parcelas, forma_pagamento, valor, vencimento)
      VALUES (v_clinica, p_paciente, p_profissional, v_conta, 'Ortodontia — mensalidade (' || trim(p_aparelho) || ')', i+1, p_meses, 'A definir', round(p_mensalidade,2), v_mes + (least(p_dia, v_ult) - 1));
    END LOOP;
  END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.criar_ordem_laboratorio(p_paciente uuid, p_laboratorio uuid, p_trabalho text, p_dente text, p_cor text, p_prazo date, p_custo numeric, p_observacao text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_id uuid; v_pag uuid; v_conta uuid; v_lab text;
BEGIN
  IF NOT tem_papel('owner','admin','dentista','auxiliar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pacientes WHERE id = p_paciente AND clinica_id = v_clinica) THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
  SELECT nome INTO v_lab FROM laboratorios WHERE id = p_laboratorio AND clinica_id = v_clinica;
  IF v_lab IS NULL THEN RAISE EXCEPTION 'Laboratório não encontrado'; END IF;
  IF coalesce(trim(p_trabalho),'') = '' THEN RAISE EXCEPTION 'Informe o trabalho'; END IF;
  IF coalesce(p_custo,0) > 0 THEN
    SELECT id INTO v_conta FROM plano_contas WHERE clinica_id = v_clinica AND tipo = 'despesa' ORDER BY (nome = 'Laboratório de prótese') DESC, created_at LIMIT 1;
    INSERT INTO financeiro_pagamentos (clinica_id, conta_id, fornecedor, descricao, valor, vencimento)
      VALUES (v_clinica, v_conta, v_lab, 'Laboratório — ' || trim(p_trabalho), round(p_custo,2), coalesce(p_prazo, current_date + 30)) RETURNING id INTO v_pag;
  END IF;
  INSERT INTO ordens_laboratorio (clinica_id, paciente_id, laboratorio_id, trabalho, dente, cor, prazo, custo, pagamento_id, observacao)
    VALUES (v_clinica, p_paciente, p_laboratorio, trim(p_trabalho), nullif(p_dente,''), nullif(p_cor,''), p_prazo, round(coalesce(p_custo,0),2), v_pag, p_observacao) RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- ========== BLOCO 6: documentos ==========
CREATE TABLE public.documento_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.documento_modelos TO authenticated;
GRANT ALL ON public.documento_modelos TO service_role;
ALTER TABLE public.documento_modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_select" ON public.documento_modelos FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "dm_insert" ON public.documento_modelos FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista'));
CREATE POLICY "dm_update" ON public.documento_modelos FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.documento_modelos FOR EACH ROW EXECUTE FUNCTION public.auditar();

ALTER TABLE public.documentos_emitidos
  ADD COLUMN IF NOT EXISTS modelo_id uuid REFERENCES public.documento_modelos(id),
  ADD COLUMN IF NOT EXISTS profissional_id uuid REFERENCES public.profissionais(id),
  ADD COLUMN IF NOT EXISTS assinatura_digital jsonb;
COMMENT ON COLUMN public.documentos_emitidos.assinatura_digital IS 'Reservado para assinatura ICP-Brasil (integração futura): provedor, certificado, hash, carimbo de tempo.';

CREATE OR REPLACE FUNCTION public.semear_modelos_documentos(p_clinica uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path TO 'public' AS $$
  INSERT INTO documento_modelos (clinica_id, tipo, titulo, conteudo)
  SELECT p_clinica, t, ti, c FROM (VALUES
    ('atestado','Atestado odontológico','Atesto, para os devidos fins, que {{paciente.nome}}, CPF {{paciente.cpf}}, esteve sob meus cuidados profissionais nesta data, {{data}}, das {{hora_inicio}} às {{hora_fim}}, necessitando de {{dias}} dia(s) de afastamento de suas atividades.'),
    ('declaracao','Declaração de comparecimento','Declaro, para os devidos fins, que {{paciente.nome}} compareceu a esta clínica em {{data}}, no período das {{hora_inicio}} às {{hora_fim}}, para atendimento odontológico.'),
    ('receituario','Receituário simples','Paciente: {{paciente.nome}}' || chr(10) || chr(10) || 'Uso interno/externo:' || chr(10) || '1. ' || chr(10) || chr(10) || '{{cidade}}, {{data}}'),
    ('receituario_controle','Receituário de controle especial','RECEITUÁRIO DE CONTROLE ESPECIAL — 1ª via farmácia / 2ª via paciente' || chr(10) || 'Paciente: {{paciente.nome}} · CPF {{paciente.cpf}}' || chr(10) || 'Endereço: {{paciente.endereco}}' || chr(10) || chr(10) || 'Prescrição:' || chr(10) || '1. ' || chr(10) || chr(10) || '{{cidade}}, {{data}}'),
    ('termo','Termo de consentimento livre e esclarecido','Eu, {{paciente.nome}}, CPF {{paciente.cpf}}, declaro que fui informado(a) pelo(a) Dr(a). {{profissional.nome}} (CRO {{profissional.cro}}) sobre o procedimento {{procedimento}}, seus riscos, benefícios e alternativas, e autorizo sua realização.'),
    ('orientacao','Orientações pós-operatórias','Orientações para {{paciente.nome}}:' || chr(10) || '- Não bochechar nas primeiras 24 horas.' || chr(10) || '- Aplicar compressa fria nas primeiras 48 horas.' || chr(10) || '- Alimentação fria e pastosa no primeiro dia.' || chr(10) || '- Tomar a medicação prescrita nos horários indicados.' || chr(10) || '- Em caso de sangramento persistente, contatar a clínica: {{clinica.telefone}}.'),
    ('orientacao','Orientações pré-operatórias','Orientações para {{paciente.nome}}:' || chr(10) || '- Alimente-se normalmente antes do procedimento.' || chr(10) || '- Informe uso de anticoagulantes ou outros medicamentos.' || chr(10) || '- Venha acompanhado(a) se for sedação.'),
    ('contrato','Contrato de prestação de serviços odontológicos','CONTRATANTE: {{paciente.nome}}, CPF {{paciente.cpf}}.' || chr(10) || 'CONTRATADA: {{clinica.nome}}, CNPJ {{clinica.cnpj}}.' || chr(10) || chr(10) || 'Objeto: prestação dos serviços odontológicos descritos no plano de tratamento aprovado, nos valores e condições nele previstos.' || chr(10) || chr(10) || '{{cidade}}, {{data}}')
  ) AS v(t, ti, c)
  WHERE NOT EXISTS (SELECT 1 FROM documento_modelos WHERE clinica_id = p_clinica);
$$;
REVOKE EXECUTE ON FUNCTION public.semear_modelos_documentos(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_semear_modelos()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN PERFORM semear_modelos_documentos(NEW.id); RETURN NEW; END $$;
CREATE TRIGGER trg_semear_modelos AFTER INSERT ON public.clinicas FOR EACH ROW EXECUTE FUNCTION public.trg_semear_modelos();
SELECT public.semear_modelos_documentos(id) FROM public.clinicas;

-- ========== AGENDA ==========
ALTER TABLE public.clinicas ADD COLUMN IF NOT EXISTS agendamento_online boolean NOT NULL DEFAULT false;

CREATE TABLE public.salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  unidade_id uuid REFERENCES public.unidades(id),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.horarios_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  profissional_id uuid NOT NULL REFERENCES public.profissionais(id),
  dia_semana smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  inicio time NOT NULL,
  fim time NOT NULL,
  intervalo_inicio time,
  intervalo_fim time,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fim > inicio),
  UNIQUE (profissional_id, dia_semana)
);
CREATE TABLE public.bloqueios_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  profissional_id uuid REFERENCES public.profissionais(id),
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  motivo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (fim > inicio)
);
CREATE TABLE public.lista_espera (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  profissional_id uuid REFERENCES public.profissionais(id),
  procedimento_id uuid REFERENCES public.procedimentos(id),
  preferencia text,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','agendado','desistiu')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas, public.horarios_profissional, public.bloqueios_agenda TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.lista_espera TO authenticated;
GRANT ALL ON public.salas, public.horarios_profissional, public.bloqueios_agenda, public.lista_espera TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_profissional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;
CREATE POLICY "salas_select" ON public.salas FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "salas_write" ON public.salas FOR ALL TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin')) WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin'));
CREATE POLICY "hor_select" ON public.horarios_profissional FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "hor_write" ON public.horarios_profissional FOR ALL TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin')) WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin'));
CREATE POLICY "bloq_select" ON public.bloqueios_agenda FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "bloq_write" ON public.bloqueios_agenda FOR ALL TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','recepcao')) WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','recepcao'));
CREATE POLICY "espera_select" ON public.lista_espera FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());
CREATE POLICY "espera_insert" ON public.lista_espera FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','recepcao','auxiliar'));
CREATE POLICY "espera_update" ON public.lista_espera FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id() AND public.tem_papel('owner','admin','dentista','esteticista','recepcao','auxiliar'));
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.salas FOR EACH ROW EXECUTE FUNCTION public.auditar();
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.horarios_profissional FOR EACH ROW EXECUTE FUNCTION public.auditar();
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.bloqueios_agenda FOR EACH ROW EXECUTE FUNCTION public.auditar();
CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.lista_espera FOR EACH ROW EXECUTE FUNCTION public.auditar();

ALTER TABLE public.agendamentos
  ADD COLUMN IF NOT EXISTS encaixe boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recorrencia_id uuid,
  ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'interno',
  ADD COLUMN IF NOT EXISTS confirmacao_token text NOT NULL DEFAULT replace(gen_random_uuid()::text,'-','');
CREATE UNIQUE INDEX IF NOT EXISTS agendamentos_confirmacao_token_idx ON public.agendamentos (confirmacao_token);

-- Valida expediente e bloqueios (encaixe ignora expediente, mas não bloqueios)
CREATE OR REPLACE FUNCTION public.validar_agendamento()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ini timestamp; v_fim timestamp; h horarios_profissional%ROWTYPE; v_motivo text;
BEGIN
  IF NEW.status IN ('cancelado','faltou') THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.inicio = OLD.inicio AND NEW.fim = OLD.fim AND NEW.profissional_id IS NOT DISTINCT FROM OLD.profissional_id THEN RETURN NEW; END IF;
  SELECT motivo INTO v_motivo FROM bloqueios_agenda
    WHERE clinica_id = NEW.clinica_id AND (profissional_id IS NULL OR profissional_id = NEW.profissional_id)
      AND tstzrange(inicio, fim, '[)') && tstzrange(NEW.inicio, NEW.fim, '[)') LIMIT 1;
  IF v_motivo IS NOT NULL THEN RAISE EXCEPTION 'Agenda bloqueada neste período: %', v_motivo USING ERRCODE = 'P0001'; END IF;
  IF NEW.encaixe OR NEW.profissional_id IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (SELECT 1 FROM horarios_profissional WHERE profissional_id = NEW.profissional_id) THEN RETURN NEW; END IF;
  v_ini := NEW.inicio AT TIME ZONE 'America/Sao_Paulo'; v_fim := NEW.fim AT TIME ZONE 'America/Sao_Paulo';
  SELECT * INTO h FROM horarios_profissional WHERE profissional_id = NEW.profissional_id AND dia_semana = extract(dow FROM v_ini);
  IF NOT FOUND OR v_ini::date <> v_fim::date OR v_ini::time < h.inicio OR v_fim::time > h.fim THEN
    RAISE EXCEPTION 'Fora do expediente do profissional (marque como encaixe para forçar)';
  END IF;
  IF h.intervalo_inicio IS NOT NULL AND v_ini::time < h.intervalo_fim AND v_fim::time > h.intervalo_inicio THEN
    RAISE EXCEPTION 'Horário no intervalo do profissional (marque como encaixe para forçar)';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validar_agendamento BEFORE INSERT OR UPDATE ON public.agendamentos FOR EACH ROW EXECUTE FUNCTION public.validar_agendamento();

CREATE OR REPLACE FUNCTION public.criar_agendamentos(p_paciente uuid, p_profissional uuid, p_procedimento uuid, p_unidade uuid, p_cadeira text,
  p_inicio timestamptz, p_duracao integer, p_repeticoes integer DEFAULT 1, p_intervalo_dias integer DEFAULT 7, p_observacoes text DEFAULT NULL, p_encaixe boolean DEFAULT false)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_clinica uuid := current_clinica_id(); v_rec uuid; v_ini timestamptz;
BEGIN
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','auxiliar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF p_repeticoes < 1 OR p_repeticoes > 52 THEN RAISE EXCEPTION 'Repetições entre 1 e 52'; END IF;
  IF p_duracao < 5 OR p_duracao > 600 THEN RAISE EXCEPTION 'Duração inválida'; END IF;
  IF p_paciente IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pacientes WHERE id = p_paciente AND clinica_id = v_clinica) THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
  v_rec := CASE WHEN p_repeticoes > 1 THEN gen_random_uuid() END;
  FOR i IN 0..p_repeticoes-1 LOOP
    v_ini := p_inicio + make_interval(days => i * greatest(p_intervalo_dias,1));
    INSERT INTO agendamentos (clinica_id, unidade_id, paciente_id, profissional_id, procedimento_id, cadeira, inicio, fim, observacoes, encaixe, recorrencia_id, created_by)
      VALUES (v_clinica, p_unidade, p_paciente, p_profissional, p_procedimento, nullif(p_cadeira,''), v_ini, v_ini + make_interval(mins => p_duracao), p_observacoes, p_encaixe, v_rec, auth.uid());
  END LOOP;
  RETURN p_repeticoes;
END $$;

CREATE OR REPLACE FUNCTION public.marcar_atendido(p_agendamento uuid, p_cobrar boolean DEFAULT true)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a agendamentos%ROWTYPE; v_valor numeric(12,2); v_nome text; v_conta uuid; v_cobrou boolean := false;
BEGIN
  SELECT * INTO a FROM agendamentos WHERE id = p_agendamento FOR UPDATE;
  IF NOT FOUND OR a.clinica_id <> current_clinica_id() THEN RAISE EXCEPTION 'Agendamento não encontrado'; END IF;
  IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','auxiliar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  UPDATE agendamentos SET status = 'atendido' WHERE id = a.id;
  -- Gancho Fase 2: baixa de estoque por procedimento/kit será disparada aqui.
  IF p_cobrar AND a.paciente_id IS NOT NULL AND a.procedimento_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM orcamentos WHERE paciente_id = a.paciente_id AND status IN ('aprovado','em_execucao'))
     AND NOT EXISTS (SELECT 1 FROM financeiro_recebimentos WHERE descricao LIKE '%' || a.id::text || '%') THEN
    SELECT valor, nome INTO v_valor, v_nome FROM procedimentos WHERE id = a.procedimento_id;
    IF coalesce(v_valor,0) > 0 THEN
      SELECT id INTO v_conta FROM plano_contas WHERE clinica_id = a.clinica_id AND tipo = 'receita' ORDER BY (nome = 'Receita de procedimentos') DESC, created_at LIMIT 1;
      INSERT INTO financeiro_recebimentos (clinica_id, unidade_id, paciente_id, profissional_id, conta_id, descricao, parcela, total_parcelas, forma_pagamento, valor, vencimento)
        VALUES (a.clinica_id, a.unidade_id, a.paciente_id, a.profissional_id, v_conta, v_nome || ' — atendimento ' || a.id::text, 1, 1, 'A definir', v_valor, current_date);
      v_cobrou := true;
    END IF;
  END IF;
  RETURN jsonb_build_object('cobranca', v_cobrou, 'paciente_id', a.paciente_id);
END $$;

-- Confirmação por link
CREATE OR REPLACE FUNCTION public.ver_confirmacao(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object('clinica', c.nome, 'paciente', split_part(coalesce(p.nome,''),' ',1), 'inicio', a.inicio,
    'profissional', pr.nome, 'procedimento', pc.nome, 'status', a.status)
  FROM agendamentos a JOIN clinicas c ON c.id = a.clinica_id
  LEFT JOIN pacientes p ON p.id = a.paciente_id LEFT JOIN profissionais pr ON pr.id = a.profissional_id LEFT JOIN procedimentos pc ON pc.id = a.procedimento_id
  WHERE a.confirmacao_token = p_token
$$;
CREATE OR REPLACE FUNCTION public.responder_confirmacao(p_token text, p_confirmar boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE a agendamentos%ROWTYPE;
BEGIN
  SELECT * INTO a FROM agendamentos WHERE confirmacao_token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link inválido'; END IF;
  IF a.inicio < now() OR a.status NOT IN ('agendado','confirmado') THEN RAISE EXCEPTION 'Este agendamento não pode mais ser alterado'; END IF;
  UPDATE agendamentos SET status = CASE WHEN p_confirmar THEN 'confirmado'::agendamento_status ELSE 'cancelado'::agendamento_status END WHERE id = a.id;
  RETURN CASE WHEN p_confirmar THEN 'confirmado' ELSE 'cancelado' END;
END $$;

-- Agendamento online público
CREATE OR REPLACE FUNCTION public.agenda_publica_info(p_clinica uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT jsonb_build_object('nome', c.nome, 'telefone', c.telefone,
    'procedimentos', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nome',nome,'duracao',duracao_minutos) ORDER BY nome),'[]') FROM procedimentos WHERE clinica_id = c.id AND ativo),
    'profissionais', (SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'nome',nome,'especialidade',especialidade) ORDER BY nome),'[]') FROM profissionais WHERE clinica_id = c.id AND ativo))
  FROM clinicas c WHERE c.id = p_clinica AND c.agendamento_online
$$;

CREATE OR REPLACE FUNCTION public.horarios_livres(p_clinica uuid, p_profissional uuid, p_procedimento uuid, p_dia date)
RETURNS SETOF timestamptz LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE h horarios_profissional%ROWTYPE; v_dur int; v_ini time := '08:00'; v_fim time := '18:00'; v_ii time; v_if time; s timestamptz; t time;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clinicas WHERE id = p_clinica AND agendamento_online) THEN RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM profissionais WHERE id = p_profissional AND clinica_id = p_clinica AND ativo) THEN RETURN; END IF;
  SELECT duracao_minutos INTO v_dur FROM procedimentos WHERE id = p_procedimento AND clinica_id = p_clinica AND ativo;
  IF v_dur IS NULL OR p_dia < current_date OR p_dia > current_date + 90 THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM horarios_profissional WHERE profissional_id = p_profissional) THEN
    SELECT * INTO h FROM horarios_profissional WHERE profissional_id = p_profissional AND dia_semana = extract(dow FROM p_dia);
    IF NOT FOUND THEN RETURN; END IF;
    v_ini := h.inicio; v_fim := h.fim; v_ii := h.intervalo_inicio; v_if := h.intervalo_fim;
  ELSIF extract(dow FROM p_dia) IN (0,6) THEN RETURN;
  END IF;
  t := v_ini;
  WHILE t + make_interval(mins => v_dur) <= v_fim LOOP
    s := (p_dia + t) AT TIME ZONE 'America/Sao_Paulo';
    IF s > now() + interval '1 hour'
       AND NOT (v_ii IS NOT NULL AND t < v_if AND t + make_interval(mins => v_dur) > v_ii)
       AND NOT EXISTS (SELECT 1 FROM agendamentos WHERE profissional_id = p_profissional AND status NOT IN ('cancelado','faltou')
                       AND tstzrange(inicio,fim,'[)') && tstzrange(s, s + make_interval(mins => v_dur),'[)'))
       AND NOT EXISTS (SELECT 1 FROM bloqueios_agenda WHERE clinica_id = p_clinica AND (profissional_id IS NULL OR profissional_id = p_profissional)
                       AND tstzrange(inicio,fim,'[)') && tstzrange(s, s + make_interval(mins => v_dur),'[)')) THEN
      RETURN NEXT s;
    END IF;
    t := t + interval '30 minutes';
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.agendar_online(p_clinica uuid, p_profissional uuid, p_procedimento uuid, p_inicio timestamptz, p_nome text, p_telefone text, p_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_pac uuid; v_dur int; v_tel text := regexp_replace(coalesce(p_telefone,''),'\D','','g'); v_token text;
BEGIN
  IF coalesce(trim(p_nome),'') = '' OR length(v_tel) < 10 THEN RAISE EXCEPTION 'Informe nome e telefone com DDD'; END IF;
  IF NOT EXISTS (SELECT 1 FROM horarios_livres(p_clinica, p_profissional, p_procedimento, (p_inicio AT TIME ZONE 'America/Sao_Paulo')::date) x WHERE x = p_inicio) THEN
    RAISE EXCEPTION 'Horário indisponível. Escolha outro.';
  END IF;
  SELECT duracao_minutos INTO v_dur FROM procedimentos WHERE id = p_procedimento;
  SELECT id INTO v_pac FROM pacientes WHERE clinica_id = p_clinica AND regexp_replace(coalesce(telefone,''),'\D','','g') = v_tel ORDER BY created_at LIMIT 1;
  IF v_pac IS NULL THEN
    INSERT INTO pacientes (clinica_id, nome, telefone, email, origem) VALUES (p_clinica, left(trim(p_nome),120), p_telefone, nullif(trim(p_email),''), 'Agendamento online') RETURNING id INTO v_pac;
  END IF;
  INSERT INTO agendamentos (clinica_id, paciente_id, profissional_id, procedimento_id, inicio, fim, origem, observacoes)
    VALUES (p_clinica, v_pac, p_profissional, p_procedimento, p_inicio, p_inicio + make_interval(mins => v_dur), 'online', 'Agendado pela página online')
    RETURNING confirmacao_token INTO v_token;
  RETURN jsonb_build_object('ok', true, 'token', v_token);
END $$;

REVOKE EXECUTE ON FUNCTION public.ver_confirmacao(text), public.responder_confirmacao(text,boolean), public.agenda_publica_info(uuid),
  public.horarios_livres(uuid,uuid,uuid,date), public.agendar_online(uuid,uuid,uuid,timestamptz,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ver_confirmacao(text), public.responder_confirmacao(text,boolean), public.agenda_publica_info(uuid),
  public.horarios_livres(uuid,uuid,uuid,date), public.agendar_online(uuid,uuid,uuid,timestamptz,text,text,text) TO anon, authenticated;