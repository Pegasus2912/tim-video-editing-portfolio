-- Run in Supabase -> SQL Editor.
create sequence if not exists order_seq;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('PG-' || lpad(nextval('order_seq')::text, 5, '0')),
  status text not null default 'pending_payment' check (status in ('pending_payment','paid','in_progress','waiting_for_customer','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  customer_name text not null, customer_email text not null,
  package_id text not null, package_name text not null, service text not null, amount_cents int not null check (amount_cents > 0),
  video_type text, video_length text, game text, reference_links text[] not null default '{}', preferences text, subtitles text, notes text,
  access_token_hash text not null, stripe_session_id text unique, stripe_payment_intent text, paid_at timestamptz,
  created_at timestamptz not null default now());
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender text not null check (sender in ('customer','admin')),
  body text not null check (char_length(body) between 1 and 4000),
  read_by_admin boolean not null default false, read_by_customer boolean not null default false,
  created_at timestamptz not null default now());
create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);

alter table public.orders enable row level security;
alter table public.messages enable row level security;
alter table public.admins enable row level security;
revoke all on public.orders, public.messages, public.admins from anon, authenticated;
-- Customers: NO direct database access. All customer actions go through server API routes (service role).
-- The service role bypasses RLS and lives only in Vercel environment variables.

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Groundwork for the admin panel (read-only until it is built):
grant select on public.orders, public.messages to authenticated;
create policy admin_read_orders on public.orders for select to authenticated using (public.is_admin());
create policy admin_read_messages on public.messages for select to authenticated using (public.is_admin());
