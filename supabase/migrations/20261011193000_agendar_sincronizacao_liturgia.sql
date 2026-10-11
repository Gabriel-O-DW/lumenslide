-- Agenda a sincronização da liturgia: todo dia às 03:00 (horário de Brasília = 06:00 UTC)
-- busca os próximos 60 dias; no dia 1 de cada mês, busca 400 dias (mais de 1 ano à frente).
-- Segredos ficam no Vault (cron_secret_liturgia, url_projeto), criados fora do git.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function public.disparar_sincronizacao_liturgia(dias int)
returns bigint
language sql security definer set search_path = '' as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'url_projeto')
           || '/functions/v1/sincronizar-liturgia?dias=' || dias,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret_liturgia')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000
  );
$$;
revoke execute on function public.disparar_sincronizacao_liturgia(int) from public, anon, authenticated;

select cron.schedule('liturgia-diaria', '0 6 * * *',
  $$ select public.disparar_sincronizacao_liturgia(60) $$);
select cron.schedule('liturgia-mensal', '30 6 1 * *',
  $$ select public.disparar_sincronizacao_liturgia(400) $$);
