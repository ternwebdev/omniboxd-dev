import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Sparkles, 
  HelpCircle, 
  Moon, 
  Sun, 
  Cloud, 
  User, 
  LogOut,
  Home,
  Search,
  Plus,
  ShieldCheck,
  Bus,
  Signpost,
  ArrowDown,
  X,
  MessageSquare,
  UserPlus,
  UserCheck,
  Award
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types';
import { supabase } from '../lib/supabase';
import { 
  fetchUserNotifications, 
  removeNotificationById, 
  markAllNotificationsRead,
  AppNotification 
} from '../lib/notifications';
import { formatNotificationTime } from '../lib/dateUtils';

interface HeaderProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  currentUser: UserProfile | null;
  onNavigate: (view: string, param?: string) => void;
  onSignOut: () => void;
  onOpenReview?: (reviewId: string) => void;
  currentView?: string;
  onOpenNewReview?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeChange,
  currentUser,
  onNavigate,
  onSignOut,
  onOpenReview,
  currentView = 'feed',
  onOpenNewReview
}) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cycle theme: dark -> medium -> light -> dark
  const nextTheme = () => {
    const level = currentUser?.achievement_level || 0.5;
    const available: ThemeMode[] = ['dark', 'light'];
    if (level >= 2) available.push('medium');
    if (level >= 3) available.push('night');
    if (level >= 4) available.push('galaxy');
    if (level >= 5) available.push('auto');
    const currentIndex = available.indexOf(theme);
    onThemeChange(available[(currentIndex + 1) % available.length]);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-amber-300" />;
    if (theme === 'medium') return <Cloud className="w-4 h-4 text-blue-300" />;
    if (theme === 'night') return <Moon className="w-4 h-4 text-sky-300" />;
    if (theme === 'galaxy') return <Sparkles className="w-4 h-4 text-violet-300" />;
    if (theme === 'auto') return <Sparkles className="w-4 h-4 text-amber-300" />;
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  // Smart sticky header: hide on scroll down, show immediately on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      // When near top of page, always show header
      if (currentScrollY <= 45) {
        setIsVisible(true);
      } else if (delta > 8 && !notifOpen) {
        // User is scrolling down -> smoothly slide away header
        setIsVisible(false);
      } else if (delta < -4) {
        // User is scrolling up -> show header immediately
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [notifOpen]);

  // Fetch unread notifications
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const loadNotifications = async () => {
      try {
        const items = await fetchUserNotifications(currentUser.id);
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read_at).length);
      } catch (e) {
        // quiet fallback
      }
    };

    loadNotifications();

    // Listen to local in-tab actions
    const handleLocalChange = () => {
      loadNotifications();
    };
    window.addEventListener('omniboxd_notifications_changed', handleLocalChange);

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`omniboxd-notifs-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    const interval = setInterval(loadNotifications, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('omniboxd_notifications_changed', handleLocalChange);
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const handleOpenNotifs = async () => {
    const nextState = !notifOpen;
    setNotifOpen(nextState);
    if (nextState) {
      setIsVisible(true);
      if (unreadCount > 0 && currentUser) {
        await markAllNotificationsRead(currentUser.id);
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
        );
      }
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    setNotifications((prev) => prev.filter((item) => item.id !== notifId));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await removeNotificationById(currentUser.id, notifId);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-[var(--head-h)] bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-6 lg:px-8 transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 shadow-xs' : '-translate-y-full shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand logo & title */}
        <button
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
        >
          <img
            src="/img/isotipo-omniboxd.svg"
            alt="omniboxd"
            className="w-8 h-8 rounded-full object-contain bg-white shadow-[0_0_8px_rgba(245,200,66,0.25)] group-hover:scale-105 transition-transform"
          />
          <div className="flex items-baseline">
            <span className="font-display font-bold text-lg tracking-tight text-[var(--text)] group-hover:text-amber-400 transition-colors">
              omniboxd
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-[var(--surface-2)]/80 p-1 rounded-xl border border-[var(--border)] text-xs">
          <button
            onClick={() => onNavigate('feed')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentView === 'feed'
                ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
            title="Inicio"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Inicio</span>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentView === 'search' || currentView === 'line'
                ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
            title="Buscar líneas y empresas"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">Buscar</span>
          </button>

          <button
            onClick={() => onNavigate('news')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentView === 'news'
                ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
            title="Novedades y notas de versión"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="hidden lg:inline">Novedades</span>
          </button>

          <button
            onClick={() => onNavigate('help')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentView === 'help'
                ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
            title="Manual de uso"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden lg:inline">Manual</span>
          </button>
          <button
            onClick={() => onNavigate('achievements')}
            className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              currentView === 'achievements'
                ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
            }`}
            title="Catálogo de logros"
          >
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden lg:inline">Logros</span>
          </button>

          {currentUser?.is_admin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-[var(--surface)]'
              }`}
              title="Panel de administración"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">Admin</span>
            </button>
          )}
        </nav>

        {/* Action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Notifications */}
          {currentUser && (
            <div className="relative" ref={panelRef}>
              <button
                onClick={handleOpenNotifs}
                className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/40 transition-colors relative cursor-pointer"
                title="Notificaciones"
                aria-label="Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown panel */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-display font-bold tracking-wider text-amber-400 uppercase">
                        Paradas de aviso
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6 italic">
                      Sin notificaciones todavía.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((n) => {
                        const renderIcon = () => {
                          if (n.kind === 'like' || n.body?.includes('chiflido')) {
                            return <span className="text-base select-none shrink-0" title="Chiflido">🗣️</span>;
                          }
                          if (n.kind === 'dislike' || n.body?.includes('bajada')) {
                            return (
                              <div className="w-6 h-6 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0" title="Bajada">
                                <ArrowDown className="w-3.5 h-3.5 text-rose-400 stroke-[2.5]" />
                              </div>
                            );
                          }
                          if (n.kind === 'repost' || n.body?.includes('transbordo')) {
                            return (
                              <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0" title="Transbordo">
                                <Bus className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                            );
                          }
                          if (n.kind === 'comment' || n.body?.includes('charla')) {
                            return (
                              <div className="w-6 h-6 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0" title="Charla de parada">
                                <Signpost className="w-3.5 h-3.5 text-sky-400" />
                              </div>
                            );
                          }
                          if (n.kind === 'mention' || n.body?.includes('mencionó')) {
                            return (
                              <div className="w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0" title="Mención">
                                <Signpost className="w-3.5 h-3.5 text-amber-400" />
                              </div>
                            );
                          }
                          if (n.kind === 'follow' || n.kind === 'follow_back' || n.body?.includes('seguir') || n.body?.includes('follow')) {
                            const isBack = n.kind === 'follow_back' || n.body?.includes('devolvió');
                            return (
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  isBack
                                    ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                }`}
                                title={isBack ? 'Te devolvió el follow' : 'Nuevo seguidor'}
                              >
                                {isBack ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                              </div>
                            );
                          }
                          return (
                            <div className="w-6 h-6 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                              <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                            </div>
                          );
                        };

                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (n.review_id && onOpenReview) {
                                setNotifOpen(false);
                                onOpenReview(n.review_id);
                              } else if (onNavigate) {
                                const match = n.body?.match(/@([a-zA-Z0-9_\.-]+)/);
                                if (match && match[1]) {
                                  setNotifOpen(false);
                                  onNavigate('profile', match[1]);
                                }
                              }
                            }}
                            className={`p-2.5 sm:p-3 rounded-xl text-xs border transition-all text-left relative group ${
                              n.review_id || n.body?.includes('@')
                                ? 'cursor-pointer hover:border-amber-400/50 hover:bg-[var(--surface-hover)]'
                                : ''
                            } ${
                              !n.read_at
                                ? 'bg-amber-400/10 border-amber-400/30 text-[var(--text)] shadow-sm'
                                : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                {renderIcon()}
                                <p className="font-semibold leading-snug text-[var(--text)] text-xs pt-0.5">
                                  {n.body || n.kind}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="text-[10px] text-[var(--text-dim)] whitespace-nowrap">
                                  {formatNotificationTime(n.created_at)}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotification(e, n.id)}
                                  className="w-6 h-6 rounded-md bg-[var(--surface)] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-[var(--border)] hover:border-rose-500/40 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ml-0.5"
                                  title="Eliminar notificación"
                                  aria-label="Eliminar notificación"
                                >
                                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>

                            {/* Referenced Omnipost snippet if available */}
                            {n.review && (
                              <div className="mt-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-start gap-2">
                                {n.review.lines && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shrink-0 shadow-sm"
                                    style={{
                                      backgroundColor: n.review.lines.companies?.color || '#555'
                                    }}
                                  >
                                    {n.review.lines.number}
                                  </span>
                                )}
                                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 italic leading-relaxed">
                                  "{n.review.body || 'Omniposteo en ' + (n.review.lines?.number || 'ómnibus')}"
                                </p>
                              </div>
                            )}

                            {n.review_id && (
                              <div className="mt-1.5 flex justify-end">
                                <span className="text-[10px] text-amber-400 font-semibold hover:underline inline-flex items-center gap-1">
                                  Ver omniposteo →
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Novedades / Changelog (Mobile only, desktop has it in the nav) */}
          <button
            onClick={() => onNavigate('news')}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-emerald-400 hover:border-emerald-400/40 hover:bg-emerald-400/10 transition-colors cursor-pointer"
            title="Novedades de la versión"
            aria-label="Novedades"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Manual de uso (Mobile only, desktop has it in the nav) */}
          <button
            onClick={() => onNavigate('help')}
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-amber-400 hover:border-amber-400/40 hover:bg-amber-400/10 transition-colors cursor-pointer"
            title="Manual de omniboxd"
            aria-label="Manual de uso"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={nextTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--text-muted)] transition-colors cursor-pointer"
            title={`Tema actual: ${theme}. Clic para cambiar`}
            aria-label="Cambiar tema"
          >
            {getThemeIcon()}
          </button>

          {/* Desktop User Profile pill button */}
          {currentUser ? (
            <button
              onClick={() => onNavigate('profile')}
              className={`hidden md:flex items-center gap-1.5 p-1 lg:pr-2.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                currentView === 'profile'
                  ? 'border-amber-400 bg-amber-400/15 text-amber-400'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-amber-400/50'
              }`}
              title={`@${currentUser.username} - Mi perfil`}
              aria-label="Mi perfil"
            >
 {(() => {
  const lvl = currentUser.achievement_level || 0.5;
  const borderCls = lvl >= 4.5
    ? 'avatar-border-premium'
    : lvl >= 3.5
      ? 'avatar-border-silver'
      : lvl >= 1.5
        ? 'avatar-border-bronze'
        : '';
  return currentUser.avatar_url ? (
    <img
      src={currentUser.avatar_url}
      alt={currentUser.username}
      className={`w-6 h-6 rounded-full object-cover shrink-0 border ${borderCls}`}
    />
  ) : (
    <div className={`w-6 h-6 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 border ${borderCls}`}>
      {currentUser.username.charAt(0).toUpperCase()}
    </div>
  );
})()}
              <span className="hidden lg:inline text-xs font-semibold max-w-[85px] xl:max-w-[120px] truncate">
                @{currentUser.username}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span>Entrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
