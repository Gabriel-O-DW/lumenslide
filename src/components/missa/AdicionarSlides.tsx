import { useEffect, useRef, useState } from "react";
import { NOMES_BLOCO, type Secao } from "../../missa/gerador";
import { MARCA_CREIO, extrairRespostas } from "../../missa/parsers";
import { enviarImagem } from "../../missa/imagens";
import { excluirBloco, listarBlocos, salvarBloco, type BlocoSalvo } from "../../missa/dados";
import type { EstiloFaixa, TelaExtra, TipoBloco } from "../../missa/tipos";
import "./AdicionarSlides.css";

interface Props {
  paroquiaId: string;
  secoes: Secao[];
  /** Seção depois da qual o bloco entra (pré-selecionada) */
  depoisDe: string;
  /** Bloco existente sendo editado */
  editando?: TelaExtra;
  onConfirmar: (bloco: TelaExtra) => void;
  onFechar: () => void;
}

type Aba = TipoBloco | "biblioteca";

const TIPOS: { tipo: Aba; icone: string; descricao: string }[] = [
  { tipo: "musica", icone: "♪", descricao: "Título na faixa e a letra; cada estrofe vira um slide" },
  { tipo: "texto", icone: "¶", descricao: "Oração, salmo, Liturgia das Horas… linha em branco = novo slide" },
  { tipo: "respostas", icone: "℟", descricao: "Só as respostas do povo, uma por slide (ritos especiais)" },
  { tipo: "imagem", icone: "▣", descricao: "Uma ou mais imagens em tela cheia" },
  { tipo: "branco", icone: "▢", descricao: "Tela vazia (pausa)" },
  { tipo: "biblioteca", icone: "★", descricao: "Blocos salvos da paróquia para reaproveitar" },
];

const ROTULO_ABA: Record<Aba, string> = { ...NOMES_BLOCO, biblioteca: "Da biblioteca" };

