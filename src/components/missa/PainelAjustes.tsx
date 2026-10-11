import { useEffect, useRef, useState, type ReactNode } from "react";
import { ROTULOS_MUSICA, oracoesEucaristicas, opcoesMisterioFe, type Secao } from "../../missa/gerador";
import { parseAvisos, parseBalancete } from "../../missa/parsers";
import { enviarImagem, urlEmCache, carregarUrls } from "../../missa/imagens";
import { cadastrarImagemEvangelho } from "../../missa/dados";
import type { ContextoMissa, EstadoMissa, MomentoMusica, TelaExtra } from "../../missa/tipos";
import "./PainelAjustes.css";

interface Props {
  ctx: ContextoMissa;
  estado: EstadoMissa;
  secoes: Secao[];
  alterar: (f: (e: EstadoMissa) => EstadoMissa) => void;
  onIrPara: (secaoId: string) => void;
  /** Grupo aberto (controlado pelo editor, que abre o grupo do elemento clicado) */
  aberto: string;
  onAbrir: (grupo: string) => void;
  /** Ferramentas do elemento selecionado no slide */
  elemento?: ReactNode;
}

export type GrupoAjustes = "missa" | "palavra" | "eucaristia" | "musicas" | "avisos" | "balancete" | "telas";

const MOMENTOS_MUSICA = new Set<string>(["abertura", "ato-penitencial", "gloria", "aclamacao", "ofertorio", "santo", "cordeiro", "comunhao"]);

/** Grupo do painel que corresponde a cada seção do slide */
export function grupoDaSecao(secao: string): GrupoAjustes {
  if (MOMENTOS_MUSICA.has(secao)) return "musicas";
  if (["capa", "leitura1", "salmo", "leitura2", "evangelho", "evangelho-imagens"].includes(secao)) return "palavra";
  if (secao === "creio") return "missa";
  if (["preces", "liturgia-eucaristica", "oe-titulo", "doxologia"].includes(secao) || secao.startsWith("oe-aclamacao")) return "eucaristia";
  if (secao === "avisos") return "avisos";
  if (secao === "balancete") return "balancete";
  return "telas";
}

