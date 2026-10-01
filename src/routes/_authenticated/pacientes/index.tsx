import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { AppShell, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pacientes/")({
  head: () => ({
    meta: [
      { title: "Pacientes | OdontoGestor" },
      { name: "description", content: "Cadastro de pacientes com anamnese, convênio e consentimento LGPD." },
      { property: "og:title", content: "Pacientes | OdontoGestor" },
      { property: "og:description", content: "Cadastro de pacientes com anamnese, convênio e consentimento LGPD." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pacientes,
});

const PERGUNTAS = [
  "Possui alguma doença crônica (diabetes, hipertensão)?",
  "Faz uso contínuo de medicamentos? Quais?",
  "Possui alergia a algum medicamento ou anestésico?",
  "Já teve complicação em cirurgia ou sangramento excessivo?",
  "Está grávida ou amamentando?",
  "Fuma ou consome álcool com frequência?",
];

const VAZIO = {
  nome: "", cpf: "", data_nascimento: "", sexo: "", telefone: "", email: "",
  cep: "", endereco: "", cidade: "", estado: "",
  responsavel_nome: "", responsavel_cpf: "", responsavel_telefone: "",
  convenio_id: "", numero_carteirinha: "", elegibilidade_pendente: false,
  observacoes: "", consentimento_lgpd: false,
};

function Pacientes() {
  const { data: sessao } = useSessao();
  const clinicaId = sessao?.clinicaId;
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [form, setForm] = useState({ ...VAZIO });
  const [anamnese, setAnamnese] = useState<Record<string, string>>({});

  const convenios = useQuery({
    enabled: !!clinicaId,
    queryKey: ["convenios", clinicaId],
    queryFn: async () => (await supabase.from("convenios").select("*").eq("ativo", true).order("nome")).data ?? [],
  });

  const pacientes = useQuery({
    enabled: !!clinicaId,
    queryKey: ["pacientes", clinicaId, busca],
    queryFn: async () => {
      let q = supabase.from("pacientes").select("*,convenios(nome)").eq("ativo", true).order("nome");
      if (busca.trim()) q = q.ilike("nome", `%${busca.trim()}%`);
      return (await q).data ?? [];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pacientes").insert({
        clinica_id: clinicaId!,
        unidade_id: sessao?.profile?.unidade_id ?? null,
        nome: form.nome,
        cpf: form.cpf || null,
        data_nascimento: form.data_nascimento || null,
        sexo: form.sexo || null,
        telefone: form.telefone || null,
        email: form.email || null,
        cep: form.cep || null,
        endereco: form.endereco || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        responsavel_nome: form.responsavel_nome || null,
        responsavel_cpf: form.responsavel_cpf || null,
        responsavel_telefone: form.responsavel_telefone || null,
        convenio_id: form.convenio_id || null,
        numero_carteirinha: form.numero_carteirinha || null,
        elegibilidade_pendente: form.elegibilidade_pendente,
        anamnese,
        consentimento_lgpd: form.consentimento_lgpd,
        consentimento_data: form.consentimento_lgpd ? new Date().toISOString() : null,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Paciente cadastrado.");
      setAberto(false);
      setEtapa(0);
      setForm({ ...VAZIO });
      setAnamnese({});
      queryClient.invalidateQueries({ queryKey: ["pacientes"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar: " + e.message),
  });

  const etapas = ["Dados pessoais", "Contato e endereço", "Convênio e responsável", "Anamnese e LGPD"];

  return (
    <AppShell>
      <PageHeader
        titulo="Pacientes"
        descricao="Cadastro, anamnese e prontuário."
        acao={
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Novo paciente</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo paciente — etapa {etapa + 1} de 4: {etapas[etapa]}</DialogTitle>
              </DialogHeader>

              <div className="mb-2 flex gap-1">
                {etapas.map((e, i) => (
                  <div key={e} className={`h-1.5 flex-1 rounded-full ${i <= etapa ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              {etapa === 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Nome completo *</Label>
                    <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="space-y-2"><Label>CPF</Label>
                    <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Data de nascimento</Label>
                    <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={(v) => setForm({ ...form, sexo: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {etapa === 1 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Telefone / WhatsApp</Label>
                    <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CEP</Label>
                    <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Cidade</Label>
                    <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Estado</Label>
                    <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></div>
                  <div className="space-y-2 sm:col-span-2"><Label>Endereço</Label>
                    <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
                </div>
              )}

              {etapa === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Convênio</Label>
                    <Select value={form.convenio_id} onValueChange={(v) => setForm({ ...form, convenio_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Particular" /></SelectTrigger>
                      <SelectContent>
                        {convenios.data?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Número da carteirinha</Label>
                    <Input value={form.numero_carteirinha} onChange={(e) => setForm({ ...form, numero_carteirinha: e.target.value })} /></div>
                  <label className="flex items-center gap-2 sm:col-span-2 text-sm">
                    <Checkbox
                      checked={form.elegibilidade_pendente}
                      onCheckedChange={(v) => setForm({ ...form, elegibilidade_pendente: !!v })}
                    />
                    Elegibilidade do convênio pendente (bloquear visualmente na agenda)
                  </label>
                  <div className="space-y-2 sm:col-span-2"><Label>Responsável financeiro (menores/dependentes)</Label>
                    <Input value={form.responsavel_nome} onChange={(e) => setForm({ ...form, responsavel_nome: e.target.value })} /></div>
                  <div className="space-y-2"><Label>CPF do responsável</Label>
                    <Input value={form.responsavel_cpf} onChange={(e) => setForm({ ...form, responsavel_cpf: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Telefone do responsável</Label>
                    <Input value={form.responsavel_telefone} onChange={(e) => setForm({ ...form, responsavel_telefone: e.target.value })} /></div>
                </div>
              )}

              {etapa === 3 && (
                <div className="space-y-4">
                  {PERGUNTAS.map((p) => (
                    <div key={p} className="space-y-2">
                      <Label className="font-normal">{p}</Label>
                      <Input
                        value={anamnese[p] ?? ""}
                        onChange={(e) => setAnamnese({ ...anamnese, [p]: e.target.value })}
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label>Observações clínicas</Label>
                    <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                  </div>
                  <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
                    <Checkbox
                      checked={form.consentimento_lgpd}
                      onCheckedChange={(v) => setForm({ ...form, consentimento_lgpd: !!v })}
                    />
                    <span>
                      O paciente autoriza o tratamento dos seus dados pessoais e de saúde para fins de
                      atendimento odontológico, conforme a LGPD.
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" disabled={etapa === 0} onClick={() => setEtapa(etapa - 1)}>
                  Voltar
                </Button>
                {etapa < 3 ? (
                  <Button disabled={etapa === 0 && !form.nome} onClick={() => setEtapa(etapa + 1)}>
                    Continuar
                  </Button>
                ) : (
                  <Button disabled={!form.nome || salvar.isPending} onClick={() => salvar.mutate()}>
                    Salvar paciente
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar paciente…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          {(pacientes.data ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum paciente cadastrado.</p>
          ) : (
            pacientes.data?.map((p) => (
              <Link
                key={p.id}
                to="/pacientes/$id/odontograma"
                params={{ id: p.id }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-secondary"
              >
                <div>
                  <p className="font-medium">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.telefone ?? "sem telefone"} · nasc. {dataBR(p.data_nascimento)} ·{" "}
                    {p.convenios?.nome ?? "Particular"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.elegibilidade_pendente ? <Badge variant="destructive">convênio pendente</Badge> : null}
                  {!p.consentimento_lgpd ? <Badge variant="outline">LGPD pendente</Badge> : null}
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
