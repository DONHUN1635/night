-- ============================================================
-- HAJNALI BESZÉLGETÉSEK - ALAP ADATBÁZIS SÉMA
-- Futtasd le a Supabase SQL Editorban, sorrendben a fájlokkal.
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUM TÍPUSOK
-- ------------------------------------------------------------
create type user_role as enum ('vendeg', 'regisztralt', 'megbizhato', 'moderator', 'admin');
create type presence_status as enum ('elerheto', 'elfoglalt', 'nem_zavarhato', 'lathatatlan');
create type awake_reason as enum (
  'nem_tudok_elaludni', 'felebredtem', 'ejszakai_mufszak', 'gondolkodom',
  'stresszes_vagyok', 'maganyos_vagyok', 'dolgozom', 'csak_beszelgetnek',
  'jo_kedvem_van', 'egyeb'
);
create type mood_status as enum (
  'nyugodt', 'faradt', 'szomorú', 'aggodo', 'feszult', 'jo_kedvu', 'gondolkodo', 'beszelgetnek'
);
create type report_status as enum ('fuggoben', 'vizsgalat_alatt', 'lezarva', 'elutasitva');
create type report_target_type as enum ('felhasznalo', 'uzenet', 'bejegyzes');
create type moderation_action_type as enum (
  'figyelmeztetes', 'ideiglenes_nemitas', 'ideiglenes_kitiltas', 'vegleges_kitiltas', 'megjegyzes'
);
create type conversation_request_status as enum ('fuggoben', 'elfogadva', 'elutasitva', 'visszavonva');
create type private_message_permission as enum ('barki', 'csak_regisztralt', 'senki');
create type story_visibility as enum ('nevtelen', 'profilnevvel');
create type story_expiry as enum ('egy_ora', 'reggel_8', 'huszonnegy_ora', 'het_nap', 'soha');

-- ------------------------------------------------------------
-- PROFILES - regisztrált felhasználók profilja
-- (a supabase auth.users tábla kiterjesztése)
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  birth_year int check (birth_year between 1900 and extract(year from now())::int),
  role user_role not null default 'regisztralt',
  current_mood mood_status,
  awake_reason awake_reason,
  show_status_on_profile boolean not null default true,
  presence presence_status not null default 'elerheto',
  hide_online_status boolean not null default false,
  allow_private_messages private_message_permission not null default 'barki',
  is_banned boolean not null default false,
  banned_until timestamptz,
  ban_reason text,
  last_active_at timestamptz not null default now(),
  accepted_guidelines_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_profiles_role on profiles(role);
create index idx_profiles_last_active on profiles(last_active_at);

-- ------------------------------------------------------------
-- GUEST_SESSIONS - névtelen vendégek
-- ------------------------------------------------------------
create table guest_sessions (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  device_token text not null unique,
  current_mood mood_status,
  awake_reason awake_reason,
  presence presence_status not null default 'elerheto',
  converted_profile_id uuid references profiles(id) on delete set null,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index idx_guest_sessions_token on guest_sessions(device_token);
create index idx_guest_sessions_expires on guest_sessions(expires_at);

-- ------------------------------------------------------------
-- ROOMS - tematikus beszélgetőszobák
-- ------------------------------------------------------------
create table rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rules text,
  is_default boolean not null default false,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_rooms_archived on rooms(is_archived);

create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid references guest_sessions(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_muted boolean not null default false,
  muted_until timestamptz,
  constraint room_member_owner check (
    (profile_id is not null and guest_session_id is null) or
    (profile_id is null and guest_session_id is not null)
  )
);
create unique index idx_room_members_unique_profile on room_members(room_id, profile_id) where profile_id is not null;
create unique index idx_room_members_unique_guest on room_members(room_id, guest_session_id) where guest_session_id is not null;
create index idx_room_members_room on room_members(room_id);

-- ------------------------------------------------------------
-- MESSAGES - szoba üzenetek
-- ------------------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  author_profile_id uuid references profiles(id) on delete set null,
  author_guest_id uuid references guest_sessions(id) on delete set null,
  author_display_name text not null,
  content text not null check (char_length(content) between 1 and 2000),
  reply_to_message_id uuid references messages(id) on delete set null,
  image_url text,
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint message_author_owner check (
    (author_profile_id is not null and author_guest_id is null) or
    (author_profile_id is null and author_guest_id is not null)
  )
);
create index idx_messages_room_created on messages(room_id, created_at desc);
create index idx_messages_reply_to on messages(reply_to_message_id);

create table message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid references guest_sessions(id) on delete cascade,
  reaction_type text not null check (reaction_type in (
    'ertelek', 'veled_vagyok', 'atltem_mar', 'koszonom_hogy_leirtad', 'kuldok_egy_olelest', 'beszeljunk_rola'
  )),
  created_at timestamptz not null default now(),
  constraint reaction_owner check (
    (profile_id is not null and guest_session_id is null) or
    (profile_id is null and guest_session_id is not null)
  )
);
create unique index idx_reactions_unique_profile on message_reactions(message_id, profile_id, reaction_type) where profile_id is not null;
create unique index idx_reactions_unique_guest on message_reactions(message_id, guest_session_id, reaction_type) where guest_session_id is not null;

-- ------------------------------------------------------------
-- PRIVÁT BESZÉLGETÉSEK
-- ------------------------------------------------------------
create table conversation_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  message text check (char_length(message) <= 300),
  status conversation_request_status not null default 'fuggoben',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint no_self_request check (sender_id <> recipient_id)
);
create unique index idx_conv_requests_pending on conversation_requests(sender_id, recipient_id) where status = 'fuggoben';

