import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, dataBR, horaBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | OdontoGestor" },
      { name: "description", content: "Unidades, procedimentos, convênios, profissionais, plano de contas e auditoria." },
      { property: "og:title", content: "Configurações | OdontoGestor" },
      { property: "og:description", content: "Unidades, procedimentos, convênios, profissionais e auditoria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();

  const [proc, setProc] = useState({ nome: "", codigo: "", categoria: "", valor: "", duracao_minutos: "30" });
  const [unidade, setUnidade] = useState({ nome: "", endereco: "" });
  const [convenio, setConvenio] = useState({ nome: "", registro_ans: "" });
  const [prof, setProf] = useState({ nome: "", cro: "", especialidade: "", comissao_percentual: "0" });
  const [conta, setConta] = useState({ nome: "", tipo: "despesa", centro_custo: "" });
  const [estoque, setEstoque] = useState({ nome: "", quantidade: "0", estoque_minimo: "0", unidade_medida: "un", validade: "", lote_codigo: "" });

  const dados = useQuery({
    enabled: !!clinicaId,
    queryKey: ["config", clinicaId],
    queryFn: async () => {
      const [unidades, procedimentos, convenios, profissionais, contas, logs, equipe, itens, lotes] = await Promise.all([
        supabase.from("unidades").select("*").order("nome"),
        supabase.from("procedimentos").select("*").order("categoria"),
        supabase.from("convenios").select("*").order("nome"),
        supabase.from("profissionais").select("*").order("nome"),
        supabase.from("plano_contas").select("*").order("tipo"),
        supabase.from("auditoria_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*").eq("clinica_id", clinicaId!),
        supabase.from("estoque_itens").select("*").order("nome"),
        supabase.from("estoque_lotes").select("*"),
      ]);
      return {
        unidades: unidades.data ?? [],
        procedimentos: procedimentos.data ?? [],
        convenios: convenios.data ?? [],
        profissionais: profissionais.data ?? [],
        contas: contas.data ?? [],
        logs: logs.data ?? [],
        equipe: equipe.data ?? [],
        itens: itens.data ?? [],
        lotes: lotes.data ?? [],
      };
    },
  });

  function mutacao<T>(tabela: string, limpar: () => void) {
    return async (valores: T) => {
      const { error } = await supabase.from(tabela as never).insert({ ...valores, clinica_id: clinicaId! } as never);
      if (error) return toast.error("Erro: " + error.message);
      limpar();
      toast.success("Registro salvo.");
      queryClient.invalidateQueries({ queryKey: ["config"] });
    };
  }

  const salvarProc = mutacao("procedimentos", () => setProc({ nome: "", codigo: "", categoria: "", valor: "", duracao_minutos: "30" }));
  const salvarUnidade = mutacao("unidades", () => setUnidade({ nome: "", endereco: "" }));
  const salvarConvenio = mutacao("convenios", () => setConvenio({ nome: "", registro_ans: "" }));
  const salvarProf = mutacao("profissionais", () => setProf({ nome: "", cro: "", especialidade: "", comissao_percentual: "0" }));
  const salvarConta = mutacao("plano_contas", () => setConta({ nome: "", tipo: "despesa", centro_custo: "" }));
  const salvarItem = async () => {
    if (!estoque.nome || !clinicaId) return;
    const { data: item, error: itemErr } = await supabase.from("estoque_itens").insert({
      nome: estoque.nome,
      unidade_medida: estoque.unidade_medida,
      estoque_minimo: Number(estoque.estoque_minimo || 0),
      clinica_id: clinicaId
    }).select().single();
    if (itemErr) return toast.error(itemErr.message);
    if (Number(estoque.quantidade) > 0 || estoque.validade) {
      const { error: loteErr } = await supabase.from("estoque_lotes").insert({
        item_id: item.id,
        quantidade: Number(estoque.quantidade || 0),
        validade: estoque.validade || null,
        lote_codigo: estoque.lote_codigo || null,
        clinica_id: clinicaId
      });
      if (loteErr) toast.error("Produto criado, mas erro no lote: " + loteErr.message);
    }
    setEstoque({ nome: "", quantidade: "0", estoque_minimo: "0", unidade_medida: "un", validade: "", lote_codigo: "" });
    toast.success("Produto registrado.");
    queryClient.invalidateQueries({ queryKey: ["config"] });
  };

  const salvarClinica = useMutation({
    mutationFn: async (valores: {
      nome: string;
      cnpj: string;
      telefone: string;
      endereco: string;
      regime_tributario: string;
    }) => {
      const { error } = await supabase.from("clinicas").update(valores).eq("id", clinicaId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados da clínica atualizados.");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader titulo="Configurações" descricao="Administração da clínica, tabelas e auditoria." />

      <Tabs defaultValue="clinica">
        <TabsList className="flex-wrap">
          <TabsTrigger value="clinica">Clínica</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
          <TabsTrigger value="procedimentos">Procedimentos</TabsTrigger>
          <TabsTrigger value="convenios">Convênios</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="contas">Plano de contas</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="clinica">
          <Card>
            <CardHeader><CardTitle className="text-base">Dados da clínica</CardTitle></CardHeader>
            <CardContent>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  salvarClinica.mutate({
                    nome: String(fd.get("nome")),
                    cnpj: String(fd.get("cnpj")),
                    telefone: String(fd.get("telefone")),
                    endereco: String(fd.get("endereco")),
                    regime_tributario: String(fd.get("regime")),
                  });
                }}
              >
                <div className="space-y-2"><Label>Nome</Label><Input name="nome" defaultValue={sessao?.clinica?.nome ?? ""} /></div>
                <div className="space-y-2"><Label>CNPJ</Label><Input name="cnpj" defaultValue={sessao?.clinica?.cnpj ?? ""} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input name="telefone" defaultValue={sessao?.clinica?.telefone ?? ""} /></div>
                <div className="space-y-2"><Label>Regime tributário</Label>
                  <Input name="regime" defaultValue={sessao?.clinica?.regime_tributario ?? ""} /></div>
                <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label>
                  <Input name="endereco" defaultValue={sessao?.clinica?.endereco ?? ""} /></div>
                <Button className="sm:col-span-2">Salvar alterações</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unidades">
          <Card>
            <CardHeader><CardTitle className="text-base">Unidades da rede</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Nome da unidade" value={unidade.nome} onChange={(e) => setUnidade({ ...unidade, nome: e.target.value })} />
                <Input placeholder="Endereço" value={unidade.endereco} onChange={(e) => setUnidade({ ...unidade, endereco: e.target.value })} />
                <Button onClick={() => salvarUnidade(unidade)} disabled={!unidade.nome}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
              </div>
              {dados.data?.unidades.map((u) => (
                <div key={u.id} className="flex justify-between rounded-md border p-3 text-sm">
                  <span>{u.nome}</span>
                  <span className="text-muted-foreground">{u.endereco ?? "—"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="procedimentos">
          <Card>
            <CardHeader><CardTitle className="text-base">Tabela de procedimentos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-6">
                <Input className="sm:col-span-2" placeholder="Nome" value={proc.nome} onChange={(e) => setProc({ ...proc, nome: e.target.value })} />
                <Input placeholder="Código" value={proc.codigo} onChange={(e) => setProc({ ...proc, codigo: e.target.value })} />
                <Input placeholder="Categoria" value={proc.categoria} onChange={(e) => setProc({ ...proc, categoria: e.target.value })} />
                <Input placeholder="Valor" type="number" value={proc.valor} onChange={(e) => setProc({ ...proc, valor: e.target.value })} />
                <Button
                  onClick={() => salvarProc({ ...proc, valor: Number(proc.valor || 0), duracao_minutos: Number(proc.duracao_minutos) })}
                  disabled={!proc.nome}
                >
                  Adicionar
                </Button>
              </div>
              {dados.data?.procedimentos.map((p) => (
                <div key={p.id} className="flex justify-between rounded-md border p-3 text-sm">
                  <span>{p.nome} <span className="text-muted-foreground">· {p.categoria ?? "—"}</span></span>
                  <span className="font-medium">{brl(Number(p.valor))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="convenios">
          <Card>
            <CardHeader><CardTitle className="text-base">Convênios aceitos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Nome do convênio" value={convenio.nome} onChange={(e) => setConvenio({ ...convenio, nome: e.target.value })} />
                <Input placeholder="Registro ANS" value={convenio.registro_ans} onChange={(e) => setConvenio({ ...convenio, registro_ans: e.target.value })} />
                <Button onClick={() => salvarConvenio(convenio)} disabled={!convenio.nome}>Adicionar</Button>
              </div>
              {dados.data?.convenios.map((c) => (
                <div key={c.id} className="flex justify-between rounded-md border p-3 text-sm">
                  <span>{c.nome}</span>
                  <span className="text-muted-foreground">{c.registro_ans ?? "—"}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe">
          <Card>
            <CardHeader><CardTitle className="text-base">Profissionais clínicos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-5">
                <Input placeholder="Nome" value={prof.nome} onChange={(e) => setProf({ ...prof, nome: e.target.value })} />
                <Input placeholder="CRO" value={prof.cro} onChange={(e) => setProf({ ...prof, cro: e.target.value })} />
                <Input placeholder="Especialidade" value={prof.especialidade} onChange={(e) => setProf({ ...prof, especialidade: e.target.value })} />
                <Input placeholder="Comissão %" type="number" value={prof.comissao_percentual} onChange={(e) => setProf({ ...prof, comissao_percentual: e.target.value })} />
                <Button onClick={() => salvarProf({ ...prof, comissao_percentual: Number(prof.comissao_percentual || 0) })} disabled={!prof.nome}>
                  Adicionar
                </Button>
              </div>
              {dados.data?.profissionais.map((p) => (
                <div key={p.id} className="flex justify-between rounded-md border p-3 text-sm">
                  <span>{p.nome} <span className="text-muted-foreground">· {p.especialidade ?? "—"} · CRO {p.cro ?? "—"}</span></span>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas">
          <Card>
            <CardHeader><CardTitle className="text-base">Plano de contas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <Input placeholder="Nome da conta" value={conta.nome} onChange={(e) => setConta({ ...conta, nome: e.target.value })} />
                <Select value={conta.tipo} onValueChange={(v) => setConta({ ...conta, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Centro de custo" value={conta.centro_custo} onChange={(e) => setConta({ ...conta, centro_custo: e.target.value })} />
                <Button onClick={() => salvarConta(conta)} disabled={!conta.nome}>Adicionar</Button>
              </div>
              {dados.data?.contas.map((c) => (
                <div key={c.id} className="flex justify-between rounded-md border p-3 text-sm">
                  <span>{c.nome}</span>
                  <Badge variant={c.tipo === "receita" ? "default" : "secondary"}>{c.tipo}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estoque">
          <Card>
            <CardHeader><CardTitle className="text-base">Materiais e insumos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-6">
                <Input className="sm:col-span-2" placeholder="Material" value={estoque.nome} onChange={(e) => setEstoque({ ...estoque, nome: e.target.value })} />
                <Input placeholder="Qtd." type="number" value={estoque.quantidade} onChange={(e) => setEstoque({ ...estoque, quantidade: e.target.value })} />
                <Input placeholder="Lote" value={estoque.lote_codigo} onChange={(e) => setEstoque({ ...estoque, lote_codigo: e.target.value })} />
                <Input placeholder="Mínimo" type="number" value={estoque.estoque_minimo} onChange={(e) => setEstoque({ ...estoque, estoque_minimo: e.target.value })} />
                <Input type="date" value={estoque.validade} onChange={(e) => setEstoque({ ...estoque, validade: e.target.value })} />
                <Button onClick={salvarItem} disabled={!estoque.nome}>
                  disabled={!estoque.nome}
                >
                  Adicionar
                </Button>
              </div>
              {dados.data?.itens.map((i) => {
                const itemLotes = dados.data?.lotes.filter((l: any) => l.item_id === i.id) || [];
                const totalQtd = itemLotes.reduce((acc: number, l: any) => acc + Number(l.quantidade), 0);
                const baixo = totalQtd <= Number(i.estoque_minimo);
                return (
                  <div key={i.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{i.nome} · {totalQtd} {i.unidade_medida}</span>
                      <div className="flex gap-2">
                        {baixo ? <Badge variant="destructive">estoque mínimo</Badge> : null}
                      </div>
                    </div>
                    {itemLotes.length > 0 && (
                      <div className="mt-2 space-y-1 border-t pt-2">
                        {itemLotes.map((l: any) => {
                          const vencendo = l.validade && new Date(l.validade).getTime() - Date.now() < 30 * 86400000;
                          return (
                            <div key={l.id} className="flex justify-between text-xs text-muted-foreground">
                              <span>Lote: {l.lote_codigo || "—"} · {Number(l.quantidade)} {i.unidade_medida}</span>
                              {l.validade && (
                                <span className={vencendo ? "text-destructive font-medium" : ""}>
                                  Val: {dataBR(l.validade)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria">
          <Card>
            <CardHeader><CardTitle className="text-base">Log de auditoria</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(dados.data?.logs ?? []).length === 0 ? (
                <p className="text-muted-foreground">Nenhum registro ainda.</p>
              ) : (
                dados.data?.logs.map((l) => (
                  <div key={l.id} className="flex justify-between rounded-md border p-3">
                    <span>{l.usuario_nome ?? "—"} {l.acao}</span>
                    <span className="text-muted-foreground">{dataBR(l.created_at)} {horaBR(l.created_at)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
