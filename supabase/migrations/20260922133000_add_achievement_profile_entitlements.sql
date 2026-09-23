alter table public.users
  add column if not exists username_color text,
  add column if not exists avatar_border text,
  add column if not exists visible_badges text[] not null default '{}',
  add column if not exists profile_cover_url text,
  add column if not exists profile_flair text,
  add column if not exists achievement_level numeric(2,1) not null default 1.0;

alter table public.users drop constraint if exists users_avatar_border_check;
alter table public.users add constraint users_avatar_border_check
  check (avatar_border is null or avatar_border in ('bronze', 'silver'));

alter table public.users drop constraint if exists users_achievement_level_check;
alter table public.users add constraint users_achievement_level_check
  check (achievement_level in (0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0));

-- These columns are capabilities unlocked by the evaluator. Existing profile
-- editing remains backward-compatible until each visual reward is wired in.

do $$
declare
  existing_user record;
begin
  for existing_user in select id from public.users loop
    perform public.evaluate_user_achievements(existing_user.id);
  end loop;
end;
$$;
