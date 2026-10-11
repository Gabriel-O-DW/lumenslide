import { memo, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ALTURA,
  ALTURA_LINHA,
  LARGURA,
  MARGEM_TEXTO,
  RECUO_MARCADOR,
  layoutDoSlide,
  paragrafos,
  type Caixa,
  type CaixaTexto,
  type CampoEditavel,
} from "../../missa/layout";
import { FONTES } from "../../missa/tema";
import { carregarUrls, urlEmCache } from "../../missa/imagens";
import type { CorTema, EstiloCaixa, Slide, Trecho } from "../../missa/tipos";
import "./SlideCanvas.css";

interface Props {
  slide: Slide;
  cor: CorTema;
  paroquiaId: string;
  /** Largura em px; a altura segue 16:9 */
  largura: number;
  editavel?: boolean;
  /** Chave da caixa selecionada (modo editável) */
  selecionada?: string | null;
  onSelecionar?: (chave: string | null) => void;
  onEstilo?: (chave: string, patch: EstiloCaixa) => void;
  /** trechos = null quando o texto não tem formatação diferente da caixa */
  onTexto?: (campo: CampoEditavel, texto: string, trechos: Trecho[] | null) => void;
}

/** Re-renderiza quando as fontes web terminam de carregar (afeta a medição do texto) */
export function useFontesProntas(): boolean {
  const [prontas, setProntas] = useState(() => typeof document === "undefined" || document.fonts.status === "loaded");
  useEffect(() => {
    if (prontas) return;
    let ativo = true;
    document.fonts.ready.then(() => ativo && setProntas(true));
    return () => {
      ativo = false;
    };
  }, [prontas]);
  return prontas;
}

/** Caixas que não se movem (fundo de tela cheia): clicar nelas tira a seleção */
const FIXAS = new Set(["fundo"]);

/* ------------------------------------------------------------------ */
/*  Trechos <-> HTML do campo editável                                 */
/* ------------------------------------------------------------------ */

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function htmlDosTrechos(c: CaixaTexto): string {
  return paragrafos(c.trechos)
    .map((par) => {
      const conteudo = par
        .map((t) => `<span style="font-weight:${t.b ? 700 : 400};font-style:${t.i ? "italic" : "normal"}">${escapar(t.t)}</span>`)
        .join("");
      return `<div class="slide-canvas__par">${conteudo || "<br>"}</div>`;
    })
    .join("");
}

/** Lê o conteúdo editado (inclusive negrito/itálico aplicados em parte do texto) */
function lerTrechos(raiz: HTMLElement): Trecho[] {
  const out: Trecho[] = [];
  const add = (t: string, b: boolean, i: boolean) => {
    const ult = out[out.length - 1];
    if (ult && ult.b === b && ult.i === i) ult.t += t;
    else out.push({ t, b, i });
  };
  const estiloDe = (el: Element) => {
    const cs = getComputedStyle(el);
    return { b: parseInt(cs.fontWeight, 10) >= 600, i: cs.fontStyle === "italic" };
  };
  let primeiroBloco = true;
  const visitar = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const { b, i } = estiloDe(n.parentElement ?? raiz);
      add(n.textContent ?? "", b, i);
      return;
    }
    if (!(n instanceof HTMLElement)) return;
    if (n.tagName === "BR") {
      // <div><br></div> é só uma linha vazia, já contada pelo bloco
      if (n.parentElement !== raiz && n.parentElement?.childNodes.length === 1) return;
      const { b, i } = estiloDe(n.parentElement ?? raiz);
      add("\n", b, i);
      return;
    }
    const bloco = n.tagName === "DIV" || n.tagName === "P";
    if (bloco) {
      if (!primeiroBloco) {
        const { b, i } = estiloDe(n);
        add("\n", b, i);
      }
      primeiroBloco = false;
    }
    n.childNodes.forEach(visitar);
  };
  raiz.childNodes.forEach(visitar);
  const ult = out[out.length - 1];
  if (ult) ult.t = ult.t.replace(/\n+$/, "");
  return out.filter((t) => t.t.length > 0);
}

