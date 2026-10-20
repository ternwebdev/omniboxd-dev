import React, { useState } from 'react';
import { X, Sparkles, UserPlus, LogIn, MessageSquare, Heart, Repeat, Share2 } from 'lucide-react';

export type SignupPromptContext =
  | 'like'
  | 'dislike'
  | 'comment'
  | 'repost'
  | 'create_review'
  | 'follow'
  | 'favorite'
  | 'achievements'
  | 'generic';

interface SignupPromptModalProps {
  isOpen: boolean;
  context: SignupPromptContext;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const CONTEXT_COPY: Record<SignupPromptContext, {
  emoji: string;
  title: string;
  description: string;
  cta: string;
}> = {
  like: {
    emoji: '🗣️',
    title: '¡Pegale un chiflido!',
    description: 'Registrate en 30 segundos para picar boletos, chiflar los buenos viajes y bajarlos cuando no van.',
    cta: 'Crear cuenta'
  },
  dislike: {
    emoji: '⬇️',
    title: 'Dale una bajada',
    description: 'Sumate para opinar sobre los viajes que no te coparon y ayudar a la comunidad a elegir mejor.',
    cta: 'Crear cuenta'
  },
  comment: {
    emoji: '🚏',
    title: '¡Sumate a la charla de parada!',
    description: 'Registrate en 30 segundos para comentar, mencionar a otras personas y seguir la conversación.',
    cta: 'Crear cuenta'
  },
  repost: {
    emoji: '🚌',
    title: 'Hacé transbordo',
    description: 'Sumate para compartir omniposteos en tu perfil y que tus seguidores los vean.',
    cta: 'Crear cuenta'
  },
  create_review: {
    emoji: '✨',
    title: 'Publicá tu primer omnipost',
    description: 'Registrate para dejar registro de tus viajes, puntuar líneas y desbloquear logros.',
    cta: 'Crear cuenta'
  },
  follow: {
    emoji: '👥',
    title: 'Seguí a otras personas',
    description: 'Creá tu cuenta para seguir viajantes y armar tu propio feed personalizado.',
    cta: 'Crear cuenta'
  },
  favorite: {
    emoji: '⭐',
    title: 'Guardá tus líneas frecuentes',
    description: 'Registrate para tener a mano las líneas que tomás todos los días y verlas en tu Inicio.',
    cta: 'Crear cuenta'
  },
  achievements: {
    emoji: '🏆',
    title: 'Desbloqueá logros',
    description: 'Creá tu cuenta para empezar a sumar logros, subir de nivel y desbloquear recompensas.',
    cta: 'Crear cuenta'
  },
  generic: {
    emoji: '🚌',
    title: '¡Sumate a omniboxd!',
    description: 'Registrate en 30 segundos para picar boletos, comentar y guardar tu historial de viajes.',
    cta: 'Crear cuenta'
  }
};

export const SignupPromptModal: React.FC<SignupPromptModalProps> = ({
  isOpen,
  context,
  onClose,
  onLogin,
  onRegister
}) => {
  if (!isOpen) return null;

  const copy = CONTEXT_COPY[context] || CONTEXT_COPY.generic;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header con emoji grande */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-amber-400/15 via-amber-400/5 to-transparent border-b border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[var(--surface-2)]/80 hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-3xl shrink-0 shadow-sm">
              {copy.emoji}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg text-[var(--text)] leading-tight">
                {copy.title}
              </h2>
              <p className="text-[11px] text-[var(--text-dim)] font-mono mt-0.5">
                omniboxd · comunidad de ómnibus
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-[var(--text)] leading-relaxed">
            {copy.description}
          </p>

          {/* Beneficios rápidos */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-xl mb-1">🗣️</div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold block leading-tight">
                Chiflá y bajá
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-xl mb-1">💬</div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold block leading-tight">
                Comentá
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="text-xl mb-1">🏆</div>
              <span className="text-[10px] text-[var(--text-muted)] font-semibold block leading-tight">
                Sumá logros
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={onRegister}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{copy.cta} gratis</span>
            </button>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-amber-400/50 text-[var(--text)] font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Ya tengo cuenta</span>
            </button>
          </div>

          {/* Cancelar discreto */}
          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text)] py-1 transition-colors cursor-pointer"
          >
            Seguir explorando sin cuenta
          </button>
        </div>
      </div>
    </div>
  );
};