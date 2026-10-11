import { memo, useEffect, useMemo, useState } from "react";
import { ALTURA, ALTURA_LINHA, LARGURA, MARGEM_TEXTO, layoutDoSlide, type CampoEditavel } from "../../missa/layout";
import { FONTES } from "../../missa/tema";
import { carregarUrls, urlEmCache } from "../../missa/imagens";
import type { CorTema, Slide } from "../../missa/tipos";
import "./SlideCanvas.css";

interface Props {
  slide: Slide;
  cor: CorTema;
  paroquiaId: string;
  /** Largura em px; a altura segue 16:9 */
  largura: number;
  editavel?: boolean;
  onEditar?: (campo: CampoEditavel, valor: string) => void;
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

function SlideCanvasBase({ slide, cor, paroquiaId, largura, editavel, onEditar }: Props) {
  const fontes = useFontesProntas();
  const caixas = useMemo(
    () => layoutDoSlide(slide, cor, paroquiaId),
    [slide, cor, paroquiaId, fontes],
  );
  const px = largura / LARGURA; // px por polegada
  const ptPx = px / 72; // px por ponto

  const caminhos = useMemo(
    () => caixas.flatMap((c) => (c.tipo === "imagem" ? [c.caminho] : [])),
    [caixas],
  );
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

  return (
    <div
      className={"slide-canvas" + (editavel ? " slide-canvas--editavel" : "")}
      style={{ width: largura, height: (largura * ALTURA) / LARGURA }}
    >
      {caixas.map((c, i) => {
        const pos = { left: c.x * px, top: c.y * px, width: c.w * px, height: c.h * px };
        if (c.tipo === "retangulo") {
          return <div key={i} className="slide-canvas__ret" style={{ ...pos, background: `#${c.cor}` }} />;
        }
        if (c.tipo === "imagem") {
          const url = urlEmCache(c.caminho);
          return url ? (
            <img
              key={i}
              className="slide-canvas__img"
              src={url}
              alt=""
              draggable={false}
              style={{ ...pos, objectFit: c.ajuste === "cobrir" ? "cover" : "contain" }}
            />
          ) : (
            <div key={i} className="slide-canvas__img slide-canvas__img--carregando" style={pos} />
          );
        }
        const estilo = {
          ...pos,
          padding: MARGEM_TEXTO * px,
          fontFamily: FONTES[c.fonte].css,
          fontSize: c.tamanho * ptPx,
          lineHeight: ALTURA_LINHA,
          fontWeight: c.negrito ? 700 : 400,
          fontStyle: c.italico ? "italic" : "normal",
          color: `#${c.cor}`,
          textAlign: c.alinhamento,
          justifyContent: c.vertical === "top" ? "flex-start" : "center",
        } as const;
        return (
          <div key={i} className="slide-canvas__texto" style={estilo}>
            {editavel ? (
              <div
                className="slide-canvas__editavel"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                title="Clique para editar"
                data-vazio="Clique para digitar"
                onBlur={(e) => {
                  const valor = e.currentTarget.innerText.replace(/\n$/, "");
                  if (valor !== c.texto) onEditar?.(c.campo, valor);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
                }}
              >
                {c.texto}
              </div>
            ) : (
              c.texto
            )}
          </div>
        );
      })}
    </div>
  );
}

export const SlideCanvas = memo(SlideCanvasBase);
