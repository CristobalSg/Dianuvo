# Dianuvo

Dianuvo es una PWA mobile-first para organizar actividades, rutinas y horarios personales. Usa React 19, TypeScript, Supabase Auth/PostgreSQL, TanStack Query, Tailwind CSS 4 y Vite; no requiere un backend propio.

## Funcionalidades

- Registro, inicio/cierre de sesión y recuperación de contraseña con Supabase Auth.
- Agenda diaria con calendario semanal, tareas con y sin horario y progreso inmediato.
- CRUD de categorías y creación/edición de actividades.
- Repetición diaria, semanal o por días específicos, con fecha de término opcional.
- Edición sólo de una ocurrencia o de esa fecha en adelante, preservando el historial.
- Checklist optimista con reversión ante errores.
- Calendario mensual y estadísticas semanales/mensuales por día y categoría.
- Exportación de resumen a PDF.
- PWA instalable, safe areas de iPhone, shell offline y recursos estáticos en caché.
- RLS y relaciones compuestas para aislar completamente los datos de cada usuario.

## Modelo de datos

`profiles` extiende a `auth.users`; `categories` pertenece a un usuario; `tasks` define una regla o tramo recurrente; `task_occurrences` almacena cada ejecución fechada. La RPC `materialize_task_occurrences` genera ventanas idempotentes y `update_task_from_date` divide una serie al editar el futuro. Consulta [la arquitectura](docs/ARCHITECTURE.md) para el detalle.

## 1. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Abre **SQL Editor**, pega todo [supabase_schema.sql](supabase_schema.sql) y ejecútalo una vez. No se necesita Supabase CLI.
3. En **Project Settings > API Keys**, copia la **Publishable key** que comienza con `sb_publishable_`. No uses la anon key legacy, `service_role` ni `sb_secret_`.
4. En **Authentication > URL Configuration** configura:
   - Site URL local: `http://localhost:5173` durante desarrollo.
   - Redirect URLs: `http://localhost:5173/reset-password` y `https://TU-DOMINIO.vercel.app/reset-password`.
   - Al publicar, cambia Site URL a la URL canónica de Vercel y conserva localhost como redirect permitido.
5. Decide en **Authentication > Providers > Email** si exigirás confirmación de correo. El frontend soporta ambos flujos.

La creación de usuario dispara de forma idempotente el perfil y cinco categorías iniciales. Para comprobar el aislamiento entre cuentas, sigue [docs/RLS_TESTS.sql](docs/RLS_TESTS.sql) en un proyecto de desarrollo.

## 2. Ejecutar localmente

Requiere Node.js 22+ y pnpm 10.28.1.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Completa `.env.local` así:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE
```

La aplicación muestra un error explícito si falta una variable o si la clave no tiene el prefijo correcto.

## 3. Calidad

```bash
pnpm lint
pnpm test
pnpm build
```

Las pruebas cubren recurrencia, días ISO, fechas locales, horarios, progreso, estados omitidos, división de series, prevención de duplicados y garantías estructurales de RLS. Las pruebas de políticas con dos identidades se ejecutan manualmente porque requieren un proyecto Supabase real.

## 4. Desplegar en Vercel

1. Importa este repositorio en Vercel.
2. Vercel detectará Vite; `vercel.json` fija `pnpm build` y `dist`.
3. Agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en **Project Settings > Environment Variables** para Production y Preview.
4. Despliega y agrega el dominio final a Site URL/Redirect URLs de Supabase como se indicó arriba.
5. Verifica instalación PWA desde Chrome/Android o **Compartir > Añadir a pantalla de inicio** en Safari/iOS.

Las reescrituras SPA excluyen assets, iconos, manifest y service worker. El service worker nunca cachea solicitudes ni respuestas de Supabase, y la caché de React Query se elimina al cerrar sesión.

## Alcance actual

La primera versión incluye todas las funciones descritas arriba. No implementa escrituras offline —una decisión deliberada para evitar conflictos y mezcla entre cuentas— ni notificaciones push; la interfaz las identifica como una mejora futura. Antes de producción se recomienda ejecutar las pruebas manuales de RLS y decidir la política de confirmación de correo del proyecto.
