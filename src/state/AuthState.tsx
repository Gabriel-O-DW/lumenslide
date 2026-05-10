import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Auth simulado (mock 100% client-side).
 * Quando o backend chegar (ver docs/BACKEND_API.md §2), esta camada vira
 * um wrapper de chamadas reais a /auth/login, /auth/register etc.
 */

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  paroquia?: string;
  iniciais: string;
  cadastradoEm: string;
}

interface AuthState {
  usuario: UsuarioAuth | null;
  carregando: boolean;
  erro: string | null;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (input: {
    nome: string;
    email: string;
    senha: string;
    paroquia?: string;
  }) => Promise<void>;
  esqueciSenha: (email: string) => Promise<void>;
  logout: () => void;
  limparErro: () => void;
}

const Ctx = createContext<AuthState | null>(null);

const STORAGE_KEY = "lumenslide.auth.user.v1";

function gerarIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function carregarUsuario(): UsuarioAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UsuarioAuth;
    if (parsed && parsed.email && parsed.nome) return parsed;
    return null;
  } catch {
    return null;
  }
}

function salvarUsuario(u: UsuarioAuth | null) {
  try {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Simula latência de rede para o feedback ficar realista
function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(() =>
    carregarUsuario(),
  );
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    salvarUsuario(usuario);
  }, [usuario]);

  const limparErro = useCallback(() => setErro(null), []);

  const login = useCallback(async (email: string, senha: string) => {
    setCarregando(true);
    setErro(null);
    try {
      await delay(700);
      if (!email || !senha) {
        throw new Error("Informe e-mail e senha.");
      }
      if (senha.length < 6) {
        throw new Error("Senha inválida (mínimo 6 caracteres).");
      }
      // Mock: aceita qualquer credencial válida
      const nomePalpite =
        email.split("@")[0].replace(/[._-]+/g, " ").trim() || "Usuário";
      const u: UsuarioAuth = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        nome: nomePalpite
          .split(" ")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" "),
        email,
        iniciais: gerarIniciais(nomePalpite),
        cadastradoEm: new Date().toISOString(),
      };
      setUsuario(u);
    } catch (e) {
      setErro((e as Error).message ?? "Não foi possível entrar.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }, []);

  const registrar = useCallback(
    async (input: {
      nome: string;
      email: string;
      senha: string;
      paroquia?: string;
    }) => {
      setCarregando(true);
      setErro(null);
      try {
        await delay(900);
        if (!input.nome.trim()) throw new Error("Informe seu nome.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
          throw new Error("E-mail inválido.");
        }
        if (input.senha.length < 8) {
          throw new Error("Senha precisa ter pelo menos 8 caracteres.");
        }
        const u: UsuarioAuth = {
          id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          nome: input.nome.trim(),
          email: input.email.trim().toLowerCase(),
          paroquia: input.paroquia?.trim() || undefined,
          iniciais: gerarIniciais(input.nome),
          cadastradoEm: new Date().toISOString(),
        };
        setUsuario(u);
      } catch (e) {
        setErro((e as Error).message ?? "Não foi possível cadastrar.");
        throw e;
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  const esqueciSenha = useCallback(async (email: string) => {
    setCarregando(true);
    setErro(null);
    try {
      await delay(800);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("E-mail inválido.");
      }
      // Mock — backend real responderia 204 sempre (não vaza se existe)
    } catch (e) {
      setErro((e as Error).message ?? "Não foi possível enviar o e-mail.");
      throw e;
    } finally {
      setCarregando(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUsuario(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      usuario,
      carregando,
      erro,
      login,
      registrar,
      esqueciSenha,
      logout,
      limparErro,
    }),
    [usuario, carregando, erro, login, registrar, esqueciSenha, logout, limparErro],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}
