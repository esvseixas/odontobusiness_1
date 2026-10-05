import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  CalendarDays,
  TrendingUp,
  UserX,
  Receipt,
  Users,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { brl, horaBR, isoDia } from "@/lib/format";
import { ResumoAlertasEstoque } from "@/components/estoque/alertas";
import { podeAcessar } from "@/lib/permissoes";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel gerencial | OdontoGestor" },
      { name: "description", content: "Indicadores de faturamento, agenda, faltas e orçamentos da clínica." },
      { property: "og:title", content: "Painel gerencial | OdontoGestor" },
      { property: "og:description", content: "Indicadores de faturamento, agenda, faltas e orçamentos da clínica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: sessao, isLoading } = useSessao();
  const navigate = useNavigate();
  const clinicaId = sessao?.clinicaId;

  useEffect(() => {
    if (!isLoading && sessao && !sessao.clinicaId) navigate({ to: "/onboarding", replace: true });
  }, [isLoading, sessao, navigate]);

  const { data } = useQuery({
    enabled: !!clinicaId,
    queryKey: ["dashboard", clinicaId],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const diaIni = new Date(hoje); diaIni.setHours(0, 0, 0, 0);
      const diaFim = new Date(hoje); diaFim.setHours(23, 59, 59, 999);

      const [recebidos, aReceber, agendaHoje, mesAgenda, pacientes, orcamentos, atrasados] =
        await Promise.all([
          supabase.from("financeiro_recebimentos").select("valor").eq("status", "pago")
            .gte("vencimento", isoDia(inicioMes)).lte("vencimento", isoDia(fimMes)),
          supabase.from("financeiro_recebimentos").select("valor").eq("status", "pendente"),
          supabase.from("agendamentos")
            .select("id,inicio,status,pacientes(nome),profissionais(nome)")
            .gte("inicio", diaIni.toISOString()).lte("inicio", diaFim.toISOString())
            .order("inicio"),
          supabase.from("agendamentos").select("status")
            .gte("inicio", inicioMes.toISOString()).lte("inicio", fimMes.toISOString()),
          supabase.from("pacientes").select("id", { count: "exact", head: true }).eq("ativo", true),
          supabase.from("orcamentos").select("id,status,valor_total,created_at,pacientes(nome)")
            .order("created_at", { ascending: false }).limit(6),
          supabase.from("financeiro_recebimentos").select("valor").eq("status", "pendente")
            .lt("vencimento", isoDia(hoje)),
        ]);

      const soma = (rows: { valor: number }[] | null) =>
        (rows ?? []).reduce((s, r) => s + Number(r.valor), 0);

      const statusMes = mesAgenda.data ?? [];
      const faltas = statusMes.filter((a) => a.status === "faltou").length;
      const atendidos = statusMes.filter((a) => a.status === "atendido").length;
      const receitaMes = soma(recebidos.data as never);

      return {
        receitaMes,
        aReceber: soma(aReceber.data as never),
        inadimplencia: soma(atrasados.data as never),
        agendaHoje: agendaHoje.data ?? [],
        totalMes: statusMes.length,
        faltas,
        taxaFaltas: statusMes.length ? Math.round((faltas / statusMes.length) * 100) : 0,
        ticket: atendidos ? receitaMes / atendidos : 0,
        pacientes: pacientes.count ?? 0,
        orcamentos: orcamentos.data ?? [],
        pendentes: (orcamentos.data ?? []).filter((o) => o.status === "pendente").length,
      };
    },
  });

  const kpis = [
    { label: "Faturamento do mês", valor: brl(data?.receitaMes), icon: TrendingUp },
    { label: "A receber em aberto", valor: brl(data?.aReceber), icon: Receipt },
    { label: "Inadimplência", valor: brl(data?.inadimplencia), icon: AlertTriangle },
    { label: "Ticket médio", valor: brl(data?.ticket), icon: TrendingUp },
    { label: "Taxa de faltas (mês)", valor: `${data?.taxaFaltas ?? 0}%`, icon: UserX },
    { label: "Pacientes ativos", valor: String(data?.pacientes ?? 0), icon: Users },
  ];

  return (
    <AppShell>
      <PageHeader
        titulo={`Olá, ${sessao?.profile?.nome || "bem-vindo"}`}
        descricao="Visão geral da operação da clínica hoje."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="flex items-center justify-between pt-6">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{k.valor}</p>
                </div>
                <Icon className="h-8 w-8 text-primary/40" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {podeAcessar("/estoque", sessao?.papeis ?? []) && <ResumoAlertasEstoque />}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Agenda de hoje</CardTitle>
            <Link to="/agenda" className="text-sm text-primary hover:underline">Ver agenda</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.agendaHoje ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum atendimento agendado para hoje.</p>
            ) : (
              data?.agendaHoje.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{a.pacientes?.nome ?? "Sem paciente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {horaBR(a.inicio)} · {a.profissionais?.nome ?? "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{a.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Orçamentos recentes</CardTitle>
            <Badge variant="outline">{data?.pendentes ?? 0} pendentes</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.orcamentos ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum orçamento criado ainda.</p>
            ) : (
              data?.orcamentos.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{o.pacientes?.nome ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{brl(Number(o.valor_total))}</p>
                  </div>
                  <Badge variant={o.status === "aprovado" ? "default" : "secondary"}>{o.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
