import React from 'react';
import { Award, Home, Search, User, LogIn, Plus } from 'lucide-react';
import { UserProfile } from '../types';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile | null;
  onOpenNewReview: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onOpenNewReview
}) => {
  return (
    <>
      {/* Floating Action Button "+" for new review / omnipost */}
      <button
        onClick={onOpenNewReview}
        className="fixed bottom-[calc(var(--nav-h)+16px)] md:bottom-8 right-5 md:right-8 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.45)] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white/20 group"
        title="Publicar nuevo viaje / omnipost"
        aria-label="Nuevo omnipost"
      >
        <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Fixed bottom bar (Mobile only; desktop has full navbar in the header) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-[var(--nav-h)] bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] flex items-center justify-around px-2 max-w-lg mx-auto sm:rounded-t-xl transition-colors">
        <button
          onClick={() => onNavigate('feed')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'feed'
              ? 'text-amber-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => onNavigate('search')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'search'
              ? 'text-amber-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Search className="w-5 h-5" />
          <span>Buscar</span>
        </button>

        <button
          onClick={() => onNavigate('achievements')}
          className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            currentView === 'achievements'
              ? 'text-amber-400'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>Logros</span>
        </button>

        {currentUser ? (
          <button
            onClick={() => onNavigate('profile')}
            className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              currentView === 'profile'
                ? 'text-amber-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt=""
                className={`w-5 h-5 rounded-full object-cover border ${
                  currentView === 'profile' ? 'border-amber-400' : 'border-[var(--border)]'
                }`}
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span>Perfil</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('auth')}
            className={`flex-1 flex flex-col items-center justify-center py-1 gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              currentView === 'auth'
                ? 'text-amber-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <LogIn className="w-5 h-5" />
            <span>Entrar</span>
          </button>
        )}
      </nav>
    </>
  );
};
