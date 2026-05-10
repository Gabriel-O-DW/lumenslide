import { useAppState } from "../state/AppState";
import "./MusicasRecentes.css";

const rotuloMomento: Record<string, string> = {
  entrada: "Entrada",
  "ato-penitencial": "Ato Pen.",
  gloria: "Glória",
  salmo: "Salmo",
  aclamacao: "Aclamação",
  ofertorio: "Ofertório",
  santo: "Santo",
  comunhao: "Comunhão",
  final: "Final",
  outro: "Outro",
};

export function MusicasRecentes() {
  const { musicas, musicasSelecionadas, alternarMusica } = useAppState();
  const recentes = musicas.slice(0, 5);

  return (
    <ul className="musicas-recentes">
      {recentes.map((m) => {
        const ativo = musicasSelecionadas.includes(m.id);
        return (
          <li key={m.id}>
            <button
              type="button"
              className={
                "musicas-recentes__item" +
                (ativo ? " musicas-recentes__item--on" : "")
              }
              onClick={() => alternarMusica(m.id)}
            >
              <span className="musicas-recentes__play" aria-hidden>
                ▶
              </span>
              <span className="musicas-recentes__body">
                <span className="musicas-recentes__titulo">{m.titulo}</span>
                <span className="musicas-recentes__sub">
                  {rotuloMomento[m.momento] ?? "Outro"}
                  {m.autor ? ` · ${m.autor}` : ""}
                </span>
              </span>
              <span
                className={
                  "musicas-recentes__chip" + (ativo ? " on" : "")
                }
              >
                {ativo ? "✓" : "+"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
