import { AuthShell } from "./AuthShell";
import type { TelaAuth } from "./tipos";
import "./Campos.css";

interface Props {
  onTrocarTela: (t: TelaAuth) => void;
}

export function ConfirmarEmailView({ onTrocarTela }: Props) {
  return (
    <AuthShell
      titulo="Confirme seu e-mail"
      subtitulo="Enviamos um link de confirmação para o e-mail cadastrado."
      rodape={
        <span>
          Já confirmou?{" "}
          <button type="button" className="linklike" onClick={() => onTrocarTela("login")}>
            Entrar
          </button>
        </span>
      }
    >
      <p className="alerta-sucesso">
        ✓ Conta criada! Abra o e-mail e clique no link para ativar sua conta. Depois disso
        você já entra direto no LumenSlide, com sua paróquia criada.
      </p>
      <ul
        style={{
          color: "var(--fg-muted)",
          fontSize: "0.85rem",
          paddingLeft: "1.1rem",
          margin: 0,
          lineHeight: 1.7,
        }}
      >
        <li>Confira a caixa de spam ou promoções, por garantia.</li>
        <li>O e-mail é enviado pelo Supabase (remetente &quot;Supabase Auth&quot;).</li>
      </ul>
    </AuthShell>
  );
}
