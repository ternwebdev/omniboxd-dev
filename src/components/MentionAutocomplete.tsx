import React, { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface MentionUser {
  id: string;
  username: string;
  avatar_url?: string | null;
  profile_flair?: string | null;
  achievement_level?: number;
}

interface MentionAutocompleteProps {
  query: string;
  currentUserId?: string;
  onSelect: (user: MentionUser) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  isOpen: boolean;
  cachedSuggestions?: MentionUser[];
  onSuggestionsLoaded?: (users: MentionUser[]) => void;
}

export const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  query,
  currentUserId,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
  isOpen,
  cachedSuggestions,
  onSuggestionsLoaded
}) => {
  const [suggestions, setSuggestions] = useState<MentionUser[]>(cachedSuggestions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [noResultsFor, setNoResultsFor] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef<string>('');

  // ─────────────────────────────────────────────────────────────
  // Fetch suggestions when query changes
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const trimmedQuery = query.trim();

    // Si ya sabemos que no hay resultados para este query, no volvemos a buscar
    if (trimmedQuery.length > 0 && noResultsFor === trimmedQuery) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Si el query es el mismo que el último consultado y hay caché, usarlo
    if (
      trimmedQuery.length > 0 &&
      cachedSuggestions &&
      cachedSuggestions.length > 0 &&
      lastQueryRef.current === trimmedQuery
    ) {
      setSuggestions(cachedSuggestions);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const loadSuggestions = async () => {
      try {
        let followingIds: string[] = [];

        // 1. Traer a quiénes sigue el usuario actual
        if (currentUserId) {
          const { data: followingRows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId);
          followingIds = (followingRows || [])
            .map((r: any) => r.following_id)
            .filter(Boolean);
        }

        const q = trimmedQuery.toLowerCase();
        const perCategoryLimit = 6;

        // 2. Traer usuarios que sigo (filtrados si hay query)
        let followingUsers: MentionUser[] = [];
        if (followingIds.length > 0) {
          let followingQuery = supabase
            .from('users')
            .select('id, username, avatar_url, profile_flair, achievement_level')
            .in('id', followingIds)
            .order('username', { ascending: true })
            .limit(perCategoryLimit);

          if (q.length > 0) {
            followingQuery = followingQuery.ilike('username', `${q}%`);
          }

          const { data } = await followingQuery;
          followingUsers = (data || []) as MentionUser[];
        }

        // 3. Traer usuarios random (excluyendo a los seguidos y al usuario actual)
        const excludeIds = [...followingIds, currentUserId].filter(Boolean) as string[];

        let randomUsers: MentionUser[] = [];
        if (q.length > 0) {
          let randomQuery = supabase
            .from('users')
            .select('id, username, avatar_url, profile_flair, achievement_level')
            .ilike('username', `${q}%`)
            .order('username', { ascending: true })
            .limit(perCategoryLimit);

          if (excludeIds.length > 0) {
            randomQuery = randomQuery.not(
              'id',
              'in',
              `(${excludeIds.map((id) => `"${id}"`).join(',')})`
            );
          }

          const { data } = await randomQuery;
          randomUsers = (data || []) as MentionUser[];
        }

        if (!cancelled) {
          const combined = [...followingUsers, ...randomUsers].slice(0, 8);
          setSuggestions(combined);
          lastQueryRef.current = trimmedQuery;

          // Si no hay resultados, recordarlo para no volver a consultar
          if (combined.length === 0 && trimmedQuery.length > 0) {
            setNoResultsFor(trimmedQuery);
          } else {
            setNoResultsFor('');
          }

          onSuggestionsLoaded?.(combined);
        }
      } catch (err) {
        console.warn('Error loading mention suggestions:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(loadSuggestions, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, currentUserId, cachedSuggestions, onSuggestionsLoaded, noResultsFor]);

  // ─────────────────────────────────────────────────────────────
  // Reset selected index when suggestions change
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (suggestions.length > 0 && selectedIndex >= suggestions.length) {
      onSelectedIndexChange(0);
    }
  }, [suggestions, selectedIndex, onSelectedIndexChange]);

  // ─────────────────────────────────────────────────────────────
  // Scroll selected item into view
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scrollRef.current) return;
    const selected = scrollRef.current.children[selectedIndex] as HTMLElement | undefined;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // ─────────────────────────────────────────────────────────────
  // Click outside to close
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-1 duration-150"
    >
      {/* Header */}
      <div className="px-3 py-1.5 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {query.trim().length === 0 ? 'Personas que seguís' : 'Mencionar viajante'}
        </span>
        {isLoading && (
          <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* List */}
      <div ref={scrollRef} className="max-h-56 overflow-y-auto p-1">
        {isLoading && suggestions.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-[var(--text-muted)] italic flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Buscando viajantes…</span>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-4 px-3 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)] mx-auto">
              <User className="w-4 h-4" />
            </div>
            {query.trim().length === 0 ? (
              <>
                <p className="text-xs font-semibold text-[var(--text)]">
                  Todavía no seguís a nadie
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  Cuando sigas a otras personas, aparecerán acá para mencionarlas rápido.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-[var(--text)]">
                  No encontramos a @{query}
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  No existe esa persona viajante de omniboxd o todavía no tiene cuenta. Probá con otro nombre.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Cerrar sugerencias
                </button>
              </>
            )}
          </div>
        ) : (
          suggestions.map((user, idx) => {
            const isSelected = idx === selectedIndex;
            const level = user.achievement_level || 0.5;
            const borderCls =
              level >= 4.5
                ? 'avatar-border-premium'
                : level >= 3.5
                  ? 'avatar-border-silver'
                  : level >= 1.5
                    ? 'avatar-border-bronze'
                    : 'border-[var(--border)]';

            return (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(user)}
                onMouseEnter={() => onSelectedIndexChange(idx)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400/15 border border-amber-400/40'
                    : 'border border-transparent hover:bg-[var(--surface-2)]'
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className={`w-6 h-6 rounded-full object-cover border shrink-0 ${borderCls}`}
                  />
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full bg-amber-400/20 border text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 ${borderCls}`}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[var(--text)] truncate">
                      @{user.username}
                    </span>
                    {user.profile_flair && (
                      <span
                        className={`profile-flair profile-flair-${user.profile_flair
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/ó/g, 'o')} text-[9px] shrink-0`}
                      >
                        {user.profile_flair}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between text-[9px] text-[var(--text-dim)]">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono">
            ↑↓
          </kbd>
          <span>navegar</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono">
            Enter
          </kbd>
          <span>elegir</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono">
            Esc
          </kbd>
          <span>cerrar</span>
        </span>
      </div>
    </div>
  );
};