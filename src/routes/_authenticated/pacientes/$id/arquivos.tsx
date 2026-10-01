import { createFileRoute } from "@tanstack/react-router";
import { Prontuario } from "@/components/prontuario";

export const Route = createFileRoute("/_authenticated/pacientes/$id/arquivos")({
  head: () => ({
    meta: [
      { title: "Arquivos e imagens do paciente | OdontoGestor" },
      { name: "description", content: "Radiografias, tomografias, fotos e documentos do prontuário." },
      { property: "og:title", content: "Arquivos e imagens do paciente | OdontoGestor" },
      { property: "og:description", content: "Radiografias, tomografias, fotos e documentos do prontuário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArquivosPage,
});

function ArquivosPage() {
  const { id } = Route.useParams();
  return <Prontuario id={id} secao="arquivos" />;
}
