alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.module_assignments enable row level security;
alter table public.incidents enable row level security;
alter table public.service_requests enable row level security;
alter table public.changes enable row level security;
alter table public.knowledge_articles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);

create policy "memberships_select_own"
on public.memberships
for select
using (auth.uid() = user_id);

create policy "module_assignments_select_own"
on public.module_assignments
for select
using (auth.uid() = user_id);

create policy "incidents_select_tenant_members"
on public.incidents
for select
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = incidents.tenant_id
  )
);

create policy "incidents_insert_tenant_members"
on public.incidents
for insert
with check (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = incidents.tenant_id
  )
);

create policy "service_requests_select_tenant_members"
on public.service_requests
for select
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = service_requests.tenant_id
  )
);

create policy "service_requests_insert_tenant_members"
on public.service_requests
for insert
with check (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = service_requests.tenant_id
  )
);

create policy "changes_select_tenant_members"
on public.changes
for select
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = changes.tenant_id
  )
);

create policy "knowledge_articles_select_tenant_members"
on public.knowledge_articles
for select
using (
  exists (
    select 1
    from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = knowledge_articles.tenant_id
  )
);
