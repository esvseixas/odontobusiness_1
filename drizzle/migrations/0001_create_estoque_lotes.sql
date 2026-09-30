CREATE TABLE public.estoque_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id),
  item_id uuid NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  unidade_id uuid REFERENCES public.unidades(id),
  numero_lote text,
  quantidade numeric NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  validade date,
  entrada_em date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_lotes TO authenticated;
GRANT ALL ON public.estoque_lotes TO service_role;

ALTER TABLE public.estoque_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant select" ON public.estoque_lotes
FOR SELECT TO authenticated
USING (clinica_id = public.current_clinica_id());

CREATE POLICY "tenant insert" ON public.estoque_lotes
FOR INSERT TO authenticated
WITH CHECK (
  clinica_id = public.current_clinica_id()
  AND EXISTS (
    SELECT 1 FROM public.estoque_itens i
    WHERE i.id = item_id AND i.clinica_id = public.current_clinica_id()
  )
);

CREATE POLICY "tenant update" ON public.estoque_lotes
FOR UPDATE TO authenticated
USING (clinica_id = public.current_clinica_id())
WITH CHECK (
  clinica_id = public.current_clinica_id()
  AND EXISTS (
    SELECT 1 FROM public.estoque_itens i
    WHERE i.id = item_id AND i.clinica_id = public.current_clinica_id()
  )
);

CREATE POLICY "tenant delete" ON public.estoque_lotes
FOR DELETE TO authenticated
USING (clinica_id = public.current_clinica_id());

CREATE INDEX estoque_lotes_clinica_item_idx ON public.estoque_lotes (clinica_id, item_id);
CREATE INDEX estoque_lotes_validade_idx ON public.estoque_lotes (clinica_id, validade);

INSERT INTO public.estoque_lotes (clinica_id, item_id, numero_lote, quantidade, validade, entrada_em)
SELECT clinica_id, id, 'SALDO-INICIAL', quantidade, validade, created_at::date
FROM public.estoque_itens
WHERE quantidade > 0 OR validade IS NOT NULL;

COMMENT ON COLUMN public.estoque_itens.quantidade IS 'DEPRECATED: quantidade calculada pela soma de estoque_lotes';
COMMENT ON COLUMN public.estoque_itens.validade IS 'DEPRECATED: validade controlada individualmente em estoque_lotes';