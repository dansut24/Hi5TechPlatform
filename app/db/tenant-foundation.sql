create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  initials text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'trial', 'suspended', 'disabled')),
  plan text not null default 'trial',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'technician', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.module_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  created_at timestamptz not null default now(),
  constraint module_assignments_target_check check (
    (user_id is not null and group_id is null) or
    (user_id is null and group_id is not null)
  )
);

create unique index if not exists module_assignments_user_unique
  on public.module_assignments (tenant_id, user_id, module_key)
  where user_id is not null;

create unique index if not exists module_assignments_group_unique
  on public.module_assignments (tenant_id, group_id, module_key)
  where group_id is not null;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'technician', 'member', 'viewer')),
  invite_token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invite_module_assignments (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites(id) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  created_at timestamptz not null default now(),
  unique (invite_id, module_key)
);

create table if not exists public.invite_group_assignments (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.invites(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (invite_id, group_id)
);

insert into public.modules (key, name, description)
values
  ('itsm', 'ITSM', 'Service management workspace'),
  ('control', 'Control', 'RMM and device operations'),
  ('selfservice', 'SelfService', 'End-user portal'),
  ('admin', 'Admin', 'Tenant administration'),
  ('analytics', 'Analytics', 'Operational analytics'),
  ('automation', 'Automation', 'Workflow automation')
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description;
