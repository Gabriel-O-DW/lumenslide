import { useAppState } from "../state/AppState";
import { Calendario } from "../components/Calendario";
import { LeiturasSemana } from "../components/LeiturasSemana";
import { CardDia } from "../components/CardDia";
import { AcoesRapidas } from "../components/AcoesRapidas";
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
        <section className="card dashboard__semana">
          <div className="card-header">
            <div>
              <h2 className="card-title">Leituras da semana</h2>
              <p className="card-subtitle">
                Selecione um dia para preparar a celebração
              </p>
            </div>
            <span className="chip">Seg → Dom</span>
          </div>
          <div className="card-body">
            <LeiturasSemana />
          </div>
        </section>

        <section className="card dashboard__cal">
          <div className="card-header">
            <h2 className="card-title">Calendário</h2>
            <span className="chip chip--gold">Selecionar data</span>
          </div>
          <div className="card-body">
            <Calendario valor={dataSelecionada} onChange={setDataSelecionada} />
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
      </div>
    </div>
  );
}
