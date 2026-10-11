/**
 * Modelo de dados da missa e dos slides.
 *
 * Fluxo: EstadoMissa (escolhas do usuário, salvo em celebracoes.estado)
 *   + Liturgia do dia + Textos da paróquia
 *   → gerarSlides() → Slide[]
 *   → layout.ts transforma cada Slide em caixas posicionadas (Caixa[])
 *   → as mesmas caixas são desenhadas no navegador (SlideCanvas) e no PPTX.
 */

export type CorTema = "verde" | "roxo" | "vermelho" | "rosa" | "branco" | "dourado";

export type TipoSlide =
  | "branco" // tela vazia entre os blocos
  | "capa"
  | "imagem" // imagem em tela cheia (LGPD, Evangelho, extras)
  | "faixa-texto" // faixa de título no topo + texto (músicas, orações, Creio...)
  | "faixa-central" // apenas a faixa, no meio da tela (título da Oração Eucarística)
  | "texto-central" // texto sozinho, centralizado (aclamações da OE, doxologia)
  | "leitura-capa" // foto + "1º Leitura" + referência
  | "balancete"
  | "aviso"
  | "final";

/** Trecho de texto com formatação própria (negrito/itálico em parte do texto) */
export interface Trecho {
  t: string;
  b: boolean;
  i: boolean;
}

export type FonteSlide = "arial" | "lato" | "poppins" | "corsiva" | "calibri" | "times";

/** Ajustes manuais de uma caixa do slide (posição em polegadas, fonte, tamanho...) */
export interface EstiloCaixa {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  fonte?: FonteSlide;
  /** Tamanho fixo em pt (desliga a redução automática) */
  tamanho?: number;
  negrito?: boolean;
  italico?: boolean;
  alinhamento?: "left" | "center" | "right";
  cor?: string;
  /** Texto com formatação por trecho; sobrepõe o texto do campo */
  trechos?: Trecho[];
}

/** Estilo da faixa: na cor do dia (músicas) ou azul fixo (orações da paróquia) */
export type EstiloFaixa = "liturgica" | "fixa";

export interface Slide {
  /** Estável entre gerações: usado para guardar as edições manuais */
  id: string;
  /** Seção do roteiro a que pertence (agrupa as miniaturas) */
  secao: string;
  tipo: TipoSlide;
  titulo?: string;
  texto?: string;
  subtitulo?: string;
  /** Linha extra da capa (horário, dia da semana e data) */
  rodape?: string;
  faixa?: EstiloFaixa;
  /** Ícone de mãos em oração ao lado do título */
  icone?: boolean;
  /** Caminho no storage (bucket imagens) */
  imagem?: string;
  italico?: boolean;
  /** Tamanho base do texto em pt (o layout reduz se não couber) */
  fonte?: number;
  /** Ajuste manual do usuário sobre o tamanho (1 = 100%) */
  escala?: number;
  /** Ajustes manuais por caixa (chave = campo de texto ou elemento: "faixa", "icone", "fundo"...) */
  estilos?: Record<string, EstiloCaixa>;
}

/** Momentos de música que o modelo usa */
export type MomentoMusica =
  | "abertura"
  | "ato-penitencial"
  | "gloria"
  | "aclamacao"
  | "ofertorio"
  | "santo"
  | "cordeiro"
  | "comunhao";

export interface MusicaDaMissa {
  titulo?: string;
  letra: string;
}

export interface TelaExtra {
  id: string;
  /** Entra logo depois desta seção */
  depoisDe: string;
  tipo: "texto" | "imagem" | "branco";
  titulo?: string;
  texto?: string;
  imagem?: string;
}

export interface EstadoMissa {
  versao: 1;
  comMusica: boolean;
  gloria: boolean;
  creio: "curto" | "longo" | "nenhum";
  /** Chave do texto da OE (ex.: "II", "III") */
  oracaoEucaristica: string;
  /** Índice (0-2) da aclamação do Mistério da fé */
  misterioFe: number;
  respostaPreces: string;
  aclamacaoVerso: string;
  musicas: Partial<Record<MomentoMusica, MusicaDaMissa>>;
  avisosTexto: string;
  balanceteTexto: string;
  /** Caminhos no storage; null = usar as imagens cadastradas para o Evangelho do dia */
  imagensEvangelho: string[] | null;
  /** Ajustes nas referências/títulos vindos da liturgia */
  liturgia: {
    diaLiturgico?: string;
    leitura1?: string;
    salmo?: string;
    salmoRefrao?: string;
    leitura2?: string;
    evangelho?: string;
  };
  /** Ordem personalizada das seções (ids); vazia = ordem do modelo */
  ordemSecoes: string[];
  secoesDesligadas: string[];
  extras: TelaExtra[];
  /** Slides ocultados manualmente */
  ocultos: string[];
  /** Edições manuais por id de slide */
  edicoes: Record<string, Partial<Pick<Slide, "titulo" | "texto" | "subtitulo" | "rodape" | "escala" | "imagem" | "estilos">>>;
}

/** Textos fixos da paróquia (tabela textos), já indexados por chave */
export interface TextosParoquia {
  [chave: string]: { titulo: string; conteudo: Record<string, unknown> } | undefined;
}

/** Tudo o que o gerador precisa além do EstadoMissa */
export interface ContextoMissa {
  data: string; // yyyy-mm-dd
  horario: string; // HH:MM
  cor: CorTema;
  diaLiturgico: string;
  leitura1?: string;
  salmo?: string;
  salmoRefrao?: string;
  leitura2?: string;
  evangelho?: string;
  textos: TextosParoquia;
  imagensEvangelhoPadrao: string[];
  paroquiaId: string;
  instagram?: string;
}
