import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  Wallet,
  Settings,
  LogOut,
  Stethoscope,
  Menu,
  ChevronDown,
  Building2,
  MapPin,
  ClipboardList,
  HeartHandshake,
  UserCog,
  ListTree,
  PackageOpen,
  ShieldCheck,
  List,
  Receipt,
  ClipboardPlus,
  FileText,
  History,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
] as const;

const PACIENTE_NAV = [
  { slug: "odontograma", label: "Odontograma", icon: Stethoscope },
  { slug: "orcamentos", label: "Orçamentos", icon: Receipt },
  { slug: "evolucao", label: "Evolução clínica", icon: ClipboardPlus },
  { slug: "documentos", label: "Documentos", icon: FileText },
  { slug: "historico", label: "Histórico", icon: History },
  { slug: "dados", label: "Dados e anamnese", icon: UserRound },
] as const;

const CONFIG_NAV = [
  { to: "/configuracoes/clinica", label: "Clínica", icon: Building2 },
  { to: "/configuracoes/unidades", label: "Unidades", icon: MapPin },
  { to: "/configuracoes/procedimentos", label: "Procedimentos", icon: ClipboardList },
  { to: "/configuracoes/convenios", label: "Convênios", icon: HeartHandshake },
  { to: "/configuracoes/equipe", label: "Equipe", icon: UserCog },
  { to: "/configuracoes/plano-contas", label: "Plano de contas", icon: ListTree },
  { to: "/configuracoes/estoque", label: "Estoque", icon: PackageOpen },
  { to: "/configuracoes/auditoria", label: "Auditoria", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: sessao } = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [menuOculto, setMenuOculto] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pacientesAtiva = pathname.startsWith("/pacientes");
  const pacienteId = pathname.match(/^\/pacientes\/([^/]+)/)?.[1];
  const [pacientesAberta, setPacientesAberta] = useState(pacientesAtiva);
  const configuracoesAtiva = pathname.startsWith("/configuracoes");
  const [configuracoesAberta, setConfiguracoesAberta] = useState(configuracoesAtiva);

  useEffect(() => {
    if (pacientesAtiva) setPacientesAberta(true);
  }, [pacientesAtiva, pacienteId]);

  const pacienteAtual = useQuery({
    enabled: !!pacienteId,
    queryKey: ["menu-paciente", pacienteId],
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("nome").eq("id", pacienteId ?? "").maybeSingle();
      return data;
    },
  });

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r bg-card transition-transform md:static md:translate-x-0",
          aberto ? "translate-x-0" : "-translate-x-full",
          menuOculto && "md:hidden",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{sessao?.clinica?.nome ?? "Odonto"}</p>
            <p className="text-xs text-muted-foreground">Gestão clínica</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const ativo = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setAberto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  ativo
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-9 w-full justify-start gap-3 px-3 text-sm font-medium",
                pacientesAtiva ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
              aria-expanded={pacientesAberta}
              onClick={() => setPacientesAberta((valor) => !valor)}
            >
              <Users className="h-4 w-4" />
              <span className="flex-1 text-left">Pacientes</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", pacientesAberta && "rotate-180")} />
            </Button>
            {pacientesAberta ? (
              <div className="ml-5 mt-1 space-y-0.5 border-l pl-2">
                <Link
                  to="/pacientes"
                  activeOptions={{ exact: true }}
                  onClick={() => setAberto(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    pathname === "/pacientes" || pathname === "/pacientes/"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  Lista de pacientes
                </Link>
                {pacienteId ? (
                  <>
                    <p className="truncate px-2 pb-1 pt-2 text-xs font-semibold text-foreground" title={pacienteAtual.data?.nome ?? "Prontuário"}>
                      {pacienteAtual.data?.nome ?? "Prontuário"}
                    </p>
                    {PACIENTE_NAV.map((item) => {
                      const Icon = item.icon;
                      const ativo = pathname === `/pacientes/${pacienteId}/${item.slug}`;
                      return (
                        <Link
                          key={item.slug}
                          to={`/pacientes/$id/${item.slug}`}
                          params={{ id: pacienteId }}
                          onClick={() => setAberto(false)}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                            ativo
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <div>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                "h-9 w-full justify-start gap-3 px-3 text-sm font-medium",
                configuracoesAtiva ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
              aria-expanded={configuracoesAberta}
              onClick={() => setConfiguracoesAberta((valor) => !valor)}
            >
              <Settings className="h-4 w-4" />
              <span className="flex-1 text-left">Configurações</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", configuracoesAberta && "rotate-180")}
              />
            </Button>
            {configuracoesAberta ? (
              <div className="ml-5 mt-1 space-y-0.5 border-l pl-2">
                {CONFIG_NAV.map((item) => {
                  const Icon = item.icon;
                  const ativo = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setAberto(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                        ativo
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t p-3">
          <p className="truncate px-2 pb-2 text-xs text-muted-foreground">
            {sessao?.profile?.nome || sessao?.user?.email}
            {sessao?.papeis?.length ? ` · ${sessao.papeis.join(", ")}` : ""}
          </p>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={sair}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      {aberto ? (
        <button
          type="button"
          aria-label="Fechar menu principal"
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setAberto(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={aberto ? "Fechar menu principal" : "Abrir menu principal"}
            title={aberto ? "Fechar menu principal" : "Abrir menu principal"}
            onClick={() => setAberto((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            aria-label={menuOculto ? "Mostrar menu principal" : "Esconder menu principal"}
            title={menuOculto ? "Mostrar menu principal" : "Esconder menu principal"}
            onClick={() => setMenuOculto((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold">{sessao?.clinica?.nome ?? "Odonto"}</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? <p className="text-sm text-muted-foreground">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
