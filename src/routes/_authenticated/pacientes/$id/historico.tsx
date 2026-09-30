import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/historico")({
  head: () => ({
    meta: [
      { title: "Histórico do paciente | OdontoGestor" },
      { name: "description", content: "Linha do tempo de atendimentos e movimentações financeiras." },
      { property: "og:title", content: "Histórico do paciente | OdontoGestor" },
      { property: "og:description", content: "Linha do tempo de atendimentos e movimentações financeiras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistóricoPage,
});

function HistóricoPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="historico" />;
}