function Grupo({
  id,
  titulo,
  resumo,
  aberto,
  onAlternar,
  children,
}: {
  id: string;
  titulo: string;
  resumo?: string;
  aberto: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  return (
    <section className={"ajustes-grupo" + (aberto ? " ajustes-grupo--aberto" : "")} data-grupo={id}>
      <button type="button" className="ajustes-grupo__cab" aria-expanded={aberto} onClick={onAlternar}>
        <span className="ajustes-grupo__seta" aria-hidden>
          ▸
        </span>
        <span className="ajustes-grupo__titulo">{titulo}</span>
        {resumo && <span className="ajustes-grupo__resumo">{resumo}</span>}
      </button>
      {aberto && <div className="ajustes-grupo__corpo">{children}</div>}
    </section>
  );
}

function Campo({ rotulo, dica, children }: { rotulo: string; dica?: string; children: ReactNode }) {
  return (
    <label className="ajustes-campo">
      <span className="ajustes-campo__rotulo">{rotulo}</span>
      {children}
      {dica && <span className="ajustes-campo__dica">{dica}</span>}
    </label>
  );
}

function Interruptor({ ligado, onChange, rotulo }: { ligado: boolean; onChange: (v: boolean) => void; rotulo: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      className={"interruptor" + (ligado ? " interruptor--ligado" : "")}
      onClick={() => onChange(!ligado)}
    >
      <span className="interruptor__trilho" aria-hidden>
        <span className="interruptor__bola" />
      </span>
      {rotulo}
    </button>
  );
}

const MOMENTOS: MomentoMusica[] = [
  "abertura",
  "ato-penitencial",
  "gloria",
  "aclamacao",
  "ofertorio",
  "santo",
  "cordeiro",
  "comunhao",
];

const EXEMPLO_AVISOS = `Mês das Crianças – estamos arrecadando brinquedos para distribuir no dia das crianças.

Missa no Setor São Judas – dia 08/10, quinta-feira às 20 horas.`;

const EXEMPLO_BALANCETE = `PRESTAÇÃO DE CONTAS (SETEMBRO)
Dízimo – R$ 53.641,43
Ofertório – R$ 3.865,10
Lojinha – R$ 1.537,40
Doações – R$ 3.110,00
Total de dizimistas 607 (409 dizimaram)`;

export function PainelAjustes({ ctx, estado, secoes, alterar, onIrPara, aberto, onAbrir, elemento }: Props) {
  const alternar = (id: string) => onAbrir(aberto === id ? "" : id);
  const raiz = useRef<HTMLDivElement>(null);

  // Ao abrir um grupo por um clique no slide, mostra-o no painel
  useEffect(() => {
    if (!aberto) return;
    raiz.current?.querySelector(`[data-grupo="${aberto}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [aberto]);
  const set = <K extends keyof EstadoMissa>(k: K, v: EstadoMissa[K]) => alterar((e) => ({ ...e, [k]: v }));
  const setLit = (k: keyof EstadoMissa["liturgia"], v: string) =>
    alterar((e) => ({ ...e, liturgia: { ...e.liturgia, [k]: v } }));

  const oes = oracoesEucaristicas(ctx.textos);
  const misterios = opcoesMisterioFe(ctx.textos);
  const avisos = parseAvisos(estado.avisosTexto);
  const balancete = parseBalancete(estado.balanceteTexto, ctx.data);

  const momentosAtivos = MOMENTOS.filter((m) => m !== "gloria" || estado.gloria);
  const preenchidas = momentosAtivos.filter((m) => estado.musicas[m]?.letra?.trim()).length;

  return (
    <div className="painel-ajustes" ref={raiz}>
      {elemento && (
        <section className="painel-ajustes__elemento" aria-label="Elemento selecionado">
          {elemento}
        </section>
      )}
      <Grupo
        id="missa"
        titulo="Missa"
        resumo={`${estado.comMusica ? "Com música" : "Sem música"} · Creio ${estado.creio}`}
        aberto={aberto === "missa"}
        onAlternar={() => alternar("missa")}
      >
        <Interruptor ligado={estado.comMusica} onChange={(v) => set("comMusica", v)} rotulo="Missa com música" />
        <Interruptor ligado={estado.gloria} onChange={(v) => set("gloria", v)} rotulo="Hino de louvor (Glória)" />
        <Campo rotulo="Profissão de fé">
          <div className="ajustes-segmentos">
            {(["curto", "longo", "nenhum"] as const).map((c) => (
              <button
                key={c}
                type="button"
                className={estado.creio === c ? "ativo" : ""}
                onClick={() => set("creio", c)}
              >
                {c === "curto" ? "Creio curto" : c === "longo" ? "Creio longo" : "Sem Creio"}
              </button>
            ))}
          </div>
        </Campo>
      </Grupo>

      <Grupo id="palavra" titulo="Liturgia da Palavra" aberto={aberto === "palavra"} onAlternar={() => alternar("palavra")}>
        <Campo rotulo="Título do dia (capa)">
          <input
            value={estado.liturgia.diaLiturgico ?? ctx.diaLiturgico}
            onChange={(ev) => setLit("diaLiturgico", ev.target.value)}
          />
        </Campo>
        <div className="ajustes-dupla">
          <Campo rotulo="1ª Leitura">
            <input value={estado.liturgia.leitura1 ?? ctx.leitura1 ?? ""} onChange={(ev) => setLit("leitura1", ev.target.value)} />
          </Campo>
          <Campo rotulo="Salmo">
            <input value={estado.liturgia.salmo ?? ctx.salmo ?? ""} onChange={(ev) => setLit("salmo", ev.target.value)} />
          </Campo>
          <Campo rotulo="2ª Leitura">
            <input value={estado.liturgia.leitura2 ?? ctx.leitura2 ?? ""} onChange={(ev) => setLit("leitura2", ev.target.value)} />
          </Campo>
          <Campo rotulo="Evangelho">
            <input value={estado.liturgia.evangelho ?? ctx.evangelho ?? ""} onChange={(ev) => setLit("evangelho", ev.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="Refrão do salmo">
          <textarea
            rows={2}
            value={estado.liturgia.salmoRefrao ?? ctx.salmoRefrao ?? ""}
            onChange={(ev) => setLit("salmoRefrao", ev.target.value)}
          />
        </Campo>
        {estado.comMusica && (
          <Campo rotulo="Versículo da aclamação" dica="Entra depois de “Aleluia…”, se não houver letra própria para a aclamação.">
            <textarea rows={2} value={estado.aclamacaoVerso} onChange={(ev) => set("aclamacaoVerso", ev.target.value)} />
          </Campo>
        )}
        <ImagensEvangelho ctx={ctx} estado={estado} alterar={alterar} />
      </Grupo>

      <Grupo
        id="eucaristia" titulo="Liturgia Eucarística"
        resumo={estado.oracaoEucaristica ? `OE ${estado.oracaoEucaristica}` : undefined}
        aberto={aberto === "eucaristia"}
        onAlternar={() => alternar("eucaristia")}
      >
        <Campo rotulo="Oração Eucarística" dica="Conforme o folheto do dia.">
          <div className="ajustes-segmentos">
            {oes.map((o) => (
              <button
                key={o}
                type="button"
                className={estado.oracaoEucaristica === o ? "ativo" : ""}
                onClick={() => set("oracaoEucaristica", o)}
              >
                OE {o}
              </button>
            ))}
          </div>
        </Campo>
        <Campo rotulo="Mistério da fé">
          <div className="ajustes-opcoes">
            {misterios.map((m, i) => (
              <button
                key={i}
                type="button"
                className={"ajustes-opcao" + (estado.misterioFe === i ? " ajustes-opcao--ativa" : "")}
                onClick={() => set("misterioFe", i)}
              >
                {m}
              </button>
            ))}
          </div>
        </Campo>
        <Campo rotulo="Resposta das preces">
          <input value={estado.respostaPreces} onChange={(ev) => set("respostaPreces", ev.target.value)} />
        </Campo>
      </Grupo>

      {estado.comMusica && (
        <Grupo
          id="musicas" titulo="Músicas"
          resumo={`${preenchidas}/${momentosAtivos.length}`}
          aberto={aberto === "musicas"}
          onAlternar={() => alternar("musicas")}
        >
          <p className="ajustes-nota">Cole a letra de cada canto. Uma linha em branco começa um novo slide.</p>
          {momentosAtivos.map((m) => (
            <Campo key={m} rotulo={ROTULOS_MUSICA[m].rotulo}>
              <textarea
                rows={4}
                placeholder="Cole a letra aqui…"
                value={estado.musicas[m]?.letra ?? ""}
                onChange={(ev) =>
                  alterar((e) => ({ ...e, musicas: { ...e.musicas, [m]: { ...e.musicas[m], letra: ev.target.value } } }))
                }
                onFocus={() => onIrPara(m)}
              />
            </Campo>
          ))}
        </Grupo>
      )}

      <Grupo
        id="avisos" titulo="Avisos"
        resumo={avisos.length ? `${avisos.length} aviso${avisos.length > 1 ? "s" : ""}` : undefined}
        aberto={aberto === "avisos"}
        onAlternar={() => alternar("avisos")}
      >
        <Campo rotulo="Avisos da semana" dica="Um aviso por parágrafo, no formato “Título – texto”. Cada aviso vira um slide.">
          <textarea
            rows={8}
            placeholder={EXEMPLO_AVISOS}
            value={estado.avisosTexto}
            onChange={(ev) => set("avisosTexto", ev.target.value)}
            onFocus={() => onIrPara("avisos")}
          />
        </Campo>
      </Grupo>

      <Grupo
        id="balancete" titulo="Prestação de contas"
        resumo={balancete ? "Incluída" : undefined}
        aberto={aberto === "balancete"}
        onAlternar={() => alternar("balancete")}
      >
        <Campo rotulo="Texto da prestação de contas" dica="Uma vez por mês. Deixe vazio para não exibir.">
          <textarea
            rows={7}
            placeholder={EXEMPLO_BALANCETE}
            value={estado.balanceteTexto}
            onChange={(ev) => set("balanceteTexto", ev.target.value)}
            onFocus={() => onIrPara("balancete")}
          />
        </Campo>
      </Grupo>

      <Grupo id="telas" titulo="Telas e ordem" aberto={aberto === "telas"} onAlternar={() => alternar("telas")}>
        <ListaTelas estado={estado} secoes={secoes} alterar={alterar} ctx={ctx} onIrPara={onIrPara} />
      </Grupo>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ImagensEvangelho({
  ctx,
  estado,
  alterar,
}: {
  ctx: ContextoMissa;
  estado: EstadoMissa;
  alterar: Props["alterar"];
}) {
  const imagens = estado.imagensEvangelho ?? ctx.imagensEvangelhoPadrao;
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [, forcar] = useState(0);
  const ref = estado.liturgia.evangelho ?? ctx.evangelho ?? "";

  if (imagens.some((c) => !urlEmCache(c))) {
    carregarUrls(imagens).then(() => forcar((n) => n + 1)).catch(() => undefined);
  }

  const enviar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setEnviando(true);
    setErro(null);
    try {
      const novos: string[] = [];
      for (const [i, arq] of [...arquivos].entries()) {
        const caminho = await enviarImagem(ctx.paroquiaId, "evangelho", arq);
        // Fica cadastrada para este Evangelho e volta automaticamente daqui a 3 anos
        if (ref) await cadastrarImagemEvangelho(ctx.paroquiaId, ref, caminho, imagens.length + i);
        novos.push(caminho);
      }
      alterar((e) => ({ ...e, imagensEvangelho: [...imagens, ...novos] }));
    } catch (e) {
      setErro((e as Error).message ?? "Falha ao enviar a imagem.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="ajustes-campo">
      <span className="ajustes-campo__rotulo">Imagens do Evangelho</span>
      <div className="ajustes-imagens">
        {imagens.map((c) => (
          <figure key={c} className="ajustes-imagem">
            {urlEmCache(c) ? <img src={urlEmCache(c)} alt="" /> : <span />}
            <button
              type="button"
              aria-label="Remover imagem desta missa"
              title="Remover desta missa"
              onClick={() => alterar((e) => ({ ...e, imagensEvangelho: imagens.filter((x) => x !== c) }))}
            >
              ×
            </button>
          </figure>
        ))}
        <button
          type="button"
          className="ajustes-imagem ajustes-imagem--add"
          onClick={() => input.current?.click()}
          disabled={enviando}
        >
          {enviando ? "Enviando…" : "+ Imagem"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(ev) => enviar(ev.target.files)}
      />
      <span className="ajustes-campo__dica">
        {imagens.length === 0
          ? "Nenhuma imagem cadastrada para este Evangelho."
          : "Novas imagens ficam guardadas para este Evangelho e voltam sozinhas nos próximos anos."}
      </span>
      {erro && <span className="ajustes-erro">⚠ {erro}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ListaTelas({
  estado,
  secoes,
  alterar,
  ctx,
  onIrPara,
}: {
  estado: EstadoMissa;
  secoes: Secao[];
  alterar: Props["alterar"];
  ctx: ContextoMissa;
  onIrPara: (id: string) => void;
}) {
  const [menuApos, setMenuApos] = useState<string | null>(null);
  const inputImagem = useRef<HTMLInputElement>(null);
  const aposImagem = useRef<string>("");

  const mover = (id: string, delta: number) =>
    alterar((e) => {
      const ordem = secoes.map((s) => s.id);
      const i = ordem.indexOf(id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= ordem.length) return e;
      [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
      return { ...e, ordemSecoes: ordem };
    });

  const alternar = (id: string) =>
    alterar((e) => ({
      ...e,
      secoesDesligadas: e.secoesDesligadas.includes(id)
        ? e.secoesDesligadas.filter((x) => x !== id)
        : [...e.secoesDesligadas, id],
    }));

  const adicionar = (depoisDe: string, tipo: TelaExtra["tipo"], imagem?: string) => {
    const id = `extra-${Date.now().toString(36)}`;
    alterar((e) => ({
      ...e,
      extras: [
        ...e.extras,
        { id, depoisDe, tipo, imagem, titulo: tipo === "texto" ? "TÍTULO" : undefined, texto: tipo === "texto" ? "Digite o texto aqui" : undefined },
      ],
    }));
    setMenuApos(null);
    setTimeout(() => onIrPara(id), 50);
  };

  const enviarImagemExtra = async (arquivos: FileList | null) => {
    const arq = arquivos?.[0];
    if (!arq) return;
    const caminho = await enviarImagem(ctx.paroquiaId, "extras", arq);
    adicionar(aposImagem.current, "imagem", caminho);
    if (inputImagem.current) inputImagem.current.value = "";
  };

  return (
    <div className="lista-telas">
      {estado.ocultos.length > 0 && (
        <button type="button" className="ghost lista-telas__restaurar" onClick={() => alterar((e) => ({ ...e, ocultos: [] }))}>
          Mostrar {estado.ocultos.length} slide{estado.ocultos.length > 1 ? "s" : ""} oculto{estado.ocultos.length > 1 ? "s" : ""}
        </button>
      )}
      <ol>
        {secoes.map((s, i) => {
          const ligada = !estado.secoesDesligadas.includes(s.id);
          const extra = estado.extras.find((x) => x.id === s.id);
          return (
            <li key={s.id} className={"lista-telas__item" + (ligada ? "" : " lista-telas__item--off")}>
              <div className="lista-telas__linha">
                <input
                  type="checkbox"
                  checked={ligada}
                  onChange={() => alternar(s.id)}
                  aria-label={`Incluir ${s.rotulo}`}
                />
                <button type="button" className="lista-telas__nome" onClick={() => onIrPara(s.id)}>
                  {s.rotulo}
                  <small>{s.slides.length > 1 ? `${s.slides.length} slides` : ""}</small>
                </button>
                <div className="lista-telas__acoes">
                  <button type="button" aria-label="Subir" title="Subir" disabled={i === 0} onClick={() => mover(s.id, -1)}>
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Descer"
                    title="Descer"
                    disabled={i === secoes.length - 1}
                    onClick={() => mover(s.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="Adicionar tela depois"
                    title="Adicionar tela depois"
                    onClick={() => setMenuApos(menuApos === s.id ? null : s.id)}
                  >
                    +
                  </button>
                  {extra && (
                    <button
                      type="button"
                      aria-label="Excluir tela"
                      title="Excluir tela"
                      onClick={() => alterar((e) => ({ ...e, extras: e.extras.filter((x) => x.id !== s.id) }))}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
              {menuApos === s.id && (
                <div className="lista-telas__menu">
                  <button type="button" onClick={() => adicionar(s.id, "texto")}>Texto com título</button>
                  <button
                    type="button"
                    onClick={() => {
                      aposImagem.current = s.id;
                      inputImagem.current?.click();
                    }}
                  >
                    Imagem
                  </button>
                  <button type="button" onClick={() => adicionar(s.id, "branco")}>Tela em branco</button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <input
        ref={inputImagem}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(ev) => enviarImagemExtra(ev.target.files)}
      />
      {estado.ordemSecoes.length > 0 && (
        <button type="button" className="ghost" onClick={() => alterar((e) => ({ ...e, ordemSecoes: [] }))}>
          Restaurar a ordem do modelo
        </button>
      )}
    </div>
  );
}
