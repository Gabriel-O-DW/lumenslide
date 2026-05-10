import type {
  CorLiturgicaSlug,
  LeituraNormalizada,
  LiturgiaDiaria,
  SalmoNormalizado,
} from "../types/liturgia";

const API_BASE = "https://api-liturgia-diaria.vercel.app";
const DEV_PREFIX = "/api-liturgia";

function endpoint(path: string): string {
  const proxy = (import.meta.env.VITE_LITURGIA_PROXY as string | undefined) ?? "";
  if (proxy) return `${proxy}${API_BASE}${path}`;
  if (import.meta.env.DEV) return `${DEV_PREFIX}${path}`;
  return `${API_BASE}${path}`;
}

const cache = new Map<string, Promise<LiturgiaDiaria>>();

export function buscarLiturgia(dataIso: string): Promise<LiturgiaDiaria> {
  const cached = cache.get(dataIso);
  if (cached) return cached;
  const p = (async () => {
    const res = await fetch(endpoint(`/?date=${encodeURIComponent(dataIso)}`));
    if (!res.ok) {
      throw new Error(`Falha na API de liturgia (${res.status})`);
    }
    const raw = await res.json();
    return normalizar(raw, dataIso);
  })();
  cache.set(dataIso, p);
  // Em caso de falha, libera o cache para retry
  p.catch(() => cache.delete(dataIso));
  return p;
}

export function buscarLiturgiaSemana(
  segundaIso: string,
): Promise<Array<{ data: string; liturgia: LiturgiaDiaria | null; erro?: string }>> {
  const datas = construirSemana(segundaIso);
  return Promise.all(
    datas.map(async (d) => {
      try {
        const lit = await buscarLiturgia(d);
        return { data: d, liturgia: lit };
      } catch (e) {
        return {
          data: d,
          liturgia: null,
          erro: (e as Error).message ?? "erro",
        };
      }
    }),
  );
}

/** Recebe ISO de qualquer dia da semana e devolve [seg..dom]. */
export function construirSemana(refIso: string): string[] {
  const [a, m, d] = refIso.split("-").map((x) => parseInt(x, 10));
  const ref = new Date(a, m - 1, d);
  // 0 = domingo, 1 = segunda... vamos pegar segunda como início
  const diaDaSemana = ref.getDay();
  const offsetParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;
  const seg = new Date(ref);
  seg.setDate(ref.getDate() + offsetParaSegunda);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(seg);
    dt.setDate(seg.getDate() + i);
    out.push(
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Normalização                                                       */
/* ------------------------------------------------------------------ */

function pickString(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNested(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    if (o[k] != null) return o[k];
  }
  return undefined;
}

function limparHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(b|i|u|strong|em)>/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function corDoCorpo(raw: unknown): {
  slug: CorLiturgicaSlug;
  rotulo: string;
} {
  const rotulo =
    pickString(raw, ["color", "cor", "corLiturgica", "liturgicalColor"]) ??
    "Verde";
  const lower = rotulo.toLowerCase();
  if (lower.includes("verm")) return { slug: "vermelha", rotulo: "Vermelho" };
  if (lower.includes("rox") || lower.includes("violeta"))
    return { slug: "roxa", rotulo: "Roxo" };
  if (lower.includes("rosa") || lower.includes("rose"))
    return { slug: "rosa", rotulo: "Rosa" };
  if (lower.includes("dour") || lower.includes("ouro") || lower.includes("gold"))
    return { slug: "dourada", rotulo: "Dourado" };
  if (lower.includes("bran") || lower.includes("white"))
    return { slug: "branca", rotulo: "Branco" };
  return { slug: "verde", rotulo: "Verde" };
}

/**
 * O título da API vem no formato:
 *   "Primeira leitura: Atos dos Apóstolos 8,5-8.14-17"
 *   "Segunda leitura: São Pedro 3,15-18"
 *   "Salmo 65 (66)"
 *   "Proclamação do Evangelho de Jesus Cristo segundo São João:"
 *
 * Para o `head_title` do evangelho temos:
 *   "Evangelho de Jesus Cristo segundo São João 14, 15-21"
 */
function separarTituloECitacao(
  titulo: string,
  fallbackHead?: string,
): { titulo: string; citacao?: string } {
  const t = titulo.trim();
  // Caso "Primeira leitura: <livro> X,Y-Z"
  const m = t.match(/^([^:]+):\s*(.+)$/);
  if (m) {
    return { titulo: m[1].trim(), citacao: m[2].trim() };
  }
  // Salmo ex.: "Salmo 65 (66)"
  const salmoM = t.match(/^(Salmo)\s+(.+)$/i);
  if (salmoM) {
    return { titulo: "Salmo Responsorial", citacao: t };
  }
  // Evangelho — tentar usar head_title que tem a citação ao final
  if (fallbackHead) {
    const evM = fallbackHead.match(/segundo\s+([^,0-9]+?)\s+(\d.*)$/i);
    if (evM) {
      return {
        titulo: "Evangelho",
        citacao: `${evM[1].trim()} ${evM[2].trim()}`,
      };
    }
  }
  return { titulo: t };
}

function normLeituraReal(
  raw: unknown,
  fallbackTitulo: string,
): LeituraNormalizada | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const tituloRaw =
    pickString(o, ["title", "titulo"]) ?? fallbackTitulo;
  const head = pickString(o, ["head", "head_title"]);
  const headTitle = pickString(o, ["head_title"]);
  const { titulo, citacao } = separarTituloECitacao(tituloRaw, headTitle);
  const texto = pickString(o, ["text", "texto"]) ?? "";
  if (!texto) return undefined;
  return {
    titulo,
    referencia: citacao,
    texto: limparHtml(texto),
    chamada: head ? limparHtml(head) : undefined,
    rodape: pickString(o, ["footer"]),
    rodapeResposta: pickString(o, ["footer_response"]),
  };
}

function normEvangelho(raw: unknown): LeituraNormalizada | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const headTitle = pickString(o, ["head_title", "title"]);
  const titleField = pickString(o, ["title"]);
  // Em evangelho, "title" costuma ser "Proclamação do Evangelho..." e
  // "head_title" tem a citação completa "...segundo São João 14, 15-21"
  let titulo = "Evangelho";
  let citacao: string | undefined;
  if (headTitle) {
    const m = headTitle.match(/segundo\s+(.+?)\s+(\d[\d,\-\. ]*)\s*$/i);
    if (m) {
      titulo = `Evangelho segundo ${m[1].trim()}`;
      citacao = `${m[1].trim()} ${m[2].trim()}`;
    } else {
      titulo = headTitle;
    }
  } else if (titleField) {
    titulo = titleField;
  }
  const texto = pickString(o, ["text", "texto"]) ?? "";
  if (!texto) return undefined;
  return {
    titulo,
    referencia: citacao,
    texto: limparHtml(texto),
    chamada: pickString(o, ["head"])
      ? limparHtml(pickString(o, ["head"]) ?? "")
      : undefined,
    chamadaResposta: pickString(o, ["head_response"]),
    rodape: pickString(o, ["footer"]),
    rodapeResposta: pickString(o, ["footer_response"]),
  };
}

