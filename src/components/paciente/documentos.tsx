import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Mail, MessageCircle, Printer } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { mensagemErro } from "@/lib/erros";
import { dataBR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const TIPOS_DOC: Record<string, string> = {
  atestado: "Atestado",
  declaracao: "Declaração de comparecimento",
  receituario: "Receituário simples",
  receituario_controle: "Receituário de controle especial",
  termo: "Termo de consentimento",
  orientacao: "Orientações",
  contrato: "Contrato",
  outro: "Outro",
};

type Paciente = { id: string; nome: string; cpf: string | null; endereco: string | null; cidade: string | null; telefone: string | null; email: string | null };

export function aplicarVariaveis(texto: string, vars: Record<string, string>) {
  return texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => (vars[k] ? vars[k] : m));
}

export function DocumentosPaciente({ paciente }: { paciente: Paciente }) {
  const { data: sessao } = useSessao();
  const qc = useQueryClient();
  const dados = useQuery({
    queryKey: ["docs", paciente.id],
    queryFn: async () => {
      const [m, d, p] = await Promise.all([
        supabase.from("documento_modelos").select("*").eq("ativo", true).order("titulo"),
        supabase.from("documentos_emitidos").select("*").eq("paciente_id", paciente.id).order("created_at", { ascending: false }),
        supabase.from("profissionais").select("id,nome,cro,user_id").eq("ativo", true).order("nome"),
      ]);
      return { modelos: m.data ?? [], docs: d.data ?? [], profissionais: p.data ?? [] };
    },
  });
  const [modeloId, setModeloId] = useState("");
  const [profId, setProfId] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [texto, setTexto] = useState("");
  const [titulo, setTitulo] = useState("");

  const modelo = dados.data?.modelos.find((m) => m.id === modeloId);
  const prof = dados.data?.profissionais.find((p) => p.id === profId)
    ?? dados.data?.profissionais.find((p) => p.user_id === sessao?.user.id);
  const clinica = sessao?.clinica;
  const agora = new Date();
  const base: Record<string, string> = {
    "paciente.nome": paciente.nome, "paciente.cpf": paciente.cpf ?? "", "paciente.endereco": paciente.endereco ?? "",
    "profissional.nome": prof?.nome ?? "", "profissional.cro": prof?.cro ?? "",
    "clinica.nome": clinica?.nome ?? "", "clinica.cnpj": clinica?.cnpj ?? "", "clinica.telefone": clinica?.telefone ?? "",
    data: agora.toLocaleDateString("pt-BR"), cidade: paciente.cidade ?? "",
  };
  const pendentes = useMemo(() => {
    if (!modelo) return [];
    const todas = [...modelo.conteudo.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((x) => x[1]);
    return [...new Set(todas)].filter((k) => !base[k]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelo, prof?.id, paciente.id]);

  const preencher = () => {
    if (!modelo) return;
    setTexto(aplicarVariaveis(modelo.conteudo, { ...base, ...extras }));
    setTitulo(modelo.titulo);
  };

  const emitir = useMutation({
    mutationFn: async () => {
      if (/\{\{/.test(texto)) throw new Error("Ainda há campos {{…}} sem preencher no texto.");
      const { error } = await supabase.from("documentos_emitidos").insert({
        clinica_id: sessao!.clinicaId!, paciente_id: paciente.id, tipo: modelo?.tipo ?? "outro", titulo, conteudo: texto,
        autor_id: sessao?.user.id, modelo_id: modelo?.id ?? null, profissional_id: prof?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento emitido e registrado.");
      setTexto(""); setTitulo(""); setExtras({});
      qc.invalidateQueries({ queryKey: ["docs", paciente.id] });
    },
    onError: (e) => toast.error(mensagemErro(e)),
  });

  const tel = (paciente.telefone ?? "").replace(/\D/g, "");
  const wa = (t: string, c: string) => `https://wa.me/${tel.length <= 11 ? "55" + tel : tel}?text=${encodeURIComponent(`${t}\n\n${c}`)}`;
  const mail = (t: string, c: string) => `mailto:${paciente.email ?? ""}?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(c)}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Emitir documento a partir de modelo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Modelo</Label>
              <Select value={modeloId} onValueChange={(v) => { setModeloId(v); setTexto(""); setExtras({}); }}>
                <SelectTrigger><SelectValue placeholder="Escolha o modelo" /></SelectTrigger>
                <SelectContent>{dados.data?.modelos.map((m) => <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="space-y-1"><Label>Profissional responsável</Label>
              <Select value={prof?.id ?? ""} onValueChange={setProfId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{dados.data?.profissionais.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.cro ? ` · CRO ${p.cro}` : ""}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          {pendentes.length > 0 && (
            <div className="grid gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-3">
              {pendentes.map((k) => (
                <div key={k} className="space-y-1"><Label htmlFor={`v-${k}`}>{k.replace(/_/g, " ")}</Label>
                  <Input id={`v-${k}`} value={extras[k] ?? ""} onChange={(e) => setExtras({ ...extras, [k]: e.target.value })} /></div>
              ))}
            </div>
          )}
          <Button variant="outline" disabled={!modelo} onClick={preencher}>Preencher modelo</Button>
          {texto && (
            <>
              <div className="space-y-1"><Label htmlFor="d-tit">Título</Label><Input id="d-tit" value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
              <Textarea rows={10} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Texto do documento" />
              <Button disabled={!titulo || emitir.isPending} onClick={() => emitir.mutate()}><FileText className="mr-2 h-4 w-4" /> Emitir e registrar</Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">Documentos emitidos não podem ser alterados. Assinatura digital ICP-Brasil: preparado para integração futura.</p>
        </CardContent>
      </Card>
      {dados.data?.docs.map((d) => (
        <Card key={d.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{d.titulo}</p>
              <Badge variant="secondary">{TIPOS_DOC[d.tipo] ?? d.tipo}</Badge>
            </div>
            <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{d.conteudo}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-auto text-xs text-muted-foreground">{dataBR(d.created_at)}</span>
              <Button size="sm" variant="outline" asChild>
                <Link to="/impressao/documento/$id" params={{ id: d.id }} target="_blank"><Printer className="mr-1 h-4 w-4" /> Imprimir / PDF</Link>
              </Button>
              {tel && <Button size="sm" variant="outline" asChild><a href={wa(d.titulo, d.conteudo)} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-4 w-4" /> WhatsApp</a></Button>}
              <Button size="sm" variant="outline" asChild><a href={mail(d.titulo, d.conteudo)}><Mail className="mr-1 h-4 w-4" /> E-mail</a></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
