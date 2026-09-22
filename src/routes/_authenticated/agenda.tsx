import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataBR, horaBR, isoDia } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | OdontoGestor" },
      { name: "description", content: "Agenda diária por profissional com status de atendimento e encaixes." },
      { property: "og:title", content: "Agenda | OdontoGestor" },
      { property: "og:description", content: "Agenda diária por profissional com status de atendimento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Agenda,
});

const STATUS = ["agendado", "confirmado", "em_atendimento", "atendido", "faltou", "cancelado"] as const;
const CORES: Record<string, string> = {
  agendado: "bg-secondary text-secondary-foreground",
  confirmado: "bg-primary/15 text-primary",
  em_atendimento: "bg-accent text-accent-foreground",
  atendido: "bg-emerald-100 text-emerald-800",
  faltou: "bg-destructive/15 text-destructive",
  cancelado: "bg-muted text-muted-foreground line-through",
};

function Agenda() {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();
  const [dia, setDia] = useState(new Date());
  const [aberto, setAberto] = useState(false);
  const [filtroProf, setFiltroProf] = useState("todos");

  const [form, setForm] = useState({
    paciente_id: "",
    profissional_id: "",
    procedimento_id: "",
    cadeira: "",
    hora: "09:00",
    duracao: "30",
    observacoes: "",
  });

  const listas = useQuery({
    enabled: !!clinicaId,
    queryKey: ["agenda-listas", clinicaId],
    queryFn: async () => {
      const [pacientes, profissionais, procedimentos] = await Promise.all([
        supabase.from("pacientes").select("id,nome,elegibilidade_pendente").eq("ativo", true).order("nome"),
        supabase.from("profissionais").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("procedimentos").select("id,nome,duracao_minutos").eq("ativo", true).order("nome"),
      ]);
      return {
        pacientes: pacientes.data ?? [],
        profissionais: profissionais.data ?? [],
        procedimentos: procedimentos.data ?? [],
      };
    },
  });

  const inicioDia = useMemo(() => { const d = new Date(dia); d.setHours(0, 0, 0, 0); return d; }, [dia]);
  const fimDia = useMemo(() => { const d = new Date(dia); d.setHours(23, 59, 59, 999); return d; }, [dia]);

  const agenda = useQuery({
    enabled: !!clinicaId,
    queryKey: ["agenda", clinicaId, isoDia(dia)],
    queryFn: async () => {
      const { data } = await supabase
        .from("agendamentos")
        .select("*,pacientes(nome,telefone,elegibilidade_pendente),profissionais(nome),procedimentos(nome)")
        .gte("inicio", inicioDia.toISOString())
        .lte("inicio", fimDia.toISOString())
        .order("inicio");
      return data ?? [];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      const [h, m] = form.hora.split(":").map(Number);
      const inicio = new Date(dia);
      inicio.setHours(h ?? 9, m ?? 0, 0, 0);
      const fim = new Date(inicio.getTime() + Number(form.duracao) * 60000);
      const { error } = await supabase.from("agendamentos").insert({
        clinica_id: clinicaId!,
        unidade_id: sessao?.profile?.unidade_id ?? null,
        paciente_id: form.paciente_id || null,
        profissional_id: form.profissional_id || null,
        procedimento_id: form.procedimento_id || null,
        cadeira: form.cadeira || null,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        observacoes: form.observacoes || null,
        created_by: sessao?.user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento criado.");
      setAberto(false);
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
    },
    onError: (e: Error) => toast.error("Erro ao agendar: " + e.message),
  });

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("agendamentos")
        .update({ status: status as never })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  });

  const lista = (agenda.data ?? []).filter(
    (a) => filtroProf === "todos" || a.profissional_id === filtroProf,
  );

  return (
    <AppShell>
      <PageHeader
        titulo="Agenda"
        descricao={dataBR(dia)}
        acao={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo agendamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo agendamento — {dataBR(dia)}</DialogTitle></DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Paciente</Label>
                  <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {listas.data?.pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}{p.elegibilidade_pendente ? " · convênio pendente" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Profissional</Label>
                  <Select value={form.profissional_id} onValueChange={(v) => setForm({ ...form, profissional_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {listas.data?.profissionais.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select
                    value={form.procedimento_id}
                    onValueChange={(v) => {
                      const proc = listas.data?.procedimentos.find((p) => p.id === v);
                      setForm({ ...form, procedimento_id: v, duracao: String(proc?.duracao_minutos ?? 30) });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {listas.data?.procedimentos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input type="number" value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cadeira / sala</Label>
                  <Input value={form.cadeira} onChange={(e) => setForm({ ...form, cadeira: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Observações</Label>
                  <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>
              <Button onClick={() => criar.mutate()} disabled={criar.isPending}>Salvar agendamento</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setDia(new Date(dia.getTime() - 86400000))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setDia(new Date())}>Hoje</Button>
        <Button variant="outline" size="icon" onClick={() => setDia(new Date(dia.getTime() + 86400000))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Input
          type="date"
          className="w-44"
          value={isoDia(dia)}
          onChange={(e) => setDia(new Date(e.target.value + "T12:00:00"))}
        />
        <Select value={filtroProf} onValueChange={setFiltroProf}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os profissionais</SelectItem>
            {listas.data?.profissionais.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento neste dia.
            </p>
          ) : (
            lista.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-semibold">{horaBR(a.inicio)}</div>
                  <div>
                    <p className="font-medium">
                      {a.pacientes?.nome ?? "Encaixe"}
                      {a.pacientes?.elegibilidade_pendente ? (
                        <Badge variant="destructive" className="ml-2">convênio pendente</Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.profissionais?.nome ?? "—"} · {a.procedimentos?.nome ?? "Sem procedimento"}
                      {a.cadeira ? ` · ${a.cadeira}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${CORES[a.status]}`}>
                    {a.status}
                  </span>
                  <Select value={a.status} onValueChange={(v) => mudarStatus.mutate({ id: a.id, status: v })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
