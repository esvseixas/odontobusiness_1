import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock, MessageCircle, Plus, Repeat } from "lucide-react";

import { mensagemErro } from "@/lib/erros";
import { useAlertasPacientes, AlertaIcone } from "@/components/paciente/alertas";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { brl, dataBR, horaBR, isoDia } from "@/lib/format";
import { InsumosAtendimento, type InsumoLinha } from "@/components/estoque/insumos-atendimento";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda | OdontoGestor" },
      { name: "description", content: "Agenda por dia, semana e mês, por profissional ou sala, com encaixes, recorrência e lista de espera." },
      { property: "og:title", content: "Agenda | OdontoGestor" },
      { property: "og:description", content: "Agenda por dia, semana e mês com lista de espera e confirmações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Agenda,
});

const STATUS: Record<string, string> = {
  agendado: "Agendado", confirmado: "Confirmado", em_atendimento: "Em atendimento",
  atendido: "Atendido", faltou: "Faltou", cancelado: "Cancelado",
};
const CORES: Record<string, string> = {
  agendado: "bg-secondary text-secondary-foreground",
  confirmado: "bg-primary/15 text-primary",
  em_atendimento: "bg-accent text-accent-foreground",
  atendido: "bg-primary text-primary-foreground",
  faltou: "bg-destructive/15 text-destructive",
  cancelado: "bg-muted text-muted-foreground line-through",
};
const H_INI = 7, H_FIM = 21, PX_H = 64;
type Visao = "dia" | "semana" | "mes";
type Grupo = "profissional" | "sala";

