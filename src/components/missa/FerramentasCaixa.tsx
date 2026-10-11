import type { MouseEvent as ReactMouseEvent } from "react";
import { ALTURA, LARGURA, nomeDaCaixa, type Caixa } from "../../missa/layout";
import { FONTES } from "../../missa/tema";
import type { EstiloCaixa, FonteSlide } from "../../missa/tipos";
import "./FerramentasCaixa.css";

interface Props {
  caixa: Caixa;
  estilo: EstiloCaixa | undefined;
  onEstilo: (patch: EstiloCaixa) => void;
  onRestaurar: () => void;
  variante: "flutuante" | "painel";
}

/** Botões de ferramenta não roubam o foco do texto em edição (mantém a seleção) */
const manterFoco = (ev: ReactMouseEvent) => ev.preventDefault();

/** Seleção de texto não vazia dentro do campo em edição desta caixa */
function selecaoNoCampo(campo: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.anchorNode) return false;
  const el = sel.anchorNode instanceof Element ? sel.anchorNode : sel.anchorNode.parentElement;
  return Boolean(el?.closest(`[data-campo="${campo}"]`));
}

/** Salva o texto em edição antes de mudar a formatação da caixa inteira */
function concluirEdicao(): Promise<void> {
  const ativo = document.activeElement as HTMLElement | null;
  if (ativo?.isContentEditable) ativo.blur();
  return new Promise((r) => setTimeout(r, 0));
}

export function FerramentasCaixa({ caixa, estilo, onEstilo, onRestaurar, variante }: Props) {
  const texto = caixa.tipo === "texto" ? caixa : null;
  const ajustado = Boolean(estilo && Object.keys(estilo).length);

  const formatar = async (prop: "negrito" | "italico") => {
    if (!texto) return;
    // Com um trecho selecionado, formata só o trecho; senão, a caixa inteira
    if (selecaoNoCampo(texto.campo)) {
      document.execCommand(prop === "negrito" ? "bold" : "italic");
      return;
    }
    await concluirEdicao();
    const valor = !(prop === "negrito" ? texto.negrito : texto.italico);
    const trechos = estilo?.trechos?.map((t) => (prop === "negrito" ? { ...t, b: valor } : { ...t, i: valor }));
    onEstilo({ [prop]: valor, ...(trechos ? { trechos } : {}) });
  };

  const tamanho = (delta: number) => texto && onEstilo({ tamanho: Math.max(8, Math.min(140, texto.tamanho + delta)) });

  const pct = (v: number, total: number) => Math.round((v / total) * 1000) / 10;
  const dePct = (v: number, total: number) => Math.round(((v / 100) * total) * 100) / 100;

  return (
    <div className={`ferramentas ferramentas--${variante}`}>
      {variante === "painel" && <div className="ferramentas__nome">{nomeDaCaixa(caixa)}</div>}

      {texto && (
        <div className="ferramentas__grupo">
          <select
            className="ferramentas__fonte"
            aria-label="Fonte"
            value={texto.fonte}
            onChange={(ev) => onEstilo({ fonte: ev.target.value as FonteSlide })}
          >
            {(Object.keys(FONTES) as FonteSlide[]).map((f) => (
              <option key={f} value={f} style={{ fontFamily: FONTES[f].css }}>
                {FONTES[f].nome}
              </option>
            ))}
          </select>

          <div className="ferramentas__tamanho" role="group" aria-label="Tamanho da fonte">
            <button type="button" onMouseDown={manterFoco} onClick={() => tamanho(-2)} title="Diminuir fonte">
              −
            </button>
            <input
              type="number"
              min={8}
              max={140}
              value={texto.tamanho}
              aria-label="Tamanho em pontos"
              onChange={(ev) => {
                const n = parseInt(ev.target.value, 10);
                if (n >= 8 && n <= 140) onEstilo({ tamanho: n });
              }}
            />
            <button type="button" onMouseDown={manterFoco} onClick={() => tamanho(2)} title="Aumentar fonte">
              +
            </button>
          </div>

          <div className="ferramentas__botoes" role="group" aria-label="Estilo">
            <button
              type="button"
              className={"ferramentas__b" + (texto.negrito ? " ativo" : "")}
              onMouseDown={manterFoco}
              onClick={() => formatar("negrito")}
              title="Negrito (selecione um trecho para aplicar só nele)"
            >
              B
            </button>
            <button
              type="button"
              className={"ferramentas__i" + (texto.italico ? " ativo" : "")}
              onMouseDown={manterFoco}
              onClick={() => formatar("italico")}
              title="Itálico (selecione um trecho para aplicar só nele)"
            >
              I
            </button>
          </div>

          <div className="ferramentas__botoes" role="group" aria-label="Alinhamento">
            {(
              [
                ["left", "⯇", "Alinhar à esquerda"],
                ["center", "≡", "Centralizar"],
                ["right", "⯈", "Alinhar à direita"],
              ] as const
            ).map(([valor, icone, titulo]) => (
              <button
                key={valor}
                type="button"
                className={texto.alinhamento === valor ? "ativo" : ""}
                onMouseDown={manterFoco}
                onClick={() => onEstilo({ alinhamento: valor })}
                title={titulo}
              >
                {icone}
              </button>
            ))}
          </div>

          <label className="ferramentas__cor" title="Cor do texto">
            <span style={{ background: `#${texto.cor}` }} />
            <input
              type="color"
              value={`#${texto.cor}`}
              onChange={(ev) => onEstilo({ cor: ev.target.value.slice(1).toUpperCase() })}
            />
          </label>
        </div>
      )}

      {variante === "painel" && (
        <div className="ferramentas__posicao">
          {(
            [
              ["x", "Esquerda", LARGURA],
              ["y", "Topo", ALTURA],
              ["w", "Largura", LARGURA],
              ["h", "Altura", ALTURA],
            ] as const
          ).map(([k, rotulo, total]) => (
            <label key={k}>
              <span>{rotulo} %</span>
              <input
                type="number"
                step={0.5}
                value={pct(caixa[k], total)}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value);
                  if (!Number.isNaN(v)) onEstilo({ [k]: dePct(v, total) });
                }}
              />
            </label>
          ))}
        </div>
      )}

      {ajustado && (
        <button type="button" className="ferramentas__restaurar" onMouseDown={manterFoco} onClick={onRestaurar} title="Volta a caixa ao padrão do modelo">
          ↺ {variante === "painel" ? "Restaurar esta caixa" : ""}
        </button>
      )}
      {variante === "painel" && texto && (
        <p className="ferramentas__dica">Selecione um trecho do texto para aplicar negrito ou itálico só nele.</p>
      )}
    </div>
  );
}
