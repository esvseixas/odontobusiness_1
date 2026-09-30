-- 1. Criar tabela de lotes
CREATE TABLE IF NOT EXISTS public.estoque_lotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    item_id uuid NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
    lote_codigo text,
    quantidade numeric(12,2) NOT NULL DEFAULT 0,
    validade date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.estoque_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant select" ON public.estoque_lotes FOR SELECT TO authenticated USING (clinica_id = current_clinica_id());
CREATE POLICY "tenant insert" ON public.estoque_lotes FOR INSERT TO authenticated WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "tenant update" ON public.estoque_lotes FOR UPDATE TO authenticated USING (clinica_id = current_clinica_id()) WITH CHECK (clinica_id = current_clinica_id());
CREATE POLICY "tenant delete" ON public.estoque_lotes FOR DELETE TO authenticated USING (clinica_id = current_clinica_id());

-- 3. Atualizar movimentações
ALTER TABLE public.estoque_movimentacoes ADD COLUMN IF NOT EXISTS lote_id uuid REFERENCES public.estoque_lotes(id) ON DELETE SET NULL;

-- 4. Migração inicial de dados (opcional/segura)
INSERT INTO public.estoque_lotes (clinica_id, item_id, quantidade, validade, lote_codigo)
SELECT clinica_id, id, quantidade, validade, 'Lote Inicial'
FROM public.estoque_itens
WHERE quantidade > 0 OR validade IS NOT NULL;
