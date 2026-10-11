import { useCallback, useEffect, useState } from "react";
import { carregarParoquia, type DadosParoquia } from "./dados";

/** Dados da paróquia do usuário (textos fixos, horários, Instagram) */
export function useParoquia(paroquiaId: string | undefined) {
  const [paroquia, setParoquia] = useState<DadosParoquia | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(() => {
    if (!paroquiaId) return;
    setErro(null);
    carregarParoquia(paroquiaId)
      .then(setParoquia)
      .catch((e: Error) => setErro(e.message ?? "Não foi possível carregar a paróquia."));
  }, [paroquiaId]);

  useEffect(recarregar, [recarregar]);

  return { paroquia, erro, recarregar };
}
