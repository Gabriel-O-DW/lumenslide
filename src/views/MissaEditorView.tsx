import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SlideCanvas } from "../components/missa/SlideCanvas";
import { PainelAjustes } from "../components/missa/PainelAjustes";
import { gerarSecoes, montarSlides, nomeDaMissa, organizarSecoes } from "../missa/gerador";
import { carregarCelebracao, montarContexto, salvarEstado, type DadosParoquia } from "../missa/dados";
import { exportarPptx } from "../missa/pptx";
import { PALETAS } from "../missa/tema";
import type { CampoEditavel } from "../missa/layout";
import type { ContextoMissa, EstadoMissa, Slide } from "../missa/tipos";
import "./MissaEditorView.css";

interface Props {
  paroquia: DadosParoquia;
  celebracaoId: string;
  onVoltar: () => void;
}

type StatusSalvar = "salvo" | "pendente" | "salvando" | "erro";

const LARGURA_MINIATURA = 172;

export function MissaEditorView({ paroquia, celebracaoId, onVoltar }: Props) {
  const [ctx, setCtx] = useState<ContextoMissa | null>(null);
  const [estado, setEstado] = useState<EstadoMissa | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusSalvar>("salvo");
  const [selecionado, setSelecionado] = useState<string>("capa");
  const [exportando, setExportando] = useState<string | null>(null);

  // Carrega a missa salva + liturgia do dia
  useEffect(() => {
    let ativo = true;
    setErro(null);
    (async () => {
      const cel = await carregarCelebracao(celebracaoId);
      const contexto = await montarContexto(paroquia, cel.data, cel.horario);
      if (!ativo) return;
      setCtx(contexto);
      setEstado(cel.estado);
    })().catch((e: Error) => ativo && setErro(e.message ?? "Não foi possível abrir a missa."));
    return () => {
      ativo = false;
    };
  }, [celebracaoId, paroquia]);

  // Salvamento automático (aguarda uma pausa na digitação)
  const primeiraCarga = useRef(true);
  useEffect(() => {
    if (!estado) return;
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }
    setStatus("pendente");
    const t = setTimeout(() => {
      setStatus("salvando");
      salvarEstado(celebracaoId, estado)
        .then(() => setStatus("salvo"))
        .catch(() => setStatus("erro"));
    }, 800);
    return () => clearTimeout(t);
  }, [estado, celebracaoId]);

  const alterar = useCallback((f: (e: EstadoMissa) => EstadoMissa) => setEstado((e) => (e ? f(e) : e)), []);

  const secoes = useMemo(
    () => (ctx && estado ? organizarSecoes(gerarSecoes(ctx, estado), estado) : []),
    [ctx, estado],
  );
  const slides = useMemo(() => (estado ? montarSlides(secoes, estado) : []), [secoes, estado]);
  const rotuloSecao = useMemo(() => new Map(secoes.map((s) => [s.id, s.rotulo])), [secoes]);

  const indice = Math.max(0, slides.findIndex((s) => s.id === selecionado));
  const atual: Slide | undefined = slides[indice];

  const irPara = useCallback(
    (secaoId: string) => {
      const s = slides.find((x) => x.secao === secaoId && x.tipo !== "branco");
      if (s) setSelecionado(s.id);
    },
    [slides],
  );

  // Navegação pelo teclado (fora de campos de texto)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const alvo = ev.target as HTMLElement;
      if (alvo.closest("input, textarea, select, [contenteditable='true']")) return;
      const passo = ev.key === "ArrowDown" || ev.key === "ArrowRight" ? 1 : ev.key === "ArrowUp" || ev.key === "ArrowLeft" ? -1 : 0;
      if (!passo) return;
      ev.preventDefault();
      const prox = slides[Math.min(slides.length - 1, Math.max(0, indice + passo))];
      if (prox) setSelecionado(prox.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides, indice]);

  // Mantém a miniatura selecionada visível
  const listaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    listaRef.current
      ?.querySelector(`[data-slide="${CSS.escape(atual?.id ?? "")}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [atual?.id]);

  // Tamanho do slide principal acompanha o espaço disponível
  const palcoRef = useRef<HTMLDivElement>(null);
  const [larguraPalco, setLarguraPalco] = useState(800);
  useLayoutEffect(() => {
    const el = palcoRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      setLarguraPalco(Math.max(320, Math.floor(Math.min(width, (height * 16) / 9))));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ctx]);

  const editar = (campo: CampoEditavel, valor: string) => {
    if (!atual) return;
    const extra = estado?.extras.find((x) => x.id === atual.id);
    if (extra && (campo === "titulo" || campo === "texto")) {
      alterar((e) => ({ ...e, extras: e.extras.map((x) => (x.id === extra.id ? { ...x, [campo]: valor } : x)) }));
      return;
    }
    alterar((e) => ({ ...e, edicoes: { ...e.edicoes, [atual.id]: { ...e.edicoes[atual.id], [campo]: valor } } }));
  };

  const mudarEscala = (delta: number) => {
    if (!atual) return;
    alterar((e) => {
      const escala = Math.min(1.6, Math.max(0.5, Math.round(((e.edicoes[atual.id]?.escala ?? 1) + delta) * 10) / 10));
      return { ...e, edicoes: { ...e.edicoes, [atual.id]: { ...e.edicoes[atual.id], escala } } };
    });
  };

  const restaurar = () => {
    if (!atual) return;
    alterar((e) => {
      const edicoes = { ...e.edicoes };
      delete edicoes[atual.id];
      return { ...e, edicoes };
    });
  };

  const ocultar = () => {
    if (!atual) return;
    const prox = slides[indice + 1] ?? slides[indice - 1];
    alterar((e) => ({ ...e, ocultos: [...e.ocultos, atual.id] }));
    if (prox) setSelecionado(prox.id);
  };

  const nomeArquivo = ctx ? nomeDaMissa(ctx.data, ctx.horario) : "";

  const baixar = async () => {
    if (!ctx) return;
    setExportando("Preparando…");
    try {
      await exportarPptx(slides, ctx.cor, ctx.paroquiaId, nomeArquivo, (feito, total) =>
        setExportando(`Gerando… ${Math.round((feito / total) * 100)}%`),
      );
    } catch (e) {
      setErro(`Falha ao gerar o PPTX: ${(e as Error).message}`);
    } finally {
      setExportando(null);
    }
  };

  if (erro && !ctx) {
    return (
      <div className="missa-editor__vazio">
        <p className="alerta-erro">⚠ {erro}</p>
        <button type="button" onClick={onVoltar}>← Voltar</button>
      </div>
    );
  }
  if (!ctx || !estado) return <div className="missa-editor__vazio">Montando os slides…</div>;

  const paleta = PALETAS[ctx.cor];
  const editado = atual ? Boolean(estado.edicoes[atual.id]) : false;
  const textoStatus = { salvo: "✓ Salvo", pendente: "Alterações pendentes", salvando: "Salvando…", erro: "⚠ Erro ao salvar" }[status];

  let secaoAnterior = "";

  return (
    <div className="missa-editor">
      <header className="missa-editor__barra">
        <button type="button" className="ghost" onClick={onVoltar}>
          ← Missas
        </button>
        <div className="missa-editor__titulo">
          <span className="missa-editor__cor" style={{ background: paleta.amostra }} title={`Cor litúrgica: ${paleta.rotulo}`} />
          <div>
            <strong>{nomeArquivo}</strong>
            <small>
              {estado.liturgia.diaLiturgico ?? ctx.diaLiturgico} · {slides.length} slides · {estado.comMusica ? "com música" : "sem música"}
            </small>
          </div>
        </div>
        <span className={`missa-editor__status missa-editor__status--${status}`} aria-live="polite">
          {textoStatus}
        </span>
        <button type="button" className="primary missa-editor__baixar" onClick={baixar} disabled={Boolean(exportando)}>
          {exportando ?? "⇩ Baixar PPTX"}
        </button>
      </header>

      {erro && <p className="alerta-erro missa-editor__erro">⚠ {erro}</p>}

      <div className="missa-editor__corpo">
        <nav className="missa-editor__miniaturas" ref={listaRef} aria-label="Slides">
          {slides.map((s, i) => {
            const novaSecao = s.secao !== secaoAnterior && s.tipo !== "branco";
            if (novaSecao) secaoAnterior = s.secao;
            return (
              <div key={s.id}>
                {novaSecao && <div className="missa-editor__secao">{rotuloSecao.get(s.secao)}</div>}
                <button
                  type="button"
                  data-slide={s.id}
                  className={
                    "missa-editor__miniatura" +
                    (s.id === atual?.id ? " missa-editor__miniatura--ativa" : "") +
                    (s.tipo === "branco" ? " missa-editor__miniatura--branco" : "")
                  }
                  onClick={() => setSelecionado(s.id)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={s.id === atual?.id}
                >
                  <span className="missa-editor__numero">{i + 1}</span>
                  {s.tipo === "branco" ? (
                    <span className="missa-editor__branco">tela em branco</span>
                  ) : (
                    <SlideCanvas slide={s} cor={ctx.cor} paroquiaId={ctx.paroquiaId} largura={LARGURA_MINIATURA} />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        <main className="missa-editor__palco">
          <div className="missa-editor__palco-area" ref={palcoRef}>
            {atual && (
              <div className="missa-editor__slide">
                <SlideCanvas
                  slide={atual}
                  cor={ctx.cor}
                  paroquiaId={ctx.paroquiaId}
                  largura={larguraPalco}
                  editavel
                  onEditar={editar}
                />
              </div>
            )}
          </div>
          {atual && (
            <div className="missa-editor__ferramentas">
              <div className="missa-editor__nav">
                <button type="button" aria-label="Slide anterior" disabled={indice === 0} onClick={() => setSelecionado(slides[indice - 1].id)}>
                  ‹
                </button>
                <span>
                  <strong>{indice + 1}</strong> / {slides.length} · {rotuloSecao.get(atual.secao) ?? ""}
                </span>
                <button
                  type="button"
                  aria-label="Próximo slide"
                  disabled={indice === slides.length - 1}
                  onClick={() => setSelecionado(slides[indice + 1].id)}
                >
                  ›
                </button>
              </div>
              <div className="missa-editor__acoes">
                {atual.tipo !== "branco" && atual.tipo !== "imagem" && (
                  <div className="missa-editor__fonte" role="group" aria-label="Tamanho do texto">
                    <button type="button" onClick={() => mudarEscala(-0.1)} title="Diminuir texto">
                      A−
                    </button>
                    <span>{Math.round((estado.edicoes[atual.id]?.escala ?? 1) * 100)}%</span>
                    <button type="button" onClick={() => mudarEscala(0.1)} title="Aumentar texto">
                      A+
                    </button>
                  </div>
                )}
                {editado && (
                  <button type="button" className="ghost" onClick={restaurar} title="Desfaz as edições manuais deste slide">
                    ↺ Voltar ao automático
                  </button>
                )}
                <button type="button" className="ghost" onClick={ocultar} title="Remove este slide da apresentação">
                  Ocultar slide
                </button>
              </div>
              <p className="missa-editor__dica">Clique em um texto do slide para editar · ← → navega entre os slides</p>
            </div>
          )}
        </main>

        <aside className="missa-editor__ajustes" aria-label="Ajustes da missa">
          <PainelAjustes ctx={ctx} estado={estado} secoes={secoes} alterar={alterar} onIrPara={irPara} />
        </aside>
      </div>
    </div>
  );
}
