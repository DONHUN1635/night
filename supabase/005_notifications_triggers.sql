-- ============================================================
-- ÉRTESÍTÉS TRIGGEREK
-- Futtasd a 004_realtime.sql UTÁN.
-- Ezek automatikusan létrehozzák az értesítéseket a megfelelő eseményeknél.
-- ============================================================

-- Privát beszélgetési kérelem -> értesítés a címzettnek
create or replace function notify_conversation_request()
returns trigger as $$
begin
  insert into notifications (recipient_id, type, payload)
  values (new.recipient_id, 'privat_kerelem', jsonb_build_object('request_id', new.id, 'sender_id', new.sender_id));
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_conversation_request
  after insert on conversation_requests
  for each row execute function notify_conversation_request();

-- Privát üzenet -> értesítés a beszélgetés másik tagjának
create or replace function notify_private_message()
returns trigger as $$
begin
  insert into notifications (recipient_id, type, payload)
  select m.profile_id, 'privat_uzenet', jsonb_build_object('conversation_id', new.conversation_id, 'message_id', new.id)
  from private_conversation_members m
  where m.conversation_id = new.conversation_id and m.profile_id <> new.sender_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_private_message
  after insert on private_messages
  for each row execute function notify_private_message();

-- Bejegyzés reakció -> értesítés a szerzőnek
create or replace function notify_post_reaction()
returns trigger as $$
begin
  insert into notifications (recipient_id, type, payload)
  select p.author_profile_id, 'reakcio_bejegyzesre', jsonb_build_object('post_id', new.post_id, 'reaction_type', new.reaction_type)
  from anonymous_posts p
  where p.id = new.post_id and p.author_profile_id is not null and p.author_profile_id <> coalesce(new.profile_id, '00000000-0000-0000-0000-000000000000'::uuid);
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_post_reaction
  after insert on anonymous_post_reactions
  for each row execute function notify_post_reaction();

-- Moderációs művelet -> figyelmeztetés a felhasználónak
create or replace function notify_moderation_action()
returns trigger as $$
begin
  if new.action_type = 'figyelmeztetes' then
    insert into notifications (recipient_id, type, payload)
    values (new.target_profile_id, 'moderatori_figyelmeztetes', jsonb_build_object('reason', new.reason));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_moderation_action
  after insert on moderation_actions
  for each row execute function notify_moderation_action();

-- Válasz üzenetre szobában -> értesítés az eredeti üzenet szerzőjének
create or replace function notify_message_reply()
returns trigger as $$
declare
  original_author uuid;
begin
  if new.reply_to_message_id is not null then
    select author_profile_id into original_author from messages where id = new.reply_to_message_id;
    if original_author is not null and original_author <> coalesce(new.author_profile_id, '00000000-0000-0000-0000-000000000000'::uuid) then
      insert into notifications (recipient_id, type, payload)
      values (original_author, 'valasz_erkezett', jsonb_build_object('room_id', new.room_id, 'message_id', new.id));
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_notify_message_reply
  after insert on messages
  for each row execute function notify_message_reply();
