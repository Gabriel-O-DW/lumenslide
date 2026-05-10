import { useMemo, useState } from "react";
import { useAppState } from "../state/AppState";
import type { MomentoMissa } from "../types/musica";
import "./PainelMusicas.css";

interface Props {
  ativaId: string;
  onSelecionar: (id: string) => void;
}

const filtros: { v: MomentoMissa | "todos"; label: string }[] = [
  { v: "todos", label: "Todos" },
  { v: "entrada", label: "Entrada" },
  { v: "gloria", label: "Glória" },
  { v: "salmo", label: "Salmo" },
  { v: "aclamacao", label: "Aclamação" },
  { v: "ofertorio", label: "Ofertório" },
  { v: "santo", label: "Santo" },
  { v: "comunhao", label: "Comunhão" },
  { v: "final", label: "Final" },
];

function formatarTempo(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function PainelMusicas({ ativaId, onSelecionar }: Props) {
  const { musicas, musicasSelecionadas, alternarMusica } = useAppState();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<MomentoMissa | "todos">("todos");
  const [tocando, setTocando] = useState(false);
  const [progresso, setProgresso] = useState(0.18);

  const ativa = musicas.find((m) => m.id === ativaId);

  const lista = useMemo(() => {
    return musicas.filter((m) => {
      if (filtro !== "todos" && m.momento !== filtro) return false;
      if (busca) {
        const q = busca.toLowerCase();
        return (
          m.titulo.toLowerCase().includes(q) ||
          (m.autor ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [musicas, busca, filtro]);

  return (
    <div className="painel-musicas">
      <div className="painel-musicas__busca">
        <input
          type="search"
          placeholder="Buscar canto, autor…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value as MomentoMissa | "todos")}
          aria-label="Filtrar por momento da missa"
        >
          {filtros.map((f) => (
            <option key={f.v} value={f.v}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="painel-musicas__lista">
        {lista.map((m) => {
          const selecionada = musicasSelecionadas.includes(m.id);
          const ativaItem = m.id === ativaId;
          return (
            <li key={m.id}>
              <div
                className={
                  "musica-card" +
                  (ativaItem ? " musica-card--on" : "") +
                  (selecionada ? " musica-card--in" : "")
                }
              >
                <button
                  type="button"
                  className="musica-card__head"
                  onClick={() => onSelecionar(m.id)}
                >
                  <span
                    className="musica-card__icon"
                    aria-hidden
                  >
                    ♪
                  </span>
                  <span className="musica-card__info">
                    <strong>{m.titulo}</strong>
                    <small>
                      {(filtros.find((f) => f.v === m.momento)?.label ?? "Outro")}
                      {m.autor ? ` · ${m.autor}` : ""}
                      {m.tom ? ` · Tom ${m.tom}` : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    className={
                      "musica-card__add" + (selecionada ? " on" : "")
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarMusica(m.id);
                    }}
                    aria-label={
                      selecionada
                        ? "Remover da apresentação"
                        : "Adicionar à apresentação"
                    }
                  >
                    {selecionada ? "✓" : "+"}
                  </button>
                </button>

                {ativaItem && ativa && (
                  <div className="musica-card__player">
                    <div className="musica-card__controls">
                      <button
                        className="ghost"
                        onClick={() => setTocando((t) => !t)}
                        aria-label={tocando ? "Pausar" : "Tocar"}
                      >
                        {tocando ? "❚❚" : "▶"}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.01}
                        value={progresso}
                        onChange={(e) =>
                          setProgresso(parseFloat(e.target.value))
                        }
                        aria-label="Posição"
                        className="musica-card__seek"
                      />
                      <span className="musica-card__time">
                        {ativa.duracaoSegundos
                          ? formatarTempo(
                              Math.round(ativa.duracaoSegundos * progresso),
                            ) +
                            " / " +
                            formatarTempo(ativa.duracaoSegundos)
                          : "—"}
                      </span>
                    </div>

                    <div className="musica-card__letra">
                      <span className="musica-card__eyebrow">Letra</span>
                      {ativa.refrao && (
                        <p className="musica-card__refrao">℟ {ativa.refrao}</p>
                      )}
                      {ativa.estrofes.map((e, i) => (
                        <p key={i} className="musica-card__estrofe">
                          {e}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {lista.length === 0 && (
          <li className="painel-musicas__vazio">
            Nenhuma música encontrada com esses filtros.
          </li>
        )}
      </ul>
    </div>
  );
}
