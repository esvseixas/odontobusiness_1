CREATE TABLE public.platform_admins (
  user_id uuid PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assinaturas_plataforma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL UNIQUE REFERENCES public.clinicas(id) ON DELETE RESTRICT,
  plano text NOT NULL DEFAULT 'solo' CHECK (plano IN ('solo','clinica','rede')),
  status text NOT NULL DEFAULT 'teste' CHECK (status IN ('teste','ativo','inadimplente','suspenso','cancelado','cortesia')),
  ciclo text NOT NULL DEFAULT 'mensal' CHECK (ciclo IN ('mensal','anual')),
  valor_mensal numeric(12,2) NOT NULL DEFAULT 119.90 CHECK (valor_mensal >= 0),
  trial_ate date,
  proxima_cobranca date,
  motivo_status text,
  atualizado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.assinaturas_plataforma TO authenticated;
GRANT ALL ON public.assinaturas_plataforma TO service_role;
ALTER TABLE public.assinaturas_plataforma ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.suporte_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE RESTRICT,
  nota text NOT NULL CHECK (length(trim(nota)) BETWEEN 3 AND 2000),
  autor_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.suporte_notas TO authenticated;
GRANT ALL ON public.suporte_notas TO service_role;
ALTER TABLE public.suporte_notas ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.auditoria_plataforma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE RESTRICT,
  usuario_id uuid NOT NULL,
  acao text NOT NULL,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.auditoria_plataforma TO authenticated;
GRANT ALL ON public.auditoria_plataforma TO service_role;
ALTER TABLE public.auditoria_plataforma ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND ativo = true
  )
$$;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO authenticated;

CREATE POLICY "admin proprio" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND ativo = true);
CREATE POLICY "assinatura propria ou plataforma" ON public.assinaturas_plataforma
  FOR SELECT TO authenticated
  USING (clinica_id = public.current_clinica_id() OR public.is_platform_admin(auth.uid()));
CREATE POLICY "suporte plataforma" ON public.suporte_notas
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "auditoria plataforma" ON public.auditoria_plataforma
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

