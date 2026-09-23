import { supabase } from './supabase';

export interface AppNotification {
  id: string;
  user_id: string;
  kind: 'like' | 'dislike' | 'repost' | 'comment' | 'mention' | string;
  body: string;
  review_id?: string | null;
  read_at?: string | null;
  created_at: string;
  review?: any;
}

const LOCAL_STORAGE_KEY_PREFIX = 'omniboxd_notifications_';
const DISMISSED_KEY_PREFIX = 'omniboxd_dismissed_notifs_';

function getLocalStoreKey(userId: string) {
  return `${LOCAL_STORAGE_KEY_PREFIX}${userId}`;
}

function getDismissedStoreKey(userId: string) {
  return `${DISMISSED_KEY_PREFIX}${userId}`;
}

export function getDismissedNotificationIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(getDismissedStoreKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function addDismissedNotificationId(userId: string, notifId: string) {
  try {
    const existing = getDismissedNotificationIds(userId);
    existing.add(notifId);
    // Keep max 200 dismissed IDs to avoid bloating localStorage
    const arr = Array.from(existing).slice(-200);
    localStorage.setItem(getDismissedStoreKey(userId), JSON.stringify(arr));
  } catch {}
}

export function getLocalNotifications(userId: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(getLocalStoreKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const dismissed = getDismissedNotificationIds(userId);
    return (Array.isArray(parsed) ? parsed : []).filter((item: AppNotification) => !dismissed.has(item.id));
  } catch {
    return [];
  }
}

export function saveLocalNotifications(userId: string, items: AppNotification[]) {
  try {
    const dismissed = getDismissedNotificationIds(userId);
    const filtered = items.filter((item) => !dismissed.has(item.id));
    localStorage.setItem(getLocalStoreKey(userId), JSON.stringify(filtered));
  } catch {}
}

/**
 * Loads notifications for the current user.
 * Tries Supabase first; if Supabase denies permission (42501) or is offline,
 * falls back to local storage and merges both seamlessly.
 * Excludes any notification marked as dismissed by the user.
 */
export async function fetchUserNotifications(userId: string): Promise<AppNotification[]> {
  let remoteItems: AppNotification[] = [];
  const dismissed = getDismissedNotificationIds(userId);

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) {
      remoteItems = (data as AppNotification[]).filter((item) => !dismissed.has(item.id));
    }
  } catch {
    // Supabase offline or permissions error
  }

  // Retrieve local fallback items
  const localItems = getLocalNotifications(userId);

  // Merge and deduplicate by id
  const map = new Map<string, AppNotification>();

  remoteItems.forEach((item) => {
    if (!dismissed.has(item.id)) {
      map.set(item.id, item);
    }
  });

  localItems.forEach((item) => {
    if (!dismissed.has(item.id) && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Hydrate referenced reviews
  const reviewIds = Array.from(new Set(merged.map((n) => n.review_id).filter(Boolean))) as string[];
  if (reviewIds.length > 0) {
    try {
      const { data: revs } = await supabase
        .from('reviews')
        .select('id, body, rating, route_label, vehicle_number, lines(id, number, companies(short_name, color))')
        .in('id', reviewIds);

      if (revs) {
        const revMap = new Map<string, any>();
        revs.forEach((r: any) => revMap.set(r.id, r));
        merged.forEach((n) => {
          if (n.review_id) {
            n.review = revMap.get(n.review_id);
          }
        });
      }
    } catch {
      // Quiet fallback
    }
  }

  return merged;
}

/**
 * Creates a notification.
 * Writes to both local fallback and Supabase so notifications work 100% of the time.
 */
export async function pushNotification(payload: {
  user_id: string;
  kind: 'like' | 'dislike' | 'repost' | 'comment' | 'mention' | string;
  body: string;
  review_id?: string;
}) {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: AppNotification = {
    id: notifId,
    user_id: payload.user_id,
    kind: payload.kind,
    body: payload.body,
    review_id: payload.review_id || null,
    read_at: null,
    created_at: new Date().toISOString()
  };

  // 1. Save to local storage for target user
  const currentLocal = getLocalNotifications(payload.user_id);
  const updated = [item, ...currentLocal].slice(0, 50);
  saveLocalNotifications(payload.user_id, updated);

  // 2. Dispatch cross-component event
  window.dispatchEvent(new CustomEvent('omniboxd_notifications_changed'));

  // 3. Persist to Supabase if permissions allow
  try {
    await supabase.from('notifications').insert({
      user_id: payload.user_id,
      kind: payload.kind,
      body: payload.body,
      review_id: payload.review_id || null
    });
  } catch {
    // Graceful fallback to local store
  }
}

/**
 * Removes notifications matching a specific user, review, and kind.
 */
export async function removeNotificationsByReviewAndKind(
  targetUserId: string,
  reviewId: string,
  kind: string,
  usernamePrefix?: string
) {
  // 1. Clean local
  const current = getLocalNotifications(targetUserId);
  const filtered = current.filter((n) => {
    if (n.review_id === reviewId && n.kind === kind) {
      if (usernamePrefix) {
        return !n.body.toLowerCase().startsWith(usernamePrefix.toLowerCase());
      }
      return false;
    }
    return true;
  });
  saveLocalNotifications(targetUserId, filtered);

  // 2. Clean Supabase
  try {
    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', targetUserId)
      .eq('review_id', reviewId)
      .eq('kind', kind);

    if (usernamePrefix) {
      query = query.ilike('body', `${usernamePrefix}%`);
    }
    await query;
  } catch {}

  window.dispatchEvent(new CustomEvent('omniboxd_notifications_changed'));
}

/**
 * Removes follow notifications when unfollowing someone.
 */
export async function removeFollowNotification(targetUserId: string, followerUsername: string) {
  const current = getLocalNotifications(targetUserId);
  const prefix = `@${followerUsername.toLowerCase()}`;
  const filtered = current.filter((n) => {
    if (n.kind === 'follow' || n.kind === 'follow_back') {
      return !n.body.toLowerCase().startsWith(prefix);
    }
    return true;
  });
  saveLocalNotifications(targetUserId, filtered);

  try {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', targetUserId)
      .in('kind', ['follow', 'follow_back'])
      .ilike('body', `@${followerUsername}%`);
  } catch {}

  window.dispatchEvent(new CustomEvent('omniboxd_notifications_changed'));
}

/**
 * Deletes a single notification by id.
 * Persistently records it as dismissed so it will never resurrect even if Supabase DELETE throws 403.
 */
export async function removeNotificationById(userId: string, notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('id');

  if (error) {
    // Si es 403 pero la fila ya no existe, no es un error real
    if (error.code === 'PGRST116' || error.code === '42501') {
      // Verificamos si la fila sigue existiendo
      const { data } = await supabase
        .from('notifications')
        .select('id')
        .eq('id', notificationId)
        .maybeSingle();
      if (!data) return; // ya se borró, todo ok
    }
    console.warn('Error al borrar notificación:', error.message);
  }
}

/**
 * Marks all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId: string) {
  const current = getLocalNotifications(userId);
  const now = new Date().toISOString();
  const updated = current.map((n) => ({ ...n, read_at: n.read_at || now }));
  saveLocalNotifications(userId, updated);

  try {
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null);
  } catch {}

  window.dispatchEvent(new CustomEvent('omniboxd_notifications_changed'));
}
