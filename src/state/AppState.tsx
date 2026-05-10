import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buscarLiturgia } from "../services/liturgia";
import { temasDisponiveis } from "../data/temas";
import { musicasMock } from "../data/musicas";
import type { LiturgiaDiaria } from "../types/liturgia";
import type { Tema } from "../types/tema";
import type { Musica } from "../types/musica";

interface AppState {
  dataSelecionada: string;
  setDataSelecionada: (d: string) => void;

  liturgia: LiturgiaDiaria | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;

  temaAtivo: Tema;
  setTemaAtivo: (t: Tema) => void;
  temas: Tema[];

  musicas: Musica[];
  musicasSelecionadas: string[];
  alternarMusica: (id: string) => void;

  composicao: {
    leituras: boolean;
    canticos: boolean;
    ritos: boolean;
    cantos: boolean;
    respostasDestaque: boolean;
  };
  alternarComposicao: (k: keyof AppState["composicao"]) => void;
}

const Ctx = createContext<AppState | null>(null);

function hojeIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [dataSelecionada, setDataSelecionada] = useState<string>(hojeIso());
  const [liturgia, setLiturgia] = useState<LiturgiaDiaria | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [temaAtivo, setTemaAtivo] = useState<Tema>(temasDisponiveis[0]);
  const [musicasSelecionadas, setMusicasSelecionadas] = useState<string[]>([
    musicasMock[0].id,
    musicasMock[1].id,
  ]);

  const [composicao, setComposicao] = useState({
    leituras: true,
    canticos: true,
    ritos: true,
    cantos: true,
    respostasDestaque: true,
  });

  const carregar = useCallback(async (data: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const lit = await buscarLiturgia(data);
      setLiturgia(lit);
    } catch (e) {
      setErro(
        (e as Error).message ??
          "Não foi possível carregar a liturgia para esta data.",
      );
      setLiturgia(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(dataSelecionada);
  }, [dataSelecionada, carregar]);

  const alternarMusica = useCallback((id: string) => {
    setMusicasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const alternarComposicao = useCallback(
    (k: keyof AppState["composicao"]) => {
      setComposicao((prev) => ({ ...prev, [k]: !prev[k] }));
    },
    [],
  );

  const value = useMemo<AppState>(
    () => ({
      dataSelecionada,
      setDataSelecionada,
      liturgia,
      carregando,
      erro,
      recarregar: () => carregar(dataSelecionada),
      temaAtivo,
      setTemaAtivo,
      temas: temasDisponiveis,
      musicas: musicasMock,
      musicasSelecionadas,
      alternarMusica,
      composicao,
      alternarComposicao,
    }),
    [
      dataSelecionada,
      liturgia,
      carregando,
      erro,
      carregar,
      temaAtivo,
      musicasSelecionadas,
      alternarMusica,
      composicao,
      alternarComposicao,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState fora de AppStateProvider");
  return ctx;
}
