-- ============================================================
-- AUTOMATIKUS PROFIL LÉTREHOZÁS
-- Futtasd a 006_private_conv_rls_fix.sql UTÁN.
--
-- Ez megoldja, hogy regisztrációkor - még mielőtt a felhasználó
-- megerősítené az e-mail címét és lenne aktív session-je - is
-- létrejöjjön a profiles sor, RLS-től függetlenül (security definer).
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, birth_year, accepted_guidelines_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'Éjszakai Vándor'),
    (new.raw_user_meta_data->>'birth_year')::int,
    case when new.raw_user_meta_data->>'accepted_guidelines' = 'true' then now() else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function handle_new_user();
