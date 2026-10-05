CREATE OR REPLACE FUNCTION public.validar_entrada_lote_vencido()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.validade IS NOT NULL AND NEW.validade < current_date AND NOT EXISTS (
       SELECT 1 FROM public.estoque_lotes o WHERE o.item_id = NEW.item_id AND o.numero_lote IS NOT DISTINCT FROM NEW.numero_lote AND o.validade = NEW.validade AND o.id <> NEW.id) THEN
    RAISE EXCEPTION 'Não é possível dar entrada em lote já vencido (validade %)', to_char(NEW.validade, 'DD/MM/YYYY');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_lote_vencido BEFORE INSERT ON public.estoque_lotes FOR EACH ROW EXECUTE FUNCTION public.validar_entrada_lote_vencido();