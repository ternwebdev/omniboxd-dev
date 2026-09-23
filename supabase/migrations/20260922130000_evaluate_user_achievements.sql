create or replace function public.evaluate_user_achievements(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  review_count integer;
  company_count integer;
  line_count integer;
  follow_count integer;
  action_day_count integer;
  unlocked_count integer;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*) into review_count from public.reviews where user_id = p_user_id;
  select count(distinct l.company_id) into company_count
  from public.reviews r join public.lines l on l.id = r.line_id
  where r.user_id = p_user_id;
  select count(distinct line_id) into line_count from public.reviews where user_id = p_user_id;
  select count(*) into follow_count from public.follows where follower_id = p_user_id;
  select count(distinct activity_day) into action_day_count
  from (
    select created_at::date activity_day from public.reviews where user_id = p_user_id
    union
    select created_at::date from public.comments where user_id = p_user_id
    union
    select created_at::date from public.likes where user_id = p_user_id
    union
    select created_at::date from public.reposts where user_id = p_user_id
  ) days;

  -- Exploración de empresas
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('primer_boleto_gastado', review_count >= 1),
    ('bichito_de_la_curiosidad', company_count >= 3),
    ('expertiz_en_omnibus', company_count >= 5),
    ('exploracion_urbana', company_count >= 7),
    ('ruta_completa', company_count >= 10)
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;

  -- Diversidad de líneas y ramales
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('atletismo_de_lineas', line_count >= 10),
    ('mapa_viviente', line_count >= 25),
    ('enciclopedia_rodante', line_count >= 50),
    ('perito_total', line_count >= 100)
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, 'detective_de_ramales'
  where exists (
    select 1 from public.reviews r
    where r.user_id = p_user_id and r.route_label is not null
    group by r.line_id having count(distinct r.route_label) >= 3
  ) on conflict do nothing;

  -- Tipos de servicio
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('turista_local', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type in ('Departamental','Turístico'))),
    ('viaje_premium', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type='Diferencial')),
    ('viaje_local', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type='Local - Céntrico')),
    ('viaje_suburbano', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type='Suburbano')),
    ('persona_multimodal', (select count(distinct l.type) from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type in ('Diferencial','Local','Local - Céntrico','Suburbano','Urbano')) >= 4),
    ('tipoide_total', (select count(distinct l.type) from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and l.type in ('Departamental','Diferencial','Inter','Local - Céntrico','Suburbano','Turístico','Urbano')) >= 7)
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;

  -- Calidad y detalle
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('detallista', (select count(*) from public.reviews where user_id=p_user_id and nullif(trim(vehicle_number),'') is not null) >= 3),
    ('especialista_en_etiquetas', (select count(*) from (select rt.review_id from public.reviews r join public.review_tags rt on rt.review_id=r.id where r.user_id=p_user_id group by rt.review_id having count(*) >= 3) tagged) >= 5),
    ('memoria_de_elefante', (select count(*) from public.reviews where user_id=p_user_id and trip_date is not null) >= 10),
    ('cronista', (select count(*) from public.reviews where user_id=p_user_id and char_length(coalesce(body,'')) >= 250) >= 10),
    ('criticismo_profesional', (select count(*) from (select r.id from public.reviews r left join public.review_tags rt on rt.review_id=r.id where r.user_id=p_user_id and r.route_label is not null and r.vehicle_number is not null and r.trip_date is not null and r.body is not null group by r.id having count(rt.tag_id) >= 1) complete) >= 25)
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;

  -- Horarios y feriados
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('madrugante', exists (select 1 from public.reviews where user_id=p_user_id and extract(hour from coalesce(trip_date,created_at)) between 6 and 7)),
    ('buho_nocturno', exists (select 1 from public.reviews where user_id=p_user_id and (extract(hour from coalesce(trip_date,created_at)) >= 22 or extract(hour from coalesce(trip_date,created_at)) < 6))),
    ('horas_pico_controladas', exists (select 1 from public.reviews where user_id=p_user_id and (extract(hour from trip_date) between 7 and 8 or extract(hour from trip_date) between 17 and 19))),
    ('viaje_de_madrugada', exists (select 1 from public.reviews where user_id=p_user_id and extract(hour from trip_date) between 0 and 5)),
    ('feriado_de_viaje', exists (select 1 from public.reviews where user_id=p_user_id and ((extract(month from coalesce(trip_date,created_at))=1 and extract(day from coalesce(trip_date,created_at))=1) or (extract(month from coalesce(trip_date,created_at))=5 and extract(day from coalesce(trip_date,created_at))=18) or (extract(month from coalesce(trip_date,created_at))=8 and extract(day from coalesce(trip_date,created_at))=17) or (extract(month from coalesce(trip_date,created_at))=8 and extract(day from coalesce(trip_date,created_at))=25) or (extract(month from coalesce(trip_date,created_at))=12 and extract(day from coalesce(trip_date,created_at))=25))))
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;

  -- Social y constancia
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('mariposa_social', follow_count >= 5),
    ('influencer', follow_count >= 10),
    ('comunidad', follow_count >= 25),
    ('referente', follow_count >= 50),
    ('pro_de_las_menciones', (select count(*) from public.comments c where c.user_id=p_user_id and c.body ~ '@[a-zA-Z0-9_.]{4,32}') >= 3),
    ('finde_activo', exists (select 1 from (select extract(isodow from created_at)::int dow, date_trunc('week',created_at)::date week from public.reviews where user_id=p_user_id union select extract(isodow from created_at)::int, date_trunc('week',created_at)::date from public.reposts where user_id=p_user_id) a group by week having bool_or(dow=6) and bool_or(dow=7))),
    ('mes_comprometido', (select count(distinct created_at::date) from (select created_at from public.reviews where user_id=p_user_id union all select created_at from public.likes where user_id=p_user_id) days where date_trunc('month',created_at)=date_trunc('month',current_date)) >= 20),
    ('etapa_de_prueba_spotify_cruzada', action_day_count >= 90),
    ('feliz_nacimiento_omniboxdera', (select min(created_at) from public.reviews where user_id=p_user_id) <= now() - interval '9 months')
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, 'semana_activa'
  where exists (
    select 1
    from (
      select activity_date, activity_date - (row_number() over (order by activity_date))::int as streak_group
      from (
        select distinct created_at::date as activity_date from public.reviews where user_id=p_user_id
        union
        select distinct created_at::date as activity_date from public.comments where user_id=p_user_id
      ) unique_dates
    ) streaks
    group by streak_group
    having count(*) >= 7
  )
  on conflict do nothing;

  -- Especiales, clima y destinos. Las etiquetas se buscan por nombre para tolerar sus slugs internos.
  insert into public.user_achievements(user_id, achievement_slug)
  select p_user_id, x.slug from (values
    ('coche_especifico', exists (select 1 from public.reviews where user_id=p_user_id and vehicle_number is not null group by vehicle_number having count(*) >= 3)),
    ('ruta_favorita', exists (select 1 from public.reviews where user_id=p_user_id and route_label is not null group by route_label having count(*) >= 5)),
    ('empresa_fiel', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id group by l.company_id having count(*) >= 10)),
    ('primicia_del_ano', (select count(*) from public.reviews where created_at >= date_trunc('year', current_date) and created_at <= (select min(created_at) from public.reviews where user_id=p_user_id)) <= 50),
    ('dia_de_lluvia', exists (select 1 from public.reviews r join public.review_tags rt on rt.review_id=r.id join public.tags t on t.id=rt.tag_id where r.user_id=p_user_id and lower(t.label) in ('día lluvioso','alerta meteorológica'))),
    ('ola_de_calor', exists (select 1 from public.reviews r join public.review_tags rt on rt.review_id=r.id join public.tags t on t.id=rt.tag_id where r.user_id=p_user_id and lower(t.label) in ('día soleado','mucho calor'))),
    ('frio_riguroso', exists (select 1 from public.reviews r join public.review_tags rt on rt.review_id=r.id join public.tags t on t.id=rt.tag_id where r.user_id=p_user_id and lower(t.label) in ('aire al mango','mucho frío'))),
    ('sobreviviente', exists (select 1 from public.reviews r join public.review_tags rt on rt.review_id=r.id join public.tags t on t.id=rt.tag_id where r.user_id=p_user_id group by r.id having bool_or(lower(t.label)='sin aire') and bool_or(lower(t.label)='lleno de gente') and bool_or(lower(t.label)='frecuencia horrible'))),
    ('costa_querida', exists (select 1 from public.reviews where user_id=p_user_id and lower(coalesce(route_label,'')) ~ '(rambla|playa|carrasco|pocitos|buceo)')),
    ('centro_historico', exists (select 1 from public.reviews where user_id=p_user_id and lower(coalesce(route_label,'')) like '%ciudad vieja%')),
    ('cruzando_fronteras', exists (select 1 from public.reviews where user_id=p_user_id and lower(coalesce(route_label,'')) ~ '(canelones|san jose|san josé)')),
    ('ruta_veraniega', exists (select 1 from public.reviews r join public.lines l on l.id=r.line_id where r.user_id=p_user_id and extract(month from coalesce(r.trip_date,r.created_at)) in (1,2)))
  ) x(slug, should_unlock) where x.should_unlock on conflict do nothing;

  select count(*) into unlocked_count
  from public.user_achievements
  where user_id = p_user_id;

  execute '
    update public.users
    set achievement_level = case
          when $2 >= 49 then 5.0
          when $2 >= 40 then 4.5
          when $2 >= 31 then 4.0
          when $2 >= 24 then 3.5
          when $2 >= 17 then 3.0
          when $2 >= 12 then 2.5
          when $2 >= 7 then 2.0
          when $2 >= 4 then 1.5
          when $2 >= 1 then 1.0
          else 0.5
        end,
        profile_flair = case
          when $2 >= 49 then ''Leyenda''
          when $2 >= 40 then ''Inspector''
          when $2 >= 31 then ''Chófer''
          when $2 >= 17 then ''Amante''
          when $2 >= 7 then ''Viajante''
          when $2 >= 1 then ''Novatada''
          else null
        end
    where id = $1'
  using p_user_id, unlocked_count;
