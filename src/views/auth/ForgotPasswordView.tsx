import { useState, type FormEvent } from "react";
import { AuthShell } from "./AuthShell";
import { useAuth } from "../../state/AuthState";
import type { TelaAuth } from "./tipos";
import "./Campos.css";

interface Props {
  onTrocarTela: (t: TelaAuth) => void;
  enviado?: boolean;
}

export function ForgotPasswordView({ onTrocarTela, enviado }: Props) {
  const { esqueciSenha, carregando, erro, limparErro } = useAuth();
  const [email, setEmail] = useState("");

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await esqueciSenha(email);
      onTrocarTela("esqueci-enviado");
    } catch {
      /* */
    }
  };

  if (enviado) {
    return (
      <AuthShell
        titulo="Verifique seu e-mail"
        subtitulo={
          email
            ? `Enviamos um link de redefinição para ${email}.`
            : "Enviamos um link de redefinição para o e-mail informado."
        }
        rodape={
          <span>
            Lembrou da senha?{" "}
            <button
              type="button"
              className="linklike"
              onClick={() => {
                limparErro();
                onTrocarTela("login");
              }}
            >
              Voltar para o login
            </button>
          </span>
        }
      >
        <p className="alerta-sucesso">
          ✓ Pronto! Se houver uma conta cadastrada com este e-mail, em alguns
          minutos chegará uma mensagem com instruções para criar uma nova senha.
          O link expira em 1 hora.
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
          <li>O remetente é <strong>no-reply@lumenslide.org</strong>.</li>
          <li>Não recebeu? Aguarde 5 minutos e tente novamente.</li>
        </ul>
        <button
          type="button"
          className="ghost btn-primario"
          onClick={() => onTrocarTela("esqueci")}
        >
          Reenviar e-mail
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      titulo="Esqueci minha senha"
      subtitulo="Informe seu e-mail e enviaremos um link para redefinir a senha."
      rodape={
        <span>
          Lembrou agora?{" "}
          <button
            type="button"
            className="linklike"
            onClick={() => {
              limparErro();
              onTrocarTela("login");
            }}
          >
            Voltar ao login
          </button>
        </span>
      }
    >
      <form className="form-grid" onSubmit={submeter} noValidate>
        {erro && <p className="alerta-erro">⚠ {erro}</p>}

        <div className="campo">
          <label htmlFor="esq-email">E-mail cadastrado</label>
          <input
            id="esq-email"
            type="email"
            autoComplete="email"
            placeholder="voce@paroquia.org.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="primary btn-primario"
          disabled={carregando}
        >
          {carregando ? "Enviando…" : "Enviar link de redefinição"}
        </button>
      </form>
    </AuthShell>
  );
}
