import React, { useEffect, useState } from 'react';
import { ArrowLeft, Award, Bus, CalendarDays, Check, ChevronRight, Compass, Crown, Gauge, Heart, Lock, Map, Medal, RotateCcw, Sparkles, Star, ThermometerSun, Users } from 'lucide-react';
import { UserProfile } from '../types';
import { fetchUserAchievements } from '../lib/achievements';
import { getAchievementEntitlements } from '../lib/achievementEntitlements';

interface AchievementsViewProps {
  onNavigate: (view: string) => void;
  currentUser: UserProfile | null;
}

type Achievement = {
  title: string;
  emoji: string;
  description: string;
  slug: string;
};

type AchievementCategory = {
  title: string;
  slug: string;
  icon: React.ReactNode;
  accent: string;
  achievements: Achievement[];
};

const AchievementIcon: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const [hasSvg, setHasSvg] = useState(true);

  return (
    <>
      {!hasSvg && <span aria-hidden="true">{achievement.emoji}</span>}
      <img
        src={`/img/achievements/${achievement.slug}.svg`}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain p-1 ${hasSvg ? '' : 'hidden'}`}
        onError={() => setHasSvg(false)}
      />
    </>
  );
};

const CategoryIcon: React.FC<{ category: AchievementCategory; complete: boolean }> = ({ category, complete }) => {
  const [hasSvg, setHasSvg] = useState(true);

  return hasSvg ? (
    <img
      src={`/img/achievements/categories/${category.slug}.svg`}
      alt=""
      className={`h-12 w-12 object-contain ${complete ? '' : 'grayscale opacity-60'}`}
      onError={() => setHasSvg(false)}
    />
  ) : category.icon;
};

export const categories: AchievementCategory[] = [
  {
    title: 'Exploración de empresas',
    slug: 'exploracion_de_empresas',
    icon: <Compass className="w-4 h-4" />,
    accent: 'text-[var(--achievement-gold)]',
    achievements: [
      { title: 'Primer boleto gastado', emoji: '🎫', description: 'Omniposteaste tu primer omnipost', slug: 'primer_boleto_gastado' },
      { title: 'Bichito de la curiosidad', emoji: '🗺️', description: 'Omniposteaste 3 empresas diferentes', slug: 'bichito_de_la_curiosidad' },
      { title: 'Expertiz en ómnibus', emoji: '🚌', description: 'Omniposteaste 5 empresas diferentes', slug: 'expertiz_en_omnibus' },
      { title: 'Exploración urbana', emoji: '🏙️', description: 'Omniposteaste 7 empresas diferentes', slug: 'exploracion_urbana' },
      { title: 'Ruta completa', emoji: '🏆', description: 'Omniposteaste 10 empresas o más del sistema', slug: 'ruta_completa' }
    ]
  },
  {
    title: 'Diversidad de líneas',
    slug: 'diversidad_de_lineas',
    icon: <Map className="w-4 h-4" />,
    accent: 'text-sky-400',
    achievements: [
      { title: 'Detective de ramales', emoji: '🕵️', description: 'Omniposteaste 3 ramales distintos de una misma línea (ejemplo: 175 - Ciudadela, 175 - Palacio Legislativo, 175 - Las Piedras)', slug: 'detective_de_ramales' },
      { title: 'Atletismo de líneas', emoji: '🔀', description: 'Omniposteaste 10 líneas diferentes', slug: 'atletismo_de_lineas' },
      { title: 'Mapa viviente', emoji: '🗺️', description: 'Omniposteaste 25 líneas diferentes', slug: 'mapa_viviente' },
      { title: 'Enciclopedia rodante', emoji: '📚', description: 'Omniposteaste 50 líneas diferentes', slug: 'enciclopedia_rodante' },
      { title: 'Perito total', emoji: '🎯', description: 'Omniposteaste 100 líneas diferentes', slug: 'perito_total' }
    ]
  },
  {
    title: 'Tipos de servicio',
    slug: 'tipos_de_servicio',
    icon: <Bus className="w-4 h-4" />,
    accent: 'text-emerald-400',
    achievements: [
      { title: 'Turista local', emoji: '📸', description: 'Omniposteaste un ómnibus de tipo "Departamental" o "Turístico"', slug: 'turista_local' },
      { title: 'Viaje premium', emoji: '✨', description: 'Omniposteaste un ómnibus de tipo "Diferencial"', slug: 'viaje_premium' },
      { title: 'Viaje local', emoji: '🏘️', description: 'Omniposteaste un ómnibus de tipo "Local - Céntrico"', slug: 'viaje_local' },
      { title: 'Viaje suburbano', emoji: '🛤️', description: 'Omniposteaste un ómnibus de tipo "Suburbano"', slug: 'viaje_suburbano' },
      { title: 'Persona multimodal', emoji: '🔄', description: 'Omniposteaste los servicios "Diferencial", "Local", "Suburbano" y "Urbano"', slug: 'persona_multimodal' },
      { title: 'Tipoide total', emoji: '❗', description: 'Omniposteaste todos los tipos de ómnibus ("Departamental", "Diferencial", "Inter", "Local - Céntrico", "Suburbano", "Turístico", "Urbano")', slug: 'tipoide_total' }
    ]
  },
  {
    title: 'Calidad y detalle',
    slug: 'calidad_y_detalle',
    icon: <Star className="w-4 h-4" />,
    accent: 'text-[var(--achievement-gold)]',
    achievements: [
      { title: 'Detallista', emoji: '🔍', description: 'Hiciste 3 omniposteos con número de coche', slug: 'detallista' },
      { title: 'Especialista en etiquetas', emoji: '🏷️', description: 'Hiciste 5 omniposteos con al menos 3 etiquetas', slug: 'especialista_en_etiquetas' },
      { title: 'Memoria de elefante', emoji: '🐘', description: 'Hiciste 10 omniposteos con fecha y hora exacta cargadas manualmente (no solamente usando la fecha de publicación por defecto)', slug: 'memoria_de_elefante' },
      { title: 'Cronista', emoji: '📝', description: 'Hiciste 10 omniposteos con texto largo (250 carácteres o más)', slug: 'cronista' },
      { title: 'Criticismo profesional', emoji: '⭐', description: 'Hiciste 25 omniposteos con información COMPLETA (línea con recorrido/destino, número de coche, cuándo viajaste, puntuación, etiquetas/vibes del viaje, ¿qué tal estuvo el viaje?)', slug: 'criticismo_profesional' }
    ]
  },
  {
    title: 'Horarios',
    slug: 'horarios',
    icon: <CalendarDays className="w-4 h-4" />,
    accent: 'text-indigo-300',
    achievements: [
      { title: 'Madrugante', emoji: '🌅', description: 'Omniposteo entre las 6:00 y las 8:00', slug: 'madrugante' },
      { title: 'Búho nocturno', emoji: '🦉', description: 'Omniposteo entre las 22:00 y las 6:00', slug: 'buho_nocturno' },
      { title: 'Horas pico controladas', emoji: '🕐', description: 'Omniposteo de viaje ocurrido (con fecha y hora ocurridas, no de publicación) entre las 7:00 a las 9:00 o las 17:00 a las 20:00', slug: 'horas_pico_controladas' },
      { title: 'Viaje de madrugada', emoji: '🌙', description: 'Omniposteo de viaje ocurrido (con fecha y hora ocurridas, no de publicación) entre 0:00 a las 6:00', slug: 'viaje_de_madrugada' },
      { title: 'Feriado de viaje', emoji: '🎉', description: 'Omniposteo de un viaje ocurrido y/o publicado en un día feriado no laborable (1/1, 18/5, 17/8, 25/8, 25/12)', slug: 'feriado_de_viaje' }
    ]
  },
  {
    title: 'Social',
    slug: 'social',
    icon: <Users className="w-4 h-4" />,
    accent: 'text-pink-300',
    achievements: [
      { title: 'Pro de las menciones', emoji: '🦾', description: 'Seguiste y mencionaste a una persona (con @usuario) en 3 charlas de parada', slug: 'pro_de_las_menciones' },
      { title: 'Mariposa social', emoji: '🦋', description: 'Seguiste a 5 personas omniboxderas', slug: 'mariposa_social' },
      { title: 'Influencer', emoji: '📢', description: 'Seguiste a 10 personas omniboxderas', slug: 'influencer' },
      { title: 'Comunidad', emoji: '👥', description: 'Seguiste a 25 personas omniboxderas', slug: 'comunidad' },
      { title: 'Referente', emoji: '🌟', description: 'Seguiste a 50 personas omniboxderas', slug: 'referente' }
    ]
  },
  {
    title: 'Constancia',
    slug: 'constancia',
    icon: <Crown className="w-4 h-4" />,
    accent: 'text-orange-300',
    achievements: [
      { title: 'Finde activo', emoji: '🏖️', description: 'Omniposteaste o transbordaste un viaje sábado y domingo de la misma semana', slug: 'finde_activo' },
      { title: 'Semana activa', emoji: '📅', description: 'Omniposteaste o realizaste una charla de parada durante 7 días seguidos', slug: 'semana_activa' },
      { title: 'Mes comprometido', emoji: '🗓️', description: 'Omniposteaste o diste chiflidos/bajadas por 20 días en un mes', slug: 'mes_activo' },
      { title: 'Etapa de prueba Spotify cruzada', emoji: '🎧', description: 'Realizaste cualquier acción (omnipostear, chiflidos, bajadas, charlas de parada, transbordos) al menos una vez al día por más de 90 días seguidos', slug: 'etapa_spotify_cruzada' },
      { title: '¡Feliz nacimiento, omniboxdera!', emoji: '🎖️', description: 'Tu primer omniposteo cumplió 9 meses. ¡Felicidades!', slug: 'feliz_nacimiento_omniboxdera' }
    ]
  },
  {
    title: 'Especiales / Rareza',
    slug: 'especiales_rareza',
    icon: <Medal className="w-4 h-4" />,
    accent: 'text-violet-300',
    achievements: [
      { title: 'Coche específico', emoji: '🚌', description: 'Omniposteaste el mismo número de coche 3 veces', slug: 'coche_especifico' },
      { title: 'Ruta favorita', emoji: '🛣️', description: 'Realizaste 5 omniposteos del mismo recorrido/destino', slug: 'ruta_favorita' },
      { title: 'Empresa fiel', emoji: '💚', description: 'Realizaste 10 omniposteos de la misma empresa', slug: 'empresa_fiel' },
      { title: 'Primicia del año', emoji: '🎆', description: 'Fuiste de las primeras 50 personas en omnipostear desde el 1/1', slug: 'primicia_del_ano' },
      { title: 'Criticismo constructivo', emoji: '💬', description: 'Tu omniposteo recibió 5 o más charlas de parada', slug: 'criticismo_constructivo' },
      { title: 'Voz popular', emoji: '🔥', description: 'Tu omniposteo recibió más de 10 chiflidos y más de 10 charlas', slug: 'voz_popular' }
    ]
  },
  {
    title: 'Supervivencia climática',
    slug: 'supervivencia_climatica',
    icon: <ThermometerSun className="w-4 h-4" />,
    accent: 'text-cyan-300',
    achievements: [
      { title: 'Día de lluvia', emoji: '☔', description: 'Omniposteo con etiqueta Día lluvioso o Alerta meteorológica', slug: 'dia_de_lluvia' },
      { title: 'Ola de calor', emoji: '🌡️', description: 'Omniposteo con etiqueta Día soleado o Mucho calor', slug: 'ola_de_calor' },
      { title: 'Frío riguroso', emoji: '❄️', description: 'Omniposteo con etiqueta Aire al mango o Mucho frío', slug: 'frio_riguroso' },
      { title: 'Sobreviviente', emoji: '🛡️', description: 'Omniposteo con Sin aire, Lleno de gente y Frecuencia horrible', slug: 'sobreviviente' }
    ]
  },
  {
    title: 'Destinos icónicos',
    slug: 'destinos_iconicos',
    icon: <Heart className="w-4 h-4" />,
    accent: 'text-rose-300',
    achievements: [
      { title: 'Costa querida', emoji: '🌊', description: 'Primer omniposteo de una línea con destino en rambla o playa', slug: 'costa_querida' },
      { title: 'Centro histórico', emoji: '🏛️', description: 'Primer omniposteo de una línea con destino en Ciudad Vieja', slug: 'centro_historico' },
      { title: 'Cruzando fronteras', emoji: '🌉', description: 'Primer omniposteo de una línea que cruza el límite departamental', slug: 'cruzando_fronteras' },
      { title: 'Ruta veraniega', emoji: '🏖️', description: 'Primer omniposteo turístico o de larga distancia entre el 1/1 y el 28/2', slug: 'ruta_veraniega' }
    ]
  }
];

const levels = [
  {
    name: 'Peatón',
    number: '0,5',
    range: '0 logros',
    min: 0,
    accent: 'text-sky-300',
    rewards: [
      'Creación de cuenta y username básico',
      'Avatar de iniciales con color por defecto',
      'Bio de 100 caracteres'
    ]
  },
  {
    name: 'Persona por la vía pública queriendo tomarse el ómnibus',
    number: '1',
    range: '1 a 3 logros',
    min: 1,
    accent: 'text-amber-400',
    rewards: [
      'Username personalizado',
      'Avatar de iniciales o imagen con fondo a elección',
      '1 link personalizado',
      'Bio de 150 caracteres',
      'Color de portada de la paleta Omniboxd',
      'Flair «Novatada» junto a tu username'
    ]
  },
  {
    name: 'Persona dentro del ómnibus',
    number: '1,5',
    range: '4 a 6 logros',
    min: 4,
    accent: 'text-orange-300',
    rewards: [
      'Borde de avatar bronce',
      'Bio expandida a 200 caracteres',
      '1 insignia visible en tu perfil'
    ]
  },
  {
    name: 'Viajante por el ómnibus',
    number: '2',
    range: '7 a 11 logros',
    min: 7,
    accent: 'text-sky-300',
    rewards: [
      'Video o GIF de perfil de hasta 5 segundos',
      'Modo intermedio desbloqueado',
      '2 links personalizados',
      'Bio de 350 caracteres',
      'Username con color personalizado',
      'Badge animado «Viajante» en el feed'
    ]
  },
  {
    name: 'Boletera cargada',
    number: '2,5',
    range: '12 a 16 logros',
    min: 12,
    accent: 'text-blue-300',
    rewards: [
      'Diferstar desbloqueada',
      'Opaquestar desbloqueada',
      '2 insignias visibles en tu perfil'
    ]
  },
  {
    name: 'Amante junior del ómnibus',
    number: '3',
    range: '17 a 23 logros',
    min: 17,
    accent: 'text-[var(--achievement-gold)]',
    rewards: [
      'Foto de portada',
      'Modo trasnoche / expreso nocturno',
      '3 links personalizados',
      'Bio de 450 caracteres',
      'Fijar 1 comentario en tus omniposteos',
      'Badge dorado «Amante» en tu perfil'
    ]
  },
  {
    name: 'Amante senior del ómnibus',
    number: '3,5',
    range: '24 a 30 logros',
    min: 24,
    accent: 'text-[var(--achievement-gold)]',
    rewards: [
      'Borde de avatar bronce o plateado',
      '3 insignias visibles a elección',
      'Bio de 550 caracteres'
    ]
  },
  {
    name: 'Chófer de línea',
    number: '4',
    range: '31 a 39 logros',
    min: 31,
    accent: 'text-[var(--achievement-gold)]',
    rewards: [
      'Video de portada de hasta 5 segundos',
      'Modo Galaxia Omniboxdera',
      '4 links personalizados',
      'Bio de 750 caracteres',
      'Borde de avatar premium dorado con brillo',
      'Badge brillante «Chófer» en tus omniposteos'
    ]
  },
  {
    name: 'Inspector de los ómnibus',
    number: '4,5',
    range: '40 a 48 logros',
    min: 40,
    accent: 'text-fuchsia-300',
    rewards: [
      'Interstar desbloqueada',
      'Stormystar desbloqueada',
      '4 insignias visibles a elección'
    ]
  },
  {
    name: 'Leyenda sobre 4 ruedas',
    number: '5',
    range: '49+ logros',
    min: 49,
    accent: 'text-[var(--achievement-gold)]',
    rewards: [
      'Modo Animado Automático según el momento del día',
      '5 links personalizados',
      'Bio de 1000 caracteres',
      'Badge dorado «Leyenda» en feed, perfil y comentarios',
      'Todas las insignias visibles en tu perfil',
      'Username con gradiente animado Omniboxd'
    ]
  }
];

const allAchievementSlugs = categories.flatMap((category) => category.achievements.map((achievement) => achievement.slug));

export const AchievementsView: React.FC<AchievementsViewProps> = ({ onNavigate, currentUser }) => {
  const [unlockedSlugs, setUnlockedSlugs] = useState<string[]>([]);
  const [simulatedCount, setSimulatedCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchUserAchievements(currentUser?.id).then((items) => {
      if (!cancelled) setUnlockedSlugs([...new Set(items.map((item) => item.achievement_slug))]);
    });
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const actualUnlockedCount = unlockedSlugs.length;
  const displayedSlugs = simulatedCount === null
    ? unlockedSlugs
    : allAchievementSlugs.slice(0, simulatedCount);
  const unlocked = new Set(displayedSlugs);
  const unlockedCount = simulatedCount ?? actualUnlockedCount;
  const currentLevel = [...levels].reverse().find((level) => unlockedCount >= level.min) || {
    name: 'Primer paso pendiente',
    number: '—',
    range: '0 logros',
    min: 0,
    accent: 'text-[var(--text-muted)]',
    rewards: []
  };
  const currentLevelIndex = levels.findIndex((level) => level.number === currentLevel.number);
  const nextLevel = currentLevelIndex >= 0 ? levels[currentLevelIndex + 1] || null : levels[0];
  const progressStart = currentLevel.min;
  const progressEnd = nextLevel?.min ?? currentLevel.min;
  const progress = nextLevel
    ? Math.min(100, Math.max(0, ((unlockedCount - progressStart) / (progressEnd - progressStart)) * 100))
    : 100;
  const remainingToNext = nextLevel ? Math.max(0, nextLevel.min - unlockedCount) : 0;
  const achievementLabel = `${unlockedCount} ${unlockedCount === 1 ? 'logro' : 'logros'}`;
  const simulatedEntitlements = getAchievementEntitlements(unlockedCount);
  const simulatedFeatures = [
    ['Bio', `${simulatedEntitlements.maxBioLength} caracteres`],
    ['Links', `${simulatedEntitlements.maxLinks}`],
    ['Tema intermedio', simulatedEntitlements.canUseMediumTheme ? 'desbloqueado' : 'bloqueado'],
    ['Tema trasnoche', simulatedEntitlements.canUseNightTheme ? 'desbloqueado' : 'bloqueado'],
    ['Galaxia', simulatedEntitlements.canUseGalaxyTheme ? 'desbloqueado' : 'bloqueado'],
    ['Tema automático', simulatedEntitlements.canUseAutomaticTheme ? 'desbloqueado' : 'bloqueado'],
    ['Video de perfil', simulatedEntitlements.canUseProfileVideo ? 'desbloqueado' : 'bloqueado'],
    ['Portada multimedia', simulatedEntitlements.canUseCoverMedia ? 'desbloqueado' : 'bloqueado'],
    ['Borde de avatar', simulatedEntitlements.avatarBorder],
    ['Flair', simulatedEntitlements.profileFlair || 'sin flair'],
    ['Insignias visibles', Number.isFinite(simulatedEntitlements.maxVisibleBadges) ? String(simulatedEntitlements.maxVisibleBadges) : 'todas']
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 pb-28 space-y-5 animate-in fade-in duration-200">

      <section className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-[var(--surface)] p-5 sm:p-7 shadow-[0_12px_40px_rgba(245,200,66,0.08)]">
        <div className="absolute -right-8 -top-10 text-amber-400/10"><Award className="w-48 h-48" /></div>
        <div className="relative max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-[var(--achievement-gold)] text-xs font-bold uppercase tracking-[0.18em]"><Sparkles className="w-4 h-4" /> Bitácora de logros</div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">Cada viaje deja una marca.</h1>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">Cada logro desbloqueado suma al contador general. Cuando llegás a un umbral, subís de nivel y se habilitan nuevas recompensas de perfil.</p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--achievement-gold)]/30 bg-[color:var(--achievement-gold)]/10 px-3 py-2 text-xs text-[var(--achievement-gold)]"><Award className="w-3.5 h-3.5" /> {currentUser ? `${unlockedCount} de ${categories.reduce((total, category) => total + category.achievements.length, 0)} logros desbloqueados` : 'Iniciá sesión para ver tu progreso'}</div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-dim)]">Tu recorrido</p>
            <h2 className={`mt-1 font-display text-xl font-bold ${currentLevel.accent}`}>Nivel {currentLevel.number} · {currentLevel.name}</h2>
          </div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-mono text-[var(--text-muted)]">{achievementLabel}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>{nextLevel ? `Próximo: nivel ${nextLevel.number}` : 'Todos los niveles completados'}</span><span>{nextLevel ? `${remainingToNext} ${remainingToNext === 1 ? 'restante' : 'restantes'}` : achievementLabel}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"><div className="h-full rounded-full bg-[var(--achievement-gold)] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {levels.map((level) => {
            const active = unlockedCount >= level.min;
            return <div key={level.number} className={`rounded-lg border p-3 ${active ? 'border-[color:var(--achievement-gold)]/40 bg-[color:var(--achievement-gold)]/5' : 'border-[var(--border)] opacity-65'}`}>
              <div className="flex items-center gap-2"><span className={`font-display font-bold ${active ? level.accent : 'text-[var(--text-muted)]'}`}>Nivel {level.number}</span>{active ? <Check className="h-4 w-4 text-emerald-400" /> : <Lock className="h-3.5 w-3.5 text-[var(--text-dim)]" />}</div>
              <p className="mt-1 text-xs font-semibold text-[var(--text)]">{level.name}</p>
              <ul className="mt-2 space-y-1 text-[11px] text-[var(--text-muted)]">{level.rewards.map((reward) => <li key={reward} className="flex gap-1.5"><span className="text-[var(--achievement-gold)]">·</span><span>{reward}</span></li>)}</ul>
            </div>;
          })}
        </div>
      </section>

      {currentUser?.is_admin && (
        <section className="rounded-xl border border-violet-400/30 bg-violet-400/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-violet-400/15 p-2 text-violet-300"><Gauge className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><h2 className="font-display text-sm font-bold text-[var(--text)]">Simulador de niveles</h2><span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-mono text-violet-300">Solo admin</span></div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">Previsualizá recompensas y estados sin modificar tus logros reales ni los datos de Supabase.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="achievement-simulator" className="text-xs text-[var(--text-muted)]">Ver como:</label>
            <select id="achievement-simulator" value={simulatedCount ?? ''} onChange={(event) => setSimulatedCount(event.target.value === '' ? null : Number(event.target.value))} className="rounded-lg border border-violet-400/30 bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-violet-300">
              <option value="">Mi progreso real ({actualUnlockedCount})</option>
              {[0, 1, 4, 7, 12, 17, 24, 31, 40, 49].map((count) => <option key={count} value={count}>{count} logros</option>)}
            </select>
            {simulatedCount !== null && <button type="button" onClick={() => setSimulatedCount(null)} className="flat-btn text-xs"><RotateCcw className="h-3.5 w-3.5" /> Restaurar progreso real</button>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {simulatedFeatures.map(([feature, value]) => (
              <div key={feature} className="flex items-center justify-between rounded-lg border border-violet-400/20 bg-[var(--surface)] px-3 py-2 text-[11px]">
                <span className="text-[var(--text-muted)]">{feature}</span>
                <span className={value === 'bloqueado' ? 'text-[var(--text-dim)]' : 'font-semibold text-violet-300'}>{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {categories.map((category) => (
          <section key={category.slug} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] ${category.achievements.every((achievement) => unlocked.has(achievement.slug)) ? category.accent : 'text-[var(--text-dim)] grayscale opacity-60'}`}>
                <CategoryIcon category={category} complete={category.achievements.every((achievement) => unlocked.has(achievement.slug))} />
              </div>
