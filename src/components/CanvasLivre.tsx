import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import "./CanvasLivre.css";

export type ElementoCanvas =
  | {
      id: string;
      tipo: "texto";
      x: number;
      y: number;
      w: number;
      h: number;
      conteudo: string;
      fonte: string;
      tamanho: number;
      cor: string;
      negrito?: boolean;
      italico?: boolean;
      alinhamento: "left" | "center" | "right";
    }
  | {
      id: string;
      tipo: "imagem";
      x: number;
      y: number;
      w: number;
      h: number;
      url: string;
      legenda?: string;
    };

interface Props {
  elementos: ElementoCanvas[];
  onChange: (els: ElementoCanvas[]) => void;
  /** Quando true, o palco é transparente (modo overlay sobre um preview). */
  overlay?: boolean;
  /** Conteúdo opcional renderizado atrás dos elementos livres. */
  fundo?: ReactNode;
  /** Esconde toolbar (útil quando o pai tem toolbar própria). */
  semToolbar?: boolean;
}

const FONTES = [
  "'Lato', sans-serif",
  "Inter, sans-serif",
  "Garamond, serif",
  "Cinzel, serif",
];

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function CanvasLivre({
  elementos,
  onChange,
  overlay,
  fundo,
  semToolbar,
}: Props) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    modo: "move" | "resize";
    startX: number;
    startY: number;
    startEl: ElementoCanvas;
    rect: DOMRect;
  } | null>(null);

  const elSel = elementos.find((e) => e.id === selecionado) ?? null;

  function adicionarTexto() {
    const novo: ElementoCanvas = {
      id: uid("txt"),
      tipo: "texto",
      x: 12,
      y: 30,
      w: 60,
      h: 18,
      conteudo: "Texto editável",
      fonte: FONTES[0],
      tamanho: 28,
      cor: overlay ? "#ffffff" : "#262626",
      alinhamento: "center",
    };
    onChange([...elementos, novo]);
    setSelecionado(novo.id);
  }

  function adicionarImagem() {
    const url = window.prompt(
      "URL da imagem (https://…). Use uma URL pública.",
      "https://images.unsplash.com/photo-1510531704581-5b2870972060?w=600",
    );
    if (!url) return;
    const novo: ElementoCanvas = {
      id: uid("img"),
      tipo: "imagem",
      x: 60,
      y: 50,
      w: 30,
      h: 30,
      url,
    };
    onChange([...elementos, novo]);
    setSelecionado(novo.id);
  }

  function atualizarEl(id: string, patch: Partial<ElementoCanvas>) {
    onChange(
      elementos.map((e) =>
        e.id === id ? ({ ...e, ...patch } as ElementoCanvas) : e,
      ),
    );
  }

  function removerEl(id: string) {
    onChange(elementos.filter((e) => e.id !== id));
    setSelecionado(null);
  }

  function iniciarDrag(
    e: PointerEvent<HTMLDivElement>,
    el: ElementoCanvas,
    modo: "move" | "resize",
  ) {
    e.stopPropagation();
    if (!canvasRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: el.id,
      modo,
      startX: e.clientX,
      startY: e.clientY,
      startEl: { ...el },
      rect: canvasRef.current.getBoundingClientRect(),
    };
    setSelecionado(el.id);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = ((e.clientX - drag.startX) / drag.rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / drag.rect.height) * 100;
    if (drag.modo === "move") {
      const nx = clamp(drag.startEl.x + dx, 0, 100 - drag.startEl.w);
      const ny = clamp(drag.startEl.y + dy, 0, 100 - drag.startEl.h);
      atualizarEl(drag.id, { x: nx, y: ny } as Partial<ElementoCanvas>);
    } else {
      const nw = clamp(drag.startEl.w + dx, 5, 100 - drag.startEl.x);
      const nh = clamp(drag.startEl.h + dy, 5, 100 - drag.startEl.y);
      atualizarEl(drag.id, { w: nw, h: nh } as Partial<ElementoCanvas>);
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  return (
    <div className={"canvas-livre" + (overlay ? " canvas-livre--overlay" : "")}>
      {!semToolbar && (
        <div className="canvas-livre__toolbar">
          <button type="button" className="primary" onClick={adicionarTexto}>
            + Adicionar texto
          </button>
          <button type="button" onClick={adicionarImagem}>
            + Adicionar imagem
          </button>
          {elSel && (
            <>
              <span className="canvas-livre__sep" />
              {elSel.tipo === "texto" && (
                <>
                  <select
                    value={elSel.fonte}
                    onChange={(e) =>
                      atualizarEl(elSel.id, { fonte: e.target.value })
                    }
                  >
                    {FONTES.map((f) => (
                      <option key={f} value={f}>
                        {f.split(",")[0].replace(/'/g, "")}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={elSel.tamanho}
                    onChange={(e) =>
                      atualizarEl(elSel.id, {
                        tamanho: parseInt(e.target.value, 10) || 12,
                      })
                    }
                    style={{ width: 64 }}
                    aria-label="Tamanho da fonte"
                  />
                  <input
                    type="color"
                    value={elSel.cor}
                    onChange={(e) =>
                      atualizarEl(elSel.id, { cor: e.target.value })
                    }
                    aria-label="Cor"
                  />
                  <button
                    type="button"
                    className={elSel.negrito ? "primary" : ""}
                    onClick={() =>
                      atualizarEl(elSel.id, { negrito: !elSel.negrito })
                    }
                    aria-label="Negrito"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    className={elSel.italico ? "primary" : ""}
                    onClick={() =>
                      atualizarEl(elSel.id, { italico: !elSel.italico })
                    }
                    aria-label="Itálico"
                  >
                    <em>I</em>
                  </button>
                  <select
                    value={elSel.alinhamento}
                    onChange={(e) =>
                      atualizarEl(elSel.id, {
                        alinhamento: e.target.value as
                          | "left"
                          | "center"
                          | "right",
                      })
                    }
                    aria-label="Alinhamento"
                  >
                    <option value="left">⇤ Esq</option>
                    <option value="center">↔ Centro</option>
                    <option value="right">⇥ Dir</option>
                  </select>
                </>
              )}
              <button
                type="button"
                className="canvas-livre__del"
                onClick={() => removerEl(elSel.id)}
              >
                ✕ Remover
              </button>
            </>
          )}
        </div>
      )}

      <div
        ref={canvasRef}
        className={"canvas-livre__palco" + (overlay ? " canvas-livre__palco--overlay" : "")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => setSelecionado(null)}
      >
        {fundo && <div className="canvas-livre__fundo">{fundo}</div>}
        {elementos.map((el) => {
          const sel = el.id === selecionado;
          const style: CSSProperties = {
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.w}%`,
            height: `${el.h}%`,
          };
          if (el.tipo === "texto") {
            return (
              <div
                key={el.id}
                className={"canvas-livre__el" + (sel ? " is-sel" : "")}
                style={style}
                onPointerDown={(e) => iniciarDrag(e, el, "move")}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelecionado(el.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const v = window.prompt("Editar texto:", el.conteudo);
                  if (v !== null) atualizarEl(el.id, { conteudo: v });
                }}
              >
                <div
                  className="canvas-livre__texto"
                  style={{
                    fontFamily: el.fonte,
                    fontSize: `${el.tamanho}px`,
                    color: el.cor,
                    fontWeight: el.negrito ? 700 : 400,
                    fontStyle: el.italico ? "italic" : "normal",
                    textAlign: el.alinhamento,
                  }}
                >
                  {el.conteudo}
                </div>
                {sel && (
                  <div
                    className="canvas-livre__resize"
                    onPointerDown={(e) => iniciarDrag(e, el, "resize")}
                  />
                )}
              </div>
            );
          }
          return (
            <div
              key={el.id}
              className={"canvas-livre__el" + (sel ? " is-sel" : "")}
              style={style}
              onPointerDown={(e) => iniciarDrag(e, el, "move")}
              onClick={(e) => {
                e.stopPropagation();
                setSelecionado(el.id);
              }}
            >
              <img
                src={el.url}
                alt={el.legenda ?? "imagem"}
                className="canvas-livre__img"
                draggable={false}
              />
              {sel && (
                <div
                  className="canvas-livre__resize"
                  onPointerDown={(e) => iniciarDrag(e, el, "resize")}
                />
              )}
            </div>
          );
        })}
        {!overlay && elementos.length === 0 && (
          <div className="canvas-livre__placeholder">
            Use os botões acima para adicionar texto ou imagem.
            <br />
            Clique para selecionar, arraste para mover, alça para redimensionar.
          </div>
        )}
      </div>
    </div>
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
