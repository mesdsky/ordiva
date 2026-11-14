-- Premium never expired: the billing webhook sets profiles.plan = 'premium'
-- and records ends_at, but nothing ever downgraded the user afterwards, so
-- a monthly purchase granted premium forever.
--
-- This marks lapsed entitlements expired and downgrades users who have no
-- remaining valid entitlement, then runs it hourly with pg_cron.

create or replace function public.expire_lapsed_premium()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.billing_entitlements
  set status = 'expired'
  where status = 'active'
    and ends_at is not null
    and ends_at <= now();

  update public.profiles p
  set plan = 'free'
  where p.plan = 'premium'
    and exists (
      -- Only touch users who bought premium through billing, so manually
      -- granted premium accounts are left alone.
      select 1 from public.billing_entitlements e where e.user_id = p.id
    )
    and not exists (
      select 1
      from public.billing_entitlements e
      where e.user_id = p.id
        and e.status = 'active'
        and (e.ends_at is null or e.ends_at > now())
    );
end;
$$;

revoke execute on function public.expire_lapsed_premium() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'expire-lapsed-premium',
  '7 * * * *',
  $$select public.expire_lapsed_premium()$$
);
