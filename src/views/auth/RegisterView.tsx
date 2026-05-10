import { useMemo, useState, type FormEvent } from "react";
import { AuthShell } from "./AuthShell";
import { useAuth } from "../../state/AuthState";
import type { TelaAuth } from "./tipos";
import "./Campos.css";

interface Props {
  onTrocarTela: (t: TelaAuth) => void;
}

function calcularForca(senha: string): {
  nivel: 0 | 1 | 2 | 3 | 4;
  rotulo: string;
} {
  if (!senha) return { nivel: 0, rotulo: "—" };
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  const map: Record<number, string> = {
    0: "—",
    1: "Fraca",
    2: "Razoável",
    3: "Boa",
    4: "Forte",
  };
  return { nivel: pontos as 0 | 1 | 2 | 3 | 4, rotulo: map[pontos] };
}

export function RegisterView({ onTrocarTela }: Props) {
  const { registrar, carregando, erro, limparErro } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [paroquia, setParoquia] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const forca = useMemo(() => calcularForca(senha), [senha]);

  const submeter = async (e: FormEvent) => {
    e.preventDefault();
    setErroLocal(null);
    if (senha !== confirmar) {
      setErroLocal("As senhas não conferem.");
      return;
    }
    if (!aceiteTermos) {
      setErroLocal("Você precisa aceitar os termos de uso.");
      return;
    }
    try {
      await registrar({ nome, email, senha, paroquia });
    } catch {
      /* erro já no contexto */
    }
  };

  const erroExibido = erroLocal ?? erro;

  return (
    <AuthShell
      titulo="Criar nova conta"
      subtitulo="Comece a montar suas celebrações em poucos minutos. É grátis enquanto estamos em beta."
      rodape={
        <span>
          Já tem conta?{" "}
          <button
            type="button"
            className="linklike"
            onClick={() => {
              limparErro();
              onTrocarTela("login");
            }}
          >
            Entrar
          </button>
        </span>
      }
    >
      <form className="form-grid" onSubmit={submeter} noValidate>
        {erroExibido && <p className="alerta-erro">⚠ {erroExibido}</p>}

        <div className="campo">
          <label htmlFor="reg-nome">Nome completo</label>
          <input
            id="reg-nome"
            type="text"
            autoComplete="name"
            placeholder="Ex.: João Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="reg-email">E-mail</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="voce@paroquia.org.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="reg-paroquia">Paróquia (opcional)</label>
          <input
            id="reg-paroquia"
            type="text"
            placeholder="Ex.: Paróquia Nossa Senhora Rainha dos Apóstolos"
            value={paroquia}
            onChange={(e) => setParoquia(e.target.value)}
          />
        </div>

        <div className="campo">
          <label htmlFor="reg-senha">Senha</label>
          <div className="campo__senha">
            <input
              id="reg-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={8}
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
          <div
            className="indicador-forca"
            aria-label={`Força da senha: ${forca.rotulo}`}
          >
            <span className={forca.nivel >= 1 ? "on1" : ""} />
            <span className={forca.nivel >= 2 ? "on2" : ""} />
            <span className={forca.nivel >= 3 ? "on3" : ""} />
            <span className={forca.nivel >= 4 ? "on4" : ""} />
          </div>
          <div className="forca-label">Força: {forca.rotulo}</div>
        </div>

        <div className="campo">
          <label htmlFor="reg-confirm">Confirmar senha</label>
          <input
            id="reg-confirm"
            type={mostrarSenha ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="form-row">
          <label>
            <input
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
            />
            Li e aceito os <a href="#">Termos de uso</a> e a{" "}
            <a href="#">Política de privacidade</a>.
          </label>
        </div>

        <button
          type="submit"
          className="primary btn-primario"
          disabled={carregando}
        >
          {carregando ? "Criando conta…" : "Criar minha conta"}
        </button>
      </form>
    </AuthShell>
  );
}
