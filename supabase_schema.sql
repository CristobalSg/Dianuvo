-- Dianuvo: esquema completo para Supabase SQL Editor
-- Ejecutar como una sola migración en un proyecto Supabase nuevo.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Tablas
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  timezone text not null default 'America/Santiago',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80)
);

create table public.categories (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#EBD4CC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_length check (char_length(btrim(name)) between 1 and 50),
  constraint categories_allowed_color check (
    color in ('#514945', '#894242', '#D55C5A', '#F5918F', '#EBD4CC')
  ),
  constraint categories_id_user_unique unique (id, user_id),
  constraint categories_user_name_unique unique (user_id, name)
);

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  series_id uuid not null default extensions.gen_random_uuid(),
  previous_task_id uuid null,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid null,
  title text not null,
  description text null,
  start_time time null,
  end_time time null,
  repeat_type text not null default 'none',
  days_of_week integer[] null,
  start_date date not null,
  end_date date null,
  is_active boolean not null default true,
  color text not null default '#EBD4CC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint tasks_description_length check (description is null or char_length(description) <= 2000),
  constraint tasks_repeat_type check (repeat_type in ('none', 'daily', 'weekly', 'custom')),
  constraint tasks_allowed_color check (
    color in ('#514945', '#894242', '#D55C5A', '#F5918F', '#EBD4CC')
  ),
  constraint tasks_date_order check (end_date is null or end_date >= start_date),
  constraint tasks_time_order check (end_time is null or start_time is null or end_time > start_time),
  constraint tasks_days_range check (
    days_of_week is null
    or days_of_week <@ array[1,2,3,4,5,6,7]
  ),
  constraint tasks_repeat_days_shape check (
    (repeat_type = 'custom' and days_of_week is not null and cardinality(days_of_week) > 0)
    or (repeat_type <> 'custom' and days_of_week is null)
  ),
  constraint tasks_non_repeating_end check (repeat_type <> 'none' or end_date is null or end_date = start_date),
  constraint tasks_id_user_unique unique (id, user_id),
  constraint tasks_id_user_series_unique unique (id, user_id, series_id),
  constraint tasks_category_owner_fk foreign key (category_id, user_id)
    references public.categories(id, user_id) on delete set null (category_id),
  constraint tasks_previous_owner_fk foreign key (previous_task_id, user_id)
    references public.tasks(id, user_id) on delete restrict
);

create table public.task_occurrences (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id uuid not null,
  series_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid null,
  scheduled_date date not null,
  title text not null,
  description text null,
  start_time time null,
  end_time time null,
  color text not null,
  status text not null default 'pending',
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint occurrences_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint occurrences_status check (status in ('pending', 'completed', 'skipped', 'cancelled')),
  constraint occurrences_allowed_color check (
    color in ('#514945', '#894242', '#D55C5A', '#F5918F', '#EBD4CC')
  ),
  constraint occurrences_time_order check (end_time is null or start_time is null or end_time > start_time),
  constraint occurrences_completed_shape check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint occurrences_task_owner_fk foreign key (task_id, user_id, series_id)
    references public.tasks(id, user_id, series_id) on delete cascade,
  constraint occurrences_category_owner_fk foreign key (category_id, user_id)
    references public.categories(id, user_id) on delete set null (category_id),
  constraint occurrences_task_date_unique unique (task_id, scheduled_date),
  constraint occurrences_series_date_unique unique (user_id, series_id, scheduled_date)
);

-- Índices alineados con las consultas principales.
create index categories_user_idx on public.categories(user_id);
create index tasks_user_window_idx on public.tasks(user_id, start_date, end_date);
create index tasks_user_active_idx on public.tasks(user_id, is_active) where is_active;
create index tasks_series_idx on public.tasks(user_id, series_id, start_date);
create index occurrences_user_date_idx on public.task_occurrences(user_id, scheduled_date);
create index occurrences_user_status_date_idx on public.task_occurrences(user_id, status, scheduled_date);
create index occurrences_category_date_idx on public.task_occurrences(user_id, category_id, scheduled_date);

-- ---------------------------------------------------------------------------
-- 2. Triggers de integridad y marcas de tiempo
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger occurrences_set_updated_at before update on public.task_occurrences
for each row execute function public.set_updated_at();

create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Zona horaria IANA no válida: %', new.timezone using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone before insert or update of timezone on public.profiles
for each row execute function public.validate_profile_timezone();

