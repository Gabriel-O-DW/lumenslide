-- LumenSlide — esquema inicial
-- Multi-paróquia: toda tabela de conteúdo tem paroquia_id e é protegida por RLS.
-- Textos litúrgicos protegidos (Missal/CNBB, Paulus) NÃO entram nesta migração:
-- ficam em supabase/privado/ (fora do git) e são cadastrados por paróquia.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

/* ------------------------------------------------------------------ */
/*  Paróquias e membros                                                */
/* ------------------------------------------------------------------ */

create type public.papel_membro as enum ('admin', 'editor', 'leitor');

create table public.paroquias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  uf text,
  -- rodapé, horários padrão das missas, @ do Instagram etc.
  config jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table public.membros (
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  papel public.papel_membro not null default 'editor',
  criado_em timestamptz not null default now(),
  primary key (paroquia_id, user_id)
);
create index membros_user_idx on public.membros (user_id);

-- Funções auxiliares das políticas (security definer evita recursão de RLS em membros)
create function public.eh_membro(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membros m
    where m.paroquia_id = p and m.user_id = (select auth.uid())
  );
$$;

create function public.pode_editar(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membros m
    where m.paroquia_id = p and m.user_id = (select auth.uid())
      and m.papel in ('admin', 'editor')
  );
$$;

create function public.eh_admin(p uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.membros m
    where m.paroquia_id = p and m.user_id = (select auth.uid())
      and m.papel = 'admin'
  );
$$;

