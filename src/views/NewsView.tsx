import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Award, Mail, ExternalLink } from 'lucide-react';

interface NewsViewProps {
  onNavigate: (view: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate }) => {

  const [showFormIframe, setShowFormIframe] = useState(false);

  const versions = [
  { id: 'v139', label: 'v1.3.9 · Bugs en corrección', badge: 'v1.3.9', date: '08/10/2026', isLatest: true },
  { id: 'v138', label: 'v1.3.8 · Maldonado y fixes', badge: 'v1.3.8', date: '07/10/2026' },
  { id: 'v135', label: 'v1.3.5 · Combinaciones, tags y magia', badge: 'v1.3.5', date: '06/10/2026' },
  { id: 'v125', label: 'v1.2.5 · Top líneas', badge: 'v1.2.5', date: '05/10/2026' },
  { id: 'v123', label: 'v1.2.3 · Combinaciones, transbordos y arreglos', badge: 'v1.2.3', date: '04/10/2026' },
  { id: 'v106', label: 'v1.0.6 · Menciones y términos', badge: 'v1.0.6', date: '03/10/2026' },
  { id: 'v100', label: 'v1.0.0 · Lanzamiento', badge: 'v1.0.0', date: '23/09/2026' },
  { id: 'v096', label: 'v0.9.6 · Nuevas líneas', badge: 'v0.9.6', date: '07/09/2026' },
  { id: 'v095', label: 'v0.9.5 · Flat buttons', badge: 'v0.9.5', date: '02/09/2026' },
  { id: 'v094', label: 'v0.9.4 · Vocabulario', badge: 'v0.9.4', date: '01/09/2026' },
  { id: 'v093', label: 'v0.9.3 · Social', badge: 'v0.9.3', date: '28/08/2026' },
  { id: 'v090', label: 'v0.9.0 · Prototipo', badge: 'v0.9.0', date: '26/08/2026' }
  ];

  const [activeVersion, setActiveVersion] = useState<string>('v139');
  const isProgrammaticScrollRef = useRef(false);

  const scrollToVersion = (id: string) => {
    const el = document.getElementById(`news-${id}`);
    if (!el) return;

  // Bloquea el listener
    isProgrammaticScrollRef.current = true;
    setActiveVersion(id);

  // Cancela cualquier scroll suave pendiente
    window.scrollTo({ top: window.scrollY, behavior: 'auto' });

  // Lanza el nuevo scroll
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 700);
  };

