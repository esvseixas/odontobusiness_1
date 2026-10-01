# Fase 0 — Segurança e integridade

Objetivo: fechar brechas entre clínicas e de autopromoção antes de dados reais, sem perder dados da DEMO nem quebrar telas atuais.

## O que muda para o usuário
- Onboarding cria a clínica em um único passo seguro (tudo ou nada).
- Configurações → Equipe ganha **Convidar membro** (e-mail, papel, validade 7 dias), lista de convites pendentes com copiar link / revogar, e página pública `/convite/$token` para aceitar (entra/cria conta e vincula à clínica).
- Menu lateral e páginas passam a respeitar o papel (ex.: Financeiro só para owner/admin/financeiro; Configurações só owner/admin). Acesso direto a página proibida mostra "Sem permissão".
- Aprovar orçamento passa a gerar parcelas corretas (centavos na última, fim de mês respeitado, profissional gravado para comissões).
- Exclusões de pacientes, odontograma, documentos, orçamentos aprovados e lançamentos pagos são bloqueadas; passam a usar cancelamento/inativação com motivo.
- Auditoria passa a ser gravada automaticamente pelo banco.

## Detalhes técnicos

### Migration 1 — papéis e has_role por clínica
- `ALTER TYPE app_role ADD VALUE` admin, esteticista, auxiliar, estoque, marketing.
- `user_roles`: backfill `clinica_id` a partir de profiles; trocar UNIQUE(user_id, role) por UNIQUE(user_id, clinica_id, role).
- Nova `has_role(_user uuid, _role app_role, _clinica uuid)` + helper `tem_papel(variadic app_role[])` usando `current_clinica_id()`. Manter a versão antiga de 2 args delegando para a clínica atual (compatibilidade).

### Migration 2 — perfis, papéis, clínicas
- profiles: remover "own profile update" e recriar permitindo update só se `clinica_id`/`unidade_id` não mudarem (trigger BEFORE UPDATE que bloqueia alteração desses campos fora de funções SECURITY DEFINER).
- user_roles: remover "roles insert self"; insert/update/delete apenas owner/admin da mesma clínica, nunca o próprio papel owner.
- clinicas: remover insert `with_check true` (criação só via RPC).
- RPC `criar_clinica(nome, cnpj, telefone, endereco, regime, unidade, profissional, cro)` SECURITY DEFINER: valida que o usuário não tem clínica, cria clínica, vincula perfil, papel owner, unidade, procedimentos e plano de contas padrão, profissional opcional.

### Migration 3 — convites
- Tabela `convites` (id, clinica_id NOT NULL, email, papel, token único, expira_em, aceito_em, aceito_por, criado_por, revogado_em, created_at) com GRANT, RLS (owner/admin da clínica).
- RPC `aceitar_convite(token)`: valida e-mail do usuário, validade e não-uso; vincula perfil e cria papel. RPC `ver_convite(token)` para a página pública mostrar clínica e papel.

### Migration 4 — RLS por papel e imutabilidade
- Financeiro (recebimentos, pagamentos, plano_contas): select/escrita owner/admin/financeiro; recepção lê recebimentos (resumo).
- Clínico (evoluções, odontograma, documentos): escrita owner/admin/dentista/esteticista/auxiliar; leitura equipe clínica + recepção conforme o caso.
- Estoque: escrita owner/admin/estoque/auxiliar.
- Configuração (unidades, procedimentos, convênios, profissionais): escrita owner/admin.
- DELETE removido de pacientes, odontograma_marcacoes, documentos_emitidos; orçamentos e lançamentos só deletáveis se não aprovados/pagos. Adicionar colunas `cancelado_motivo`, `cancelado_em` onde faltar.

### Migration 5 — auditoria por trigger
- Função `auditar()` genérica (usuário, ação, tabela, registro, antes/depois em jsonb) em INSERT/UPDATE/DELETE das tabelas sensíveis.
- Revogar INSERT de auditoria_logs para authenticated; remover inserts do front.

### Migration 6 — aprovar_orcamento
- RPC `aprovar_orcamento(orcamento_id, parcelas, dia_vencimento, forma_pagamento, entrada)`: valida status pendente e papel, numeric(12,2), última parcela absorve diferença, vencimento limitado ao último dia do mês, grava profissional_id, muda status.

### Front-end
- `onboarding.tsx` → `supabase.rpc('criar_clinica')`.
- Fluxo de aprovação de orçamento no prontuário → `rpc('aprovar_orcamento')` com diálogo (parcelas, dia, forma, entrada).
- Remover inserts em auditoria_logs no front; trocar exclusões bloqueadas por cancelar/inativar.
- `useSessao` com papéis da clínica atual; mapa de permissões compartilhado; filtro de itens no app-shell e componente de guarda nas rotas restritas.
- EquipePage: convites; nova rota pública `/convite/$token`.
- `resumo-clinico.functions.ts`: checar papel com `clinica_id` atual.

### Encerramento
- Validar no navegador (onboarding com conta de teste, convite, aprovação de orçamento, menus por papel), remover dados de teste, rodar varredura de segurança, atualizar roadmap.md e AGENTS.md.
