import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Configurar clínica | OdontoGestor" },
      { name: "description", content: "Cadastre os dados da sua clínica odontológica e comece a usar a plataforma." },
      { property: "og:title", content: "Configurar clínica | OdontoGestor" },
      { property: "og:description", content: "Cadastre os dados da sua clínica e comece a usar a plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

const PROCEDIMENTOS_PADRAO = [
  { codigo: "81000103", nome: "Consulta odontológica inicial", categoria: "Clínica geral", valor: 150, duracao_minutos: 30 },
  { codigo: "81000210", nome: "Profilaxia / limpeza", categoria: "Prevenção", valor: 180, duracao_minutos: 40 },
  { codigo: "85100048", nome: "Restauração em resina composta", categoria: "Dentística", valor: 250, duracao_minutos: 50 },
  { codigo: "84000031", nome: "Tratamento endodôntico", categoria: "Endodontia", valor: 900, duracao_minutos: 90 },
  { codigo: "82000355", nome: "Raspagem periodontal", categoria: "Periodontia", valor: 320, duracao_minutos: 60 },
  { codigo: "83000210", nome: "Exodontia simples", categoria: "Cirurgia", valor: 300, duracao_minutos: 45 },
  { codigo: "87000212", nome: "Coroa em cerâmica", categoria: "Prótese", valor: 1600, duracao_minutos: 60 },
  { codigo: "86000036", nome: "Manutenção ortodôntica", categoria: "Ortodontia", valor: 200, duracao_minutos: 30 },
  { codigo: "85500062", nome: "Clareamento dental", categoria: "Estética", valor: 750, duracao_minutos: 60 },
];

const CONTAS_PADRAO = [
  { nome: "Receita de procedimentos", tipo: "receita" as const },
  { nome: "Receita de convênios", tipo: "receita" as const },
  { nome: "Aluguel", tipo: "despesa" as const },
  { nome: "Folha de pagamento", tipo: "despesa" as const },
  { nome: "Materiais e insumos", tipo: "despesa" as const },
  { nome: "Laboratório de prótese", tipo: "despesa" as const },
  { nome: "Marketing", tipo: "despesa" as const },
  { nome: "Impostos e taxas", tipo: "despesa" as const },
];

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: sessao, isLoading } = useSessao();
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    endereco: "",
    regime: "Simples Nacional",
    unidade: "Unidade principal",
    profissional: "",
    cro: "",
  });

  useEffect(() => {
    if (sessao?.clinicaId) navigate({ to: "/dashboard", replace: true });
  }, [sessao?.clinicaId, navigate]);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!sessao?.user) return;
    setSalvando(true);
    try {
      const { data: clinica, error: e1 } = await supabase
        .from("clinicas")
        .insert({
          nome: form.nome,
          cnpj: form.cnpj || null,
          telefone: form.telefone || null,
          endereco: form.endereco || null,
          regime_tributario: form.regime,
          email: sessao.user.email,
        })
        .select()
        .single();
      if (e1 || !clinica) throw e1;

      const { error: e2 } = await supabase
        .from("profiles")
        .update({ clinica_id: clinica.id, nome: sessao.profile?.nome || sessao.user.email || "" })
        .eq("id", sessao.user.id);
      if (e2) throw e2;

      await supabase.from("user_roles").insert({
        user_id: sessao.user.id,
        clinica_id: clinica.id,
        role: "owner",
      });

      const { data: unidade } = await supabase
        .from("unidades")
        .insert({ clinica_id: clinica.id, nome: form.unidade })
        .select()
        .single();

      if (unidade) {
        await supabase.from("profiles").update({ unidade_id: unidade.id }).eq("id", sessao.user.id);
      }

      await supabase
        .from("procedimentos")
        .insert(PROCEDIMENTOS_PADRAO.map((p) => ({ ...p, clinica_id: clinica.id })));
      await supabase
        .from("plano_contas")
        .insert(CONTAS_PADRAO.map((c) => ({ ...c, clinica_id: clinica.id })));

      if (form.profissional) {
        await supabase.from("profissionais").insert({
          clinica_id: clinica.id,
          unidade_id: unidade?.id ?? null,
          user_id: sessao.user.id,
          nome: form.profissional,
          cro: form.cro || null,
          comissao_percentual: 0,
        });
      }

      await supabase.from("auditoria_logs").insert({
        clinica_id: clinica.id,
        usuario_id: sessao.user.id,
        usuario_nome: sessao.profile?.nome ?? sessao.user.email,
        acao: "criou a clínica",
        tabela: "clinicas",
        registro_id: clinica.id,
      });

      await queryClient.invalidateQueries();
      toast.success("Clínica criada com sucesso!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error("Não foi possível criar a clínica. " + (err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">Carregando…</div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Configure sua clínica</CardTitle>
          <CardDescription>
            Vamos criar sua conta com uma unidade, tabela de procedimentos e plano de contas iniciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={criar}>
            <div className="space-y-2 md:col-span-2">
              <Label>Nome da clínica *</Label>
              <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Regime tributário</Label>
              <Select value={form.regime} onValueChange={(v) => setForm({ ...form, regime: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEI">MEI</SelectItem>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome da primeira unidade</Label>
              <Input value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Você é dentista? Nome profissional</Label>
              <Input
                placeholder="Opcional"
                value={form.profissional}
                onChange={(e) => setForm({ ...form, profissional: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CRO</Label>
              <Input placeholder="Opcional" value={form.cro} onChange={(e) => setForm({ ...form, cro: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Button className="w-full" disabled={salvando}>
                {salvando ? "Criando…" : "Criar clínica e começar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
