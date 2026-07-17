'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import type { AppNotification } from '@/types/database';

export default function NotificationsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setNotifications((data as AppNotification[]) ?? []);
      setLoading(false);

      const channel = supabase
        .channel(`notifications-${userData.user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userData.user.id}` },
          (payload) => setNotifications((prev) => [payload.new as AppNotification, ...prev])
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    load();
  }, [supabase, router]);

  async function markAsRead(notification: AppNotification) {
    if (!notification.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    }

    if (notification.type === 'privat_kerelem' || notification.type === 'privat_uzenet') {
      router.push('/uzenetek');
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl text-moonlight-100">Értesítések</h1>

      <div className="mt-4 space-y-2">
        {notifications.length === 0 ? (
          <EmptyState title="Nincs még értesítésed" />
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={() => markAsRead(n)} />
          ))
        )}
      </div>
    </div>
  );
}
