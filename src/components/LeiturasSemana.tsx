import { useEffect, useMemo, useState } from "react";
import {
  buscarLiturgiaSemana,
  construirSemana,
} from "../services/liturgia";
import { useAppState } from "../state/AppState";
import type { LiturgiaDiaria } from "../types/liturgia";
import "./LeiturasSemana.css";

const NOMES_DIA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

interface DiaSemana {
  data: string;
  liturgia: LiturgiaDiaria | null;
  erro?: string;
}

function rotuloData(iso: string): { dia: string; mes: string } {
  const [a, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  const date = new Date(a, m - 1, d);
  const meses = [
    "jan", "fev", "mar", "abr", "mai", "jun",
    "jul", "ago", "set", "out", "nov", "dez",
  ];
  return { dia: String(date.getDate()), mes: meses[date.getMonth()] };
}

export function LeiturasSemana() {
  const { dataSelecionada, setDataSelecionada } = useAppState();
  const [dias, setDias] = useState<DiaSemana[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Identifica a segunda-feira da semana de referência
  const semanaIso = useMemo(
    () => construirSemana(dataSelecionada),
    [dataSelecionada],
  );
  // O dia "ativo" é o da dataSelecionada (ou o primeiro da semana)
  const [diaAtivoIdx, setDiaAtivoIdx] = useState<number>(() => {
    const i = semanaIso.indexOf(dataSelecionada);
    return i >= 0 ? i : 0;
  });

  useEffect(() => {
    const i = semanaIso.indexOf(dataSelecionada);
    if (i >= 0) setDiaAtivoIdx(i);
  }, [dataSelecionada, semanaIso]);

  useEffect(() => {
    let canceled = false;
    setCarregando(true);
    buscarLiturgiaSemana(semanaIso[0]).then((res) => {
      if (canceled) return;
      setDias(res);
      setCarregando(false);
    });
    return () => {
      canceled = true;
    };
  }, [semanaIso]);

  const ativo = dias[diaAtivoIdx];

  return (
    <div className="leit-semana">
      <ul className="leit-semana__tabs" role="tablist">
        {semanaIso.map((iso, i) => {
          const { dia, mes } = rotuloData(iso);
          const sel = i === diaAtivoIdx;
          const isHoje =
            iso === new Date().toISOString().slice(0, 10);
          return (
            <li key={iso}>
              <button
                type="button"
                role="tab"
                aria-selected={sel}
                className={
                  "leit-semana__tab" +
                  (sel ? " leit-semana__tab--on" : "") +
                  (isHoje ? " leit-semana__tab--hoje" : "")
                }
                onClick={() => {
                  setDiaAtivoIdx(i);
                  setDataSelecionada(iso);
                }}
              >
                <span className="leit-semana__dia-nome">{NOMES_DIA[i]}</span>
                <span className="leit-semana__dia-num">{dia}</span>
                <span className="leit-semana__dia-mes">{mes}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="leit-semana__detalhe">
        {carregando && !ativo && (
          <div className="leit-semana__skeleton">Carregando liturgia da semana…</div>
        )}
        {ativo?.erro && (
          <div className="leit-semana__erro">⚠ {ativo.erro}</div>
        )}
        {ativo?.liturgia && (
          <DetalheDia liturgia={ativo.liturgia} />
        )}
        {!carregando && !ativo?.liturgia && !ativo?.erro && (
          <div className="leit-semana__skeleton">Sem dados para o dia.</div>
        )}
      </div>
    </div>
  );
}

function DetalheDia({ liturgia }: { liturgia: LiturgiaDiaria }) {
  const items: Array<{ rotulo: string; valor: string; destaque?: boolean }> = [];
  if (liturgia.primeiraLeitura) {
    items.push({
      rotulo: "1ª Leitura",
      valor:
        liturgia.primeiraLeitura.referencia ??
        liturgia.primeiraLeitura.titulo,
    });
  }
  if (liturgia.salmo) {
    items.push({
      rotulo: "Salmo",
      valor: liturgia.salmo.referencia ?? liturgia.salmo.titulo,
    });
  }
  if (liturgia.segundaLeitura) {
    items.push({
      rotulo: "2ª Leitura",
      valor:
        liturgia.segundaLeitura.referencia ??
        liturgia.segundaLeitura.titulo,
    });
  }
  if (liturgia.evangelho) {
    items.push({
      rotulo: "Evangelho",
      valor:
        liturgia.evangelho.referencia ?? liturgia.evangelho.titulo,
      destaque: true,
    });
  }

  return (
    <div className={`leit-semana__card cor-${liturgia.cor}`}>
      <header className="leit-semana__card-head">
        <h3>{liturgia.diaLiturgico ?? "Liturgia do dia"}</h3>
        <span className="leit-semana__cor">
          <span className="leit-semana__dot" />
          {liturgia.corRotulo}
        </span>
      </header>
      <ul className="leit-semana__items">
        {items.map((it) => (
          <li
            key={it.rotulo}
            className={
              "leit-semana__item" +
              (it.destaque ? " leit-semana__item--gold" : "")
            }
          >
            <span className="leit-semana__rotulo">{it.rotulo}</span>
            <span className="leit-semana__valor">{it.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
