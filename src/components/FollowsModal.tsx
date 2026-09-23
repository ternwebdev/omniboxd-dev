import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, UserCheck, UserPlus, Search, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { pushNotification, removeFollowNotification } from '../lib/notifications';
import { UserProfile } from '../types';
import { useScrollLock } from '../lib/scrollLock';
import { parseUserBioAndMeta } from '../lib/profileSync';

export interface FollowsModalUser {
  id: string;
  username: string;
  avatar_url?: string | null;
  bio?: string | null;
}

interface FollowsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  profileUserId: string;
  profileUsername: string;
  currentUser: UserProfile | null;
  onNavigate: (view: string, param?: string) => void;
  onFollowCountChange?: (deltaFollowers: number, deltaFollowing: number) => void;
}

export const FollowsModal: React.FC<FollowsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'followers',
  profileUserId,
  profileUsername,
  currentUser,
  onNavigate,
  onFollowCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followersList, setFollowersList] = useState<FollowsModalUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowsModalUser[]>([]);
  const [myFollowersSet, setMyFollowersSet] = useState<Set<string>>(new Set());
  const [myFollowingSet, setMyFollowingSet] = useState<Set<string>>(new Set());
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Lock background scroll
  useScrollLock(isOpen);

  // Popstate back button support
  useEffect(() => {
    if (!isOpen) return;

    const modalSessionKey = 'omniboxd_follows_modal_' + Date.now();
    window.history.pushState({ modal: modalSessionKey }, '');

    let closedByPop = false;
    const handlePopState = () => {
      closedByPop = true;
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByPop && window.history.state?.modal === modalSessionKey) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);

  // Sync tab with initialTab prop when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Load all followers/following data
  useEffect(() => {
    if (!isOpen || !profileUserId) return;

    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        // 1. Fetch followers of the profile
        const { data: followersRows } = await supabase
          .from('follows')
          .select('follower_id, created_at')
          .eq('following_id', profileUserId)
          .order('created_at', { ascending: false });

        // 2. Fetch who the profile is following
        const { data: followingRows } = await supabase
          .from('follows')
          .select('following_id, created_at')
          .eq('follower_id', profileUserId)
          .order('created_at', { ascending: false });

        const followerIds = (followersRows || []).map((r: any) => r.follower_id).filter(Boolean);
        const followingIds = (followingRows || []).map((r: any) => r.following_id).filter(Boolean);

        const allUserIds = Array.from(new Set([...followerIds, ...followingIds]));

        // 3. Fetch user details in bulk
        let userMap = new Map<string, FollowsModalUser>();
        if (allUserIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, avatar_url, bio')
            .in('id', allUserIds);

          if (usersData) {
  usersData.forEach((u: any) => {
    const { cleanBio } = parseUserBioAndMeta(u.bio);
    userMap.set(u.id, {
      id: u.id,
      username: u.username || 'viajero',
      avatar_url: u.avatar_url || null,
      bio: cleanBio || null
    });
  });
}
        }

        const resolvedFollowers: FollowsModalUser[] = followerIds
          .map((id: string) => userMap.get(id))
          .filter(Boolean) as FollowsModalUser[];

        const resolvedFollowing: FollowsModalUser[] = followingIds
          .map((id: string) => userMap.get(id))
          .filter(Boolean) as FollowsModalUser[];

        // 4. Fetch mutual follow relationships for currentUser
        let currentFollowers = new Set<string>();
        let currentFollowing = new Set<string>();

        if (currentUser) {
          const [myFollowersRes, myFollowingRes] = await Promise.all([
            supabase.from('follows').select('follower_id').eq('following_id', currentUser.id),
            supabase.from('follows').select('following_id').eq('follower_id', currentUser.id)
          ]);

          if (myFollowersRes.data) {
            currentFollowers = new Set(myFollowersRes.data.map((r: any) => r.follower_id));
          }
          if (myFollowingRes.data) {
            currentFollowing = new Set(myFollowingRes.data.map((r: any) => r.following_id));
          }
        }

        if (!isMounted) return;

        setFollowersList(resolvedFollowers);
        setFollowingList(resolvedFollowing);
        setMyFollowersSet(currentFollowers);
        setMyFollowingSet(currentFollowing);
      } catch (err) {
        console.error('Error loading follows data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, profileUserId, currentUser?.id]);

  // Handle follow / unfollow toggle
  const handleToggleFollow = async (targetUser: FollowsModalUser) => {
    if (!currentUser) {
      onClose();
      onNavigate('auth');
      return;
    }

    if (actionLoadingId || targetUser.id === currentUser.id) return;

    setActionLoadingId(targetUser.id);
    const isCurrentlyFollowing = myFollowingSet.has(targetUser.id);

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUser.id);

        setMyFollowingSet((prev) => {
          const next = new Set(prev);
          next.delete(targetUser.id);
          return next;
        });

        // If this is own profile, remove from following list immediately
        if (profileUserId === currentUser.id) {
          setFollowingList((prev) => prev.filter((u) => u.id !== targetUser.id));
          onFollowCountChange?.(0, -1);
        }

        // Clean up follow notification
        await removeFollowNotification(targetUser.id, currentUser.username);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: targetUser.id });

        setMyFollowingSet((prev) => {
          const next = new Set(prev);
          next.add(targetUser.id);
          return next;
        });

        // If this is own profile, add to following list
        if (profileUserId === currentUser.id) {
          setFollowingList((prev) => [targetUser, ...prev.filter((u) => u.id !== targetUser.id)]);
          onFollowCountChange?.(0, 1);
        }

        // Check if target user is following currentUser (to determine "follow back" vs "started following")
        const isFollowBack = myFollowersSet.has(targetUser.id);
        const notifBody = isFollowBack
          ? `@${currentUser.username} te devolvió el follow`
          : `@${currentUser.username} te empezó a seguir`;

        await pushNotification({
          user_id: targetUser.id,
          kind: isFollowBack ? 'follow_back' : 'follow',
          body: notifBody
        });
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isVideoAvatar = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(url);
  };

  // Filter list by search query
  const displayedList = useMemo(() => {
    const list = activeTab === 'followers' ? followersList : followingList;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [activeTab, followersList, followingList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 touch-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 touch-auto overscroll-contain modal-scroll-area"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm text-[var(--text)] truncate">
                @{profileUsername}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                Mi comunidad de seguidores y seguidos en omniboxd
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text)] border border-[var(--border)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Seguidores & Siguiendo */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'followers'
                ? 'border-amber-400 text-amber-400 bg-[var(--surface)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Seguidores</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'followers'
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-[var(--surface)] text-[var(--text-dim)]'
              }`}
            >
              {followersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'following'
                ? 'border-amber-400 text-amber-400 bg-[var(--surface)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Siguiendo</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                activeTab === 'following'
                  ? 'bg-amber-400/20 text-amber-300'
                  : 'bg-[var(--surface)] text-[var(--text-dim)]'
              }`}
            >
              {followingList.length}
            </span>
          </button>
        </div>

        {/* Search input (if list has users) */}
        {(followersList.length > 0 || followingList.length > 0) && (
          <div className="p-3 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-dim)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar viajero..."
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text)] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Users list body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-[var(--border)]/40">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">Cargando viajeros…</span>
            </div>
          ) : displayedList.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)]">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[var(--text)]">
                {searchQuery
                  ? 'No se encontraron resultados'
                  : activeTab === 'followers'
                  ? 'Aún no tiene seguidores'
                  : 'Aún no sigue a ningún viajero'}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] max-w-xs">
                {searchQuery
                  ? 'Probá buscando con otro nombre de usuario.'
                  : activeTab === 'followers'
                  ? 'Los usuarios que te sigan aparecerán en esta lista.'
                  : 'Explorá omniposteos y seguí a otros viajeros para ver su actividad.'}
              </p>
            </div>
          ) : (
            displayedList.map((user) => {
              const isMe = currentUser?.id === user.id;
              const doesUserFollowMe = myFollowersSet.has(user.id);
              const doIFollowUser = myFollowingSet.has(user.id);
              const isHovered = hoveredUserId === user.id;
              const isProcessing = actionLoadingId === user.id;

              return (
                <div
                  key={user.id}
                  className="pt-2.5 pb-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group"
                >
                  {/* User Avatar + Info */}
                  <div
                    onClick={() => {
                      onClose();
                      onNavigate('profile', user.username);
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    {/* Avatar */}
                    <div className="relative w-10 h-10 shrink-0">
                      {user.avatar_url ? (
                        isVideoAvatar(user.avatar_url) ? (
                          <video
                            src={user.avatar_url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-10 h-10 rounded-full object-cover border border-[var(--border)] group-hover:border-amber-400 transition-colors"
                          />
                        ) : (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border border-[var(--border)] group-hover:border-amber-400 transition-colors"
                          />
                        )
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-400 font-display font-bold text-sm flex items-center justify-center group-hover:border-amber-400 transition-colors">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Username & Bio */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-xs text-[var(--text)] group-hover:text-amber-400 transition-colors truncate">
                          @{user.username}
                        </span>

                        {/* "Te sigue" badge in both lists */}
                        {doesUserFollowMe && !isMe && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                            Te sigue
                          </span>
                        )}

                        {isMe && (
                          <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-semibold bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                            Tú
                          </span>
                        )}
                      </div>

                      {user.bio ? (
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 leading-snug mt-0.5">
                          {user.bio}
                        </p>
                      ) : (
                        <p className="text-[10px] text-[var(--text-dim)] mt-0.5 italic">
                          Usuario de omniboxd
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Follow / Unfollow Action Button */}
                  {currentUser && !isMe && (
                    <div className="shrink-0">
                      {doIFollowUser ? (
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(user)}
                          disabled={isProcessing}
                          onMouseEnter={() => setHoveredUserId(user.id)}
                          onMouseLeave={() => setHoveredUserId(null)}
                          className={`flat-btn text-[11px] py-1.5 px-3 font-semibold transition-all cursor-pointer ${
                            isHovered
                              ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-xs'
                              : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text)] hover:border-[var(--border-hover)]'
                          }`}
                          title={isHovered ? 'Dejar de seguir' : 'Siguiendo'}
                        >
                          {isProcessing ? (
                            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          ) : isHovered ? (
                            <UserCheck className="w-3 h-3 mr-1 text-rose-400" />
                          ) : (
                            <UserCheck className="w-3 h-3 mr-1 text-amber-400" />
                          )}
                          <span>
                            {isProcessing
                              ? 'Guardando…'
                              : isHovered
                              ? 'Dejar de seguir'
                              : 'Siguiendo'}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(user)}
                          disabled={isProcessing}
                          className="flat-btn text-[11px] py-1.5 px-3 font-bold bg-amber-400 text-black border-amber-300 hover:bg-amber-300 shadow-xs cursor-pointer flex items-center"
                          title="Seguir"
                        >
                          {isProcessing ? (
                            <span className="inline-block w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1" />
                          ) : (
                            <UserPlus className="w-3 h-3 mr-1" />
                          )}
                          <span>
                            {isProcessing
                              ? 'Guardando…'
                              : doesUserFollowMe
                              ? 'Devolver follow'
                              : '+ Seguir'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
