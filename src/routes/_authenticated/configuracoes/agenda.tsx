import { createFileRoute } from "@tanstack/react-router";
import { AgendaConfigPage } from "@/components/configuracoes/extras";
export const Route = createFileRoute("/_authenticated/configuracoes/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda e horários | OdontoGestor" },
      { name: "description", content: "Salas, expediente, bloqueios e agendamento online." },
      { property: "og:title", content: "Agenda e horários | OdontoGestor" },
      { property: "og:description", content: "Salas, expediente, bloqueios e agendamento online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AgendaConfigPage,
});
