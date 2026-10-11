import { COR_AVISOS, FAIXA_FIXA, FONTES, IMAGENS_TEMA, PALETAS, caminhoTema, type FonteId } from "./tema";
import type { CorTema, EstiloCaixa, Slide, Trecho } from "./tipos";

/**
 * Converte um Slide em caixas posicionadas, em polegadas (slide 16:9 = 13,333" × 7,5"),
 * com as posições medidas nos PPTX da paróquia. O mesmo resultado alimenta a prévia
 * (SlideCanvas) e a exportação (pptx.ts), então os dois ficam idênticos.
 * Os ajustes manuais (slide.estilos[chave]) são aplicados aqui.
 */

export const LARGURA = 13.333;
export const ALTURA = 7.5;
/** Margem interna das caixas de texto (polegadas), igual no PPTX e na prévia */
export const MARGEM_TEXTO = 0.05;
/** Altura de linha usada no cálculo de quebra (proporção do tamanho da fonte) */
export const ALTURA_LINHA = 1.15;
/** Recuo dos itens com marcador (polegadas), como no PPTX da capa */
export const RECUO_MARCADOR = 0.5;

export interface CaixaBase {
  /** Identifica a caixa dentro do slide para guardar ajustes manuais */
  chave: string;
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
  ajuste: "cobrir" | "conter" | "esticar";
}

export type CampoEditavel = "titulo" | "texto" | "subtitulo" | "rodape";

export interface CaixaTexto extends CaixaBase {
  tipo: "texto";
  campo: CampoEditavel;
  /** Texto puro (sem formatação) */
  texto: string;
  /** Texto com formatação por trecho; "\n" separa parágrafos */
  trechos: Trecho[];
  fonte: FonteId;
  /** Tamanho final em pt (reduzido para caber, se não for fixo) */
  tamanho: number;
  negrito: boolean;
  italico: boolean;
  cor: string;
  alinhamento: "left" | "center" | "right";
  vertical: "top" | "middle";
  /** Espaçamento entre linhas (1 = simples) */
  entrelinha: number;
  marcadores: boolean;
}

export type Caixa = CaixaRetangulo | CaixaImagem | CaixaTexto;

/* ------------------------------------------------------------------ */
/*  Trechos (negrito/itálico em parte do texto)                        */
/* ------------------------------------------------------------------ */

export function textoDosTrechos(trechos: Trecho[]): string {
  return trechos.map((t) => t.t).join("");
}

