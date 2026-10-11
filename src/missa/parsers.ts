/**
 * Conversão dos textos colados pelo usuário (letras, avisos, prestação de contas)
 * no conteúdo dos slides.
 */

const MAX_LINHAS_POR_SLIDE = 7;

/** Letra colada → uma estrofe por slide (linha em branco separa estrofes) */
export function estrofesDaLetra(letra: string): string[] {
  const blocos = letra
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((b) =>
      b
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((linhas) => linhas.length > 0);

  const out: string[] = [];
  for (const linhas of blocos) {
    // Estrofe muito longa: divide em partes equilibradas
    const partes = Math.ceil(linhas.length / MAX_LINHAS_POR_SLIDE);
    const porParte = Math.ceil(linhas.length / partes);
    for (let i = 0; i < linhas.length; i += porParte) {
      out.push(linhas.slice(i, i + porParte).join("\n"));
    }
  }
  return out;
}

export interface Aviso {
  titulo: string;
  texto: string;
}

/**
 * Avisos no formato usado pela paróquia:
 *   AVISOS
 *
 *   Mês das Crianças – estamos arrecadando brinquedos...
 *
 *   Missa no Setor São Judas – dia 08/10, quinta-feira...
 */
export function parseAvisos(texto: string): Aviso[] {
  return texto
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s*\n\s*/g, " ").trim())
    .filter((b) => b && !/^avisos:?$/i.test(b))
    .map((b) => {
      const m = b.match(/^(.{2,80}?)\s+[–—-]\s+(.+)$/s) ?? b.match(/^([^:]{2,60}):\s+(.+)$/s);
      return m ? { titulo: m[1].trim(), texto: m[2].trim() } : { titulo: b, texto: "" };
    });
}

export interface Balancete {
  titulo: string;
  linhas: string[];
}

const MESES = [
  "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
  "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO",
];

/**
 * Prestação de contas no formato:
 *   PRESTAÇÃO DE CONTAS (SETEMBRO)
 *   Dízimo – R$ 53.641,43
 *   Total de dizimistas 607 (409 dizimaram)
 */
export function parseBalancete(texto: string, dataMissa: string): Balancete | null {
  const linhas = texto
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length === 0) return null;

  const [anoMissa, mesMissa] = dataMissa.split("-").map(Number);
  let mesRef = mesMissa === 1 ? 12 : mesMissa - 1;
  let corpo = linhas;

  const cab = linhas[0].match(/presta[çc][ãa]o de contas|balancete/i);
  if (cab) {
    const nome = linhas[0].toUpperCase().normalize("NFC");
    const idx = MESES.findIndex((m) => nome.includes(m) || nome.includes(m.normalize("NFD").replace(/\p{M}/gu, "")));
    if (idx >= 0) mesRef = idx + 1;
    corpo = linhas.slice(1);
  }
  const anoRef = mesRef > mesMissa ? anoMissa - 1 : anoMissa;

  // Como no slide da paróquia: dizimistas primeiro, depois os valores
  const topo: string[] = [];
  const saida: string[] = [];
  for (const l of corpo) {
    const dizimistas = l.match(/total de dizimistas\s*:?\s*(\d+)\s*\((\d+)/i);
    if (dizimistas) {
      topo.push(`DIZIMISTAS - CADASTRADOS (TOTAL): ${dizimistas[1]}`);
      topo.push(`DIZIMISTAS - CONTRIBUINTES: ${dizimistas[2]}`);
      continue;
    }
    const par = l.match(/^(.+?)\s*[–—:-]\s*(.+)$/);
    saida.push(par ? `${par[1].trim().toUpperCase()}: ${par[2].trim()}` : l.toUpperCase());
  }

  return {
    titulo: `BALANCETE FINANCEIRO - ${MESES[mesRef - 1]} ${anoRef}`,
    linhas: [...topo, ...saida],
  };
}

/* ------------------------------------------------------------------ */
/*  Respostas do povo a partir de um rito colado                       */
/* ------------------------------------------------------------------ */

/** Marcador que vira os slides da Profissão de fé */
export const MARCA_CREIO = "{creio}";

const FALANTES =
  "Todos|Todas|Candidat[oa]s?|Ministr[oa]s?|Assembleia|Povo|Fi[ée]is|Leitor|Comentarista|Animador|Bispo|Padre|Pe|Presidente|Celebrante|Di[áa]cono|AS|PR|T|R";
const RESPONDEM = /^(todos|todas|candidat|ministr|assembleia|povo|fi[ée]is|as$|t$|r$)/i;

/**
 * Extrai do texto de um rito só o que o povo/candidatos respondem
 * (é o que aparece no telão), na ordem. Ex.: "Candidatos.: Quero." → "Quero."
 * Menções à Profissão de fé viram o marcador {creio}.
 */
export function extrairRespostas(rito: string): string[] {
  const texto = rito.replace(/\r/g, "").replace(/\s+/g, " ");
  const re = new RegExp(`(?:^|[\\s.!?)])(${FALANTES})\\s*\\.?\\s*\\.?\\s*:`, "gi");
  const marcas = [...texto.matchAll(re)].map((m) => ({
    falante: m[1],
    inicio: m.index! + m[0].length,
    fim: m.index! + (m[0].length - m[0].trimStart().length),
  }));
  const out: string[] = [];
  marcas.forEach((m, i) => {
    const trecho = texto.slice(m.inicio, marcas[i + 1]?.fim ?? texto.length).trim();
    if (RESPONDEM.test(m.falante)) {
      let r = trecho.replace(/\(.*$/, "").trim();
      const fimFrase = r.search(/[.!?]/);
      if (fimFrase >= 0) r = r.slice(0, fimFrase + 1);
      else {
        // Sem pontuação ("Amém Benção das Vestes"): para antes do próximo título
        const palavras = r.split(" ");
        const corte = palavras.findIndex((p, j) => j > 0 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(p));
        if (corte > 0) r = palavras.slice(0, corte).join(" ");
      }
      if (r) out.push(r);
    }
    if (/profiss[ãa]o de f[ée]|creio em deus/i.test(trecho) && out[out.length - 1] !== MARCA_CREIO) {
      out.push(MARCA_CREIO);
    }
  });
  return out;
}
