-- Run AFTER schema.sql and migration-002. Adds: media storage bucket, account erasure function, language on sign-up.

-- 1) Public-read media bucket. Limits are enforced by Supabase Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['video/mp4','video/webm','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;
-- No storage.objects policies are created for anon/authenticated: uploads are only possible with a one-time signed upload URL
-- that the admin API issues (after admin + MFA checks, with type/size validation and a random server-chosen file name).

-- 2) New customers get the language they used on the site.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, language) values (new.id, new.email, left(coalesce(new.raw_user_meta_data->>'name',''), 80),
    case when new.raw_user_meta_data->>'language' in ('en','de') then new.raw_user_meta_data->>'language' else 'en' end);
  return new;
end $$;

-- 3) Account erasure (called only by the server after password + email confirmation).
-- Unpaid orders and ALL messages are deleted. Paid orders are kept as anonymised accounting records (amount, package, dates, payment ids);
-- name, email, notes, preferences and links are removed. Check with your tax advisor what you must keep and for how long.
create or replace function public.erase_customer(uid uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.messages where order_id in (select id from public.orders where user_id = uid);
  delete from public.orders where user_id = uid and payment_status <> 'paid';
  update public.orders set customer_name = 'Deleted customer', customer_email = 'deleted@invalid.invalid', preferences = null, notes = null,
    reference_links = '{}', access_token_hash = md5(random()::text || clock_timestamp()::text), user_id = null where user_id = uid;
  delete from public.profiles where id = uid;
end $$;
revoke all on function public.erase_customer(uuid) from public, anon, authenticated;
grant execute on function public.erase_customer(uuid) to service_role;
