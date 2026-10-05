CREATE OR REPLACE FUNCTION public.aprovar_orcamento(p_orcamento uuid,p_parcelas integer,p_dia_vencimento integer,p_forma_pagamento text DEFAULT 'A definir',p_entrada numeric DEFAULT 0) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o orcamentos%ROWTYPE;v_total numeric(12,2);v_resto numeric(12,2);v_conta uuid;v_forma uuid;v_primeiro date;v_mes date;v_unidade uuid;
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
 SELECT unidade_id INTO v_unidade FROM pacientes WHERE id=o.paciente_id;
 SELECT id INTO v_conta FROM plano_contas WHERE clinica_id=o.clinica_id AND tipo='receita' ORDER BY(nome='Receita de procedimentos')DESC,created_at LIMIT 1;
 SELECT id INTO v_forma FROM formas_pagamento WHERE clinica_id=o.clinica_id AND lower(nome)=lower(p_forma_pagamento) LIMIT 1;
 IF p_entrada>0 THEN INSERT INTO financeiro_recebimentos(clinica_id,unidade_id,paciente_id,orcamento_id,profissional_id,conta_id,forma_pagamento_id,forma_pagamento,descricao,parcela,total_parcelas,valor,valor_bruto,valor_liquido,vencimento,competencia,origem_tipo,origem_id) VALUES(o.clinica_id,v_unidade,o.paciente_id,o.id,o.profissional_id,v_conta,v_forma,p_forma_pagamento,format('Orçamento v%s — entrada',o.versao),1,p_parcelas+1,p_entrada,p_entrada,p_entrada,current_date,date_trunc('month',current_date)::date,'orcamento',o.id);END IF;
 v_resto:=v_total-p_entrada;
 IF v_resto>0 THEN v_mes:=date_trunc('month',current_date)::date+CASE WHEN p_entrada>0 OR p_dia_vencimento<extract(day from current_date) THEN interval '1 month' ELSE interval '0 month' END;v_primeiro:=v_mes+(least(p_dia_vencimento,extract(day from(v_mes+interval '1 month - 1 day'))::int)-1);PERFORM criar_lancamentos_parcelados('receber',v_resto,p_parcelas,v_primeiro,p_dia_vencimento,format('Orçamento v%s — tratamento',o.versao),v_unidade,o.paciente_id,o.profissional_id,v_conta,v_forma,'orcamento',o.id);END IF;
 UPDATE orcamento_itens SET status='recusado' WHERE orcamento_id=o.id AND NOT aprovado;UPDATE odontograma_marcacoes SET orcamento_id=NULL WHERE id IN(SELECT marcacao_id FROM orcamento_itens WHERE orcamento_id=o.id AND NOT aprovado AND marcacao_id IS NOT NULL);INSERT INTO tratamento_sessoes(clinica_id,orcamento_item_id,numero) SELECT o.clinica_id,i.id,1 FROM orcamento_itens i WHERE i.orcamento_id=o.id AND i.aprovado;UPDATE orcamentos SET status='aprovado' WHERE id=o.id;
END $$;