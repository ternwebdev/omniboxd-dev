import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';

interface UserPreview {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

const userCache = new Map<string, UserPreview | null>();

interface UserMentionProps {
  username: string;
  onNavigate: (view: string, param?: string) => void;
}

export const UserMention: React.FC<UserMentionProps> = ({ username, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserPreview | null>(userCache.get(username.toLowerCase()) || null);
  const [isLoading, setIsLoading] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserData = async () => {
    const key = username.toLowerCase();
    if (userCache.has(key)) {
      setUserData(userCache.get(key) || null);
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url, bio')
        .ilike('username', key)
        .maybeSingle();

      userCache.set(key, (data as UserPreview) || null);
      setUserData((data as UserPreview) || null);
    } catch {
      userCache.set(key, null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      loadUserData();
    }, 250);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setIsOpen(true);
      loadUserData();
    }, 350);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate('profile', username);
        }}
        className="font-medium text-sky-400 hover:text-sky-300 underline decoration-sky-400/30 hover:decoration-sky-400 cursor-pointer transition-colors"
      >
        @{username}
      </button>

      {/* Floating preview popover card */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-2 z-50 w-64 bg-[var(--surface)] border border-[var(--border-soft)] rounded-xl p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left cursor-default"
        >
          {isLoading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-[var(--text-muted)]">
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>Cargando perfil…</span>
            </div>
          ) : userData ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0">
                  {userData.avatar_url ? (
                    <img
                      src={userData.avatar_url}
                      alt={userData.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-xs text-[var(--text)] truncate leading-tight">
                    {userData.full_name || `@${userData.username}`}
                  </p>
                  <p className="text-[11px] text-sky-400 font-medium truncate">
                    @{userData.username}
                  </p>
                </div>
              </div>

              {userData.bio && (
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {userData.bio}
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('profile', userData.username);
                }}
                className="w-full py-1 text-center bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-semibold text-[11px] rounded-lg transition-colors cursor-pointer"
              >
                Ver perfil completo
              </button>
            </div>
          ) : (
            <div className="text-xs text-[var(--text-muted)] py-1">
              Usuario @{username}
            </div>
          )}
        </div>
      )}
    </span>
  );
};

interface CommentBodyProps {
  text: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CommentBody: React.FC<CommentBodyProps> = ({ text, onNavigate }) => {
  // Split text by @username pattern
  const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed text-[var(--text)]">
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const username = part.slice(1);
          return <UserMention key={i} username={username} onNavigate={onNavigate} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
