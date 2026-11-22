-- Run AFTER schema.sql. Adds customer accounts, ownership of orders, new statuses and editable website content.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text not null default '', language text not null default 'en' check (language in ('en','de')),
  created_at timestamptz not null default now());
alter table public.profiles enable row level security;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (id, email, name) values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'name',''), 80)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, language) on public.profiles to authenticated;   -- users can NEVER change id/email/roles
create policy profiles_own_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_select on public.profiles for select to authenticated using (public.is_admin());

alter table public.orders add column if not exists user_id uuid references auth.users(id) on delete set null;
create index if not exists orders_user_idx on public.orders(user_id);
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in ('pending_payment','paid','confirmed','in_progress','waiting_for_customer','completed','cancelled'));
revoke select on public.orders from authenticated;
grant select (id, order_number, status, payment_status, customer_name, customer_email, package_name, service, amount_cents, video_type, video_length, game, reference_links, preferences, subtitles, notes, created_at, paid_at, user_id) on public.orders to authenticated;
create policy orders_own_select on public.orders for select to authenticated using (user_id = auth.uid());
create policy messages_own_select on public.messages for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create table public.site_content (
  key text primary key check (key in ('packages','projects','about','contact')),
  value jsonb not null, updated_at timestamptz not null default now());
alter table public.site_content enable row level security;
revoke all on public.site_content from anon, authenticated;  -- read/written only by server API (service role)
