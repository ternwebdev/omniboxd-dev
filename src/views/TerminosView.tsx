import React, { useState } from 'react';
import { ArrowLeft, FileText, Shield, Mail, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { TERMS_LAST_UPDATED } from '../lib/terms';

interface TerminosViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string) => void;
  /** Si es true, muestra un botón de "Aceptar" al final */
  requireAcceptance?: boolean;
  onAccept?: () => void;
}

export const TerminosView: React.FC<TerminosViewProps> = ({
  currentUser,
  onNavigate,
  requireAcceptance = false,
  onAccept
}) => {
  const [accepted, setAccepted] = useState(false);

  const sections = [
    { id: 'descripcion', label: '1. Descripción del servicio' },
    { id: 'edad', label: '2. Requisito de edad mínima' },
    { id: 'registro', label: '3. Registro de cuenta y seguridad' },
    { id: 'ugc', label: '4. Contenido generado por usuarios' },
    { id: 'propiedad', label: '5. Propiedad intelectual' },
    { id: 'datos', label: '6. Protección de datos personales' },
    { id: 'responsabilidad', label: '7. Exención de responsabilidad' },
    { id: 'ley', label: '8. Ley aplicable y jurisdicción' }
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(`terms-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 pb-28 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Sidebar / Índice */}
        <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-20 self-start">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <h2 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text)]">
                Índice
              </h2>
            </div>
            <nav className="space-y-0.5">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all cursor-pointer"
                >
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {requireAcceptance && (
            <div className="mt-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Para seguir usando omniboxd necesitás aceptar estos términos al final del documento.
              </span>
            </div>
          )}
        </aside>

        {/* Contenido */}
        <div className="lg:col-span-9 space-y-6 min-w-0">

          {/* Header */}
          <div className="border-b border-[var(--border)] pb-4">
            {!requireAcceptance && (
              <button
                type="button"
                onClick={() => onNavigate('feed')}
                className="flat-btn text-xs py-1.5 px-3 mb-3 hover:text-amber-400 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
            )}

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl sm:text-2xl text-[var(--text)] tracking-tight">
                  Términos y condiciones de uso / Política de privacidad
                </h1>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Última actualización: <strong>{TERMS_LAST_UPDATED}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Intro */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm">
            <p className="text-sm text-[var(--text)] leading-relaxed">
              ¡Damos la bienvenida a <strong className="text-amber-400">omniboxd</strong>! Somos una plataforma comunitaria e independiente creada por un equipo de desarrollo y consultoría con foco en transporte público, diseñada para que las personas amantes y usuarias de ómnibus en Uruguay puedan registrar sus viajes, calificar servicios, escribir reseñas y compartir sus experiencias por el rubro.
            </p>
            <p className="text-sm text-[var(--text)] leading-relaxed mt-3">
              Al acceder, crear una cuenta o utilizar nuestro sitio web, aceptás quedar en vinculación por los presentes Términos, Condiciones y Políticas de Privacidad. Si no estás de acuerdo con alguna de estas disposiciones, te solicitamos no utilizar el sitio.
            </p>
          </div>

          {/* Sección 1 */}
          <section id="terms-descripcion" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              1. Descripción del servicio
            </h2>
            <p className="text-sm text-[var(--text)] leading-relaxed">
              omniboxd es una plataforma comunitaria independiente diseñada para que las personas usuarias puedan registrar sus viajes en ómnibus dentro del territorio uruguayo, calificar servicios, compartir reseñas y llevar una bitácora personal de transporte.
            </p>
          </section>

          {/* Sección 2 */}
          <section id="terms-edad" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              2. Requisito de edad mínima
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--text)] ml-1">
              <li>
                <strong>Edad mínima recomendada:</strong> El sitio está destinado a personas de <strong>13 años en adelante (+13)</strong>.
              </li>
              <li>
                Si tenés entre 13 y 17 años, declarás contar con la supervisión y autorización de tus figuras paternales o tutores legales para hacer uso de la plataforma.
              </li>
              <li>
                Las reseñas y comentarios publicados por la comunidad pueden contener opiniones informales, críticas al servicio o lenguaje coloquial. El equipo de omniboxd no promueve la violencia ni el acoso, pero no puede garantizar que todo el contenido sea apto para todo público.
              </li>
            </ul>
          </section>

          {/* Sección 3 */}
          <section id="terms-registro" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              3. Registro de cuenta y seguridad
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--text)] ml-1">
              <li>
                Para interactuar en la comunidad y utilizar ciertas funciones (publicar reseñas —<em>omniposteos</em>—, guardar líneas —<em>frecuentes</em>—, brindar me gusta —<em>chiflidos</em>—, comentarios —<em>charlas de parada</em>—, reposteos —<em>transbordos</em>—, entre otras), deberás registrarte con un correo electrónico (o autenticación de Google) y un nombre de usuario.
              </li>
              <li>
                Adoptamos medidas de seguridad técnicas y organizativas adecuadas para proteger los datos personales contra el acceso no autorizado, alteración, divulgación o destrucción no permitida, dando cumplimiento a los principios de seguridad y confidencialidad (Artículos 10 y 11 de la Ley N° 18.331).
              </li>
              <li>
                Contrario al punto anterior, sos responsable de mantener la seguridad de tu contraseña y de cualquier actividad que ocurra en tu cuenta.
              </li>
              <li>
                Nos reservamos el derecho de suspender o cancelar cuentas que utilicen identidades falsas de manera maliciosa, suplanten a terceros o violen las normas comunitarias.
              </li>
            </ul>
          </section>

          {/* Sección 4 */}
          <section id="terms-ugc" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              4. Contenido generado por los usuarios (UGC)
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--text)] ml-1">
              <li>
                <strong>Propiedad de tus omniposteos:</strong> De conformidad con la Ley N° 9.739 y Ley N° 17.616 de Derechos de Autor de Uruguay, conservás la titularidad de los textos y opiniones que redactás.
              </li>
              <li>
                <strong>Licencia de uso:</strong> Al publicar una reseña o calificación en omniboxd, nos otorgás una licencia gratuita, no exclusiva y ejecutable para mostrar, distribuir, adaptar técnicamente y promocionar dicho contenido dentro del sitio web y en las redes sociales oficiales del proyecto.
              </li>
              <li>
                <strong>Límites a la libertad de expresión:</strong> Se permite la crítica constructiva (experiencia de viaje, puntualidad, higiene, estado de las unidades). Sin embargo, no se permite:
                <ul className="list-disc list-inside ml-5 mt-1.5 space-y-1 text-[var(--text-muted)]">
                  <li>Publicar discursos de odio o acoso dirigido a personas específicas (guardas, conductores o usuarios).</li>
                  <li>Divulgar datos personales confidenciales de terceros sin permiso.</li>
                  <li>Promover actividades ilegales, spam, publicidad no solicitada o información deliberadamente falsa.</li>
                </ul>
              </li>
              <li>
                <strong>Moderación:</strong> Nos reservamos el derecho de ocultar o eliminar contenido que infrinja estas normas o que sea reportado por la comunidad.
              </li>
            </ul>
          </section>

          {/* Sección 5 */}
          <section id="terms-propiedad" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              5. Propiedad intelectual del sitio
            </h2>
            <p className="text-sm text-[var(--text)] leading-relaxed">
              La marca omniboxd, la identidad visual, el logotipo, el código fuente, la arquitectura de la base de datos y la interfaz del sitio web son propiedad exclusiva del equipo desarrollador y consultor de la plataforma. Queda prohibida la reproducción total o parcial del código o elementos gráficos sin autorización previa.
            </p>
          </section>

          {/* Sección 6 */}
          <section id="terms-datos" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-4">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              6. Política de protección de datos personales (Ley N° 18.331)
            </h2>
            <p className="text-sm text-[var(--text)] leading-relaxed">
              En cumplimiento de la Ley N° 18.331 de Protección de Datos Personales y Acción de Habeas Data de la República Oriental del Uruguay, sus decretos reglamentarios y modificativas, se informa el tratamiento que se da a los datos personales recabados en omniboxd.
            </p>

            <div className="space-y-3 pl-3 border-l-2 border-amber-400/30">
              <div>
                <h3 className="text-xs font-bold text-[var(--text)] mb-1">6.a. Consentimiento de la persona titular</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Al registrarte y marcar la casilla de aceptación, otorgás tu consentimiento libre, previo, expreso e informado (Art. 9, Ley N° 18.331) para el tratamiento de tus datos conforme a esta política.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--text)] mb-1">6.b. Responsable del tratamiento</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Las figuras responsables de las bases de datos son el equipo desarrollador del proyecto. Contacto: <a href="mailto:omniboxd@protonmail.com" className="text-amber-400 hover:underline">omniboxd@protonmail.com</a>.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--text)] mb-1">6.c. Datos que recopilamos</h3>
                <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] ml-1">
                  <li><strong>Datos proporcionados voluntariamente:</strong> email / autenticación de Google, nombre de usuario, contraseña (encriptada) e historial de registros de viajes, reseñas, valoraciones y comentarios.</li>
                  <li><strong>Datos de sesión y almacenamiento local:</strong> cookies técnicas y <code>localStorage</code>/<code>sessionStorage</code> para mantener la sesión activa, recordar preferencias de interfaz y garantizar el funcionamiento.</li>
                  <li><strong>Datos técnicos:</strong> tipo de navegador para seguridad y prevención de fraudes.</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--text)] mb-1">6.d. Finalidad y terceros</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-1.5">Los datos son utilizados exclusivamente para:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] ml-1">
                  <li>Crear y gestionar tu cuenta.</li>
                  <li>Permitir la publicación y visualización de bitácoras de viajes y omniposteos.</li>
                  <li>Enviar comunicaciones operativas (restablecimiento de contraseña, actualizaciones relevantes).</li>
                  <li>Garantizar la seguridad e integridad del sitio.</li>
                </ul>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">
                  Los datos se procesan usando proveedores de infraestructura (Netlify, Supabase) que cumplen con estándares internacionales. Al aceptar, prestás consentimiento para el procesamiento técnico en servidores seguros alojados en el exterior.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--text)] mb-1">6.e. Ejercicio de derechos ARCO</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-1.5">Como titular de los datos, tenés derecho a:</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-[var(--text-muted)] ml-1">
                  <li><strong>Acceso:</strong> confirmar qué datos tuyos poseemos y solicitar copia.</li>
                  <li><strong>Rectificación:</strong> solicitar corrección de datos inexactos.</li>
                  <li><strong>Cancelación / Supresión:</strong> solicitar la eliminación de tus datos y tu cuenta (también podés hacerlo desde el botón "Eliminar cuenta" en tu perfil).</li>
                </ul>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">
                  Para ejercer estos derechos, escribí a <a href="mailto:omniboxd@protonmail.com" className="text-amber-400 hover:underline">omniboxd@protonmail.com</a>. Te responderemos en los plazos previstos por la normativa.
                </p>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed mt-1.5">
                  La Unidad Reguladora y de Control de Datos Personales (<strong>URCDP</strong>) es el órgano de control en Uruguay ante el cual podés presentar denuncias.
                </p>
              </div>
            </div>
          </section>

          {/* Sección 7 */}
          <section id="terms-responsabilidad" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              7. Exención de responsabilidad
            </h2>
            <ul className="list-disc list-inside space-y-2 text-sm text-[var(--text)] ml-1">
              <li>
                <strong>Independencia institucional:</strong> omniboxd es un proyecto comunitario independiente y no tiene vinculación oficial, patrocinio ni afiliación con empresas de transporte público, intendencias departamentales, el MTOP ni ningún organismo gubernamental.
              </li>
              <li>
                <strong>Veracidad del contenido:</strong> Las reseñas reflejan la opinión subjetiva de cada usuario. omniboxd no asume responsabilidad por la veracidad de los comentarios publicados por terceros.
              </li>
              <li>
                <strong>Disponibilidad:</strong> El sitio se proporciona "tal cual". Al ser un proyecto independiente, no garantizamos el funcionamiento ininterrumpido ni nos hacemos responsables por pérdidas de datos ocasionadas por fallas ajenas a nuestro control.
              </li>
            </ul>
          </section>

          {/* Sección 8 */}
          <section id="terms-ley" className="scroll-mt-20 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="font-display font-bold text-sm text-amber-400 uppercase tracking-wider">
              8. Ley aplicable y jurisdicción
            </h2>
            <p className="text-sm text-[var(--text)] leading-relaxed">
              Estos Términos y Condiciones, al igual que las Políticas de Privacidad, se rigen por la legislación vigente en la República Oriental del Uruguay. Ante cualquier controversia derivada del uso del sitio, las partes se someten a la jurisdicción de los tribunales de la ciudad de Montevideo, Uruguay.
            </p>
          </section>

          {/* Contacto */}
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--text)]">
              <p className="font-semibold mb-1">¿Dudas sobre estos términos?</p>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                Escribinos a <a href="mailto:omniboxd@protonmail.com" className="text-amber-400 hover:underline">omniboxd@protonmail.com</a> y te respondemos a la brevedad.
              </p>
            </div>
          </div>

          {/* Aceptación (solo si requireAcceptance) */}
          {requireAcceptance && (
            <div className="sticky bottom-4 bg-[var(--surface)] border-2 border-amber-400/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[var(--border)] accent-amber-400 cursor-pointer"
                />
                <span className="text-xs text-[var(--text)] leading-relaxed select-none">
                  He leído y acepto los <strong>Términos y Condiciones</strong> y la <strong>Política de Privacidad</strong> de omniboxd. Confirmo que tengo al menos 13 años y, si tengo entre 13 y 17, cuento con autorización de mis tutores legales.
                </span>
              </label>
              <button
                type="button"
                disabled={!accepted}
                onClick={() => onAccept?.()}
                className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors cursor-pointer"
              >
                Aceptar y continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};