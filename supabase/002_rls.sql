-- ============================================================
-- ROW LEVEL SECURITY SZABÁLYOK
-- Futtasd a 001_schema.sql UTÁN.
-- ============================================================

-- Segédfüggvény: aktuális felhasználó szerepe
create or replace function current_user_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff()
returns boolean as $$
  select coalesce(current_user_role() in ('moderator', 'admin'), false);
$$ language sql stable security definer;

create or replace function is_admin()
returns boolean as $$
  select coalesce(current_user_role() = 'admin', false);
$$ language sql stable security definer;

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
alter table profiles enable row level security;

create policy "profilok nyilvanosan olvashatok" on profiles
  for select using (true);

create policy "sajat profil szerkesztese" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "sajat profil letrehozasa" on profiles
  for insert with check (auth.uid() = id);

create policy "staff kezelheti a profilokat" on profiles
  for update using (is_staff());

-- ------------------------------------------------------------
-- GUEST_SESSIONS - csak a service role kezeli szerveroldalon,
-- kliens csak sajat session tokennel érhet el (edge function / API route mögött)
-- ------------------------------------------------------------
alter table guest_sessions enable row level security;

create policy "vendeg sajat session olvasasa" on guest_sessions
  for select using (true);

-- Inzertálás/módosítás csak service role-lal (API route), kliens nem írhat közvetlenül.

-- ------------------------------------------------------------
-- ROOMS
-- ------------------------------------------------------------
alter table rooms enable row level security;

create policy "aktiv szobak mindenki szamara lathatok" on rooms
  for select using (is_archived = false or is_staff());

create policy "staff kezelheti a szobakat" on rooms
  for all using (is_staff()) with check (is_staff());

-- ------------------------------------------------------------
-- ROOM_MEMBERS
-- ------------------------------------------------------------
alter table room_members enable row level security;

create policy "szoba tagsag lathato" on room_members
  for select using (true);

create policy "sajat tagsag letrehozasa" on room_members
  for insert with check (
    (profile_id is not null and profile_id = auth.uid()) or profile_id is null
  );