useEffect(() => {
  const handleScroll = () => {
    // Si hay un scroll programático en curso, no pisamos el activeVersion
    if (isProgrammaticScrollRef.current) return;

    for (const v of versions) {
      const el = document.getElementById(`news-${v.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom > 120) {
          setActiveVersion((prev) => (prev === v.id ? prev : v.id));
          break;
        }
      }
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  return (
  <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-24">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {/* ───── Sidebar / Índice de versiones (solo desktop) ───── */}
      <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-20 self-start">
  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Versiones
            </h2>
          </div>
          <nav className="space-y-1">
            {versions.map((v) => {
              const isActive = activeVersion === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => scrollToVersion(v.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-amber-400/15 border-amber-400/40'
                      : 'border-transparent hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        v.isLatest
                          ? 'text-amber-300'
                          : isActive
                          ? 'text-[var(--text)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {v.badge}
                    </span>
                    {v.isLatest && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-bold uppercase tracking-wider shrink-0">
                        Actual
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] mt-0.5 ${
                    isActive ? 'text-[var(--text-muted)]' : 'text-[var(--text-dim)]'
                  }`}>
                    {v.date}
                  </p>
                  <p className={`text-[11px] mt-1 leading-snug truncate ${
                    isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'
                  }`}>
                    {v.label}
                  </p>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ───── Contenido principal ───── */}
      <div className="lg:col-span-8 space-y-4 min-w-0">

        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <Sparkles className="w-5 h-5 text-emerald-400" />
        <div>
          <h1 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">
            Novedades y versiones
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Historial de mejoras y nuevas funciones en omniboxd
          </p>
        </div>
      </div>

      {/* Contacto y el Proyecto */}
      <article className="bg-[var(--surface)] border-2 border-amber-400/60 rounded-xl p-4 shadow-md space-y-3 relative overflow-hidden">
        <div>
          <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span>Contacto y el proyecto</span>
          </h2>
          <p className="text-xs text-[var(--text)] leading-relaxed">
            ¿Tenés sugerencias, encontraste algún bug o querés sumar nuevas líneas? Dejanos tu mensaje a través del formulario oficial:
          </p>
        </div>

        {/* Toggle para ver formulario embebido */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFormIframe(!showFormIframe)}
              className="flat-btn text-xs py-1.5 px-3 hover:text-amber-400"
            >
              <span>{showFormIframe ? 'Ocultar formulario' : 'Completar formulario acá'}</span>
            </button>
            <a
              href="https://forms.gle/zv1gZheCPepuqovE9"
              target="_blank"
              rel="noopener noreferrer"
              className="flat-btn text-xs py-1.5 px-3 hover:text-amber-400 inline-flex items-center gap-1.5"
            >
              <span>Abrir en Google Forms</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {showFormIframe && (
            <div className="rounded-lg overflow-hidden border border-[var(--border)] mt-2 bg-neutral-900">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSdTrTZJjD3sjlL3anp7tuodjoPS9LJRfylhWj1uSUDD6VaUvw/viewform?embedded=true"
                width="100%"
                height="600"
                frameBorder={0}
                marginHeight={0}
                marginWidth={0}
                title="Formulario de contacto de omniboxd"
                loading="lazy"
                className="w-full"
              >
                Cargando formulario…
              </iframe>
            </div>
          )}
        </div>

        {/* Equipo fundador */}
        <div className="border-t border-[var(--border)] pt-3 space-y-3">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Equipo y cofundadores
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* tern web dev */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <img
                src="https://unavatar.io/twitter/ternwebdev"
                alt="tern web dev"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border border-amber-400/40 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text)] truncate">tern web dev</p>
                <p className="text-[11px] text-[var(--text-dim)] leading-tight">
                  Persona desarrolladora y cofundadora
                </p>
                <a
                  href="https://ternwebdev.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                >
                  <span>sitio web</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            {/* el copsa de Rampla */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
              <img
                src="https://unavatar.io/twitter/Kohntarkosz_"
                alt="el copsa de Rampla"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full border border-amber-400/40 object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text)] truncate">el copsa de Rampla 🇧🇫</p>
                <p className="text-[11px] text-[var(--text-dim)] leading-tight">
                  Persona consultora y cofundadora
                </p>
                <a
                  href="https://twitter.com/Kohntarkosz_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-sky-400 hover:underline inline-flex items-center gap-1 mt-1 font-mono"
                >
                  <span>@Kohntarkosz_</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-3 space-y-3">
  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
    Seguinos en redes
  </h3>
  <div className="flex flex-wrap gap-2">
    <a
      href="https://instagram.com/omniboxd.app"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-pink-400 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </div>
      <span className="font-mono">@omniboxd.app</span>
    </a>
    <a
      href="https://twitter.com/omniboxd"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-sky-400 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </div>
      <span className="font-mono">@omniboxd</span>
    </a>
  </div>
