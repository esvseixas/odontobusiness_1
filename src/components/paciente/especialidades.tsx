import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { brl, dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Especialidades({ pacienteId }: { pacienteId: string }) {
  return (
    <Tabs defaultValue="perio">
      <TabsList className="mb-4 flex h-auto flex-wrap">
        <TabsTrigger value="perio">Periograma</TabsTrigger>
        <TabsTrigger value="orto">Ortodontia</TabsTrigger>
        <TabsTrigger value="impl">Implantes</TabsTrigger>
        <TabsTrigger value="lab">Prótese / laboratório</TabsTrigger>
      </TabsList>
      <TabsContent value="perio"><Periograma pacienteId={pacienteId} /></TabsContent>
      <TabsContent value="orto"><Ortodontia pacienteId={pacienteId} /></TabsContent>
      <TabsContent value="impl"><Implantes pacienteId={pacienteId} /></TabsContent>
      <TabsContent value="lab"><Laboratorio pacienteId={pacienteId} /></TabsContent>
    </Tabs>
  );
}

/* ---------------- Periograma ---------------- */
const DENTES = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
].map(String);
const SITIOS = ["MV", "V", "DV", "ML", "L", "DL"];
type Dente = { ps: string[]; rec: string[]; sg: boolean[]; mob: string; furca: string };
type Perio = Record<string, Dente>;
const vazio = (): Dente => ({ ps: Array(6).fill(""), rec: Array(6).fill(""), sg: Array(6).fill(false), mob: "0", furca: "0" });

