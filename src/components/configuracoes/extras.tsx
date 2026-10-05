import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { dataBR, horaBR } from "@/lib/format";
import { TIPOS_DOC } from "@/components/paciente/documentos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function useListas() {
  return useQuery({
    queryKey: ["cfg-agenda"],
    queryFn: async () => {
      const [s, p, b, u] = await Promise.all([
        supabase.from("salas").select("*").order("nome"),
        supabase.from("profissionais").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("bloqueios_agenda").select("*,profissionais(nome)").gte("fim", new Date().toISOString()).order("inicio"),
        supabase.from("unidades").select("id,nome").eq("ativo", true).order("nome"),
      ]);
      return { salas: s.data ?? [], profissionais: p.data ?? [], bloqueios: b.data ?? [], unidades: u.data ?? [] };
    },
  });
}

export function AgendaConfigPage() {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const l = useListas();
  const inval = () => qc.invalidateQueries({ queryKey: ["cfg-agenda"] });
  const [sala, setSala] = useState({ nome: "", unidade: "" });
  const [bloq, setBloq] = useState({ prof: "todos", inicio: "", fim: "", motivo: "" });
  const [online, setOnline] = useState(false);
  useEffect(() => setOnline(!!sessao?.clinica?.agendamento_online), [sessao?.clinica?.agendamento_online]);

  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ error: unknown }>) => { const { error } = await f(); if (error) throw error; },
    onSuccess: () => { toast.success("Salvo."); inval(); qc.invalidateQueries({ queryKey: ["sessao"] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const cid = sessao?.clinicaId ?? "";
  const linkOnline = typeof window !== "undefined" ? `${window.location.origin}/agendar/${cid}` : "";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-base">Agendamento online</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm">
          <Switch id="online" checked={online} onCheckedChange={(v) => { setOnline(v); exec.mutate(() => supabase.from("clinicas").update({ agendamento_online: v }).eq("id", cid)); }} />
          <Label htmlFor="online">Permitir que pacientes agendem pela página pública</Label>
          {online && (
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(linkOnline); toast.success("Link copiado", { description: linkOnline }); }}>
              <Copy className="mr-1 h-4 w-4" /> Copiar link da página
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Salas / cadeiras</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input className="flex-1" placeholder="Ex.: Consultório 1" value={sala.nome} onChange={(e) => setSala({ ...sala, nome: e.target.value })} aria-label="Nome da sala" />
            <Select value={sala.unidade} onValueChange={(v) => setSala({ ...sala, unidade: v })}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>{l.data?.unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!sala.nome} onClick={() => { exec.mutate(() => supabase.from("salas").insert({ clinica_id: cid, nome: sala.nome, unidade_id: sala.unidade || null })); setSala({ nome: "", unidade: "" }); }}>Adicionar</Button>
          </div>
          {l.data?.salas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span className={s.ativo ? "" : "text-muted-foreground line-through"}>{s.nome}</span>
              <Switch checked={s.ativo} aria-label={`Sala ${s.nome} ativa`} onCheckedChange={(v) => exec.mutate(() => supabase.from("salas").update({ ativo: v }).eq("id", s.id))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Bloqueios (férias, feriados)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={bloq.prof} onValueChange={(v) => setBloq({ ...bloq, prof: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Toda a clínica</SelectItem>
                {l.data?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Motivo" value={bloq.motivo} onChange={(e) => setBloq({ ...bloq, motivo: e.target.value })} aria-label="Motivo" />
            <div className="space-y-1"><Label htmlFor="b-i">Início</Label><Input id="b-i" type="datetime-local" value={bloq.inicio} onChange={(e) => setBloq({ ...bloq, inicio: e.target.value })} /></div>
            <div className="space-y-1"><Label htmlFor="b-f">Fim</Label><Input id="b-f" type="datetime-local" value={bloq.fim} onChange={(e) => setBloq({ ...bloq, fim: e.target.value })} /></div>
          </div>
          <Button disabled={!bloq.inicio || !bloq.fim || !bloq.motivo} onClick={() => {
            exec.mutate(() => supabase.from("bloqueios_agenda").insert({
              clinica_id: cid, profissional_id: bloq.prof === "todos" ? null : bloq.prof,
              inicio: new Date(bloq.inicio).toISOString(), fim: new Date(bloq.fim).toISOString(), motivo: bloq.motivo,
            }));
            setBloq({ prof: "todos", inicio: "", fim: "", motivo: "" });
          }}>Adicionar bloqueio</Button>
          {l.data?.bloqueios.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <span>{dataBR(b.inicio)} {horaBR(b.inicio)} → {dataBR(b.fim)} {horaBR(b.fim)} · {b.profissionais?.nome ?? "Toda a clínica"} · {b.motivo}</span>
              <Button size="icon" variant="ghost" aria-label="Remover bloqueio" onClick={() => exec.mutate(() => supabase.from("bloqueios_agenda").delete().eq("id", b.id))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <ExpedienteCard profissionais={l.data?.profissionais ?? []} clinicaId={cid} />
    </div>
  );
}

type Linha = { ativo: boolean; inicio: string; fim: string; ii: string; if_: string };
function ExpedienteCard({ profissionais, clinicaId }: { profissionais: { id: string; nome: string }[]; clinicaId: string }) {
  const [prof, setProf] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>(DIAS.map(() => ({ ativo: false, inicio: "08:00", fim: "18:00", ii: "12:00", if_: "13:00" })));
  const h = useQuery({
    enabled: !!prof,
    queryKey: ["horarios", prof],
    queryFn: async () => (await supabase.from("horarios_profissional").select("*").eq("profissional_id", prof)).data ?? [],
  });
  useEffect(() => {
    if (!h.data) return;
    setLinhas(DIAS.map((_, d) => {
      const r = h.data!.find((x) => x.dia_semana === d);
      return r ? { ativo: true, inicio: r.inicio.slice(0, 5), fim: r.fim.slice(0, 5), ii: r.intervalo_inicio?.slice(0, 5) ?? "", if_: r.intervalo_fim?.slice(0, 5) ?? "" }
        : { ativo: false, inicio: "08:00", fim: "18:00", ii: "12:00", if_: "13:00" };
    }));
  }, [h.data]);
  const salvar = useMutation({
    mutationFn: async () => {
      const ativos = linhas.map((l, d) => ({ ...l, d })).filter((l) => l.ativo);
      const inativos = linhas.map((l, d) => ({ ...l, d })).filter((l) => !l.ativo).map((l) => l.d);
      if (ativos.length) {
        const { error } = await supabase.from("horarios_profissional").upsert(ativos.map((l) => ({
          clinica_id: clinicaId, profissional_id: prof, dia_semana: l.d, inicio: l.inicio, fim: l.fim,
          intervalo_inicio: l.ii || null, intervalo_fim: l.if_ || null,
        })), { onConflict: "profissional_id,dia_semana" });
        if (error) throw error;
      }
      if (inativos.length) {
        const { error } = await supabase.from("horarios_profissional").delete().eq("profissional_id", prof).in("dia_semana", inativos);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Expediente salvo."); h.refetch(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const upd = (i: number, p: Partial<Linha>) => setLinhas(linhas.map((l, k) => (k === i ? { ...l, ...p } : l)));
  return (
    <Card className="lg:col-span-2">
      <CardHeader><CardTitle className="text-base">Expediente dos profissionais</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Select value={prof} onValueChange={setProf}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Escolha o profissional" /></SelectTrigger>
          <SelectContent>{profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
        {prof && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground"><th className="p-1">Dia</th><th className="p-1">Início</th><th className="p-1">Fim</th><th className="p-1">Intervalo</th></tr></thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-1"><label className="flex items-center gap-2"><Checkbox checked={l.ativo} onCheckedChange={(v) => upd(i, { ativo: !!v })} />{DIAS[i]}</label></td>
                      <td className="p-1"><Input type="time" disabled={!l.ativo} value={l.inicio} onChange={(e) => upd(i, { inicio: e.target.value })} aria-label={`Início ${DIAS[i]}`} /></td>
                      <td className="p-1"><Input type="time" disabled={!l.ativo} value={l.fim} onChange={(e) => upd(i, { fim: e.target.value })} aria-label={`Fim ${DIAS[i]}`} /></td>
                      <td className="p-1"><div className="flex gap-1">
                        <Input type="time" disabled={!l.ativo} value={l.ii} onChange={(e) => upd(i, { ii: e.target.value })} aria-label={`Intervalo início ${DIAS[i]}`} />
                        <Input type="time" disabled={!l.ativo} value={l.if_} onChange={(e) => upd(i, { if_: e.target.value })} aria-label={`Intervalo fim ${DIAS[i]}`} />
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">Sem expediente cadastrado, a agenda aceita qualquer horário. Com expediente, horários fora dele só entram como encaixe.</p>
            <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>Salvar expediente</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ModelosDocumentosPage() {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cfg-modelos"], queryFn: async () => (await supabase.from("documento_modelos").select("*").order("titulo")).data ?? [] });
  const [novo, setNovo] = useState({ tipo: "atestado", titulo: "", conteudo: "" });
  const [edit, setEdit] = useState<Record<string, string>>({});
  const exec = useMutation({
    mutationFn: async (f: () => PromiseLike<{ error: unknown }>) => { const { error } = await f(); if (error) throw error; },
    onSuccess: () => { toast.success("Modelo salvo."); qc.invalidateQueries({ queryKey: ["cfg-modelos"] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Novo modelo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(TIPOS_DOC).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="sm:col-span-2" placeholder="Título" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} aria-label="Título do modelo" />
          </div>
          <Textarea rows={6} placeholder="Texto do modelo" value={novo.conteudo} onChange={(e) => setNovo({ ...novo, conteudo: e.target.value })} aria-label="Texto do modelo" />
          <p className="text-xs text-muted-foreground">
            Variáveis automáticas: {"{{paciente.nome}} {{paciente.cpf}} {{paciente.endereco}} {{profissional.nome}} {{profissional.cro}} {{clinica.nome}} {{clinica.cnpj}} {{clinica.telefone}} {{data}} {{cidade}}"}. Outras variáveis, como {"{{dias}}"}, são pedidas na hora de emitir.
          </p>
          <Button disabled={!novo.titulo || !novo.conteudo} onClick={() => { exec.mutate(() => supabase.from("documento_modelos").insert({ ...novo, clinica_id: sessao!.clinicaId! })); setNovo({ tipo: "atestado", titulo: "", conteudo: "" }); }}>Criar modelo</Button>
        </CardContent>
      </Card>
      {q.data?.map((m) => (
        <Card key={m.id}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{m.titulo} <span className="text-xs font-normal text-muted-foreground">· {TIPOS_DOC[m.tipo] ?? m.tipo}</span></CardTitle>
            <Switch checked={m.ativo} aria-label={`Modelo ${m.titulo} ativo`} onCheckedChange={(v) => exec.mutate(() => supabase.from("documento_modelos").update({ ativo: v }).eq("id", m.id))} />
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea rows={5} value={edit[m.id] ?? m.conteudo} onChange={(e) => setEdit({ ...edit, [m.id]: e.target.value })} aria-label={`Texto de ${m.titulo}`} />
            {edit[m.id] !== undefined && edit[m.id] !== m.conteudo && (
              <Button size="sm" onClick={() => exec.mutate(() => supabase.from("documento_modelos").update({ conteudo: edit[m.id] }).eq("id", m.id))}>Salvar alterações</Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LaboratoriosPage() {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cfg-labs"], queryFn: async () => (await supabase.from("laboratorios").select("*").order("nome")).data ?? [] });
  const [f, setF] = useState({ nome: "", telefone: "", email: "" });
  const exec = useMutation({
    mutationFn: async (fn: () => PromiseLike<{ error: unknown }>) => { const { error } = await fn(); if (error) throw error; },
    onSuccess: () => { toast.success("Salvo."); qc.invalidateQueries({ queryKey: ["cfg-labs"] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Laboratórios parceiros</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Input placeholder="Nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} aria-label="Nome do laboratório" />
          <Input placeholder="Telefone" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} aria-label="Telefone" />
          <Input placeholder="E-mail" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} aria-label="E-mail" />
          <Button disabled={!f.nome} onClick={() => { exec.mutate(() => supabase.from("laboratorios").insert({ clinica_id: sessao!.clinicaId!, nome: f.nome, telefone: f.telefone || null, email: f.email || null })); setF({ nome: "", telefone: "", email: "" }); }}>Adicionar</Button>
        </div>
        {q.data?.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <span className={l.ativo ? "" : "text-muted-foreground line-through"}>{l.nome}{l.telefone ? ` · ${l.telefone}` : ""}{l.email ? ` · ${l.email}` : ""}</span>
            <Switch checked={l.ativo} aria-label={`Laboratório ${l.nome} ativo`} onCheckedChange={(v) => exec.mutate(() => supabase.from("laboratorios").update({ ativo: v }).eq("id", l.id))} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
