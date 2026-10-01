import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Paciente = Tables<"pacientes">;
type Consentimentos = { tratamento?: boolean; marketing?: boolean; imagem?: boolean; ia?: boolean; atualizado_em?: string | null };
type Preferencias = { whatsapp?: boolean; sms?: boolean; email?: boolean; horario?: string };

export const ORIGENS = ["Indicação", "Instagram", "Google", "Facebook", "Convênio", "Passou na frente", "Outro"];
const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"];
const CONSENTIMENTOS: Array<{ chave: keyof Consentimentos; rotulo: string }> = [
  { chave: "tratamento", rotulo: "Tratamento de dados para atendimento" },
  { chave: "marketing", rotulo: "Comunicações de marketing" },
  { chave: "imagem", rotulo: "Uso de imagem/fotos clínicas" },
  { chave: "ia", rotulo: "Uso de IA nos registros clínicos" },
];

function texto(v: string | null | undefined) {
  return v ?? "";
}

export function PacienteDados({ paciente }: { paciente: Paciente }) {
  const { data: sessao } = useSessao();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => paraForm(paciente));
  useEffect(() => setForm(paraForm(paciente)), [paciente]);

  const auxiliares = useQuery({
    enabled: !!sessao?.clinicaId,
    queryKey: ["paciente-dados-aux", sessao?.clinicaId],
    queryFn: async () => {
      const [c, p] = await Promise.all([
        supabase.from("convenios").select("id,nome").eq("ativo", true).order("nome"),
        supabase.from("pacientes").select("id,nome").eq("ativo", true).order("nome").limit(500),
      ]);
      return { convenios: c.data ?? [], pacientes: p.data ?? [] };
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome.trim()) throw new Error("Informe o nome.");
      const mudouConsent = JSON.stringify(form.consentimentos) !== JSON.stringify(paciente.consentimentos);
      const consentimentos = mudouConsent
        ? { ...form.consentimentos, atualizado_em: new Date().toISOString() }
        : form.consentimentos;
      const { error } = await supabase
        .from("pacientes")
        .update({
          nome: form.nome.trim(),
          nome_social: form.nome_social || null,
          cpf: form.cpf || null,
          rg: form.rg || null,
          data_nascimento: form.data_nascimento || null,
          sexo: form.sexo || null,
          profissao: form.profissao || null,
          estado_civil: form.estado_civil || null,
          telefone: form.telefone || null,
          email: form.email || null,
          cep: form.cep || null,
          endereco: form.endereco || null,
          cidade: form.cidade || null,
          estado: form.estado || null,
          responsavel_nome: form.responsavel_nome || null,
          responsavel_telefone: form.responsavel_telefone || null,
          convenio_id: form.convenio_id || null,
          numero_carteirinha: form.numero_carteirinha || null,
          origem: form.origem || null,
          indicado_por: form.indicado_por || null,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          contato_preferencias: form.preferencias,
          consentimentos,
          consentimento_lgpd: !!form.consentimentos.tratamento,
          consentimento_data: form.consentimentos.tratamento ? (paciente.consentimento_data ?? new Date().toISOString()) : null,
          observacoes: form.observacoes || null,
        })
        .eq("id", paciente.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Dados do paciente atualizados.");
      queryClient.invalidateQueries({ queryKey: ["prontuario", paciente.id] });
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const campo = (chave: keyof typeof form, rotulo: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pd-${chave}`}>{rotulo}</Label>
      <Input
        id={`pd-${chave}`}
        value={form[chave] as string}
        onChange={(e) => setForm({ ...form, [chave]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dados cadastrais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campo("nome", "Nome civil *", { required: true })}
          {campo("nome_social", "Nome social")}
          {campo("cpf", "CPF")}
          {campo("rg", "RG")}
          {campo("data_nascimento", "Nascimento", { type: "date" })}
          <div className="space-y-1.5">
            <Label htmlFor="pd-sexo">Sexo</Label>
            <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
              <SelectTrigger id="pd-sexo"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Feminino</SelectItem>
                <SelectItem value="M">Masculino</SelectItem>
                <SelectItem value="O">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {campo("profissao", "Profissão")}
          <div className="space-y-1.5">
            <Label htmlFor="pd-estado_civil">Estado civil</Label>
            <Select value={form.estado_civil} onValueChange={(v) => setForm({ ...form, estado_civil: v })}>
              <SelectTrigger id="pd-estado_civil"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_CIVIS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {campo("telefone", "Telefone / WhatsApp")}
          {campo("email", "E-mail", { type: "email" })}
          {campo("cep", "CEP")}
          {campo("endereco", "Endereço")}
          {campo("cidade", "Cidade")}
          {campo("estado", "UF", { maxLength: 2 })}
          {campo("responsavel_nome", "Responsável")}
          {campo("responsavel_telefone", "Telefone do responsável")}
          <div className="space-y-1.5">
            <Label htmlFor="pd-convenio">Convênio</Label>
            <Select value={form.convenio_id || "particular"} onValueChange={(v) => setForm({ ...form, convenio_id: v === "particular" ? "" : v })}>
              <SelectTrigger id="pd-convenio"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="particular">Particular</SelectItem>
                {auxiliares.data?.convenios.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {campo("numero_carteirinha", "Carteirinha")}
          <div className="space-y-1.5">
            <Label htmlFor="pd-origem">Como conheceu</Label>
            <Select value={form.origem} onValueChange={(v) => setForm({ ...form, origem: v })}>
              <SelectTrigger id="pd-origem"><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pd-indicado">Indicado por</Label>
            <Select value={form.indicado_por || "nenhum"} onValueChange={(v) => setForm({ ...form, indicado_por: v === "nenhum" ? "" : v })}>
              <SelectTrigger id="pd-indicado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Ninguém</SelectItem>
                {auxiliares.data?.pacientes.filter((x) => x.id !== paciente.id).map((x) => (
                  <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {campo("tags", "Etiquetas (separe por vírgula)")}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Preferências de contato</legend>
            {(["whatsapp", "sms", "email"] as const).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!form.preferencias[c]}
                  onCheckedChange={(v) => setForm({ ...form, preferencias: { ...form.preferencias, [c]: !!v } })}
                />
                {c === "whatsapp" ? "WhatsApp" : c === "sms" ? "SMS" : "E-mail"}
              </label>
            ))}
            <Input
              aria-label="Melhor horário para contato"
              placeholder="Melhor horário (ex.: manhã)"
              value={form.preferencias.horario ?? ""}
              onChange={(e) => setForm({ ...form, preferencias: { ...form.preferencias, horario: e.target.value } })}
            />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium">Consentimentos LGPD por finalidade</legend>
            {CONSENTIMENTOS.map((c) => (
              <label key={c.chave} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!form.consentimentos[c.chave]}
                  onCheckedChange={(v) => setForm({ ...form, consentimentos: { ...form.consentimentos, [c.chave]: !!v } })}
                />
                {c.rotulo}
              </label>
            ))}
            {form.consentimentos.atualizado_em ? (
              <p className="text-xs text-muted-foreground">
                Atualizado em {new Date(form.consentimentos.atualizado_em).toLocaleString("pt-BR")}
              </p>
            ) : null}
          </fieldset>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pd-obs">Observações</Label>
          <Textarea id="pd-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
        </div>
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
          {salvar.isPending ? "Salvando…" : "Salvar dados"}
        </Button>
      </CardContent>
    </Card>
  );
}

function paraForm(p: Paciente) {
  return {
    nome: p.nome,
    nome_social: texto(p.nome_social),
    cpf: texto(p.cpf),
    rg: texto(p.rg),
    data_nascimento: texto(p.data_nascimento),
    sexo: texto(p.sexo),
    profissao: texto(p.profissao),
    estado_civil: texto(p.estado_civil),
    telefone: texto(p.telefone),
    email: texto(p.email),
    cep: texto(p.cep),
    endereco: texto(p.endereco),
    cidade: texto(p.cidade),
    estado: texto(p.estado),
    responsavel_nome: texto(p.responsavel_nome),
    responsavel_telefone: texto(p.responsavel_telefone),
    convenio_id: texto(p.convenio_id),
    numero_carteirinha: texto(p.numero_carteirinha),
    origem: texto(p.origem),
    indicado_por: texto(p.indicado_por),
    tags: (p.tags ?? []).join(", "),
    observacoes: texto(p.observacoes),
    preferencias: (p.contato_preferencias ?? {}) as Preferencias,
    consentimentos: (p.consentimentos ?? {}) as Consentimentos,
  };
}
