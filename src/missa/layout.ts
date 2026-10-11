import { COR_AVISOS, FAIXA_FIXA, FONTES, IMAGENS_TEMA, PALETAS, caminhoTema, type FonteId } from "./tema";
import type { CorTema, Slide } from "./tipos";

/**
 * Converte um Slide em caixas posicionadas, em polegadas (slide 16:9 = 13,333" × 7,5"),
 * com as posições medidas nos PPTX da paróquia. O mesmo resultado alimenta a prévia
 * (SlideCanvas) e a exportação (pptx.ts), então os dois ficam idênticos.
 */

export const LARGURA = 13.333;
export const ALTURA = 7.5;
/** Margem interna das caixas de texto (polegadas), igual no PPTX e na prévia */
export const MARGEM_TEXTO = 0.05;
/** Altura de linha usada no cálculo de quebra (proporção do tamanho da fonte) */
export const ALTURA_LINHA = 1.15;

export interface CaixaBase {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaixaRetangulo extends CaixaBase {
  tipo: "retangulo";
  cor: string;
}

export interface CaixaImagem extends CaixaBase {
  tipo: "imagem";
  /** Caminho no bucket de imagens */
  caminho: string;
  ajuste: "cobrir" | "conter";
}

export type CampoEditavel = "titulo" | "texto" | "subtitulo" | "rodape";

export interface CaixaTexto extends CaixaBase {
  tipo: "texto";
  texto: string;
  campo: CampoEditavel;
  fonte: FonteId;
  /** Tamanho final em pt, já reduzido para caber na caixa */
  tamanho: number;
  negrito: boolean;
  italico: boolean;
  cor: string;
  alinhamento: "left" | "center";
  vertical: "top" | "middle";
}

export type Caixa = CaixaRetangulo | CaixaImagem | CaixaTexto;

/* ------------------------------------------------------------------ */
/*  Medição de texto (reduz a fonte até caber, como o "ajustar" do PPT) */
/* ------------------------------------------------------------------ */

let contexto: CanvasRenderingContext2D | null = null;
function ctx2d(): CanvasRenderingContext2D | null {
  if (contexto) return contexto;
  if (typeof document === "undefined") return null;
  contexto = document.createElement("canvas").getContext("2d");
  return contexto;
}

/** Número de linhas que o texto ocupa na largura dada (em pt) */
function contarLinhas(texto: string, fonteCss: string, tamanhoPt: number, larguraPt: number, negrito: boolean, italico: boolean): number {
  const c = ctx2d();
  const paragrafos = texto.split("\n");
  if (!c) {
    // Sem canvas (ex.: testes): estimativa por média de largura de caractere
    const porLinha = Math.max(1, Math.floor(larguraPt / (tamanhoPt * 0.55)));
    return paragrafos.reduce((n, p) => n + Math.max(1, Math.ceil(p.length / porLinha)), 0);
  }
  c.font = `${italico ? "italic " : ""}${negrito ? "700 " : "400 "}${tamanhoPt}px ${fonteCss}`;
  let linhas = 0;
  for (const p of paragrafos) {
    const palavras = p.split(/\s+/).filter(Boolean);
    if (palavras.length === 0) {
      linhas += 1;
      continue;
    }
    let atual = "";
    let n = 1;
    for (const palavra of palavras) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (c.measureText(teste).width > larguraPt && atual) {
        n++;
        atual = palavra;
      } else {
        atual = teste;
      }
    }
    linhas += n;
  }
  return linhas;
}

function ajustarTamanho(
  texto: string,
  fonte: FonteId,
  tamanhoBase: number,
  w: number,
  h: number,
  negrito: boolean,
  italico: boolean,
): number {
  if (!texto.trim()) return tamanhoBase;
  const larguraPt = (w - MARGEM_TEXTO * 2) * 72;
  const alturaPt = (h - MARGEM_TEXTO * 2) * 72;
  let tamanho = tamanhoBase;
  while (tamanho > 14) {
    const linhas = contarLinhas(texto, FONTES[fonte].css, tamanho, larguraPt, negrito, italico);
    if (linhas * tamanho * ALTURA_LINHA <= alturaPt) break;
    tamanho -= 1;
  }
  return tamanho;
}

function caixaTexto(
  b: CaixaBase,
  texto: string,
  campo: CampoEditavel,
  opts: {
    fonte?: FonteId;
    tamanho: number;
    negrito?: boolean;
    italico?: boolean;
    cor?: string;
    alinhamento?: "left" | "center";
    vertical?: "top" | "middle";
    escala?: number;
    ajustar?: boolean;
  },
): CaixaTexto {
  const fonte = opts.fonte ?? "arial";
  const negrito = opts.negrito ?? true;
  const italico = opts.italico ?? false;
  const base = Math.round(opts.tamanho * (opts.escala ?? 1));
  return {
    tipo: "texto",
    ...b,
    texto,
    campo,
    fonte,
    tamanho: opts.ajustar === false ? base : ajustarTamanho(texto, fonte, base, b.w, b.h, negrito, italico),
    negrito,
    italico,
    cor: opts.cor ?? "000000",
    alinhamento: opts.alinhamento ?? "center",
    vertical: opts.vertical ?? "middle",
  };
}

/** Converte porcentagens do slide (como medidas no PPTX) em polegadas */
function pct(x: number, y: number, w: number, h: number): CaixaBase {
  return { x: (x / 100) * LARGURA, y: (y / 100) * ALTURA, w: (w / 100) * LARGURA, h: (h / 100) * ALTURA };
}

/* ------------------------------------------------------------------ */
/*  Layout por tipo de slide                                           */
/* ------------------------------------------------------------------ */