create table private_conversations (
  id uuid primary key default gen_random_uuid(),
  created_from_request_id uuid references conversation_requests(id) on delete set null,
  is_archived_by_all boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table private_conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references private_conversations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  is_archived boolean not null default false,
  last_read_at timestamptz not null default now(),
  joined_at timestamptz not null default now()
);
create unique index idx_priv_conv_members_unique on private_conversation_members(conversation_id, profile_id);

create table private_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references private_conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  is_edited boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_priv_messages_conv_created on private_messages(conversation_id, created_at desc);

-- ------------------------------------------------------------
-- NÉVTELEN TÖRTÉNETEK
-- ------------------------------------------------------------
create table anonymous_posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid references profiles(id) on delete set null,
  author_guest_id uuid references guest_sessions(id) on delete set null,
  visibility story_visibility not null default 'nevtelen',
  title text not null check (char_length(title) between 2 and 150),
  content text not null check (char_length(content) between 10 and 8000),
  category text not null,
  expiry_option story_expiry not null default 'soha',
  expires_at timestamptz,
  is_removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_anon_posts_created on anonymous_posts(created_at desc);
create index idx_anon_posts_category on anonymous_posts(category);
create index idx_anon_posts_expires on anonymous_posts(expires_at);

create table anonymous_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references anonymous_posts(id) on delete cascade,
  author_profile_id uuid references profiles(id) on delete set null,
  author_guest_id uuid references guest_sessions(id) on delete set null,
  content text not null check (char_length(content) between 1 and 2000),
  is_removed boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_anon_comments_post on anonymous_post_comments(post_id, created_at);

create table anonymous_post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references anonymous_posts(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  guest_session_id uuid references guest_sessions(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now()
);
create unique index idx_post_reactions_unique_profile on anonymous_post_reactions(post_id, profile_id, reaction_type) where profile_id is not null;

-- ------------------------------------------------------------
-- ÉJSZAKAI NAPLÓ (privát)
-- ------------------------------------------------------------
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  content text not null,
  mood mood_status,
  tags text[] not null default '{}',
  shared_as_post_id uuid references anonymous_posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_journal_owner_created on journal_entries(owner_id, created_at desc);
create index idx_journal_tags on journal_entries using gin(tags);

-- ------------------------------------------------------------
-- ÉJSZAKA KÉRDÉSE
-- ------------------------------------------------------------
create table daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  is_active_on date,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index idx_daily_questions_active_date on daily_questions(is_active_on) where is_active_on is not null;

create table daily_question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references daily_questions(id) on delete cascade,
  author_profile_id uuid references profiles(id) on delete set null,
  author_guest_id uuid references guest_sessions(id) on delete set null,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index idx_daily_answers_question on daily_question_answers(question_id, created_at desc);

-- ------------------------------------------------------------
-- ÉRTESÍTÉSEK
-- ------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  type text not null check (type in (
    'valasz_erkezett', 'megemlitettek', 'privat_kerelem', 'privat_uzenet',
    'reakcio_bejegyzesre', 'moderatori_figyelmeztetes', 'rendszeruzenet'
  )),
  payload jsonb not null default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_notifications_recipient on notifications(recipient_id, created_at desc);
create index idx_notifications_unread on notifications(recipient_id) where is_read = false;

-- ------------------------------------------------------------
-- MODERÁCIÓ ÉS BIZTONSÁG
-- ------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid references profiles(id) on delete set null,
  reporter_guest_id uuid references guest_sessions(id) on delete set null,
  target_type report_target_type not null,
  target_user_id uuid references profiles(id) on delete set null,
  target_message_id uuid references messages(id) on delete set null,
  target_post_id uuid references anonymous_posts(id) on delete set null,
  reason text not null,
  details text,
  status report_status not null default 'fuggoben',
  handled_by uuid references profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_reports_status on reports(status);

create table user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint no_self_block check (blocker_id <> blocked_id)
);
create unique index idx_user_blocks_unique on user_blocks(blocker_id, blocked_id);

create table moderation_actions (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid references profiles(id) on delete cascade,
  moderator_id uuid references profiles(id) on delete set null,
  action_type moderation_action_type not null,
  reason text,
  related_report_id uuid references reports(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_mod_actions_target on moderation_actions(target_profile_id, created_at desc);

-- ------------------------------------------------------------
-- JELVÉNYEK (nem versengő)
-- ------------------------------------------------------------
create table badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references profiles(id) on delete set null
);
create unique index idx_user_badges_unique on user_badges(profile_id, badge_id);

-- ------------------------------------------------------------
-- KRÍZIS ERŐFORRÁSOK (adminisztrátorilag szerkeszthető, országonként)
-- ------------------------------------------------------------
create table crisis_resources (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  name text not null,
  phone_number text,
  url text,
  description text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  updated_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_crisis_resources_country on crisis_resources(country_code) where is_active = true;

-- ------------------------------------------------------------
-- RENDSZERBEÁLLÍTÁSOK
-- ------------------------------------------------------------
create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- updated_at automatikus frissítés
-- ------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'rooms', 'messages', 'private_conversations', 'private_messages',
      'anonymous_posts', 'journal_entries', 'crisis_resources'
    ])
  loop
    execute format(
      'create trigger trg_set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end $$;
