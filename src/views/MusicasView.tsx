import { useState } from "react";
import { useAppState } from "../state/AppState";
import { PainelMusicas } from "../components/PainelMusicas";
import { GaleriaTemas } from "../components/GaleriaTemas";
import "./MusicasView.css";

export function MusicasView() {
  const { musicas } = useAppState();
  const [musicaAtivaId, setMusicaAtivaId] = useState<string>(musicas[0].id);

  const ativa = musicas.find((m) => m.id === musicaAtivaId) ?? musicas[0];

  return (
    <div className="musicas-view">
      <section className="card musicas-view__lista">
        <div className="card-header">
          <h2 className="card-title">Painel de Músicas</h2>
          <span className="chip">{musicas.length} cantos</span>
        </div>
        <div className="card-body">
          <PainelMusicas
            ativaId={ativa.id}
            onSelecionar={setMusicaAtivaId}
          />
        </div>
      </section>

      <section className="card musicas-view__temas">
        <div className="card-header">
          <h2 className="card-title">Tema de Fundo PowerPoint</h2>
          <span className="chip chip--gold">6 estilos</span>
        </div>
        <div className="card-body">
          <GaleriaTemas />
        </div>
      </section>
    </div>
  );
}