/** Divide os trechos em parágrafos (pela quebra de linha) */
export function paragrafos(trechos: Trecho[]): Trecho[][] {
  const out: Trecho[][] = [[]];
  for (const tr of trechos) {
    const partes = tr.t.split("\n");
    partes.forEach((parte, i) => {
      if (i > 0) out.push([]);
      if (parte) out[out.length - 1].push({ ...tr, t: parte });
    });
  }
  return out;
}

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
  const pars = texto.split("\n");
  if (!c) {
    // Sem canvas (ex.: testes): estimativa por média de largura de caractere
    const porLinha = Math.max(1, Math.floor(larguraPt / (tamanhoPt * 0.55)));
    return pars.reduce((n, p) => n + Math.max(1, Math.ceil(p.length / porLinha)), 0);
  }
  c.font = `${italico ? "italic " : ""}${negrito ? "700 " : "400 "}${tamanhoPt}px ${fonteCss}`;
  let linhas = 0;
  for (const p of pars) {
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

function ajustarTamanho(caixa: Omit<CaixaTexto, "tamanho">, tamanhoBase: number, evitarQuebra: boolean): number {
  if (!caixa.texto.trim()) return tamanhoBase;
  const recuo = caixa.marcadores ? RECUO_MARCADOR : 0;
  const larguraPt = (caixa.w - MARGEM_TEXTO * 2 - recuo) * 72;
  const alturaPt = (caixa.h - MARGEM_TEXTO * 2) * 72;
  const fonteCss = FONTES[caixa.fonte].css;
  if (evitarQuebra) {
    // Versos de música: reduz até 15% se isso deixar cada verso numa linha só
    const pars = caixa.texto.split("\n").length;
    for (let t = tamanhoBase; t >= Math.round(tamanhoBase * 0.85); t--) {
      const linhas = contarLinhas(caixa.texto, fonteCss, t, larguraPt, caixa.negrito, caixa.italico);
      if (linhas === pars) {
        if (linhas * t * ALTURA_LINHA * caixa.entrelinha <= alturaPt) return t;
        break;
      }
    }
  }
  let tamanho = tamanhoBase;
  while (tamanho > 14) {
    const linhas = contarLinhas(caixa.texto, fonteCss, tamanho, larguraPt, caixa.negrito, caixa.italico);
    if (linhas * tamanho * ALTURA_LINHA * caixa.entrelinha <= alturaPt) break;
    tamanho -= 1;
  }
  return tamanho;
}

interface OpcoesTexto {
  fonte?: FonteId;
  tamanho: number;
  negrito?: boolean;
  italico?: boolean;
  cor?: string;
  alinhamento?: "left" | "center" | "right";
  vertical?: "top" | "middle";
  entrelinha?: number;
  marcadores?: boolean;
  /** Prefere reduzir um pouco a fonte a quebrar uma linha (letras de música) */
  evitarQuebra?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Layout por tipo de slide                                           */
/* ------------------------------------------------------------------ */

/** Converte porcentagens do slide (como medidas no PPTX) em polegadas */
function pct(x: number, y: number, w: number, h: number) {
  return { x: (x / 100) * LARGURA, y: (y / 100) * ALTURA, w: (w / 100) * LARGURA, h: (h / 100) * ALTURA };
}

class Montador {
  caixas: Caixa[] = [];
  constructor(private slide: Slide) {}

  private estilo(chave: string): EstiloCaixa {
    return this.slide.estilos?.[chave] ?? {};
  }

  private posicao(chave: string, b: ReturnType<typeof pct>) {
    const e = this.estilo(chave);
    return { chave, x: e.x ?? b.x, y: e.y ?? b.y, w: e.w ?? b.w, h: e.h ?? b.h };
  }

  retangulo(chave: string, b: ReturnType<typeof pct>, cor: string) {
    this.caixas.push({ tipo: "retangulo", ...this.posicao(chave, b), cor });
  }

  imagem(chave: string, b: ReturnType<typeof pct>, caminho: string | undefined, ajuste: CaixaImagem["ajuste"]) {
    if (caminho) this.caixas.push({ tipo: "imagem", ...this.posicao(chave, b), caminho, ajuste });
  }

  texto(campo: CampoEditavel, b: ReturnType<typeof pct>, texto: string, o: OpcoesTexto) {
    const e = this.estilo(campo);
    const negrito = e.negrito ?? o.negrito ?? true;
    const italico = e.italico ?? o.italico ?? false;
    const trechos = e.trechos?.length ? e.trechos : [{ t: texto, b: negrito, i: italico }];
    const base: Omit<CaixaTexto, "tamanho"> = {
      tipo: "texto",
      ...this.posicao(campo, b),
      campo,
      texto: textoDosTrechos(trechos),
      trechos,
      fonte: e.fonte ?? o.fonte ?? "arial",
      negrito,
      italico,
      cor: e.cor ?? o.cor ?? "000000",
      alinhamento: e.alinhamento ?? o.alinhamento ?? "center",
      vertical: o.vertical ?? "middle",
      entrelinha: o.entrelinha ?? 1,
      marcadores: o.marcadores ?? false,
    };
    const tamanho = e.tamanho ?? ajustarTamanho(base, Math.round(o.tamanho * (this.slide.escala ?? 1)), o.evitarQuebra ?? false);
    this.caixas.push({ ...base, tamanho });
  }
}

export function layoutDoSlide(slide: Slide, cor: CorTema, paroquiaId: string): Caixa[] {
  const m = new Montador(slide);
  const italico = slide.italico ?? false;
  const tema = (rel: string) => caminhoTema(paroquiaId, rel);

  const faixa = (y = 0, alturaPct = 12) => {
    const fixa = slide.faixa === "fixa";
    const paleta = PALETAS[cor];
    const fundo = fixa ? FAIXA_FIXA.faixa : paleta.faixa;
    if (!fixa && paleta.faixaImagem) m.imagem("faixa", pct(0, y, 100, alturaPct), tema(paleta.faixaImagem), "esticar");
    else if (fundo) m.retangulo("faixa", pct(0, y, 100, alturaPct), fundo);
    if (slide.icone) m.imagem("icone", pct(7.5, y + 0.2, 5, alturaPct - 0.5), tema(IMAGENS_TEMA.iconeOracao), "conter");
    const central = slide.tipo === "faixa-central";
    m.texto("titulo", pct(13, y, 74, alturaPct), slide.titulo ?? "", {
      tamanho: central ? 54 : 40,
      cor: fixa ? FAIXA_FIXA.faixaTexto : paleta.faixaTexto,
    });
  };

  switch (slide.tipo) {
    case "branco":
      break;

    case "imagem":
      m.imagem("imagem", pct(0, 0, 100, 100), slide.imagem, "cobrir");
      break;

    case "capa": {
      const paleta = PALETAS[cor];
      m.imagem("fundo", pct(0, 0, 100, 100), slide.imagem, "cobrir");
      // Medidas do PPTX da Assunção: Lato 48 negrito itálico, centralizado
      m.texto("titulo", pct(15, 3, 79, 22), slide.titulo ?? "", {
        fonte: "lato",
        tamanho: 48,
        italico: true,
        cor: paleta.capaTitulo,
      });
      // Leituras: Lato 35 negrito, marcador "o", espaçamento 1,5
      m.texto("texto", pct(18, 29, 76, 44), slide.texto ?? "", {
        fonte: "lato",
        tamanho: 35,
        cor: "262626",
        alinhamento: "left",
        vertical: "top",
        entrelinha: 1.5,
        marcadores: true,
      });
      m.texto("rodape", pct(18, 73, 60, 9), slide.rodape ?? "", {
        fonte: "lato",
        tamanho: 30,
        cor: paleta.capaTitulo,
        alinhamento: "left",
      });
      break;
    }

    case "faixa-texto":
      faixa();
      m.texto("texto", pct(1.5, 14, 97, 83), slide.texto ?? "", { tamanho: slide.fonte ?? 48, italico, evitarQuebra: true });
      break;

    case "faixa-central":
      faixa(41, 13);
      break;

    case "texto-central":
      m.texto("texto", pct(4, 10, 92, 80), slide.texto ?? "", { tamanho: slide.fonte ?? 54, italico });
      break;

    case "leitura-capa":
      m.imagem("fundo", pct(0, 0, 100, 100), slide.imagem, "cobrir");
      m.texto("titulo", pct(4, 18, 58, 15), slide.titulo ?? "", { fonte: "corsiva", tamanho: 60, cor: "FFFFFF" });
      m.texto("texto", pct(3.5, 32, 59, 13), slide.texto ?? "", { tamanho: 48, cor: "FFFFFF" });
      break;

    case "balancete":
      m.texto("titulo", pct(2, 6, 96, 11), slide.titulo ?? "", { tamanho: 40 });
      m.texto("texto", pct(3.6, 20, 72, 74), slide.texto ?? "", {
        tamanho: slide.fonte ?? 33,
        alinhamento: "left",
        vertical: "top",
      });
      m.imagem("icone", pct(75.8, 50, 20.4, 28.7), slide.imagem, "conter");
      break;

    case "aviso":
      m.imagem("fundo", pct(0, 0, 100, 100), slide.imagem, "cobrir");
      m.texto("titulo", pct(12, 4, 76, 13), slide.titulo ?? "", { fonte: "poppins", tamanho: 45, cor: COR_AVISOS });
      m.texto("texto", pct(12, 19, 76, 60), slide.texto ?? "", {
        fonte: "poppins",
        tamanho: slide.fonte ?? 41,
        negrito: false,
        cor: COR_AVISOS,
      });
      break;

    case "final":
      m.imagem("imagem", pct(24.8, 6, 50.3, 77.5), slide.imagem, "conter");
      if (slide.texto) m.texto("texto", pct(10, 85, 80, 10), slide.texto, { tamanho: 36, cor: "0063AC" });
      break;
  }
  return m.caixas;
}

/** Rótulo amigável da caixa para a interface */
export function nomeDaCaixa(c: Caixa): string {
  if (c.tipo === "texto") {
    return { titulo: "Título", texto: "Texto", subtitulo: "Subtítulo", rodape: "Data e horário" }[c.campo];
  }
  return { faixa: "Faixa do título", icone: "Ícone", fundo: "Imagem de fundo", imagem: "Imagem" }[c.chave] ?? "Elemento";
}
