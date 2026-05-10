import { useEffect, useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import { RiteTabs, type RiteKey } from "../components/RiteTabs";
import { TextoRitoEditor } from "../components/TextoRitoEditor";
import { SlidePreview } from "../components/SlidePreview";
import {
  blocosIniciaisDoRito,
  type BlocoSlide,
} from "../data/blocosLiturgicos";
import "./EditorView.css";

export function EditorView() {
  const { liturgia, temaAtivo, temas, setTemaAtivo } = useAppState();
  const [rito, setRito] = useState<RiteKey>("eucaristica");
  const [blocos, setBlocos] = useState<BlocoSlide[]>(() => blocosIniciaisDoRito());
  const [slideAtivoId, setSlideAtivoId] = useState<string>(blocos[0]?.id ?? "");

  useEffect(() => {
    if (!liturgia) return;
    setBlocos((prev) =>
      prev.map((b) => {
        if (b.id === "leitura1" && liturgia.primeiraLeitura) {
          return {
            ...b,
            titulo: liturgia.primeiraLeitura.titulo || b.titulo,
            citacao: liturgia.primeiraLeitura.referencia,
            texto: liturgia.primeiraLeitura.texto,
          };
        }
        if (b.id === "salmo" && liturgia.salmo) {
          return {
            ...b,
            titulo: liturgia.salmo.titulo || b.titulo,
            citacao: liturgia.salmo.referencia,
            texto: liturgia.salmo.refrao
              ? `R. ${liturgia.salmo.refrao}\n\n${liturgia.salmo.texto}`
              : liturgia.salmo.texto,
          };
        }
        if (b.id === "leitura2" && liturgia.segundaLeitura) {
          return {
            ...b,
            titulo: liturgia.segundaLeitura.titulo || b.titulo,
            citacao: liturgia.segundaLeitura.referencia,
            texto: liturgia.segundaLeitura.texto,
          };
        }
        if (b.id === "evangelho" && liturgia.evangelho) {
          return {
            ...b,
            titulo: liturgia.evangelho.titulo || b.titulo,
            citacao: liturgia.evangelho.referencia,
            texto: liturgia.evangelho.texto,
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
            <span className="chip">{blocosDoRito.length} slides</span>
          </div>
          <div className="card-body">
            <ul className="lista-slides">
              {blocosDoRito.map((b, i) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className={
                      "lista-slides__item" +
                      (b.id === slideAtivoId ? " lista-slides__item--on" : "")
                    }
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
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card editor-view__editor">
          <div className="card-header">
            <h2 className="card-title">Editor de texto</h2>
            <span className="chip chip--gold">Estilo PowerPoint</span>
          </div>
          <div className="card-body">
            {slideAtivo && (
              <TextoRitoEditor
                bloco={slideAtivo}
                onChange={(patch) => atualizarBloco(slideAtivo.id, patch)}
              />
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
            <p className="hint">
              <strong>Design Automatizado</strong> e{" "}
              <strong>Cor do Slide</strong> sincronizam com a cor litúrgica
              da API.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
