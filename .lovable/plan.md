# Fase 3 — Financeiro e contábil simples

## Objetivo
Evoluir o financeiro existente sem interromper orçamento, compras, laboratório, estoque ou cancelamentos. A entrega será incremental e manterá os lançamentos atuais, migrando-os para a nova estrutura.

## 1. Base financeira e migração segura
- Criar contas financeiras, formas de pagamento configuráveis, centros de custo e plano de contas hierárquico.
- Acrescentar códigos, natureza e conta-pai ao plano atual; criar os grupos padrão e vincular as contas existentes.
- Migrar os textos de forma de pagamento para registros configuráveis, mantendo o campo antigo apenas para compatibilidade.
- Criar saldo por conta como cálculo de movimentos confirmados, nunca como valor editável.
- Restringir leitura e escrita por clínica e papel: gestão financeira completa para proprietário, administrador e financeiro; recepção apenas no caixa e recebimentos do dia; profissionais apenas nas próprias comissões.

## 2. Lançamentos e baixas
- Acrescentar competência, conta financeira, centro de custo, forma de pagamento, bruto, taxa, líquido, juros, multa, desconto, valor pago, previsão de crédito, recorrência e comprovante.
- Criar baixas imutáveis para pagamentos parciais e estornos com motivo, recalculando status e valor pago no banco.
- Criar uma função transacional única para parcelamento, com soma exata e vencimento ajustado ao último dia de cada mês.
- Atualizar aprovação de orçamento, ortodontia, atendimento, pedido de compra e laboratório para preencher a nova estrutura sem quebrar as assinaturas atuais.
- Atualizar atrasados diariamente no banco e impedir exclusão de lançamentos pagos.

## 3. Caixa diário
- Criar sessões por unidade e operador, com abertura, conferência e fechamento.
- Vincular recebimentos presenciais à sessão aberta e registrar dinheiro, PIX e cartão por forma de pagamento.
- Implementar suprimento e sangria como movimentos imutáveis, com justificativa e auditoria.

## 4. Comissões e repasses
- Criar regras por profissional, procedimento ou especialidade, com base bruta, líquida ou fixa e gatilho por recebimento ou execução.
- Apurar mensalmente no banco, incluindo parcelas de orçamentos e custo real de materiais da Fase 2.
- Permitir conferência e aprovação; a aprovação gera uma conta a pagar ao profissional em uma única operação.
- Remover o cálculo de comissão feito no navegador e limitar cada profissional aos próprios valores.

## 5. DRE, fluxo e indicadores
- Criar funções SQL para DRE por competência e caixa, fluxo realizado/projetado e indicadores.
- Incluir impostos estimados configuráveis, materiais reais, laboratório, comissão e taxas de pagamento.
- Permitir filtros por unidade, profissional, especialidade e período, além de comparação mensal.
- Calcular faturamento, ticket médio, conversão, margem por procedimento e inadimplência no banco.

## 6. Conciliação, NFS-e e contador
- Criar importações bancárias, itens de extrato e conciliações com sugestão por valor e data de até três dias.
- Permitir conciliação manual e criação transacional de lançamento a partir do extrato.
- Criar configuração fiscal e registros de NFS-e com provedor plugável; sem chave configurada, o envio permanecerá visivelmente desativado.
- Exportar mensalmente receitas, despesas, notas e repasses em CSV compatível com Excel.
- Guardar comprovantes e arquivos financeiros em área privada por clínica.

## 7. Interface e navegação
- Transformar Financeiro em grupo recolhível com: Visão geral, A receber, A pagar, Caixa, Contas e conciliação, Comissões, DRE, Fluxo de caixa, Relatórios e Configurações financeiras.
- Criar páginas próprias, responsivas e em português, com filtros e paginação no servidor.
- Aplicar menus e bloqueios visuais coerentes com as regras do banco; recepção não verá contas a pagar, DRE ou comissões.
- Manter ações de cancelamento com motivo e substituir “quitar” por baixa parcial/total auditável.

## Validação
- Testar soma exata de parcelas e datas no fim do mês.
- Testar baixa parcial, fechamento de caixa, apuração de comissão e DRE por competência.
- Confirmar isolamento entre clínicas e permissões de recepção, financeiro e profissional.
- Validar as páginas em desktop e celular, verificar segurança e remover todos os dados de teste.
- Atualizar o roteiro marcando cada bloco concluído e informar claramente qualquer bloco não finalizado.

## Decisões técnicas
- Mudanças de banco serão somente aditivas; campos antigos ficam marcados como compatibilidade até deixarem de ser usados.
- Fluxos que afetam várias tabelas serão funções transacionais no banco.
- Relatórios e totais serão calculados no banco, não no navegador.
- Valores monetários usarão duas casas; custos unitários de estoque já existentes manterão sua precisão própria.
