import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { DashboardView } from "./views/DashboardView";
import { EditorView } from "./views/EditorView";
import { MusicasView } from "./views/MusicasView";
import { ExportarView } from "./views/ExportarView";
import { CalendarioView } from "./views/CalendarioView";
import { AjudaView } from "./views/AjudaView";
import { AppStateProvider } from "./state/AppState";
import type { ViewKey } from "./types/nav";
import "./App.css";

export default function App() {
  const [view, setView] = useState<ViewKey>("dashboard");

  return (
    <AppStateProvider>
      <div className="app-shell">
        <Sidebar active={view} onChange={setView} />
        <div className="app-main">
          <TopBar view={view} />
          <div className="app-content">
            {view === "dashboard" && <DashboardView onNavigate={setView} />}
            {view === "calendario" && <CalendarioView />}
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
