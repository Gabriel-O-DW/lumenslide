import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import { Calendario } from "../components/Calendario";
import { CanvasLivre, type ElementoCanvas } from "../components/CanvasLivre";
import { SlideEditavel } from "../components/SlideEditavel";
import { paginarMusicaEmSlides } from "../utils/paginarMusica";
import type { ViewKey } from "../types/nav";
import type { Musica, MomentoMissa } from "../types/musica";
import type { BlocoSlide } from "../data/blocosLiturgicos";
import type { RiteKey } from "../components/RiteTabs";
import "./NovoSlideView.css";

interface Props {
  onNavigate: (v: ViewKey) => void;
}

interface Etapa {
  id: string;
  numero: number;
  titulo: string;
  subtitulo?: string;
}

const ETAPAS: Etapa[] = [
  { id: "data", numero: 0, titulo: "Selecione a data", subtitulo: "Buscar liturgia automaticamente" },
  { id: "iniciais", numero: 1, titulo: "Ritos Iniciais", subtitulo: "Saudação, Ato Penitencial e canto de entrada" },
  { id: "palavra", numero: 2, titulo: "Liturgia da Palavra", subtitulo: "Leituras do dia e Salmo" },
  { id: "eucaristica", numero: 3, titulo: "Liturgia Eucarística", subtitulo: "Ofertório, Santo e Comunhão" },
  { id: "finais", numero: 4, titulo: "Ritos Finais", subtitulo: "Bênção e canto final" },
  { id: "avisos", numero: 5, titulo: "Avisos", subtitulo: "Comunicados semanais da paróquia" },
  { id: "canvas", numero: 6, titulo: "Revisão livre", subtitulo: "Edite cada slide com canvas livre" },
];

const STORAGE_CELEBRACOES = "lumenslide.celebracoes.v1";

interface CelebracaoPersistida {
  id: string;
  criadaEm: string;
  data: string;
  titulo: string;
  cor: string;
  paroquia?: string;
  slides: BlocoSlide[];
  livreElementos: Record<string, ElementoCanvas[]>;
  totalSlides: number;
}

