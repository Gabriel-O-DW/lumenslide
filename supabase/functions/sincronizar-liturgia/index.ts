// Sincroniza a liturgia diária dos próximos dias em public.liturgia_dia.
// Chamado pelo pg_cron (ver migração agendar_sincronizacao_liturgia).
// Guarda a resposta bruta da fonte v2; o frontend normaliza com normalizarV2().
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const FONTE = "https://liturgia.up.railway.app/v2/";

Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("não autorizado", { status: 401 });
  }
  const url = new URL(req.url);
  const dias = Math.min(parseInt(url.searchParams.get("dias") ?? "60", 10), 400);
  const inicio = url.searchParams.get("inicio") ?? new Date().toISOString().slice(0, 10);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const ok: string[] = [];
  const falhas: string[] = [];
  const base = new Date(`${inicio}T12:00:00Z`);

  const sincronizar = async (i: number) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    try {
      const res = await fetch(
        `${FONTE}?dia=${d.getUTCDate()}&mes=${d.getUTCMonth() + 1}&ano=${d.getUTCFullYear()}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      if (!raw?.liturgia || !raw?.leituras) throw new Error("sem dados");
      const { error } = await supabase.from("liturgia_dia").upsert({
        data: iso,
        dia_liturgico: raw.liturgia,
        cor: String(raw.cor ?? "").toLowerCase(),
        dados: raw,
        fonte: "v2",
        atualizado_em: new Date().toISOString(),
      });
      if (error) throw error;
      ok.push(iso);
    } catch (e) {
      falhas.push(`${iso}: ${(e as Error).message}`);
    }
  };

  // Lotes paralelos para caber no limite de tempo da Edge Function
  const LOTE = 8;
  for (let i = 0; i < dias; i += LOTE) {
    await Promise.all(
      Array.from({ length: Math.min(LOTE, dias - i) }, (_, k) => sincronizar(i + k)),
    );
  }

  return Response.json({ sincronizados: ok.length, falhas });
});
