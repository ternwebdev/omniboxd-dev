import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Award, Palette, MessageSquare, Bell, Star, Repeat, Mail, ExternalLink } from 'lucide-react';

interface NewsViewProps {
  onNavigate: (view: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onNavigate }) => {

    const [showFormIframe, setShowFormIframe] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
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
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-4">
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
        </div>
      </article>

      {/* v1.0.0 — ¡Lanzamiento oficial! */}
      <article className="bg-[var(--surface)] border-2 border-amber-400/60 rounded-xl p-4 shadow-md space-y-3 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 text-amber-400/10 pointer-events-none">
          <Sparkles className="w-32 h-32" />
        </div>
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

          <div className="mt-3 p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-start gap-2">
            <Award className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Gracias por ser parte de omniboxd.</strong> Esto recién empieza: la versión 1.0 es la base más sólida sobre la que vamos a seguir construyendo. ¡A seguir viajando! <br></br>- omniboxd
            </span>
          </div>
        </div>
      </article>

      {/* v0.9.6 */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
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
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
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
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
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
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
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
    </div>
  );
};