/** Nomes dos livros bíblicos, como aparecem nos slides ("Isaías 25,6-10a") */
const LIVROS: Record<string, string> = {
  gn: "Gênesis", ex: "Êxodo", lv: "Levítico", nm: "Números", dt: "Deuteronômio",
  js: "Josué", jz: "Juízes", rt: "Rute", "1sm": "1º Samuel", "2sm": "2º Samuel",
  "1rs": "1º Reis", "2rs": "2º Reis", "1cr": "1º Crônicas", "2cr": "2º Crônicas",
  esd: "Esdras", ne: "Neemias", tb: "Tobias", jt: "Judite", est: "Ester",
  "1mc": "1º Macabeus", "2mc": "2º Macabeus", "jó": "Jó", sl: "Salmo",
  pr: "Provérbios", ecl: "Eclesiastes", ct: "Cântico dos Cânticos", sb: "Sabedoria",
  eclo: "Eclesiástico", is: "Isaías", jr: "Jeremias", lm: "Lamentações", br: "Baruc",
  ez: "Ezequiel", dn: "Daniel", os: "Oseias", jl: "Joel", am: "Amós", ab: "Abdias",
  jn: "Jonas", mq: "Miqueias", na: "Naum", hab: "Habacuc", sf: "Sofonias", ag: "Ageu",
  zc: "Zacarias", ml: "Malaquias",
  mt: "Mateus", mc: "Marcos", lc: "Lucas", jo: "João", at: "Atos dos Apóstolos",
  rm: "Romanos", "1cor": "1º Coríntios", "2cor": "2º Coríntios", gl: "Gálatas",
  ef: "Efésios", fl: "Filipenses", cl: "Colossenses", "1ts": "1º Tessalonicenses",
  "2ts": "2º Tessalonicenses", "1tm": "1º Timóteo", "2tm": "2º Timóteo", tt: "Tito",
  fm: "Filêmon", hb: "Hebreus", tg: "Tiago", "1pd": "1º Pedro", "2pd": "2º Pedro",
  "1jo": "1º João", "2jo": "2º João", "3jo": "3º João", jd: "Judas", ap: "Apocalipse",
};

/** "Is 25, 6-10" → "Isaías 25,6-10" (mantém o texto se não reconhecer o livro) */
export function referenciaPorExtenso(ref: string | undefined): string {
  if (!ref) return "";
  const limpa = ref.trim().replace(/,\s+/g, ",");
  const m = limpa.match(/^(\d?\s?[A-Za-zÀ-ú]+)\.?\s*(.*)$/);
  if (!m) return limpa;
  const chave = m[1].replace(/\s+/g, "").toLowerCase();
  const nome = LIVROS[chave];
  return nome ? `${nome} ${m[2]}`.trim() : limpa;
}

/** "Sl 22(23)" → "22(23)" */
export function numeroDoSalmo(ref: string | undefined): string {
  return (ref ?? "").replace(/^\s*Sl\.?\s*/i, "").trim();
}

/** Chave de busca das imagens do Evangelho: "Mt 22, 1-14" → "mt22,1-14" */
export function normalizarReferencia(ref: string | undefined): string {
  return (ref ?? "").replace(/\s+/g, "").toLowerCase();
}
