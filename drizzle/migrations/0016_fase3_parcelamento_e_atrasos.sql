CREATE OR REPLACE FUNCTION public.criar_lancamentos_parcelados(p_tipo text,p_valor numeric,p_parcelas integer,p_primeiro_vencimento date,p_dia_vencimento integer,p_descricao text,p_unidade uuid DEFAULT NULL,p_paciente uuid DEFAULT NULL,p_profissional uuid DEFAULT NULL,p_conta uuid DEFAULT NULL,p_forma uuid DEFAULT NULL,p_origem_tipo text DEFAULT NULL,p_origem_id uuid DEFAULT NULL) RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_clinica uuid:=current_clinica_id();v_ids uuid[]:='{}';v_base numeric(12,2);v_acum numeric(12,2):=0;v_valor numeric(12,2);v_mes date;v_venc date;v_id uuid;v_forma_nome text;
BEGIN
 IF NOT tem_papel('owner','admin','financeiro','recepcao','dentista','esteticista') THEN RAISE EXCEPTION 'Sem permissão';END IF;
 IF p_tipo NOT IN('receber','pagar') OR (p_tipo='pagar' AND NOT tem_papel('owner','admin','financeiro')) THEN RAISE EXCEPTION 'Tipo ou permissão inválida';END IF;
 IF round(coalesce(p_valor,0),2)<=0 OR p_parcelas NOT BETWEEN 1 AND 48 OR p_dia_vencimento NOT BETWEEN 1 AND 31 THEN RAISE EXCEPTION 'Dados do parcelamento inválidos';END IF;
 IF p_unidade IS NOT NULL AND NOT EXISTS(SELECT 1 FROM unidades WHERE id=p_unidade AND clinica_id=v_clinica) THEN RAISE EXCEPTION 'Unidade inválida';END IF;
 SELECT nome INTO v_forma_nome FROM formas_pagamento WHERE id=p_forma AND clinica_id=v_clinica;
 v_base:=trunc(round(p_valor,2)/p_parcelas,2);
 FOR i IN 1..p_parcelas LOOP
  v_valor:=CASE WHEN i=p_parcelas THEN round(p_valor,2)-v_acum ELSE v_base END;v_acum:=v_acum+v_valor;
  v_mes:=date_trunc('month',p_primeiro_vencimento)::date+make_interval(months=>i-1);
  v_venc:=v_mes+(least(p_dia_vencimento,extract(day from(v_mes+interval '1 month - 1 day'))::int)-1);
  IF p_tipo='receber' THEN
   INSERT INTO financeiro_recebimentos(clinica_id,unidade_id,paciente_id,profissional_id,conta_id,forma_pagamento_id,forma_pagamento,descricao,parcela,total_parcelas,valor,valor_bruto,valor_liquido,vencimento,competencia,origem_tipo,origem_id) VALUES(v_clinica,p_unidade,p_paciente,p_profissional,p_conta,p_forma,coalesce(v_forma_nome,'A definir'),p_descricao,i,p_parcelas,v_valor,v_valor,v_valor,v_venc,date_trunc('month',v_venc)::date,p_origem_tipo,p_origem_id) RETURNING id INTO v_id;
  ELSE
   INSERT INTO financeiro_pagamentos(clinica_id,unidade_id,conta_id,forma_pagamento_id,descricao,valor,valor_bruto,valor_liquido,vencimento,competencia,origem_tipo,origem_id) VALUES(v_clinica,p_unidade,p_conta,p_forma,p_descricao,v_valor,v_valor,v_valor,v_venc,date_trunc('month',v_venc)::date,p_origem_tipo,p_origem_id) RETURNING id INTO v_id;
  END IF;
  v_ids:=array_append(v_ids,v_id);
 END LOOP;
 RETURN v_ids;
