import { UserProfile, BirthDateVisibility, GenderVisibility } from '../types';

/**
 * Interface representing the serializable profile metadata
 * that persists in Supabase public.users (via the user's bio/links field)
 * as well as localStorage cache.
 */
export interface SyncedUserMeta {
  v: number;
  loc?: string | null;
  bdate?: string | null;
  bvis?: BirthDateVisibility | null;
  color?: string | null;
  gender?: string | null;
  gvis?: GenderVisibility | null;
}

const META_PREFIX = '\n\n__META__';

/**
 * Extracts clean user bio (without the hidden metadata payload)
 * and the parsed metadata object from a raw bio string.
 */
export function parseUserBioAndMeta(rawBio?: string | null): {
  cleanBio: string;
  meta: SyncedUserMeta | null;
} {
  if (!rawBio) return { cleanBio: '', meta: null };
  const idx = rawBio.indexOf(META_PREFIX);
  if (idx === -1) {
    return { cleanBio: rawBio.trim(), meta: null };
  }

  const cleanBio = rawBio.slice(0, idx).trim();
  const metaStr = rawBio.slice(idx + META_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(metaStr) as SyncedUserMeta;
    return { cleanBio, meta: parsed };
  } catch (e) {
    return { cleanBio: rawBio.trim(), meta: null };
  }
}

/**
 * Encodes clean bio and metadata into a single string for storage in Supabase users.bio.
 */
export function encodeUserBioWithMeta(
  cleanBio: string,
  meta: SyncedUserMeta
): string {
  const trimmed = cleanBio.trim();
  const hasMeta = meta.loc || meta.bdate || meta.bvis || meta.color || meta.gender || meta.gvis;
  if (!hasMeta) {
    return trimmed;
  }
  return `${trimmed}${META_PREFIX}${JSON.stringify(meta)}`;
}

/**
 * Merges raw UserProfile with parsed remote metadata and local fallback.
 */
export function hydrateProfileMeta(profile: UserProfile): UserProfile {
  const { cleanBio, meta } = parseUserBioAndMeta(profile.bio);

  // Check local cache
  let localExtra: any = {};
  try {
    const extraStr = localStorage.getItem(`omniboxd_profile_extra_${profile.id}`);
    if (extraStr) localExtra = JSON.parse(extraStr);
  } catch (e) {}

  const mergedLocation = profile.location || meta?.loc || localExtra.location || null;
  const mergedBirthDate = profile.birth_date || meta?.bdate || localExtra.birth_date || null;
  const mergedBirthDateVis = profile.birth_date_visibility || meta?.bvis || localExtra.birth_date_visibility || 'full';
  const mergedBannerColor = profile.banner_color || meta?.color || localExtra.banner_color || null;
  const mergedGender = profile.gender_identity || meta?.gender || localExtra.gender_identity || null;
  const mergedGenderVis = profile.gender_identity_visibility || meta?.gvis || localExtra.gender_identity_visibility || 'public';

  return {
    ...profile,
    bio: cleanBio,
    location: mergedLocation,
    birth_date: mergedBirthDate,
    birth_date_visibility: mergedBirthDateVis,
    banner_color: mergedBannerColor,
    gender_identity: mergedGender,
    gender_identity_visibility: mergedGenderVis
  };
}