function Periograma({ pacienteId }: { pacienteId: string }) {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const hist = useQuery({
    queryKey: ["perio", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase.from("periogramas").select("*").eq("paciente_id", pacienteId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const [dados, setDados] = useState<Perio>({});
  const [obs, setObs] = useState("");
  useEffect(() => {
    if (hist.data?.[0]) setDados(hist.data[0].dados as unknown as Perio);
  }, [hist.data]);

  const get = (d: string) => dados[d] ?? vazio();
  const set = (d: string, f: (x: Dente) => Dente) => setDados({ ...dados, [d]: f(structuredClone(get(d))) });

  const resumo = useMemo(() => {
    let sitios = 0, sang = 0, bolsas = 0;
    Object.values(dados).forEach((d) => d.ps.forEach((p, i) => {
      if (p !== "") { sitios++; if (Number(p) >= 4) bolsas++; }
      if (d.sg[i]) sang++;
    }));
    return { sitios, sang, bolsas, pct: sitios ? Math.round((sang / sitios) * 100) : 0 };
  }, [dados]);

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("periogramas").insert({
        clinica_id: sessao!.clinicaId!, paciente_id: pacienteId, dados: dados as never, observacao: obs || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Periograma registrado (nova versão)."); setObs(""); qc.invalidateQueries({ queryKey: ["perio", pacienteId] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const num = "h-7 w-9 px-1 text-center text-xs";
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Periograma</CardTitle>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Sangramento {resumo.pct}%</Badge>
          <Badge variant={resumo.bolsas ? "destructive" : "secondary"}>Sítios com bolsa ≥ 4 mm: {resumo.bolsas}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Profundidade de sondagem (PS) e recessão em mm, por sítio: {SITIOS.join(", ")}. Clique no sítio para marcar sangramento.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="p-1">Dente</th><th className="p-1">PS (6 sítios)</th><th className="p-1">Recessão</th>
                <th className="p-1">Sangramento</th><th className="p-1">Mob.</th><th className="p-1">Furca</th>
              </tr>
            </thead>
            <tbody>
              {DENTES.map((d) => {
                const x = get(d);
                return (
                  <tr key={d} className="border-t">
                    <td className="p-1 font-semibold">{d}</td>
                    <td className="p-1"><div className="flex gap-0.5">{x.ps.map((v, i) => (
                      <Input key={i} aria-label={`PS ${d} ${SITIOS[i]}`} inputMode="numeric" className={`${num} ${Number(v) >= 4 ? "border-destructive text-destructive" : ""}`} value={v}
                        onChange={(e) => set(d, (y) => { y.ps[i] = e.target.value.replace(/\D/g, "").slice(0, 2); return y; })} />
                    ))}</div></td>
                    <td className="p-1"><div className="flex gap-0.5">{x.rec.map((v, i) => (
                      <Input key={i} aria-label={`Recessão ${d} ${SITIOS[i]}`} inputMode="numeric" className={num} value={v}
                        onChange={(e) => set(d, (y) => { y.rec[i] = e.target.value.replace(/[^\d-]/g, "").slice(0, 3); return y; })} />
                    ))}</div></td>
                    <td className="p-1"><div className="flex gap-0.5">{x.sg.map((v, i) => (
                      <button key={i} type="button" title={SITIOS[i]} aria-pressed={v} aria-label={`Sangramento ${d} ${SITIOS[i]}`}
                        className={`h-7 w-6 rounded border text-[10px] ${v ? "bg-destructive text-destructive-foreground" : "bg-background"}`}
                        onClick={() => set(d, (y) => { y.sg[i] = !y.sg[i]; return y; })}>{SITIOS[i][0]}</button>
                    ))}</div></td>
                    <td className="p-1">
                      <select aria-label={`Mobilidade ${d}`} className="h-7 rounded border bg-background px-1" value={x.mob} onChange={(e) => set(d, (y) => ({ ...y, mob: e.target.value }))}>
                        {["0", "1", "2", "3"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="p-1">
                      <select aria-label={`Furca ${d}`} className="h-7 rounded border bg-background px-1" value={x.furca} onChange={(e) => set(d, (y) => ({ ...y, furca: e.target.value }))}>
                        {["0", "I", "II", "III"].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Textarea placeholder="Observações / diagnóstico periodontal" value={obs} onChange={(e) => setObs(e.target.value)} />
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>Registrar periograma</Button>
        {(hist.data ?? []).length > 0 && (
          <div className="space-y-1 pt-2 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Versões anteriores</p>
            {hist.data!.map((h) => (
              <button key={h.id} type="button" className="block underline-offset-2 hover:underline" onClick={() => setDados(h.dados as unknown as Perio)}>
                {dataBR(h.created_at)}{h.observacao ? ` — ${h.observacao}` : ""}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------- Ortodontia ---------------- */
function Ortodontia({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const { data: sessao } = useSessao();
  const dados = useQuery({
    queryKey: ["orto", pacienteId],
    queryFn: async () => {
      const [c, p] = await Promise.all([
        supabase.from("orto_contratos").select("*,orto_manutencoes(*),profissionais(nome)").eq("paciente_id", pacienteId).order("created_at", { ascending: false }),
        supabase.from("profissionais").select("id,nome").eq("ativo", true).order("nome"),
      ]);
      return { contratos: c.data ?? [], profissionais: p.data ?? [] };
    },
  });
  const [f, setF] = useState({ aparelho: "", profissional: "", inicio: new Date().toISOString().slice(0, 10), meses: "24", mensalidade: "", dia: "10", obs: "" });
  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("criar_contrato_orto", {
        p_paciente: pacienteId, p_profissional: f.profissional || (null as never), p_aparelho: f.aparelho, p_inicio: f.inicio,
        p_meses: Number(f.meses), p_mensalidade: Number(f.mensalidade) || 0, p_dia: Number(f.dia), p_observacao: f.obs || (null as never),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Contrato criado e mensalidades lançadas no financeiro."); setF({ ...f, aparelho: "", mensalidade: "", obs: "" }); qc.invalidateQueries({ queryKey: ["orto", pacienteId] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const [manut, setManut] = useState<Record<string, string>>({});
  const addManut = useMutation({
    mutationFn: async (contrato: string) => {
      const { error } = await supabase.from("orto_manutencoes").insert({ clinica_id: sessao!.clinicaId!, contrato_id: contrato, descricao: manut[contrato] ?? "" });
      if (error) throw error;
    },
    onSuccess: (_, c) => { setManut({ ...manut, [c]: "" }); qc.invalidateQueries({ queryKey: ["orto", pacienteId] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Novo contrato ortodôntico</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="o-ap">Aparelho</Label><Input id="o-ap" placeholder="Ex.: fixo metálico autoligado" value={f.aparelho} onChange={(e) => setF({ ...f, aparelho: e.target.value })} /></div>
          <div className="space-y-1"><Label>Profissional</Label>
            <Select value={f.profissional} onValueChange={(v) => setF({ ...f, profissional: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{dados.data?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1"><Label htmlFor="o-in">Início</Label><Input id="o-in" type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="o-me">Duração (meses)</Label><Input id="o-me" type="number" min={1} max={60} value={f.meses} onChange={(e) => setF({ ...f, meses: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="o-va">Mensalidade (R$)</Label><Input id="o-va" type="number" step="0.01" value={f.mensalidade} onChange={(e) => setF({ ...f, mensalidade: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="o-di">Dia de vencimento</Label><Input id="o-di" type="number" min={1} max={31} value={f.dia} onChange={(e) => setF({ ...f, dia: e.target.value })} /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="o-ob">Observações</Label><Input id="o-ob" value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></div>
          <Button className="sm:col-span-3" disabled={!f.aparelho || criar.isPending} onClick={() => criar.mutate()}>Criar contrato e gerar mensalidades</Button>
        </CardContent>
      </Card>
      {dados.data?.contratos.map((c) => (
        <Card key={c.id}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">{c.aparelho}</CardTitle>
            <Badge>{c.status}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              Início {dataBR(c.inicio + "T12:00:00")} · {c.meses} meses · {brl(Number(c.mensalidade))}/mês (dia {c.dia_vencimento}) · {c.profissionais?.nome ?? "—"}
            </p>
            <p className="font-medium">Manutenções ({c.orto_manutencoes.length})</p>
            {c.orto_manutencoes.sort((a, b) => b.realizada_em.localeCompare(a.realizada_em)).map((m) => (
              <p key={m.id} className="text-xs">{dataBR(m.realizada_em + "T12:00:00")} — {m.descricao}</p>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Registrar manutenção (ex.: troca de arco 0.16 NiTi)" value={manut[c.id] ?? ""} onChange={(e) => setManut({ ...manut, [c.id]: e.target.value })} />
              <Button variant="outline" disabled={!manut[c.id]} onClick={() => addManut.mutate(c.id)}>Registrar</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Implantes ---------------- */
function Implantes({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const { data: sessao } = useSessao();
  const lista = useQuery({
    queryKey: ["implantes", pacienteId],
    queryFn: async () => (await supabase.from("implantes").select("*").eq("paciente_id", pacienteId).order("created_at", { ascending: false })).data ?? [],
  });
  const ini = { dente: "", marca: "", modelo: "", diametro: "", comprimento: "", lote: "", instalado_em: new Date().toISOString().slice(0, 10), componentes: "", observacao: "" };
  const [f, setF] = useState(ini);
  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("implantes").insert({
        clinica_id: sessao!.clinicaId!, paciente_id: pacienteId, dente: f.dente, marca: f.marca || null, modelo: f.modelo || null,
        diametro: f.diametro ? Number(f.diametro) : null, comprimento: f.comprimento ? Number(f.comprimento) : null, lote: f.lote || null,
        instalado_em: f.instalado_em || null, componentes: f.componentes || null, observacao: f.observacao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Implante registrado."); setF(ini); qc.invalidateQueries({ queryKey: ["implantes", pacienteId] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const campo = (k: keyof typeof ini, rot: string, extra?: Record<string, unknown>) => (
    <div className="space-y-1"><Label htmlFor={`im-${k}`}>{rot}</Label><Input id={`im-${k}`} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} /></div>
  );
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Registrar implante</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          {campo("dente", "Dente (FDI)")}{campo("marca", "Marca")}{campo("modelo", "Modelo")}{campo("lote", "Lote")}
          {campo("diametro", "Diâmetro (mm)", { type: "number", step: "0.1" })}{campo("comprimento", "Comprimento (mm)", { type: "number", step: "0.5" })}
          {campo("instalado_em", "Data de instalação", { type: "date" })}
          <div className="sm:col-span-4">{campo("componentes", "Componentes (pilar, parafuso, cicatrizador, coroa…)")}</div>
          <div className="sm:col-span-4">{campo("observacao", "Observações (torque, enxerto…)")}</div>
          <Button className="sm:col-span-4" disabled={!f.dente || salvar.isPending} onClick={() => salvar.mutate()}>Registrar implante</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        {lista.data?.map((i) => (
          <Card key={i.id}><CardContent className="space-y-1 pt-6 text-sm">
            <p className="font-semibold">Dente {i.dente} · {i.marca ?? "—"} {i.modelo ?? ""}</p>
            <p className="text-muted-foreground">Ø {i.diametro ?? "—"} × {i.comprimento ?? "—"} mm · lote {i.lote ?? "—"} · {i.instalado_em ? dataBR(i.instalado_em + "T12:00:00") : "—"}</p>
            {i.componentes && <p className="text-xs">Componentes: {i.componentes}</p>}
            {i.observacao && <p className="text-xs text-muted-foreground">{i.observacao}</p>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Laboratório ---------------- */
const STATUS_ORDEM: Record<string, string> = { enviado: "Enviado", retornado: "Retornou", instalado: "Instalado", cancelado: "Cancelado" };
function Laboratorio({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const dados = useQuery({
    queryKey: ["lab", pacienteId],
    queryFn: async () => {
      const [o, l] = await Promise.all([
        supabase.from("ordens_laboratorio").select("*,laboratorios(nome)").eq("paciente_id", pacienteId).order("created_at", { ascending: false }),
        supabase.from("laboratorios").select("id,nome").eq("ativo", true).order("nome"),
      ]);
      return { ordens: o.data ?? [], labs: l.data ?? [] };
    },
  });
  const ini = { lab: "", trabalho: "", dente: "", cor: "", prazo: "", custo: "", obs: "" };
  const [f, setF] = useState(ini);
  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("criar_ordem_laboratorio", {
        p_paciente: pacienteId, p_laboratorio: f.lab, p_trabalho: f.trabalho, p_dente: f.dente, p_cor: f.cor,
        p_prazo: f.prazo || (null as never), p_custo: Number(f.custo) || 0, p_observacao: f.obs || (null as never),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ordem enviada; custo lançado em contas a pagar."); setF(ini); qc.invalidateQueries({ queryKey: ["lab", pacienteId] }); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const status = useMutation({
    mutationFn: async ({ id, s }: { id: string; s: string }) => {
      const { error } = await supabase.from("ordens_laboratorio").update({ status: s, retornado_em: s === "retornado" ? new Date().toISOString().slice(0, 10) : undefined }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", pacienteId] }),
    onError: (e) => toast.error(mensagemErro(e)),
  });
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Nova ordem de laboratório</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1"><Label>Laboratório</Label>
            <Select value={f.lab} onValueChange={(v) => setF({ ...f, lab: v })}>
              <SelectTrigger><SelectValue placeholder={dados.data?.labs.length ? "Selecione" : "Cadastre em Configurações"} /></SelectTrigger>
              <SelectContent>{dados.data?.labs.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="l-tr">Trabalho</Label><Input id="l-tr" placeholder="Ex.: coroa metalocerâmica" value={f.trabalho} onChange={(e) => setF({ ...f, trabalho: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="l-de">Dente(s)</Label><Input id="l-de" value={f.dente} onChange={(e) => setF({ ...f, dente: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="l-co">Cor</Label><Input id="l-co" placeholder="Ex.: A2" value={f.cor} onChange={(e) => setF({ ...f, cor: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="l-pr">Prazo de retorno</Label><Input id="l-pr" type="date" value={f.prazo} onChange={(e) => setF({ ...f, prazo: e.target.value })} /></div>
          <div className="space-y-1"><Label htmlFor="l-cu">Custo (R$)</Label><Input id="l-cu" type="number" step="0.01" value={f.custo} onChange={(e) => setF({ ...f, custo: e.target.value })} /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="l-ob">Observações</Label><Input id="l-ob" value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></div>
          <Button className="sm:col-span-3" disabled={!f.lab || !f.trabalho || criar.isPending} onClick={() => criar.mutate()}>Enviar ao laboratório</Button>
        </CardContent>
      </Card>
      {dados.data?.ordens.map((o) => (
        <Card key={o.id}><CardContent className="flex flex-wrap items-center justify-between gap-2 pt-6 text-sm">
          <div>
            <p className="font-medium">{o.trabalho}{o.dente ? ` · dente ${o.dente}` : ""}{o.cor ? ` · cor ${o.cor}` : ""}</p>
            <p className="text-xs text-muted-foreground">
              {o.laboratorios?.nome} · enviado {dataBR(o.enviado_em + "T12:00:00")}
              {o.prazo ? ` · prazo ${dataBR(o.prazo + "T12:00:00")}` : ""} · {brl(Number(o.custo))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {o.status === "enviado" && o.prazo && o.prazo < hoje && <Badge variant="destructive">atrasado</Badge>}
            <Select value={o.status} onValueChange={(s) => status.mutate({ id: o.id, s })}>
              <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_ORDEM).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}
