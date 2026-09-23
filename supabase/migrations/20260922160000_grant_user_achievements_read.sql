grant select on table public.user_achievements to authenticated;

drop policy if exists "usuarios leen sus logros" on public.user_achievements;
create policy "usuarios leen sus logros"
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No se concede INSERT/UPDATE/DELETE al cliente: los desbloqueos siguen siendo server-side.
