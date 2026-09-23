create table if not exists public.user_achievements (
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_slug text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_slug)
);

create index if not exists user_achievements_user_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc);

alter table public.user_achievements enable row level security;

drop policy if exists "usuarios leen sus logros" on public.user_achievements;
create policy "usuarios leen sus logros"
  on public.user_achievements
  for select
  using (auth.uid() = user_id);

-- Los desbloqueos se insertan desde la lógica confiable de evaluación de logros.
-- No se habilita INSERT desde el cliente para evitar que alguien se otorgue logros.
