import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./views/DashboardView";
import { MusicasView } from "./views/MusicasView";
import { CalendarioView } from "./views/CalendarioView";
import { AjudaView } from "./views/AjudaView";
import { NovaMissaView } from "./views/NovaMissaView";
import { MissaEditorView } from "./views/MissaEditorView";
import { AppStateProvider } from "./state/AppState";
import { AuthProvider, useAuth } from "./state/AuthState";
import { AuthRouter } from "./views/auth/AuthRouter";
import { RedefinirSenhaView } from "./views/auth/RedefinirSenhaView";
import { useParoquia } from "./missa/useParoquia";
import type { ViewKey } from "./types/nav";
import "./App.css";

const CHAVE_CELEBRACAO = "lumenslide.celebracao-aberta";

function lerCelebracaoAberta(): string | null {
  try {
    return localStorage.getItem(CHAVE_CELEBRACAO);
  } catch {
    return null;
  }
}

function AppInterno() {
  const { usuario, iniciando, recuperandoSenha } = useAuth();
  const [view, setView] = useState<ViewKey>("novo-slide");
  const [celebracaoId, setCelebracaoId] = useState<string | null>(lerCelebracaoAberta);
  const { paroquia, erro: erroParoquia } = useParoquia(usuario?.paroquiaId);

  useEffect(() => {
    try {
      if (celebracaoId) localStorage.setItem(CHAVE_CELEBRACAO, celebracaoId);
      else localStorage.removeItem(CHAVE_CELEBRACAO);
    } catch {
      /* armazenamento indisponível: só não lembra a última missa aberta */
    }
  }, [celebracaoId]);

  if (iniciando) return <div className="app-carregando">Carregando…</div>;
  if (recuperandoSenha) return <RedefinirSenhaView />;
  if (!usuario) return <AuthRouter />;

  const abrir = (id: string) => {
    setCelebracaoId(id);
    setView("editor");
  };

  const cheio = view === "editor" && Boolean(celebracaoId);

  const conteudoMissa = () => {
    if (erroParoquia) return <p className="alerta-erro">⚠ {erroParoquia}</p>;
    if (!paroquia) return <div className="app-carregando">Carregando a paróquia…</div>;
    if (view === "editor" && celebracaoId) {
      return (
        <MissaEditorView
          key={celebracaoId}
          paroquia={paroquia}
          celebracaoId={celebracaoId}
          onVoltar={() => setView("novo-slide")}
        />
      );
    }
    return <NovaMissaView paroquia={paroquia} onAbrir={abrir} />;
  };

  return (
    <AppStateProvider>
      <div className="app-shell">
        <Sidebar active={view} onChange={setView} />
        <div className={"app-main" + (cheio ? " app-main--cheio" : "")}>
          <TopBar view={view} />
          <div className={"app-content" + (cheio ? " app-content--cheio" : "")}>
            {view === "dashboard" && <DashboardView onNavigate={setView} />}
            {view === "calendario" && <CalendarioView />}
            {(view === "novo-slide" || view === "editor") && conteudoMissa()}
            {view === "musicas" && <MusicasView />}
            {view === "ajuda" && <AjudaView />}
          </div>
        </div>
      </div>
    </AppStateProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInterno />
    </AuthProvider>
  );
}
