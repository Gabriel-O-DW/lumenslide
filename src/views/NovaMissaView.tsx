import { useEffect, useMemo, useState } from "react";
import { buscarLiturgia } from "../services/liturgia";
import { corDaLiturgia, PALETAS } from "../missa/tema";
import { referenciaPorExtenso } from "../missa/referencias";
import { estadoInicial, nomeDaMissa } from "../missa/gerador";
import {
  buscarCelebracao,
  criarCelebracao,
  listarRecentes,
  type CelebracaoResumo,
  type DadosParoquia,
} from "../missa/dados";
import type { LiturgiaDiaria } from "../types/liturgia";
import "./NovaMissaView.css";

interface Props {
  paroquia: DadosParoquia;
  onAbrir: (celebracaoId: string) => void;
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function proximoDomingo(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return isoLocal(d);
}

const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

function dataPorExtenso(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(a, m - 1, d);
  return `${DIAS[dt.getDay()]}, ${dt.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}`;
}

const rotuloHorario = (h: string) => h.replace(":", "h");

export function NovaMissaView({ paroquia, onAbrir }: Props) {
  const horarios = paroquia.config.horarios;
  const [data, setData] = useState(proximoDomingo);
  const [horario, setHorario] = useState(horarios[horarios.length > 2 ? 2 : 0] ?? "19:00");
  const [outroHorario, setOutroHorario] = useState(false);
  const [comMusica, setComMusica] = useState(true);

  const [liturgia, setLiturgia] = useState<LiturgiaDiaria | null>(null);
  const [carregandoLit, setCarregandoLit] = useState(false);
  const [erroLit, setErroLit] = useState<string | null>(null);
  const [existente, setExistente] = useState<string | null>(null);
  const [recentes, setRecentes] = useState<CelebracaoResumo[]>([]);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    setCarregandoLit(true);
    setErroLit(null);
    buscarLiturgia(data)
      .then((l) => ativo && setLiturgia(l))
      .catch(() => {
        if (!ativo) return;
        setLiturgia(null);
        setErroLit("Não foi possível buscar a liturgia desta data.");
      })
      .finally(() => ativo && setCarregandoLit(false));
    return () => {
      ativo = false;
    };
  }, [data]);

  useEffect(() => {
    let ativo = true;
    setExistente(null);
    if (!/^\d{2}:\d{2}$/.test(horario)) return;
    buscarCelebracao(paroquia.id, data, horario)
      .then((id) => ativo && setExistente(id))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [paroquia.id, data, horario]);

  useEffect(() => {
    listarRecentes(paroquia.id).then(setRecentes).catch(() => undefined);
  }, [paroquia.id]);

  const paleta = liturgia ? PALETAS[corDaLiturgia(liturgia.cor)] : null;
  const nome = useMemo(() => (/^\d{2}:\d{2}$/.test(horario) ? nomeDaMissa(data, horario) : ""), [data, horario]);

  const gerar = async () => {
    if (!liturgia) return;
    setGerando(true);
    setErro(null);
    try {
      const estado = estadoInicial(data, liturgia.diaLiturgico ?? "", paroquia.textos, comMusica);
      const id = await criarCelebracao(paroquia.id, data, horario, estado);
      onAbrir(id);
    } catch (e) {
      setErro((e as Error).message ?? "Não foi possível criar a missa.");
      setGerando(false);
    }
  };

  return (
    <div className="nova-missa">
      <section className="card nova-missa__principal">
        <header className="nova-missa__cabecalho">
          <p className="section-eyebrow">Passo 1 de 2</p>
          <h2>Qual missa você vai preparar?</h2>
          <p className="nova-missa__ajuda">
            Escolha a data e o horário. A liturgia do dia, as orações e a estrutura do modelo da paróquia
            entram automaticamente — depois você ajusta o que quiser no editor.
          </p>
        </header>

        <div className="nova-missa__campos">
          <div className="campo-bloco">
            <label className="campo-bloco__rotulo" htmlFor="nm-data">
              Data
            </label>
            <div className="nova-missa__linha">
              <input
                id="nm-data"
                type="date"
                value={data}
                onChange={(e) => e.target.value && setData(e.target.value)}
              />
              <button type="button" className="ghost" onClick={() => setData(proximoDomingo())}>
                Próximo domingo
              </button>
              <button type="button" className="ghost" onClick={() => setData(isoLocal(new Date()))}>
                Hoje
              </button>
            </div>
            <small className="campo-bloco__dica">{dataPorExtenso(data)}</small>
          </div>

          <div className="campo-bloco">
            <span className="campo-bloco__rotulo">Horário</span>
            <div className="nova-missa__chips" role="radiogroup" aria-label="Horário">
              {horarios.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={!outroHorario && horario === h}
                  className={"chip-opcao" + (!outroHorario && horario === h ? " chip-opcao--ativo" : "")}
                  onClick={() => {
                    setOutroHorario(false);
                    setHorario(h);
                  }}
                >
                  {rotuloHorario(h)}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={outroHorario}
                className={"chip-opcao" + (outroHorario ? " chip-opcao--ativo" : "")}
                onClick={() => setOutroHorario(true)}
              >
                Outro
              </button>
              {outroHorario && (
                <input
                  type="time"
                  aria-label="Outro horário"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="campo-bloco">
            <span className="campo-bloco__rotulo">Músicas</span>
            <div className="nova-missa__segmentos" role="radiogroup" aria-label="Missa com ou sem música">
              <button
                type="button"
                role="radio"
                aria-checked={comMusica}
                className={"segmento" + (comMusica ? " segmento--ativo" : "")}
                onClick={() => setComMusica(true)}
              >
                <strong>♪ Com música</strong>
                <small>Abertura, ato penitencial, glória, aclamação, ofertório, santo, cordeiro e comunhão</small>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!comMusica}
                className={"segmento" + (!comMusica ? " segmento--ativo" : "")}
                onClick={() => setComMusica(false)}
              >
                <strong>Sem música</strong>
                <small>Só leituras, orações e avisos — como a missa das 10h</small>
              </button>
            </div>
          </div>
        </div>

        <aside className="nova-missa__liturgia" aria-live="polite">
          {carregandoLit && <p className="nova-missa__status">Buscando a liturgia…</p>}
          {erroLit && <p className="alerta-erro">⚠ {erroLit}</p>}
          {liturgia && !carregandoLit && paleta && (
            <>
              <div className="nova-missa__lit-topo">
                <span className="nova-missa__cor" style={{ background: paleta.amostra }} />
                <div>
                  <strong>{liturgia.diaLiturgico}</strong>
                  <small>Cor litúrgica: {paleta.rotulo}</small>
                </div>
              </div>
              <dl className="nova-missa__refs">
                {liturgia.primeiraLeitura?.referencia && (
                  <>
                    <dt>1ª Leitura</dt>
                    <dd>{referenciaPorExtenso(liturgia.primeiraLeitura.referencia)}</dd>
                  </>
                )}
                {liturgia.salmo?.referencia && (
                  <>
                    <dt>Salmo</dt>
                    <dd>{liturgia.salmo.referencia}</dd>
                  </>
                )}
                {liturgia.segundaLeitura?.referencia && (
                  <>
                    <dt>2ª Leitura</dt>
                    <dd>{referenciaPorExtenso(liturgia.segundaLeitura.referencia)}</dd>
                  </>
                )}
                {liturgia.evangelho?.referencia && (
                  <>
                    <dt>Evangelho</dt>
                    <dd>{referenciaPorExtenso(liturgia.evangelho.referencia)}</dd>
                  </>
                )}
              </dl>
            </>
          )}
        </aside>

        <footer className="nova-missa__rodape">
          {nome && <span className="nova-missa__arquivo">Arquivo: <strong>{nome}.pptx</strong></span>}
          {erro && <p className="alerta-erro">⚠ {erro}</p>}
          {existente ? (
            <div className="nova-missa__existente">
              <span>Já existe uma missa preparada para este dia e horário.</span>
              <button type="button" className="primary" onClick={() => onAbrir(existente)}>
                Abrir missa existente →
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="primary nova-missa__gerar"
              disabled={!liturgia || gerando || !/^\d{2}:\d{2}$/.test(horario)}
              onClick={gerar}
            >
              {gerando ? "Gerando…" : "Gerar slides →"}
            </button>
          )}
        </footer>
      </section>

      {recentes.length > 0 && (
        <section className="card nova-missa__recentes">
          <div className="card-header">
            <h3 className="card-title">Missas preparadas</h3>
          </div>
          <ul>
            {recentes.map((r) => (
              <li key={r.id}>
                <button type="button" className="nova-missa__recente" onClick={() => onAbrir(r.id)}>
                  <strong>{nomeDaMissa(r.data, r.horario)}</strong>
                  <small>{dataPorExtenso(r.data)}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
