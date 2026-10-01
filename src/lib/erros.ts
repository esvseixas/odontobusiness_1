/** Traduz erros do banco em mensagens claras para a equipe. */
export function mensagemErro(e: unknown): string {
  const err = e as { message?: string; code?: string };
  const msg = err?.message ?? String(e);
  if (err?.code === "23P01" || msg.includes("sem_conflito")) {
    if (msg.includes("profissional")) return "Conflito de horário: o profissional já tem atendimento nesse período.";
    if (msg.includes("paciente")) return "Conflito de horário: o paciente já está agendado nesse período.";
    if (msg.includes("cadeira")) return "Conflito de horário: a cadeira/sala já está ocupada nesse período.";
    return "Conflito de horário com outro agendamento.";
  }
  if (msg.includes("periodo_valido")) return "O horário de término deve ser depois do início.";
  if (msg.includes("row-level security")) return "Seu papel não tem permissão para esta ação.";
  return msg;
}
