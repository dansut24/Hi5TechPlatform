create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists groups_tenant_name_unique
  on public.groups (tenant_id, lower(name));

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists group_members_group_user_unique
  on public.group_members (group_id, user_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists groups_select_member on public.groups;
create policy groups_select_member
on public.groups
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = groups.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists groups_insert_admin on public.groups;
create policy groups_insert_admin
on public.groups
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = groups.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists groups_update_admin on public.groups;
create policy groups_update_admin
on public.groups
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = groups.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = groups.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists groups_delete_admin on public.groups;
create policy groups_delete_admin
on public.groups
for delete
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = groups.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists group_members_select_member on public.group_members;
create policy group_members_select_member
on public.group_members
for select
to authenticated
using (
  exists (
    select 1
    from public.groups g
    join public.memberships m on m.tenant_id = g.tenant_id
    where g.id = group_members.group_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists group_members_insert_admin on public.group_members;
create policy group_members_insert_admin
on public.group_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.groups g
    join public.memberships m on m.tenant_id = g.tenant_id
    where g.id = group_members.group_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists group_members_delete_admin on public.group_members;
create policy group_members_delete_admin
on public.group_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.groups g
    join public.memberships m on m.tenant_id = g.tenant_id
    where g.id = group_members.group_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

create or replace function public.set_updated_at_groups()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
before update on public.groups
for each row
execute function public.set_updated_at_groups();