-- Cria a paróquia e torna quem chamou o administrador dela
create function public.criar_paroquia(nome text, cidade text default null, uf text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  nova uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'não autenticado';
  end if;
  insert into public.paroquias (nome, cidade, uf)
  values (criar_paroquia.nome, criar_paroquia.cidade, criar_paroquia.uf)
  returning id into nova;
  insert into public.membros (paroquia_id, user_id, papel)
  values (nova, (select auth.uid()), 'admin');
  return nova;
end;
$$;
revoke execute on function public.criar_paroquia(text, text, text) from anon, public;
grant execute on function public.criar_paroquia(text, text, text) to authenticated;

alter table public.paroquias enable row level security;
alter table public.membros enable row level security;

create policy "membros veem a paróquia" on public.paroquias
  for select to authenticated using (public.eh_membro(id));
create policy "admin altera a paróquia" on public.paroquias
  for update to authenticated using (public.eh_admin(id)) with check (public.eh_admin(id));

create policy "membros veem os membros" on public.membros
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "admin gerencia membros" on public.membros
  for all to authenticated using (public.eh_admin(paroquia_id)) with check (public.eh_admin(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Atualização automática de atualizado_em                            */
/* ------------------------------------------------------------------ */

create function public.tocar_atualizado_em() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

/* ------------------------------------------------------------------ */
/*  Músicas                                                            */
/* ------------------------------------------------------------------ */

-- Momentos da missa em que uma música pode entrar
create type public.momento_missa as enum (
  'entrada', 'ato-penitencial', 'gloria', 'salmo', 'aclamacao', 'ofertorio',
  'santo', 'cordeiro', 'comunhao', 'acao-de-gracas', 'final', 'nossa-senhora', 'outro'
);

create table public.musicas (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  titulo text not null,
  artista text,
  momentos public.momento_missa[] not null default '{}',
  tom text,
  -- blocos: [{ "id": "r1", "tipo": "refrao" | "estrofe", "texto": "..." }]
  blocos jsonb not null default '[]'::jsonb,
  -- ordem de execução por id de bloco, ex.: ["r1","e1","r1","e2","r1"]
  ordem jsonb not null default '[]'::jsonb,
  -- texto bruto importado, para reprocessar se o importador melhorar
  letra_original text,
  -- título + 1ª linha normalizados, para reconhecer duplicatas na importação
  assinatura text not null,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index musicas_paroquia_idx on public.musicas (paroquia_id);
create unique index musicas_assinatura_uidx on public.musicas (paroquia_id, assinatura);
create index musicas_titulo_trgm_idx on public.musicas using gin (titulo extensions.gin_trgm_ops);
create trigger musicas_atualizado_em before update on public.musicas
  for each row execute function public.tocar_atualizado_em();

alter table public.musicas enable row level security;
create policy "membros leem músicas" on public.musicas
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam músicas" on public.musicas
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Liturgia diária (cache global, preenchido pelo sincronizador)      */
/* ------------------------------------------------------------------ */

create table public.liturgia_dia (
  data date primary key,
  dia_liturgico text not null,
  cor text not null,
  -- LiturgiaDiaria normalizada (ver src/types/liturgia.ts)
  dados jsonb not null,
  fonte text,
  atualizado_em timestamptz not null default now()
);

alter table public.liturgia_dia enable row level security;
-- Leitura para usuários logados; escrita só pelo service role (Edge Function de sincronização)
create policy "logados leem a liturgia" on public.liturgia_dia
  for select to authenticated using (true);

/* ------------------------------------------------------------------ */
/*  Textos da paróquia (orações fixas, Creio, OEs) — conteúdo privado  */
/* ------------------------------------------------------------------ */

-- chave: 'oracao-preparacao', 'creio-curto', 'creio-longo', 'liturgia-eucaristica',
--        'apos-comungar', 'oe-I', 'oe-II', 'oe-III', 'oe-IV', 'misterio-fe' ...
create table public.textos (
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  chave text not null,
  titulo text not null,
  -- slides: [{ "texto": "..." }] ou estrutura específica (ex.: aclamações da OE)
  conteudo jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now(),
  primary key (paroquia_id, chave)
);
create trigger textos_atualizado_em before update on public.textos
  for each row execute function public.tocar_atualizado_em();

alter table public.textos enable row level security;
create policy "membros leem textos" on public.textos
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam textos" on public.textos
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Planejamento do mês (o que vem do folheto)                         */
/* ------------------------------------------------------------------ */

create table public.planejamento_dia (
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  data date not null,
  oracao_eucaristica text,           -- 'I', 'II', 'III', 'IV', 'RI', ...
  misterio_fe smallint check (misterio_fe between 1 and 3),
  resposta_preces text,
  creio text check (creio in ('curto', 'longo', 'nenhum')),
  gloria boolean,
  aclamacao text,                    -- versículo da aclamação ao Evangelho
  observacoes text,
  atualizado_em timestamptz not null default now(),
  primary key (paroquia_id, data)
);
create trigger planejamento_atualizado_em before update on public.planejamento_dia
  for each row execute function public.tocar_atualizado_em();

alter table public.planejamento_dia enable row level security;
create policy "membros leem planejamento" on public.planejamento_dia
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam planejamento" on public.planejamento_dia
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Avisos (entram automaticamente em todas as missas do período)      */
/* ------------------------------------------------------------------ */

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  titulo text not null,
  texto text not null default '',
  imagem_path text,                  -- storage: imagens/<paroquia_id>/avisos/...
  exibir_de date not null,
  exibir_ate date not null,
  ordem int not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (exibir_ate >= exibir_de)
);
create index avisos_periodo_idx on public.avisos (paroquia_id, exibir_de, exibir_ate);
create trigger avisos_atualizado_em before update on public.avisos
  for each row execute function public.tocar_atualizado_em();

alter table public.avisos enable row level security;
create policy "membros leem avisos" on public.avisos
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam avisos" on public.avisos
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Prestação de contas (balancete mensal)                             */
/* ------------------------------------------------------------------ */

create table public.prestacao_contas (
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  mes date not null check (extract(day from mes) = 1),   -- 1º dia do mês de referência
  -- { "dizimo": 53641.43, "ofertorio": 3865.10, "lojinha": 1537.40, "doacoes": 3110.00,
  --   "dizimistas_total": 607, "dizimistas_contribuintes": 409, "outros": [...] }
  dados jsonb not null,
  texto_original text,
  exibir_de date not null,
  exibir_ate date not null,
  atualizado_em timestamptz not null default now(),
  primary key (paroquia_id, mes)
);
create trigger prestacao_atualizado_em before update on public.prestacao_contas
  for each row execute function public.tocar_atualizado_em();

alter table public.prestacao_contas enable row level security;
create policy "membros leem prestação" on public.prestacao_contas
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam prestação" on public.prestacao_contas
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Imagens do Evangelho (indexadas pela referência)                   */
/* ------------------------------------------------------------------ */

create table public.imagens_evangelho (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  -- referência normalizada, ex.: 'Mt 22,1-14' (sem espaços extras)
  referencia text not null,
  storage_path text not null,        -- imagens/<paroquia_id>/evangelho/...
  ordem int not null default 0,
  criado_em timestamptz not null default now()
);
create index imagens_evangelho_ref_idx on public.imagens_evangelho (paroquia_id, referencia);

alter table public.imagens_evangelho enable row level security;
create policy "membros leem imagens do evangelho" on public.imagens_evangelho
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam imagens do evangelho" on public.imagens_evangelho
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Celebrações (cada missa montada)                                   */
/* ------------------------------------------------------------------ */

create table public.celebracoes (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  data date not null,
  horario time not null,
  -- escolhas da missa: músicas por momento, creio, OE, overrides manuais por slide...
  estado jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (paroquia_id, data, horario)
);
create trigger celebracoes_atualizado_em before update on public.celebracoes
  for each row execute function public.tocar_atualizado_em();

alter table public.celebracoes enable row level security;
create policy "membros leem celebrações" on public.celebracoes
  for select to authenticated using (public.eh_membro(paroquia_id));
create policy "editores gravam celebrações" on public.celebracoes
  for all to authenticated using (public.pode_editar(paroquia_id)) with check (public.pode_editar(paroquia_id));

/* ------------------------------------------------------------------ */
/*  Storage: bucket privado "imagens", pasta raiz = paroquia_id        */
/*  (capas por cor, fundos, LGPD, avisos, imagens do Evangelho)        */
/* ------------------------------------------------------------------ */

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagens', 'imagens', false, 15728640,
        array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "membros leem imagens da paróquia" on storage.objects
  for select to authenticated
  using (bucket_id = 'imagens' and public.eh_membro(((storage.foldername(name))[1])::uuid));

create policy "editores enviam imagens da paróquia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'imagens' and public.pode_editar(((storage.foldername(name))[1])::uuid));

create policy "editores alteram imagens da paróquia" on storage.objects
  for update to authenticated
  using (bucket_id = 'imagens' and public.pode_editar(((storage.foldername(name))[1])::uuid));

create policy "editores apagam imagens da paróquia" on storage.objects
  for delete to authenticated
  using (bucket_id = 'imagens' and public.pode_editar(((storage.foldername(name))[1])::uuid));