export function NovoSlideView({ onNavigate }: Props) {
  const { dataSelecionada, setDataSelecionada, liturgia, musicas, temaAtivo, paroquia } =
    useAppState();
  const [etapa, setEtapa] = useState(0);

  const [cantoEntrada, setCantoEntrada] = useState<string | null>(null);
  const [cantoOfertorio, setCantoOfertorio] = useState<string | null>(null);
  const [cantoComunhao, setCantoComunhao] = useState<string | null>(null);
  const [cantoFinal, setCantoFinal] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<string[]>([""]);

  /** Mapa de elementos livres por slideId. */
  const [livreElementos, setLivreElementos] = useState<
    Record<string, ElementoCanvas[]>
  >({});

  const slidesGerados = useMemo(
    () =>
      gerarSlidesDaCelebracao({
        liturgia,
        musicas,
        cantoEntradaId: cantoEntrada,
        cantoOfertorioId: cantoOfertorio,
        cantoComunhaoId: cantoComunhao,
        cantoFinalId: cantoFinal,
        avisos,
      }),
    [liturgia, musicas, cantoEntrada, cantoOfertorio, cantoComunhao, cantoFinal, avisos],
  );

  /**
   * Slide ativo (em foco no painel da direita).
   * Default: primeiro slide do passo atual.
   */
  const [slideAtivoId, setSlideAtivoId] = useState<string | null>(null);

  // Sincroniza o slide ativo conforme a etapa muda
  useEffect(() => {
    const id = primeiroSlideDaEtapa(etapa, slidesGerados);
    if (id) setSlideAtivoId(id);
  }, [etapa, slidesGerados]);

  const slideAtivo =
    slidesGerados.find((s) => s.id === slideAtivoId) ?? slidesGerados[0] ?? null;
  const livreDoAtivo = slideAtivo ? livreElementos[slideAtivo.id] ?? [] : [];

  const setLivreDoAtivo = (els: ElementoCanvas[]) => {
    if (!slideAtivo) return;
    setLivreElementos((prev) => ({ ...prev, [slideAtivo.id]: els }));
  };

  const total = ETAPAS.length;
  const proximo = () => setEtapa((e) => Math.min(total - 1, e + 1));
  const anterior = () => setEtapa((e) => Math.max(0, e - 1));

  const adicionarAviso = () => setAvisos((a) => [...a, ""]);
  const atualizarAviso = (i: number, v: string) =>
    setAvisos((a) => a.map((x, idx) => (idx === i ? v : x)));
  const removerAviso = (i: number) =>
    setAvisos((a) => a.filter((_, idx) => idx !== i));

  const [feedbackSalvar, setFeedbackSalvar] = useState<string | null>(null);

  const salvarEExportar = () => {
    const id = `cel-${Date.now().toString(36)}`;
    const celebr: CelebracaoPersistida = {
      id,
      criadaEm: new Date().toISOString(),
      data: dataSelecionada,
      titulo: liturgia?.diaLiturgico ?? "Santa Missa",
      cor: liturgia?.cor ?? "verde",
      paroquia,
      slides: slidesGerados,
      livreElementos,
      totalSlides: slidesGerados.length,
    };
    try {
      const raw = localStorage.getItem(STORAGE_CELEBRACOES);
      const lista: CelebracaoPersistida[] = raw ? JSON.parse(raw) : [];
      lista.unshift(celebr);
      localStorage.setItem(
        STORAGE_CELEBRACOES,
        JSON.stringify(lista.slice(0, 50)),
      );
      setFeedbackSalvar(
        `✓ Celebração salva em "Minhas Missas". Indo para Exportar…`,
      );
      setTimeout(() => onNavigate("exportar"), 900);
    } catch {
      setFeedbackSalvar("⚠ Não foi possível salvar localmente. Tente exportar mesmo assim.");
    }
  };

  // Slides relevantes para o passo atual (usado no card "slides deste passo")
  const slidesDoPasso = slidesGerados.filter((s) =>
    pertenceEtapa(s, etapa),
  );

  return (
    <div className="novo-slide">
      {/* Stepper */}
      <ol className="novo-slide__stepper">
        {ETAPAS.map((et, i) => {
          const ativo = i === etapa;
          const concluido = i < etapa;
          return (
            <li
              key={et.id}
              className={
                "novo-slide__step" +
                (ativo ? " is-ativo" : "") +
                (concluido ? " is-feito" : "")
              }
            >
              <button
                type="button"
                onClick={() => setEtapa(i)}
                className="novo-slide__step-btn"
                aria-current={ativo ? "step" : undefined}
              >
                <span className="novo-slide__step-num">
                  {concluido ? "✓" : et.numero}
                </span>
                <span className="novo-slide__step-text">
                  <strong>{et.titulo}</strong>
                  {et.subtitulo && <small>{et.subtitulo}</small>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="novo-slide__corpo">
        {/* COLUNA ESQUERDA — formulário do passo */}
        <section className="card novo-slide__main">
          <div className="card-header">
            <div>
              <h2 className="card-title">
                {ETAPAS[etapa].numero}. {ETAPAS[etapa].titulo}
              </h2>
              {ETAPAS[etapa].subtitulo && (
                <p className="card-subtitle">{ETAPAS[etapa].subtitulo}</p>
              )}
            </div>
            <span className="chip">
              {etapa + 1} de {total}
            </span>
          </div>
          <div className="card-body">
            {etapa === 0 && (
              <PassoData
                valor={dataSelecionada}
                onChange={setDataSelecionada}
                liturgia={liturgia}
              />
            )}
            {etapa === 1 && (
              <PassoCanto
                rotulo="Canto de Entrada"
                descricao="O canto de entrada acompanha a procissão do celebrante. As estrofes são paginadas automaticamente."
                momento="entrada"
                musicas={musicas}
                valor={cantoEntrada}
                onChange={setCantoEntrada}
              />
            )}
            {etapa === 2 && <PassoPalavra liturgia={liturgia} />}
            {etapa === 3 && (
              <div className="novo-slide__cols">
                <PassoCanto
                  rotulo="Canto do Ofertório"
                  momento="ofertorio"
                  musicas={musicas}
                  valor={cantoOfertorio}
                  onChange={setCantoOfertorio}
                />
                <PassoCanto
                  rotulo="Canto de Comunhão"
                  momento="comunhao"
                  musicas={musicas}
                  valor={cantoComunhao}
                  onChange={setCantoComunhao}
                />
              </div>
            )}
            {etapa === 4 && (
              <PassoCanto
                rotulo="Canto Final"
                momento="final"
                musicas={musicas}
                valor={cantoFinal}
                onChange={setCantoFinal}
              />
            )}
            {etapa === 5 && (
              <PassoAvisos
                avisos={avisos}
                onAdicionar={adicionarAviso}
                onAtualizar={atualizarAviso}
                onRemover={removerAviso}
              />
            )}
            {etapa === 6 && (
              <PassoRevisao
                slides={slidesGerados}
                slideAtivoId={slideAtivo?.id ?? null}
                onSelecionar={setSlideAtivoId}
                livreElementos={livreElementos}
              />
            )}

            {/* Lista compacta dos slides deste passo (não no passo 6 / 0) */}
            {etapa !== 0 && etapa !== 6 && slidesDoPasso.length > 0 && (
              <div className="novo-slide__slides-passo">
                <h4 className="section-eyebrow">
                  Slides deste passo ({slidesDoPasso.length})
                </h4>
                <div className="novo-slide__chips">
                  {slidesDoPasso.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      className={
                        "novo-slide__chip-slide" +
                        (s.id === slideAtivo?.id
                          ? " novo-slide__chip-slide--on"
                          : "")
                      }
                      onClick={() => setSlideAtivoId(s.id)}
                    >
                      <span className="num">{i + 1}</span>
                      {s.titulo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* COLUNA DIREITA — preview + canvas livre */}
        <aside className="card novo-slide__preview">
          <div className="card-header">
            <div>
              <h2 className="card-title">Pré-visualização</h2>
              <p className="card-subtitle">
                {slideAtivo
                  ? slideAtivo.titulo
                  : "Selecione uma data para gerar os slides"}
              </p>
            </div>
            <span className="chip chip--gold">
              {slidesGerados.length} slides
            </span>
          </div>
          <div className="card-body novo-slide__preview-body">
            {slideAtivo ? (
              <>
                <div className="novo-slide__editor-wrap">
                  <SlideEditavel
                    bloco={slideAtivo}
                    tema={temaAtivo}
                    cor={liturgia?.cor ?? "verde"}
                    rotuloDia={
                      liturgia?.diaLiturgico ?? slideAtivo.titulo
                    }
                    rotuloCor={liturgia?.corRotulo ?? ""}
                    leituras={leiturasResumoFromLiturgia(liturgia)}
                    livre={livreDoAtivo}
                    onChangeLivre={setLivreDoAtivo}
                    semToolbar
                  />
                </div>
                <CanvasLivreToolbar
                  elementos={livreDoAtivo}
                  onChange={setLivreDoAtivo}
                />
                <p className="novo-slide__hint">
                  Adicione textos e imagens livres por cima do slide. Clique
                  duplo em texto para editar. Arraste pelas alças para mover ou
                  redimensionar.
                </p>
              </>
            ) : (
              <div className="novo-slide__preview-vazio">
                Os slides aparecerão aqui depois de selecionar a data.
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Footer com nav + salvar */}
      <footer className="novo-slide__nav">
        <button type="button" onClick={anterior} disabled={etapa === 0}>
          ← Anterior
        </button>
        <div className="novo-slide__progresso">
          <div
            className="novo-slide__progresso-bar"
            style={{ width: `${((etapa + 1) / total) * 100}%` }}
          />
        </div>
        {etapa < total - 1 ? (
          <button type="button" className="primary" onClick={proximo}>
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            className="primary novo-slide__salvar"
            onClick={salvarEExportar}
            disabled={slidesGerados.length === 0}
          >
            💾 Salvar e Exportar
          </button>
        )}
      </footer>
      {feedbackSalvar && (
        <div className="novo-slide__feedback">{feedbackSalvar}</div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- */
/*  Toolbar standalone do Canvas (separada para reaproveitar)         */
/* ----------------------------------------------------------------- */

function CanvasLivreToolbar({
  elementos,
  onChange,
}: {
  elementos: ElementoCanvas[];
  onChange: (els: ElementoCanvas[]) => void;
}) {
  return (
    <div className="novo-slide__toolbar-wrap">
      <CanvasLivre
        elementos={elementos}
        onChange={onChange}
        overlay={false}
        fundo={null}
      />
    </div>
  );
}

/* ----------------------------------------------------------------- */
/*  Passos                                                            */
/* ----------------------------------------------------------------- */

function PassoData({
  valor,
  onChange,
  liturgia,
}: {
  valor: string;
  onChange: (s: string) => void;
  liturgia: ReturnType<typeof useAppState>["liturgia"];
}) {
  return (
    <div className="passo-data">
      <div>
        <Calendario valor={valor} onChange={onChange} />
      </div>
      <div className="passo-data__detalhe">
        <h3>Liturgia carregada</h3>
        {liturgia ? (
          <ul>
            <li>
              <strong>Celebração:</strong> {liturgia.diaLiturgico ?? "—"}
            </li>
            <li>
              <strong>Cor:</strong>{" "}
              <span className="passo-data__cor" data-cor={liturgia.cor}>
                {liturgia.corRotulo}
              </span>
            </li>
            <li>
              <strong>1ª Leitura:</strong>{" "}
              {liturgia.primeiraLeitura?.referencia ?? "—"}
            </li>
            <li>
              <strong>Salmo:</strong> {liturgia.salmo?.referencia ?? "—"}
            </li>
            <li>
              <strong>2ª Leitura:</strong>{" "}
              {liturgia.segundaLeitura?.referencia ?? "—"}
            </li>
            <li>
              <strong>Evangelho:</strong>{" "}
              {liturgia.evangelho?.referencia ?? "—"}
            </li>
          </ul>
        ) : (
          <p className="passo-data__vazio">
            Carregando liturgia da data selecionada…
          </p>
        )}
      </div>
    </div>
  );
}

function PassoCanto({
  rotulo,
  descricao,
  momento,
  musicas,
  valor,
  onChange,
}: {
  rotulo: string;
  descricao?: string;
  momento: MomentoMissa;
  musicas: Musica[];
  valor: string | null;
  onChange: (id: string | null) => void;
}) {
  const [busca, setBusca] = useState("");
  const candidatos = useMemo(() => {
    const lista = musicas.filter((m) => m.momento === momento);
    if (!busca) return lista;
    const q = busca.toLowerCase();
    return lista.filter(
      (m) =>
        m.titulo.toLowerCase().includes(q) ||
        (m.autor ?? "").toLowerCase().includes(q),
    );
  }, [musicas, momento, busca]);

  const escolhida = musicas.find((m) => m.id === valor) ?? null;
  const previa = useMemo(
    () =>
      escolhida
        ? paginarMusicaEmSlides(escolhida, {
            rito: "iniciais",
            rotuloSecao: rotulo,
          })
        : [],
    [escolhida, rotulo],
  );

  return (
    <div className="passo-canto">
      <h3>{rotulo}</h3>
      {descricao && <p className="passo-canto__desc">{descricao}</p>}
      <input
        type="search"
        placeholder={`Buscar ${rotulo.toLowerCase()}…`}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <ul className="passo-canto__lista">
        {candidatos.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className={
                "passo-canto__item" +
                (m.id === valor ? " passo-canto__item--on" : "")
              }
              onClick={() => onChange(m.id === valor ? null : m.id)}
            >
              <span className="passo-canto__icon">♪</span>
              <span className="passo-canto__body">
                <strong>{m.titulo}</strong>
                <small>
                  {m.autor ?? "—"}
                  {m.tom ? ` · Tom ${m.tom}` : ""}
                </small>
              </span>
              <span
                className={
                  "passo-canto__chip" + (m.id === valor ? " on" : "")
                }
              >
                {m.id === valor ? "✓" : "+"}
              </span>
            </button>
          </li>
        ))}
        {candidatos.length === 0 && (
          <li className="passo-canto__vazio">
            Nenhum canto cadastrado para este momento. Vá em{" "}
            <strong>Músicas</strong> para adicionar.
          </li>
        )}
      </ul>

      {escolhida && (
        <div className="passo-canto__previa">
          <h4>
            Auto-paginação ({previa.length}{" "}
            {previa.length === 1 ? "slide" : "slides"})
          </h4>
          <ol>
            {previa.map((s) => (
              <li key={s.id}>{s.titulo}</li>
            ))}
          </ol>
          <p className="passo-canto__nota">
            Estrofes longas são quebradas automaticamente em vários slides.
          </p>
        </div>
      )}
    </div>
  );
}

function PassoPalavra({
  liturgia,
}: {
  liturgia: ReturnType<typeof useAppState>["liturgia"];
}) {
  if (!liturgia) {
    return <p className="passo-data__vazio">Selecione a data primeiro.</p>;
  }
  const cards = [
    { rotulo: "1ª Leitura", l: liturgia.primeiraLeitura },
    {
      rotulo: "Salmo",
      l: liturgia.salmo as
        | { titulo: string; referencia?: string; texto: string }
        | undefined,
    },
    { rotulo: "2ª Leitura", l: liturgia.segundaLeitura },
    { rotulo: "Evangelho", l: liturgia.evangelho },
  ];
  return (
    <div className="passo-palavra">
      <p className="passo-palavra__intro">
        Os textos abaixo já vêm direto do lecionário do dia. Você pode editá-los
        depois na tela <strong>Editor</strong>.
      </p>
      <div className="passo-palavra__grid">
        {cards.map((c) =>
          c.l ? (
            <article key={c.rotulo} className="passo-palavra__card">
              <header>
                <span className="passo-palavra__rotulo">{c.rotulo}</span>
                <span className="passo-palavra__ref">
                  {c.l.referencia ?? c.l.titulo}
                </span>
              </header>
              <p>{(c.l.texto ?? "").slice(0, 220)}…</p>
            </article>
          ) : (
            <article
              key={c.rotulo}
              className="passo-palavra__card passo-palavra__card--vazio"
            >
              <header>
                <span className="passo-palavra__rotulo">{c.rotulo}</span>
                <span className="passo-palavra__ref">—</span>
              </header>
              <p>Não disponível para esta data.</p>
            </article>
          ),
        )}
      </div>
    </div>
  );
}

function PassoAvisos({
  avisos,
  onAdicionar,
  onAtualizar,
  onRemover,
}: {
  avisos: string[];
  onAdicionar: () => void;
  onAtualizar: (i: number, v: string) => void;
  onRemover: (i: number) => void;
}) {
  return (
    <div className="passo-avisos">
      <p className="passo-avisos__intro">
        Cada aviso vira um slide separado no fim da apresentação.
      </p>
      <ul className="passo-avisos__lista">
        {avisos.map((a, i) => (
          <li key={i} className="passo-avisos__item">
            <span className="passo-avisos__num">{i + 1}</span>
            <textarea
              rows={3}
              placeholder={`Aviso ${i + 1} — ex.: Reunião do grupo de jovens neste sábado às 19h.`}
              value={a}
              onChange={(e) => onAtualizar(i, e.target.value)}
            />
            <button
              type="button"
              className="passo-avisos__del"
              onClick={() => onRemover(i)}
              aria-label="Remover aviso"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onAdicionar}>
        + Adicionar aviso
      </button>
    </div>
  );
}

function PassoRevisao({
  slides,
  slideAtivoId,
  onSelecionar,
  livreElementos,
}: {
  slides: BlocoSlide[];
  slideAtivoId: string | null;
  onSelecionar: (id: string) => void;
  livreElementos: Record<string, ElementoCanvas[]>;
}) {
  return (
    <div className="passo-revisao">
      <p className="passo-revisao__intro">
        Todos os slides montados pelo wizard estão abaixo. Clique em qualquer um
        para abrir no painel da direita e editar com o canvas livre — adicione
        texto, imagem, mude posição.
      </p>
      <ul className="passo-revisao__grid">
        {slides.map((s, i) => {
          const livreCount = livreElementos[s.id]?.length ?? 0;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={
                  "passo-revisao__item" +
                  (s.id === slideAtivoId ? " is-ativo" : "")
                }
                onClick={() => onSelecionar(s.id)}
              >
                <span className="passo-revisao__num">{i + 1}</span>
                <span className="passo-revisao__body">
                  <strong>{s.titulo}</strong>
                  <small>
                    {rotuloRito(s.rito)}
                    {livreCount > 0 && (
                      <span className="passo-revisao__livre">
                        +{livreCount} livre{livreCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </small>
                </span>
                {s.id === slideAtivoId && (
                  <span className="passo-revisao__check">✎</span>
                )}
              </button>
            </li>
          );
        })}
        {slides.length === 0 && (
          <li className="passo-revisao__vazio">
            Volte aos passos anteriores e selecione cantos / data para gerar
            slides.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/*  Helpers                                                           */
/* ----------------------------------------------------------------- */

function leiturasResumoFromLiturgia(
  l: ReturnType<typeof useAppState>["liturgia"],
) {
  if (!l) return [];
  return [
    {
      rotulo: "1ª Leitura",
      valor: l.primeiraLeitura?.referencia ?? l.primeiraLeitura?.titulo ?? "—",
    },
    {
      rotulo: "Salmo",
      valor: l.salmo?.referencia ?? l.salmo?.titulo ?? "—",
    },
    {
      rotulo: "2ª Leitura",
      valor: l.segundaLeitura?.referencia ?? l.segundaLeitura?.titulo ?? "—",
    },
    {
      rotulo: "Evangelho",
      valor: l.evangelho?.referencia ?? l.evangelho?.titulo ?? "—",
    },
  ];
}

function rotuloRito(r: RiteKey) {
  return {
    iniciais: "Iniciais",
    palavra: "Palavra",
    eucaristica: "Eucarística",
    finais: "Finais",
  }[r];
}

function pertenceEtapa(b: BlocoSlide, etapa: number): boolean {
  if (etapa === 1) return b.rito === "iniciais" && b.tipo !== "generico";
  if (etapa === 2) return b.rito === "palavra";
  if (etapa === 3) return b.rito === "eucaristica";
  if (etapa === 4) return b.rito === "finais" && !b.id.startsWith("aviso-");
  if (etapa === 5) return b.id.startsWith("aviso-");
  return false;
}

function primeiroSlideDaEtapa(
  etapa: number,
  slides: BlocoSlide[],
): string | null {
  if (etapa === 0) return slides.find((s) => s.id === "abertura")?.id ?? null;
  if (etapa === 6) return slides[0]?.id ?? null;
  const cand = slides.find((s) => pertenceEtapa(s, etapa));
  if (cand) return cand.id;
  return slides[0]?.id ?? null;
}

interface GerarParams {
  liturgia: ReturnType<typeof useAppState>["liturgia"];
  musicas: Musica[];
  cantoEntradaId: string | null;
  cantoOfertorioId: string | null;
  cantoComunhaoId: string | null;
  cantoFinalId: string | null;
  avisos: string[];
}

function gerarSlidesDaCelebracao(p: GerarParams): BlocoSlide[] {
  const out: BlocoSlide[] = [];
  if (!p.liturgia) return out;

  out.push({
    id: "abertura",
    rito: "iniciais",
    tipo: "generico",
    titulo: p.liturgia.diaLiturgico ?? "Santa Missa",
    texto: "",
  });

  const entrada = p.musicas.find((m) => m.id === p.cantoEntradaId);
  if (entrada) {
    out.push(
      ...paginarMusicaEmSlides(entrada, {
        rito: "iniciais",
        rotuloSecao: "Canto de Entrada",
      }),
    );
  }

  if (p.liturgia.primeiraLeitura) {
    out.push({
      id: "leitura1",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Primeira Leitura",
      citacao: p.liturgia.primeiraLeitura.referencia,
      texto: p.liturgia.primeiraLeitura.texto,
    });
  }
  if (p.liturgia.salmo) {
    out.push({
      id: "salmo",
      rito: "palavra",
      tipo: "salmo",
      titulo: "Salmo Responsorial",
      citacao: p.liturgia.salmo.referencia,
      texto: p.liturgia.salmo.texto,
    });
  }
  if (p.liturgia.segundaLeitura) {
    out.push({
      id: "leitura2",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Segunda Leitura",
      citacao: p.liturgia.segundaLeitura.referencia,
      texto: p.liturgia.segundaLeitura.texto,
    });
  }
  if (p.liturgia.evangelho) {
    out.push({
      id: "evangelho",
      rito: "palavra",
      tipo: "leitura",
      titulo: "Evangelho",
      citacao: p.liturgia.evangelho.referencia,
      texto: p.liturgia.evangelho.texto,
    });
  }

  const ofert = p.musicas.find((m) => m.id === p.cantoOfertorioId);
  if (ofert) {
    out.push(
      ...paginarMusicaEmSlides(ofert, {
        rito: "eucaristica",
        rotuloSecao: "Ofertório",
      }),
    );
  }
  const comun = p.musicas.find((m) => m.id === p.cantoComunhaoId);
  if (comun) {
    out.push(
      ...paginarMusicaEmSlides(comun, {
        rito: "eucaristica",
        rotuloSecao: "Comunhão",
      }),
    );
  }

  const finalCanto = p.musicas.find((m) => m.id === p.cantoFinalId);
  if (finalCanto) {
    out.push(
      ...paginarMusicaEmSlides(finalCanto, {
        rito: "finais",
        rotuloSecao: "Canto Final",
      }),
    );
  }

  p.avisos
    .map((a) => a.trim())
    .filter(Boolean)
    .forEach((aviso, i) => {
      out.push({
        id: `aviso-${i + 1}`,
        rito: "finais",
        tipo: "generico",
        titulo: `Aviso ${i + 1}`,
        texto: `<p>${aviso.replace(/\n/g, "<br/>")}</p>`,
      });
    });

  return out;
}
