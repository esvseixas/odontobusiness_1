import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableResponsesProvider } from "@/lib/ai-gateway.server";

const ResumoInput = z.object({
  pacienteId: z.string().uuid(),
  anotacoes: z.string().trim().min(10).max(5000),
});

function mensagemSegura(error: unknown) {
  if (!(error instanceof Error)) return "Não foi possível gerar o resumo clínico.";
  const mensagem = error.message.trim();
  return mensagem || "Não foi possível gerar o resumo clínico.";
}

export const gerarResumoClinico = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ResumoInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("clinica_id")
      .eq("id", context.userId)
      .single();

    if (profileError || !profile?.clinica_id) throw new Error("Clínica do profissional não encontrada.");

    const { data: roles, error: rolesError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (rolesError) throw new Error("Não foi possível validar a permissão do profissional.");
    const podeGerar = (roles ?? []).some(({ role }) => role === "owner" || role === "dentista");
    if (!podeGerar) throw new Error("Somente proprietários e dentistas podem gerar resumos clínicos.");

    const [paciente, evolucoes, marcacoes, agendamentos] = await Promise.all([
      context.supabase
        .from("pacientes")
        .select("id,clinica_id,anamnese,observacoes")
        .eq("id", data.pacienteId)
        .eq("clinica_id", profile.clinica_id)
        .maybeSingle(),
      context.supabase
        .from("evolucoes_clinicas")
        .select("texto,created_at,autor_nome")
        .eq("paciente_id", data.pacienteId)
        .eq("clinica_id", profile.clinica_id)
        .order("created_at", { ascending: false })
        .limit(12),
      context.supabase
        .from("odontograma_marcacoes")
        .select("dente,face,condicao,status,observacao,created_at")
        .eq("paciente_id", data.pacienteId)
        .eq("clinica_id", profile.clinica_id)
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(40),
      context.supabase
        .from("agendamentos")
        .select("inicio,status,observacoes,procedimentos(nome)")
        .eq("paciente_id", data.pacienteId)
        .eq("clinica_id", profile.clinica_id)
        .order("inicio", { ascending: false })
        .limit(10),
    ]);

    if (paciente.error || !paciente.data) throw new Error("Paciente não encontrado nesta clínica.");

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("O recurso de IA ainda não está configurado para esta aplicação.");

    const contexto = {
      anotacoesDoProfissional: data.anotacoes,
      anamnese: paciente.data.anamnese,
      observacoesCadastrais: paciente.data.observacoes,
      evolucoesRecentes: evolucoes.data ?? [],
      odontogramaAtivo: marcacoes.data ?? [],
      atendimentosRecentes: agendamentos.data ?? [],
    };

    try {
      const { model } = createLovableResponsesProvider(apiKey);
      const result = streamText({
        model,
        system: [
          "Você auxilia profissionais de odontologia a redigir um resumo objetivo de atendimento.",
          "Escreva em português do Brasil, em texto clínico conciso e organizado.",
          "Use somente os fatos fornecidos. Não invente diagnóstico, conduta, medicamento ou resultado.",
          "Diferencie achados, procedimentos realizados, plano/pendências e orientações quando houver dados.",
          "Não inclua nome, CPF, telefone ou outros identificadores do paciente.",
          "Não mencione IA e não inclua avisos; a revisão profissional acontece na interface.",
        ].join(" "),
        prompt: `Produza o resumo clínico objetivo a partir deste contexto:\n${JSON.stringify(contexto)}`,
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "medium",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });

      const resumo = (await result.text).trim();
      if (!resumo) throw new Error("A IA concluiu a análise sem produzir um resumo.");
      return { resumo };
    } catch (error) {
      throw new Error(mensagemSegura(error));
    }
  });