import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Headphones,
  LogOut,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { brl, dataBR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Cliente = {
  clinica_id: string;
  clinica_nome: string;
  cnpj: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  criado_em: string;
  plano: "solo" | "clinica" | "rede";
  status: "teste" | "ativo" | "inadimplente" | "suspenso" | "cancelado" | "cortesia";
  ciclo: "mensal" | "anual";
  valor_mensal: number;
  trial_ate: string | null;
  proxima_cobranca: string | null;
  motivo_status: string | null;
  unidades: number;
  usuarios: number;
  responsavel: string | null;
  responsavel_email: string | null;
};

type Resumo = {
  clientes: number;
  ativos: number;
  testes: number;
  suspensos: number;
  inadimplentes: number;
  mrr: number;
  vencimentos_7d: number;
};

const statusLabels: Record<Cliente["status"], string> = {
  teste: "Em teste",
  ativo: "Ativo",
  inadimplente: "Inadimplente",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
  cortesia: "Cortesia",
};

const planoLabels: Record<Cliente["plano"], string> = {
  solo: "Solo",
  clinica: "Clínica",
  rede: "Rede",
};

function statusVariant(status: Cliente["status"]): "default" | "secondary" | "destructive" | "outline" {
  if (status === "ativo" || status === "cortesia") return "default";
  if (status === "suspenso" || status === "cancelado" || status === "inadimplente") return "destructive";
  return "secondary";
}

export function PainelAdminPlataforma() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Cliente | null>(null);
  const [nota, setNota] = useState("");
  const [form, setForm] = useState({ plano: "solo", status: "teste", ciclo: "mensal", valor: "119.90", trial: "", cobranca: "", motivo: "" });

  const resumo = useQuery({
    queryKey: ["plataforma-resumo"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("resumo_admin_plataforma");
      if (error) throw error;
      return data as unknown as Resumo;
    },
  });

  const clientes = useQuery({
    queryKey: ["plataforma-clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("listar_clientes_plataforma", { p_busca: null });
      if (error) throw error;
      return (data ?? []) as Cliente[];
    },
  });

  const notas = useQuery({
    enabled: !!selecionado,
    queryKey: ["plataforma-notas", selecionado?.clinica_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suporte_notas")
        .select("id,nota,created_at")
        .eq("clinica_id", selecionado?.clinica_id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return clientes.data ?? [];
    return (clientes.data ?? []).filter((cliente) =>
      [cliente.clinica_nome, cliente.cnpj, cliente.contato_email, cliente.responsavel, cliente.responsavel_email]
        .some((valor) => valor?.toLocaleLowerCase("pt-BR").includes(termo)),
    );
  }, [busca, clientes.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!selecionado) return;
      const { error } = await supabase.rpc("gerenciar_assinatura", {
        p_clinica: selecionado.clinica_id,
        p_plano: form.plano,
        p_status: form.status,
        p_ciclo: form.ciclo,
        p_valor: Number(form.valor),
        p_trial_ate: form.trial || null,
        p_proxima_cobranca: form.cobranca || null,
        p_motivo: form.motivo || null,
      });
      if (error) throw error;
      if (nota.trim()) {
        const { error: notaError } = await supabase.rpc("adicionar_nota_suporte", {
          p_clinica: selecionado.clinica_id,
          p_nota: nota.trim(),
        });
        if (notaError) throw notaError;
      }
    },
    onSuccess: async () => {
      toast.success("Assinatura atualizada");
      setSelecionado(null);
      setNota("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["plataforma-resumo"] }),
        queryClient.invalidateQueries({ queryKey: ["plataforma-clientes"] }),
      ]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar"),
  });

  function abrir(cliente: Cliente) {
    setSelecionado(cliente);
    setNota("");
    setForm({
      plano: cliente.plano,
      status: cliente.status,
      ciclo: cliente.ciclo,
      valor: String(cliente.valor_mensal),
      trial: cliente.trial_ate ?? "",
      cobranca: cliente.proxima_cobranca ?? "",
      motivo: cliente.motivo_status ?? "",
    });
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const indicadores = [
    { label: "Clientes", valor: resumo.data?.clientes ?? 0, icon: Building2 },
    { label: "Ativos", valor: resumo.data?.ativos ?? 0, icon: Activity },
    { label: "Em teste", valor: resumo.data?.testes ?? 0, icon: CalendarClock },
    { label: "MRR estimada", valor: brl(resumo.data?.mrr), icon: CircleDollarSign },
    { label: "Inadimplentes", valor: resumo.data?.inadimplentes ?? 0, icon: CreditCard },
    { label: "Vencem em 7 dias", valor: resumo.data?.vencimentos_7d ?? 0, icon: Headphones },
  ];

  return (
    <div className="min-h-screen bg-secondary/50">
      <header className="border-b bg-foreground text-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/admin" className="flex items-center gap-3 font-display font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" /></span>
            OdontoGestor <span className="hidden text-xs font-medium text-background/60 sm:inline">Administração geral</span>
          </Link>
          <Button variant="ghost" className="text-background hover:bg-background/10 hover:text-background" onClick={sair}><LogOut /> Sair</Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><p className="mb-2 text-xs font-bold uppercase text-primary">Operação da plataforma</p><h1 className="text-3xl font-semibold">Clientes e assinaturas</h1><p className="mt-2 text-sm text-muted-foreground">Acompanhe a operação comercial sem acessar dados clínicos.</p></div>
          <Badge variant="outline" className="gap-2 bg-card px-3 py-2"><ShieldCheck className="h-4 w-4 text-primary" /> Ambiente restrito</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {indicadores.map(({ label, valor, icon: Icon }) => (
            <Card key={label} className="rounded-md shadow-sm"><CardContent className="p-4"><Icon className="mb-4 h-5 w-5 text-primary" /><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{valor}</p></CardContent></Card>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-md border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
            <div><h2 className="font-display text-lg font-semibold">Base de clientes</h2><p className="text-sm text-muted-foreground">Planos, situação, estrutura e responsável de cada conta.</p></div>
            <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar clínica, CNPJ ou responsável" value={busca} onChange={(event) => setBusca(event.target.value)} /></div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Clínica</TableHead><TableHead>Plano</TableHead><TableHead>Situação</TableHead><TableHead>Estrutura</TableHead><TableHead>Valor mensal</TableHead><TableHead>Próxima data</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtrados.map((cliente) => (
                <TableRow key={cliente.clinica_id}>
                  <TableCell><p className="font-medium">{cliente.clinica_nome}</p><p className="text-xs text-muted-foreground">{cliente.responsavel || cliente.contato_email || "Responsável não informado"}</p></TableCell>
                  <TableCell>{planoLabels[cliente.plano]}</TableCell>
                  <TableCell><Badge variant={statusVariant(cliente.status)}>{statusLabels[cliente.status]}</Badge></TableCell>
                  <TableCell><span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {cliente.unidades}</span><span className="ml-3 inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cliente.usuarios}</span></TableCell>
                  <TableCell>{brl(cliente.valor_mensal)}</TableCell>
                  <TableCell>{dataBR(cliente.status === "teste" ? cliente.trial_ate : cliente.proxima_cobranca)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => abrir(cliente)}>Administrar</Button></TableCell>
                </TableRow>
              ))}
              {!clientes.isLoading && filtrados.length === 0 ? <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Nenhuma clínica encontrada.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </section>
      </main>

      <Dialog open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Administrar {selecionado?.clinica_nome}</DialogTitle><DialogDescription>Altere as condições comerciais e registre o contexto do atendimento.</DialogDescription></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Plano</Label><Select value={form.plano} onValueChange={(value) => setForm((atual) => ({ ...atual, plano: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="solo">Solo</SelectItem><SelectItem value="clinica">Clínica</SelectItem><SelectItem value="rede">Rede</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Situação</Label><Select value={form.status} onValueChange={(value) => setForm((atual) => ({ ...atual, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Ciclo</Label><Select value={form.ciclo} onValueChange={(value) => setForm((atual) => ({ ...atual, ciclo: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mensal">Mensal</SelectItem><SelectItem value="anual">Anual</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="valor">Valor mensal equivalente</Label><Input id="valor" type="number" min="0" step="0.01" value={form.valor} onChange={(event) => setForm((atual) => ({ ...atual, valor: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="trial">Fim do teste</Label><Input id="trial" type="date" value={form.trial} onChange={(event) => setForm((atual) => ({ ...atual, trial: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="cobranca">Próxima cobrança</Label><Input id="cobranca" type="date" value={form.cobranca} onChange={(event) => setForm((atual) => ({ ...atual, cobranca: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="motivo">Motivo da situação</Label><Textarea id="motivo" placeholder="Obrigatório para suspensão, cancelamento ou inadimplência" value={form.motivo} onChange={(event) => setForm((atual) => ({ ...atual, motivo: event.target.value }))} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="nota">Nova observação de suporte</Label><Textarea id="nota" placeholder="Registre acordos, contatos ou próximos passos" value={nota} onChange={(event) => setNota(event.target.value)} /></div>
          </div>
          {(notas.data ?? []).length ? <div className="rounded-md bg-secondary p-4"><p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Histórico de suporte</p>{notas.data?.slice(0, 4).map((item) => <div key={item.id} className="border-t py-2 first:border-0"><p className="text-sm">{item.nota}</p><p className="mt-1 text-xs text-muted-foreground">{dataBR(item.created_at)}</p></div>)}</div> : null}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSelecionado(null)}>Fechar</Button><Button disabled={salvar.isPending} onClick={() => salvar.mutate()}>{salvar.isPending ? "Salvando..." : "Salvar alterações"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}