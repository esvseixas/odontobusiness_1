import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | OdontoGestor" },
      {
        name: "description",
        content: "Unidades, procedimentos, convênios, profissionais, plano de contas e auditoria.",
      },
      { property: "og:title", content: "Configurações | OdontoGestor" },
      {
        property: "og:description",
        content: "Unidades, procedimentos, convênios, profissionais e auditoria.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConfiguracoesLayout,
});

const TITULOS: Record<string, { titulo: string; descricao: string }> = {
  clinica: { titulo: "Clínica", descricao: "Dados cadastrais e fiscais." },
  unidades: { titulo: "Unidades", descricao: "Endereços e unidades da rede." },
  procedimentos: { titulo: "Procedimentos", descricao: "Tabela de serviços e valores." },
  convenios: { titulo: "Convênios", descricao: "Planos e convênios aceitos." },
  equipe: { titulo: "Equipe", descricao: "Profissionais e usuários com acesso." },
  "plano-contas": {
    titulo: "Plano de contas",
    descricao: "Categorias financeiras e centros de custo.",
  },
  estoque: { titulo: "Estoque", descricao: "Produtos, lotes, quantidades e validades." },
  auditoria: { titulo: "Auditoria", descricao: "Histórico de atividades da clínica." },
};

function ConfiguracoesLayout() {
  const pathname = useRouterState({ select: (estado) => estado.location.pathname });
  const slug = pathname.split("/").filter(Boolean).at(-1) ?? "clinica";
  const cabecalho = TITULOS[slug] ?? TITULOS.clinica;
  return (
    <AppShell>
      <PageHeader titulo={cabecalho.titulo} descricao={cabecalho.descricao} />
      <Outlet />
    </AppShell>
  );
}
