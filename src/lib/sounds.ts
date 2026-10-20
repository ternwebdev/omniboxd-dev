/**
 * Sistema de sonidos sutiles de omniboxd.
 * Los sonidos están OFF por defecto y se activan desde el perfil.
 * Cada sonido se carga una sola vez y se cachea.
 */

type SoundName = 'chiflido' | 'bajada' | 'transbordo' | 'charla' | 'shimmer' | 'ding';

const STORAGE_KEY = 'omniboxd_sounds_enabled';

let soundsEnabled: boolean | null = null;

export function isSoundsEnabled(): boolean {
  if (soundsEnabled !== null) return soundsEnabled;
  try {
    soundsEnabled = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    soundsEnabled = false;
  }
  return soundsEnabled;
}

export function setSoundsEnabled(enabled: boolean) {
  soundsEnabled = enabled;
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

/** Cache de audios */
const audioCache = new Map<SoundName, HTMLAudioElement>();

function getAudio(name: SoundName): HTMLAudioElement | null {
  if (audioCache.has(name)) return audioCache.get(name)!;

  try {
    const audio = new Audio(`/sounds/${name}.mp3`);
    audio.preload = 'auto';
    audio.volume = 0.35; // volumen bajo por defecto
    audioCache.set(name, audio);
    return audio;
  } catch {
    return null;
  }
}

/**
 * Reproduce un sonido sutil si están activados.
 * Es safe: no rompe si el archivo no existe.
 *
 * @param name Nombre del sonido
 * @param volume Volumen 0-1 (default 0.35)
 * @param reverse Si es true, invierte el audio (útil para "deshacer" una acción)
 */
/**
 * Reproduce un sonido sutil si están activados.
 * @param name Nombre del sonido
 * @param volume Volumen 0-1 (default 0.35)
 * @param reverse Si es true, invierte el audio (útil para "deshacer" una acción)
 */
export function playSound(name: SoundName, volume?: number, reverse: boolean = false) {
  if (!isSoundsEnabled()) return;
  if (typeof window === 'undefined') return;

  // Respetar prefers-reduced-motion
  try {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  } catch {}

  const audio = getAudio(name);
  if (!audio) return;

  try {
    // ⚠️ No usamos cloneNode: puede no estar precargado y falla.
    // En su lugar, reseteamos el audio original.
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume ?? (reverse ? 0.22 : 0.35);

    if (reverse) {
      // Intentar reproducir al revés
      try {
        (audio as any).preservesPitch = false;
        (audio as any).playbackRate = -1;
      } catch {
        // Si no se puede, usar velocidad rápida + volumen bajo
        audio.playbackRate = 1.4;
        audio.volume = 0.15;
      }
    } else {
      // Restaurar velocidad normal por si quedó invertido
      audio.playbackRate = 1;
    }

    audio.play().catch(() => {
      // Fallback: si el play() falla (probablemente por playbackRate -1),
      // reproducir normal con velocidad alta y volumen bajo
      if (reverse) {
        try {
          audio.playbackRate = 1.4;
          audio.volume = 0.15;
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } catch {}
      }
    });
  } catch {}
}
/** Precarga todos los sonidos (útil al activar por primera vez) */
export function preloadSounds() {
  (['chiflido', 'bajada', 'transbordo', 'charla', 'shimmer', 'ding'] as SoundName[]).forEach((name) => {
    getAudio(name);
  });
}