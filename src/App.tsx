import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./views/DashboardView";
import { EditorView } from "./views/EditorView";
import { MusicasView } from "./views/MusicasView";
import { ExportarView } from "./views/ExportarView";
import { CalendarioView } from "./views/CalendarioView";
import { AjudaView } from "./views/AjudaView";
import { NovoSlideView } from "./views/NovoSlideView";
import { AppStateProvider } from "./state/AppState";
import { AuthProvider, useAuth } from "./state/AuthState";
import { AuthRouter } from "./views/auth/AuthRouter";
import type { ViewKey } from "./types/nav";
import "./App.css";

function AppInterno() {
  const { usuario } = useAuth();
  const [view, setView] = useState<ViewKey>("dashboard");

  if (!usuario) return <AuthRouter />;

  return (
    <AppStateProvider>
      <div className="app-shell">
        <Sidebar active={view} onChange={setView} />
        <div className="app-main">
          <TopBar view={view} />
          <div className="app-content">
            {view === "dashboard" && <DashboardView onNavigate={setView} />}
            {view === "calendario" && <CalendarioView />}
            {view === "novo-slide" && <NovoSlideView onNavigate={setView} />}
            {view === "editor" && <EditorView />}
            {view === "musicas" && <MusicasView />}
            {view === "exportar" && <ExportarView />}
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
