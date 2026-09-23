-- Realinea niveles ya existentes con la progresión definitiva:
-- 0,5: 0 | 1: 1 | 1,5: 4 | 2: 7 | 2,5: 12 |
-- 3: 17 | 3,5: 24 | 4: 31 | 4,5: 40 | 5: 49.

do $$
declare
  existing_user record;
  achievement_count integer;
begin
  for existing_user in select id from public.users loop
    select count(*) into achievement_count
    from public.user_achievements
    where user_id = existing_user.id;

    update public.users
    set achievement_level = case
          when achievement_count >= 49 then 5.0
          when achievement_count >= 40 then 4.5
          when achievement_count >= 31 then 4.0
          when achievement_count >= 24 then 3.5
          when achievement_count >= 17 then 3.0
          when achievement_count >= 12 then 2.5
          when achievement_count >= 7 then 2.0
          when achievement_count >= 4 then 1.5
          when achievement_count >= 1 then 1.0
          else 0.5
        end,
        profile_flair = case
          when achievement_count >= 49 then 'Leyenda'
          when achievement_count >= 40 then 'Inspector'
          when achievement_count >= 31 then 'Chófer'
          when achievement_count >= 17 then 'Amante'
          when achievement_count >= 7 then 'Viajante'
          when achievement_count >= 1 then 'Novatada'
          else null
        end
    where id = existing_user.id;
  end loop;
end;
$$;

create or replace function public.sync_achievement_level(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  achievement_count integer;
begin
  select count(*) into achievement_count
  from public.user_achievements
  where user_id = p_user_id;

  update public.users
  set achievement_level = case
        when achievement_count >= 49 then 5.0
        when achievement_count >= 40 then 4.5
        when achievement_count >= 31 then 4.0
        when achievement_count >= 24 then 3.5
        when achievement_count >= 17 then 3.0
        when achievement_count >= 12 then 2.5
        when achievement_count >= 7 then 2.0
        when achievement_count >= 4 then 1.5
        when achievement_count >= 1 then 1.0
        else 0.5
      end,
      profile_flair = case
        when achievement_count >= 49 then 'Leyenda'
        when achievement_count >= 40 then 'Inspector'
        when achievement_count >= 31 then 'Chófer'
        when achievement_count >= 17 then 'Amante'
        when achievement_count >= 7 then 'Viajante'
        when achievement_count >= 1 then 'Novatada'
        else null
      end
  where id = p_user_id;
end;
$$;

create or replace function public.trg_realign_review_achievement_level()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.evaluate_user_achievements(new.user_id);
  perform public.sync_achievement_level(new.user_id);
  return new;
end;
$$;

create or replace function public.trg_realign_activity_achievement_level()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  review_owner_id uuid;
begin
  perform public.evaluate_user_achievements(new.user_id);
  perform public.sync_achievement_level(new.user_id);

  if tg_table_name in ('comments', 'likes', 'reposts') then
    select user_id into review_owner_id
    from public.reviews
    where id = new.review_id;

    if review_owner_id is not null and review_owner_id <> new.user_id then
      perform public.evaluate_user_achievements(review_owner_id);
      perform public.sync_achievement_level(review_owner_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_evaluate_review_achievements on public.reviews;
create trigger trg_evaluate_review_achievements
after insert or update on public.reviews
for each row execute function public.trg_realign_review_achievement_level();

drop trigger if exists trg_evaluate_comment_achievements on public.comments;
create trigger trg_evaluate_comment_achievements
after insert on public.comments
for each row execute function public.trg_realign_activity_achievement_level();

drop trigger if exists trg_evaluate_like_achievements on public.likes;
create trigger trg_evaluate_like_achievements
after insert or update on public.likes
for each row execute function public.trg_realign_activity_achievement_level();

drop trigger if exists trg_evaluate_repost_achievements on public.reposts;
create trigger trg_evaluate_repost_achievements
after insert on public.reposts
for each row execute function public.trg_realign_activity_achievement_level();

drop trigger if exists trg_evaluate_follow_achievements on public.follows;
create trigger trg_evaluate_follow_achievements
after insert on public.follows
for each row execute function public.trg_realign_activity_achievement_level();
