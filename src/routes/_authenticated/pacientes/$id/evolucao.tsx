import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/evolucao")({
  head: () => ({
    meta: [
      { title: "Evolução clínica do paciente | OdontoGestor" },
      { name: "description", content: "Registros clínicos imutáveis e resumo assistido por IA." },
      { property: "og:title", content: "Evolução clínica do paciente | OdontoGestor" },
      { property: "og:description", content: "Registros clínicos imutáveis e resumo assistido por IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EvoluçãoclínicaPage,
});

function EvoluçãoclínicaPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="evolucao" />;
}
