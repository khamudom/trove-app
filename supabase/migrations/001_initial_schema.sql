-- Trove MVP schema
create extension if not exists pgcrypto;

create table if not exists public.bins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  qr_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  name text not null,
  description text,
  category text,
  tags text[] not null default '{}',
  location text,
  preview_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bin_id uuid not null references public.bins(id) on delete cascade,
  name text not null,
  description text,
  image text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bins_user_id_idx on public.bins(user_id);
create unique index if not exists bins_qr_token_idx on public.bins(qr_token);
create index if not exists items_bin_id_idx on public.items(bin_id);
create index if not exists items_user_id_idx on public.items(user_id);

alter table public.bins enable row level security;
alter table public.items enable row level security;

create policy "Users manage own bins"
  on public.bins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read-only bin lookup by QR token (no user_id exposed)
create or replace function public.get_public_bin_by_qr_token(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
begin
  select json_build_object(
    'name', b.name,
    'description', b.description,
    'category', b.category,
    'tags', b.tags,
    'location', b.location,
    'preview_image', b.preview_image,
    'items', coalesce((
      select json_agg(
        json_build_object(
          'name', i.name,
          'description', i.description,
          'image', i.image,
          'tags', i.tags
        ) order by i.name
      )
      from public.items i
      where i.bin_id = b.id
    ), '[]'::json)
  )
  into result
  from public.bins b
  where b.qr_token = p_token
  limit 1;

  return result;
end;
$$;

revoke all on function public.get_public_bin_by_qr_token(text) from public;
grant execute on function public.get_public_bin_by_qr_token(text) to anon, authenticated;
