import type { Musica } from "../types/musica";
import type { BlocoSlide } from "../data/blocosLiturgicos";
import type { RiteKey } from "../components/RiteTabs";

const LIMITE_CARACTERES_POR_SLIDE = 280;

interface OpcoesPaginar {
  rito: RiteKey;
  prefixoId?: string;
  rotuloSecao?: string;
}

export function paginarMusicaEmSlides(
  musica: Musica,
  opts: OpcoesPaginar,
): BlocoSlide[] {
  const out: BlocoSlide[] = [];
  const id = (sufixo: string) =>
    `${opts.prefixoId ?? "canto"}-${musica.id}-${sufixo}`;
  const tituloBase = `${opts.rotuloSecao ?? "Canto"} — ${musica.titulo}`;

  if (musica.refrao && musica.refrao.trim()) {
    out.push({
      id: id("refrao"),
      rito: opts.rito,
      tipo: "canto",
      titulo: tituloBase,
      texto: `<p><strong>℟ ${escHtml(musica.refrao.trim())}</strong></p>`,
    });
  }

  musica.estrofes.forEach((estrofe, i) => {
    const blocos = quebrarEstrofe(estrofe, LIMITE_CARACTERES_POR_SLIDE);
    blocos.forEach((trecho, j) => {
      const sufixoTitulo =
        blocos.length > 1 ? ` (${j + 1}/${blocos.length})` : "";
      out.push({
        id: id(`estrofe-${i + 1}-${j}`),
        rito: opts.rito,
        tipo: "canto",
        titulo: `${tituloBase}${sufixoTitulo}`,
        texto: estrofeParaHtml(trecho),
      });
    });
  });

  if (out.length === 0) {
    out.push({
      id: id("vazio"),
      rito: opts.rito,
      tipo: "canto",
      titulo: tituloBase,
      texto: "<p><em>Adicione a letra deste canto na tela Músicas.</em></p>",
    });
  }
  return out;
}

function quebrarEstrofe(estrofe: string, limite: number): string[] {
  const linhas = estrofe
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.join("\n").length <= limite) return [estrofe.trim()];

  const blocos: string[] = [];
  let buffer: string[] = [];
  let tamanhoAtual = 0;
  for (const linha of linhas) {
    const sizeComLinha = tamanhoAtual + linha.length + 1;
    if (sizeComLinha > limite && buffer.length > 0) {
      blocos.push(buffer.join("\n"));
      buffer = [];
      tamanhoAtual = 0;
    }
    buffer.push(linha);
    tamanhoAtual += linha.length + 1;
  }
  if (buffer.length > 0) blocos.push(buffer.join("\n"));
  return blocos;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function estrofeParaHtml(estrofe: string): string {
  return estrofe
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p>${escHtml(l)}</p>`)
    .join("");
}
