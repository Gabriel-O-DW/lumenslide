import { useCallback, useEffect, useRef } from "react";
import type { Slide } from "../types/slide";
import { SlideRender } from "./SlideRender";
import "./SlideViewer.css";

interface Props {
  slides: Slide[];
  indice: number;
  onMudarIndice: (i: number) => void;
  modoApresentacao: boolean;
  onSair: () => void;
}

export function SlideViewer({
  slides,
  indice,
  onMudarIndice,
  modoApresentacao,
  onSair,
}: Props) {
  const slide = slides[indice];
  const containerRef = useRef<HTMLDivElement | null>(null);

  const irPara = useCallback(
    (delta: number) => {
      const proximo = Math.min(slides.length - 1, Math.max(0, indice + delta));
      onMudarIndice(proximo);
    },
    [indice, slides.length, onMudarIndice],
  );

  // Atalhos de teclado: ←, →, Espaço, Esc, Home, End
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        irPara(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        irPara(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        onMudarIndice(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onMudarIndice(slides.length - 1);
      } else if (e.key === "Escape" && modoApresentacao) {
        e.preventDefault();
        onSair();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [irPara, modoApresentacao, onMudarIndice, onSair, slides.length]);

  // Fullscreen real ao entrar em modo apresentação
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (modoApresentacao && !document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {
        /* navegador pode bloquear sem gesto do usuário — tudo bem */
      });
    } else if (!modoApresentacao && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [modoApresentacao]);

  if (!slide) {
    return <div className="slide-viewer-empty">Nenhum slide disponível.</div>;
  }

  return (
    <div
      ref={containerRef}
      className={
        "slide-viewer" + (modoApresentacao ? " slide-viewer--full" : "")
      }
      data-cor={slide.cor ?? "branco"}
    >
      <div className="slide-stage">
        <SlideRender slide={slide} />
      </div>

      <div className="slide-controls" aria-label="Controles do slide">
        <button onClick={() => irPara(-1)} disabled={indice === 0}>
          ◀ Anterior
        </button>
        <span className="slide-counter">
          {indice + 1} / {slides.length}
        </span>
        <button
          onClick={() => irPara(1)}
          disabled={indice === slides.length - 1}
        >
          Próximo ▶
        </button>
      </div>

      {modoApresentacao && (
        <button className="slide-exit" onClick={onSair} aria-label="Sair">
          ✕
        </button>
      )}
    </div>
  );
}
