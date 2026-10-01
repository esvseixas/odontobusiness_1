import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, PackagePlus, Plus } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSessao, type Papel } from "@/hooks/useSessao";
import { NOME_PAPEL } from "@/lib/permissoes";
import { supabase } from "@/integrations/supabase/client";
import { brl, dataBR, horaBR } from "@/lib/format";

function useCriarRegistro<T extends Record<string, unknown>>(
  tabela: string,
  queryKey: string,
  limpar: () => void,
) {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (valores: T) => {
      if (!sessao?.clinicaId) throw new Error("Clínica não identificada.");
      const { error } = await supabase
        .from(tabela as never)
        .insert({ ...valores, clinica_id: sessao.clinicaId } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      limpar();
      toast.success("Registro salvo.");
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
}

function TituloCard({ children }: { children: string }) {
  return <CardTitle className="text-base">{children}</CardTitle>;
}

export function ClinicaPage() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const salvar = useMutation({
    mutationFn: async (valores: {
      nome: string;
      cnpj: string;
      telefone: string;
      endereco: string;
      regime_tributario: string;
    }) => {
      if (!sessao?.clinicaId) throw new Error("Clínica não identificada.");
      const { error } = await supabase.from("clinicas").update(valores).eq("id", sessao.clinicaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados da clínica atualizados.");
      queryClient.invalidateQueries();
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
  return (
    <Card>
      <CardHeader>
        <TituloCard>Dados da clínica</TituloCard>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            salvar.mutate({
              nome: String(fd.get("nome")),
              cnpj: String(fd.get("cnpj")),
              telefone: String(fd.get("telefone")),
              endereco: String(fd.get("endereco")),
              regime_tributario: String(fd.get("regime")),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" defaultValue={sessao?.clinica?.nome ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" name="cnpj" defaultValue={sessao?.clinica?.cnpj ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input id="telefone" name="telefone" defaultValue={sessao?.clinica?.telefone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regime">Regime tributário</Label>
            <Input
              id="regime"
              name="regime"
              defaultValue={sessao?.clinica?.regime_tributario ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" name="endereco" defaultValue={sessao?.clinica?.endereco ?? ""} />
          </div>
          <Button className="sm:col-span-2" disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function UnidadesPage() {
  const { data: sessao } = useSessao();
  const [form, setForm] = useState({ nome: "", endereco: "" });
  const dados = useQuery({
    queryKey: ["config-unidades", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("unidades").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
  const criar = useCriarRegistro("unidades", "config-unidades", () =>
    setForm({ nome: "", endereco: "" }),
  );
  return (
    <Card>
      <CardHeader>
        <TituloCard>Unidades da rede</TituloCard>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Nome da unidade"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            placeholder="Endereço"
            value={form.endereco}
            onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          />
          <Button onClick={() => criar.mutate(form)} disabled={!form.nome || criar.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
        {dados.data?.map((u) => (
          <div key={u.id} className="flex justify-between rounded-md border p-3 text-sm">
            <span>{u.nome}</span>
            <span className="text-muted-foreground">{u.endereco ?? "—"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const TIPO_PROC: Record<string, string> = { odontologico: "Odontológico", estetico: "Estético", outro: "Outro" };
const PUBLICO: Record<string, string> = { unissex: "Unissex", feminino: "Feminino", masculino: "Masculino" };

export function ProcedimentosPage() {
  const { data: sessao } = useSessao();
  const vazio = {
    nome: "",
    codigo: "",
    codigo_tuss: "",
    especialidade_id: "",
    tipo: "odontologico",
    publico: "unissex",
    valor: "",
    custo_estimado: "",
    duracao_minutos: "30",
    sessoes_previstas: "1",
    intervalo_retorno_dias: "",
    requer_termo: false,
    exige_lote_aplicado: false,
  };
  const [form, setForm] = useState(vazio);
  const [novaEsp, setNovaEsp] = useState("");
  const dados = useQuery({
    queryKey: ["config-procedimentos", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const [p, e] = await Promise.all([
        supabase.from("procedimentos").select("*,especialidades(nome)").order("nome"),
        supabase.from("especialidades").select("*").eq("ativo", true).order("nome"),
      ]);
      if (p.error) throw p.error;
      if (e.error) throw e.error;
      return { procedimentos: p.data, especialidades: e.data };
    },
  });
  const criar = useCriarRegistro("procedimentos", "config-procedimentos", () => setForm(vazio));
  const criarEsp = useCriarRegistro("especialidades", "config-procedimentos", () => setNovaEsp(""));
  const esp = dados.data?.especialidades ?? [];
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <TituloCard>Novo procedimento</TituloCard>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="proc-nome">Nome *</Label>
            <Input id="proc-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proc-esp">Especialidade</Label>
            <Select value={form.especialidade_id} onValueChange={(v) => setForm({ ...form, especialidade_id: v })}>
              <SelectTrigger id="proc-esp"><SelectValue placeholder="Escolha" /></SelectTrigger>
              <SelectContent>
                {esp.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proc-tipo">Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
              <SelectTrigger id="proc-tipo"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_PROC).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proc-publico">Público</Label>
            <Select value={form.publico} onValueChange={(v) => setForm({ ...form, publico: v })}>
              <SelectTrigger id="proc-publico"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PUBLICO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {([
            ["codigo", "Código interno", "text"],
            ["codigo_tuss", "Código TUSS", "text"],
            ["valor", "Valor (R$)", "number"],
            ["custo_estimado", "Custo estimado (R$)", "number"],
            ["duracao_minutos", "Duração (min)", "number"],
            ["sessoes_previstas", "Sessões previstas", "number"],
            ["intervalo_retorno_dias", "Retorno (dias)", "number"],
          ] as const).map(([k, rotulo, tipo]) => (
            <div key={k} className="space-y-1.5">
              <Label htmlFor={`proc-${k}`}>{rotulo}</Label>
              <Input
                id={`proc-${k}`}
                type={tipo}
                step={tipo === "number" ? "0.01" : undefined}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.requer_termo} onCheckedChange={(v) => setForm({ ...form, requer_termo: !!v })} />
            Requer termo de consentimento
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.exige_lote_aplicado} onCheckedChange={(v) => setForm({ ...form, exige_lote_aplicado: !!v })} />
            Exige registro do lote aplicado
          </label>
          <Button
            className="sm:col-span-2 lg:col-span-4"
            disabled={!form.nome || criar.isPending}
            onClick={() => {
              const nomeEsp = esp.find((e) => e.id === form.especialidade_id)?.nome ?? null;
              criar.mutate({
                nome: form.nome,
                codigo: form.codigo || null,
                codigo_tuss: form.codigo_tuss || null,
                especialidade_id: form.especialidade_id || null,
                categoria: nomeEsp,
                tipo: form.tipo,
                publico: form.publico,
                valor: Number(form.valor || 0),
                custo_estimado: Number(form.custo_estimado || 0),
                duracao_minutos: Number(form.duracao_minutos || 30),
                sessoes_previstas: Number(form.sessoes_previstas || 1),
                intervalo_retorno_dias: num(form.intervalo_retorno_dias),
                requer_termo: form.requer_termo,
                exige_lote_aplicado: form.exige_lote_aplicado,
              });
            }}
          >
            Adicionar procedimento
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <TituloCard>Tabela de procedimentos</TituloCard>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>TUSS</TableHead>
                <TableHead className="text-right">Duração</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.data?.procedimentos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.nome}
                    {p.requer_termo ? <Badge variant="outline" className="ml-2">termo</Badge> : null}
                  </TableCell>
                  <TableCell>{p.especialidades?.nome ?? p.categoria ?? "—"}</TableCell>
                  <TableCell>{TIPO_PROC[p.tipo] ?? p.tipo} · {PUBLICO[p.publico] ?? p.publico}</TableCell>
                  <TableCell>{p.codigo_tuss ?? "—"}</TableCell>
                  <TableCell className="text-right">{p.duracao_minutos} min{p.sessoes_previstas > 1 ? ` · ${p.sessoes_previstas}x` : ""}</TableCell>
                  <TableCell className="text-right">{brl(Number(p.custo_estimado))}</TableCell>
                  <TableCell className="text-right">{brl(Number(p.valor))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <TituloCard>Especialidades</TituloCard>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {esp.map((e) => <Badge key={e.id} variant="secondary">{e.nome}</Badge>)}
          </div>
          <div className="flex max-w-md gap-2">
            <Input aria-label="Nova especialidade" placeholder="Nova especialidade" value={novaEsp} onChange={(e) => setNovaEsp(e.target.value)} />
            <Button variant="outline" disabled={!novaEsp.trim()} onClick={() => criarEsp.mutate({ nome: novaEsp.trim() })}>
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TabelasPrecoPage() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [nova, setNova] = useState({ nome: "", tipo: "particular", convenio_id: "" });
  const [tabelaId, setTabelaId] = useState("");
  const [valores, setValores] = useState<Record<string, string>>({});
  const dados = useQuery({
    queryKey: ["config-tabelas-preco", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const [t, p, c, i] = await Promise.all([
        supabase.from("tabelas_preco").select("*,convenios(nome)").order("nome"),
        supabase.from("procedimentos").select("id,nome,valor").eq("ativo", true).order("nome"),
        supabase.from("convenios").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("tabela_preco_itens").select("*"),
      ]);
      for (const r of [t, p, c, i]) if (r.error) throw r.error;
      return { tabelas: t.data ?? [], procedimentos: p.data ?? [], convenios: c.data ?? [], itens: i.data ?? [] };
    },
  });
  const tabelas = dados.data?.tabelas ?? [];
  const selecionada = tabelaId || tabelas[0]?.id || "";
  const itensTabela = (dados.data?.itens ?? []).filter((i) => i.tabela_id === selecionada);
  const criarTabela = useCriarRegistro("tabelas_preco", "config-tabelas-preco", () =>
    setNova({ nome: "", tipo: "particular", convenio_id: "" }),
  );
  const salvarPrecos = useMutation({
    mutationFn: async () => {
      const linhas = Object.entries(valores)
        .filter(([, v]) => v !== "")
        .map(([procedimento_id, v]) => ({
          clinica_id: sessao!.clinicaId!,
          tabela_id: selecionada,
          procedimento_id,
          valor: Math.round(Number(v) * 100) / 100,
        }));
      if (!linhas.length) return;
      const { error } = await supabase.from("tabela_preco_itens").upsert(linhas, { onConflict: "tabela_id,procedimento_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preços salvos.");
      setValores({});
      queryClient.invalidateQueries({ queryKey: ["config-tabelas-preco"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <TituloCard>Nova tabela de preço</TituloCard>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <Input aria-label="Nome da tabela" placeholder="Nome (ex.: Plano Sorriso)" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} />
          <Select value={nova.tipo} onValueChange={(v) => setNova({ ...nova, tipo: v })}>
            <SelectTrigger aria-label="Tipo da tabela"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="particular">Particular</SelectItem>
              <SelectItem value="convenio">Convênio</SelectItem>
              <SelectItem value="plano_interno">Plano interno</SelectItem>
            </SelectContent>
          </Select>
          <Select value={nova.convenio_id} onValueChange={(v) => setNova({ ...nova, convenio_id: v })} disabled={nova.tipo !== "convenio"}>
            <SelectTrigger aria-label="Convênio"><SelectValue placeholder="Convênio" /></SelectTrigger>
            <SelectContent>
              {dados.data?.convenios.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            disabled={!nova.nome.trim() || (nova.tipo === "convenio" && !nova.convenio_id)}
            onClick={() => criarTabela.mutate({ nome: nova.nome.trim(), tipo: nova.tipo, convenio_id: nova.tipo === "convenio" ? nova.convenio_id : null })}
          >
            Criar tabela
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
          <TituloCard>Preços por procedimento</TituloCard>
          <Select value={selecionada} onValueChange={(v) => { setTabelaId(v); setValores({}); }}>
            <SelectTrigger className="w-64" aria-label="Tabela selecionada"><SelectValue placeholder="Escolha a tabela" /></SelectTrigger>
            <SelectContent>
              {tabelas.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nome}{t.convenios?.nome ? ` (${t.convenios.nome})` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead className="text-right">Valor base</TableHead>
                <TableHead className="w-40 text-right">Valor nesta tabela</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.data?.procedimentos.map((p) => {
                const atual = itensTabela.find((i) => i.procedimento_id === p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.nome}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{brl(Number(p.valor))}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        aria-label={`Preço de ${p.nome}`}
                        type="number"
                        step="0.01"
                        className="ml-auto w-32 text-right"
                        placeholder={atual ? String(atual.valor) : "—"}
                        value={valores[p.id] ?? ""}
                        onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Button disabled={!selecionada || !Object.values(valores).some(Boolean) || salvarPrecos.isPending} onClick={() => salvarPrecos.mutate()}>
            Salvar preços
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ConveniosPage() {
  const { data: sessao } = useSessao();
  const [form, setForm] = useState({ nome: "", registro_ans: "" });
  const dados = useQuery({
    queryKey: ["config-convenios", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("convenios").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });
  const criar = useCriarRegistro("convenios", "config-convenios", () =>
    setForm({ nome: "", registro_ans: "" }),
  );
  return (
    <Card>
      <CardHeader>
        <TituloCard>Convênios aceitos</TituloCard>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Nome do convênio"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            placeholder="Registro ANS"
            value={form.registro_ans}
            onChange={(e) => setForm({ ...form, registro_ans: e.target.value })}
          />
          <Button onClick={() => criar.mutate(form)} disabled={!form.nome}>
            Adicionar
          </Button>
        </div>
        {dados.data?.map((c) => (
          <div key={c.id} className="flex justify-between rounded-md border p-3 text-sm">
            <span>{c.nome}</span>
            <span className="text-muted-foreground">{c.registro_ans ?? "—"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function EquipePage() {
  const { data: sessao } = useSessao();
  const vazio = { nome: "", cro: "", especialidade: "", comissao_percentual: "0" };
  const [form, setForm] = useState(vazio);
  const dados = useQuery({
    queryKey: ["config-equipe", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      if (!sessao?.clinicaId) return { profissionais: [], equipe: [] };
      const [p, e] = await Promise.all([
        supabase.from("profissionais").select("*").order("nome"),
        supabase.from("profiles").select("*").eq("clinica_id", sessao.clinicaId),
      ]);
      if (p.error) throw p.error;
      if (e.error) throw e.error;
      return { profissionais: p.data, equipe: e.data };
    },
  });
  const criar = useCriarRegistro("profissionais", "config-equipe", () => setForm(vazio));
  return (
    <Card>
      <CardHeader>
        <TituloCard>Equipe e profissionais</TituloCard>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-5">
          <Input
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Input
            placeholder="CRO"
            value={form.cro}
            onChange={(e) => setForm({ ...form, cro: e.target.value })}
          />
          <Input
            placeholder="Especialidade"
            value={form.especialidade}
            onChange={(e) => setForm({ ...form, especialidade: e.target.value })}
          />
          <Input
            placeholder="Comissão %"
            type="number"
            value={form.comissao_percentual}
            onChange={(e) => setForm({ ...form, comissao_percentual: e.target.value })}
          />
          <Button
            onClick={() =>
              criar.mutate({ ...form, comissao_percentual: Number(form.comissao_percentual || 0) })
            }
            disabled={!form.nome}
          >
            Adicionar
          </Button>
        </div>
        {dados.data?.profissionais.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap justify-between gap-2 rounded-md border p-3 text-sm"
          >
            <span>
              {p.nome}{" "}
              <span className="text-muted-foreground">
                · {p.especialidade ?? "—"} · CRO {p.cro ?? "—"}
              </span>
            </span>
            <Badge variant="secondary">comissão {Number(p.comissao_percentual)}%</Badge>
          </div>
        ))}
        <div className="pt-4">
          <p className="mb-2 text-sm font-medium">Usuários com acesso</p>
          {dados.data?.equipe.map((u) => (
            <div key={u.id} className="flex justify-between rounded-md border p-3 text-sm">
              <span>{u.nome || u.email}</span>
              <span className="text-muted-foreground">{u.email}</span>
            </div>
          ))}
        </div>
        <Convites />
      </CardContent>
    </Card>
  );
}

const PAPEIS_CONVITE: Papel[] = [
  "admin",
  "dentista",
  "esteticista",
  "auxiliar",
  "recepcao",
  "financeiro",
  "estoque",
  "marketing",
];

function Convites() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("recepcao");
  const lista = useQuery({
    queryKey: ["config-convites", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("convites")
        .select("*")
        .is("aceito_em", null)
        .is("revogado_em", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const atualizar = () => queryClient.invalidateQueries({ queryKey: ["config-convites"] });
  const convidar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("convites")
        .insert({ clinica_id: sessao?.clinicaId ?? "", email: email.trim().toLowerCase(), papel });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite criado. Copie o link e envie ao membro.");
      setEmail("");
      atualizar();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const revogar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("convites")
        .update({ revogado_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: atualizar,
    onError: (e: Error) => toast.error(e.message),
  });
  function copiar(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/convite/${token}`);
    toast.success("Link copiado.");
  }
  return (
    <div className="space-y-3 border-t pt-4">
      <p className="text-sm font-medium">Convidar membro</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <Input
          aria-label="E-mail do convidado"
          type="email"
          placeholder="email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
          <SelectTrigger aria-label="Papel do convidado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAPEIS_CONVITE.map((p) => (
              <SelectItem key={p} value={p}>
                {NOME_PAPEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => convidar.mutate()} disabled={!email.includes("@") || convidar.isPending}>
          Convidar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">O link vale por 7 dias e só funciona para o e-mail convidado.</p>
      {lista.data?.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
          <span>
            {c.email} <Badge variant="secondary">{NOME_PAPEL[c.papel as Papel] ?? c.papel}</Badge>
            <span className="ml-2 text-xs text-muted-foreground">
              expira {new Date(c.expira_em).toLocaleDateString("pt-BR")}
            </span>
          </span>
          <span className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copiar(c.token)}>
              Copiar link
            </Button>
            <Button size="sm" variant="ghost" onClick={() => revogar.mutate(c.id)}>
              Revogar
            </Button>
          </span>
        </div>
      ))}
    </div>
  );
}

export function PlanoContasPage() {
  const { data: sessao } = useSessao();
  const [form, setForm] = useState({ nome: "", tipo: "despesa", centro_custo: "" });
  const dados = useQuery({
    queryKey: ["config-contas", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase.from("plano_contas").select("*").order("tipo");
      if (error) throw error;
      return data;
    },
  });
  const criar = useCriarRegistro("plano_contas", "config-contas", () =>
    setForm({ nome: "", tipo: "despesa", centro_custo: "" }),
  );
  return (
    <Card>
      <CardHeader>
        <TituloCard>Plano de contas</TituloCard>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            placeholder="Nome da conta"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receita">Receita</SelectItem>
              <SelectItem value="despesa">Despesa</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Centro de custo"
            value={form.centro_custo}
            onChange={(e) => setForm({ ...form, centro_custo: e.target.value })}
          />
          <Button onClick={() => criar.mutate(form)} disabled={!form.nome}>
            Adicionar
          </Button>
        </div>
        {dados.data?.map((c) => (
          <div key={c.id} className="flex justify-between rounded-md border p-3 text-sm">
            <span>{c.nome}</span>
            <Badge variant={c.tipo === "receita" ? "default" : "secondary"}>{c.tipo}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

type LoteForm = {
  item_id: string;
  numero_lote: string;
  quantidade: string;
  validade: string;
  entrada_em: string;
  unidade_id: string;
};
const loteVazio = (): LoteForm => ({
  item_id: "",
  numero_lote: "",
  quantidade: "",
  validade: "",
  entrada_em: new Date().toISOString().slice(0, 10),
  unidade_id: "",
});
export function EstoquePage() {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const produtoVazio = { nome: "", unidade_medida: "un", estoque_minimo: "0", fornecedor: "" };
  const [produto, setProduto] = useState(produtoVazio);
  const [lote, setLote] = useState<LoteForm>(loteVazio());
  const [novoLoteAberto, setNovoLoteAberto] = useState(false);
  const [produtoExpandido, setProdutoExpandido] = useState<string | null>(null);
  const dados = useQuery({
    queryKey: ["config-estoque", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const [itens, lotes, unidades] = await Promise.all([
        supabase.from("estoque_itens").select("*").order("nome"),
        supabase
          .from("estoque_lotes")
          .select("*")
          .order("validade", { ascending: true, nullsFirst: false }),
        supabase.from("unidades").select("id,nome").eq("ativo", true).order("nome"),
      ]);
      if (itens.error) throw itens.error;
      if (lotes.error) throw lotes.error;
      if (unidades.error) throw unidades.error;
      return { itens: itens.data, lotes: lotes.data, unidades: unidades.data };
    },
  });
  const criarProduto = useCriarRegistro("estoque_itens", "config-estoque", () =>
    setProduto(produtoVazio),
  );
  const criarLote = useMutation({
    mutationFn: async () => {
      if (!sessao?.clinicaId || !lote.item_id) throw new Error("Selecione um produto.");
      const { error } = await supabase
        .from("estoque_lotes")
        .insert({
          clinica_id: sessao.clinicaId,
          item_id: lote.item_id,
          numero_lote: lote.numero_lote || null,
          quantidade: Number(lote.quantidade || 0),
          validade: lote.validade || null,
          entrada_em: lote.entrada_em,
          unidade_id: lote.unidade_id || null,
          created_by: sessao.user.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setLote(loteVazio());
      setNovoLoteAberto(false);
      toast.success("Lote incluído no estoque.");
      queryClient.invalidateQueries({ queryKey: ["config-estoque"] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + 30 * 86400000);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <TituloCard>Cadastro de produtos</TituloCard>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="produto-nome">Produto</Label>
              <Input
                id="produto-nome"
                placeholder="Nome do material ou insumo"
                value={produto.nome}
                onChange={(e) => setProduto({ ...produto, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="produto-unidade">Unidade de medida</Label>
              <Input
                id="produto-unidade"
                placeholder="un, cx, ml"
                value={produto.unidade_medida}
                onChange={(e) => setProduto({ ...produto, unidade_medida: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="produto-minimo">Estoque mínimo</Label>
              <Input
                id="produto-minimo"
                type="number"
                min="0"
                value={produto.estoque_minimo}
                onChange={(e) => setProduto({ ...produto, estoque_minimo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="produto-fornecedor">Fornecedor</Label>
              <Input
                id="produto-fornecedor"
                placeholder="Fornecedor principal"
                value={produto.fornecedor}
                onChange={(e) => setProduto({ ...produto, fornecedor: e.target.value })}
              />
            </div>
            <Button
              className="sm:col-span-2 lg:col-span-5"
              onClick={() =>
                criarProduto.mutate({
                  ...produto,
                  estoque_minimo: Number(produto.estoque_minimo || 0),
                })
              }
              disabled={!produto.nome || criarProduto.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar produto
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <TituloCard>Produtos e lotes</TituloCard>
            <p className="mt-1 text-sm text-muted-foreground">
              O saldo é calculado pela soma dos lotes cadastrados.
            </p>
          </div>
          <Button onClick={() => setNovoLoteAberto((v) => !v)}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Incluir lote
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {novoLoteAberto ? (
            <div className="grid gap-3 rounded-md border bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="lote-produto">Produto</Label>
                <Select
                  value={lote.item_id}
                  onValueChange={(v) => setLote({ ...lote, item_id: v })}
                >
                  <SelectTrigger id="lote-produto">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {dados.data?.itens.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-numero">Número do lote</Label>
                <Input
                  id="lote-numero"
                  value={lote.numero_lote}
                  onChange={(e) => setLote({ ...lote, numero_lote: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-quantidade">Quantidade</Label>
                <Input
                  id="lote-quantidade"
                  type="number"
                  min="0"
                  value={lote.quantidade}
                  onChange={(e) => setLote({ ...lote, quantidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-validade">Validade</Label>
                <Input
                  id="lote-validade"
                  type="date"
                  value={lote.validade}
                  onChange={(e) => setLote({ ...lote, validade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lote-entrada">Entrada</Label>
                <Input
                  id="lote-entrada"
                  type="date"
                  value={lote.entrada_em}
                  onChange={(e) => setLote({ ...lote, entrada_em: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="lote-unidade">Unidade</Label>
                <Select
                  value={lote.unidade_id || "sem-unidade"}
                  onValueChange={(v) =>
                    setLote({ ...lote, unidade_id: v === "sem-unidade" ? "" : v })
                  }
                >
                  <SelectTrigger id="lote-unidade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem-unidade">Sem unidade específica</SelectItem>
                    {dados.data?.unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button
                  className="flex-1"
                  onClick={() => criarLote.mutate()}
                  disabled={!lote.item_id || !lote.quantidade || criarLote.isPending}
                >
                  Salvar lote
                </Button>
                <Button variant="outline" onClick={() => setNovoLoteAberto(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <span className="sr-only">Detalhes</span>
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Mínimo</TableHead>
                <TableHead className="text-right">Quantidade total</TableHead>
                <TableHead>Próxima validade</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.data?.itens.map((item) => {
                const lotes = dados.data.lotes.filter((l) => l.item_id === item.id);
                const total = lotes.reduce((s, l) => s + Number(l.quantidade), 0);
                const validos = lotes
                  .filter((l) => l.validade)
                  .map((l) => l.validade as string)
                  .sort();
                const proxima = validos[0];
                const baixo = total <= Number(item.estoque_minimo);
                const expandido = produtoExpandido === item.id;
                return (
                    <Fragment key={item.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`${expandido ? "Ocultar" : "Ver"} lotes de ${item.nome}`}
                            aria-expanded={expandido}
                            onClick={() => setProdutoExpandido(expandido ? null : item.id)}
                          >
                            <ChevronRight className={`h-4 w-4 transition-transform ${expandido ? "rotate-90" : ""}`} />
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.unidade_medida ?? "—"}</TableCell>
                        <TableCell>{item.fornecedor ?? "—"}</TableCell>
                        <TableCell className="text-right">{Number(item.estoque_minimo)}</TableCell>
                        <TableCell className="text-right font-medium">{total}</TableCell>
                        <TableCell>{proxima ? dataBR(proxima) : "—"}</TableCell>
                        <TableCell>
                          {baixo ? (
                            <Badge variant="destructive">Abaixo do mínimo</Badge>
                          ) : (
                            <Badge variant="secondary">Regular</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandido ? (
                        <tr>
                          <td colSpan={8} className="bg-muted/20 px-5 py-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Lote</TableHead>
                                  <TableHead>Quantidade</TableHead>
                                  <TableHead>Validade</TableHead>
                                  <TableHead>Entrada</TableHead>
                                  <TableHead>Unidade</TableHead>
                                  <TableHead>Situação</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {lotes.length ? (
                                  lotes.map((l) => {
                                    const validade = l.validade
                                      ? new Date(`${l.validade}T12:00:00`)
                                      : null;
                                    const vencido = validade ? validade < hoje : false;
                                    const vencendo =
                                      validade && !vencido ? validade <= limite : false;
                                    return (
                                      <TableRow key={l.id}>
                                        <TableCell>{l.numero_lote ?? "Sem número"}</TableCell>
                                        <TableCell>
                                          {Number(l.quantidade)} {item.unidade_medida}
                                        </TableCell>
                                        <TableCell>
                                          {l.validade ? dataBR(l.validade) : "Sem validade"}
                                        </TableCell>
                                        <TableCell>{dataBR(l.entrada_em)}</TableCell>
                                        <TableCell>
                                          {dados.data.unidades.find((u) => u.id === l.unidade_id)
                                            ?.nome ?? "—"}
                                        </TableCell>
                                        <TableCell>
                                          {vencido ? (
                                            <Badge variant="destructive">Vencido</Badge>
                                          ) : vencendo ? (
                                            <Badge variant="outline">Vence em breve</Badge>
                                          ) : (
                                            <Badge variant="secondary">Válido</Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                ) : (
                                  <TableRow>
                                    <TableCell
                                      colSpan={6}
                                      className="text-center text-muted-foreground"
                                    >
                                      Nenhum lote cadastrado.
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuditoriaPage() {
  const { data: sessao } = useSessao();
  const dados = useQuery({
    queryKey: ["config-auditoria", sessao?.clinicaId],
    enabled: !!sessao?.clinicaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  return (
    <Card>
      <CardHeader>
        <TituloCard>Log de auditoria</TituloCard>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {dados.data?.length ? (
          dados.data.map((l) => (
            <div key={l.id} className="flex justify-between rounded-md border p-3">
              <span>
                {l.usuario_nome ?? "—"} {l.acao}
              </span>
              <span className="text-muted-foreground">
                {dataBR(l.created_at)} {horaBR(l.created_at)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">Nenhum registro ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