function normSalmo(raw: unknown): SalmoNormalizado | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const tituloRaw = pickString(o, ["title", "titulo"]) ?? "Salmo Responsorial";
  // tituloRaw exemplo: "Salmo 65 (66)"
  const refrao =
    pickString(o, ["response", "refrao", "salmoRefrao"]) ?? "";
  // content_psalm: array de estrofes. Pode ter strings/HTML.
  const conteudo = (o.content_psalm ?? o.content) as unknown;
  let estrofes: string[] = [];
  if (Array.isArray(conteudo)) {
    estrofes = conteudo
      .map((linha) =>
        typeof linha === "string"
          ? limparHtml(linha)
          : typeof linha === "object" && linha
          ? limparHtml(JSON.stringify(linha))
          : "",
      )
      .filter((x) => x.length);
  } else if (typeof conteudo === "string") {
    estrofes = limparHtml(conteudo)
      .split(/\n{2,}|R[:\.]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    const txt = pickString(o, ["text", "texto"]) ?? "";
    estrofes = limparHtml(txt)
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (!refrao && estrofes.length === 0) return undefined;
  return {
    titulo: "Salmo Responsorial",
    referencia: tituloRaw,
    refrao: limparHtml(refrao.replace(/^R[:.]?\s*/i, "")),
    texto: estrofes.join("\n\n"),
  };
}

export function normalizar(raw: unknown, fallbackData: string): LiturgiaDiaria {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  // Schema real: top-level tem `today`. Alguns endpoints retornam direto.
  const dados = (obj.today ?? obj.data ?? obj) as Record<string, unknown>;

  const { slug, rotulo } = corDoCorpo(dados);

  // entry_title pode trazer HTML "<br/>" e título + ciclo
  const entryTitle = pickString(dados, [
    "entry_title",
    "liturgia",
    "diaLiturgico",
    "celebracao",
    "celebration",
    "titulo",
    "name",
  ]);
  const diaLiturgico = entryTitle ? limparHtml(entryTitle).split("\n")[0] : undefined;

  // Data: API retorna "10/05/2026" → converter para ISO
  const dataApi = pickString(dados, ["date", "dia", "data"]);
  const dataIso = converterDataParaIso(dataApi) ?? fallbackData;

  const readings = (pickNested(dados, ["readings"]) ?? dados) as Record<
    string,
    unknown
  >;

  const primeiraLeitura = normLeituraReal(
    pickNested(readings, ["first_reading", "primeiraLeitura", "leitura1"]),
    "Primeira Leitura",
  );
  const salmo = normSalmo(
    pickNested(readings, ["psalm", "salmo", "psalm_response"]),
  );
  const segundaLeitura = normLeituraReal(
    pickNested(readings, ["second_reading", "segundaLeitura", "leitura2"]),
    "Segunda Leitura",
  );
  const evangelho = normEvangelho(
    pickNested(readings, ["gospel", "evangelho"]),
  );

  return {
    data: dataIso,
    diaLiturgico,
    cor: slug,
    corRotulo: rotulo,
    primeiraLeitura,
    salmo,
    segundaLeitura,
    evangelho,
    fonte: pickString(obj, ["source", "fonte"]),
  };
}

function converterDataParaIso(s: string | undefined): string | undefined {
  if (!s) return undefined;
  // "10/05/2026" → "2026-05-10"
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  // já em ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return undefined;
}