INSERT INTO public.assinaturas_plataforma (clinica_id, plano, status, ciclo, valor_mensal, trial_ate)
SELECT id, 'solo', 'teste', 'mensal', 119.90, current_date + 14
FROM public.clinicas
ON CONFLICT (clinica_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.criar_assinatura_clinica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.assinaturas_plataforma (clinica_id, plano, status, ciclo, valor_mensal, trial_ate)
  VALUES (NEW.id, 'solo', 'teste', 'mensal', 119.90, current_date + 14)
  ON CONFLICT (clinica_id) DO NOTHING;
  RETURN NEW;
END
$$;
CREATE TRIGGER trg_criar_assinatura_clinica
AFTER INSERT ON public.clinicas
FOR EACH ROW EXECUTE FUNCTION public.criar_assinatura_clinica();

CREATE OR REPLACE FUNCTION public.verificar_acesso_clinica()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN jsonb_build_object('liberado', false, 'status', 'nao_autenticado')
    WHEN public.is_platform_admin(auth.uid()) AND public.current_clinica_id() IS NULL
      THEN jsonb_build_object('liberado', true, 'status', 'admin_plataforma')
    ELSE coalesce((
      SELECT jsonb_build_object(
        'liberado', a.status IN ('ativo','cortesia') OR (a.status = 'teste' AND a.trial_ate >= current_date),
        'status', a.status,
        'trial_ate', a.trial_ate,
        'plano', a.plano
      )
      FROM public.assinaturas_plataforma a
      WHERE a.clinica_id = public.current_clinica_id()
    ), jsonb_build_object('liberado', false, 'status', 'sem_assinatura'))
  END
$$;
GRANT EXECUTE ON FUNCTION public.verificar_acesso_clinica() TO authenticated;

CREATE OR REPLACE FUNCTION public.resumo_admin_plataforma()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito ao administrador da plataforma'; END IF;
  SELECT jsonb_build_object(
    'clientes', count(*),
    'ativos', count(*) FILTER (WHERE status IN ('ativo','cortesia')),
    'testes', count(*) FILTER (WHERE status = 'teste' AND trial_ate >= current_date),
    'suspensos', count(*) FILTER (WHERE status IN ('suspenso','cancelado')),
    'inadimplentes', count(*) FILTER (WHERE status = 'inadimplente'),
    'mrr', coalesce(sum(valor_mensal) FILTER (WHERE status = 'ativo'), 0),
    'vencimentos_7d', count(*) FILTER (WHERE proxima_cobranca BETWEEN current_date AND current_date + 7)
  ) INTO v_result
  FROM public.assinaturas_plataforma;
  RETURN v_result;
END
$$;
GRANT EXECUTE ON FUNCTION public.resumo_admin_plataforma() TO authenticated;

CREATE OR REPLACE FUNCTION public.listar_clientes_plataforma(p_busca text DEFAULT NULL)
RETURNS TABLE (
  clinica_id uuid,
  clinica_nome text,
  cnpj text,
  contato_email text,
  contato_telefone text,
  criado_em timestamptz,
  plano text,
  status text,
  ciclo text,
  valor_mensal numeric,
  trial_ate date,
  proxima_cobranca date,
  motivo_status text,
  unidades bigint,
  usuarios bigint,
  responsavel text,
  responsavel_email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito ao administrador da plataforma'; END IF;
  RETURN QUERY
  SELECT c.id, c.nome, c.cnpj, c.email, c.telefone, c.created_at,
    a.plano, a.status, a.ciclo, a.valor_mensal, a.trial_ate, a.proxima_cobranca, a.motivo_status,
    (SELECT count(*) FROM public.unidades u WHERE u.clinica_id = c.id AND u.ativo),
    (SELECT count(*) FROM public.profiles p WHERE p.clinica_id = c.id AND p.ativo),
    (SELECT p.nome FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.clinica_id = c.id AND r.role = 'owner' WHERE p.clinica_id = c.id ORDER BY p.created_at LIMIT 1),
    (SELECT p.email FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id AND r.clinica_id = c.id AND r.role = 'owner' WHERE p.clinica_id = c.id ORDER BY p.created_at LIMIT 1)
  FROM public.clinicas c
  JOIN public.assinaturas_plataforma a ON a.clinica_id = c.id
  WHERE coalesce(trim(p_busca),'') = ''
     OR c.nome ILIKE '%' || trim(p_busca) || '%'
     OR coalesce(c.cnpj,'') ILIKE '%' || trim(p_busca) || '%'
     OR coalesce(c.email,'') ILIKE '%' || trim(p_busca) || '%'
  ORDER BY c.created_at DESC;
END
$$;
GRANT EXECUTE ON FUNCTION public.listar_clientes_plataforma(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.gerenciar_assinatura(
  p_clinica uuid,
  p_plano text,
  p_status text,
  p_ciclo text,
  p_valor numeric,
  p_trial_ate date DEFAULT NULL,
  p_proxima_cobranca date DEFAULT NULL,
  p_motivo text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_antes jsonb; v_depois jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito ao administrador da plataforma'; END IF;
  IF p_plano NOT IN ('solo','clinica','rede') OR p_status NOT IN ('teste','ativo','inadimplente','suspenso','cancelado','cortesia') OR p_ciclo NOT IN ('mensal','anual') THEN RAISE EXCEPTION 'Plano, situação ou ciclo inválido'; END IF;
  IF p_valor < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF p_status IN ('suspenso','cancelado','inadimplente') AND coalesce(trim(p_motivo),'') = '' THEN RAISE EXCEPTION 'Informe o motivo da alteração'; END IF;

  SELECT to_jsonb(a) INTO v_antes FROM public.assinaturas_plataforma a WHERE a.clinica_id = p_clinica FOR UPDATE;
  IF v_antes IS NULL THEN RAISE EXCEPTION 'Assinatura não encontrada'; END IF;

  UPDATE public.assinaturas_plataforma
  SET plano = p_plano, status = p_status, ciclo = p_ciclo, valor_mensal = round(p_valor,2),
      trial_ate = p_trial_ate, proxima_cobranca = p_proxima_cobranca,
      motivo_status = nullif(trim(p_motivo),''), atualizado_por = auth.uid(), updated_at = now()
  WHERE clinica_id = p_clinica;

  SELECT to_jsonb(a) INTO v_depois FROM public.assinaturas_plataforma a WHERE a.clinica_id = p_clinica;
  INSERT INTO public.auditoria_plataforma (clinica_id, usuario_id, acao, detalhes)
  VALUES (p_clinica, auth.uid(), 'alterou assinatura', jsonb_build_object('antes',v_antes,'depois',v_depois));
END
$$;
GRANT EXECUTE ON FUNCTION public.gerenciar_assinatura(uuid,text,text,text,numeric,date,date,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.adicionar_nota_suporte(p_clinica uuid, p_nota text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN RAISE EXCEPTION 'Acesso restrito ao administrador da plataforma'; END IF;
  IF length(trim(coalesce(p_nota,''))) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'A observação deve ter entre 3 e 2000 caracteres'; END IF;
  INSERT INTO public.suporte_notas (clinica_id, nota, autor_id) VALUES (p_clinica, trim(p_nota), auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.auditoria_plataforma (clinica_id, usuario_id, acao, detalhes)
  VALUES (p_clinica, auth.uid(), 'adicionou observação de suporte', jsonb_build_object('nota_id',v_id));
  RETURN v_id;
END
$$;
GRANT EXECUTE ON FUNCTION public.adicionar_nota_suporte(uuid,text) TO authenticated;