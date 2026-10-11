-- criar_paroquia passa a ser idempotente: se o usuário já pertence a uma paróquia,
-- devolve a existente. O advisory lock por usuário evita duplicatas quando duas
-- abas (ou o link de confirmação + a aba do cadastro) chamam ao mesmo tempo.

create or replace function public.criar_paroquia(nome text, cidade text default null, uf text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  usuario uuid := (select auth.uid());
  existente uuid;
  nova uuid;
begin
  if usuario is null then
    raise exception 'não autenticado';
  end if;

  perform pg_advisory_xact_lock(hashtext('criar_paroquia:' || usuario::text));

  select m.paroquia_id into existente
  from public.membros m
  where m.user_id = usuario
  order by m.criado_em
  limit 1;
  if existente is not null then
    return existente;
  end if;

  insert into public.paroquias (nome, cidade, uf)
  values (criar_paroquia.nome, criar_paroquia.cidade, criar_paroquia.uf)
  returning id into nova;
  insert into public.membros (paroquia_id, user_id, papel)
  values (nova, usuario, 'admin');
  return nova;
end;
$$;

-- Remove a paróquia duplicada (vazia) criada antes desta correção
delete from public.paroquias p
where p.id = 'a0acd848-6f55-453f-914b-bf2255503e7f'
  and not exists (select 1 from public.celebracoes x where x.paroquia_id = p.id)
  and not exists (select 1 from public.musicas x where x.paroquia_id = p.id)
  and not exists (select 1 from public.textos x where x.paroquia_id = p.id);
