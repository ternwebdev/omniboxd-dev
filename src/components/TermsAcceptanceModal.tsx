import React, { useState } from 'react';
import { Shield, ExternalLink, AlertCircle } from 'lucide-react';
import { TERMS_VERSION, TERMS_LAST_UPDATED, acceptTerms } from '../lib/terms';
import { UserProfile } from '../types';
import { useScrollLock } from '../lib/scrollLock';

interface TermsAcceptanceModalProps {
  currentUser: UserProfile;
  onAccepted: () => void;
  onOpenTerms: () => void;
}

export const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({
  currentUser,
  onAccepted,
  onOpenTerms
}) => {
  const [accepted, setAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Bloquea el scroll del body mientras el modal está abierto
  useScrollLock(true);

  const handleAccept = async () => {
    if (!accepted) return;
    setIsSaving(true);
    const ok = await acceptTerms(currentUser.id);
    setIsSaving(false);
    if (ok) onAccepted();
    else alert('No se pudo guardar la aceptación. Intentá de nuevo.');
  };

  return (
<div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 touch-none">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] bg-gradient-to-br from-amber-400/10 to-transparent">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text)]">
                Actualizamos nuestros términos
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Versión {TERMS_VERSION} · Última actualización: {TERMS_LAST_UPDATED}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-[var(--text)] leading-relaxed">
            Hola <strong>@{currentUser.username}</strong> 👋
          </p>
          <p className="text-sm text-[var(--text)] leading-relaxed">
            Desde omniboxd incorporamos nuestros <strong>Términos y Condiciones de uso</strong> y nuestra <strong>Política de Privacidad</strong>, en cumplimiento con la Ley N° 18.331 de Protección de Datos Personales de Uruguay.
          </p>

          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Para seguir usando omniboxd necesitás aceptar estos términos. Si no estás de acuerdo, podés eliminar tu cuenta desde tu perfil en cualquier momento.
            </span>
          </div>

          <div className="space-y-2 text-xs text-[var(--text-muted)]">
            <p className="font-semibold text-[var(--text)]">Puntos principales:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Edad mínima recomendada: 13 años.</li>
              <li>Tus omniposteos siguen siendo tuyos (Ley N° 9.739 y 17.616).</li>
              <li>Nos otorgás una licencia no exclusiva para mostrarlos en el sitio.</li>
              <li>Tratamos tus datos según la Ley N° 18.331.</li>
              <li>Podés ejercer tus derechos ARCO escribiendo a omniboxd@protonmail.com.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={onOpenTerms}
            className="w-full py-2 rounded-lg border border-[var(--border)] hover:border-amber-400/50 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Leer términos completos</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border)] bg-[var(--surface-2)] space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[var(--border)] accent-amber-400 cursor-pointer"
            />
            <span className="text-xs text-[var(--text)] leading-relaxed select-none">
              He leído y acepto los <strong>Términos y Condiciones</strong> y la <strong>Política de Privacidad</strong> de omniboxd.
            </span>
          </label>

          <button
            type="button"
            disabled={!accepted || isSaving}
            onClick={handleAccept}
            className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Guardando…</span>
              </>
            ) : (
              <span>Aceptar y continuar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};