-- Biblioteca de blocos da paróquia: conjuntos de slides para reaproveitar
-- (ritos especiais como investidura de ministros, Liturgia das Horas, cantos fixos...)

create table public.blocos (
  id uuid primary key default gen_random_uuid(),
  paroquia_id uuid not null references public.paroquias (id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('musica', 'texto', 'respostas')),
  -- { "titulo": "...", "texto": "...", "faixa": "liturgica" | "fixa", "brancoEntre": true }
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index blocos_paroquia_idx on public.blocos (paroquia_id, nome);
create trigger blocos_atualizado_em before update on public.blocos
  for each row execute function public.tocar_atualizado_em();

alter table public.blocos enable row level security;
create policy "blocos: select" on public.blocos for select to authenticated using (privado.eh_membro(paroquia_id));
create policy "blocos: insert" on public.blocos for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "blocos: update" on public.blocos for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "blocos: delete" on public.blocos for delete to authenticated using (privado.pode_editar(paroquia_id));