end;
$$;

revoke execute on function public.evaluate_user_achievements(uuid) from public, anon, authenticated;

create or replace function public.trg_evaluate_review_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
begin perform public.evaluate_user_achievements(new.user_id); return new; end; $$;

create or replace trigger trg_evaluate_review_achievements
after insert or update on public.reviews
for each row execute function public.trg_evaluate_review_achievements();

create or replace function public.trg_evaluate_activity_achievements()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_id uuid;
begin
  perform public.evaluate_user_achievements(new.user_id);
  if tg_table_name in ('comments','likes','reposts') then
    select user_id into target_id from public.reviews where id = new.review_id;
    if target_id is not null and target_id <> new.user_id then perform public.evaluate_user_achievements(target_id); end if;
  end if;
  return new;
end; $$;

create or replace trigger trg_evaluate_comment_achievements after insert on public.comments for each row execute function public.trg_evaluate_activity_achievements();
create or replace trigger trg_evaluate_like_achievements after insert or update on public.likes for each row execute function public.trg_evaluate_activity_achievements();
create or replace trigger trg_evaluate_repost_achievements after insert on public.reposts for each row execute function public.trg_evaluate_activity_achievements();
create or replace trigger trg_evaluate_follow_achievements after insert on public.follows for each row execute function public.trg_evaluate_activity_achievements();

