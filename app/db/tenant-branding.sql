alter table public.tenants
add column if not exists brand_hex text,
add column if not exists brand_dark_hex text,
add column if not exists login_heading text,
add column if not exists login_message text;

update public.tenants
set
  brand_hex = coalesce(brand_hex, '#38bdf8'),
  brand_dark_hex = coalesce(brand_dark_hex, '#0f172a')
where brand_hex is null
   or brand_dark_hex is null;
