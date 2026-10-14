# Arquitectura de Dianuvo

## Decisiones principales

Dianuvo es una PWA cliente: React 19 + Vite + TypeScript se comunica directamente con Supabase mediante la clave pública `sb_publishable_`. No existe un servidor propio. Supabase Auth gestiona la identidad, PostgreSQL conserva los datos y Row Level Security (RLS) es la frontera de seguridad.

El código se organiza por funcionalidades (`auth`, `tasks`, `calendar`, `categories`, `statistics`, `settings`). TanStack Query es la única fuente de verdad para datos remotos; el estado local queda limitado a formularios, navegación y UI transitoria.

## Recurrencia y conservación del historial

- `tasks` representa una regla o tramo de una serie recurrente.
- `task_occurrences` representa una ejecución fechada y guarda una instantánea editable del título, categoría, color y horario.
- Las ocurrencias se materializan por ventanas de fecha mediante `materialize_task_occurrences(from, to)`. Las restricciones únicas `(task_id, scheduled_date)` y `(user_id, series_id, scheduled_date)`, junto con `ON CONFLICT DO NOTHING`, hacen la operación idempotente, impiden duplicados entre tramos de una misma serie y son seguras frente a llamadas concurrentes.
- La recurrencia usa fechas locales (`date` y `time`) y días ISO 8601 (lunes = 1, domingo = 7). La zona horaria del perfil se usa sólo para convertir el momento real de finalización (`timestamptz`). Así se evitan desplazamientos de fecha por UTC.
- Editar una ocurrencia modifica solamente su fila.
- Editar desde una fecha llama a `update_task_from_date`: materializa el tramo histórico, cierra la regla anterior el día previo y crea un nuevo tramo con el mismo `series_id`. Las ocurrencias pendientes futuras del tramo anterior se eliminan; el historial completado nunca se reescribe.
- Cancelar una ocurrencia cambia su estado a `cancelled`. Una ocurrencia pasada aún `pending` se interpreta como omitida en estadísticas; las futuras nunca se cuentan como incumplidas.

## Integridad y seguridad

Las tablas de usuario llevan `user_id`. Además de RLS, existen claves foráneas compuestas `(related_id, user_id)` para impedir relaciones entre propietarios distintos, incluso si una aplicación defectuosa intenta crearlas. Las RPC trabajan como `SECURITY INVOKER`; la única función `SECURITY DEFINER` es el alta automática de perfil/categorías desde `auth.users`, con `search_path` vacío y privilegios limitados.

## Flujo de datos

1. La sesión de Supabase habilita las rutas privadas.
2. Antes de leer un rango, el cliente materializa sus ocurrencias con la RPC idempotente.
3. React Query consulta el rango y conserva caché por usuario/fecha.
4. Las mutaciones aplican actualización optimista cuando es reversible y luego invalidan las claves relacionadas.
5. Al cerrar sesión se vacía por completo la caché de React Query para no mezclar información entre cuentas.

## PWA y offline

El service worker almacena únicamente el shell y recursos estáticos con una estrategia cache-first. Las solicitudes a Supabase y cualquier respuesta de usuario se excluyen deliberadamente del caché del service worker. React Query puede conservar la vista durante fallos breves de red dentro de la sesión, pero no se implementan escrituras offline para evitar conflictos silenciosos.
