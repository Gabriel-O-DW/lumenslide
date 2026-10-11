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
