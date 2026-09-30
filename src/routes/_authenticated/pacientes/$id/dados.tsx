import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/dados")({
  head: () => ({
    meta: [
      { title: "Dados e anamnese do paciente | OdontoGestor" },
      { name: "description", content: "Dados cadastrais, consentimento e anamnese do paciente." },
      { property: "og:title", content: "Dados e anamnese do paciente | OdontoGestor" },
      { property: "og:description", content: "Dados cadastrais, consentimento e anamnese do paciente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DadoseanamnesePage,
});

function DadoseanamnesePage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="dados" />;
}