export function AdicionarSlides({ paroquiaId, secoes, depoisDe, editando, onConfirmar, onFechar }: Props) {
  const [aba, setAba] = useState<Aba>(editando?.tipo ?? "musica");
  const [posicao, setPosicao] = useState(editando?.depoisDe ?? depoisDe);
  const [nome, setNome] = useState(editando?.nome ?? "");
  const [titulo, setTitulo] = useState(editando?.titulo ?? "");
  const [texto, setTexto] = useState(editando?.texto ?? "");
  const [faixa, setFaixa] = useState<EstiloFaixa>(editando?.faixa ?? "liturgica");
  const [brancoEntre, setBrancoEntre] = useState(editando?.brancoEntre ?? true);
  const [imagens, setImagens] = useState<string[]>(editando?.imagens ?? (editando?.imagem ? [editando.imagem] : []));
  const [rito, setRito] = useState("");
  const [salvarNaBiblioteca, setSalvarNaBiblioteca] = useState(false);
  const [biblioteca, setBiblioteca] = useState<BlocoSalvo[] | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputImagem = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aba === "biblioteca" && !biblioteca) {
      listarBlocos(paroquiaId)
        .then(setBiblioteca)
        .catch((e: Error) => setErro(e.message));
    }
  }, [aba, biblioteca, paroquiaId]);

  // Fecha com Esc
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  // Faixa padrão de cada tipo: música na cor do dia, texto/respostas no azul das orações
  const escolherAba = (t: Aba) => {
    setAba(t);
    setErro(null);
    if (!editando && (t === "texto" || t === "respostas")) setFaixa("fixa");
    if (!editando && t === "musica") setFaixa("liturgica");
  };

  const extrair = () => {
    const respostas = extrairRespostas(rito);
    if (!respostas.length) {
      setErro("Não encontrei respostas. O texto precisa indicar quem fala (ex.: “Todos:”, “Candidatos:”, “AS:”).");
      return;
    }
    setErro(null);
    setTexto(respostas.join("\n"));
  };

  const enviar = async (arquivos: FileList | null) => {
    if (!arquivos?.length) return;
    setOcupado(true);
    try {
      const novos: string[] = [];
      for (const arq of arquivos) novos.push(await enviarImagem(paroquiaId, "extras", arq));
      setImagens((atual) => [...atual, ...novos]);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
      if (inputImagem.current) inputImagem.current.value = "";
    }
  };

  const usarDaBiblioteca = (b: BlocoSalvo) =>
    onConfirmar({
      id: editando?.id ?? `extra-${Date.now().toString(36)}`,
      depoisDe: posicao,
      tipo: b.tipo,
      nome: b.nome,
      titulo: b.dados.titulo,
      texto: b.dados.texto,
      faixa: b.dados.faixa,
      brancoEntre: b.dados.brancoEntre,
    });

  const confirmar = async () => {
    if (aba === "biblioteca") return;
    if ((aba === "musica" || aba === "texto" || aba === "respostas") && !texto.trim()) {
      setErro(aba === "respostas" ? "Escreva ao menos uma resposta." : "Escreva o texto do bloco.");
      return;
    }
    if (aba === "imagem" && !imagens.length) {
      setErro("Envie ao menos uma imagem.");
      return;
    }
    const bloco: TelaExtra = {
      id: editando?.id ?? `extra-${Date.now().toString(36)}`,
      depoisDe: posicao,
      tipo: aba,
      nome: nome.trim() || undefined,
      titulo: titulo.trim() || undefined,
      texto: aba === "imagem" || aba === "branco" ? undefined : texto,
      imagens: aba === "imagem" ? imagens : undefined,
      faixa: aba === "musica" || aba === "texto" || aba === "respostas" ? faixa : undefined,
      brancoEntre: aba === "respostas" ? brancoEntre : undefined,
    };
    if (salvarNaBiblioteca && (aba === "musica" || aba === "texto" || aba === "respostas")) {
      setOcupado(true);
      try {
        await salvarBloco(paroquiaId, {
          nome: nome.trim() || titulo.trim() || NOMES_BLOCO[aba],
          tipo: aba,
          dados: { titulo: bloco.titulo, texto: bloco.texto, faixa: bloco.faixa, brancoEntre: bloco.brancoEntre },
        });
      } catch (e) {
        setErro(`Não foi possível salvar na biblioteca: ${(e as Error).message}`);
        setOcupado(false);
        return;
      }
    }
    onConfirmar(bloco);
  };

  const qtdRespostas = texto.split("\n").filter((l) => l.trim()).length;

  return (
    <div className="adicionar-fundo" onMouseDown={(ev) => ev.target === ev.currentTarget && onFechar()}>
      <div className="adicionar" role="dialog" aria-modal="true" aria-labelledby="adicionar-titulo">
        <header className="adicionar__cab">
          <h2 id="adicionar-titulo">{editando ? "Editar bloco de slides" : "Adicionar slides"}</h2>
          <button type="button" className="ghost adicionar__fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="adicionar__corpo">
          <nav className="adicionar__tipos" aria-label="Tipo de slide">
            {TIPOS.filter((t) => !editando || t.tipo !== "biblioteca").map((t) => (
              <button
                key={t.tipo}
                type="button"
                className={"adicionar__tipo" + (aba === t.tipo ? " adicionar__tipo--ativo" : "")}
                onClick={() => escolherAba(t.tipo)}
              >
                <span className="adicionar__icone" aria-hidden>
                  {t.icone}
                </span>
                <span>
                  <strong>{ROTULO_ABA[t.tipo]}</strong>
                  <small>{t.descricao}</small>
                </span>
              </button>
            ))}
          </nav>

          <section className="adicionar__form">
            <label className="adicionar__campo">
              <span>Entra depois de</span>
              <select value={posicao} onChange={(ev) => setPosicao(ev.target.value)}>
                {secoes
                  .filter((s) => s.id !== editando?.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.rotulo}
                    </option>
                  ))}
              </select>
            </label>

            {aba === "biblioteca" && (
              <div className="adicionar__biblioteca">
                {!biblioteca && <p className="adicionar__nota">Carregando…</p>}
                {biblioteca?.length === 0 && (
                  <p className="adicionar__nota">
                    Nenhum bloco salvo ainda. Ao criar uma música, texto ou rito, marque “Salvar na biblioteca” para
                    reaproveitar depois.
                  </p>
                )}
                <ul>
                  {biblioteca?.map((b) => (
                    <li key={b.id}>
                      <button type="button" className="adicionar__item" onClick={() => usarDaBiblioteca(b)}>
                        <strong>{b.nome}</strong>
                        <small>
                          {NOMES_BLOCO[b.tipo]} · {(b.dados.texto ?? "").split("\n").filter(Boolean).length} linhas
                        </small>
                      </button>
                      <button
                        type="button"
                        className="ghost adicionar__excluir"
                        title="Excluir da biblioteca"
                        aria-label={`Excluir ${b.nome} da biblioteca`}
                        onClick={async () => {
                          if (!window.confirm(`Excluir “${b.nome}” da biblioteca?`)) return;
                          await excluirBloco(b.id);
                          setBiblioteca((l) => l?.filter((x) => x.id !== b.id) ?? null);
                        }}
                      >
                        🗑
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(aba === "musica" || aba === "texto" || aba === "respostas") && (
              <>
                <div className="adicionar__dupla">
                  <label className="adicionar__campo">
                    <span>{aba === "respostas" ? "Título na faixa (opcional)" : "Título na faixa"}</span>
                    <input
                      value={titulo}
                      onChange={(ev) => setTitulo(ev.target.value.toUpperCase())}
                      placeholder={aba === "musica" ? "CANTO DE ENTRADA DOS MINISTROS" : aba === "texto" ? "LITURGIA DAS HORAS" : "RITO DE INVESTIDURA"}
                    />
                  </label>
                  <label className="adicionar__campo">
                    <span>Cor da faixa</span>
                    <div className="adicionar__segmentos">
                      <button type="button" className={faixa === "liturgica" ? "ativo" : ""} onClick={() => setFaixa("liturgica")}>
                        Cor do dia
                      </button>
                      <button type="button" className={faixa === "fixa" ? "ativo" : ""} onClick={() => setFaixa("fixa")}>
                        Azul (orações)
                      </button>
                    </div>
                  </label>
                </div>

                {aba === "respostas" && (
                  <details className="adicionar__rito" open={!editando && !texto}>
                    <summary>Colar o rito inteiro e extrair as respostas automaticamente</summary>
                    <textarea
                      rows={6}
                      value={rito}
                      onChange={(ev) => setRito(ev.target.value)}
                      placeholder={"Bispo: Quereis empenhar-vos…?\nCandidatos: Quero.\nTodos: Amém!"}
                    />
                    <button type="button" onClick={extrair} disabled={!rito.trim()}>
                      Extrair respostas ↓
                    </button>
                  </details>
                )}

                <label className="adicionar__campo">
                  <span>
                    {aba === "musica" && "Letra (linha em branco = novo slide)"}
                    {aba === "texto" && "Texto (linha em branco = novo slide)"}
                    {aba === "respostas" && `Respostas — uma por linha, cada uma vira um slide (${qtdRespostas})`}
                  </span>
                  <textarea
                    rows={aba === "respostas" ? 9 : 12}
                    value={texto}
                    onChange={(ev) => setTexto(ev.target.value)}
                    placeholder={aba === "respostas" ? "Amém!\nQuero.\nSim, comprometo." : ""}
                  />
                </label>

                {aba === "respostas" && (
                  <>
                    <p className="adicionar__nota">
                      Escreva <code>{MARCA_CREIO}</code> numa linha para inserir ali os slides da Profissão de fé.
                    </p>
                    <label className="adicionar__check">
                      <input type="checkbox" checked={brancoEntre} onChange={(ev) => setBrancoEntre(ev.target.checked)} />
                      Tela em branco entre uma resposta e outra
                    </label>
                  </>
                )}

                <div className="adicionar__dupla">
                  <label className="adicionar__campo">
                    <span>Nome na lista de telas</span>
                    <input value={nome} onChange={(ev) => setNome(ev.target.value)} placeholder="Ex.: Investidura dos ministros" />
                  </label>
                  {!editando && (
                    <label className="adicionar__check adicionar__check--alinhado">
                      <input
                        type="checkbox"
                        checked={salvarNaBiblioteca}
                        onChange={(ev) => setSalvarNaBiblioteca(ev.target.checked)}
                      />
                      Salvar na biblioteca para usar em outras missas
                    </label>
                  )}
                </div>
              </>
            )}

            {aba === "imagem" && (
              <div className="adicionar__imagens">
                {imagens.map((c) => (
                  <span key={c} className="adicionar__imagem">
                    {c.split("/").pop()}
                    <button type="button" aria-label="Remover" onClick={() => setImagens((l) => l.filter((x) => x !== c))}>
                      ×
                    </button>
                  </span>
                ))}
                <button type="button" onClick={() => inputImagem.current?.click()} disabled={ocupado}>
                  {ocupado ? "Enviando…" : "+ Escolher imagens"}
                </button>
                <input
                  ref={inputImagem}
                  type="file"
                  hidden
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(ev) => enviar(ev.target.files)}
                />
              </div>
            )}

            {aba === "branco" && <p className="adicionar__nota">Uma tela vazia será inserida nessa posição.</p>}

            {erro && <p className="alerta-erro">⚠ {erro}</p>}
          </section>
        </div>

        {aba !== "biblioteca" && (
          <footer className="adicionar__rodape">
            <button type="button" className="ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="button" className="primary" onClick={confirmar} disabled={ocupado}>
              {editando ? "Salvar alterações" : "Adicionar slides"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
