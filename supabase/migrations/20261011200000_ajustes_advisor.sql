-- Ajustes apontados pelo Supabase Advisor:
-- 1) Funções auxiliares de RLS saem do schema exposto pela API (public -> privado).
-- 2) Políticas "for all" viram insert/update/delete, sem duplicar a política de leitura.

create schema if not exists privado;
revoke all on schema privado from public, anon;
grant usage on schema privado to authenticated;

alter function public.eh_membro(uuid) set schema privado;
alter function public.pode_editar(uuid) set schema privado;
alter function public.eh_admin(uuid) set schema privado;

revoke execute on function privado.eh_membro(uuid), privado.pode_editar(uuid), privado.eh_admin(uuid)
  from public, anon;
grant execute on function privado.eh_membro(uuid), privado.pode_editar(uuid), privado.eh_admin(uuid)
  to authenticated;
-- (as políticas existentes referenciam as funções por OID e continuam válidas)

drop policy "editores gravam músicas" on public.musicas;
create policy "musicas: insert" on public.musicas for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "musicas: update" on public.musicas for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "musicas: delete" on public.musicas for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam textos" on public.textos;
create policy "textos: insert" on public.textos for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "textos: update" on public.textos for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "textos: delete" on public.textos for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam planejamento" on public.planejamento_dia;
create policy "planejamento_dia: insert" on public.planejamento_dia for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "planejamento_dia: update" on public.planejamento_dia for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "planejamento_dia: delete" on public.planejamento_dia for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam avisos" on public.avisos;
create policy "avisos: insert" on public.avisos for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "avisos: update" on public.avisos for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "avisos: delete" on public.avisos for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam prestação" on public.prestacao_contas;
create policy "prestacao_contas: insert" on public.prestacao_contas for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "prestacao_contas: update" on public.prestacao_contas for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "prestacao_contas: delete" on public.prestacao_contas for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam imagens do evangelho" on public.imagens_evangelho;
create policy "imagens_evangelho: insert" on public.imagens_evangelho for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "imagens_evangelho: update" on public.imagens_evangelho for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "imagens_evangelho: delete" on public.imagens_evangelho for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "editores gravam celebrações" on public.celebracoes;
create policy "celebracoes: insert" on public.celebracoes for insert to authenticated with check (privado.pode_editar(paroquia_id));
create policy "celebracoes: update" on public.celebracoes for update to authenticated using (privado.pode_editar(paroquia_id)) with check (privado.pode_editar(paroquia_id));
create policy "celebracoes: delete" on public.celebracoes for delete to authenticated using (privado.pode_editar(paroquia_id));

drop policy "admin gerencia membros" on public.membros;
create policy "membros: insert" on public.membros for insert to authenticated with check (privado.eh_admin(paroquia_id));
create policy "membros: update" on public.membros for update to authenticated using (privado.eh_admin(paroquia_id)) with check (privado.eh_admin(paroquia_id));
create policy "membros: delete" on public.membros for delete to authenticated using (privado.eh_admin(paroquia_id));
