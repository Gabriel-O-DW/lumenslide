import { supabase } from "../lib/supabase";

/**
 * As imagens ficam no bucket privado "imagens"; o navegador acessa por URLs
 * assinadas (válidas por 6 h), guardadas em cache para não pedir de novo.
 */

const VALIDADE_S = 6 * 60 * 60;
const urls = new Map<string, string>();
const pendentes = new Map<string, Promise<void>>();

export function urlEmCache(caminho: string): string | undefined {
  return urls.get(caminho);
}

/** Garante URLs assinadas para todos os caminhos (uma chamada em lote) */
export async function carregarUrls(caminhos: string[]): Promise<void> {
  const faltando = [...new Set(caminhos)].filter((c) => c && !urls.has(c) && !pendentes.has(c));
  const aguardar = [...new Set(caminhos)].map((c) => pendentes.get(c)).filter(Boolean);
  if (faltando.length) {
    const p = (async () => {
      const { data, error } = await supabase.storage.from("imagens").createSignedUrls(faltando, VALIDADE_S);
      if (error) throw error;
      for (const item of data ?? []) {
        if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
      }
    })().finally(() => faltando.forEach((c) => pendentes.delete(c)));
    faltando.forEach((c) => pendentes.set(c, p));
    aguardar.push(p);
  }
  await Promise.all(aguardar);
}

/** Baixa a imagem como data URL (usado na exportação PPTX) */
export async function imagemComoDataUrl(caminho: string): Promise<string> {
  await carregarUrls([caminho]);
  const url = urls.get(caminho);
  if (!url) throw new Error(`Imagem não encontrada: ${caminho}`);
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Envia uma imagem para a pasta da paróquia e devolve o caminho no bucket */
export async function enviarImagem(paroquiaId: string, pasta: string, arquivo: File): Promise<string> {
  const ext = (arquivo.name.split(".").pop() ?? "jpg").toLowerCase();
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const caminho = `${paroquiaId}/${pasta}/${nome}`;
  const { error } = await supabase.storage.from("imagens").upload(caminho, arquivo, {
    contentType: arquivo.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return caminho;
}
