'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { MessageInput } from '@/components/chat/MessageInput';
import { CrisisSupportPanel } from '@/components/shared/CrisisSupportPanel';
import { isPotentialCrisisMessage } from '@/lib/crisisDetection';
import type { Message, Room } from '@/types/database';

export default function RoomChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const roomId = params.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('Vendég');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showCrisisPanel, setShowCrisisPanel] = useState(false);
  const [crisisResources, setCrisisResources] = useState<
    { name: string; phone_number: string | null; url: string | null; description: string | null }[]
  >([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Felhasználó / vendég azonosítása
  useEffect(() => {
    async function identify() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single();
        setDisplayName(profile?.display_name ?? 'Ismeretlen');
      } else if (typeof window !== 'undefined') {
        setCurrentGuestId(localStorage.getItem('hb_guest_id'));
        setDisplayName(localStorage.getItem('hb_guest_name') ?? 'Vendég');
      }
    }
    identify();
  }, [supabase]);

  // Szoba adatok és üzenetelőzmények betöltése
  useEffect(() => {
    async function load() {
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      setRoom(roomData as Room);

      const { data: messageData } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);
      setMessages((messageData as Message[]) ?? []);

      const { data: resourceData } = await supabase
        .from('crisis_resources')
        .select('name, phone_number, url, description')
        .eq('is_active', true)
        .eq('country_code', 'HU');
      setCrisisResources(resourceData ?? []);
    }
    load();
  }, [roomId, supabase]);

  // Realtime feliratkozás az új üzenetekre
  useEffect(() => {
    const channel = supabase
      .channel(`room-messages-${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id) ? prev : [...prev, payload.new as Message]
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === (payload.new as Message).id ? (payload.new as Message) : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  // Gépelési állapot broadcast csatorna
  useEffect(() => {
    const typingChannel = supabase.channel(`room-typing-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        const name = payload.payload.name as string;
        setTypingUsers((prev) => Array.from(new Set([...prev, name])));
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name));
        }, 2500);
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [roomId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleTyping() {
    typingChannelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { name: displayName },
    });
  }

  async function handleSend(content: string) {
    if (isPotentialCrisisMessage(content)) {
      setShowCrisisPanel(true);
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        room_id: roomId,
        author_profile_id: currentUserId,
        author_guest_id: currentUserId ? null : currentGuestId,
        author_display_name: displayName,
        content,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
    }
  }

  async function handleReact(messageId: string, reactionType: string) {
    await supabase.from('message_reactions').insert({
      message_id: messageId,
      profile_id: currentUserId,
      guest_session_id: currentUserId ? null : currentGuestId,
      reaction_type: reactionType,
    });
  }

  async function handleReport(messageId: string) {
    await supabase.from('reports').insert({
      reporter_profile_id: currentUserId,
      reporter_guest_id: currentUserId ? null : currentGuestId,
      target_type: 'uzenet',
      target_message_id: messageId,
      reason: 'felhasznaloi_jelentes',
    });
    alert('Köszönjük, jelentésedet rögzítettük.');
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-night-800 bg-night-900/60">
      <div className="border-b border-night-800 p-4">
        <p className="font-display text-lg text-moonlight-100">
          {room?.icon} {room?.name ?? 'Betöltés…'}
        </p>
        <p className="text-xs text-moonlight-300">{room?.rules}</p>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <ChatMessage
            key={m.id}
            message={m}
            isOwn={m.author_profile_id === currentUserId || (!!currentGuestId && m.author_guest_id === currentGuestId)}
            onReact={(type) => handleReact(m.id, type)}
            onReport={() => handleReport(m.id)}
          />
        ))}
        {typingUsers.length > 0 && (
          <p className="text-xs italic text-moonlight-300/60">{typingUsers.join(', ')} gépel…</p>
        )}
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />

      {showCrisisPanel && (
        <CrisisSupportPanel resources={crisisResources} onDismiss={() => setShowCrisisPanel(false)} />
      )}
    </div>
  );
}
