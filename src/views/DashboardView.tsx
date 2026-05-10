import { useAppState } from "../state/AppState";
import { Calendario } from "../components/Calendario";
import { GraficoBarras } from "../components/GraficoBarras";
import { CardDia } from "../components/CardDia";
import { AcoesRapidas } from "../components/AcoesRapidas";
import { MusicasRecentes } from "../components/MusicasRecentes";
import type { ViewKey } from "../types/nav";
import "./DashboardView.css";

interface Props {
  onNavigate: (v: ViewKey) => void;
}

export function DashboardView({ onNavigate }: Props) {
  const { dataSelecionada, setDataSelecionada } = useAppState();

  return (
    <div className="dashboard">
      <div className="dashboard__grid">
        <section className="card dashboard__chart">
          <div className="card-header">
            <div>
              <h2 className="card-title">Apresentações por mês</h2>
              <p className="card-subtitle">Histórico — últimos 12 meses</p>
            </div>
            <span className="chip">Visão anual</span>
          </div>
          <div className="card-body">
            <GraficoBarras
              data={[
                42, 58, 71, 95, 110, 120, 88, 76, 95, 132, 118, 128,
              ]}
              labels={[
                "Jan",
                "Fev",
                "Mar",
                "Abr",
                "Mai",
                "Jun",
                "Jul",
                "Ago",
                "Set",
                "Out",
                "Nov",
                "Dez",
              ]}
            />
          </div>
        </section>

        <section className="card dashboard__cal">
          <div className="card-header">
            <h2 className="card-title">Calendário</h2>
            <span className="chip chip--gold">Selecionar data</span>
          </div>
          <div className="card-body">
            <Calendario
              valor={dataSelecionada}
              onChange={setDataSelecionada}
            />
          </div>
        </section>

        <section className="card dashboard__day">
          <CardDia />
        </section>

        <section className="card dashboard__actions">
          <div className="card-header">
            <h2 className="card-title">Ações Rápidas</h2>
          </div>
          <div className="card-body">
            <AcoesRapidas onNavigate={onNavigate} />
          </div>
        </section>

        <section className="card dashboard__songs">
          <div className="card-header">
            <h2 className="card-title">Músicas Recentes</h2>
            <button className="ghost" onClick={() => onNavigate("musicas")}>
              Ver todas
            </button>
          </div>
          <div className="card-body">
            <MusicasRecentes />
          </div>
        </section>
      </div>
    </div>
  );
}
