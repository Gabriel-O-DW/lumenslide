import type {
  CorLiturgicaSlug,
  LeituraNormalizada,
  LiturgiaDiaria,
  SalmoNormalizado,
} from "../types/liturgia";

/**
 * Em dev, usamos o proxy do Vite (/api-liturgia → API_BASE) para evitar CORS.
 * Em produção, fazemos chamada direta. Pode ser ajustado por env.
 */
const API_BASE = "https://api-liturgia-diaria.vercel.app";
const DEV_PREFIX = "/api-liturgia";

function endpoint(path: string): string {
  const proxy = (import.meta.env.VITE_LITURGIA_PROXY as string | undefined) ?? "";
  if (proxy) return `${proxy}${API_BASE}${path}`;
  if (import.meta.env.DEV) return `${DEV_PREFIX}${path}`;
  return `${API_BASE}${path}`;
}

export async function buscarLiturgia(dataIso: string): Promise<LiturgiaDiaria> {
  const res = await fetch(endpoint(`/?date=${encodeURIComponent(dataIso)}`));
  if (!res.ok) {
    throw new Error(`Falha na API de liturgia (${res.status})`);
  }
  const raw = await res.json();
  return normalizar(raw, dataIso);
}

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

function corDoCorpo(raw: unknown): {
  slug: CorLiturgicaSlug;
  rotulo: string;
} {
  const rotulo =
    pickString(raw, ["cor", "corLiturgica", "color", "liturgicalColor"]) ??
    "Verde";
  const lower = rotulo.toLowerCase();
  if (lower.includes("verm")) return { slug: "vermelha", rotulo: "Vermelho" };
  if (lower.includes("roxo") || lower.includes("violeta") || lower.includes("roxa"))
    return { slug: "roxa", rotulo: "Roxo" };
  if (lower.includes("rosa") || lower.includes("rose"))
    return { slug: "rosa", rotulo: "Rosa" };
  if (lower.includes("dour") || lower.includes("ouro") || lower.includes("gold"))
    return { slug: "dourada", rotulo: "Dourado" };
  if (lower.includes("bran") || lower.includes("white"))
    return { slug: "branca", rotulo: "Branco" };
  return { slug: "verde", rotulo: "Verde" };
}

function normLeitura(raw: unknown): LeituraNormalizada | undefined {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return undefined;
    return { titulo: "Leitura", texto: t };
  }
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const titulo =
    pickString(o, [
      "titulo",
      "title",
      "primeiraLeituraTitulo",
      "segundaLeituraTitulo",
      "evangelhoTitulo",
    ]) ?? "Leitura";
  const referencia = pickString(o, ["referencia", "reference", "citacao"]);
  const texto =
    pickString(o, [
      "texto",
      "text",
      "leitura",
      "textoPrimeiraLeitura",
      "textoSegundaLeitura",
      "textoEvangelho",
    ]) ?? "";
  if (!texto) return undefined;
  return { titulo, referencia, texto };
}

function normSalmo(raw: unknown): SalmoNormalizado | undefined {
  if (!raw) return undefined;
  if (typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const titulo = pickString(o, ["titulo", "salmoTitulo", "title"]) ?? "Salmo";
  const referencia = pickString(o, ["referencia", "reference", "citacao"]);
  const refrao =
    pickString(o, ["refrao", "salmoRefrao", "refrain"]) ?? "";
  const texto =
    pickString(o, ["texto", "text", "salmoTexto", "estrofes", "verses"]) ?? "";
  if (!refrao && !texto) return undefined;
  return { titulo, referencia, refrao, texto };
}

export function normalizar(raw: unknown, fallbackData: string): LiturgiaDiaria {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const dados = (obj.data ?? obj) as Record<string, unknown>;

  const { slug, rotulo } = corDoCorpo(dados);

  const data = pickString(dados, ["dia", "data", "date"]) ?? fallbackData;
  const diaLiturgico = pickString(dados, [
    "liturgia",
    "diaLiturgico",
    "celebracao",
    "celebration",
    "titulo",
    "name",
  ]);

  const primeiraLeitura = normLeitura(
    pickNested(dados, ["primeiraLeitura", "leitura1", "first_reading"]),
  );
  const salmo = normSalmo(
    pickNested(dados, ["salmo", "psalm", "psalm_response"]),
  );
  const segundaLeitura = normLeitura(
    pickNested(dados, ["segundaLeitura", "leitura2", "second_reading"]),
  );
  const evangelho = normLeitura(
    pickNested(dados, ["evangelho", "gospel"]),
  );

  return {
    data,
    diaLiturgico,
    cor: slug,
    corRotulo: rotulo,
    primeiraLeitura,
    salmo,
    segundaLeitura,
    evangelho,
    fonte: pickString(dados, ["fonte", "source"]),
  };
}
