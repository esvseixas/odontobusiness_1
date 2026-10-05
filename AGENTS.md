# Architecture rules

- Patient chart sections use nested routes under `/pacientes/$id/*`; this keeps each clinical section directly addressable and powers the dynamic main-menu submenu.- Multi-table business flows (onboarding, invite acceptance, budget approval) run as SECURITY DEFINER SQL RPCs; the browser never chains writes.
- Role checks use `tem_papel(...)` scoped to `current_clinica_id()`; area access for UI lives in `src/lib/permissoes.ts` and must mirror RLS.
- `auditoria_logs` is written only by the `auditar()` trigger; clients cannot insert.
- Clinical files live in the private `prontuario` Storage bucket under `{clinica_id}/{paciente_id}/...`; storage policies key off the first folder segment, and files are only archived (ativo=false), never deleted.
- Anamneses are append-only versions (`anamneses`); alerts are computed in the database from question `alerta` flags, and patients answer via token links through SECURITY DEFINER RPCs.
- Schedule conflicts are enforced by GiST exclusion constraints on `agendamentos`; UI translates them via `src/lib/erros.ts`.
- Treatment plans: orçamento generation, adjustment, approval, item status and patient acceptance run only through SECURITY DEFINER RPCs; item status changes sync the linked odontogram marking.
- Schedule rules beyond conflicts (working hours, blocks) are enforced by the `validar_agendamento` trigger; creation, recurrence, "atendido" billing and public booking/confirmation go through SECURITY DEFINER RPCs.
- Document templates use `{{var}}` placeholders resolved client-side before emission; emitted documents are immutable.
- Cancellations (orçamentos, lançamentos) go through `cancelar_orcamento` / `cancelar_lancamento` RPCs that require a reason; records are never deleted and cancelled entries are excluded from totals.
- Stock balance is the sum of `estoque_lotes.quantidade` (views `estoque_saldos`/`estoque_saldo_itens`); lots and movements are written only by SECURITY DEFINER RPCs built on `_estoque_mov`, and movements are immutable (trigger), corrected only by "ajuste".
- Consumption at attendance goes through `finalizar_atendimento` (status + billing + FEFO stock deduction in one transaction), idempotent via `estoque_baixas_atendimento`; applied lots are traced in `paciente_lotes_aplicados`.
- Platform administration uses a separate `platform_admins` identity and platform-only RPCs; it never grants cross-tenant access to clinical tables, protecting patient data.