const inicioSemana = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const addDias = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function Agenda() {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const qc = useQueryClient();
  const [dia, setDia] = useState(() => new Date());
  const [visao, setVisao] = useState<Visao>("dia");
  const [grupo, setGrupo] = useState<Grupo>("profissional");
  const [filtroProf, setFiltroProf] = useState("todos");
  const [novo, setNovo] = useState<null | Partial<FormAg>>(null);
  const [sel, setSel] = useState<string | null>(null);

  const listas = useQuery({
    enabled: !!clinicaId,
    queryKey: ["agenda-listas", clinicaId],
    queryFn: async () => {
      const [pacientes, profissionais, procedimentos, salas] = await Promise.all([
        supabase.from("pacientes").select("id,nome,telefone,elegibilidade_pendente").eq("ativo", true).order("nome"),
        supabase.from("profissionais").select("id,nome,cor").eq("ativo", true).order("nome"),
        supabase.from("procedimentos").select("id,nome,duracao_minutos").eq("ativo", true).order("nome"),
        supabase.from("salas").select("id,nome").eq("ativo", true).order("nome"),
      ]);
      return { pacientes: pacientes.data ?? [], profissionais: profissionais.data ?? [], procedimentos: procedimentos.data ?? [], salas: salas.data ?? [] };
    },
  });

  const [ini, fim] = useMemo(() => {
    if (visao === "dia") { const a = new Date(dia); a.setHours(0, 0, 0, 0); return [a, addDias(a, 1)]; }
    if (visao === "semana") { const a = inicioSemana(dia); return [a, addDias(a, 7)]; }
    const a = new Date(dia.getFullYear(), dia.getMonth(), 1); const s = inicioSemana(a);
    return [s, addDias(s, 42)];
  }, [dia, visao]);

  const agenda = useQuery({
    enabled: !!clinicaId,
    queryKey: ["agenda", clinicaId, visao, ini.toISOString()],
    queryFn: async () => {
      const [a, b] = await Promise.all([
        supabase.from("agendamentos")
          .select("*,pacientes(nome,telefone,elegibilidade_pendente),profissionais(nome,cor),procedimentos(nome)")
          .gte("inicio", ini.toISOString()).lt("inicio", fim.toISOString()).order("inicio"),
        supabase.from("bloqueios_agenda").select("*").lt("inicio", fim.toISOString()).gt("fim", ini.toISOString()),
      ]);
      return { ags: a.data ?? [], bloqueios: b.data ?? [] };
    },
  });
  type Ag = NonNullable<typeof agenda.data>["ags"][number];
  const alertas = useAlertasPacientes((agenda.data?.ags ?? []).map((a) => a.paciente_id ?? ""));
  const lista = (agenda.data?.ags ?? []).filter((a) => filtroProf === "todos" || a.profissional_id === filtroProf);
  const invalidar = () => qc.invalidateQueries({ queryKey: ["agenda"] });

  const mover = useMutation({
    mutationFn: async ({ a, inicio, coluna }: { a: Ag; inicio: Date; coluna?: string }) => {
      const dur = new Date(a.fim).getTime() - new Date(a.inicio).getTime();
      const patch: Record<string, unknown> = { inicio: inicio.toISOString(), fim: new Date(inicio.getTime() + dur).toISOString() };
      if (coluna !== undefined) {
        if (grupo === "profissional") patch.profissional_id = coluna === "_" ? null : coluna;
        else patch.cadeira = coluna === "_" ? null : coluna;
      }
      const { error } = await supabase.from("agendamentos").update(patch as never).eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agendamento movido."); invalidar(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const passo = (n: number) => {
    if (visao === "dia") setDia(addDias(dia, n));
    else if (visao === "semana") setDia(addDias(dia, 7 * n));
    else setDia(new Date(dia.getFullYear(), dia.getMonth() + n, 1));
  };
  const titulo = visao === "dia" ? dataBR(dia)
    : visao === "semana" ? `${dataBR(ini)} – ${dataBR(addDias(ini, 6))}`
    : dia.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const colunas: { id: string; nome: string; cor?: string | null }[] = grupo === "profissional"
    ? (listas.data?.profissionais ?? []).filter((p) => filtroProf === "todos" || p.id === filtroProf).map((p) => ({ id: p.id, nome: p.nome, cor: p.cor }))
    : (listas.data?.salas.length ? listas.data.salas.map((s) => ({ id: s.nome, nome: s.nome }))
      : [...new Set(lista.map((a) => a.cadeira).filter(Boolean))].map((c) => ({ id: c as string, nome: c as string })));
  const temSemColuna = lista.some((a) => (grupo === "profissional" ? !a.profissional_id : !a.cadeira));
  if (temSemColuna || colunas.length === 0) colunas.push({ id: "_", nome: grupo === "profissional" ? "Sem profissional" : "Sem sala" });

  const selecionado = lista.find((a) => a.id === sel);

  return (
    <AppShell>
      <PageHeader
        titulo="Agenda"
        descricao={titulo}
        acao={<Button onClick={() => setNovo({ data: isoDia(dia) })}><Plus className="mr-2 h-4 w-4" /> Novo agendamento</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Anterior" onClick={() => passo(-1)}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={() => setDia(new Date())}>Hoje</Button>
        <Button variant="outline" size="icon" aria-label="Próximo" onClick={() => passo(1)}><ChevronRight className="h-4 w-4" /></Button>
        <Input type="date" className="w-40" value={isoDia(dia)} onChange={(e) => e.target.value && setDia(new Date(e.target.value + "T12:00:00"))} aria-label="Data" />
        <ToggleGroup type="single" variant="outline" value={visao} onValueChange={(v) => v && setVisao(v as Visao)}>
          <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
          <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
          <ToggleGroupItem value="mes">Mês</ToggleGroupItem>
        </ToggleGroup>
        {visao === "dia" && (
          <ToggleGroup type="single" variant="outline" value={grupo} onValueChange={(v) => v && setGrupo(v as Grupo)}>
            <ToggleGroupItem value="profissional">Por profissional</ToggleGroupItem>
            <ToggleGroupItem value="sala">Por sala</ToggleGroupItem>
          </ToggleGroup>
        )}
        <Select value={filtroProf} onValueChange={setFiltroProf}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os profissionais</SelectItem>
            {listas.data?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {visao === "dia" && (
            <VisaoDia
              dia={dia} colunas={colunas} grupo={grupo} lista={lista} bloqueios={agenda.data?.bloqueios ?? []}
              alertas={alertas.data} onAbrir={setSel}
              onSoltar={(id, inicio, coluna) => { const a = lista.find((x) => x.id === id); if (a) mover.mutate({ a, inicio, coluna }); }}
              onNovo={(inicio, coluna) => setNovo({
                data: isoDia(inicio), hora: inicio.toTimeString().slice(0, 5),
                ...(coluna !== "_" ? (grupo === "profissional" ? { profissional_id: coluna } : { cadeira: coluna }) : {}),
              })}
            />
          )}
          {visao === "semana" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
              {Array.from({ length: 7 }, (_, i) => addDias(ini, i)).map((d) => {
                const doDia = lista.filter((a) => isoDia(new Date(a.inicio)) === isoDia(d));
                return (
                  <div key={d.toISOString()} className="min-h-40 rounded-lg border bg-card p-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const a = lista.find((x) => x.id === e.dataTransfer.getData("text/plain")); if (!a) return;
                      const o = new Date(a.inicio); const n = new Date(d); n.setHours(o.getHours(), o.getMinutes(), 0, 0);
                      mover.mutate({ a, inicio: n });
                    }}>
                    <button type="button" className="mb-2 w-full text-left text-xs font-semibold hover:underline" onClick={() => { setDia(d); setVisao("dia"); }}>
                      {d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                    </button>
                    <div className="space-y-1">
                      {doDia.map((a) => <Bloco key={a.id} a={a} alerta={a.paciente_id ? alertas.data?.[a.paciente_id] : undefined} onAbrir={setSel} compacto />)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {visao === "mes" && (
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => <div key={d} className="p-1 font-semibold text-muted-foreground">{d}</div>)}
              {Array.from({ length: 42 }, (_, i) => addDias(ini, i)).map((d) => {
                const doDia = lista.filter((a) => isoDia(new Date(a.inicio)) === isoDia(d) && a.status !== "cancelado");
                const fora = d.getMonth() !== dia.getMonth();
                return (
                  <button key={d.toISOString()} type="button" onClick={() => { setDia(d); setVisao("dia"); }}
                    className={`min-h-20 rounded-md border p-1 text-left hover:bg-muted ${fora ? "opacity-40" : ""} ${isoDia(d) === isoDia(new Date()) ? "border-primary" : ""}`}>
                    <div className="font-semibold">{d.getDate()}</div>
                    {doDia.slice(0, 3).map((a) => <div key={a.id} className="truncate">{horaBR(a.inicio)} {a.pacientes?.nome?.split(" ")[0] ?? "Encaixe"}</div>)}
                    {doDia.length > 3 && <div className="text-muted-foreground">+{doDia.length - 3}</div>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <ListaEspera pacientes={listas.data?.pacientes ?? []} profissionais={listas.data?.profissionais ?? []}
          onAgendar={(e) => setNovo({ data: isoDia(dia), paciente_id: e.paciente_id, profissional_id: e.profissional_id ?? "", procedimento_id: e.procedimento_id ?? "", esperaId: e.id })} />
      </div>

      {novo && (
        <NovoAgendamento inicial={novo} listas={listas.data} unidadeId={sessao?.profile?.unidade_id ?? null}
          onFechar={() => setNovo(null)} onOk={() => { setNovo(null); invalidar(); qc.invalidateQueries({ queryKey: ["espera"] }); }} />
      )}
      {selecionado && (
        <Detalhes a={selecionado} alerta={selecionado.paciente_id ? alertas.data?.[selecionado.paciente_id] : undefined}
          onFechar={() => setSel(null)} onOk={invalidar} />
      )}
    </AppShell>
  );
}

type AgLite = {
  id: string; inicio: string; fim: string; status: string; encaixe: boolean; recorrencia_id: string | null; origem: string;
  paciente_id: string | null; profissional_id: string | null; cadeira: string | null; confirmacao_token: string; observacoes: string | null; procedimento_id: string | null;
  pacientes: { nome: string; telefone: string | null; elegibilidade_pendente: boolean } | null;
  profissionais: { nome: string; cor: string | null } | null; procedimentos: { nome: string } | null;
};
type Alerta = Parameters<typeof AlertaIcone>[0]["alertas"];

function Bloco({ a, alerta, onAbrir, compacto, style }: { a: AgLite; alerta: Alerta; onAbrir: (id: string) => void; compacto?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      type="button" draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", a.id)}
      onClick={(e) => { e.stopPropagation(); onAbrir(a.id); }}
      style={{ borderLeftColor: a.profissionais?.cor ?? undefined, ...style }}
      className={`w-full overflow-hidden rounded-md border border-l-4 px-2 py-1 text-left text-xs shadow-sm ${CORES[a.status]}`}
    >
      <div className="flex items-center gap-1 font-medium">
        <span>{horaBR(a.inicio)}</span>
        <span className="truncate">{a.pacientes?.nome ?? "Horário reservado"}</span>
        <AlertaIcone alertas={alerta} />
        {a.encaixe && <Clock className="h-3 w-3 shrink-0" aria-label="Encaixe" />}
        {a.recorrencia_id && <Repeat className="h-3 w-3 shrink-0" aria-label="Recorrente" />}
      </div>
      {!compacto && <div className="truncate opacity-80">{a.procedimentos?.nome ?? "—"} · {a.profissionais?.nome ?? "—"}{a.cadeira ? ` · ${a.cadeira}` : ""}</div>}
    </button>
  );
}

function VisaoDia({ dia, colunas, grupo, lista, bloqueios, alertas, onAbrir, onSoltar, onNovo }: {
  dia: Date; colunas: { id: string; nome: string; cor?: string | null }[]; grupo: Grupo; lista: AgLite[];
  bloqueios: { id: string; inicio: string; fim: string; motivo: string; profissional_id: string | null }[];
  alertas: Record<string, Alerta> | undefined; onAbrir: (id: string) => void;
  onSoltar: (id: string, inicio: Date, coluna: string) => void; onNovo: (inicio: Date, coluna: string) => void;
}) {
  const base = new Date(dia); base.setHours(H_INI, 0, 0, 0);
  const top = (d: Date) => ((d.getTime() - base.getTime()) / 3600000) * PX_H;
  const deY = (y: number) => { const min = Math.round((y / PX_H) * 60 / 15) * 15; return new Date(base.getTime() + min * 60000); };
  const daColuna = (a: AgLite, c: string) => (grupo === "profissional" ? (a.profissional_id ?? "_") : (a.cadeira ?? "_")) === c;
  return (
    <Card className="overflow-x-auto">
      <div className="flex min-w-fit">
        <div className="w-12 shrink-0 pt-8">
          {Array.from({ length: H_FIM - H_INI }, (_, i) => (
            <div key={i} style={{ height: PX_H }} className="pr-1 text-right text-[10px] text-muted-foreground">{String(H_INI + i).padStart(2, "0")}:00</div>
          ))}
        </div>
        {colunas.map((c) => (
          <div key={c.id} className="min-w-44 flex-1 border-l">
            <div className="sticky top-0 z-10 h-8 truncate border-b bg-card px-2 py-1.5 text-xs font-semibold" style={{ borderBottomColor: c.cor ?? undefined }}>{c.nome}</div>
            <div
              className="relative"
              style={{ height: (H_FIM - H_INI) * PX_H }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSoltar(e.dataTransfer.getData("text/plain"), deY(e.clientY - r.top), c.id); }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onNovo(deY(e.clientY - r.top), c.id); }}
            >
              {Array.from({ length: H_FIM - H_INI }, (_, i) => <div key={i} style={{ top: i * PX_H, height: PX_H }} className="absolute inset-x-0 border-b border-dashed border-border/60" />)}
              {bloqueios.filter((b) => grupo !== "profissional" || !b.profissional_id || b.profissional_id === c.id).map((b) => {
                const t = Math.max(top(new Date(b.inicio)), 0), bt = Math.min(top(new Date(b.fim)), (H_FIM - H_INI) * PX_H);
                return bt > t ? <div key={b.id} style={{ top: t, height: bt - t }} className="absolute inset-x-0 bg-muted/80 p-1 text-[10px] text-muted-foreground">Bloqueado: {b.motivo}</div> : null;
              })}
              {lista.filter((a) => daColuna(a, c.id)).map((a) => {
                const t = top(new Date(a.inicio)); const h = Math.max(top(new Date(a.fim)) - t, 22);
                return <Bloco key={a.id} a={a} alerta={a.paciente_id ? alertas?.[a.paciente_id] : undefined} onAbrir={onAbrir}
                  style={{ position: "absolute", top: t, height: h, left: 2, right: 2, width: "auto" }} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

type FormAg = {
  paciente_id: string; profissional_id: string; procedimento_id: string; cadeira: string; data: string; hora: string;
  duracao: string; observacoes: string; encaixe: boolean; repetir: boolean; repeticoes: string; intervalo: string; esperaId?: string;
};
type Listas = { pacientes: { id: string; nome: string; elegibilidade_pendente: boolean }[]; profissionais: { id: string; nome: string }[];
  procedimentos: { id: string; nome: string; duracao_minutos: number }[]; salas: { id: string; nome: string }[] } | undefined;

function NovoAgendamento({ inicial, listas, unidadeId, onFechar, onOk }: { inicial: Partial<FormAg>; listas: Listas; unidadeId: string | null; onFechar: () => void; onOk: () => void }) {
  const [f, setF] = useState<FormAg>({
    paciente_id: "", profissional_id: "", procedimento_id: "", cadeira: "", data: isoDia(new Date()), hora: "09:00",
    duracao: "30", observacoes: "", encaixe: false, repetir: false, repeticoes: "4", intervalo: "30", ...inicial,
  });
  const criar = useMutation({
    mutationFn: async () => {
      const inicio = new Date(`${f.data}T${f.hora}:00`);
      const { error } = await supabase.rpc("criar_agendamentos", {
        p_paciente: f.paciente_id || (null as never), p_profissional: f.profissional_id || (null as never),
        p_procedimento: f.procedimento_id || (null as never), p_unidade: unidadeId as never, p_cadeira: f.cadeira,
        p_inicio: inicio.toISOString(), p_duracao: Number(f.duracao) || 30,
        p_repeticoes: f.repetir ? Number(f.repeticoes) || 1 : 1, p_intervalo_dias: Number(f.intervalo) || 7,
        p_observacoes: f.observacoes || (null as never), p_encaixe: f.encaixe,
      });
      if (error) throw error;
      if (f.esperaId) await supabase.from("lista_espera").update({ status: "agendado" }).eq("id", f.esperaId);
    },
    onSuccess: () => { toast.success(f.repetir ? "Agendamentos recorrentes criados." : "Agendamento criado."); onOk(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2"><Label>Paciente</Label>
            <Select value={f.paciente_id} onValueChange={(v) => setF({ ...f, paciente_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{listas?.pacientes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.elegibilidade_pendente ? " · convênio pendente" : ""}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label>Profissional</Label>
            <Select value={f.profissional_id} onValueChange={(v) => setF({ ...f, profissional_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{listas?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label>Procedimento</Label>
            <Select value={f.procedimento_id} onValueChange={(v) => setF({ ...f, procedimento_id: v, duracao: String(listas?.procedimentos.find((p) => p.id === v)?.duracao_minutos ?? f.duracao) })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{listas?.procedimentos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label htmlFor="ag-data">Data</Label><Input id="ag-data" type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="ag-hora">Horário</Label><Input id="ag-hora" type="time" step={900} value={f.hora} onChange={(e) => setF({ ...f, hora: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="ag-dur">Duração (min)</Label><Input id="ag-dur" type="number" value={f.duracao} onChange={(e) => setF({ ...f, duracao: e.target.value })} /></div>
          <div className="space-y-1"><Label>Sala / cadeira</Label>
            {listas?.salas.length ? (
              <Select value={f.cadeira} onValueChange={(v) => setF({ ...f, cadeira: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{listas.salas.map((s) => <SelectItem key={s.id} value={s.nome}>{s.nome}</SelectItem>)}</SelectContent>
              </Select>
            ) : <Input value={f.cadeira} onChange={(e) => setF({ ...f, cadeira: e.target.value })} aria-label="Sala ou cadeira" />}
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.encaixe} onCheckedChange={(v) => setF({ ...f, encaixe: !!v })} /> Encaixe (fora do expediente)</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={f.repetir} onCheckedChange={(v) => setF({ ...f, repetir: !!v })} /> Repetir (recorrente)</label>
          {f.repetir && (
            <>
              <div className="space-y-1"><Label htmlFor="ag-rep">Nº de sessões</Label><Input id="ag-rep" type="number" min={2} max={52} value={f.repeticoes} onChange={(e) => setF({ ...f, repeticoes: e.target.value })} /></div>
              <div className="space-y-1"><Label htmlFor="ag-int">A cada (dias)</Label><Input id="ag-int" type="number" min={1} value={f.intervalo} onChange={(e) => setF({ ...f, intervalo: e.target.value })} /></div>
            </>
          )}
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="ag-obs">Observações</Label><Textarea id="ag-obs" value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
        </div>
        <Button onClick={() => criar.mutate()} disabled={criar.isPending}>Salvar agendamento</Button>
      </DialogContent>
    </Dialog>
  );
}

function Detalhes({ a, alerta, onFechar, onOk }: { a: AgLite; alerta: Alerta; onFechar: () => void; onOk: () => void }) {
  const [cobrar, setCobrar] = useState(true);
  const [atendido, setAtendido] = useState<null | { cobranca: boolean; estoque?: { itens: number; custo: number } }>(null);
  const { data: sessao } = useSessao();
  const baixaEstoque = sessao?.tem("owner", "admin", "estoque", "dentista", "esteticista", "auxiliar") ?? false;
  const [insumos, setInsumos] = useState<{ linhas: InsumoLinha[]; exige: boolean }>({ linhas: [], exige: false });
  const onInsumos = useCallback((linhas: InsumoLinha[], exige: boolean) => setInsumos({ linhas, exige }), []);
  const status = useMutation({
    mutationFn: async (s: string) => { const { error } = await supabase.from("agendamentos").update({ status: s as never }).eq("id", a.id); if (error) throw error; },
    onSuccess: () => { toast.success("Status atualizado."); onOk(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const atender = useMutation({
    mutationFn: async () => {
      if (!baixaEstoque) {
        const { data, error } = await supabase.rpc("marcar_atendido", { p_agendamento: a.id, p_cobrar: cobrar });
        if (error) throw error;
        return data as { cobranca: boolean };
      }
      const validas = insumos.linhas.filter((l) => l.item_id && Number(l.quantidade) > 0);
      if (insumos.exige && validas.some((l) => !l.lote_id)) throw new Error("Escolha o lote aplicado de cada insumo.");
      const { data, error } = await supabase.rpc("finalizar_atendimento", {
        p_agendamento: a.id, p_cobrar: cobrar,
        p_insumos: validas.map((l) => ({ item_id: l.item_id, quantidade: Number(l.quantidade), lote_id: l.lote_id || null, dente: l.dente || null })),
      });
      if (error) throw error;
      return data as { cobranca: boolean; estoque?: { itens: number; custo: number } };
    },
    onSuccess: (r) => { setAtendido(r); onOk(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const tel = (a.pacientes?.telefone ?? "").replace(/\D/g, "");
  const link = typeof window !== "undefined" ? `${window.location.origin}/confirmar/${a.confirmacao_token}` : "";
  const msg = `Olá, ${a.pacientes?.nome?.split(" ")[0] ?? ""}! Lembrete da sua consulta em ${dataBR(a.inicio)} às ${horaBR(a.inicio)}${a.profissionais ? ` com ${a.profissionais.nome}` : ""}. Confirme ou cancele por aqui: ${link}`;
  return (
    <Dialog open onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2">{a.pacientes?.nome ?? "Horário reservado"} <AlertaIcone alertas={alerta} /></DialogTitle></DialogHeader>
        <div className="space-y-1 text-sm">
          <p>{dataBR(a.inicio)} · {horaBR(a.inicio)}–{horaBR(a.fim)}</p>
          <p className="text-muted-foreground">{a.procedimentos?.nome ?? "Sem procedimento"} · {a.profissionais?.nome ?? "—"}{a.cadeira ? ` · ${a.cadeira}` : ""}</p>
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge className={CORES[a.status]}>{STATUS[a.status]}</Badge>
            {a.encaixe && <Badge variant="outline">encaixe</Badge>}
            {a.recorrencia_id && <Badge variant="outline">recorrente</Badge>}
            {a.origem === "online" && <Badge variant="outline">agendado online</Badge>}
            {a.pacientes?.elegibilidade_pendente && <Badge variant="destructive">convênio pendente</Badge>}
          </div>
          {a.observacoes && <p className="pt-1 text-xs text-muted-foreground">{a.observacoes}</p>}
        </div>
        {atendido ? (
          <div className="space-y-2 rounded-md bg-muted/50 p-3 text-sm">
            <p>Atendimento concluído.{atendido.cobranca ? " Cobrança gerada no financeiro." : ""}
              {atendido.estoque && atendido.estoque.itens > 0 ? ` Baixa de ${atendido.estoque.itens} insumo(s) no estoque (${brl(atendido.estoque.custo)}).` : ""}</p>
            {a.paciente_id && <Button asChild size="sm"><Link to="/pacientes/$id/evolucao" params={{ id: a.paciente_id }}>Registrar evolução clínica</Link></Button>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {["confirmado", "em_atendimento", "faltou", "cancelado", "agendado"].filter((s) => s !== a.status).map((s) => (
                <Button key={s} size="sm" variant="outline" onClick={() => status.mutate(s)}>{STATUS[s]}</Button>
              ))}
            </div>
            {a.status !== "atendido" && a.status !== "cancelado" && (
              <div className="space-y-2 rounded-md border p-3">
                {baixaEstoque && <InsumosAtendimento procedimentoId={a.procedimento_id} onChange={onInsumos} />}
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={cobrar} onCheckedChange={(v) => setCobrar(!!v)} /> Gerar cobrança se o paciente não tiver orçamento aprovado</label>
                <Button size="sm" onClick={() => atender.mutate()} disabled={atender.isPending}>Marcar como atendido</Button>
              </div>
            )}
            {tel && ["agendado", "confirmado"].includes(a.status) && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/${tel.length <= 11 ? "55" + tel : tel}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" /> Enviar lembrete/confirmação por WhatsApp
                </a>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ListaEspera({ pacientes, profissionais, onAgendar }: {
  pacientes: { id: string; nome: string }[]; profissionais: { id: string; nome: string }[];
  onAgendar: (e: { id: string; paciente_id: string; profissional_id: string | null; procedimento_id: string | null }) => void;
}) {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const q = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["espera"],
    queryFn: async () => (await supabase.from("lista_espera").select("*,pacientes(nome,telefone),profissionais(nome)").eq("status", "aguardando").order("created_at")).data ?? [],
  });
  const [f, setF] = useState({ paciente: "", prof: "", pref: "" });
  const exec = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => { const { error } = await fn(); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["espera"] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <Card className="h-fit">
      <CardHeader><CardTitle className="text-base">Lista de espera ({q.data?.length ?? 0})</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Select value={f.paciente} onValueChange={(v) => setF({ ...f, paciente: v })}>
          <SelectTrigger><SelectValue placeholder="Paciente" /></SelectTrigger>
          <SelectContent>{pacientes.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={f.prof} onValueChange={(v) => setF({ ...f, prof: v })}>
          <SelectTrigger><SelectValue placeholder="Profissional (opcional)" /></SelectTrigger>
          <SelectContent>{profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Input placeholder="Preferência (ex.: manhãs, terças)" value={f.pref} onChange={(e) => setF({ ...f, pref: e.target.value })} aria-label="Preferência" />
        <Button size="sm" className="w-full" variant="outline" disabled={!f.paciente} onClick={() => {
          exec.mutate(() => supabase.from("lista_espera").insert({ clinica_id: sessao!.clinicaId!, paciente_id: f.paciente, profissional_id: f.prof || null, preferencia: f.pref || null }));
          setF({ paciente: "", prof: "", pref: "" });
        }}>Adicionar à espera</Button>
        {q.data?.map((e) => (
          <div key={e.id} className="space-y-1 rounded-md border p-2">
            <p className="font-medium">{e.pacientes?.nome}</p>
            <p className="text-xs text-muted-foreground">{e.profissionais?.nome ?? "Qualquer profissional"}{e.preferencia ? ` · ${e.preferencia}` : ""} · desde {dataBR(e.created_at)}</p>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => onAgendar(e)}>Agendar</Button>
              <Button size="sm" variant="ghost" onClick={() => exec.mutate(() => supabase.from("lista_espera").update({ status: "desistiu" }).eq("id", e.id))}>Desistiu</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
