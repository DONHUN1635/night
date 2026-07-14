-- ============================================================
-- REALTIME BEÁLLÍTÁSOK
-- Futtasd a 003_seed.sql UTÁN.
-- Ezek engedélyezik az élő (WebSocket alapú) frissítéseket.
-- ============================================================

alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_reactions;
alter publication supabase_realtime add table private_messages;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table conversation_requests;
