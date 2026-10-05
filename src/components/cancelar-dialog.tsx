import { useState } from "react";
import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Botão + diálogo que exige um motivo (mín. 5 caracteres) antes de cancelar. */
export function CancelarComMotivo({ titulo, descricao, rotulo = "Cancelar", pendente, onConfirmar }: {
  titulo: string; descricao: string; rotulo?: string; pendente?: boolean;
  onConfirmar: (motivo: string, fechar: () => void) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const valido = motivo.trim().length >= 5;
  return (
    <>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setAberto(true)}>
        <XCircle className="mr-1 h-4 w-4" /> {rotulo}
      </Button>
      <Dialog open={aberto} onOpenChange={(o) => { setAberto(o); if (!o) setMotivo(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            <DialogDescription>{descricao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-cancelamento">Motivo do cancelamento</Label>
            <Textarea id="motivo-cancelamento" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: paciente desistiu do tratamento" />
            <p className="text-xs text-muted-foreground">O motivo fica registrado no histórico e na auditoria. Esta ação não pode ser desfeita.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAberto(false)}>Voltar</Button>
            <Button variant="destructive" disabled={!valido || pendente}
              onClick={() => onConfirmar(motivo.trim(), () => { setAberto(false); setMotivo(""); })}>
              Confirmar cancelamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
