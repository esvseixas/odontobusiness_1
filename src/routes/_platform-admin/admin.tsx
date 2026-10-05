import { createFileRoute } from "@tanstack/react-router";

import { PainelAdminPlataforma } from "@/components/admin-plataforma/painel";

export const Route = createFileRoute("/_platform-admin/admin")({
  head: () => ({
    meta: [
      { title: "Administração geral | OdontoGestor" },
      { name: "description", content: "Gestão restrita de clientes, assinaturas e suporte do OdontoGestor." },
      { property: "og:title", content: "Administração geral | OdontoGestor" },
      { property: "og:description", content: "Gestão restrita de clientes e assinaturas do OdontoGestor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PainelAdminPlataforma,
});