function faixa(slide: Slide, cor: CorTema, paroquiaId: string, y = 0, alturaPct = 12): Caixa[] {
  const estilo = slide.faixa === "fixa" ? FAIXA_FIXA : PALETAS[cor];
  const caixas: Caixa[] = [];
  if (estilo.faixa) caixas.push({ tipo: "retangulo", ...pct(0, y, 100, alturaPct), cor: estilo.faixa });
  if (slide.icone) {
    caixas.push({
      tipo: "imagem",
      ...pct(7.5, y + 0.2, 5, alturaPct - 0.5),
      caminho: caminhoTema(paroquiaId, IMAGENS_TEMA.iconeOracao),
      ajuste: "conter",
    });
  }
  const central = slide.tipo === "faixa-central";
  caixas.push(
    caixaTexto(pct(13, y, 74, alturaPct), slide.titulo ?? "", "titulo", {
      tamanho: central ? 54 : 40,
      cor: estilo.faixaTexto,
      escala: central ? slide.escala : 1,
    }),
  );
  return caixas;
}

export function layoutDoSlide(slide: Slide, cor: CorTema, paroquiaId: string): Caixa[] {
  const escala = slide.escala ?? 1;
  const italico = slide.italico ?? false;

  switch (slide.tipo) {
    case "branco":
      return [];

    case "imagem":
      return slide.imagem ? [{ tipo: "imagem", ...pct(0, 0, 100, 100), caminho: slide.imagem, ajuste: "cobrir" }] : [];

    case "capa": {
      const paleta = PALETAS[cor];
      const caixas: Caixa[] = [];
      if (slide.imagem) caixas.push({ tipo: "imagem", ...pct(0, 0, 100, 100), caminho: slide.imagem, ajuste: "cobrir" });
      caixas.push(
        caixaTexto(pct(17, 9, 77, 14), slide.titulo ?? "", "titulo", {
          fonte: "lato",
          tamanho: 44,
          negrito: true,
          cor: paleta.capaTitulo,
          escala,
        }),
        caixaTexto(pct(22, 26, 62, 40), slide.texto ?? "", "texto", {
          fonte: "lato",
          tamanho: 35,
          negrito: false,
          cor: "262626",
          alinhamento: "left",
          vertical: "top",
          escala,
        }),
        caixaTexto(pct(22, 68, 62, 9), slide.rodape ?? "", "rodape", {
          fonte: "lato",
          tamanho: 32,
          negrito: true,
          cor: paleta.capaTitulo,
          alinhamento: "left",
          escala,
        }),
      );
      return caixas;
    }

    case "faixa-texto": {
      const tamanho = slide.fonte ?? 48;
      return [
        ...faixa(slide, cor, paroquiaId),
        caixaTexto(pct(1.5, 14, 97, 83), slide.texto ?? "", "texto", { tamanho, italico, escala }),
      ];
    }

    case "faixa-central":
      return faixa(slide, cor, paroquiaId, 41, 13);

    case "texto-central":
      return [caixaTexto(pct(4, 10, 92, 80), slide.texto ?? "", "texto", { tamanho: slide.fonte ?? 54, italico, escala })];

    case "leitura-capa": {
      const caixas: Caixa[] = [];
      if (slide.imagem) caixas.push({ tipo: "imagem", ...pct(0, 0, 100, 100), caminho: slide.imagem, ajuste: "cobrir" });
      caixas.push(
        caixaTexto(pct(4, 18, 58, 15), slide.titulo ?? "", "titulo", { fonte: "corsiva", tamanho: 60, cor: "FFFFFF", escala }),
        caixaTexto(pct(3.5, 32, 59, 13), slide.texto ?? "", "texto", { tamanho: 48, cor: "FFFFFF", escala }),
      );
      return caixas;
    }

    case "balancete": {
      const caixas: Caixa[] = [
        caixaTexto(pct(2, 6, 96, 11), slide.titulo ?? "", "titulo", { tamanho: 40, escala }),
        caixaTexto(pct(3.6, 20, 72, 74), slide.texto ?? "", "texto", {
          tamanho: slide.fonte ?? 33,
          alinhamento: "left",
          vertical: "top",
          escala,
        }),
      ];
      if (slide.imagem) caixas.push({ tipo: "imagem", ...pct(75.8, 50, 20.4, 28.7), caminho: slide.imagem, ajuste: "conter" });
      return caixas;
    }

    case "aviso": {
      const caixas: Caixa[] = [];
      if (slide.imagem) caixas.push({ tipo: "imagem", ...pct(0, 0, 100, 100), caminho: slide.imagem, ajuste: "cobrir" });
      caixas.push(
        caixaTexto(pct(12, 4, 76, 13), slide.titulo ?? "", "titulo", { fonte: "poppins", tamanho: 45, cor: COR_AVISOS, escala }),
        caixaTexto(pct(12, 19, 76, 60), slide.texto ?? "", "texto", {
          fonte: "poppins",
          tamanho: slide.fonte ?? 41,
          negrito: false,
          cor: COR_AVISOS,
          escala,
        }),
      );
      return caixas;
    }

    case "final": {
      const caixas: Caixa[] = [];
      if (slide.imagem) caixas.push({ tipo: "imagem", ...pct(24.8, 6, 50.3, 77.5), caminho: slide.imagem, ajuste: "conter" });
      if (slide.texto) {
        caixas.push(caixaTexto(pct(10, 85, 80, 10), slide.texto, "texto", { tamanho: 36, cor: "0063AC", escala }));
      }
      return caixas;
    }
  }
}
