# Architecture rules

- Patient chart sections use nested routes under `/pacientes/$id/*`; this keeps each clinical section directly addressable and powers the dynamic main-menu submenu.- Multi-table business flows (onboarding, invite acceptance, budget approval) run as SECURITY DEFINER SQL RPCs; the browser never chains writes.
- Role checks use `tem_papel(...)` scoped to `current_clinica_id()`; area access for UI lives in `src/lib/permissoes.ts` and must mirror RLS.
- `auditoria_logs` is written only by the `auditar()` trigger; clients cannot insert.
