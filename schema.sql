-- Run once in Supabase SQL Editor. Enable email confirmation in Supabase Auth settings.
create table if not exists public.bliss_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.bliss_admins enable row level security;
create policy "admins can check own authorization" on public.bliss_admins
 for select to authenticated using (user_id = (select auth.uid()));
-- Only insert administrator IDs manually in the SQL editor; never allow client-side admin assignment.
create table if not exists public.bliss_sales (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{"prices":{},"orders":[]}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.bliss_sales enable row level security;
create policy "admin read sales" on public.bliss_sales for select to authenticated
 using (owner_id=(select auth.uid()) and exists(select 1 from public.bliss_admins where user_id=(select auth.uid())));
create policy "admin insert sales" on public.bliss_sales for insert to authenticated
 with check (owner_id=(select auth.uid()) and exists(select 1 from public.bliss_admins where user_id=(select auth.uid())));
create policy "admin update sales" on public.bliss_sales for update to authenticated
 using (owner_id=(select auth.uid()) and exists(select 1 from public.bliss_admins where user_id=(select auth.uid())))
 with check (owner_id=(select auth.uid()) and exists(select 1 from public.bliss_admins where user_id=(select auth.uid())));
-- AFTER the owner has signed up, authorize them using their actual auth.users UUID:
-- insert into public.bliss_admins (user_id) values ('OWNER_AUTH_USER_UUID');
