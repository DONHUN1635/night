'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageInput } from '@/components/chat/MessageInput';
import { CrisisSupportPanel } from '@/components/shared/CrisisSupportPanel';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { isPotentialCrisisMessage } from '@/lib/crisisDetection';
import { LoadingState } from '@/components/shared/LoadingState';
import clsx from 'clsx';
import type { PrivateMessage, Profile } from '@/types/database';

export default function PrivateConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const router = useRouter();
  const conversationId = params.id;

  const [userId, setUserId] = useState<string | null>(null);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [showCrisisPanel, setShowCrisisPanel] = useState(false);
  const [crisisResources, setCrisisResources] = useState<
    { name: string; phone_number: string | null; url: string | null; description: string | null }[]
  >([]);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUserId(userData.user.id);

      const { data: otherMembers } = await supabase
        .from('private_conversation_members')
        .select('profile_id, profiles(*)')
        .eq('conversation_id', conversationId)
        .neq('profile_id', userData.user.id);

      setOtherProfile(((otherMembers?.[0] as any)?.profiles as Profile) ?? null);

      const { data: messageData } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      setMessages((messageData as PrivateMessage[]) ?? []);

      await supabase
        .from('private_conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('profile_id', userData.user.id);

      const { data: resourceData } = await supabase
        .from('crisis_resources')
        .select('name, phone_number, url, description')
        .eq('is_active', true)
        .eq('country_code', 'HU');
      setCrisisResources(resourceData ?? []);

      setLoading(false);
    }
    load();
  }, [conversationId, supabase, router]);

  useEffect(() => {
    const channel = supabase
      .channel(`private-messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as PrivateMessage])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    const typingChannel = supabase.channel(`private-typing-${conversationId}`, {
      config: { broadcast: { self: false } },
    });
    typingChannel
      .on('broadcast', { event: 'typing' }, () => {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      })
      .subscribe();
    typingChannelRef.current = typingChannel;
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSend(content: string) {
    if (!userId) return;
    if (isPotentialCrisisMessage(content)) setShowCrisisPanel(true);

    await supabase.from('private_messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
    });
  }

  function handleTyping() {
    typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: {} });
  }

  async function handleBlock() {
    if (!userId || !otherProfile) return;
    await supabase.from('user_blocks').insert({ blocker_id: userId, blocked_id: otherProfile.id });
    setShowBlockConfirm(false);
    router.push('/uzenetek');
  }

  async function handleArchive() {
    if (!userId) return;
    await supabase
      .from('private_conversation_members')
      .update({ is_archived: true })
      .eq('conversation_id', conversationId)
      .eq('profile_id', userId);
    router.push('/uzenetek');
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-night-800 bg-night-900/60">
      <div className="flex items-center justify-between border-b border-night-800 p-4">
        <p className="font-display text-lg text-moonlight-100">{otherProfile?.display_name ?? 'Beszélgetés'}</p>
        <div className="flex gap-3 text-xs">
          <button onClick={handleArchive} className="text-moonlight-300 hover:text-moonlight-100">Archiválás</button>
          <button onClick={() => setShowBlockConfirm(true)} className="text-moonlight-300 hover:text-red-400">Tiltás</button>
        </div>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={clsx('my-1.5 flex', m.sender_id === userId ? 'justify-end' : 'justify-start')}>
            <div
              className={clsx(
                'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                m.sender_id === userId ? 'bg-dusk-600 text-white' : 'bg-night-800 text-moonlight-100'
              )}
            >
              {m.is_deleted ? <span className="italic opacity-60">Törölt üzenet</span> : m.content}
            </div>
          </div>
        ))}
        {typing && <p className="text-xs italic text-moonlight-300/60">{otherProfile?.display_name} gépel…</p>}
      </div>

      <MessageInput onSend={handleSend} onTyping={handleTyping} />

      {showCrisisPanel && (
        <CrisisSupportPanel resources={crisisResources} onDismiss={() => setShowCrisisPanel(false)} />
      )}

      {showBlockConfirm && (
        <ConfirmDialog
          title={`Letiltod ${otherProfile?.display_name ?? 'ezt a felhasználót'}?`}
          description="Ezután nem tud üzenetet küldeni neked."
          confirmLabel="Tiltás"
          danger
          onConfirm={handleBlock}
          onCancel={() => setShowBlockConfirm(false)}
        />
      )}
    </div>
  );
}
