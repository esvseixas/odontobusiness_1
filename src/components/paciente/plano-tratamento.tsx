import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, PenLine, Printer } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { mensagemErro } from "@/lib/erros";
import { brl, dataBR } from "@/lib/format";
import { AssinaturaPad } from "@/components/paciente/assinatura";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const STATUS_ITEM: Record<string, string> = {
  planejado: "Planejado",
  agendado: "Agendado",
  em_execucao: "Em execução",
  concluido: "Concluído",
  recusado: "Recusado",
};
export const STATUS_ORC: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  em_execucao: "Em execução",
  concluido: "Concluído",
  recusado: "Recusado",
};

export function usePlanos(pacienteId: string) {
  return useQuery({
    queryKey: ["planos", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*,orcamento_itens(*),orcamento_aceites(id,nome,canal,created_at)")
        .eq("paciente_id", pacienteId)
        .order("versao", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
type Plano = NonNullable<ReturnType<typeof usePlanos>["data"]>[number];

export function PlanoTratamento({ pacienteId }: { pacienteId: string }) {
  const qc = useQueryClient();
  const planos = usePlanos(pacienteId);
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["planos", pacienteId] });
    qc.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
  };

  const gerar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("gerar_orcamento", { p_paciente: pacienteId, p_validade_dias: 30 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Orçamento gerado a partir do odontograma."); invalidar(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => gerar.mutate()} disabled={gerar.isPending}>
          Gerar orçamento do odontograma
        </Button>
      </div>
      {(planos.data ?? []).length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          Nenhum orçamento. Marque procedimentos planejados no odontograma e gere um orçamento.
        </CardContent></Card>
      ) : (
        planos.data!.map((o) => <CardPlano key={o.id} o={o} pacienteId={pacienteId} onChange={invalidar} />)
      )}
    </div>
  );
}

function totais(o: Plano, aprovados: Set<string>, tipo: string, desconto: number) {
  const bruto = o.orcamento_itens.filter((i) => aprovados.has(i.id))
    .reduce((s, i) => s + i.quantidade * Number(i.valor_unitario), 0);
  const desc = tipo === "percentual" ? Math.round(bruto * desconto) / 100 : Math.min(desconto, bruto);
  return { bruto, desc, liquido: Math.max(bruto - desc, 0) };
}

function CardPlano({ o, pacienteId, onChange }: { o: Plano; pacienteId: string; onChange: () => void }) {
  const pendente = o.status === "pendente";
  const [aprovados, setAprovados] = useState(new Set(o.orcamento_itens.filter((i) => i.aprovado).map((i) => i.id)));
  const [tipo, setTipo] = useState(o.desconto_tipo);
  const [desconto, setDesconto] = useState(String(o.desconto_tipo === "percentual" ? o.desconto_percentual : o.desconto));
  const [validade, setValidade] = useState(o.validade ?? "");
  useEffect(() => {
    setAprovados(new Set(o.orcamento_itens.filter((i) => i.aprovado).map((i) => i.id)));
  }, [o]);
  const t = totais(o, aprovados, tipo, Number(desconto) || 0);
  const vencido = pendente && o.validade && o.validade < new Date().toISOString().slice(0, 10);

  const ajustar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("ajustar_orcamento", {
        p_orcamento: o.id, p_itens_aprovados: [...aprovados], p_desconto_tipo: tipo,
        p_desconto: Number(desconto) || 0, p_validade: validade || (null as never),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Ajustes salvos."); onChange(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const aprovar = useMutation({
    mutationFn: async (op: OpcoesAprovacao) => {
      const r1 = await supabase.rpc("ajustar_orcamento", {
        p_orcamento: o.id, p_itens_aprovados: [...aprovados], p_desconto_tipo: tipo,
        p_desconto: Number(desconto) || 0, p_validade: validade || (null as never),
      });
      if (r1.error) throw r1.error;
      const { error } = await supabase.rpc("aprovar_orcamento", {
        p_orcamento: o.id, p_parcelas: op.parcelas, p_dia_vencimento: op.dia,
        p_forma_pagamento: op.forma, p_entrada: op.entrada,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Orçamento aprovado e parcelas geradas no financeiro."); onChange(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const status = useMutation({
    mutationFn: async ({ item, s }: { item: string; s: string }) => {
      const { error } = await supabase.rpc("atualizar_item_tratamento", { p_item: item, p_status: s });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Etapa atualizada."); onChange(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const link = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("gerar_link_aceite_orcamento", { p_orcamento: o.id });
      if (error) throw error;
      const url = `${window.location.origin}/aceite/${data}`;
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      return url;
    },
    onSuccess: (url) => toast.success("Link de aceite copiado (válido por 7 dias).", { description: url }),
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const concluidos = o.orcamento_itens.filter((i) => i.aprovado && i.status === "concluido").length;
  const totalAprov = o.orcamento_itens.filter((i) => i.aprovado && i.status !== "recusado").length;

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Orçamento v{o.versao} · {brl(pendente ? t.liquido : Number(o.valor_total) - Number(o.desconto))}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Criado em {dataBR(o.created_at)}{o.validade ? ` · válido até ${dataBR(o.validade)}` : ""}
            {!pendente && totalAprov > 0 ? ` · ${concluidos}/${totalAprov} etapas concluídas` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vencido && <Badge variant="destructive">vencido</Badge>}
          {o.aceito_em && <Badge variant="outline">aceito pelo paciente</Badge>}
          <Badge variant={pendente ? "secondary" : "default"}>{STATUS_ORC[o.status] ?? o.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="divide-y rounded-md border">
          {o.orcamento_itens.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-2">
              <label className="flex items-center gap-2">
                {pendente ? (
                  <Checkbox
                    checked={aprovados.has(i.id)}
                    onCheckedChange={(v) => {
                      const n = new Set(aprovados);
                      if (v) n.add(i.id); else n.delete(i.id);
                      setAprovados(n);
                    }}
                    aria-label={`Aprovar ${i.descricao}`}
                  />
                ) : null}
                <span className={i.status === "recusado" ? "text-muted-foreground line-through" : ""}>
                  {i.descricao}{i.quantidade > 1 ? ` × ${i.quantidade}` : ""}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{brl(i.quantidade * Number(i.valor_unitario))}</span>
                {!pendente && i.status !== "recusado" ? (
                  <Select value={i.status} onValueChange={(s) => status.mutate({ item: i.id, s })}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["planejado", "agendado", "em_execucao", "concluido"].map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_ITEM[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : !pendente ? <Badge variant="outline">Recusado</Badge> : null}
              </div>
            </div>
          ))}
        </div>

        {pendente && (
          <div className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label>Desconto em</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor">R$</SelectItem>
                  <SelectItem value="percentual">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`desc-${o.id}`}>Desconto</Label>
              <Input id={`desc-${o.id}`} type="number" min={0} step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`val-${o.id}`}>Validade</Label>
              <Input id={`val-${o.id}`} type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
            </div>
            <div className="space-y-1 text-right">
              <p className="text-xs text-muted-foreground">Subtotal {brl(t.bruto)} · desconto {brl(t.desc)}</p>
              <p className="text-lg font-semibold">{brl(t.liquido)}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {pendente && (
            <>
              <Button size="sm" variant="outline" onClick={() => ajustar.mutate()} disabled={ajustar.isPending}>Salvar ajustes</Button>
              <AprovarOrcamento total={t.liquido} onAprovar={(op) => aprovar.mutate(op)} />
            </>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link to="/impressao/orcamento/$id" params={{ id: o.id }} target="_blank">
              <Printer className="mr-1 h-4 w-4" /> Imprimir / PDF
            </Link>
          </Button>
          {!o.aceito_em && (
            <>
              <AceiteTela orcamentoId={o.id} onOk={onChange} />
              <Button size="sm" variant="outline" onClick={() => link.mutate()} disabled={link.isPending}>
                <Link2 className="mr-1 h-4 w-4" /> Link de aceite
              </Button>
            </>
          )}
        </div>
        {o.orcamento_aceites.map((a) => (
          <p key={a.id} className="text-xs text-muted-foreground">
            Aceite de {a.nome} ({a.canal === "tela" ? "assinado na clínica" : "por link"}) em {dataBR(a.created_at)}
          </p>
        ))}
        <p className="sr-only">Paciente {pacienteId}</p>
      </CardContent>
    </Card>
  );
}

function AceiteTela({ orcamentoId, onOk }: { orcamentoId: string; onOk: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [doc, setDoc] = useState("");
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("registrar_aceite_orcamento", {
        p_orcamento: orcamentoId, p_nome: nome, p_documento: doc, p_assinatura: assinatura ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Aceite registrado."); setAberto(false); onOk(); },
    onError: (e) => toast.error(mensagemErro(e)),
  });
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setAberto(true)}><PenLine className="mr-1 h-4 w-4" /> Assinar na tela</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aceite do paciente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1"><Label htmlFor="ac-nome">Nome de quem assina</Label><Input id="ac-nome" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="ac-doc">CPF (opcional)</Label><Input id="ac-doc" value={doc} onChange={(e) => setDoc(e.target.value)} /></div>
            </div>
            <AssinaturaPad onChange={setAssinatura} />
            <Button className="w-full" disabled={!nome || !assinatura || salvar.isPending} onClick={() => salvar.mutate()}>Registrar aceite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type OpcoesAprovacao = { parcelas: number; dia: number; forma: string; entrada: number };

function AprovarOrcamento({ total, onAprovar }: { total: number; onAprovar: (opcoes: OpcoesAprovacao) => void }) {
  const [aberto, setAberto] = useState(false);
  const [parcelas, setParcelas] = useState("1");
  const [dia, setDia] = useState(String(new Date().getDate()));
  const [forma, setForma] = useState("Pix");
  const [entrada, setEntrada] = useState("0");
  return (
    <>
      <Button size="sm" onClick={() => setAberto(true)}>Aprovar itens selecionados</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aprovar orçamento · {brl(total)}</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="ap-parcelas">Número de parcelas</Label>
              <Input id="ap-parcelas" type="number" min={1} max={48} value={parcelas} onChange={(e) => setParcelas(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="ap-dia">Dia de vencimento</Label>
              <Input id="ap-dia" type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="ap-forma">Forma de pagamento</Label>
              <Input id="ap-forma" value={forma} onChange={(e) => setForma(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="ap-entrada">Entrada (R$)</Label>
              <Input id="ap-entrada" type="number" min={0} step="0.01" value={entrada} onChange={(e) => setEntrada(e.target.value)} /></div>
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Só os itens marcados entram no tratamento; os demais ficam como recusados. Parcelas sem perda de centavos.
            </p>
            <Button className="sm:col-span-2" onClick={() => {
              onAprovar({ parcelas: Number(parcelas) || 1, dia: Number(dia) || 1, forma: forma || "A definir", entrada: Number(entrada) || 0 });
              setAberto(false);
            }}>Aprovar e gerar parcelas</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