<div className="min-w-0 flex-1">
  <div className="flex flex-wrap items-center gap-1.5">
    <h2 className="font-display text-sm font-bold text-[var(--text)]">{category.title}</h2>
    {category.achievements.every((achievement) => unlocked.has(achievement.slug)) && (
      <span className="category-badge-complete inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
        <Crown className="w-2.5 h-2.5" />
        Categoría completa
      </span>
    )}
  </div>
  <p className="text-[11px] text-[var(--text-dim)]">{category.achievements.length} desafíos</p>
</div>
<ChevronRight className="ml-auto h-4 w-4 text-[var(--text-dim)]" />
            </div>
            <div className="divide-y divide-[var(--border)]">
              {category.achievements.map((achievement) => (
                <article key={achievement.slug} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-2)]/60">
<div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-xl ${
  unlocked.has(achievement.slug)
    ? (category.achievements.every((a) => unlocked.has(a.slug)) ? 'category-badge-complete border-amber-400/40' : '')
    : 'grayscale opacity-70'
}`}>
                    <AchievementIcon achievement={achievement} />
                  </div>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-[var(--text)]">{achievement.title}</h3>{unlocked.has(achievement.slug) && <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">Desbloqueado</span>}</div><p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{achievement.description}</p></div>
                  {unlocked.has(achievement.slug) ? <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Logro desbloqueado" /> : <Lock className="h-4 w-4 shrink-0 text-[var(--text-dim)]" aria-label="Logro bloqueado" />}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