-- Normaliza nombres y elimina días repetidos para que la regla sea canónica.
create or replace function public.normalize_owned_values()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_table_name = 'categories' then
    new.name = btrim(new.name);
  elsif tg_table_name = 'tasks' then
    new.title = btrim(new.title);
    if new.days_of_week is not null then
      select array_agg(distinct d order by d) into new.days_of_week
      from unnest(new.days_of_week) as d;
    end if;
  elsif tg_table_name = 'task_occurrences' then
    new.title = btrim(new.title);
  end if;
  return new;
end;
$$;

create trigger categories_normalize before insert or update on public.categories
for each row execute function public.normalize_owned_values();
create trigger tasks_normalize before insert or update on public.tasks
for each row execute function public.normalize_owned_values();
create trigger occurrences_normalize before insert or update on public.task_occurrences
for each row execute function public.normalize_owned_values();

-- Crea perfil y categorías base al aparecer un usuario en Supabase Auth.
-- SECURITY DEFINER es necesario porque el trigger se ejecuta sobre auth.users.
-- search_path vacío y nombres totalmente calificados limitan la superficie de ataque.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inferred_name text;
begin
  inferred_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  );

  insert into public.profiles (id, display_name, timezone)
  values (new.id, left(inferred_name, 80), 'America/Santiago')
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, color)
  values
    (new.id, 'Personal', '#EBD4CC'),
    (new.id, 'Estudios', '#F5918F'),
    (new.id, 'Negocio', '#894242'),
    (new.id, 'Ejercicio', '#D55C5A'),
    (new.id, 'Otras', '#514945')
  on conflict (user_id, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tasks enable row level security;
alter table public.task_occurrences enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_own on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy categories_select_own on public.categories for select to authenticated
using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories for delete to authenticated
using ((select auth.uid()) = user_id);

create policy tasks_select_own on public.tasks for select to authenticated
using ((select auth.uid()) = user_id);
create policy tasks_insert_own on public.tasks for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy tasks_update_own on public.tasks for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy tasks_delete_own on public.tasks for delete to authenticated
using ((select auth.uid()) = user_id);

create policy occurrences_select_own on public.task_occurrences for select to authenticated
using ((select auth.uid()) = user_id);
create policy occurrences_insert_own on public.task_occurrences for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);
create policy occurrences_update_own on public.task_occurrences for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.tasks t
    where t.id = task_id and t.user_id = (select auth.uid())
  )
);
create policy occurrences_delete_own on public.task_occurrences for delete to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4. RPC de materialización idempotente
-- ---------------------------------------------------------------------------

