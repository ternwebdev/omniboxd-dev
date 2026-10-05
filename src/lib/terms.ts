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
  const { error } = await supabase
    .from('users')
    .update({
      terms_accepted_at: new Date().toISOString(),
      terms_version: TERMS_VERSION
    })
    .eq('id', userId);

  if (error) {
    console.error('Error al aceptar términos:', error.message);
    return false;
  }
  return true;
}