/* ------------------------------------------------------------------ */

type Alca = "mover" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
const ALCAS: Alca[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const MINIMO = 0.3; // polegadas

interface Arrasto {
  chave: string;
  alca: Alca;
  inicioX: number;
  inicioY: number;
  orig: { x: number; y: number; w: number; h: number };
  atual: { x: number; y: number; w: number; h: number };
}

function SlideCanvasBase({
  slide,
  cor,
  paroquiaId,
  largura,
  editavel,
  selecionada,
  onSelecionar,
  onEstilo,
  onTexto,
}: Props) {
  const fontes = useFontesProntas();
  const caixas = useMemo(() => layoutDoSlide(slide, cor, paroquiaId), [slide, cor, paroquiaId, fontes]);
  const px = largura / LARGURA; // px por polegada
  const ptPx = px / 72; // px por ponto

  const caminhos = useMemo(() => caixas.flatMap((c) => (c.tipo === "imagem" ? [c.caminho] : [])), [caixas]);
  const [, setVersao] = useState(0);
  useEffect(() => {
    if (caminhos.every((c) => urlEmCache(c))) return;
    let ativo = true;
    carregarUrls(caminhos)
      .then(() => ativo && setVersao((v) => v + 1))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [caminhos]);

  /* Arrastar / redimensionar ------------------------------------------------ */
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const arrastoRef = useRef<Arrasto | null>(null);
  arrastoRef.current = arrasto;

  const iniciarArrasto = (ev: ReactPointerEvent, c: Caixa, alca: Alca) => {
    if (!editavel || FIXAS.has(c.chave)) return;
    ev.preventDefault();
    ev.stopPropagation();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    onSelecionar?.(c.chave);
    const orig = { x: c.x, y: c.y, w: c.w, h: c.h };
    setArrasto({ chave: c.chave, alca, inicioX: ev.clientX, inicioY: ev.clientY, orig, atual: orig });
  };

  const moverArrasto = (ev: ReactPointerEvent) => {
    const a = arrastoRef.current;
    if (!a) return;
    const dx = (ev.clientX - a.inicioX) / px;
    const dy = (ev.clientY - a.inicioY) / px;
    let { x, y, w, h } = a.orig;
    if (a.alca === "mover") {
      x += dx;
      y += dy;
      // Ímã no centro horizontal do slide (facilita alinhar)
      if (Math.abs(x + w / 2 - LARGURA / 2) < 0.08) x = LARGURA / 2 - w / 2;
    } else {
      if (a.alca.includes("e")) w = Math.max(MINIMO, w + dx);
      if (a.alca.includes("s")) h = Math.max(MINIMO, h + dy);
      if (a.alca.includes("w")) {
        const nw = Math.max(MINIMO, w - dx);
        x += w - nw;
        w = nw;
      }
      if (a.alca.includes("n")) {
        const nh = Math.max(MINIMO, h - dy);
        y += h - nh;
        h = nh;
      }
    }
    setArrasto({ ...a, atual: { x, y, w, h } });
  };

  const terminarArrasto = () => {
    const a = arrastoRef.current;
    if (!a) return;
    setArrasto(null);
    const r = (n: number) => Math.round(n * 100) / 100;
    const { x, y, w, h } = a.atual;
    if (x !== a.orig.x || y !== a.orig.y || w !== a.orig.w || h !== a.orig.h) {
      onEstilo?.(a.chave, { x: r(x), y: r(y), w: r(w), h: r(h) });
    }
  };

  const geometria = (c: Caixa) => (arrasto?.chave === c.chave ? arrasto.atual : c);
  const sel = editavel ? caixas.find((c) => c.chave === selecionada) : undefined;

  return (
    <div
      className={"slide-canvas" + (editavel ? " slide-canvas--editavel" : "")}
      style={{ width: largura, height: (largura * ALTURA) / LARGURA }}
      onPointerDown={editavel ? () => onSelecionar?.(null) : undefined}
      onPointerMove={arrasto ? moverArrasto : undefined}
      onPointerUp={arrasto ? terminarArrasto : undefined}
    >
      {caixas.map((c) => {
        const g = geometria(c);
        const pos = { left: g.x * px, top: g.y * px, width: g.w * px, height: g.h * px };
        const selecionavel = editavel && !FIXAS.has(c.chave);

        if (c.tipo === "retangulo") {
          return (
            <div
              key={c.chave}
              className="slide-canvas__ret"
              style={{ ...pos, background: `#${c.cor}` }}
              onPointerDown={selecionavel ? (ev) => iniciarArrasto(ev, c, "mover") : undefined}
            />
          );
        }

        if (c.tipo === "imagem") {
          const url = urlEmCache(c.caminho);
          const aoClicar = selecionavel ? (ev: ReactPointerEvent) => iniciarArrasto(ev, c, "mover") : undefined;
          return url ? (
            <img
              key={c.chave}
              className="slide-canvas__img"
              src={url}
              alt=""
              draggable={false}
              onPointerDown={aoClicar}
              style={{ ...pos, objectFit: c.ajuste === "cobrir" ? "cover" : c.ajuste === "conter" ? "contain" : "fill" }}
            />
          ) : (
            <div key={c.chave} className="slide-canvas__img slide-canvas__img--carregando" style={pos} onPointerDown={aoClicar} />
          );
        }

        const estilo = {
          ...pos,
          padding: MARGEM_TEXTO * px,
          fontFamily: FONTES[c.fonte].css,
          fontSize: c.tamanho * ptPx,
          lineHeight: ALTURA_LINHA * c.entrelinha,
          color: `#${c.cor}`,
          textAlign: c.alinhamento,
          justifyContent: c.vertical === "top" ? "flex-start" : "center",
          ["--recuo" as string]: c.marcadores ? `${RECUO_MARCADOR * px}px` : "0px",
        };
        const html = htmlDosTrechos(c);
        return (
          <div
            key={c.chave}
            className={"slide-canvas__texto" + (c.marcadores ? " slide-canvas__texto--marcadores" : "")}
            style={estilo}
            onPointerDown={
              editavel
                ? (ev) => {
                    ev.stopPropagation();
                    onSelecionar?.(c.chave);
                  }
                : undefined
            }
          >
            {editavel ? (
              <div
                key={html}
                className="slide-canvas__editavel"
                data-campo={c.campo}
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                data-vazio="Clique para digitar"
                dangerouslySetInnerHTML={{ __html: html }}
                onBlur={(e) => {
                  const trechos = lerTrechos(e.currentTarget);
                  const texto = trechos.map((t) => t.t).join("");
                  const uniforme = trechos.every((t) => t.b === c.negrito && t.i === c.italico);
                  const mudouTexto = texto !== c.texto;
                  const mudouFormato = JSON.stringify(trechos) !== JSON.stringify(c.trechos.filter((t) => t.t));
                  if (mudouTexto || mudouFormato) onTexto?.(c.campo, texto, uniforme ? null : trechos);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
                }}
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            )}
          </div>
        );
      })}

      {sel && !FIXAS.has(sel.chave) && (
        <div
          className="slide-canvas__moldura"
          style={{
            left: geometria(sel).x * px,
            top: geometria(sel).y * px,
            width: geometria(sel).w * px,
            height: geometria(sel).h * px,
          }}
        >
          <button
            type="button"
            className="slide-canvas__mover"
            title="Arraste para mover"
            aria-label="Mover caixa"
            onPointerDown={(ev) => iniciarArrasto(ev, sel, "mover")}
          >
            ✥
          </button>
          {ALCAS.map((a) => (
            <span
              key={a}
              className={`slide-canvas__alca slide-canvas__alca--${a}`}
              onPointerDown={(ev) => iniciarArrasto(ev, sel, a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const SlideCanvas = memo(SlideCanvasBase);