create or replace function public.materialize_task_occurrences(
  p_from date,
  p_to date
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inserted_count integer;
begin
  if auth.uid() is null then
    raise exception 'Se requiere autenticación' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Rango de fechas inválido' using errcode = '22023';
  end if;
  if p_to - p_from > 370 then
    raise exception 'El rango máximo por llamada es de 371 días' using errcode = '22023';
  end if;

  insert into public.task_occurrences (
    task_id, series_id, user_id, category_id, scheduled_date, title, description,
    start_time, end_time, color, status
  )
  select
    t.id, t.series_id, t.user_id, t.category_id, day_value::date, t.title, t.description,
    t.start_time, t.end_time, t.color, 'pending'
  from public.tasks t
  cross join lateral generate_series(
    greatest(p_from, t.start_date)::timestamp,
    least(p_to, coalesce(t.end_date, p_to))::timestamp,
    interval '1 day'
  ) as generated(day_value)
  where t.user_id = auth.uid()
    and t.is_active
    and t.start_date <= p_to
    and (t.end_date is null or t.end_date >= p_from)
    and (
      (t.repeat_type = 'none' and day_value::date = t.start_date)
      or t.repeat_type = 'daily'
      or (
        t.repeat_type = 'weekly'
        and mod(day_value::date - t.start_date, 7) = 0
      )
      or (
        t.repeat_type = 'custom'
        and extract(isodow from day_value)::integer = any(t.days_of_week)
      )
    )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

-- Cancela una serie desde una fecha sin borrar el historial anterior.
create or replace function public.cancel_task_from_date(
  p_task_id uuid,
  p_from_date date
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owned_task public.tasks%rowtype;
  chunk_start date;
  chunk_end date;
begin
  if auth.uid() is null then
    raise exception 'Se requiere autenticación' using errcode = '42501';
  end if;

  select * into owned_task
  from public.tasks
  where id = p_task_id and user_id = auth.uid() and is_active
  for update;

  if not found then
    raise exception 'Tarea no encontrada' using errcode = 'P0002';
  end if;

  if p_from_date > owned_task.start_date then
    chunk_start := owned_task.start_date;
    while chunk_start <= p_from_date - 1 loop
      chunk_end := least(chunk_start + 370, p_from_date - 1);
      perform public.materialize_task_occurrences(chunk_start, chunk_end);
      chunk_start := chunk_end + 1;
    end loop;

    update public.tasks
    set end_date = p_from_date - 1,
        is_active = false
    where id = owned_task.id;
  else
    update public.tasks set is_active = false where id = owned_task.id;
  end if;

  delete from public.task_occurrences
  where task_id = owned_task.id
    and scheduled_date >= p_from_date
    and status <> 'completed';
end;
$$;

-- Divide una serie en una fecha. El tramo anterior y sus completadas se conservan.
create or replace function public.update_task_from_date(
  p_task_id uuid,
  p_from_date date,
  p_title text,
  p_description text,
  p_category_id uuid,
  p_start_time time,
  p_end_time time,
  p_repeat_type text,
  p_days_of_week integer[],
  p_end_date date,
  p_color text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  old_task public.tasks%rowtype;
  new_task_id uuid;
  chunk_start date;
  chunk_end date;
begin
  if auth.uid() is null then
    raise exception 'Se requiere autenticación' using errcode = '42501';
  end if;

  select * into old_task
  from public.tasks
  where id = p_task_id and user_id = auth.uid() and is_active
  for update;

  if not found then
    raise exception 'Tarea no encontrada' using errcode = 'P0002';
  end if;
  if p_from_date < old_task.start_date then
    raise exception 'La fecha no puede ser anterior al inicio de la serie' using errcode = '22023';
  end if;
  if old_task.end_date is not null and p_from_date > old_task.end_date then
    raise exception 'La fecha está fuera del tramo de la serie' using errcode = '22023';
  end if;

  -- Si el corte coincide con el inicio no existe historial previo que separar.
  if p_from_date = old_task.start_date then
    update public.tasks
    set category_id = p_category_id,
        title = p_title,
        description = p_description,
        start_time = p_start_time,
        end_time = p_end_time,
        repeat_type = p_repeat_type,
        days_of_week = p_days_of_week,
        end_date = p_end_date,
        color = p_color,
        is_active = true
    where id = old_task.id;

    delete from public.task_occurrences
    where task_id = old_task.id
      and scheduled_date >= p_from_date
      and status <> 'completed';

    return old_task.id;
  end if;

  chunk_start := old_task.start_date;
  while chunk_start <= p_from_date - 1 loop
    chunk_end := least(chunk_start + 370, p_from_date - 1);
    perform public.materialize_task_occurrences(chunk_start, chunk_end);
    chunk_start := chunk_end + 1;
  end loop;

  update public.tasks
  set end_date = p_from_date - 1,
      is_active = false
  where id = old_task.id;

  -- Sólo se retiran borradores futuros. Una ocurrencia completada nunca se destruye.
  delete from public.task_occurrences
  where task_id = old_task.id
    and scheduled_date >= p_from_date
    and status <> 'completed';

  insert into public.tasks (
    series_id, previous_task_id, user_id, category_id, title, description,
    start_time, end_time, repeat_type, days_of_week, start_date, end_date,
    is_active, color
  ) values (
    old_task.series_id, old_task.id, old_task.user_id, p_category_id,
    p_title, p_description, p_start_time, p_end_time, p_repeat_type,
    p_days_of_week, p_from_date, p_end_date, true, p_color
  ) returning id into new_task_id;

  return new_task_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Privilegios explícitos
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.categories, public.tasks, public.task_occurrences from anon;
grant select, insert, update, delete on public.profiles, public.categories, public.tasks, public.task_occurrences to authenticated;

revoke all on function public.materialize_task_occurrences(date, date) from public, anon;
revoke all on function public.update_task_from_date(uuid, date, text, text, uuid, time, time, text, integer[], date, text) from public, anon;
revoke all on function public.cancel_task_from_date(uuid, date) from public, anon;
grant execute on function public.materialize_task_occurrences(date, date) to authenticated;
grant execute on function public.update_task_from_date(uuid, date, text, text, uuid, time, time, text, integer[], date, text) to authenticated;
grant execute on function public.cancel_task_from_date(uuid, date) to authenticated;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon;
revoke all on function public.validate_profile_timezone() from public, anon;
revoke all on function public.normalize_owned_values() from public, anon;

commit;

-- Configuración manual posterior:
-- 1. En Authentication > URL Configuration agregue la URL local y la de Vercel.
-- 2. Mantenga la confirmación de email según su política de acceso.
-- 3. Copie únicamente Project URL y Publishable key al entorno del frontend.
