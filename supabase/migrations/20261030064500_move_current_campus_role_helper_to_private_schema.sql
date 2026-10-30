-- Keep the RLS role helper outside the Supabase Data API schema surface.
-- The private schema is intentionally not added to API exposed schemas.
create schema if not exists private authorization postgres;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
comment on schema private is 'Internal helper functions; do not add this schema to Supabase API exposed schemas.';

create or replace function private.current_campus_role()
returns text
language sql
stable
security definer
set search_path = ''
as $function$
  select p.role
  from public.profiles p
  where p.auth_user_id = auth.uid()
  limit 1;
$function$;

alter function private.current_campus_role() owner to postgres;
revoke all on function private.current_campus_role() from public, anon, authenticated;
grant execute on function private.current_campus_role() to authenticated, service_role;

-- Preserve each existing predicate and role grant, changing only the helper
-- reference so the role lookup remains available to RLS without a public RPC.
do $migration$
declare
  policy_row record;
  alter_sql text;
begin
  for policy_row in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') like '%current_campus_role()%'
        or coalesce(with_check, '') like '%current_campus_role()%'
      )
  loop
    alter_sql := format(
      'alter policy %I on public.%I',
      policy_row.policyname,
      policy_row.tablename
    );

    if policy_row.qual is not null then
      alter_sql := alter_sql || format(
        ' using (%s)',
        replace(policy_row.qual, 'current_campus_role()', 'private.current_campus_role()')
      );
    end if;

    if policy_row.with_check is not null then
      alter_sql := alter_sql || format(
        ' with check (%s)',
        replace(policy_row.with_check, 'current_campus_role()', 'private.current_campus_role()')
      );
    end if;

    execute alter_sql;
  end loop;
end
$migration$;

-- All RLS policy references now resolve to the internal private helper.
drop function if exists public.current_campus_role();