END $$;
REVOKE EXECUTE ON FUNCTION public.criar_lancamentos_parcelados(text,numeric,integer,date,integer,text,uuid,uuid,uuid,uuid,uuid,text,uuid) FROM PUBLIC,anon;GRANT EXECUTE ON FUNCTION public.criar_lancamentos_parcelados(text,numeric,integer,date,integer,text,uuid,uuid,uuid,uuid,uuid,text,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.aprovar_orcamento(p_orcamento uuid,p_parcelas integer,p_dia_vencimento integer,p_forma_pagamento text DEFAULT 'A definir',p_entrada numeric DEFAULT 0) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o orcamentos%ROWTYPE;v_total numeric(12,2);v_resto numeric(12,2);v_conta uuid;v_forma uuid;v_primeiro date;v_mes date;
BEGIN
 SELECT * INTO o FROM orcamentos WHERE id=p_orcamento FOR UPDATE;
 IF NOT FOUND OR o.clinica_id<>current_clinica_id() THEN RAISE EXCEPTION 'Orçamento não encontrado';END IF;
 IF NOT tem_papel('owner','admin','dentista','esteticista','recepcao','financeiro') THEN RAISE EXCEPTION 'Sem permissão para aprovar orçamentos';END IF;
 IF o.status<>'pendente' THEN RAISE EXCEPTION 'Somente orçamentos pendentes podem ser aprovados';END IF;
 IF o.validade IS NOT NULL AND o.validade<current_date THEN RAISE EXCEPTION 'Orçamento vencido';END IF;
 IF NOT EXISTS(SELECT 1 FROM orcamento_itens WHERE orcamento_id=o.id AND aprovado) THEN RAISE EXCEPTION 'Selecione ao menos um item';END IF;
 IF p_parcelas NOT BETWEEN 1 AND 48 OR p_dia_vencimento NOT BETWEEN 1 AND 31 THEN RAISE EXCEPTION 'Parcelamento inválido';END IF;
 SELECT round(coalesce(sum(quantidade*valor_unitario),0)-least(o.desconto,coalesce(sum(quantidade*valor_unitario),0)),2) INTO v_total FROM orcamento_itens WHERE orcamento_id=o.id AND aprovado;
 p_entrada:=round(coalesce(p_entrada,0),2);IF v_total<=0 OR p_entrada<0 OR p_entrada>v_total THEN RAISE EXCEPTION 'Valor ou entrada inválida';END IF;
 SELECT id INTO v_conta FROM plano_contas WHERE clinica_id=o.clinica_id AND tipo='receita' ORDER BY(nome='Receita de procedimentos')DESC,created_at LIMIT 1;
 SELECT id INTO v_forma FROM formas_pagamento WHERE clinica_id=o.clinica_id AND lower(nome)=lower(p_forma_pagamento) LIMIT 1;
 IF p_entrada>0 THEN INSERT INTO financeiro_recebimentos(clinica_id,paciente_id,orcamento_id,profissional_id,conta_id,forma_pagamento_id,forma_pagamento,descricao,parcela,total_parcelas,valor,valor_bruto,valor_liquido,vencimento,competencia,origem_tipo,origem_id) VALUES(o.clinica_id,o.paciente_id,o.id,o.profissional_id,v_conta,v_forma,p_forma_pagamento,format('Orçamento v%s — entrada',o.versao),1,p_parcelas+1,p_entrada,p_entrada,p_entrada,current_date,date_trunc('month',current_date)::date,'orcamento',o.id);END IF;
 v_resto:=v_total-p_entrada;
 IF v_resto>0 THEN v_mes:=date_trunc('month',current_date)::date+CASE WHEN p_entrada>0 OR p_dia_vencimento<extract(day from current_date) THEN interval '1 month' ELSE interval '0 month' END;v_primeiro:=v_mes+(least(p_dia_vencimento,extract(day from(v_mes+interval '1 month - 1 day'))::int)-1);PERFORM criar_lancamentos_parcelados('receber',v_resto,p_parcelas,v_primeiro,p_dia_vencimento,format('Orçamento v%s — tratamento',o.versao),o.unidade_id,o.paciente_id,o.profissional_id,v_conta,v_forma,'orcamento',o.id);END IF;
 UPDATE orcamento_itens SET status='recusado' WHERE orcamento_id=o.id AND NOT aprovado;UPDATE odontograma_marcacoes SET orcamento_id=NULL WHERE id IN(SELECT marcacao_id FROM orcamento_itens WHERE orcamento_id=o.id AND NOT aprovado AND marcacao_id IS NOT NULL);INSERT INTO tratamento_sessoes(clinica_id,orcamento_item_id,numero) SELECT o.clinica_id,i.id,1 FROM orcamento_itens i WHERE i.orcamento_id=o.id AND i.aprovado;UPDATE orcamentos SET status='aprovado' WHERE id=o.id;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='odontogestor-financeiro-diario') THEN
  PERFORM cron.schedule('odontogestor-financeiro-diario','5 3 * * *','SELECT public.atualizar_lancamentos_atrasados(); SELECT public.gerar_recorrencias_financeiras(current_date);');
 END IF;
END $$;