CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- ========== 1. Pacientes ==========
ALTER TABLE public.pacientes
  ADD COLUMN IF NOT EXISTS nome_social text,
  ADD COLUMN IF NOT EXISTS foto_path text,
  ADD COLUMN IF NOT EXISTS rg text,
  ADD COLUMN IF NOT EXISTS profissao text,
  ADD COLUMN IF NOT EXISTS estado_civil text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS indicado_por uuid REFERENCES public.pacientes(id),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS contato_preferencias jsonb NOT NULL DEFAULT '{"whatsapp":true,"sms":false,"email":true,"horario":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS consentimentos jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS assinatura_path text;
UPDATE public.pacientes SET consentimentos = jsonb_build_object('tratamento', consentimento_lgpd, 'marketing', false, 'imagem', false, 'ia', false,
  'atualizado_em', consentimento_data) WHERE consentimentos = '{}'::jsonb;
COMMENT ON COLUMN public.pacientes.assinatura_base64 IS 'DEPRECATED: replaced by assinatura_path (Storage bucket prontuario)';
COMMENT ON COLUMN public.pacientes.anamnese IS 'DEPRECATED: replaced by public.anamneses (versioned)';
CREATE INDEX IF NOT EXISTS pacientes_nome_trgm ON public.pacientes USING gin (nome extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pacientes_cpf_trgm ON public.pacientes USING gin (cpf extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS pacientes_tel_trgm ON public.pacientes USING gin (telefone extensions.gin_trgm_ops);

-- modelos de anamnese
CREATE TABLE public.anamnese_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'geral',
  perguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.anamnese_modelos TO authenticated;
GRANT ALL ON public.anamnese_modelos TO service_role;
ALTER TABLE public.anamnese_modelos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant select" ON public.anamnese_modelos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "gestao insert" ON public.anamnese_modelos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista'));
CREATE POLICY "gestao update" ON public.anamnese_modelos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista')) WITH CHECK (clinica_id = current_clinica_id());

-- anamneses versionadas (imutáveis)
CREATE TABLE public.anamneses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  modelo_id uuid REFERENCES public.anamnese_modelos(id),
  modelo_nome text,
  versao integer NOT NULL DEFAULT 1,
  perguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  respostas jsonb NOT NULL DEFAULT '{}'::jsonb,
  alertas text[] NOT NULL DEFAULT '{}',
  origem text NOT NULL DEFAULT 'profissional',
  preenchido_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX anamneses_paciente_idx ON public.anamneses (clinica_id, paciente_id, created_at DESC);
GRANT SELECT, INSERT ON public.anamneses TO authenticated;
GRANT ALL ON public.anamneses TO service_role;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant select" ON public.anamneses FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.anamneses FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar')
  AND EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.clinica_id = current_clinica_id()));

CREATE OR REPLACE FUNCTION public.anamnese_versao() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  SELECT coalesce(max(versao),0) + 1 INTO NEW.versao FROM anamneses WHERE paciente_id = NEW.paciente_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_anamnese_versao BEFORE INSERT ON public.anamneses FOR EACH ROW EXECUTE FUNCTION public.anamnese_versao();

-- links públicos de anamnese
CREATE TABLE public.anamnese_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  modelo_id uuid NOT NULL REFERENCES public.anamnese_modelos(id),
  token text NOT NULL UNIQUE DEFAULT (replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','')),
  expira_em timestamptz NOT NULL DEFAULT now() + interval '7 days',
  usado_em timestamptz,
  criado_por uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.anamnese_links TO authenticated;
GRANT ALL ON public.anamnese_links TO service_role;
ALTER TABLE public.anamnese_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant select" ON public.anamnese_links FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "equipe insert" ON public.anamnese_links FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao')
  AND EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.clinica_id = current_clinica_id())
  AND EXISTS (SELECT 1 FROM public.anamnese_modelos m WHERE m.id = modelo_id AND m.clinica_id = current_clinica_id()));

