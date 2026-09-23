import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  User,
  PlusCircle,
  Star,
  Share2,
  ArrowLeft,
  Signpost,
  ArrowDown,
  Bus,
  Users,
  ExternalLink,
  Mail,
  Heart,
  HelpCircle,
  Clock,
  Sparkles,
  Compass,
  Award,          // ← NUEVO
  Palette,        // ← NUEVO
  Shield,         // ← NUEVO
  Bell            // ← NUEVO
} from 'lucide-react';

interface ManualViewProps {
  onNavigate: (view: string) => void;
}

export const ManualView: React.FC<ManualViewProps> = ({ onNavigate }) => {
  const [showFormIframe, setShowFormIframe] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 pb-28 space-y-4 animate-in fade-in duration-200">

      {/* Encabezado Principal */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
        <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <h1 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">
            Manual de omniboxd
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Cómo sacarle el máximo jugo al sitio de reseñas de ómnibus uruguayos
          </p>
        </div>
      </div>

      {/* ¿Qué es esto? */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" />
          <span>¿Qué es esto?</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          <strong className="text-amber-400">omniboxd</strong> es el lugar donde reseñás líneas, puntuás tus viajes y compartís ✨​experiencias✨​ con otras personas que se mueven a diario en este transporte colectivo controversial de 4 ruedas.
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          (Acá no hay algoritmos raros ni publicidad. Es un proyecto independiente, sin fines de lucro, hecho por y para la gente que banca los ómnibus -o no, anyways-)
        </p>
      </article>

      {/* Vocabulario de la comunidad */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          <span>Vocabulario de la comunidad</span>
        </h2>
        <div className="space-y-2.5 text-xs text-[var(--text)]">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 text-sm">
              🚌
            </span>
            <div>
              <strong className="text-[var(--text)]">Omniposteo (Omnipost):</strong> La reseña de un viaje. Puntuación de 0,5 a 5 estrellas (de media en media), línea, empresa, recorrido y un texto contando la experiencia con tags temáticos. Tenés 15 minutos para editar o borrar un omniposteo nuevo.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 text-sm">
              🗣️
            </span>
            <div>
              <strong className="text-[var(--text)]">Chiflido (Me gusta):</strong> Reconocimiento a un buen viaje, a una reseña certera o a un/una chofer que salvó la jornada. También podés chiflar <strong>charlas de parada</strong> individualmente.  {/* ← NUEVO */}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
              <ArrowDown className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Bajada (No me gusta):</strong> Por viajes complicados, confusos, demoras, calor sofocante, quejas del servicio o si no te va el omnipost de alguien. También podés dar bajada a <strong>charlas de parada</strong> que no te copen.  {/* ← NUEVO */}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Signpost className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Charla de parada:</strong> Los comentarios en cada omnipost. Podés ver charlas en tus omniposteos, apoyar omniposteos ajenos y mencionar a otras personas viajeras con <code>@usuario</code>. Tenés 10 minutos para editar o borrar una charla de parada nueva.  {/* ← NUEVO */}
              <p className="text-xs text-[var(--text-muted)]"><strong>NUEVO:</strong> Ahora <strong>la última charla aparece visible debajo del omniposteo en el feed</strong> para que no te pierdas la conversación. </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Bus className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Transbordo (Reposteo):</strong> Al darle transbordo a un omniposteo ajeno, se agrega de inmediato a la pestaña de <strong>Transbordos</strong> en tu perfil para que tus seguidores también lo lean.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Panel de reactores y transbordos:</strong> Exclusivo para la persona autora del omnipost. Al tocar el ícono podés consultar en privado la lista de quiénes te dieron chiflidos, bajadas o transbordos.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Líneas frecuentes:</strong> Marcá con la estrella las líneas que tomás cotidianamente. En el Inicio podés activar el filtro "Frecuentes" para ver exclusivamente las reseñas de tus ómnibus de cabecera.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <Share2 className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Compartir en imagen o texto:</strong> Generá una tarjeta nítida lista para descargar como imagen, copiar directamente al portapapeles o compartirla en tus redes.
            </div>
          </div>

          {/* ← NUEVO: Logros */}
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-[var(--achievement-gold)]/10 text-[var(--achievement-gold)] shrink-0">
              <Award className="w-3.5 h-3.5" />
            </span>
            <div>
              <strong className="text-[var(--text)]">Logros e insignias:</strong> A medida que viajás, desbloqueás logros que suman a tu nivel. Cada nivel te da recompensas: bordes de avatar (bronce, plata, oro), bio más larga, links, temas visuales, insignias visibles y más.
            </div>
          </div>

          {/* ← NUEVO: Flairs */}
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 shrink-0 text-sm font-bold">
              🎖️
            </span>
            <div>
              <strong className="text-[var(--text)]">Flairs de nivel:</strong> Novatada, Viajante, Amante, Chófer y Leyenda. Aparecen al lado de tu username en todo el sitio y reflejan tu trayectoria en la comunidad.
            </div>
          </div>
        </div>
      </article>

      {/* Inicio — Últimos viajes */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Compass className="w-4 h-4" />
          <span>Inicio — Últimos viajes</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          El feed muestra las reseñas más recientes de la comunidad en tiempo real. Cada tarjeta incluye:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text)] ml-1">
          <li>Número de línea y badge con los colores distintivos de la empresa</li>
          <li>Calificación en estrellas (de 0,5 a 5 con medias estrellas)</li>
          <li>Destino / recorrido elegido (si aplica la variante)</li>
          <li>Texto del viaje, tags temáticos y autor/a (opcional, número de coche)</li>
          <li>Fecha del viaje y momento de publicación (opcional, también de cuándo ocurrió el viaje si querés aportar esa data)</li>
          <li><strong>La última charla de parada visible</strong> debajo del omniposteo, con acceso directo a todas las demás  {/* ← NUEVO */}</li>
        </ul>
        <p className="text-xs text-[var(--text-dim)] pt-1">
          Tocá el avatar o el nombre de usuario de cualquier tarjeta para visitar su perfil completo. También podés filtrar por empresa desde el selector en la parte superior del feed.
        </p>
      </article>

      {/* Buscar */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-4 h-4" />
          <span>Buscar</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          Escribí un <strong>número de línea</strong> o <strong>destino/recorrido</strong>. Al ingresar a una línea encontrarás:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs ml-1">
          <li>Logo y color de la empresa concesionaria</li>
          <li>Promedio de estrellas y cantidad histórica de reseñas</li>
          <li>Recorridos alternativos y ramales disponibles</li>
          <li>Listado completo de todas las reseñas de esa línea</li>
        </ul>
        <p className="text-xs text-[var(--text-dim)] pt-1">
          <strong>NUEVO:</strong> Ahora podés filtrar por <strong>empresa/s</strong> y/o <strong>tipo/s de línea</strong>.  {/* ← NUEVO */}
        </p>
      </article>

      {/* Nueva reseña (Omnipost) */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo omnipost</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          El botón <strong>+</strong> en la zona inferior abre el formulario de publicación. Podés:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs ml-1">
          <li>Filtrar por tipo de línea y empresa prestadora</li>
          <li>Elegir la línea de la lista de sugerencias predictivas</li>
          <li>Si la línea tiene variantes o varios destinos, seleccionar el recorrido exacto</li>
          <li>Puntuar de <strong>0,5 a 5 estrellas</strong> (de media en media estrella)</li>
          <li>Marcar tags representativos del viaje</li>
          <li>Escribir hasta <strong>750 caracteres</strong> con formato y saltos de línea</li>
          <li>Indicar fecha y hora específica si el viaje no fue "ahora mismo"</li>
        </ul>
        <p className="text-xs text-[var(--text-dim)] pt-1">
          Tenés 15 minutos desde que publicás un omnipost propio para editar su contenido o borrarlo. Pasado ese tiempo queda fijo en la bitácora del viaje.  {/* ← NUEVO */}
        </p>
      </article>

      {/* ← NUEVO: Notificaciones */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Bell className="w-4 h-4" />
          <span>Notificaciones y paradas de aviso</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          La campana en la barra superior te avisa cuando alguien <strong>interactúa</strong> con vos. Tipos de aviso:
        </p>
        

        
        
          <div className="space-y-2.5 text-xs text-[var(--text)]">
              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 text-sm">
                  🗣️
                </span>
                <div> <strong><code>@usuario</code> pegó un chiflido en tu omnipost</strong> <br></br>
                  Chiflido en tu omniposteo o en una charla tuya
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 shrink-0">
                  <ArrowDown className="w-3.5 h-3.5" />
                </span>
                <div> <strong><code>@usuario</code> le dio una bajada a tu omnipost</strong><br></br>
                  Bajada en tu omniposteo o en una charla tuya
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 text-sm">
                  🚌
                </span>
                <div> <strong><code>@usuario</code> realizó un transbordo en un omnipost</strong><br></br>
                  Transbordo de tu omniposteo
                </div>
              </div>
 <div className="flex items-start gap-2.5">
                          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
              <Signpost className="w-3.5 h-3.5" />
            </span>
            <div> <strong><code>@usuario</code> realizó una charla de parada en tu omnipost</strong><br></br>
              Charla de parada nueva en tu omniposteo
            </div>
            </div>
<div className="flex items-start gap-2.5">
                <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 text-sm">
                  ​#️⃣​
                </span>
                <div> <strong><code>@usuario</code> te mencionó en una charla de parada</strong><br></br>
                  Mención en una charla
                </div>
              </div>

<div className="flex items-start gap-2.5">
                           <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </span>
                <div> <strong><code>@usuario</code> te empezó a seguir / te devolvió el follow</strong> <br></br>
                  Nueva persona que te sigue o te devuelve el seguido
                </div>
              </div>

          </div>

        <p className="text-xs text-[var(--text-dim)] pt-1">
          Cada aviso incluye la línea y un fragmento del omniposteo referenciado. Podés tocar cualquier notificación para abrir el omniposteo directamente, y borrarla con la <strong>X</strong> si ya la leíste.
        </p>
      </article>

      {/* ← NUEVO: Sistema de niveles y logros */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4" />
          <span>Sistema de niveles y logros</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          Cada acción en omniboxd (publicar, comentar, reaccionar, seguir gente, viajar en horarios raros, etc.) puede desbloquear <strong>logros</strong>. Hay 10 categorías con más de 50 logros en total:
        </p>
        <div className="mt-2 p-2.5 rounded-lg bg-[var(--achievement-gold)]/10 border border-[var(--achievement-gold)]/20 text-xs text-[var(--achievement-gold)] flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Niveles:</strong> 
            <ul>
              <li>Peatón (0,5)</li>
              <li>Persona en la vía pública queriendo tomarse el ómnibus (1)</li>
              <li>Persona dentro del ómnibus (1,5)</li>
              <li>Viajante (2)</li>
              <li>Boletera cargada (2,5)</li>
              <li>Amante junior (3)</li>
              <li>Amante senior (3,5)</li>
              <li>Chófer de línea (4)</li>
              <li>Inspector/Inspectora (4,5)</li>
              <li>Leyenda sobre 4 ruedas (5)</li> <br></br>Cada nivel desbloquea recompensas nuevas.
            </ul>
          </span>
        </div>

                        <button
                  onClick={() => onNavigate('achievements')}
                >
                  <div className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--achievement-gold)]/30 bg-[color:var(--achievement-gold)]/10 px-3 py-2 text-xs text-[var(--achievement-gold)]"><Award className="w-3.5 h-3.5" /> {'Revisá "Logros" para saber más'}</div>
                </button>
      </article>

      {/* ← NUEVO: Insignias visibles */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Star className="w-4 h-4" />
          <span>Insignias visibles en tu perfil</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          Según tu nivel, podés mostrar una cantidad determinada de insignias en tu perfil:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text)] ml-1">
          <li>Nivel 1,5 a 2 → 1 insignia</li>
          <li>Nivel 2,5 a 3 → 2 insignias</li>
          <li>Nivel 3,5 a 4 → 3 insignias</li>
          <li>Nivel 4,5 → 4 insignias</li>
          <li>Nivel 5 (Leyenda) → todas las insignias</li>
        </ul>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Por defecto las insignias <strong>rotan automáticamente cada 5 segundos</strong> entre todas las que desbloqueaste, para que se vea variedad. Si sos nivel <strong>3,5 o superior</strong>, podés elegir manualmente cuáles mostrar desde el botón <em>"Elegir insignias visibles"</em> en tu perfil.
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Las insignias de <strong>categoría completa</strong> aparecen con brillo dorado y también se muestran junto a tu username en tus omnipostes del feed.
        </p>
      </article>

      {/* Cuenta y Perfil */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4" />
          <span>Cuenta y Perfil</span>
        </h2>
        <div className="space-y-2 text-xs text-[var(--text)]">
          <p>
            Desde <strong>Entrar</strong> podés registrarte con email y contraseña o continuar directamente con tu cuenta de Google.
          </p>
          <p>En tu <strong>Perfil</strong> podés:</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text)] ml-1">
            <li>Editar tu perfil directamente desde tu dispositivo, en función del nivel que tengas</li>
            <li>Elegir el <strong>color de portada</strong> entre 6 opciones de la paleta oficial omniboxd  {/* ← NUEVO */}</li>
            <li>Editar tu biografía (el límite crece con tu nivel, hasta 1000 caracteres en Leyenda)</li>
            <li>Agregar enlaces personales (hasta 5 según nivel)</li>
            <li>Cambiar el color de tu username (nivel 2+)  {/* ← NUEVO */}</li>
            <li>Modificar tu nombre de usuario (permitido una vez cada 7 días)</li>
            <li>Gestionar tus <strong>insignias visibles</strong> manualmente (nivel 3,5 o superior)  {/* ← NUEVO */}</li>
            <li>Visualizar tus omniposts, transbordos, rankings de líneas aprobadas y canceladas, y seguidores</li>
            <li>Compartir tu perfil con link directo amigable (<code>/perfil?u=tu_usuario</code>)</li>
          </ul>
          <p className="text-[var(--text-dim)]">
            A medida que subís de nivel, se desbloquean más funciones de perfil: video de portada, temas visuales (intermedio, trasnoche, galaxia, automático), borde de avatar premium, etc.
          </p>
        </div>
      </article>

      {/* ← NUEVO: Privacidad y datos */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>Privacidad y tus datos</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          Vos controlás qué se muestra en tu perfil:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text)] ml-1">
          <li><strong>Fecha de nacimiento:</strong> podés mostrarla completa, solo mes y año, solo el año, o mantenerla privada</li>
          <li><strong>Identidad de género:</strong> opcional, con visibilidad pública o solo para vos</li>
          <li><strong>Ubicación:</strong> ciudad, barrio o zona de viaje (opcional)</li>
          <li>Podés <strong>eliminar tu cuenta</strong> en cualquier momento desde Ajustes → Eliminar cuenta</li>
        </ul>
      </article>

            {/* ← NUEVO: Temas visuales */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4" />
          <span>Temas visuales</span>
        </h2>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          El ícono de tema en la barra superior cicla entre los modos disponibles según tu nivel:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text)] ml-1">
          <li><strong>Claro / Oscuro</strong> — desde nivel 0,5</li>
          <li><strong>Intermedio</strong> — desde nivel 2</li>
          <li><strong>Trasnoche / Expreso nocturno</strong> — desde nivel 3</li>
          <li><strong>Galaxia Omniboxdera</strong> — desde nivel 4</li>
          <li><strong>Automático</strong> (cambia según el momento del día) — desde nivel 5</li>
        </ul>
      </article>

      {/* Consejos para la comunidad */}
      <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
        <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Heart className="w-4 h-4" />
          <span>Consejos para aprovechar omniboxd</span>
        </h2>
        <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text)] ml-1">
          <li>Especificá todo lo que puedas: coche, hora pico, si iba hasta las manos, el aire acondicionado o la buena onda del chofer</li>
          <li>Usá tags para que otras personas puedan clasificar la vibra del trayecto</li>
          <li>Seguí a usuarios que compartan los mismos corredores y líneas que tomás todos los días</li>
          <li>Marcá tus líneas frecuentes con la estrella para tenerlas a mano en el Inicio</li>
          <li>Comentá en las charlas de parada - la comunidad (y la persona uruguaya promedio) vive de la conversación.</li>
          <li>Chiflá las reseñas que te sirvieron y bajá las que no, es la forma de destacar el buen contenido.  {/* ← NUEVO */}</li>
        </ul>
      </article>

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
    </div>
  );
};