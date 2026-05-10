import { useState } from "react";
import { SlideViewer } from "./components/SlideViewer";
import { SlideList } from "./components/SlideList";
import { celebracaoExemplo } from "./data/exemplo";
import type { Slide } from "./types/slide";
import "./App.css";

export default function App() {
  const [slides] = useState<Slide[]>(celebracaoExemplo);
  const [indice, setIndice] = useState(0);
  const [modoApresentacao, setModoApresentacao] = useState(false);

  return (
    <div className="app">
      {!modoApresentacao && (
        <header className="app-header">
          <div className="brand">
            <img src="/lumen.svg" alt="" width={28} height={28} />
            <h1>LumenSlide</h1>
            <span className="tag">v0.1 · MVP</span>
          </div>
          <div className="header-actions">
            <button
              className="primary"
              onClick={() => setModoApresentacao(true)}
            >
              ▶ Apresentar
            </button>
          </div>
        </header>
      )}

      <main className={modoApresentacao ? "main main--full" : "main"}>
        {!modoApresentacao && (
          <aside className="sidebar">
            <SlideList
              slides={slides}
              indiceAtivo={indice}
              onSelecionar={setIndice}
            />
          </aside>
        )}

        <section className="viewer">
          <SlideViewer
            slides={slides}
            indice={indice}
            onMudarIndice={setIndice}
            modoApresentacao={modoApresentacao}
            onSair={() => setModoApresentacao(false)}
          />
        </section>
      </main>

      {!modoApresentacao && (
        <footer className="app-footer">
          <small>
            ✨ <strong>LumenSlide</strong> — projeto aberto MIT ·{" "}
            <a
              href="https://github.com/SEU-USUARIO/lumenslide"
              target="_blank"
              rel="noreferrer"
            >
              Contribua no GitHub
            </a>
          </small>
        </footer>
      )}
    </div>
  );
}
