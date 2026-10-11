import type { CorLiturgicaSlug } from "../types/liturgia";
import type { CorTema } from "./tipos";

/**
 * Tema "Rainha dos Apóstolos" — reproduz o PPTX da paróquia.
 * As imagens ficam no storage privado: imagens/<paroquia_id>/tema/...
 */

export interface PaletaCor {
  /** Fundo da faixa de título das músicas; null = sem faixa (festas brancas) */
  faixa: string | null;
  /** Cor do texto da faixa */
  faixaTexto: string;
  /** Cor do título do dia na capa */
  capaTitulo: string;
  /** Cor para o seletor no app */
  amostra: string;
  rotulo: string;
}

export const PALETAS: Record<CorTema, PaletaCor> = {
  verde: { faixa: "00B050", faixaTexto: "FFFFFF", capaTitulo: "0E4D3B", amostra: "#00B050", rotulo: "Verde" },
  roxo: { faixa: "7030A0", faixaTexto: "FFFFFF", capaTitulo: "4B1F6F", amostra: "#7030A0", rotulo: "Roxo" },
  vermelho: { faixa: "C00000", faixaTexto: "FFFFFF", capaTitulo: "8B0000", amostra: "#C00000", rotulo: "Vermelho" },
  rosa: { faixa: "D86BA0", faixaTexto: "FFFFFF", capaTitulo: "A3456E", amostra: "#D86BA0", rotulo: "Rosa" },
  // Como no modelo da Assunção: sem faixa, título dourado
  branco: { faixa: null, faixaTexto: "9B8053", capaTitulo: "0070C0", amostra: "#E9E4D6", rotulo: "Branco" },
  dourado: { faixa: "B8912F", faixaTexto: "FFFFFF", capaTitulo: "7A5C12", amostra: "#B8912F", rotulo: "Dourado" },
};

/** Faixa das orações fixas (Profissão de fé, Oração da comunidade...) */
export const FAIXA_FIXA = { faixa: "0070C0", faixaTexto: "FFFFFF" };

export const COR_AVISOS = "0063AC";

export function corDaLiturgia(cor: CorLiturgicaSlug): CorTema {
  switch (cor) {
    case "roxa":
      return "roxo";
    case "vermelha":
      return "vermelho";
    case "rosa":
      return "rosa";
    case "branca":
      return "branco";
    case "dourada":
      return "dourado";
    default:
      return "verde";
  }
}

export const IMAGENS_TEMA = {
  capa: (cor: CorTema) => `tema/capa-${cor}.png`,
  lgpd: "tema/lgpd.jpg",
  iconeOracao: "tema/icone-oracao.png",
  leituraFundo: "tema/leitura-fundo.png",
  avisosFundo: "tema/avisos-fundo.png",
  balanceteIcone: "tema/balancete-icone.png",
  logo: "tema/logo.jpg",
} as const;

/** Caminho completo no bucket a partir do caminho relativo do tema */
export function caminhoTema(paroquiaId: string, relativo: string): string {
  return `${paroquiaId}/${relativo}`;
}

/** Fontes: nome usado no PPTX (instaladas no Windows/Office) e pilha CSS para a prévia */
export const FONTES = {
  arial: { pptx: "Arial", css: "Arial, 'Helvetica Neue', Helvetica, sans-serif" },
  lato: { pptx: "Lato", css: "'Lato', Arial, sans-serif" },
  poppins: { pptx: "Poppins", css: "'Poppins', Arial, sans-serif" },
  corsiva: { pptx: "Monotype Corsiva", css: "'Monotype Corsiva', 'Dancing Script', cursive" },
} as const;

export type FonteId = keyof typeof FONTES;
