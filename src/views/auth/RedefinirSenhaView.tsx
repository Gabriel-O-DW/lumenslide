import { useState, type FormEvent } from "react";
import { AuthShell } from "./AuthShell";
import { useAuth } from "../../state/AuthState";
import "./Campos.css";

/** Exibida quando o usuário abre o link de "esqueci minha senha". */
export function RedefinirSenhaView() {
  const { definirNovaSenha, carregando, erro } = useAuth();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setErroLocal(null);
    if (senha !== confirmar) {
      setErroLocal("As senhas não conferem.");
      return;
    }
    try {
      await definirNovaSenha(senha);
    } catch {
      /* erro já no contexto */
    }
  };

  const erroExibido = erroLocal ?? erro;

  return (
    <AuthShell titulo="Criar nova senha" subtitulo="Escolha uma nova senha para sua conta.">
      <form className="form-grid" onSubmit={submeter} noValidate>
        {erroExibido && <p className="alerta-erro">⚠ {erroExibido}</p>}
        <div className="campo">
          <label htmlFor="nova-senha">Nova senha</label>
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
            autoFocus
          />
        </div>
        <div className="campo">
          <label htmlFor="nova-senha-confirmar">Confirmar nova senha</label>
          <input
            id="nova-senha-confirmar"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="primary btn-primario" disabled={carregando}>
          {carregando ? "Salvando…" : "Salvar nova senha"}
        </button>
      </form>
    </AuthShell>
  );
}
