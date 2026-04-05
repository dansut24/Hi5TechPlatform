create table if not exists public.group_module_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  module_key text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, group_id, module_key)
);

alter table public.group_module_assignments enable row level security;

drop policy if exists group_module_assignments_select_member on public.group_module_assignments;
create policy group_module_assignments_select_member
on public.group_module_assignments
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = group_module_assignments.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists group_module_assignments_insert_admin on public.group_module_assignments;
create policy group_module_assignments_insert_admin
on public.group_module_assignments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = group_module_assignments.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists group_module_assignments_delete_admin on public.group_module_assignments;
create policy group_module_assignments_delete_admin
on public.group_module_assignments
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = group_module_assignments.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);
