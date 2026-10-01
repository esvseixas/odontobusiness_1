import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Área de assinatura por toque/mouse. Devolve PNG em data URL (ou null se vazia). */
export function AssinaturaPad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const desenhando = useRef(false);
  const vazio = useRef(true);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = getComputedStyle(c).color;
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={ref}
        aria-label="Área de assinatura"
        className="h-40 w-full touch-none rounded-md border bg-background text-foreground"
        onPointerDown={(e) => {
          desenhando.current = true;
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ref.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!desenhando.current) return;
          const ctx = ref.current!.getContext("2d")!;
          const p = pos(e);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          vazio.current = false;
        }}
        onPointerUp={() => {
          desenhando.current = false;
          onChange(vazio.current ? null : ref.current!.toDataURL("image/png"));
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          const c = ref.current!;
          c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
          vazio.current = true;
          onChange(null);
        }}
      >
        Limpar assinatura
      </Button>
    </div>
  );
}
