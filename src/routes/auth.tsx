import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | OdontoGestor" },
      { name: "description", content: "Acesse ou crie a conta da sua clínica odontológica no OdontoGestor." },
      { property: "og:title", content: "Entrar | OdontoGestor" },
      { property: "og:description", content: "Acesse ou crie a conta da sua clínica odontológica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  function irPara(padrao: "/dashboard" | "/onboarding") {
    const convite = sessionStorage.getItem("convite_pendente");
    if (convite) {
      navigate({ to: "/convite/$token", params: { token: convite } });
      return;
    }
    navigate({ to: padrao });
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setCarregando(false);
    if (error) return toast.error("Não foi possível entrar: " + error.message);
    irPara("/dashboard");
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    setCarregando(false);
    if (error) return toast.error("Não foi possível criar a conta: " + error.message);
    toast.success("Conta criada! Vamos configurar sua clínica.");
    irPara("/onboarding");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold">OdontoGestor</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Acesse sua clínica</CardTitle>
            <CardDescription>Gestão completa: agenda, prontuário e financeiro.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="entrar">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="entrar">Entrar</TabsTrigger>
                <TabsTrigger value="criar">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="entrar">
                <form className="space-y-4" onSubmit={entrar}>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
                  </div>
                  <Button className="w-full" disabled={carregando}>Entrar</Button>
                </form>
              </TabsContent>
              <TabsContent value="criar">
                <form className="space-y-4" onSubmit={cadastrar}>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Seu nome</Label>
                    <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">E-mail</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="senha2">Senha</Label>
                    <Input id="senha2" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
                  </div>
                  <Button className="w-full" disabled={carregando}>Criar conta</Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
