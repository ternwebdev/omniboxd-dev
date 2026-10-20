/**
 * Versión actual de los Términos y Condiciones + Política de Privacidad.
 * Cambiala cada vez que modifiques el documento legal.
 */
export const TERMS_VERSION = '2026-10-03';

/**
 * Fecha legible de la última actualización.
 */
export const TERMS_LAST_UPDATED = '03/10/2026';

/**
 * Chequea si un usuario aceptó la versión vigente.
 */
export function hasAcceptedCurrentTerms(user: { terms_version?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.terms_version === TERMS_VERSION;
}

/**
 * Guarda la aceptación en Supabase.
 */
import { supabase } from './supabase';

export async function acceptTerms(userId: string): Promise<boolean> {
  try {
    // 1. Obtener la sesión real (fuente de verdad)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[acceptTerms] auth.getUser error:', authError.message);
    }

    if (!authUser) {
      console.error('[acceptTerms] No hay sesión activa');
      return false;
    }

    // 2. Usar el ID autenticado real, no el que viene de la prop
    const effectiveUserId = authUser.id;

    console.log('[acceptTerms] userId prop:', userId, '| authUser.id:', effectiveUserId);

    // 3. Hacer el UPDATE
    const { data, error, status } = await supabase
      .from('users')
      .update({
        terms_accepted_at: new Date().toISOString(),
        terms_version: TERMS_VERSION
      })
      .eq('id', effectiveUserId)
      .select('id, terms_version, terms_accepted_at');

    if (error) {
      console.error('[acceptTerms] Error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status
      });
      return false;
    }

    if (!data || data.length === 0) {
      console.error('[acceptTerms] UPDATE no afectó filas');
      return false;
    }

    console.log('[acceptTerms] OK:', data[0]);
    return true;
  } catch (err: any) {
    console.error('[acceptTerms] Catch:', err);
    return false;
  }
}