</div>
        </div>
      </article>

      {/* v1.3.9 — Fix del modal de términos y robustez del feed */}
      <article
        id="news-v139"
        className="scroll-mt-20 bg-[var(--surface)] border-2 border-amber-400/60 rounded-xl p-4 shadow-md space-y-3 relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 text-amber-400/10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.3.9 · Actual
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">08/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Bugs en corrección 🛡️
          </h2>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🛡️ Solución de bugs reportados por usuarios:</strong> Aceptación de términos y condiciones, introducción de estados locales en funciones internas del sitio, iniciación de parches en feed vacío por internet lento o escaso.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Esta actualización no trae funciones nuevas visibles, pero hace que omniboxd sea mucho más confiable para todas las personas.</strong> Seguimos puliendo los engranajes internos. <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

      {/* v1.3.8 — Maldonado y fixes */}
      <article
        id="news-v138"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.3.8
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">07/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Salimos del área metropolitana: llegó Maldonado 🚌🌊
          </h2>

          <p className="text-xs text-[var(--text-muted)] italic">
            Omniboxd empieza a cruzar fronteras departamentales. Además, fixes importantes en el modal de nueva reseña y en el sistema de aceptación de términos.
          </p>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🌊 Maldonado se suma a omniboxd:</strong> gracias al trabajo de nuestra persona consultora, agregamos un montón de <strong>líneas urbanas del departamento de Maldonado</strong> a la base de datos. Ahora podés reseñar viajes en los bondis de Maldonado, Punta del Este, San Carlos y alrededores. Esto marca el primer paso de <strong>omniboxd fuera del área metropolitana</strong>. ¡Seguimos creciendo!
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>📅 Fix del selector de fecha en el modal de omniposteo:</strong> solucionamos un bug que impedía abrir el selector de fecha y hora en algunos navegadores.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🛡️ Fix del modal de Términos y Condiciones:</strong> corregimos un bug que impedía <strong>guardar la aceptación de términos</strong> en algunas sesiones.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Cada vez somos más.</strong> Gracias por seguir sumando líneas, usuarios y viajes a omniboxd. <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

            {/* v1.3.5 — Combinaciones, tags, efectos y más */}
      <article
        id="news-v135"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.3.5
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">06/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Tags clickeables, transbordos propios, redes, chiflidos y el inicio de la magia visual
          </h2>

          <p className="text-xs text-[var(--text-muted)] italic">
            La actualización más grande hasta ahora en conjunto con la v1.2.3: nueva forma de registrar viajes compuestos, etiquetas navegables, sonidos y efectos ambientales por nivel.
          </p>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            {/* ────── 🚌 COMBINACIONES ────── */}
            <li className="flex items-start gap-2 pt-1 border-t border-[var(--border)]">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🚌 Combinaciones (hasta 3 ómnibus):</strong> si tu viaje tuvo <strong>varios ómnibus seguidos</strong>, podés agruparlos en un solo omniposteo. Cada pata tiene su línea, recorrido, coche, fecha, rating, tags y texto. En el feed y el perfil se ven como un único hilo apilado con flechitas ↓. <em><a href="#news-v123">Más información en la v1.2.3</a>.</em>
              </div>
            </li>

            {/* ────── 🏷️ TAGS ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🏷️ Tags clickeables:</strong> ahora podés tocar cualquier etiqueta de un omniposteo (por ejemplo <em>"venía vacío"</em> o <em>"aire al mango"</em>) y te lleva a una <strong>sección dedicada</strong> con todos los omniposteos que usan esa etiqueta. Ideal para descubrir experiencias parecidas, ver qué opinan otras personas sobre el mismo tipo de viaje y compartir el link del tag con quien quieras.
              </div>
            </li>

            {/* ────── 🎨 ESTRELLAS Y EFECTOS ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🎨 Estrellas de colores arregladas:</strong> parche de estrellas mediante logros. Las estrellas de las reseñas vuelven a cambiar de color según el nivel de la persona autora y el rating: violeta (nivel alto + rating alto), celeste (nivel medio + rating alto), plata (nivel alto + rating bajo) y verde (default).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>✨ Efectos ambientales por nivel:</strong> los omniposteos de autores con logros especiales ahora tienen <strong>efectos visuales animados</strong> que se sienten vivos. Chispas azules pulsantes (Diferstar), partículas violeta que suben (Interstar), niebla plateada que se desplaza (Opaquestar) y relámpagos sutiles de tormenta (Stormystar).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔇 Control de accesibilidad:</strong> podés <strong>desactivar los efectos visuales</strong> desde Ajustes si te marean o distraen. Se respeta automáticamente la preferencia del sistema.
              </div>
            </li>

            {/* ────── 🔊 SONIDOS Y CONFETI ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🔊 Sonidos sutiles:</strong> chiflidos, bajadas, transbordos, charlas y notificaciones nuevas ahora tienen <strong>feedback sonoro muy suave</strong>. Al <strong>sacar</strong> una reacción, el sonido se reproduce invertido (en navegadores compatibles). Todo desactivado por defecto: se activa desde Ajustes del perfil.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🎉 Confeti al chiflar:</strong> si chiflás un omniposteo de alguien de <strong>nivel 4.5+</strong>, sale <strong>confeti violeta</strong> desde el botón. Si el autor es <strong>nivel 5 (Leyenda)</strong>, el confeti es dorado + violeta y con más partículas. Un detalle especial para los niveles más altos.
              </div>
            </li>

            {/* ────── 💬 COMENTARIOS ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>💬 Reacciones en el último comentario del feed:</strong> cuando un omniposteo tiene charlas de parada, el preview del último comentario en el feed ahora tiene sus <strong>propios botones de chiflido y bajada</strong>. Ya no tenés que abrir el acordeón para reaccionar.
              </div>
            </li>

            {/* ────── 🔄 FEED Y NOTIFICACIONES ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🔄 Transbordos propios en el feed:</strong> tus propios transbordos aparecen en tu Inicio con un badge distintivo ("Tu transbordo · lo compartiste a tu perfil"), así se diferencian claramente de los transbordos de la gente que seguís (que van en verde).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔔 Notificaciones limpias:</strong> solucionamos un bug que dejaba notificaciones duplicadas o en el limbo.
              </div>
            </li>

            {/* ────── 👋 CONVERSIÓN ────── */}
           <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>👋 Modal de conversión para invitados:</strong> si no tenés login o cuenta y tratás de chiflar, comentar, transbordar, seguir o publicar, ya no te manda directo a la pantalla de login. Aparece un <strong>modal contextual</strong> con un mensaje acorde a la acción y los botones para crear cuenta o iniciar sesión.
              </div>
            </li>

            {/* ────── 🔗 REDES ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>🔗 Redes sociales:</strong> agregamos los links oficiales de omniboxd en el <strong>manual</strong>, las <strong>novedades</strong> y en el <strong>panel de notificaciones</strong> para seguir la comunidad también en <a href="https://instagram.com/omniboxd.app" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Instagram</a> y <a href="https://twitter.com/omniboxd" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">X/Twitter</a>.
              </div>
            </li>

            {/* ────── ⚙️ INTERNAS ────── */}
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="pt-1">
                <strong>⚙️ Mejoras internas:</strong> inserciones de funciones seguras, correcciones de bugs conocidos y optimizaciones de varias funcionalidades.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>El sitio crece con cada viaje que registrás.</strong> Gracias por seguir viajando con omniboxd. <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

            {/* v1.2.5 — Top líneas de los últimos 7 días */}
      <article
        id="news-v125"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.2.5
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">05/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Top líneas de los últimos 7 días, ahora también en el celular
          </h2>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🏆 Ranking "Líneas con más viajes":</strong> bug arreglado en esta sección. Ahora se calcula sobre <strong>todas</strong> las reseñas publicadas en los últimos <strong>7 días</strong>, con lo cual el top 5 muestra las líneas más activas de la semana.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>📱 Visible también en celular:</strong> problema de compatibilidad resuelto. Ahora está disponible en dispositivos móviles arriba del feed (se expande al tocarlo), y en dispositivos de escritorio al costado derecho del sitio.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Seguimos sumando detalles que hacen a omniboxd un lugar más vivo.</strong> ¡No te bajés del ómnibus! <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

      {/* v1.2.3 — Combinaciones y menciones inteligentes */}
      <article
        id="news-v123"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.2.3
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">04/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Combinaciones: varios ómnibus, un solo viaje / Transbordos en el feed / Arreglos varios
          </h2>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🚌 Combinaciones (hasta 3 patas):</strong> ahora podés agrupar varios tramos de un mismo viaje en un solo omniposteo. Ideal si te tomás el 183, después el 145 y terminás en el 306. Cada pata tiene su línea, empresa, recorrido, coche, fecha, rating, tags y texto propios. En el feed y en tu perfil se ven como un único hilo apilado con flechitas ↓.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🎯 Las interacciones van a la última pata:</strong> chiflidos, bajadas, charlas de parada y transbordos se aplican a la <strong>combinación completa</strong>. La última pata actúa como "anchor" del hilo.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>📊 Promedio visual del combo:</strong> cada combinación muestra el promedio de ratings de sus patas en la cabecera del hilo. Ese promedio es solo informativo y <strong>no</strong> afecta las estadísticas globales del perfil ni del panel de administración.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔄 Transbordos en el feed:</strong> si alguien que seguís hace transbordo de un omniposteo ajeno, aparece también en tu Inicio con el badge "Transbordo de @usuario" arriba de la tarjeta. Así el feed se vuelve más dinámico y social.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🎨 Fix de colores en modo claro:</strong> se ajustaron algunos colores del modo claro y las distintas barras se lean mejor sobre fondo claro.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔗 Fix de navegación y URLs:</strong> la URL del navegador ahora se actualiza correctamente al cambiar de un perfil ajeno al propio.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🖼️ Fix de navegación activa:</strong> el ícono de "Perfil" en el menú ya no se ilumina cuando estás viendo el perfil de otra persona.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Y seguimos sumando.</strong> Cada vez somos más personas usando omniboxd para dejar registro de cómo nos mueve la ciudad. Gracias por seguir a bordo. <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>
      {/* v1.0.6 — Menciones, términos y autocomplete */}
      <article
        id="news-v106"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.0.6
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">03/10/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            Menciones inteligentes, marco legal y pulido de notificaciones
          </h2>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>@ Autocompletado de menciones en charlas de parada:</strong> al escribir <code>@</code> en un comentario se despliega un selector con personas que seguís primero y otras personas viajantes después.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>📜 Términos y condiciones + Política de privacidad:</strong> incorporamos el marco legal completo de omniboxd conforme a la <strong>Ley N° 18.331</strong> de Protección de Datos Personales de Uruguay. Podés leerlos en <a href="https://omniboxd.netlify.app/terminos" target="_blank" rel="noopener noreferrer"><code>https://omniboxd.netlify.app/terminos</code></a> o desde el menú de notificaciones. Los usuarios existentes deben aceptarlos una única vez mediante un modal, y quienes se registren por primera vez deben marcar el consentimiento obligatorio.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔔 Notificaciones más robustas:</strong> el borrado de notificaciones ahora persiste correctamente. Se corrigieron errores que impedían registrar seguidores y transbordos.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>👥 Fix al seguir viajantes:</strong> solucionado bug localizado que impedía que los seguimientos se guardaran correctamente. Ahora el contador de seguidores se mantiene consistente al refrescar.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>⚡ Mejoras de rendimiento:</strong> redujimos la cantidad de consultas al cargar el feed y los perfiles, eliminando peticiones duplicadas y optimizando el orden de las peticiones en paralelo.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>✨ Pulido general:</strong> ajustes de espaciado, mejoras en el ordenamiento del buscador de líneas y correcciones puntuales.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Seguimos construyendo omniboxd entre todas las personas.</strong> Gracias por viajar con nosotrxs. ¡Beep beep! <br /><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

      {/* v1.0.0 — ¡Lanzamiento oficial! */}
            {/* v1.2.5 — Top líneas de los últimos 7 días */}
      <article
        id="news-v100"
        className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3"
      >
        <div className="relative space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-mono font-bold shadow-sm">
              v1.0.0 · ¡LANZAMIENTO OFICIAL!
            </span>
            <span className="text-[11px] text-[var(--text-dim)] font-mono">23/09/2026</span>
          </div>

          <h2 className="font-display font-bold text-base text-[var(--text)]">
            🎉 omniboxd sale de beta
          </h2>

          <ul className="space-y-2.5 text-xs text-[var(--text)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🏆 Sistema de logros y niveles:</strong> logros repartidos en 10 categorías. Cada logro suma a tu contador y desbloquea recompensas por nivel.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🎖️ Insignias visibles rotativas:</strong> las insignias de tu perfil ahora rotan automáticamente cada 5 segundos, mostrando todas las que desbloqueaste según tu nivel. Si sos nivel 3,5 o superior, podés elegir manualmente cuáles mostrar desde tu perfil. Las insignias de <strong>categoría completa</strong> brillan con un efecto dorado especial y aparecen también en el feed junto a tu username.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🗣️ Reacciones en charlas de parada:</strong> ahora podés dar <strong>chiflido</strong> o <strong>bajada</strong> a cada comentario individual, no solo al omniposteo. Las charlas más valoradas se destacan en la conversación.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>💬 Última charla visible en el feed:</strong> el comentario más reciente de cada omniposteo aparece directamente debajo de la tarjeta, con acceso rápido a toda la conversación. Ya no hay que abrir el acordeón para saber qué se está hablando.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🌈 Bordes de avatar con brillo metálico:</strong> nuevos bordes de nivel (bronce, plata y oro) que se aplican sobre toda interacción del usuario, teniendo un brillo animado sutil y un bronce más metálico. Se replican de forma consistente en el feed, los perfiles, los comentarios y la barra superior.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔍 Buscador mejorado:</strong> el listado de líneas ahora se ordena de manera más natural; más filtros aplicados para mejor búsqueda en líneas específicas.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🏢 Filtro de empresas dinámico:</strong> el filtro de empresas en el feed ya se encuentra disponible, así aparecen solo las empresas cargadas que vos querés.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>🔔 Notificaciones más robustas:</strong> se sigue mejorando el sistema de notificaciones para que los usuarios tengan la mejor experiencia posible.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>✨ Pulido general de UI:</strong> letras con más aire, mejoras de accesibilidad y varios bugs menores de renderizado en perfiles y feed.
              </div>
            </li>
          </ul>

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-[var(--text)] flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Gracias por ser parte de omniboxd.</strong> Esto recién empieza: la versión 1.0 es la base más sólida sobre la que vamos a seguir construyendo. ¡A seguir viajando! <br></br><strong>- el staff de omniboxd</strong>
            </span>
          </div>
        </div>
      </article>

      {/* v0.9.6 */}
      <article id="news-v096" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-mono font-bold">
            v0.9.6
          </span>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">07/09/2026</span>
        </div>

        <h2 className="font-display font-bold text-sm text-[var(--text)]">
          Nuevas Líneas, Interacciones Sintéticas, Menciones y Camino a la Versión Oficial
        </h2>

        <ul className="space-y-2.5 text-xs text-[var(--text)]">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Llegada de nuevas líneas y rumbo a la versión oficial:</strong> Se agregaron decenas de líneas urbanas y suburbanas a la base de datos de omniboxd. El staff se encuentra trabajando a toda marcha para que la versión oficial y definitiva del sitio vea la luz muy pronto.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Panel privado de reactores y transbordos:</strong> Ya no hay cuadros predeterminados del navegador. Como autor de tus omniposts podés consultar de forma privada quién te dio chiflido 🗣️, bajada ⬇️ o transbordo 🚌 en un modal sintético y limpio.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Botones de acción más sintéticos:</strong> Los botones incorporan íconos directos (🗣️ para chiflidos, flecha para bajadas, cartel de parada para charlas de parada y bondi para transbordos) manteniendo el diseño plano y liviano sin rellenos innecesarios.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Charlas de parada con menciones @usuario:</strong> Podés arrobar a otros viajeros con <code>@usuario</code> para abrir su tarjeta flotante de perfil y notificarles. Además, ahora podés editar o borrar tus comentarios en una ventana de 10 minutos.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Notificaciones con vista previa del omniposteo:</strong> Cada aviso en la campana incluye la línea y fragmento del viaje referenciado, permitiendo abrirlo e interactuar directamente.
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Perfil simplificado:</strong> Carga directa de imágenes, GIFs o videos cortos (hasta 5 s) para tu avatar sin botones redundantes, y estados de transbordo corregidos en tu perfil.
            </div>
          </li>
        </ul>
      </article>

      {/* v0.9.5 */}
      <article id="news-v095" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-mono font-bold">
            v0.9.5
          </span>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">02/09/2026</span>
        </div>
        <h2 className="font-display font-bold text-sm text-[var(--text)]">
          Flat Buttons, Tiempo Real & Transbordos en Perfil
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Chiflidos, bajadas y transbordos en tiempo real, tarjetas de viaje compartibles con copia directa al portapapeles y mejoras en perfiles.
        </p>
      </article>

      {/* v0.9.4 */}
      <article id="news-v094" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-mono font-bold">
            v0.9.4
          </span>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">01/09/2026</span>
        </div>
        <h2 className="font-display font-bold text-sm text-[var(--text)]">
          Vocabulario omniboxd y Campana de avisos
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Adopción del lenguaje colectivo (chiflidos, bajadas, omniposts, transbordos, charlas) y sistema de notificaciones privadas por usuario.
        </p>
      </article>

      {/* v0.9.3 */}
      <article id="news-v093" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-mono font-bold">
            v0.9.3
          </span>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">28/08/2026</span>
        </div>
        <h2 className="font-display font-bold text-sm text-[var(--text)]">
          Social, Frecuentes y Recorridos alternativos
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Filtro de líneas frecuentes, soporte para recorridos de ida/vuelta y variantes de ramales en Montevideo.
        </p>
        </article>

              <article id="news-v090" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] text-xs font-mono font-bold">
            v0.9.0
          </span>
          <span className="text-[11px] text-[var(--text-dim)] font-mono">26/08/2026</span>
        </div>
        <h2 className="font-display font-bold text-sm text-[var(--text)]">
          Prototipo Inicial
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Versión MVP del sitio, con funcionalidades básicas, como omnipostear, buscar líneas y tener un perfil.
        </p>
        </article>
      </div>{/* cierra lg:col-span-8 */}
    </div>{/* cierra grid */}
  </div>
  );
};