CREATE POLICY "prontuario select clinica" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'prontuario' AND (storage.foldername(name))[1] = public.current_clinica_id()::text);
CREATE POLICY "prontuario insert clinica" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prontuario' AND (storage.foldername(name))[1] = public.current_clinica_id()::text
    AND public.tem_papel('owner','admin','dentista','esteticista','auxiliar','recepcao'));

CREATE OR REPLACE FUNCTION public.criar_clinica_com_padroes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.semear_padroes_clinicos(NEW.clinica_id); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_semear_padroes ON public.user_roles;
CREATE TRIGGER trg_semear_padroes AFTER INSERT ON public.user_roles FOR EACH ROW WHEN (NEW.role = 'owner' AND NEW.clinica_id IS NOT NULL)
  EXECUTE FUNCTION public.criar_clinica_com_padroes();