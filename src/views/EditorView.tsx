import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import { RiteTabs, type RiteKey } from "../components/RiteTabs";
import { RichTextEditor } from "../components/RichTextEditor";
import { SlidePreview } from "../components/SlidePreview";
import {
  blocosIniciaisDoRito,
  type BlocoSlide,
  type TipoBloco,
} from "../data/blocosLiturgicos";
import "./EditorView.css";

const TIPOS_BLOCO: Array<{ valor: TipoBloco; rotulo: string }> = [
  { valor: "generico", rotulo: "Slide genérico" },
  { valor: "leitura", rotulo: "Leitura" },
  { valor: "salmo", rotulo: "Salmo" },
  { valor: "ordinario", rotulo: "Ordinário" },
  { valor: "canto", rotulo: "Canto" },
];

function novoBloco(rito: RiteKey): BlocoSlide {
  return {
    id: `slide-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    rito,
    tipo: "generico",
    titulo: "Novo slide",
    texto: "",
  };
}

export function EditorView() {
  const { liturgia, temaAtivo, temas, setTemaAtivo } = useAppState();
  const [rito, setRito] = useState<RiteKey>("eucaristica");
  const [blocos, setBlocos] = useState<BlocoSlide[]>(() => blocosIniciaisDoRito());
  const [slideAtivoId, setSlideAtivoId] = useState<string>(blocos[0]?.id ?? "");

  // Sincroniza leituras quando a liturgia chega
  useEffect(() => {
    if (!liturgia) return;
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id === "leitura1" && liturgia.primeiraLeitura) {
          return {
            ...b,
            titulo: liturgia.primeiraLeitura.titulo || b.titulo,
            citacao: liturgia.primeiraLeitura.referencia,
            texto: leituraParaHtml(liturgia.primeiraLeitura),
          };
        }
        if (b.id === "salmo" && liturgia.salmo) {
          return {
            ...b,
            titulo: liturgia.salmo.titulo || b.titulo,
            citacao: liturgia.salmo.referencia,
            texto: salmoParaHtml(liturgia.salmo),
          };
        }
        if (b.id === "leitura2" && liturgia.segundaLeitura) {
          return {
            ...b,
            titulo: liturgia.segundaLeitura.titulo || b.titulo,
            citacao: liturgia.segundaLeitura.referencia,
            texto: leituraParaHtml(liturgia.segundaLeitura),
          };
        }
        if (b.id === "evangelho" && liturgia.evangelho) {
          return {
            ...b,
            titulo: liturgia.evangelho.titulo || b.titulo,
            citacao: liturgia.evangelho.referencia,
            texto: leituraParaHtml(liturgia.evangelho),
          };
        }
        return b;
      }),
    );
  }, [liturgia]);

  const blocosDoRito = useMemo(
    () => blocos.filter((b) => b.rito === rito),
    [blocos, rito],
  );

  useEffect(() => {
    if (blocosDoRito.length === 0) return;
    if (!blocosDoRito.find((b) => b.id === slideAtivoId)) {
      setSlideAtivoId(blocosDoRito[0].id);
    }
  }, [blocosDoRito, slideAtivoId]);

  const slideAtivo = blocos.find((b) => b.id === slideAtivoId) ?? blocosDoRito[0];

  const atualizarBloco = (id: string, patch: Partial<BlocoSlide>) => {
    setBlocos((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  };

  const criarNovoSlide = () => {
    const b = novoBloco(rito);
    setBlocos((prev) => [...prev, b]);
    setSlideAtivoId(b.id);
  };

  const removerSlide = (id: string) => {
    setBlocos((prev) => prev.filter((b) => b.id !== id));
  };

  const leiturasResumo = [
    {
      rotulo: "1ª Leitura",
      valor:
        liturgia?.primeiraLeitura?.referencia ??
        liturgia?.primeiraLeitura?.titulo ??
        "—",
    },
    {
      rotulo: "Salmo",
      valor:
        liturgia?.salmo?.referencia ?? liturgia?.salmo?.titulo ?? "—",
    },
    {
      rotulo: "2ª Leitura",
      valor:
        liturgia?.segundaLeitura?.referencia ??
        liturgia?.segundaLeitura?.titulo ??
        "—",
    },
    {
      rotulo: "Evangelho",
      valor:
        liturgia?.evangelho?.referencia ??
        liturgia?.evangelho?.titulo ??
        "—",
    },
  ];

  return (
    <div className="editor-view">
      <RiteTabs ativo={rito} onChange={setRito} />

      <div className="editor-view__grid">
        <section className="card editor-view__lista">
          <div className="card-header">
            <h2 className="card-title">Slides do rito</h2>
            <button className="primary editor-view__novo" onClick={criarNovoSlide}>
              + Novo Slide
            </button>
          </div>
          <div className="card-body">
            <ul className="lista-slides">
              {blocosDoRito.map((b, i) => (
                <li key={b.id}>
                  <div
                    className={
                      "lista-slides__item" +
                      (b.id === slideAtivoId ? " lista-slides__item--on" : "")
                    }
                  >
                    <button
                      type="button"
                      className="lista-slides__main"
                      onClick={() => setSlideAtivoId(b.id)}
                    >
                      <span className="lista-slides__num">{i + 1}</span>
                      <span className="lista-slides__body">
                        <span className="lista-slides__titulo">{b.titulo}</span>
                        <span className="lista-slides__sub">
                          {b.tipo === "leitura" && (b.citacao ?? "Leitura")}
                          {b.tipo === "salmo" && "Salmo Responsorial"}
                          {b.tipo === "ordinario" && "Ordinário"}
                          {b.tipo === "canto" && "Canto"}
                          {b.tipo === "generico" && "Slide"}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      className="lista-slides__del"
                      onClick={() => removerSlide(b.id)}
                      aria-label="Remover slide"
                      title="Remover slide"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card editor-view__editor">
          <div className="card-header">
            <h2 className="card-title">Novo Slide</h2>
            <span className="chip chip--gold">Editor HTML</span>
          </div>
          <div className="card-body">
            {slideAtivo && (
              <div className="rito-editor">
                <div className="rito-editor__row">
                  <label htmlFor="ne-titulo">Título do slide</label>
                  <input
                    id="ne-titulo"
                    value={slideAtivo.titulo}
                    onChange={(e) =>
                      atualizarBloco(slideAtivo.id, { titulo: e.target.value })
                    }
                  />
                </div>

                <div className="rito-editor__cols">
                  <div className="rito-editor__row">
                    <label htmlFor="ne-tipo">Tipo</label>
                    <select
                      id="ne-tipo"
                      value={slideAtivo.tipo}
                      onChange={(e) =>
                        atualizarBloco(slideAtivo.id, {
                          tipo: e.target.value as TipoBloco,
                        })
                      }
                    >
                      {TIPOS_BLOCO.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="rito-editor__row">
                    <label htmlFor="ne-citacao">Citação / referência</label>
                    <input
                      id="ne-citacao"
                      value={slideAtivo.citacao ?? ""}
                      placeholder="ex.: Is 55,1-3"
                      onChange={(e) =>
                        atualizarBloco(slideAtivo.id, {
                          citacao: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="rito-editor__row">
                  <label>Conteúdo</label>
                  <RichTextEditor
                    value={slideAtivo.texto}
                    onChange={(html) =>
                      atualizarBloco(slideAtivo.id, { texto: html })
                    }
                    placeholder="Use a barra de ferramentas para formatar — fonte, tamanho, cor, negrito, listas e respostas da assembleia."
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="card editor-view__preview">
          <div className="card-header">
            <h2 className="card-title">Pré-visualização do slide</h2>
            <select
              value={temaAtivo.id}
              onChange={(e) => {
                const t = temas.find((x) => x.id === e.target.value);
                if (t) setTemaAtivo(t);
              }}
              aria-label="Tema do slide"
            >
              {temas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="card-body">
            {slideAtivo && (
              <SlidePreview
                bloco={slideAtivo}
                tema={temaAtivo}
                cor={liturgia?.cor ?? "verde"}
                rotuloDia={liturgia?.diaLiturgico ?? slideAtivo.titulo}
                rotuloCor={liturgia?.corRotulo ?? ""}
                leituras={leiturasResumo}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- */
/*  Helpers para converter as leituras da API para HTML editável     */
/* ----------------------------------------------------------------- */

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragrafarTexto(texto: string): string {
  return texto
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escHtml(p)}</p>`)
    .join("");
}

function leituraParaHtml(l: {
  chamada?: string;
  texto: string;
  rodape?: string;
  rodapeResposta?: string;
  chamadaResposta?: string;
}): string {
  const partes: string[] = [];
  if (l.chamada) {
    partes.push(`<p><strong>${escHtml(l.chamada)}</strong></p>`);
  }
  partes.push(paragrafarTexto(l.texto));
  if (l.rodape) {
    const r = `${escHtml(l.rodape)}${
      l.rodapeResposta
        ? ` — <span class="rta-resposta">${escHtml(l.rodapeResposta)}</span>`
        : ""
    }`;
    partes.push(`<p>${r}</p>`);
  }
  return partes.join("");
}

function salmoParaHtml(s: { refrao: string; texto: string }): string {
  const partes: string[] = [];
  if (s.refrao) {
    partes.push(
      `<p><span class="rta-resposta">℟ ${escHtml(s.refrao)}</span></p>`,
    );
  }
  if (s.texto) {
    s.texto
      .split(/\n{2,}/)
      .map((e) => e.trim())
      .filter(Boolean)
      .forEach((estrofe) => {
        partes.push(`<p>${escHtml(estrofe).replace(/\n/g, "<br/>")}</p>`);
      });
  }
  return partes.join("");
}
