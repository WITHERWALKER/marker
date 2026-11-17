-- Marker · 0002_api_tokens
-- Tokens de API para clientes externos (extensión de navegador).
-- Se guarda solo el SHA-256 del token; la verificación usa una función
-- SECURITY DEFINER para que el backend nunca necesite la service-role key.

create table public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'Extensión',
  token_hash    text not null unique,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

create index api_tokens_user_idx on public.api_tokens (user_id);

alter table public.api_tokens enable row level security;

create policy api_tokens_select on public.api_tokens
  for select to authenticated using (user_id = (select auth.uid()));
create policy api_tokens_insert on public.api_tokens
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy api_tokens_update on public.api_tokens
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy api_tokens_delete on public.api_tokens
  for delete to authenticated using (user_id = (select auth.uid()));

-- Verificación para la API de la extensión: recibe el hash, devuelve el user.
-- Volatile porque también actualiza last_used_at.
create or replace function public.verify_api_token(p_token_hash text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  update public.api_tokens
     set last_used_at = now()
   where token_hash = p_token_hash
   returning user_id into v_user_id;

  return v_user_id;
end;
$$;

grant execute on function public.verify_api_token(text) to anon, authenticated;
