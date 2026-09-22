-- ENUMS
CREATE TYPE public.app_role AS ENUM ('owner','dentista','recepcao','financeiro');
CREATE TYPE public.agendamento_status AS ENUM ('agendado','confirmado','em_atendimento','atendido','faltou','cancelado');
CREATE TYPE public.orcamento_status AS ENUM ('pendente','aprovado','em_execucao','concluido','recusado');
CREATE TYPE public.lancamento_status AS ENUM ('pendente','pago','atrasado','cancelado');
CREATE TYPE public.conta_tipo AS ENUM ('receita','despesa');

-- CLINICAS
CREATE TABLE public.clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  regime_tributario text,
  telefone text,
  email text,
  endereco text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinicas TO authenticated;
GRANT ALL ON public.clinicas TO service_role;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  endereco text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades TO authenticated;
GRANT ALL ON public.unidades TO service_role;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE SET NULL,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  nome text NOT NULL DEFAULT '',
  email text,
  telefone text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- HELPERS
CREATE OR REPLACE FUNCTION public.current_clinica_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT clinica_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CORE POLICIES
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR clinica_id = public.current_clinica_id());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "roles select" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR clinica_id = public.current_clinica_id());
CREATE POLICY "roles insert self" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "roles manage owner" ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') AND clinica_id = public.current_clinica_id())
  WITH CHECK (clinica_id = public.current_clinica_id());
CREATE POLICY "roles delete owner" ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'owner') AND clinica_id = public.current_clinica_id());

CREATE POLICY "clinica select" ON public.clinicas FOR SELECT TO authenticated
  USING (id = public.current_clinica_id());
CREATE POLICY "clinica insert" ON public.clinicas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clinica update" ON public.clinicas FOR UPDATE TO authenticated
  USING (id = public.current_clinica_id() AND public.has_role(auth.uid(),'owner'))
  WITH CHECK (id = public.current_clinica_id());

CREATE POLICY "unidades tenant" ON public.unidades FOR ALL TO authenticated
  USING (clinica_id = public.current_clinica_id())
  WITH CHECK (clinica_id = public.current_clinica_id());

-- DOMAIN TABLES
CREATE TABLE public.convenios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  registro_ans text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profissionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  user_id uuid,
  nome text NOT NULL,
  especialidade text,
  cro text,
  cor text DEFAULT '#1B7BA8',
  comissao_percentual numeric(5,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pacientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  nome text NOT NULL,
  cpf text,
  data_nascimento date,
  sexo text,
  telefone text,
  email text,
  cep text,
  endereco text,
  cidade text,
  estado text,
  responsavel_nome text,
  responsavel_cpf text,
  responsavel_telefone text,
  convenio_id uuid REFERENCES public.convenios(id) ON DELETE SET NULL,
  numero_carteirinha text,
  elegibilidade_pendente boolean NOT NULL DEFAULT false,
  anamnese jsonb NOT NULL DEFAULT '{}'::jsonb,
  consentimento_lgpd boolean NOT NULL DEFAULT false,
  consentimento_data timestamptz,
  assinatura_base64 text,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  codigo text,
  nome text NOT NULL,
  categoria text,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  duracao_minutos int NOT NULL DEFAULT 30,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL,
  procedimento_id uuid REFERENCES public.procedimentos(id) ON DELETE SET NULL,
  cadeira text,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  status public.agendamento_status NOT NULL DEFAULT 'agendado',
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL,
  versao int NOT NULL DEFAULT 1,
  status public.orcamento_status NOT NULL DEFAULT 'pendente',
  desconto numeric(12,2) NOT NULL DEFAULT 0,
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  observacoes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  procedimento_id uuid REFERENCES public.procedimentos(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  dente text,
  faces text[],
  quantidade int NOT NULL DEFAULT 1,
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.odontograma_marcacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  dente text NOT NULL,
  face text,
  condicao text NOT NULL,
  procedimento_id uuid REFERENCES public.procedimentos(id) ON DELETE SET NULL,
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'planejado',
  observacao text,
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.evolucoes_clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  agendamento_id uuid REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  autor_id uuid,
  autor_nome text,
  texto text NOT NULL,
  retifica_id uuid REFERENCES public.evolucoes_clinicas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documentos_emitidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  autor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.plano_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo public.conta_tipo NOT NULL,
  centro_custo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.financeiro_recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  paciente_id uuid REFERENCES public.pacientes(id) ON DELETE SET NULL,
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  profissional_id uuid REFERENCES public.profissionais(id) ON DELETE SET NULL,
  conta_id uuid REFERENCES public.plano_contas(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  parcela int NOT NULL DEFAULT 1,
  total_parcelas int NOT NULL DEFAULT 1,
  forma_pagamento text,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  pago_em date,
  status public.lancamento_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.financeiro_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id) ON DELETE SET NULL,
  conta_id uuid REFERENCES public.plano_contas(id) ON DELETE SET NULL,
  fornecedor text,
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  pago_em date,
  status public.lancamento_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.estoque_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  unidade_medida text DEFAULT 'un',
  quantidade numeric(12,2) NOT NULL DEFAULT 0,
  estoque_minimo numeric(12,2) NOT NULL DEFAULT 0,
  fornecedor text,
  validade date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  quantidade numeric(12,2) NOT NULL,
  motivo text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auditoria_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  usuario_id uuid,
  usuario_nome text,
  acao text NOT NULL,
  tabela text,
  registro_id uuid,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- GRANTS + RLS + TENANT POLICIES
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'convenios','profissionais','pacientes','procedimentos','agendamentos',
    'orcamentos','orcamento_itens','odontograma_marcacoes','evolucoes_clinicas',
    'documentos_emitidos','plano_contas','financeiro_recebimentos','financeiro_pagamentos',
    'estoque_itens','estoque_movimentacoes','auditoria_logs'
  ] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role;', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($p$CREATE POLICY "tenant select" ON public.%I FOR SELECT TO authenticated USING (clinica_id = public.current_clinica_id());$p$, t);
    EXECUTE format($p$CREATE POLICY "tenant insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (clinica_id = public.current_clinica_id());$p$, t);
  END LOOP;

  -- update/delete allowed everywhere except immutable clinical records
  FOREACH t IN ARRAY ARRAY[
    'convenios','profissionais','pacientes','procedimentos','agendamentos',
    'orcamentos','orcamento_itens','odontograma_marcacoes','plano_contas',
    'financeiro_recebimentos','financeiro_pagamentos','estoque_itens'
  ] LOOP
    EXECUTE format($p$CREATE POLICY "tenant update" ON public.%I FOR UPDATE TO authenticated USING (clinica_id = public.current_clinica_id()) WITH CHECK (clinica_id = public.current_clinica_id());$p$, t);
    EXECUTE format($p$CREATE POLICY "tenant delete" ON public.%I FOR DELETE TO authenticated USING (clinica_id = public.current_clinica_id());$p$, t);
  END LOOP;
END $$;

-- INDEXES
CREATE INDEX ON public.pacientes (clinica_id, nome);
CREATE INDEX ON public.agendamentos (clinica_id, inicio);
CREATE INDEX ON public.odontograma_marcacoes (clinica_id, paciente_id);
CREATE INDEX ON public.financeiro_recebimentos (clinica_id, vencimento);
CREATE INDEX ON public.financeiro_pagamentos (clinica_id, vencimento);