'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PrivateRequestBanner } from '@/components/private/PrivateRequestBanner';
import type { ConversationRequest, Profile } from '@/types/database';

interface ConversationSummary {
  conversationId: string;
  otherProfile: Profile;
  lastMessagePreview: string | null;
  updatedAt: string;
}

export default function PrivateConversationsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [requests, setRequests] = useState<(ConversationRequest & { sender: Profile })[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setUserId(userData.user.id);

      const { data: requestData } = await supabase
        .from('conversation_requests')
        .select('*, sender:sender_id(*)')
        .eq('recipient_id', userData.user.id)
        .eq('status', 'fuggoben');
      setRequests((requestData as any) ?? []);

      const { data: memberships } = await supabase
        .from('private_conversation_members')
        .select('conversation_id, private_conversations(id, updated_at)')
        .eq('profile_id', userData.user.id)
        .eq('is_archived', false);

      const summaries: ConversationSummary[] = [];
      for (const m of (memberships as any[]) ?? []) {
        const { data: otherMembers } = await supabase
          .from('private_conversation_members')
          .select('profile_id, profiles(*)')
          .eq('conversation_id', m.conversation_id)
          .neq('profile_id', userData.user.id);

        const other = otherMembers?.[0] as any;
        if (!other) continue;

        const { data: lastMessage } = await supabase
          .from('private_messages')
          .select('content, created_at')
          .eq('conversation_id', m.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        summaries.push({
          conversationId: m.conversation_id,
          otherProfile: other.profiles,
          lastMessagePreview: lastMessage?.content ?? null,
          updatedAt: lastMessage?.created_at ?? m.private_conversations?.updated_at,
        });
      }
      summaries.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
      setConversations(summaries);

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handleAccept(request: ConversationRequest) {
    const { data: conversation } = await supabase
      .from('private_conversations')
      .insert({ created_from_request_id: request.id })
      .select()
      .single();

    if (!conversation) return;

    await supabase.from('private_conversation_members').insert([
      { conversation_id: conversation.id, profile_id: request.sender_id },
      { conversation_id: conversation.id, profile_id: request.recipient_id },
    ]);

    await supabase
      .from('conversation_requests')
      .update({ status: 'elfogadva', responded_at: new Date().toISOString() })
      .eq('id', request.id);

    router.push(`/uzenetek/${conversation.id}`);
  }

  async function handleDecline(request: ConversationRequest) {
    await supabase
      .from('conversation_requests')
      .update({ status: 'elutasitva', responded_at: new Date().toISOString() })
      .eq('id', request.id);
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="font-display text-2xl text-moonlight-100">Privát beszélgetések</h1>

      {requests.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-moonlight-300">Függő kérelmek</p>
          {requests.map((r) => (
            <PrivateRequestBanner
              key={r.id}
              senderName={r.sender?.display_name ?? 'Ismeretlen'}
              message={r.message}
              onAccept={() => handleAccept(r)}
              onDecline={() => handleDecline(r)}
            />
          ))}
        </section>
      )}

      <section className="space-y-2">
        {conversations.length === 0 ? (
          <EmptyState
            title="Még nincs privát beszélgetésed"
            description="Kérelmet a párosító oldalon vagy egy másik profilról indíthatsz."
          />
        ) : (
          conversations.map((c) => (
            <Link
              key={c.conversationId}
              href={`/uzenetek/${c.conversationId}`}
              className="flex items-center justify-between rounded-xl border border-night-800 bg-night-900 p-4 hover:border-dusk-500"
            >
              <div>
                <p className="font-medium text-moonlight-100">{c.otherProfile.display_name}</p>
                {c.lastMessagePreview && (
                  <p className="mt-0.5 truncate text-sm text-moonlight-300">{c.lastMessagePreview}</p>
                )}
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