create policy "sajat tagsag torlese" on room_members
  for delete using (profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- MESSAGES
-- ------------------------------------------------------------
alter table messages enable row level security;

create policy "szoba uzenetek olvashatok" on messages
  for select using (is_deleted = false or is_staff());

create policy "belepett felhasznalo uzenetkuldese" on messages
  for insert with check (
    author_profile_id = auth.uid() or author_profile_id is null
  );

create policy "sajat uzenet szerkesztese-torlese" on messages
  for update using (author_profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- MESSAGE_REACTIONS
-- ------------------------------------------------------------
alter table message_reactions enable row level security;

create policy "reakciok olvashatok" on message_reactions for select using (true);

create policy "sajat reakcio letrehozasa" on message_reactions
  for insert with check (profile_id = auth.uid() or profile_id is null);

create policy "sajat reakcio torlese" on message_reactions
  for delete using (profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- CONVERSATION_REQUESTS
-- ------------------------------------------------------------
alter table conversation_requests enable row level security;

create policy "erintett felek lathatjak a kerelmet" on conversation_requests
  for select using (sender_id = auth.uid() or recipient_id = auth.uid() or is_staff());

create policy "kerelem kuldese" on conversation_requests
  for insert with check (sender_id = auth.uid());

create policy "cimzett valaszolhat a kerelemre" on conversation_requests
  for update using (recipient_id = auth.uid() or sender_id = auth.uid());

-- ------------------------------------------------------------
-- PRIVATE_CONVERSATIONS + TAGOK
-- ------------------------------------------------------------
alter table private_conversations enable row level security;
alter table private_conversation_members enable row level security;

create policy "csak tagok lathatjak a beszelgetest" on private_conversations
  for select using (
    exists (
      select 1 from private_conversation_members m
      where m.conversation_id = private_conversations.id and m.profile_id = auth.uid()
    ) or is_staff()
  );

create policy "tagsag lathato a resztvevoknek" on private_conversation_members
  for select using (
    profile_id = auth.uid() or
    exists (
      select 1 from private_conversation_members m2
      where m2.conversation_id = private_conversation_members.conversation_id and m2.profile_id = auth.uid()
    ) or is_staff()
  );

create policy "sajat tagsag frissitese" on private_conversation_members
  for update using (profile_id = auth.uid());

-- ------------------------------------------------------------
-- PRIVATE_MESSAGES
-- ------------------------------------------------------------
alter table private_messages enable row level security;

create policy "csak a beszelgetes tagjai olvashatjak" on private_messages
  for select using (
    exists (
      select 1 from private_conversation_members m
      where m.conversation_id = private_messages.conversation_id and m.profile_id = auth.uid()
    ) or is_staff()
  );

create policy "tag kuldhet privat uzenetet" on private_messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from private_conversation_members m
      where m.conversation_id = private_messages.conversation_id and m.profile_id = auth.uid()
    )
  );

create policy "sajat privat uzenet szerkesztese" on private_messages
  for update using (sender_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- ANONYMOUS_POSTS
-- ------------------------------------------------------------
alter table anonymous_posts enable row level security;

create policy "nyilvanos bejegyzesek olvashatok" on anonymous_posts
  for select using (is_removed = false or is_staff());

create policy "bejegyzes letrehozasa" on anonymous_posts
  for insert with check (author_profile_id = auth.uid() or author_profile_id is null);

create policy "sajat bejegyzes szerkesztese-torlese" on anonymous_posts
  for update using (author_profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- ANONYMOUS_POST_COMMENTS
-- ------------------------------------------------------------
alter table anonymous_post_comments enable row level security;

create policy "hozzaszolasok olvashatok" on anonymous_post_comments
  for select using (is_removed = false or is_staff());

create policy "hozzaszolas letrehozasa" on anonymous_post_comments
  for insert with check (author_profile_id = auth.uid() or author_profile_id is null);

create policy "sajat hozzaszolas kezelese" on anonymous_post_comments
  for update using (author_profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- ANONYMOUS_POST_REACTIONS
-- ------------------------------------------------------------
alter table anonymous_post_reactions enable row level security;

create policy "bejegyzes reakciok olvashatok" on anonymous_post_reactions for select using (true);

create policy "sajat reakcio bejegyzeshez" on anonymous_post_reactions
  for insert with check (profile_id = auth.uid() or profile_id is null);

create policy "sajat reakcio torlese bejegyzesrol" on anonymous_post_reactions
  for delete using (profile_id = auth.uid() or is_staff());

-- ------------------------------------------------------------
-- JOURNAL_ENTRIES - csak a tulajdonos
-- ------------------------------------------------------------
alter table journal_entries enable row level security;

create policy "csak sajat naplo olvashato" on journal_entries
  for select using (owner_id = auth.uid());

create policy "sajat naplobejegyzes letrehozasa" on journal_entries
  for insert with check (owner_id = auth.uid());

create policy "sajat naplobejegyzes kezelese" on journal_entries
  for update using (owner_id = auth.uid());

create policy "sajat naplobejegyzes torlese" on journal_entries
  for delete using (owner_id = auth.uid());

-- ------------------------------------------------------------
-- DAILY_QUESTIONS / ANSWERS
-- ------------------------------------------------------------
alter table daily_questions enable row level security;
alter table daily_question_answers enable row level security;

create policy "kerdesek mindenki szamara lathatok" on daily_questions for select using (true);

create policy "staff kezelheti a kerdeseket" on daily_questions
  for all using (is_staff()) with check (is_staff());

create policy "valaszok olvashatok" on daily_question_answers for select using (true);

create policy "valasz letrehozasa" on daily_question_answers
  for insert with check (author_profile_id = auth.uid() or author_profile_id is null);

-- ------------------------------------------------------------
-- NOTIFICATIONS - csak a cimzett
-- ------------------------------------------------------------
alter table notifications enable row level security;

create policy "csak sajat ertesitesek" on notifications
  for select using (recipient_id = auth.uid());

create policy "sajat ertesites frissitese (olvasott)" on notifications
  for update using (recipient_id = auth.uid());

-- ------------------------------------------------------------
-- REPORTS
-- ------------------------------------------------------------
alter table reports enable row level security;

create policy "sajat jelentesek lathatok, staff mindet latja" on reports
  for select using (reporter_profile_id = auth.uid() or is_staff());

create policy "jelentes letrehozasa" on reports
  for insert with check (reporter_profile_id = auth.uid() or reporter_profile_id is null);

create policy "staff kezelheti a jelenteseket" on reports
  for update using (is_staff());

-- ------------------------------------------------------------
-- USER_BLOCKS - csak a blokkoló
-- ------------------------------------------------------------
alter table user_blocks enable row level security;

create policy "sajat blokklista lathato" on user_blocks
  for select using (blocker_id = auth.uid());

create policy "blokkolas letrehozasa" on user_blocks
  for insert with check (blocker_id = auth.uid());

create policy "blokkolas feloldasa" on user_blocks
  for delete using (blocker_id = auth.uid());

-- ------------------------------------------------------------
-- MODERATION_ACTIONS - csak staff
-- ------------------------------------------------------------
alter table moderation_actions enable row level security;

create policy "erintett lathatja sajat moderaciojat, staff mindet" on moderation_actions
  for select using (target_profile_id = auth.uid() or is_staff());

create policy "staff hozhat letre moderacios muveletet" on moderation_actions
  for insert with check (is_staff());

-- ------------------------------------------------------------
-- BADGES / USER_BADGES
-- ------------------------------------------------------------
alter table badges enable row level security;
alter table user_badges enable row level security;

create policy "jelvenyek mindenki szamara lathatok" on badges for select using (true);
create policy "staff kezelheti a jelvenyeket" on badges for all using (is_staff()) with check (is_staff());

create policy "felhasznaloi jelvenyek lathatok" on user_badges for select using (true);
create policy "staff adhat jelvenyt" on user_badges for insert with check (is_staff());

-- ------------------------------------------------------------
-- CRISIS_RESOURCES - nyilvanos olvasas, csak admin szerkeszti
-- ------------------------------------------------------------
alter table crisis_resources enable row level security;

create policy "krizis eroforrasok nyilvanosak" on crisis_resources
  for select using (is_active = true or is_staff());

create policy "admin kezelheti a krizis eroforrasokat" on crisis_resources
  for all using (is_admin()) with check (is_admin());

-- ------------------------------------------------------------
-- SYSTEM_SETTINGS - csak admin
-- ------------------------------------------------------------
alter table system_settings enable row level security;

create policy "admin lathatja a beallitasokat" on system_settings
  for select using (is_admin());

create policy "admin kezelheti a beallitasokat" on system_settings
  for all using (is_admin()) with check (is_admin());