-- cálculo de alertas a partir das respostas
CREATE OR REPLACE FUNCTION public.calcular_alertas(p_perguntas jsonb, p_respostas jsonb) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE q jsonb; r jsonb; v_out text[] := '{}';
BEGIN
  FOR q IN SELECT * FROM jsonb_array_elements(coalesce(p_perguntas,'[]'::jsonb)) LOOP
    IF coalesce(q->>'alerta','') = '' THEN CONTINUE; END IF;
    r := p_respostas -> (q->>'id');
    IF r IS NULL THEN CONTINUE; END IF;
    IF (jsonb_typeof(r) = 'boolean' AND r::text = 'true')
       OR (jsonb_typeof(r) = 'string' AND lower(r #>> '{}') IN ('sim','true'))
       OR (q->>'tipo' = 'texto' AND jsonb_typeof(r) = 'string' AND length(trim(r #>> '{}')) > 0 AND lower(r #>> '{}') NOT IN ('não','nao','nenhum','nenhuma')) THEN
      v_out := v_out || (q->>'alerta');
    END IF;
  END LOOP;
  RETURN v_out;
END $$;
CREATE OR REPLACE FUNCTION public.anamnese_alertas() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.alertas := public.calcular_alertas(NEW.perguntas, NEW.respostas); RETURN NEW; END $$;
CREATE TRIGGER trg_anamnese_alertas BEFORE INSERT ON public.anamneses FOR EACH ROW EXECUTE FUNCTION public.anamnese_alertas();

CREATE OR REPLACE FUNCTION public.ver_anamnese_link(p_token text)
RETURNS TABLE (clinica_nome text, paciente_nome text, modelo_nome text, perguntas jsonb, valido boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.nome, split_part(p.nome,' ',1), m.nome, m.perguntas, (l.usado_em IS NULL AND l.expira_em > now())
  FROM anamnese_links l JOIN clinicas c ON c.id = l.clinica_id JOIN pacientes p ON p.id = l.paciente_id
  JOIN anamnese_modelos m ON m.id = l.modelo_id WHERE l.token = p_token
$$;
CREATE OR REPLACE FUNCTION public.enviar_anamnese_link(p_token text, p_respostas jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l anamnese_links%ROWTYPE; m anamnese_modelos%ROWTYPE;
BEGIN
  SELECT * INTO l FROM anamnese_links WHERE token = p_token FOR UPDATE;
  IF NOT FOUND OR l.usado_em IS NOT NULL OR l.expira_em <= now() THEN RAISE EXCEPTION 'Link inválido ou expirado'; END IF;
  IF jsonb_typeof(p_respostas) <> 'object' OR length(p_respostas::text) > 50000 THEN RAISE EXCEPTION 'Respostas inválidas'; END IF;
  SELECT * INTO m FROM anamnese_modelos WHERE id = l.modelo_id;
  INSERT INTO anamneses (clinica_id, paciente_id, modelo_id, modelo_nome, perguntas, respostas, origem, preenchido_por)
  VALUES (l.clinica_id, l.paciente_id, m.id, m.nome, m.perguntas, p_respostas, 'link', NULL);
  UPDATE anamnese_links SET usado_em = now() WHERE id = l.id;
END $$;
GRANT EXECUTE ON FUNCTION public.ver_anamnese_link(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enviar_anamnese_link(text, jsonb) TO anon, authenticated;

-- ========== 2. Arquivos ==========
CREATE TABLE public.paciente_arquivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id),
  tipo text NOT NULL CHECK (tipo IN ('radiografia','tomografia','foto_intraoral','foto_facial','documento','termo_assinado','assinatura')),
  dente text,
  regiao text,
  data_exame date NOT NULL DEFAULT current_date,
  descricao text,
  storage_path text NOT NULL,
  nome_arquivo text,
  mime text,
  tamanho bigint,
  ativo boolean NOT NULL DEFAULT true,
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX paciente_arquivos_idx ON public.paciente_arquivos (clinica_id, paciente_id, data_exame DESC);
GRANT SELECT, INSERT, UPDATE ON public.paciente_arquivos TO authenticated;
GRANT ALL ON public.paciente_arquivos TO service_role;
ALTER TABLE public.paciente_arquivos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant select" ON public.paciente_arquivos FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "clinico insert" ON public.paciente_arquivos FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id()
  AND (tem_papel('owner','admin','dentista','esteticista','auxiliar') OR (tipo IN ('documento','assinatura','termo_assinado') AND tem_papel('recepcao')))
  AND split_part(storage_path,'/',1) = current_clinica_id()::text
  AND EXISTS (SELECT 1 FROM public.pacientes p WHERE p.id = paciente_id AND p.clinica_id = current_clinica_id()));
CREATE POLICY "clinico inativa" ON public.paciente_arquivos FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin','dentista','esteticista','auxiliar')) WITH CHECK (clinica_id = current_clinica_id());

-- ========== 3. Especialidades / procedimentos / preços ==========
CREATE TABLE public.especialidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinica_id, nome)
);
GRANT SELECT, INSERT, UPDATE ON public.especialidades TO authenticated;
GRANT ALL ON public.especialidades TO service_role;
ALTER TABLE public.especialidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant select" ON public.especialidades FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "gestao insert" ON public.especialidades FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel('owner','admin'));
CREATE POLICY "gestao update" ON public.especialidades FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel('owner','admin')) WITH CHECK (clinica_id = current_clinica_id());

ALTER TABLE public.procedimentos
  ADD COLUMN IF NOT EXISTS especialidade_id uuid REFERENCES public.especialidades(id),
  ADD COLUMN IF NOT EXISTS codigo_tuss text,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'odontologico' CHECK (tipo IN ('odontologico','estetico','outro')),
  ADD COLUMN IF NOT EXISTS publico text NOT NULL DEFAULT 'unissex' CHECK (publico IN ('masculino','feminino','unissex')),
  ADD COLUMN IF NOT EXISTS requer_termo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS termo_modelo_id uuid,
  ADD COLUMN IF NOT EXISTS sessoes_previstas integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS intervalo_retorno_dias integer,
  ADD COLUMN IF NOT EXISTS custo_estimado numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exige_lote_aplicado boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.procedimentos.termo_modelo_id IS 'FK para documento_modelos (Fase 1, bloco 6)';

CREATE TABLE public.tabelas_preco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'particular' CHECK (tipo IN ('particular','convenio','plano_interno')),
  convenio_id uuid REFERENCES public.convenios(id),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tabela_preco_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  tabela_id uuid NOT NULL REFERENCES public.tabelas_preco(id) ON DELETE CASCADE,
  procedimento_id uuid NOT NULL REFERENCES public.procedimentos(id),
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tabela_id, procedimento_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabelas_preco, public.tabela_preco_itens TO authenticated;
GRANT ALL ON public.tabelas_preco, public.tabela_preco_itens TO service_role;
ALTER TABLE public.tabelas_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabela_preco_itens ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['tabelas_preco','tabela_preco_itens'] LOOP
    EXECUTE format('CREATE POLICY "tenant select" ON public.%I FOR SELECT TO authenticated USING (clinica_id = current_clinica_id())', t);
    EXECUTE format('CREATE POLICY "gestao insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin'',''financeiro''))', t);
    EXECUTE format('CREATE POLICY "gestao update" ON public.%I FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin'',''financeiro'')) WITH CHECK (clinica_id = current_clinica_id())', t);
    EXECUTE format('CREATE POLICY "gestao delete" ON public.%I FOR DELETE TO authenticated USING (clinica_id = current_clinica_id() AND tem_papel(''owner'',''admin'',''financeiro''))', t);
  END LOOP;
END $$;
CREATE POLICY "itens mesma clinica" ON public.tabela_preco_itens AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.tabelas_preco t WHERE t.id = tabela_id AND t.clinica_id = current_clinica_id())
          AND EXISTS (SELECT 1 FROM public.procedimentos p WHERE p.id = procedimento_id AND p.clinica_id = current_clinica_id()));

-- semeadura padrão por clínica
CREATE OR REPLACE FUNCTION public.semear_padroes_clinicos(p_clinica uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO especialidades (clinica_id, nome)
  SELECT p_clinica, n FROM unnest(ARRAY['Clínica geral','Dentística','Endodontia','Periodontia','Cirurgia','Implantodontia','Prótese',
    'Ortodontia','Odontopediatria','DTM/Dor orofacial','Estomatologia','Radiologia','Harmonização orofacial','Estética']) n
  ON CONFLICT (clinica_id, nome) DO NOTHING;
  UPDATE procedimentos p SET especialidade_id = e.id FROM especialidades e
   WHERE p.clinica_id = p_clinica AND e.clinica_id = p_clinica AND p.especialidade_id IS NULL
     AND (e.nome = p.categoria OR (p.categoria = 'Prevenção' AND e.nome = 'Clínica geral'));
  UPDATE procedimentos SET tipo = 'estetico' WHERE clinica_id = p_clinica AND categoria IN ('Estética','Harmonização orofacial') AND tipo = 'odontologico';
  IF NOT EXISTS (SELECT 1 FROM tabelas_preco WHERE clinica_id = p_clinica) THEN
    INSERT INTO tabelas_preco (clinica_id, nome, tipo) VALUES (p_clinica, 'Particular', 'particular');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM anamnese_modelos WHERE clinica_id = p_clinica) THEN
    INSERT INTO anamnese_modelos (clinica_id, nome, tipo, perguntas) VALUES
    (p_clinica, 'Odontológica geral', 'geral', '[
      {"id":"queixa","texto":"Qual a queixa principal?","tipo":"texto"},
      {"id":"alergia","texto":"Tem alergia a medicamentos ou materiais? Quais?","tipo":"texto","alerta":"Alergia"},
      {"id":"anticoagulante","texto":"Usa anticoagulante (AAS, varfarina etc.)?","tipo":"sim_nao","alerta":"Anticoagulante"},
      {"id":"gestante","texto":"Está gestante?","tipo":"sim_nao","alerta":"Gestante"},
      {"id":"diabetes","texto":"Tem diabetes?","tipo":"sim_nao","alerta":"Diabetes"},
      {"id":"cardiopatia","texto":"Tem cardiopatia ou hipertensão?","tipo":"sim_nao","alerta":"Cardiopatia/Hipertensão"},
      {"id":"bifosfonato","texto":"Usa ou usou bifosfonatos?","tipo":"sim_nao","alerta":"Bifosfonatos"},
      {"id":"medicamentos","texto":"Medicamentos em uso","tipo":"texto"},
      {"id":"fumante","texto":"Fumante?","tipo":"sim_nao","alerta":"Tabagista"}]'::jsonb),
    (p_clinica, 'Infantil', 'infantil', '[
      {"id":"responsavel","texto":"Nome do responsável presente","tipo":"texto"},
      {"id":"alergia","texto":"Alergias? Quais?","tipo":"texto","alerta":"Alergia"},
      {"id":"amamentacao","texto":"Amamentação / mamadeira noturna?","tipo":"sim_nao"},
      {"id":"habitos","texto":"Hábitos (chupeta, dedo, roer unhas)","tipo":"texto"},
      {"id":"cardiopatia","texto":"Possui cardiopatia?","tipo":"sim_nao","alerta":"Cardiopatia"}]'::jsonb),
    (p_clinica, 'HOF / Estética', 'estetica', '[
      {"id":"objetivo","texto":"Objetivo estético","tipo":"texto"},
      {"id":"alergia","texto":"Alergias? Quais?","tipo":"texto","alerta":"Alergia"},
      {"id":"gestante","texto":"Gestante ou amamentando?","tipo":"sim_nao","alerta":"Gestante/lactante"},
      {"id":"preenchimento","texto":"Já fez preenchimento ou toxina? Quando?","tipo":"texto"},
      {"id":"autoimune","texto":"Doença autoimune?","tipo":"sim_nao","alerta":"Doença autoimune"},
      {"id":"queloide","texto":"Tendência a queloide?","tipo":"sim_nao","alerta":"Queloide"}]'::jsonb),
    (p_clinica, 'Cirúrgica', 'cirurgica', '[
      {"id":"alergia","texto":"Alergias? Quais?","tipo":"texto","alerta":"Alergia"},
      {"id":"anticoagulante","texto":"Usa anticoagulante?","tipo":"sim_nao","alerta":"Anticoagulante"},
      {"id":"bifosfonato","texto":"Usa ou usou bifosfonatos?","tipo":"sim_nao","alerta":"Bifosfonatos"},
      {"id":"diabetes","texto":"Diabetes?","tipo":"sim_nao","alerta":"Diabetes"},
      {"id":"cardiopatia","texto":"Cardiopatia?","tipo":"sim_nao","alerta":"Cardiopatia"},
      {"id":"hemorragia","texto":"Histórico de sangramento prolongado?","tipo":"sim_nao","alerta":"Risco hemorrágico"},
      {"id":"pressao","texto":"Pressão arterial aferida (mmHg)","tipo":"texto"}]'::jsonb);
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.semear_padroes_clinicos(uuid) FROM public, anon, authenticated;
SELECT public.semear_padroes_clinicos(id) FROM public.clinicas;

-- auditoria nas novas tabelas sensíveis
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['anamnese_modelos','anamneses','anamnese_links','paciente_arquivos','especialidades','tabelas_preco','tabela_preco_itens'] LOOP
    EXECUTE format('CREATE TRIGGER trg_auditar AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.auditar()', t);
  END LOOP;
END $$;

-- ========== 7. Conflitos de agenda ==========
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_periodo_valido CHECK (fim > inicio) NOT VALID;
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_sem_conflito_profissional
  EXCLUDE USING gist (profissional_id WITH =, tstzrange(inicio, fim, '[)') WITH &&)
  WHERE (profissional_id IS NOT NULL AND status NOT IN ('cancelado','faltou'));
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_sem_conflito_paciente
  EXCLUDE USING gist (paciente_id WITH =, tstzrange(inicio, fim, '[)') WITH &&)
  WHERE (paciente_id IS NOT NULL AND status NOT IN ('cancelado','faltou'));
ALTER TABLE public.agendamentos ADD CONSTRAINT agendamentos_sem_conflito_cadeira
  EXCLUDE USING gist (unidade_id WITH =, cadeira WITH =, tstzrange(inicio, fim, '[)') WITH &&)
  WHERE (cadeira IS NOT NULL AND unidade_id IS NOT NULL AND status NOT IN ('cancelado','faltou'));