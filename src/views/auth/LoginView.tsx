import { useState, type FormEvent } from "react";
import { AuthShell } from "./AuthShell";
import { useAuth } from "../../state/AuthState";
import type { TelaAuth } from "./tipos";
import "./Campos.css";

interface Props {
  onTrocarTela: (t: TelaAuth) => void;
}

export function LoginView({ onTrocarTela }: Props) {
  const { login, carregando, erro, limparErro } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState(true);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, senha);
    } catch {
      /* erro já está no contexto */
    }
  };

  return (
    <AuthShell
      titulo="Bem-vindo de volta"
      subtitulo="Entre com sua conta para continuar montando suas celebrações."
      rodape={
        <span>
          Não tem conta?{" "}
          <button
            type="button"
            className="linklike"
            onClick={() => {
              limparErro();
              onTrocarTela("registrar");
            }}
          >
            Criar conta
          </button>
        </span>
      }
    >
      <form className="form-grid" onSubmit={submeter} noValidate>
        {erro && <p className="alerta-erro">⚠ {erro}</p>}

        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="voce@paroquia.org.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <div className="campo__senha">
            <input
              id="login-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="campo__senha-toggle"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? "○" : "●"}
            </button>
          </div>
        </div>

        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            Lembrar de mim
          </label>
          <button
            type="button"
            className="linklike"
            onClick={() => {
              limparErro();
              onTrocarTela("esqueci");
            }}
          >
            Esqueci minha senha
          </button>
        </div>

        <button
          type="submit"
          className="primary btn-primario"
          disabled={carregando}
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>

        <div className="divisor">ou</div>
        <div className="botoes-sociais">
          <button type="button" className="botao-social" disabled>
            <span className="social-ic">G</span> Google
          </button>
          <button type="button" className="botao-social" disabled>
            <span className="social-ic">M</span> Microsoft
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
