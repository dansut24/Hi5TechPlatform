alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.module_assignments enable row level security;

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "tenants_insert_authenticated" on public.tenants;
create policy "tenants_insert_authenticated"
on public.tenants
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "tenants_select_member" on public.tenants;
create policy "tenants_select_member"
on public.tenants
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = tenants.id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "memberships_insert_own" on public.memberships;
create policy "memberships_insert_own"
on public.memberships
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own"
on public.memberships
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "module_assignments_insert_own" on public.module_assignments;
create policy "module_assignments_insert_own"
on public.module_assignments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "module_assignments_select_own" on public.module_assignments;
create policy "module_assignments_select_own"
on public.module_assignments
for select
to authenticated
using (auth.uid() = user_id);
