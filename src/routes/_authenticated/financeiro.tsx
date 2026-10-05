import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/app-shell";

const TITULOS: Record<string, [string, string]> = {
  financeiro: ["Financeiro", "Visão consolidada da operação financeira da clínica."],
  receber: ["A receber", "Parcelas, baixas parciais e recebimentos do dia."],
  pagar: ["A pagar", "Despesas, fornecedores e pagamentos da clínica."],
  caixa: ["Caixa diário", "Abertura, movimentações, conferência e fechamento por unidade."],
  contas: ["Contas e conciliação", "Contas financeiras e preparação da conciliação bancária."],
  comissoes: ["Comissões", "Regras, apuração e repasses aos profissionais."],
  dre: ["DRE gerencial", "Resultado por competência e por caixa."],
  fluxo: ["Fluxo de caixa", "Movimentação realizada e projeções futuras."],
  relatorios: ["Relatórios financeiros", "Indicadores gerenciais e exportações."],
  configuracoes: ["Configurações financeiras", "Formas de pagamento, centros de custo e plano de contas."],
};

export const Route = createFileRoute("/_authenticated/financeiro")({ component: LayoutFinanceiro });

function LayoutFinanceiro() {
  const slug = useRouterState({ select: (s) => s.location.pathname.split("/").filter(Boolean).at(-1) ?? "financeiro" });
  const [titulo, descricao] = TITULOS[slug] ?? TITULOS.financeiro;
  return <AppShell><PageHeader titulo={titulo} descricao={descricao} /><Outlet /></AppShell>;
}