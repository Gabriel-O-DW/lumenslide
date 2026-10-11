import { supabase } from "../lib/supabase";
import type { Json } from "../types/database";
import { buscarLiturgia } from "../services/liturgia";
import { corDaLiturgia } from "./tema";
import { normalizarReferencia } from "./referencias";
import type { ContextoMissa, EstadoMissa, TextosParoquia } from "./tipos";

export interface ConfigParoquia {
  horarios: string[];
  instagram?: string;
}

export interface DadosParoquia {
  id: string;
  nome: string;
  config: ConfigParoquia;
  textos: TextosParoquia;
}

const HORARIOS_PADRAO = ["08:00", "10:00", "19:00"];

export async function carregarParoquia(paroquiaId: string): Promise<DadosParoquia> {
  const [p, t] = await Promise.all([
    supabase.from("paroquias").select("id, nome, config").eq("id", paroquiaId).single(),
    supabase.from("textos").select("chave, titulo, conteudo").eq("paroquia_id", paroquiaId),
  ]);
  if (p.error) throw p.error;
  if (t.error) throw t.error;
  const cfg = (p.data.config ?? {}) as { horarios?: string[]; instagram?: string };
  const textos: TextosParoquia = {};
  for (const linha of t.data) {
    textos[linha.chave] = { titulo: linha.titulo, conteudo: (linha.conteudo ?? {}) as Record<string, unknown> };
  }
  return {
    id: p.data.id,
    nome: p.data.nome,
    config: { horarios: cfg.horarios?.length ? cfg.horarios : HORARIOS_PADRAO, instagram: cfg.instagram },
    textos,
  };
}

export async function imagensDoEvangelho(paroquiaId: string, referencia: string | undefined): Promise<string[]> {
  const ref = normalizarReferencia(referencia);
  if (!ref) return [];
  const { data, error } = await supabase
    .from("imagens_evangelho")
    .select("storage_path")
    .eq("paroquia_id", paroquiaId)
    .eq("referencia", ref)
    .order("ordem");
  if (error) throw error;
  return data.map((d) => d.storage_path);
}

/** Cadastra a imagem para o Evangelho, para ser reaproveitada nos próximos anos */
export async function cadastrarImagemEvangelho(paroquiaId: string, referencia: string, caminho: string, ordem: number) {
  const { error } = await supabase.from("imagens_evangelho").insert({
    paroquia_id: paroquiaId,
    referencia: normalizarReferencia(referencia),
    storage_path: caminho,
    ordem,
  });
  if (error) throw error;
}

/** Monta o contexto da missa: liturgia do dia + textos + imagens do Evangelho */
export async function montarContexto(
  paroquia: DadosParoquia,
  data: string,
  horario: string,
): Promise<ContextoMissa> {
  const lit = await buscarLiturgia(data);
  const evangelho = lit.evangelho?.referencia;
  return {
    data,
    horario,
    cor: corDaLiturgia(lit.cor),
    diaLiturgico: lit.diaLiturgico ?? "",
    leitura1: lit.primeiraLeitura?.referencia,
    salmo: lit.salmo?.referencia,
    salmoRefrao: lit.salmo?.refrao,
    leitura2: lit.segundaLeitura?.referencia,
    evangelho,
    textos: paroquia.textos,
    imagensEvangelhoPadrao: await imagensDoEvangelho(paroquia.id, evangelho),
    paroquiaId: paroquia.id,
    instagram: paroquia.config.instagram,
  };
}

/* ------------------------------------------------------------------ */
/*  Celebrações                                                        */
/* ------------------------------------------------------------------ */

export interface CelebracaoResumo {
  id: string;
  data: string;
  horario: string;
  atualizadoEm: string;
  diaLiturgico?: string;
}

export interface Celebracao {
  id: string;
  paroquiaId: string;
  data: string;
  horario: string;
  estado: EstadoMissa;
}

const hhmm = (t: string) => t.slice(0, 5);

export async function buscarCelebracao(paroquiaId: string, data: string, horario: string): Promise<string | null> {
  const { data: linha, error } = await supabase
    .from("celebracoes")
    .select("id")
    .eq("paroquia_id", paroquiaId)
    .eq("data", data)
    .eq("horario", horario)
    .maybeSingle();
  if (error) throw error;
  return linha?.id ?? null;
}

export async function criarCelebracao(
  paroquiaId: string,
  data: string,
  horario: string,
  estado: EstadoMissa,
): Promise<string> {
  const { data: linha, error } = await supabase
    .from("celebracoes")
    .insert({ paroquia_id: paroquiaId, data, horario, estado: estado as unknown as Json })
    .select("id")
    .single();
  if (error) throw error;
  return linha.id;
}

export async function carregarCelebracao(id: string): Promise<Celebracao> {
  const { data, error } = await supabase
    .from("celebracoes")
    .select("id, paroquia_id, data, horario, estado")
    .eq("id", id)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    paroquiaId: data.paroquia_id,
    data: data.data,
    horario: hhmm(data.horario),
    estado: data.estado as unknown as EstadoMissa,
  };
}

export async function salvarEstado(id: string, estado: EstadoMissa): Promise<void> {
  const { error } = await supabase
    .from("celebracoes")
    .update({ estado: estado as unknown as Json })
    .eq("id", id);
  if (error) throw error;
}

export async function listarRecentes(paroquiaId: string, limite = 8): Promise<CelebracaoResumo[]> {
  const { data, error } = await supabase
    .from("celebracoes")
    .select("id, data, horario, atualizado_em")
    .eq("paroquia_id", paroquiaId)
    .order("data", { ascending: false })
    .order("horario", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data.map((c) => ({ id: c.id, data: c.data, horario: hhmm(c.horario), atualizadoEm: c.atualizado_em }));
}

export async function excluirCelebracao(id: string): Promise<void> {
  const { error } = await supabase.from("celebracoes").delete().eq("id", id);
  if (error) throw error;
}
