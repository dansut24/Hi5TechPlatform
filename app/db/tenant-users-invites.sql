create table if not exists public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'technician',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invite_token text not null unique,
  invited_by uuid null references public.profiles(id) on delete set null,
  created_user_id uuid null references public.profiles(id) on delete set null,
  group_ids uuid[] not null default '{}',
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tenant_invites_pending_unique
  on public.tenant_invites (tenant_id, email)
  where status = 'pending';

alter table public.tenant_invites enable row level security;

drop policy if exists tenant_invites_select_member on public.tenant_invites;
create policy tenant_invites_select_member
on public.tenant_invites
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = tenant_invites.tenant_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists tenant_invites_insert_admin on public.tenant_invites;
create policy tenant_invites_insert_admin
on public.tenant_invites
for insert
to authenticated
with check (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = tenant_invites.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

drop policy if exists tenant_invites_update_admin on public.tenant_invites;
create policy tenant_invites_update_admin
on public.tenant_invites
for update
to authenticated
using (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = tenant_invites.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.memberships m
    where m.tenant_id = tenant_invites.tenant_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  )
);

create or replace function public.set_updated_at_tenant_invites()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tenant_invites_updated_at on public.tenant_invites;
create trigger trg_tenant_invites_updated_at
before update on public.tenant_invites
for each row
execute function public.set_updated_at_tenant_invites();
