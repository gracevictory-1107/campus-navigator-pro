-- New signups must be approved by an Admin before receiving campus permissions.
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['admin', 'faculty', 'management', 'security', 'student', 'pending']::text[]));

alter table public.profiles
  alter column role set default 'pending';

drop trigger if exists on_auth_user_created_student_profile on auth.users;
drop trigger if exists on_auth_user_created_profile on auth.users;

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email is null or length(trim(new.email)) = 0 then
    return new;
  end if;

  insert into public.profiles (auth_user_id, full_name, email, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    lower(trim(new.email)),
    'pending'
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$function$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user_profile();

drop function if exists public.handle_new_auth_user_student_profile();
