import React, { useState, useEffect } from 'react';
import { X, Users, ArrowDown, Bus, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useScrollLock } from '../lib/scrollLock';

interface ReactorItem {
  id: string;
  type: 'chiflido' | 'bajada' | 'transbordo';
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url?: string | null;
    bio?: string | null;
  };
}

interface ReactorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ReactorsModal: React.FC<ReactorsModalProps> = ({
  isOpen,
  onClose,
  reviewId,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'chiflido' | 'bajada' | 'transbordo'>('all');
  const [items, setItems] = useState<ReactorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lock background scroll
  useScrollLock(isOpen);

  // Popstate back button support
  useEffect(() => {
    if (!isOpen) return;

    const modalSessionKey = 'omniboxd_reactors_modal_' + Date.now();
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

  useEffect(() => {
    if (!isOpen || !reviewId) return;

    let isMounted = true;
    setIsLoading(true);

    const loadReactors = async () => {
      try {
        const [likesRes, repostsRes] = await Promise.all([
          supabase
            .from('likes')
            .select('id, reaction, created_at, user_id, users(id, username, avatar_url, bio)')
            .eq('review_id', reviewId)
            .order('created_at', { ascending: false }),
          supabase
            .from('reposts')
            .select('id, created_at, user_id, users(id, username, avatar_url, bio)')
            .eq('review_id', reviewId)
            .order('created_at', { ascending: false })
        ]);

        if (!isMounted) return;

        const combined: ReactorItem[] = [];

        if (likesRes.data) {
          likesRes.data.forEach((l: any) => {
            const userObj = Array.isArray(l.users) ? l.users[0] : l.users;
            combined.push({
              id: `like-${l.id}`,
              type: l.reaction === 'dislike' ? 'bajada' : 'chiflido',
              created_at: l.created_at,
              user: userObj || {
                id: l.user_id,
                username: 'viajero',
                avatar_url: null,
                bio: null
              }
            });
          });
        }

        if (repostsRes.data) {
          repostsRes.data.forEach((rp: any) => {
            const userObj = Array.isArray(rp.users) ? rp.users[0] : rp.users;
            combined.push({
              id: `repost-${rp.id}`,
              type: 'transbordo',
              created_at: rp.created_at,
              user: userObj || {
                id: rp.user_id,
                username: 'viajero',
                avatar_url: null,
                bio: null
              }
            });
          });
        }

        // Sort latest first
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItems(combined);
      } catch (err) {
        console.warn('Error fetching reactors:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReactors();

    return () => {
      isMounted = false;
    };
  }, [isOpen, reviewId]);

  if (!isOpen) return null;

  const chiflidosCount = items.filter((i) => i.type === 'chiflido').length;
  const bajadasCount = items.filter((i) => i.type === 'bajada').length;
  const transbordosCount = items.filter((i) => i.type === 'transbordo').length;

  const filteredItems = items.filter((i) => {
    if (activeTab === 'all') return true;
    return i.type === activeTab;
  });

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 touch-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] touch-auto overscroll-contain modal-scroll-area"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text)]">
                Interacciones del viaje
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {items.length} {items.length === 1 ? 'pasajero interactuó' : 'pasajeros interactuaron'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[var(--border)] bg-[var(--surface-2)]/20 px-2 pt-2 gap-1 overflow-x-auto custom-scroll-x text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[var(--surface)] text-[var(--text)] border-t border-x border-[var(--border)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chiflido')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chiflido'
                ? 'bg-[var(--surface)] text-amber-300 border-t border-x border-[var(--border)] font-bold'
                : 'text-[var(--text-muted)] hover:text-amber-300'
            }`}
          >
            <span>🗣️ Chiflidos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
              {chiflidosCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bajada')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bajada'
                ? 'bg-[var(--surface)] text-red-400 border-t border-x border-[var(--border)] font-bold'
                : 'text-[var(--text-muted)] hover:text-red-400'
            }`}
          >
            <span className="flex items-center gap-1">
              <ArrowDown className="w-3 h-3 stroke-[2.5]" />
              <span>Bajadas</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              {bajadasCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transbordo')}
            className={`px-3 py-2 rounded-t-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'transbordo'
                ? 'bg-[var(--surface)] text-emerald-400 border-t border-x border-[var(--border)] font-bold'
                : 'text-[var(--text-muted)] hover:text-emerald-400'
            }`}
          >
            <span className="flex items-center gap-1">
              <Bus className="w-3 h-3" />
              <span>Transbordos</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {transbordosCount}
            </span>
          </button>
        </div>

        {/* Reactors List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Cargando pasajeros…</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-10 text-center space-y-1">
              <p className="text-xs text-[var(--text-muted)] italic">
                {activeTab === 'all'
                  ? 'Todavía no hay chiflidos, bajadas ni transbordos en este viaje.'
                  : activeTab === 'chiflido'
                  ? 'Nadie chifló este omniposteo todavía.'
                  : activeTab === 'bajada'
                  ? 'Nadie dio bajada a este omniposteo.'
                  : 'Nadie hizo transbordo a su perfil todavía.'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onClose();
                  onNavigate('profile', item.user.username);
                }}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-amber-400/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] overflow-hidden flex items-center justify-center shrink-0 group-hover:border-amber-400 transition-colors">
                    {item.user.avatar_url ? (
                      <img
                        src={item.user.avatar_url}
                        alt={item.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text)] group-hover:text-amber-400 transition-colors truncate">
                      {item.user.full_name || `@${item.user.username}`}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      @{item.user.username}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.type === 'chiflido' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <span>🗣️</span>
                      <span>Chiflido</span>
                    </span>
                  )}
                  {item.type === 'bajada' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                      <span>Bajada</span>
                    </span>
                  )}
                  {item.type === 'transbordo' && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Bus className="w-3 h-3" />
                      <span>Transbordo</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
