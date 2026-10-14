-- Pruebas manuales para Supabase SQL Editor.
-- Cree dos usuarios de prueba y reemplace UUID_A/UUID_B (incluidas las cadenas JSON).
-- Ejecute sólo en desarrollo: cambia localmente al rol authenticated y termina en rollback.

begin;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID_A","role":"authenticated"}', true);

insert into public.categories (user_id, name, color)
values ('UUID_A', 'Privada A', '#EBD4CC');

-- Debe devolver únicamente filas de A.
select * from public.categories;

-- La excepción esperada se captura para poder continuar el resto del guion.
do $$
begin
  begin
    insert into public.categories (user_id, name, color)
    values ('UUID_B', 'Ataque', '#D55C5A');
    raise exception 'FALLO: RLS permitió insertar para otro usuario';
  exception when insufficient_privilege then
    raise notice 'OK: INSERT ajeno bloqueado';
  end;
end $$;

-- B crea una categoría propia y conserva su id en una variable de sesión.
select set_config('request.jwt.claims', '{"sub":"UUID_B","role":"authenticated"}', true);
with inserted as (
  insert into public.categories (user_id, name, color)
  values ('UUID_B', 'Privada B', '#F5918F')
  returning id
)
select set_config('dianuvo.category_b', id::text, true) from inserted;

select set_config('request.jwt.claims', '{"sub":"UUID_A","role":"authenticated"}', true);

do $$
begin
  begin
    insert into public.tasks (user_id, category_id, title, start_date)
    values ('UUID_A', current_setting('dianuvo.category_b')::uuid, 'Cruce inválido', current_date);
    raise exception 'FALLO: la FK permitió cruzar propietarios';
  exception when foreign_key_violation then
    raise notice 'OK: relación entre propietarios bloqueada';
  end;
end $$;

select set_config('request.jwt.claims', '{"sub":"UUID_B","role":"authenticated"}', true);

-- Debe devolver cero filas de A y las mutaciones deben afectar cero filas.
select * from public.categories where user_id = 'UUID_A';
update public.categories set name = 'Secuestrada' where user_id = 'UUID_A';
delete from public.categories where user_id = 'UUID_A';

rollback;
