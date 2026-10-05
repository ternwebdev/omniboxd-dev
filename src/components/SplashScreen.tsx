import React, { useEffect, useState } from 'react';

const SPLASH_STORAGE_KEY = 'omniboxd_splash_seen_date';
const SPLASH_DURATION_MS = 2200; // 2.2s
const FADE_OUT_MS = 400;

/**
 * Devuelve true si ya se mostró el splash hoy.
 */
function hasSeenSplashToday(): boolean {
  try {
    const stored = localStorage.getItem(SPLASH_STORAGE_KEY);
    if (!stored) return false;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return stored === today;
  } catch {
    return false;
  }
}

function markSplashAsSeen() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(SPLASH_STORAGE_KEY, today);
  } catch {
    // localStorage puede fallar en modo incógnito o con cookies bloqueadas
  }
}

interface SplashScreenProps {
  /** Se llama cuando el splash termina y debe desaparecer */
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Detecta prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Maneja el cierre del splash
  const closeSplash = React.useCallback(() => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    markSplashAsSeen();
    window.setTimeout(() => {
      onFinish();
    }, FADE_OUT_MS);
  }, [isFadingOut, onFinish]);

  useEffect(() => {
    // Si el usuario prefiere menos movimiento, mostramos menos tiempo
    const duration = prefersReducedMotion ? 1200 : SPLASH_DURATION_MS;
    const timer = window.setTimeout(closeSplash, duration);

    // Skip on click / tap / tecla
    const skip = () => closeSplash();
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('keydown', skip);
    };
  }, [closeSplash, prefersReducedMotion]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[var(--bg)] transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_OUT_MS}ms` }}
      aria-label="Cargando omniboxd"
      role="status"
    >
      {/* Fondo con gradiente sutil omniboxd */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 40%, rgba(245, 200, 66, 0.15), transparent 60%)'
        }}
      />

      <div className="relative flex flex-col items-center gap-6 px-6">
        {!videoFailed && !prefersReducedMotion ? (
          <video
            src="/img/splash-omniboxd.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
            className="w-40 h-40 sm:w-56 sm:h-56 object-contain"
          />
        ) : (
          // Fallback: logo SVG con animación CSS suave
          <img
            src="/img/isotipo-omniboxd.svg"
            alt="omniboxd"
            className={`w-32 h-32 sm:w-44 sm:h-44 object-contain ${
              prefersReducedMotion ? '' : 'animate-pulse'
            }`}
            style={{
              filter: 'drop-shadow(0 0 24px rgba(245, 200, 66, 0.5))'
            }}
          />
        )}

        <div className="text-center space-y-1">
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[var(--text)]">
            omniboxd
          </h1>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)] tracking-[0.2em] uppercase">
            Reseñas de ómnibus uruguayos
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook que decide si hay que mostrar el splash al cargar.
 */
export function useSplashScreen(): {
  shouldShowSplash: boolean;
  onSplashFinish: () => void;
} {
  const [shouldShowSplash, setShouldShowSplash] = useState(() => !hasSeenSplashToday());

  return {
    shouldShowSplash,
    onSplashFinish: () => setShouldShowSplash(false)
  };
}