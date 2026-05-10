import { useEffect, useRef, useState } from "react";
import "./RichTextEditor.css";

interface Props {
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const FONTES = [
  { rotulo: "Lato (paroquial)", valor: "'Lato', 'Helvetica Neue', Arial, sans-serif" },
  { rotulo: "Inter (sans-serif)", valor: "Inter, system-ui, sans-serif" },
  { rotulo: "Garamond (clássica)", valor: "Garamond, 'Iowan Old Style', serif" },
  { rotulo: "Cinzel (decorativa)", valor: "Cinzel, serif" },
  { rotulo: "Times", valor: "'Times New Roman', Times, serif" },
];

const TAMANHOS = [
  { rotulo: "P", valor: "2", px: "12px" },
  { rotulo: "M", valor: "3", px: "16px" },
  { rotulo: "G", valor: "5", px: "24px" },
  { rotulo: "GG", valor: "6", px: "32px" },
  { rotulo: "XG", valor: "7", px: "48px" },
];

const CORES = [
  "#262626", "#0070c0", "#9b8053", "#1f6fb8",
  "#a4262c", "#2f7a3c", "#6d2a8a", "#d4a437",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 280,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [tamanho, setTamanho] = useState("3");
  const [fonte, setFonte] = useState(FONTES[0].valor);
  const ultimoHtmlRef = useRef<string>(value);

  // Sincroniza o valor inicial / quando muda externamente
  useEffect(() => {
    if (!ref.current) return;
    if (value !== ultimoHtmlRef.current) {
      ref.current.innerHTML = value;
      ultimoHtmlRef.current = value;
    }
  }, [value]);

  // Estado vazio (placeholder)
  const [vazio, setVazio] = useState(!value);
  useEffect(() => {
    setVazio(!value || value === "<br>" || value === "<p></p>");
  }, [value]);

  function exec(comando: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(comando, false, arg);
    sincronizar();
  }

  function sincronizar() {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    ultimoHtmlRef.current = html;
    onChange(html);
    setVazio(!ref.current.textContent?.trim());
  }

  function inserirResposta() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !ref.current) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "rta-resposta";
    if (sel.toString().trim()) {
      span.textContent = sel.toString();
      range.deleteContents();
    } else {
      span.textContent = "Resposta da assembleia";
    }
    range.insertNode(span);
    range.setStartAfter(span);
    range.setEndAfter(span);
    sel.removeAllRanges();
    sel.addRange(range);
    sincronizar();
  }

  function aplicarFonte(v: string) {
    setFonte(v);
    exec("fontName", v);
  }

  function aplicarTamanho(v: string) {
    setTamanho(v);
    exec("fontSize", v);
  }

  function aplicarCor(v: string) {
    exec("foreColor", v);
  }

  return (
    <div className="rte" style={{ "--rte-min-h": `${minHeight}px` } as React.CSSProperties}>
      <div className="rte__toolbar" role="toolbar" aria-label="Formatação">
        <select
          aria-label="Fonte"
          value={fonte}
          onChange={(e) => aplicarFonte(e.target.value)}
          className="rte__select"
        >
          {FONTES.map((f) => (
            <option key={f.valor} value={f.valor}>
              {f.rotulo}
            </option>
          ))}
        </select>

        <select
          aria-label="Tamanho"
          value={tamanho}
          onChange={(e) => aplicarTamanho(e.target.value)}
          className="rte__select rte__select--small"
        >
          {TAMANHOS.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.rotulo}
            </option>
          ))}
        </select>

        <span className="rte__sep" />

        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} aria-label="Negrito" title="Negrito (Ctrl+B)">
          <strong>B</strong>
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} aria-label="Itálico" title="Itálico (Ctrl+I)">
          <em>I</em>
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} aria-label="Sublinhado" title="Sublinhado (Ctrl+U)">
          <u>S</u>
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("strikeThrough")} aria-label="Tachado">
          <s>T</s>
        </button>

        <span className="rte__sep" />

        <div className="rte__cores" aria-label="Cor do texto">
          {CORES.map((c) => (
            <button
              key={c}
              type="button"
              className="rte__cor"
              style={{ background: c }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => aplicarCor(c)}
              aria-label={`Cor ${c}`}
              title={c}
            />
          ))}
          <input
            type="color"
            className="rte__cor-input"
            onChange={(e) => aplicarCor(e.target.value)}
            aria-label="Cor personalizada"
            title="Cor personalizada"
          />
        </div>

        <span className="rte__sep" />

        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} aria-label="Alinhar à esquerda">
          ⇤
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} aria-label="Centralizar">
          ↔
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} aria-label="Alinhar à direita">
          ⇥
        </button>

        <span className="rte__sep" />

        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} aria-label="Lista">
          • —
        </button>
        <button type="button" className="rte__btn" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} aria-label="Lista numerada">
          1.
        </button>

        <span className="rte__sep" />

        <button
          type="button"
          className="rte__btn rte__btn--gold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={inserirResposta}
          title="Marcar trecho como resposta da assembleia"
        >
          ℟ Resposta
        </button>

        <button type="button" className="rte__btn rte__btn--ghost" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")} title="Limpar formatação">
          ⌫ Limpar
        </button>
      </div>

      <div
        ref={ref}
        className={"rte__area" + (vazio ? " rte__area--vazio" : "")}
        contentEditable
        suppressContentEditableWarning
        onInput={sincronizar}
        onBlur={sincronizar}
        data-placeholder={placeholder ?? "Digite o conteúdo do slide…"}
        spellCheck
      />
    </div>
  );
}
