import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Stethoscope } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha | OdontoGestor" },
      { name: "description", content: "Crie uma nova senha segura para acessar o OdontoGestor." },
      { property: "og:title", content: "Redefinir senha | OdontoGestor" },
      { property: "og:description", content: "Crie uma nova senha segura para acessar sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [validando, setValidando] = useState(true);
  const [recuperacaoValida, setRecuperacaoValida] = useState(false);
  const [concluido, setConcluido] = useState(false);

  useEffect(() => {
    let ativo = true;
    const hashRecuperacao = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const codigoRecuperacao = new URLSearchParams(window.location.search).has("code");

    const verificar = async () => {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;
      setRecuperacaoValida(Boolean(data.session) && (hashRecuperacao || codigoRecuperacao));
      setValidando(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!ativo || evento !== "PASSWORD_RECOVERY") return;
      setRecuperacaoValida(Boolean(sessao));
      setValidando(false);
    });

    void verificar();
    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return toast.error("A nova senha deve ter pelo menos 8 caracteres.");
    if (senha !== confirmacao) return toast.error("As senhas informadas não coincidem.");

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);
    if (error) return toast.error("Não foi possível alterar a senha. Solicite um novo link e tente novamente.");

    setConcluido(true);
    await supabase.auth.signOut();
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
            <CardTitle>{concluido ? "Senha atualizada" : "Crie uma nova senha"}</CardTitle>
            <CardDescription>
              {concluido
                ? "Sua nova senha já pode ser usada para acessar a plataforma."
                : "Use pelo menos 8 caracteres e confirme a nova senha."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validando ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Validando seu link seguro...</p>
            ) : concluido ? (
              <div className="space-y-5 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <Button className="w-full" onClick={() => navigate({ to: "/auth", replace: true })}>
                  Entrar com a nova senha
                </Button>
              </div>
            ) : recuperacaoValida ? (
              <form className="space-y-4" onSubmit={salvar}>
                <div className="space-y-2">
                  <Label htmlFor="nova-senha">Nova senha</Label>
                  <Input
                    id="nova-senha"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                  <Input
                    id="confirmar-senha"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={carregando}>
                  <KeyRound /> {carregando ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Este link é inválido ou expirou. Solicite uma nova recuperação para continuar.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Solicitar novo link</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}