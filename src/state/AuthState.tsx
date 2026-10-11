import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
 * Autenticação real via Supabase Auth.
 * No primeiro acesso, se o usuário ainda não pertence a nenhuma paróquia,
 * a paróquia informada no cadastro é criada e ele vira administrador dela.
 */

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  paroquia?: string;
  paroquiaId?: string;
  papel?: "admin" | "editor" | "leitor";
  iniciais: string;
  cadastradoEm: string;
}

interface AuthState {
  usuario: UsuarioAuth | null;
  /** true até a sessão salva ser verificada na abertura do app */
  iniciando: boolean;
  carregando: boolean;
  erro: string | null;
  /** Usuário chegou pelo link de "esqueci minha senha" */
  recuperandoSenha: boolean;
  login: (email: string, senha: string) => Promise<void>;
  /** Retorna true quando é preciso confirmar o e-mail antes de entrar */
  registrar: (input: {
    nome: string;
    email: string;
    senha: string;
    paroquia?: string;
  }) => Promise<boolean>;
  esqueciSenha: (email: string) => Promise<void>;
  definirNovaSenha: (senha: string) => Promise<void>;
  logout: () => void;
  limparErro: () => void;
}

const Ctx = createContext<AuthState | null>(null);

function gerarIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MENSAGENS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos."],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar (veja sua caixa de entrada)."],
  [/user already registered/i, "Este e-mail já está cadastrado. Tente entrar ou recuperar a senha."],
  [/password should be at least/i, "A senha precisa ter pelo menos 8 caracteres."],
  [/rate limit|too many requests|security purposes/i, "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
  [/unable to validate email|invalid email/i, "E-mail inválido."],
  [/new password should be different/i, "A nova senha precisa ser diferente da atual."],
  [/failed to fetch|network/i, "Sem conexão com o servidor. Verifique sua internet."],
];

function traduzir(e: unknown, padrao: string): string {
  const msg = (e as AuthError | Error | undefined)?.message ?? "";
  for (const [re, pt] of MENSAGENS) if (re.test(msg)) return pt;
  return msg || padrao;
}

// Evita criar a paróquia duas vezes quando getSession e SIGNED_IN chegam juntos
const emAndamento = new Map<string, Promise<UsuarioAuth>>();

function montarUsuario(user: User): Promise<UsuarioAuth> {
  const atual = emAndamento.get(user.id);
  if (atual) return atual;
  const p = carregarUsuario(user).finally(() => emAndamento.delete(user.id));
  emAndamento.set(user.id, p);
  return p;
}

async function carregarUsuario(user: User): Promise<UsuarioAuth> {
  const meta = (user.user_metadata ?? {}) as { nome?: string; paroquia?: string };
  const nome = meta.nome?.trim() || user.email?.split("@")[0] || "Usuário";

  let { data: vinculo } = await supabase
    .from("membros")
    .select("papel, paroquia_id, paroquias(nome)")
    .eq("user_id", user.id)
    .order("criado_em")
    .limit(1)
    .maybeSingle();

  // Primeiro acesso: cria a paróquia informada no cadastro
  if (!vinculo) {
    const { error } = await supabase.rpc("criar_paroquia", {
      nome: meta.paroquia?.trim() || "Minha paróquia",
    });
    if (error) throw error;
    ({ data: vinculo } = await supabase
      .from("membros")
      .select("papel, paroquia_id, paroquias(nome)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle());
  }

  return {
    id: user.id,
    nome,
    email: user.email ?? "",
    paroquia: vinculo?.paroquias?.nome,
    paroquiaId: vinculo?.paroquia_id,
    papel: vinculo?.papel,
    iniciais: gerarIniciais(nome),
    cadastradoEm: user.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [iniciando, setIniciando] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  useEffect(() => {
    let ativo = true;

    const aplicar = async (user: User | null) => {
      if (!user) {
        if (ativo) setUsuario(null);
        return;
      }
      try {
        const u = await montarUsuario(user);
        if (ativo) setUsuario(u);
      } catch (e) {
        if (ativo) setErro(traduzir(e, "Não foi possível carregar sua paróquia."));
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await aplicar(data.session?.user ?? null);
      if (ativo) setIniciando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "PASSWORD_RECOVERY") setRecuperandoSenha(true);
      if (evento === "SIGNED_OUT") setUsuario(null);
      if (evento === "SIGNED_IN" || evento === "USER_UPDATED") {
        // Fora do callback: o SDK não permite chamadas ao Supabase aqui dentro
        setTimeout(() => aplicar(sessao?.user ?? null), 0);
      }
    });

    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const limparErro = useCallback(() => setErro(null), []);

  const executar = useCallback(
    async <T,>(acao: () => Promise<T>, padrao: string): Promise<T> => {
      setCarregando(true);
      setErro(null);
      try {
        return await acao();
      } catch (e) {
        setErro(traduzir(e, padrao));
        throw e;
      } finally {
        setCarregando(false);
      }
    },
    [],
  );

  const login = useCallback(
    (email: string, senha: string) =>
      executar(async () => {
        if (!email || !senha) throw new Error("Informe e-mail e senha.");
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: senha,
        });
        if (error) throw error;
      }, "Não foi possível entrar."),
    [executar],
  );

  const registrar = useCallback(
    (input: { nome: string; email: string; senha: string; paroquia?: string }) =>
      executar(async () => {
        if (!input.nome.trim()) throw new Error("Informe seu nome.");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
          throw new Error("E-mail inválido.");
        }
        if (input.senha.length < 8) {
          throw new Error("Senha precisa ter pelo menos 8 caracteres.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim().toLowerCase(),
          password: input.senha,
          options: {
            data: { nome: input.nome.trim(), paroquia: input.paroquia?.trim() || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Sem sessão = o projeto exige confirmação por e-mail
        return !data.session;
      }, "Não foi possível cadastrar."),
    [executar],
  );

  const esqueciSenha = useCallback(
    (email: string) =>
      executar(async () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
      }, "Não foi possível enviar o e-mail."),
    [executar],
  );

  const definirNovaSenha = useCallback(
    (senha: string) =>
      executar(async () => {
        if (senha.length < 8) throw new Error("Senha precisa ter pelo menos 8 caracteres.");
        const { error } = await supabase.auth.updateUser({ password: senha });
        if (error) throw error;
        setRecuperandoSenha(false);
      }, "Não foi possível alterar a senha."),
    [executar],
  );

  const logout = useCallback(() => {
    void supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      usuario,
      iniciando,
      carregando,
      erro,
      recuperandoSenha,
      login,
      registrar,
      esqueciSenha,
      definirNovaSenha,
      logout,
      limparErro,
    }),
    [
      usuario,
      iniciando,
      carregando,
      erro,
      recuperandoSenha,
      login,
      registrar,
      esqueciSenha,
      definirNovaSenha,
      logout,
      limparErro,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fora de AuthProvider");
  return ctx;
}
