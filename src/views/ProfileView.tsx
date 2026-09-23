import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  Share2, 
  Repeat, 
  Edit3, 
  ExternalLink, 
  LogOut, 
  Check,
  Key,
  Camera,
  UserCheck,
  UserPlus,
  Shield,
  Trash2,
  AtSign,
  Upload,
  AlertCircle,
  Users,
  MapPin,
  Cake,
  Palette,
  Bus,
  X
} from 'lucide-react';
import { UserProfile, ReviewItem, BirthDateVisibility, GenderVisibility } from '../types';
import { COMPANY_COLORS } from '../lib/constants';

export const OMNIBOXD_PALETTE_COLORS = [
  { id: 'yellow', name: 'Amarillo Omniboxd', hex: '#F59E0B', textHex: '#000000', border: 'border-amber-400', desc: 'Identidad y logo' },
  { id: 'red', name: 'Rojo Ómnibus', hex: '#E11D48', textHex: '#ffffff', border: 'border-rose-500', desc: 'Expresos y rápidas' },
  { id: 'blue', name: 'Azul Eléctrico', hex: '#2563EB', textHex: '#ffffff', border: 'border-blue-500', desc: 'Troncales e inter' },
  { id: 'green', name: 'Verde Terminal', hex: '#16A34A', textHex: '#ffffff', border: 'border-emerald-500', desc: 'Locales y plazas' },
  { id: 'orange', name: 'Naranja Boleto', hex: '#EA580C', textHex: '#ffffff', border: 'border-orange-500', desc: 'Boleto STM y conexión' },
  { id: 'asphalt', name: 'Asfalto Nocturno', hex: '#1E293B', textHex: '#ffffff', border: 'border-slate-500', desc: 'Pavimento y trasnoche' },
];

const USERNAME_COLORS = OMNIBOXD_PALETTE_COLORS.map((color) => color.hex);

const ProfileAchievementBadge: React.FC<{ slug: string; categoryComplete?: boolean }> = ({ slug, categoryComplete = false }) => {
  const [hasSvg, setHasSvg] = useState(true);
  const label = slug.replaceAll('_', ' ');

  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/30 bg-amber-400/10 ${categoryComplete ? 'category-badge-complete' : ''}`} title={categoryComplete ? `${label} · categoría completa` : label}>
      {hasSvg ? (
        <img src={`/img/achievements/${slug}.svg`} alt={label} className="h-8 w-8 object-contain" onError={() => setHasSvg(false)} />
      ) : (
        <span className="px-1 text-center text-[8px] leading-tight text-[var(--achievement-gold)]">{label}</span>
      )}
    </span>
  );
};
import { supabase, fetchUserReviews, fetchUserReposts } from '../lib/supabase';
import { ReviewCard } from '../components/ReviewCard';
import { updateSeoMetadata } from '../lib/seo';
import { FollowsModal } from '../components/FollowsModal';
import { pushNotification, removeFollowNotification } from '../lib/notifications';
import { formatBirthDate } from '../lib/dateUtils';
import { hydrateProfileMeta, encodeUserBioWithMeta, parseUserBioAndMeta } from '../lib/profileSync';
import { fetchUserAchievements } from '../lib/achievements';
import { getAchievementEntitlements } from '../lib/achievementEntitlements';
import { categories as achievementCategories } from './AchievementsView';

interface ProfileViewProps {
  currentUser: UserProfile | null;
  targetUsername?: string | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenShare: (review: ReviewItem) => void;
  onSignOut: () => void;
  onProfileUpdated: (profile: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  targetUsername,
  onNavigate,
  onOpenShare,
  onSignOut,
  onProfileUpdated
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'omniposts' | 'transbordos'>('omniposts');
  const [userReviews, setUserReviews] = useState<ReviewItem[]>([]);
  const [userReposts, setUserReposts] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [profileAchievementCount, setProfileAchievementCount] = useState(0);
  const [profileAchievementSlugs, setProfileAchievementSlugs] = useState<string[]>([]);
  const [rotatingBadgeIndex, setRotatingBadgeIndex] = useState(0);

  // Settings & Edit states
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [birthDateInput, setBirthDateInput] = useState('');
  const [birthDateVisibilityInput, setBirthDateVisibilityInput] = useState<BirthDateVisibility>('full');
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);
  const [isEditingGender, setIsEditingGender] = useState(false);
  const [genderInput, setGenderInput] = useState('');
  const [genderVisibilityInput, setGenderVisibilityInput] = useState<GenderVisibility>('public');
  const [isSavingGender, setIsSavingGender] = useState(false);
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [linksInput, setLinksInput] = useState<string[]>(['']);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [selectedBannerColor, setSelectedBannerColor] = useState<string>('#1E293B');
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [isEditingUsernameColor, setIsEditingUsernameColor] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);

  // Username change states (7 days restriction)
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Avatar edit states (edit or delete)
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Delete account states
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  // Follows modal states
  const [followsModalOpen, setFollowsModalOpen] = useState(false);
  const [followsModalTab, setFollowsModalTab] = useState<'followers' | 'following'>('followers');

  const handleOpenFollowsModal = (tab: 'followers' | 'following') => {
    if (!isOwnProfile) return;
    setFollowsModalTab(tab);
    setFollowsModalOpen(true);
  };

  const isOwnProfile = !targetUsername || (currentUser && currentUser.username.toLowerCase() === targetUsername.toLowerCase());
  const entitlements = getAchievementEntitlements(profileAchievementCount);
  const maxBioLength = entitlements.maxBioLength;
  const maxLinks = entitlements.maxLinks;
  const avatarBorderClass = entitlements.avatarBorder === 'premium'
    ? 'avatar-border-premium'
    : entitlements.avatarBorder === 'silver'
      ? 'avatar-border-silver'
      : entitlements.avatarBorder === 'bronze'
        ? 'avatar-border-bronze'
        : 'border-[var(--surface)]';
// Cuántas insignias puede mostrar según nivel
const maxVisible = Number.isFinite(entitlements.maxVisibleBadges)
  ? entitlements.maxVisibleBadges
  : profileAchievementSlugs.length;

// Si el usuario tiene selección manual (nivel >= 3.5) y hay pinned_badges,
// mostramos esas. Si no, rotamos aleatoriamente cada 5s.
const useManualSelection = entitlements.level >= 3.5 && (profile.pinned_badges?.length || 0) > 0;

const visibleBadgeSlugs = useManualSelection
  ? Array.from(new Set((profile.pinned_badges || []).slice(0, maxVisible)))
  : profileAchievementSlugs.length > 0
    ? Array.from(new Set(
        Array.from(
          { length: Math.min(maxVisible, profileAchievementSlugs.length) },
          (_, i) => profileAchievementSlugs[(rotatingBadgeIndex + i) % profileAchievementSlugs.length]
        )
      ))
    : [];
// Set con TODOS los slugs que pertenecen a una categoría completa
const completedCategoryAchievementSlugs = new Set(
  achievementCategories
    .filter((category) =>
      category.achievements.every((achievement) => profileAchievementSlugs.includes(achievement.slug))
    )
    .flatMap((category) => category.achievements.map((achievement) => achievement.slug))
);
const [isSelectingBadges, setIsSelectingBadges] = useState(false);
const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

useEffect(() => {
  if (useManualSelection) return;
  if (profileAchievementSlugs.length <= 1) return;
  if (followsModalOpen) return;  // 👈 pausa mientras el modal está abierto
  const timer = window.setInterval(() => {
    setRotatingBadgeIndex((index) => {
      const total = profileAchievementSlugs.length;
      if (total <= 1) return index;
      let next = index;
      while (next === index % total) {
        next = Math.floor(Math.random() * total);
      }
      return next;
    });
  }, 5000);
  return () => window.clearInterval(timer);
}, [profileAchievementSlugs.length, useManualSelection, followsModalOpen]);

  // Load target profile
  useEffect(() => {
    const loadProfileData = async () => {
      setIsLoading(true);
      try {
        let targetProf: UserProfile | null = null;

        const effectiveUsername = targetUsername || currentUser?.username;
        if (effectiveUsername) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .ilike('username', effectiveUsername)
            .maybeSingle();
          if (data) {
            targetProf = data as UserProfile;
          }
        }

        if (!targetProf && isOwnProfile && currentUser) {
          targetProf = currentUser;
        }

        if (targetProf) {
          targetProf = hydrateProfileMeta(targetProf);

          setProfile(targetProf);
          setSelectedBannerColor(targetProf.banner_color || '#1E293B');
          setBioInput(targetProf.bio || '');
          setLocationInput(targetProf.location || '');
          setBirthDateInput(targetProf.birth_date || '');
          setBirthDateVisibilityInput(targetProf.birth_date_visibility || 'full');
          setGenderInput(targetProf.gender_identity || '');
          setGenderVisibilityInput(targetProf.gender_identity_visibility || 'public');
          setLinksInput(targetProf.links?.length ? targetProf.links : ['']);

          const achievementItems = await fetchUserAchievements(targetProf.id);
          const achievementSlugs = [...new Set(achievementItems.map((item) => item.achievement_slug))];
          setProfileAchievementSlugs(achievementSlugs);
          setSelectedBadges(targetProf.pinned_badges || []);
          setProfileAchievementCount(achievementSlugs.length);

          // Parallel fetch: reviews, reposts, followers
          const [revs, reps, followersRes, followingRes] = await Promise.all([
            fetchUserReviews(targetProf.id, currentUser?.id),
            fetchUserReposts(targetProf.id, currentUser?.id),
            supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', targetProf.id),
            supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', targetProf.id)
          ]);

          setUserReviews(revs);
          setUserReposts(reps);
          setFollowersCount(followersRes.count || 0);
          setFollowingCount(followingRes.count || 0);

          // Check if current user is following target
          if (currentUser && !isOwnProfile) {
            const { data: followRow } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', currentUser.id)
              .eq('following_id', targetProf.id)
              .maybeSingle();
            setIsFollowing(!!followRow);
          }
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [currentUser, targetUsername, isOwnProfile]);

  // Update dynamic social preview metadata when profile loads
  useEffect(() => {
    if (profile) {
      updateSeoMetadata({
        title: `@${profile.username} en omniboxd`,
        description: profile.bio || `Perfil de viajero de @${profile.username} en omniboxd: reseñas de ómnibus uruguayos, líneas favoritas y actividad.`,
        image: profile.avatar_url || null,
        url: window.location.href
      });
    }
  }, [profile]);

  const isVideoAvatar = (url?: string | null) => {
    if (!url) return false;
    return url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(url);
  };

  // Handle follow / unfollow
  const handleToggleFollow = async () => {
    if (!currentUser || !profile) {
      onNavigate('auth');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        await removeFollowNotification(profile.id, currentUser.username);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: profile.id });
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);

        // Check if target user was already following currentUser
        const { data: targetFollowsMe } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', profile.id)
          .eq('following_id', currentUser.id)
          .maybeSingle();

        const isFollowBack = !!targetFollowsMe;
        await pushNotification({
          user_id: profile.id,
          kind: isFollowBack ? 'follow_back' : 'follow',
          body: isFollowBack
            ? `@${currentUser.username} te devolvió el follow`
            : `@${currentUser.username} te empezó a seguir`
        });
      }
    } catch (e) {
      console.warn('Follow error:', e);
    }
  };
const handleSavePinnedBadges = async (badges: string[]) => {
  if (!profile) return;
  const cleanBadges = badges.slice(0, maxVisible);
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ pinned_badges: cleanBadges })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (error) throw error;
    const updated = hydrateProfileMeta(data);
    setProfile(updated);
    onProfileUpdated(updated);
    setSelectedBadges(cleanBadges);
  } catch (e: any) {
    alert(e.message || 'No se pudo guardar la selección de insignias');
  }
};
  // Save bio with the character limit unlocked by the user's level.
  const handleSaveBio = async () => {
    if (!profile) return;
    try {
      const cleanBio = bioInput.trim().slice(0, maxBioLength);
      const encodedBio = encodeUserBioWithMeta(cleanBio, {
        v: 1,
        loc: profile.location,
        bdate: profile.birth_date,
        bvis: profile.birth_date_visibility,
        color: profile.banner_color,
        gender: profile.gender_identity,
        gvis: profile.gender_identity_visibility
      });

      const { data, error } = await supabase
        .from('users')
        .update({ bio: encodedBio || null })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;
      const hydrated = hydrateProfileMeta(data);
      setProfile(hydrated);
      onProfileUpdated(hydrated);
      setIsEditingBio(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar bio');
    }
  };

  // Save banner color
  const handleSaveBannerColor = async (colorHex: string) => {
    if (!profile) return;
    setIsSavingBanner(true);
    try {
      let updatedProfile: UserProfile = { ...profile, banner_color: colorHex };

      // Update dedicated column if supported
      try {
        await supabase
          .from('users')
          .update({ banner_color: colorHex })
          .eq('id', profile.id);
      } catch (e) {}

      // Always guarantee sync via users.bio so other accounts & browsers see it
      try {
        const encodedBio = encodeUserBioWithMeta(profile.bio || '', {
          v: 1,
          loc: profile.location,
          bdate: profile.birth_date,
          bvis: profile.birth_date_visibility,
          color: colorHex,
          gender: profile.gender_identity,
          gvis: profile.gender_identity_visibility
        });
        await supabase
          .from('users')
          .update({ bio: encodedBio || null })
          .eq('id', profile.id);
      } catch (e) {}

      try {
        await supabase.auth.updateUser({
          data: { banner_color: colorHex }
        });
      } catch (e) {}

      try {
        const storageKey = `omniboxd_profile_extra_${profile.id}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({
          ...existing,
          banner_color: colorHex
        }));
      } catch (e) {}

      setProfile(updatedProfile);
      setSelectedBannerColor(colorHex);
      onProfileUpdated(updatedProfile);
      setIsEditingBanner(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar color de portada');
    } finally {
      setIsSavingBanner(false);
    }
  };

  const handleSaveUsernameColor = async (color: string | null) => {
    if (!profile || profileAchievementCount < 7) return;
    const { data, error } = await supabase
      .from('users')
      .update({ username_color: color })
      .eq('id', profile.id)
      .select('*')
      .single();
    if (error) {
      alert(error.message || 'No se pudo guardar el color del username');
      return;
    }
    const updatedProfile = hydrateProfileMeta(data);
    setProfile(updatedProfile);
    onProfileUpdated(updatedProfile);
    setIsEditingUsernameColor(false);
  };

  // Save location
  const handleSaveLocation = async () => {
    if (!profile) return;
    setIsSavingLocation(true);
    const cleanLoc = locationInput.trim().slice(0, 100);
    try {
      let updatedProfile: UserProfile = { ...profile, location: cleanLoc || null };

      // Update dedicated column if supported
      try {
        await supabase
          .from('users')
          .update({ location: cleanLoc || null })
          .eq('id', profile.id);
      } catch (e) {}

      // Always guarantee sync via users.bio so other accounts & browsers see it
      try {
        const encodedBio = encodeUserBioWithMeta(profile.bio || '', {
          v: 1,
          loc: cleanLoc || null,
          bdate: profile.birth_date,
          bvis: profile.birth_date_visibility,
          color: profile.banner_color,
          gender: profile.gender_identity,
          gvis: profile.gender_identity_visibility
        });
        await supabase
          .from('users')
          .update({ bio: encodedBio || null })
          .eq('id', profile.id);
      } catch (e) {}

      try {
        await supabase.auth.updateUser({
          data: { location: cleanLoc || null }
        });
      } catch (e) {}

      try {
        const storageKey = `omniboxd_profile_extra_${profile.id}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({ ...existing, location: cleanLoc || null }));
      } catch (e) {}

      setProfile(updatedProfile);
      onProfileUpdated(updatedProfile);
      setIsEditingLocation(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar ubicación');
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Save birth date
  const handleSaveBirthDate = async () => {
    if (!profile) return;
    setIsSavingBirthDate(true);
    const cleanDate = birthDateInput ? birthDateInput.trim() : null;
    const cleanVis: BirthDateVisibility = cleanDate ? birthDateVisibilityInput : 'none';

    try {
      let updatedProfile: UserProfile = {
        ...profile,
        birth_date: cleanDate,
        birth_date_visibility: cleanVis
      };

      // Update dedicated column if supported
      try {
        await supabase
          .from('users')
          .update({
            birth_date: cleanDate,
            birth_date_visibility: cleanVis
          })
          .eq('id', profile.id);
      } catch (e) {}

      // Always guarantee sync via users.bio so other accounts & browsers see it
      try {
        const encodedBio = encodeUserBioWithMeta(profile.bio || '', {
          v: 1,
          loc: profile.location,
          bdate: cleanDate,
          bvis: cleanVis,
          color: profile.banner_color,
          gender: profile.gender_identity,
          gvis: profile.gender_identity_visibility
        });
        await supabase
          .from('users')
          .update({ bio: encodedBio || null })
          .eq('id', profile.id);
      } catch (e) {}

      try {
        await supabase.auth.updateUser({
          data: {
            birth_date: cleanDate,
            birth_date_visibility: cleanVis
          }
        });
      } catch (e) {}

      try {
        const storageKey = `omniboxd_profile_extra_${profile.id}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({
          ...existing,
          birth_date: cleanDate,
          birth_date_visibility: cleanVis
        }));
      } catch (e) {}

      setProfile(updatedProfile);
      onProfileUpdated(updatedProfile);
      setIsEditingBirthDate(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar fecha de nacimiento');
    } finally {
      setIsSavingBirthDate(false);
    }
  };

  // Save gender identity (optional, max 50 chars, public/private visibility)
  const handleSaveGender = async () => {
    if (!profile) return;
    setIsSavingGender(true);
    const cleanGender = genderInput ? genderInput.trim().slice(0, 50) : null;
    const cleanVis: GenderVisibility = cleanGender ? genderVisibilityInput : 'public';

    try {
      let updatedProfile: UserProfile = {
        ...profile,
        gender_identity: cleanGender,
        gender_identity_visibility: cleanVis
      };

      try {
        await supabase
          .from('users')
          .update({
            gender_identity: cleanGender,
            gender_identity_visibility: cleanVis
          })
          .eq('id', profile.id);
      } catch (e) {}

      try {
        const encodedBio = encodeUserBioWithMeta(profile.bio || '', {
          v: 1,
          loc: profile.location,
          bdate: profile.birth_date,
          bvis: profile.birth_date_visibility,
          color: profile.banner_color,
          gender: cleanGender,
          gvis: cleanVis
        });
        await supabase
          .from('users')
          .update({ bio: encodedBio || null })
          .eq('id', profile.id);
      } catch (e) {}

      try {
        await supabase.auth.updateUser({
          data: {
            gender_identity: cleanGender,
            gender_identity_visibility: cleanVis
          }
        });
      } catch (e) {}

      try {
        const storageKey = `omniboxd_profile_extra_${profile.id}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({
          ...existing,
          gender_identity: cleanGender,
          gender_identity_visibility: cleanVis
        }));
      } catch (e) {}

      setProfile(updatedProfile);
      onProfileUpdated(updatedProfile);
      setIsEditingGender(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar identidad de género');
    } finally {
      setIsSavingGender(false);
    }
  };

  // Save the links unlocked by the user's level.
  const handleSaveLinks = async () => {
    if (!profile) return;
    const cleanLinks = linksInput
      .slice(0, maxLinks)
      .map((link) => link.trim())
      .filter(Boolean)
      .map((link) => /^https?:\/\//i.test(link) ? link : `https://${link}`);

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ links: cleanLinks.length > 0 ? cleanLinks : null })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;
      setProfile(data);
      onProfileUpdated(data);
      setIsEditingLinks(false);
    } catch (e: any) {
      alert(e.message || 'Error al guardar enlace');
    }
  };

  // Check 7-day username change restriction
  const getDaysUntilUsernameChange = () => {
    if (!profile?.username_changed_at) return 0;
    const lastChange = new Date(profile.username_changed_at).getTime();
    if (isNaN(lastChange)) return 0;
    const diffMs = Date.now() - lastChange;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (diffMs >= sevenDaysMs) return 0;
    return Math.ceil((sevenDaysMs - diffMs) / (24 * 60 * 60 * 1000));
  };

  // Change username
  const handleSaveUsername = async () => {
    if (!profile) return;
    const daysLeft = getDaysUntilUsernameChange();
    if (daysLeft > 0) {
      setUsernameError(`Solo podés cambiar tu nombre de usuario cada 7 días. Podrás cambiarlo nuevamente en ${daysLeft} día(s).`);
      return;
    }

    const clean = newUsernameInput.trim().toLowerCase().replace(/^@/, '');
    if (clean.length < 4 || clean.length > 32) {
      setUsernameError('El nombre de usuario debe tener entre 4 y 32 caracteres.');
      return;
    }

    if (clean === profile.username.toLowerCase()) {
      setUsernameError('El nuevo nombre de usuario es idéntico al actual.');
      return;
    }

    setIsSavingUsername(true);
    setUsernameError(null);
    setUsernameSuccess(null);

    try {
      // Check availability in users table
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', clean)
        .neq('id', profile.id)
        .maybeSingle();

      if (existing) {
        throw new Error('Ese nombre de usuario ya está registrado por otra persona. Probá con otro.');
      }

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('users')
        .update({
          username: clean,
          username_changed_at: now
        })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;

      try {
        await supabase.auth.updateUser({ data: { username: clean } });
      } catch {}

      setProfile(data);
      onProfileUpdated(data);
      setUsernameSuccess(`¡Nombre de usuario actualizado con éxito a @${clean}!`);
      setTimeout(() => {
        setIsChangingUsername(false);
        setUsernameSuccess(null);
      }, 1500);
    } catch (err: any) {
      setUsernameError(err.message || 'Error al cambiar nombre de usuario');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Save or remove avatar URL
  const handleSaveAvatarUrl = async (url: string | null) => {
    if (!profile) return;
    setIsSavingAvatar(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: url })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;

      try {
        await supabase.auth.updateUser({ data: { avatar_url: url } });
      } catch {}

      setProfile(data);
      onProfileUpdated(data);
      setIsEditingAvatar(false);
      setAvatarUrlInput('');
    } catch (err: any) {
      alert(err.message || 'Error al actualizar foto de perfil');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  // Delete avatar
  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url) return;
    const confirmDelete = window.confirm('¿Seguro que querés eliminar tu foto de perfil?');
    if (!confirmDelete) return;
    await handleSaveAvatarUrl(null);
  };

  const handleCoverMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !entitlements.canUseCoverMedia) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no puede pesar más de 15MB.');
      return;
    }
    if (file.type.startsWith('video/')) {
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
        video.onerror = () => { URL.revokeObjectURL(url); resolve(Infinity); };
        video.src = url;
      });
      if (duration > 5.5) {
        alert('El video de portada debe durar hasta 5 segundos.');
        return;
      }
    }
    const extension = file.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg');
    const objectPath = `${profile.id}/cover-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(objectPath, file, { upsert: true });
    if (uploadError) {
      alert(uploadError.message || 'No se pudo subir la portada.');
      return;
    }
    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(objectPath);
    const { data, error } = await supabase.from('users').update({ profile_cover_url: publicData.publicUrl }).eq('id', profile.id).select('*').single();
    if (error) {
      alert(error.message || 'No se pudo guardar la portada.');
      return;
    }
    const updatedProfile = hydrateProfileMeta(data);
    setProfile(updatedProfile);
    onProfileUpdated(updatedProfile);
    e.target.value = '';
  };

  // Upload avatar file (supports image, GIF, or short video up to 5 seconds)
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.type.startsWith('video/') && !entitlements.canUseProfileVideo) {
      alert('Desbloqueá el nivel 2 para usar un video o GIF animado de perfil.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('El archivo no puede pesar más de 15MB.');
      return;
    }

    // If video, check duration does not exceed 5 seconds
    if (file.type.startsWith('video/')) {
      try {
        await new Promise<void>((resolve, reject) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          const objUrl = URL.createObjectURL(file);
          video.src = objUrl;
          video.onloadedmetadata = () => {
            URL.revokeObjectURL(objUrl);
            if (video.duration > 5.5) {
              reject(new Error('El video para foto de perfil debe durar hasta 5 segundos.'));
            } else {
              resolve();
            }
          };
          video.onerror = () => {
            URL.revokeObjectURL(objUrl);
            resolve();
          };
        });
      } catch (err: any) {
        alert(err.message || 'El video para foto de perfil debe durar hasta 5 segundos.');
        return;
      }
    }

    setIsSavingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop() || (file.type.startsWith('video') ? 'mp4' : 'png');
      const filePath = `avatar-${profile.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback to data URL if storage bucket is not configured
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          await handleSaveAvatarUrl(dataUrl);
        };
        reader.readAsDataURL(file);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await handleSaveAvatarUrl(publicUrl);
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo');
      setIsSavingAvatar(false);
    }
  };

  // Change password
  const handleSavePassword = async () => {
    if (!newPass || newPass.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      alert('Contraseña actualizada con éxito.');
      setNewPass('');
      setIsChangingPass(false);
    } catch (e: any) {
      alert(e.message || 'No se pudo actualizar la clave');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!profile) return;
    const input = deleteConfirmText.trim();
    const isWordMatch = input.toLowerCase() === 'borrar' || input.toLowerCase() === 'delete';

    if (!isWordMatch && input.length < 4) {
      setDeleteAccountError('Para confirmar, escribí "borrar" o tu contraseña.');
      return;
    }

    setIsProcessingDelete(true);
    setDeleteAccountError(null);

    try {
      // If user typed their password instead of the word, verify credentials
      if (!isWordMatch && currentUser?.email) {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: currentUser.email,
          password: input
        });
        if (authErr) {
          throw new Error('Contraseña incorrecta. Podés escribir "borrar" para confirmar.');
        }
      }

      // 1. Clear local notifications and dismissed notifications cache
      try {
        localStorage.removeItem(`omniboxd_notifications_${profile.id}`);
        localStorage.removeItem(`omniboxd_dismissed_notifs_${profile.id}`);
      } catch {}

      // 2. Anonymize/delete profile record in public users table
      try {
        const { error: delErr } = await supabase.from('users').delete().eq('id', profile.id);
        if (delErr) {
          // If RLS prevents row deletion, anonymize it
          await supabase.from('users').update({
            username: `usuario_${profile.id.slice(0, 6)}`,
            bio: 'Esta cuenta ha sido eliminada por el usuario.',
            avatar_url: null
          }).eq('id', profile.id);
        }
      } catch {}

      // 3. Sign out session & clean up
      await supabase.auth.signOut();
      setIsDeletingAccount(false);
      onSignOut();
      onNavigate('feed');
    } catch (err: any) {
      setDeleteAccountError(err.message || 'Error al eliminar la cuenta. Intentá nuevamente.');
    } finally {
      setIsProcessingDelete(false);
    }
  };

  // Copy profile link
  const handleCopyProfileLink = async () => {
    if (!profile) return;
    const url = `${window.location.origin}?u=${profile.username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedProfileLink(true);
      setTimeout(() => setCopiedProfileLink(false), 2500);
    } catch (e) {
      prompt('Copiá tu link de perfil:', url);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center text-xs text-[var(--text-muted)]">
        Cargando perfil…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-sm font-semibold text-[var(--text)]">Usuario no encontrado</p>
        <button
          onClick={() => onNavigate('feed')}
          className="flat-btn text-xs py-1.5 px-3 hover:text-amber-400"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  // Calculate top rated lines (Aprobados) and worst (Cancelados)
  const lineScores: Record<string, { total: number; count: number; number: string; companyName?: string; companyColor?: string }> = {};
  userReviews.forEach((r) => {
    const num = r.lines?.number || '—';
    if (!lineScores[num]) {
      lineScores[num] = {
        total: 0,
        count: 0,
        number: num,
        companyName: r.lines?.companies?.short_name,
        companyColor: r.lines?.companies?.color || (r.lines?.companies?.short_name ? COMPANY_COLORS[r.lines.companies.short_name] : undefined)
      };
    }
    lineScores[num].total += r.rating;
    lineScores[num].count += 1;
  });

  const rankedLines = Object.values(lineScores).map((s) => ({
    number: s.number,
    avg: s.total / s.count,
    count: s.count,
    companyName: s.companyName,
    companyColor: s.companyColor
  }));

  // Aprobados: Lines with average rating >= 3.0 (top 3 highest)
  const bestLines = rankedLines
    .filter((l) => l.avg >= 3.0)
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 3);

  // Cancelados: Lines with average rating < 3.0 (top 3 lowest)
  const worstLines = rankedLines
    .filter((l) => l.avg < 3.0)
    .sort((a, b) => a.avg - b.avg || b.count - a.count)
    .slice(0, 3);

  const averageUserRating = userReviews.length > 0
    ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop): Profile Hero Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-18">
          {/* Profile Hero Card with 16:9 Cover Banner */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm text-center relative overflow-visible">
            {/* 16:9 Cover Banner */}
            <div
              className="w-full aspect-video relative rounded-t-2xl transition-colors duration-300 flex flex-col justify-between p-3 sm:p-4"
              style={{
                backgroundColor: profile.banner_color || '#1E293B',
                backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 60%), linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)`
              }}
            >
              {profile.profile_cover_url && (
                profile.profile_cover_url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(profile.profile_cover_url)
                  ? <video src={profile.profile_cover_url} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full rounded-t-2xl object-cover" />
                  : <img src={profile.profile_cover_url} alt="" className="absolute inset-0 h-full w-full rounded-t-2xl object-cover" />
              )}
              {profile.profile_cover_url && <div className="absolute inset-0 rounded-t-2xl bg-black/25" />}
              {/* Overflow container for bus vector background to stay within banner curves */}
              <div className="absolute inset-0 rounded-t-2xl overflow-hidden pointer-events-none">
                {/* Subtle transit route accent with bus silhouette */}
                <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                  <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
                    {/* Route lines */}
                    <path d="M 0 150 Q 140 70 400 115" stroke="#fff" strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
                    <path d="M 0 175 Q 210 110 400 185" stroke="#fff" strokeWidth="1.5" fill="none" />
                    <circle cx="295" cy="98" r="18" stroke="#fff" strokeWidth="2" fill="none" />
                    <circle cx="295" cy="98" r="4" fill="#fff" />
                    
                    {/* Vector Omnibus on route */}
                    <g transform="translate(160, 68) scale(1.1)">
                      {/* Bus chassis */}
                      <rect x="0" y="0" width="70" height="34" rx="6" fill="#ffffff" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1.8" />
                      {/* Roof AC / Hatch */}
                      <rect x="22" y="-4" width="26" height="4" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      {/* Route Destination Display */}
                      <rect x="5" y="4" width="22" height="5" rx="1" fill="#ffffff" fillOpacity="0.4" />
                      {/* Windshield */}
                      <rect x="5" y="11" width="14" height="11" rx="2" fill="#ffffff" fillOpacity="0.45" />
                      {/* Passenger Windows */}
                      <rect x="23" y="11" width="11" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <rect x="37" y="11" width="11" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <rect x="51" y="11" width="12" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      {/* Headlight */}
                      <circle cx="4" cy="25" r="2" fill="#ffffff" fillOpacity="0.8" />
                      {/* Wheels */}
                      <circle cx="16" cy="34" r="6.5" fill="#111827" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx="16" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.6" />
                      <circle cx="52" cy="34" r="6.5" fill="#111827" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx="52" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.6" />
                    </g>
                  </svg>
                </div>
              </div>

          {/* Top banner bar: settings button */}
          <div className="relative z-30 flex items-center justify-end w-full">
            {/* Settings gear menu (if own profile) */}
            {isOwnProfile && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white hover:text-amber-400 hover:border-amber-400/50 transition-all cursor-pointer shadow-lg hover:scale-105"
                  title="Configuración de cuenta"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {settingsOpen && (
                  <>
                    {/* Backdrop to close settings menu on click outside */}
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setSettingsOpen(false)}
                    />
                    
                    <div className="absolute right-0 mt-2 w-64 max-h-[75vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-2 z-[100] text-left text-xs animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/20">
                      <div className="px-2.5 py-1.5 border-b border-[var(--border)] mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Ajustes de perfil
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBannerColor(profile.banner_color || '#1E293B');
                          setIsEditingBanner(true);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Color de portada</span>
                      </button>
                      {entitlements.canUseCoverMedia && (
                        <button
                          onClick={() => { coverFileInputRef.current?.click(); setSettingsOpen(false); }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Upload className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span>Subir foto o video de portada</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setNewUsernameInput(profile.username);
                          setUsernameError(null);
                          setUsernameSuccess(null);
                          setIsChangingUsername(true);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <AtSign className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Modificar nombre de usuario</span>
                      </button>
                      {entitlements.level >= 2 && (
                        <button
                          onClick={() => { setIsEditingUsernameColor(true); setSettingsOpen(false); }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Palette className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                          <span>Color del username</span>
                        </button>
                      )}
                      <div className="my-1 border-t border-[var(--border-soft)]" />
                      <button
                        onClick={() => { setIsEditingBio(true); setSettingsOpen(false); }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Editar bio</span>
                      </button>
                      <button
                        onClick={() => {
                          setLocationInput(profile.location || '');
                          setIsEditingLocation(true);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Editar ubicación</span>
                      </button>
                      <button
                        onClick={() => {
                          setBirthDateInput(profile.birth_date || '');
                          setBirthDateVisibilityInput(profile.birth_date_visibility || 'full');
                          setIsEditingBirthDate(true);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Cake className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                        <span>Editar fecha de nacimiento</span>
                      </button>
                      <button
                        onClick={() => {
                          setGenderInput(profile.gender_identity || '');
                          setGenderVisibilityInput(profile.gender_identity_visibility || 'public');
                          setIsEditingGender(true);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Editar identidad de género</span>
                      </button>
                      <button
                        onClick={() => { setIsEditingLinks(true); setSettingsOpen(false); }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>Editar enlace</span>
                      </button>
                      <button
                        onClick={() => { setIsChangingPass(true); setSettingsOpen(false); }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Establecer / cambiar contraseña</span>
                      </button>
                      {profile.is_admin && (
                        <button
                          onClick={() => { onNavigate('admin'); setSettingsOpen(false); }}
                          className="w-full px-3 py-2 rounded-lg hover:bg-amber-400/10 text-amber-400 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Shield className="w-3.5 h-3.5 shrink-0" />
                          <span>Panel de administración</span>
                        </button>
                      )}
                      <div className="my-1 border-t border-[var(--border)]" />
                      <button
                        onClick={() => { onSignOut(); setSettingsOpen(false); }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text)] flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span>Cerrar sesión</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsDeletingAccount(true);
                          setDeleteConfirmText('');
                          setDeleteAccountError(null);
                          setSettingsOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 flex items-center gap-2 cursor-pointer transition-colors font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Eliminar cuenta</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Bottom banner bar: quick "Color de portada" button */}
          {isOwnProfile && (
            <div className="relative z-10 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedBannerColor(profile.banner_color || '#1E293B');
                  setIsEditingBanner(true);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/25 text-white font-medium text-[11px] flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                title="Cambiar color de portada"
              >
                <Palette className="w-3.5 h-3.5 text-amber-300" />
                <span>Color de portada</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Content Body (Avatar overlapping the 16:9 banner) */}
        <div className="px-4 sm:px-5 pb-5 pt-0 relative">
          {/* Hidden file input for avatar upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept={entitlements.canUseProfileVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'}
            className="hidden"
            onChange={handleAvatarFileUpload}
          />
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleCoverMediaUpload}
          />

          {/* Avatar (overlapping the 16:9 banner) */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 mx-auto -mt-10 sm:-mt-11 mb-2.5 group">
            {profile.avatar_url ? (
              isVideoAvatar(profile.avatar_url) ? (
                <video
                  src={profile.avatar_url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border-4 shadow-xl ${avatarBorderClass}`}
                />
              ) : (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border-4 shadow-xl ${avatarBorderClass}`}
                />
              )
            ) : (
              <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-amber-400/20 border-4 text-amber-400 font-display font-bold text-2xl flex items-center justify-center shadow-xl ${avatarBorderClass}`}>
                {profile.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Quick action button to edit photo if own profile */}
            {isOwnProfile && (
              <button
                onClick={() => setIsEditingAvatar(!isEditingAvatar)}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-400 hover:bg-amber-300 text-black flex items-center justify-center shadow-lg border-2 border-[var(--surface)] cursor-pointer transition-transform hover:scale-110"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        {/* Username */}
        <h2 className={`font-display font-bold text-lg text-[var(--text)] ${entitlements.level >= 5 ? 'username-legend' : ''}`} style={entitlements.level >= 5 ? undefined : profile.username_color ? { color: profile.username_color } : undefined}>
          @{profile.username}
          {profile.profile_flair && <span className={`profile-flair profile-flair-${profile.profile_flair.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ó/g, 'o')} ml-1.5`}>{profile.profile_flair}</span>}
        </h2>

{entitlements.maxVisibleBadges > 0 && profileAchievementSlugs.length > 0 && (
  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
    {visibleBadgeSlugs.map((slug, idx) => (
      <ProfileAchievementBadge
        key={`${slug}-${idx}`}
        slug={slug}
        categoryComplete={completedCategoryAchievementSlugs.has(slug)}
      />
    ))}
  </div>
)}

{isOwnProfile && entitlements.level >= 3.5 && profileAchievementSlugs.length > 0 && (
  <div className="mt-2">
    <button
      type="button"
      onClick={() => {
        setIsSelectingBadges((v) => !v);
        setSelectedBadges(profile.pinned_badges || []);
      }}
      className="text-[11px] text-[var(--text-muted)] hover:text-amber-400 underline decoration-dotted transition-colors"
    >
      {isSelectingBadges ? 'Cerrar selector' : 'Elegir insignias visibles'}
    </button>

    {isSelectingBadges && (
      <div className="mt-3 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-md mx-auto space-y-2.5 text-left">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Elegí hasta {maxVisible} insignia{maxVisible === 1 ? '' : 's'}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-dim)]">
            {selectedBadges.length}/{maxVisible}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
          {profileAchievementSlugs.map((slug, idx) => {
            const isSelected = selectedBadges.includes(slug);
            const isComplete = completedCategoryAchievementSlugs.has(slug);
            return (
              <button
                key={`${slug}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedBadges((prev) => {
                    if (prev.includes(slug)) return prev.filter((s) => s !== slug);
                    if (prev.length >= maxVisible) return prev;
                    return [...prev, slug];
                  });
                }}
                className={`relative h-10 w-10 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/15 ring-2 ring-amber-400/30'
                    : 'border-[var(--border)] bg-[var(--surface)] hover:border-amber-400/50'
                } ${isComplete ? 'category-badge-complete' : ''}`}
                title={slug.replaceAll('_', ' ')}
              >
                <img
                  src={`/img/achievements/${slug}.svg`}
                  alt={slug}
                  className="h-7 w-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {isSelected && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => {
              setSelectedBadges([]);
              handleSavePinnedBadges([]);
              setIsSelectingBadges(false);
            }}
            className="text-[11px] text-[var(--text-muted)] hover:text-amber-400 underline decoration-dotted"
          >
            Volver a rotación aleatoria
          </button>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setIsSelectingBadges(false)}
              className="flat-btn text-[11px] py-1 px-2.5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                handleSavePinnedBadges(selectedBadges);
                setIsSelectingBadges(false);
              }}
              disabled={selectedBadges.length === 0}
              className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400 disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}


        {/* Username Change Editor (7 days limitation) */}
        {isChangingUsername && (
          <div className="my-3 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-2.5">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Modificar nombre de usuario
                </label>
                <span className="text-[10px] text-[var(--text-dim)] font-mono">1 cambio cada 7 días</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Por seguridad y consistencia en tus menciones, solo podés realizar un cambio de usuario cada 7 días.
              </p>
            </div>

            {getDaysUntilUsernameChange() > 0 ? (
              <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Cambiaste tu nombre recientemente. Podrás realizar otro cambio en <strong>{getDaysUntilUsernameChange()} día(s)</strong>.
                </span>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-dim)] font-bold">@</span>
                <input
                  type="text"
                  value={newUsernameInput}
                  onChange={(e) => setNewUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                  placeholder="nuevo_usuario"
                  maxLength={32}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-[var(--text)] font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}

            {usernameError && (
              <p className="text-[11px] text-red-400 font-medium">{usernameError}</p>
            )}

            {usernameSuccess && (
              <p className="text-[11px] text-emerald-400 font-medium">{usernameSuccess}</p>
            )}

            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setIsChangingUsername(false)}
                className="flat-btn text-[11px] py-1 px-2.5"
              >
                Cerrar
              </button>
              {getDaysUntilUsernameChange() === 0 && (
                <button
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername || !newUsernameInput.trim()}
                  className="flat-btn text-[11px] py-1 px-2.5 bg-amber-400 text-black font-semibold border-amber-300 disabled:opacity-50"
                >
                  {isSavingUsername ? 'Guardando…' : 'Guardar usuario'}
                </button>
              )}
            </div>
          </div>
        )}

        {isEditingUsernameColor && (
          <div className="my-3 mx-auto max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Color del username</span>
              <button type="button" onClick={() => setIsEditingUsernameColor(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)]">Cerrar</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {USERNAME_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => handleSaveUsernameColor(color)} className="h-8 rounded-lg border-2 border-white/20 hover:scale-105 transition-transform" style={{ backgroundColor: color }} aria-label={`Elegir color ${color}`} />
              ))}
            </div>
            <button type="button" onClick={() => handleSaveUsernameColor(null)} className="flat-btn text-[11px]">Usar color del tema</button>
          </div>
        )}

        {/* Avatar Editor (Direct file upload, no URL input needed) */}
        {isEditingAvatar && (
          <div className="my-3 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Foto de perfil
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAvatar(false)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Cargá una imagen, un GIF o un video corto de hasta 5 segundos para tu foto de perfil.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSavingAvatar}
                className="w-full py-2.5 px-3 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isSavingAvatar ? 'Cargando archivo…' : 'Examinar archivo (imagen, GIF o video)'}</span>
              </button>

              {profile.avatar_url && (
                <button
                  type="button"
                  onClick={handleDeleteAvatar}
                  disabled={isSavingAvatar}
                  className="w-full py-2 px-3 rounded-lg border border-red-500/25 text-red-400 hover:bg-red-500/10 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar foto de perfil</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && !isEditingBio && (
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1 leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        {/* Bio Editor */}
        {isEditingBio && (
          <div className="my-3 space-y-2 max-w-sm mx-auto text-left">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Bio de tu perfil
              </label>
              <span
                className={`text-[10px] font-mono font-bold ${
                  bioInput.length >= 140 ? 'text-amber-400' : 'text-[var(--text-dim)]'
                }`}
              >
                {bioInput.length} / {maxBioLength}
              </span>
            </div>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Contá tu experiencia viajando en bondi…"
              maxLength={maxBioLength}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingBio(false)}
                className="flat-btn text-[11px] py-1 px-2.5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBio}
                className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Social Links */}
        {profile.links && profile.links.length > 0 && !isEditingLinks && (
          <div className="flex flex-wrap items-center justify-center gap-2 my-2.5">
            {profile.links.slice(0, maxLinks).map((link) => {
              let hostname = link;
              try {
                hostname = new URL(link).hostname.replace('www.', '');
              } catch (e) {}
              return (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flat-btn text-[11px] py-0.5 px-2.5 text-amber-400 hover:underline inline-flex items-center gap-1.5 group"
                >
                  <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  <span>{hostname}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Links Editor */}
        {isEditingLinks && (
          <div className="my-3 space-y-2 max-w-sm mx-auto text-left">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Enlaces de tu perfil ({maxLinks})
              </label>
              <span className="text-[10px] text-[var(--text-dim)]">Web o red social</span>
            </div>
            {Array.from({ length: maxLinks }, (_, index) => (
              <input
                key={index}
                type="url"
                value={linksInput[index] || ''}
                onChange={(e) => setLinksInput((previous) => {
                  const next = [...previous];
                  next[index] = e.target.value;
                  return next.slice(0, maxLinks);
                })}
                placeholder={index === 0 ? 'https://instagram.com/tu_usuario' : 'Otro link personalizado'}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            ))}
            <p className="text-[10px] text-[var(--text-dim)]">
              Podés guardar hasta {maxLinks} link{maxLinks === 1 ? '' : 's'} personal{maxLinks === 1 ? '' : 'es'}.
            </p>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingLinks(false)}
                className="flat-btn text-[11px] py-1 px-2.5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLinks}
                className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400"
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Location, Birth Date & Gender Identity Badges */}
        {(() => {
          const formattedBirthDate = formatBirthDate(profile.birth_date, profile.birth_date_visibility);
          const isBirthDateHiddenForOthers = !!(profile.birth_date && profile.birth_date_visibility === 'none');
          const isGenderVisible = !!(profile.gender_identity && (profile.gender_identity_visibility === 'public' || isOwnProfile));
          const isGenderHiddenForOthers = !!(profile.gender_identity && profile.gender_identity_visibility === 'private');
          const hasAnyBadge = profile.location || formattedBirthDate || (isOwnProfile && profile.birth_date) || isGenderVisible;

          return (
            <>
              {hasAnyBadge && !isEditingLocation && !isEditingBirthDate && !isEditingGender && (
                <div className="flex flex-wrap items-center justify-center gap-2 my-2.5">
                  {profile.location && (
                    <div 
                      className={`inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-muted)] ${
                        isOwnProfile ? 'cursor-pointer hover:border-amber-400/50 hover:text-[var(--text)] transition-colors group' : ''
                      }`}
                      onClick={isOwnProfile ? () => { setLocationInput(profile.location || ''); setIsEditingLocation(true); } : undefined}
                      title={isOwnProfile ? 'Modificar ubicación' : undefined}
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[200px]">{profile.location}</span>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocationInput(profile.location || '');
                            setIsEditingLocation(true);
                          }}
                          className="ml-1 p-0.5 rounded text-[var(--text-dim)] hover:text-amber-400 transition-colors"
                          title="Modificar ubicación"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {(formattedBirthDate || (isOwnProfile && isBirthDateHiddenForOthers)) && (
                    <div
                      className={`inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-muted)] ${
                        isOwnProfile ? 'cursor-pointer hover:border-amber-400/50 hover:text-[var(--text)] transition-colors group' : ''
                      }`}
                      onClick={isOwnProfile ? () => {
                        setBirthDateInput(profile.birth_date || '');
                        setBirthDateVisibilityInput(profile.birth_date_visibility || 'full');
                        setIsEditingBirthDate(true);
                      } : undefined}
                      title={isOwnProfile ? 'Modificar fecha de nacimiento' : undefined}
                    >
                      <Cake className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                      <span>
                        {formattedBirthDate || (isBirthDateHiddenForOthers ? 'Fecha de nacimiento (privada)' : '')}
                      </span>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBirthDateInput(profile.birth_date || '');
                            setBirthDateVisibilityInput(profile.birth_date_visibility || 'full');
                            setIsEditingBirthDate(true);
                          }}
                          className="ml-1 p-0.5 rounded text-[var(--text-dim)] hover:text-amber-400 transition-colors"
                          title="Modificar fecha de nacimiento"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {isGenderVisible && (
                    <div
                      className={`inline-flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1 rounded-lg text-xs text-[var(--text-muted)] ${
                        isOwnProfile ? 'cursor-pointer hover:border-teal-400/50 hover:text-[var(--text)] transition-colors group' : ''
                      }`}
                      onClick={isOwnProfile ? () => {
                        setGenderInput(profile.gender_identity || '');
                        setGenderVisibilityInput(profile.gender_identity_visibility || 'public');
                        setIsEditingGender(true);
                      } : undefined}
                      title={isOwnProfile ? 'Modificar identidad de género' : undefined}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {profile.gender_identity}
                        {isOwnProfile && isGenderHiddenForOthers ? ' (privado)' : ''}
                      </span>
                      {isOwnProfile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGenderInput(profile.gender_identity || '');
                            setGenderVisibilityInput(profile.gender_identity_visibility || 'public');
                            setIsEditingGender(true);
                          }}
                          className="ml-1 p-0.5 rounded text-[var(--text-dim)] hover:text-teal-400 transition-colors"
                          title="Modificar identidad de género"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quick add prompts if own profile and fields not set yet */}
              {isOwnProfile && !isEditingLocation && !isEditingBirthDate && !isEditingGender && (!profile.location || !profile.birth_date || !profile.gender_identity) && (
                <div className="flex flex-wrap items-center justify-center gap-2 my-2">
                  {!profile.location && (
                    <button
                      type="button"
                      onClick={() => { setLocationInput(''); setIsEditingLocation(true); }}
                      className="inline-flex items-center gap-1.5 bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] border border-dashed border-[var(--border)] hover:border-amber-400/50 px-2.5 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-amber-400/80" />
                      <span>+ Ubicación</span>
                    </button>
                  )}
                  {!profile.birth_date && (
                    <button
                      type="button"
                      onClick={() => { setBirthDateInput(''); setBirthDateVisibilityInput('full'); setIsEditingBirthDate(true); }}
                      className="inline-flex items-center gap-1.5 bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] border border-dashed border-[var(--border)] hover:border-amber-400/50 px-2.5 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <Cake className="w-3 h-3 text-pink-400/80" />
                      <span>+ Fecha de nacimiento</span>
                    </button>
                  )}
                  {!profile.gender_identity && (
                    <button
                      type="button"
                      onClick={() => { setGenderInput(''); setGenderVisibilityInput('public'); setIsEditingGender(true); }}
                      className="inline-flex items-center gap-1.5 bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] border border-dashed border-[var(--border)] hover:border-teal-400/50 px-2.5 py-1 rounded-lg text-[11px] text-[var(--text-muted)] hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3 text-teal-400/80" />
                      <span>+ Identidad de género</span>
                    </button>
                  )}
                </div>
              )}
            </>
          );
        })()}

        {/* Location Editor */}
        {isEditingLocation && (
          <div className="my-3 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Ubicación</span>
              </label>
              <span className="text-[10px] text-[var(--text-dim)] font-mono">{locationInput.length}/100</span>
            </div>
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Ej: Montevideo, Uruguay"
              maxLength={100}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] text-[var(--text-dim)]">Tu ciudad, barrio o zona de viaje (hasta 100 caracteres)</p>
            <div className="flex items-center justify-between pt-1">
              {locationInput ? (
                <button
                  type="button"
                  onClick={() => setLocationInput('')}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Borrar ubicación
                </button>
              ) : <div />}

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingLocation(false)}
                  className="flat-btn text-[11px] py-1 px-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLocation}
                  disabled={isSavingLocation}
                  className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400 disabled:opacity-50"
                >
                  {isSavingLocation ? 'Guardando…' : 'Guardar ubicación'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Birth Date Editor */}
        {isEditingBirthDate && (
          <div className="my-3 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-pink-400" />
                <span>Fecha de nacimiento</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingBirthDate(false)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div>
              <input
                type="date"
                value={birthDateInput}
                onChange={(e) => setBirthDateInput(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            {birthDateInput && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  ¿Cómo querés que se muestre en tu perfil?
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBirthDateVisibilityInput('full')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      birthDateVisibilityInput === 'full'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">Toda la fecha</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Día, mes y año</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBirthDateVisibilityInput('month_year')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      birthDateVisibilityInput === 'month_year'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">Mes y año</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Ej: Octubre de 1998</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBirthDateVisibilityInput('year')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      birthDateVisibilityInput === 'year'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">Solo el año</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Ej: 1998</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBirthDateVisibilityInput('none')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      birthDateVisibilityInput === 'none'
                        ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">No mostrar</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Privada</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {birthDateInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setBirthDateInput('');
                    setBirthDateVisibilityInput('none');
                  }}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Borrar fecha
                </button>
              ) : <div />}

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingBirthDate(false)}
                  className="flat-btn text-[11px] py-1 px-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBirthDate}
                  disabled={isSavingBirthDate}
                  className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400 disabled:opacity-50"
                >
                  {isSavingBirthDate ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gender Identity Editor */}
        {isEditingGender && (
          <div className="my-3 p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Identidad de género (opcional)</span>
              </label>
              <span className="text-[10px] text-[var(--text-dim)] font-mono">{genderInput.length}/50</span>
            </div>

            <div>
              <input
                type="text"
                value={genderInput}
                onChange={(e) => setGenderInput(e.target.value)}
                placeholder="Ej: No binario, Mujer, Varón, Fluido, etc."
                maxLength={50}
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-teal-400 focus:outline-none"
              />
              <p className="text-[10px] text-[var(--text-dim)] mt-1">Texto libre opcional (hasta 50 caracteres)</p>
            </div>

            {genderInput.trim() && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                  Visibilidad en tu perfil
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGenderVisibilityInput('public')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      genderVisibilityInput === 'public'
                        ? 'border-teal-400 bg-teal-400/10 text-teal-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">Público</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Visible para todos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenderVisibilityInput('private')}
                    className={`text-[11px] py-1.5 px-2 rounded-md border text-left transition-all cursor-pointer ${
                      genderVisibilityInput === 'private'
                        ? 'border-teal-400 bg-teal-400/10 text-teal-300 font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span className="block font-medium">Solo yo</span>
                    <span className="text-[9px] text-[var(--text-dim)] block">Privado</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              {genderInput ? (
                <button
                  type="button"
                  onClick={() => setGenderInput('')}
                  className="text-[11px] text-red-400 hover:underline cursor-pointer"
                >
                  Borrar identidad
                </button>
              ) : <div />}

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsEditingGender(false)}
                  className="flat-btn text-[11px] py-1 px-2.5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveGender}
                  disabled={isSavingGender}
                  className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400 disabled:opacity-50"
                >
                  {isSavingGender ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Editor */}
        {isChangingPass && (
          <div className="my-3 p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl max-w-sm mx-auto text-left space-y-2">
            <div>
              <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Establecer / cambiar contraseña
              </label>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Si te registraste con Google o querés actualizar tu clave, podés establecer una contraseña para ingresar también con usuario o email.
              </p>
            </div>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
            />
            <div className="flex justify-end gap-1.5 pt-1">
              <button
                onClick={() => setIsChangingPass(false)}
                className="flat-btn text-[11px] py-1 px-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePassword}
                disabled={!newPass || newPass.length < 6}
                className="flat-btn text-[11px] py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400 disabled:opacity-50"
              >
                Guardar contraseña
              </button>
            </div>
          </div>
        )}

        {/* Followers & Following Counters (Clickable only if viewing own profile) */}
        <div className="flex items-center justify-center gap-3 my-3">
          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => handleOpenFollowsModal('followers')}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-amber-400/50 flex items-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
              title="Ver quiénes te siguen"
            >
              <span className="font-display font-bold text-sm text-[var(--text)] group-hover:text-amber-400 transition-colors">
                {followersCount}
              </span>
              <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                {followersCount === 1 ? 'seguidor' : 'seguidores'}
              </span>
            </button>
          ) : (
            <div
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1.5 shadow-2xs select-none"
              title="Lista de seguidores privada"
            >
              <span className="font-display font-bold text-sm text-[var(--text)]">
                {followersCount}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {followersCount === 1 ? 'seguidor' : 'seguidores'}
              </span>
            </div>
          )}

          <span className="text-[var(--border)] select-none">·</span>

          {isOwnProfile ? (
            <button
              type="button"
              onClick={() => handleOpenFollowsModal('following')}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-amber-400/50 flex items-center gap-1.5 transition-all cursor-pointer group shadow-2xs"
              title="Ver a quiénes seguís"
            >
              <span className="font-display font-bold text-sm text-[var(--text)] group-hover:text-amber-400 transition-colors">
                {followingCount}
              </span>
              <span className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                {followingCount === 1 ? 'seguido' : 'seguidos'}
              </span>
            </button>
          ) : (
            <div
              className="px-3.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center gap-1.5 shadow-2xs select-none"
              title="Lista de seguidos privada"
            >
              <span className="font-display font-bold text-sm text-[var(--text)]">
                {followingCount}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {followingCount === 1 ? 'seguido' : 'seguidos'}
              </span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden my-3">
          <div className="bg-[var(--surface-2)] p-2.5">
            <span className="font-display font-bold text-base text-[var(--text)] block leading-none mb-1">
              {userReviews.length}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Omniposts
            </span>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5">
            <span className="font-display font-bold text-base text-[var(--text)] block leading-none mb-1">
              {userReposts.length}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Transbordos
            </span>
          </div>
          <div className="bg-[var(--surface-2)] p-2.5">
            <span className="font-display font-bold text-base text-amber-400 block leading-none mb-1">
              {averageUserRating} ★
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Promedio
            </span>
          </div>
        </div>

        {/* Profile actions: Share profile & Follow */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={handleCopyProfileLink}
            className="flat-btn text-xs py-1.5 px-3 cursor-pointer"
          >
            {copiedProfileLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedProfileLink ? '¡Link copiado!' : 'Compartir perfil'}</span>
          </button>

          {!isOwnProfile && (
            <button
              onClick={handleToggleFollow}
              className={`flat-btn text-xs py-1.5 px-3 font-semibold cursor-pointer ${
                isFollowing
                  ? 'border-red-500/50 text-red-400 bg-red-500/10'
                  : 'bg-amber-400 text-black border-amber-300 font-bold'
              }`}
            >
              {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{isFollowing ? 'Dejar de seguir' : 'Seguir'}</span>
            </button>
          )}
        </div>

        {/* Rankings: Aprobados & Cancelados */}
        {userReviews.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--border)] text-left">
            <div>
              <span className="text-[11px] font-display font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                🟢 Aprobados (Top 3)
              </span>
              <div className="space-y-1">
                {bestLines.length > 0 ? (
                  bestLines.map((l) => (
                    <div
                      key={l.number}
                      className="text-xs bg-[var(--surface-2)] p-1.5 rounded flex items-center justify-between border border-emerald-500/20"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] text-white shadow-xs"
                          style={{ backgroundColor: l.companyColor || '#10b981' }}
                        >
                          {l.number}
                        </span>
                        {l.companyName && (
                          <span className="text-[10px] text-[var(--text-dim)] truncate">
                            {l.companyName}
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-400 font-bold shrink-0">{l.avg.toFixed(1)} ★</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-[var(--text-dim)] italic py-1">Sin aprobados todavía</p>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-display font-bold text-red-400 uppercase tracking-wider block mb-1.5">
                🔴 Cancelados (Top 3)
              </span>
              <div className="space-y-1">
                {worstLines.length > 0 ? (
                  worstLines.map((l) => (
                    <div
                      key={l.number}
                      className="text-xs bg-[var(--surface-2)] p-1.5 rounded flex items-center justify-between border border-red-500/20"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] text-white shadow-xs"
                          style={{ backgroundColor: l.companyColor || '#ef4444' }}
                        >
                          {l.number}
                        </span>
                        {l.companyName && (
                          <span className="text-[10px] text-[var(--text-dim)] truncate">
                            {l.companyName}
                          </span>
                        )}
                      </div>
                      <span className="text-red-400 font-bold shrink-0">{l.avg.toFixed(1)} ★</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-[var(--text-dim)] italic py-1">Sin cancelados todavía</p>
                )}
              </div>
            </div>
          </div>
        )}
            </div>
          </div>
        {/* Left Column (Desktop) closes here */}
        </div>

        {/* Right Column (Desktop): Tabs and Omniposts / Transbordos Stream */}
        <div className="lg:col-span-7 space-y-4">
          {/* Content Tabs: Omniposts vs Transbordos (FIXING THE USER'S ISSUE!) */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] pt-1">
            <button
              onClick={() => setActiveTab('omniposts')}
              className={`px-3 py-2 text-xs font-display font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'omniposts'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>Omniposts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[10px] font-mono">
                {userReviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transbordos')}
              className={`px-3 py-2 text-xs font-display font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'transbordos'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Transbordos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--surface-2)] text-[10px] font-mono">
                {userReposts.length}
              </span>
            </button>
          </div>

          {/* Reviews or Reposts listing */}
          {activeTab === 'omniposts' ? (
            userReviews.length === 0 ? (
              <div className="text-center py-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Todavía no hay omniposts</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Cuando publiques reseñas sobre viajes en ómnibus, aparecerán acá.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    currentUser={currentUser}
                    onNavigate={onNavigate}
                    onOpenShare={onOpenShare}
                  />
                ))}
              </div>
            )
          ) : (
            /* Transbordos Tab */
            userReposts.length === 0 ? (
              <div className="text-center py-10 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <Repeat className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[var(--text)] mb-1">Sin transbordos todavía</p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  Cuando le des al botón 🔀 de <strong>Transbordo</strong> en cualquier omnipost de la comunidad, aparecerá reflejado acá en tu perfil.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userReposts.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    currentUser={currentUser}
                    onNavigate={onNavigate}
                    onOpenShare={onOpenShare}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal: Eliminar Cuenta */}
      {isDeletingAccount && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-red-500/30 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-base text-[var(--text)]">
                  Eliminar cuenta
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  Esta acción es irreversible. Se cerrará tu sesión y se eliminarán tus datos de perfil en Omniboxd.
                </p>
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 leading-relaxed">
              Para confirmar, escribí la palabra <strong className="font-bold underline text-white">borrar</strong> (o tu contraseña):
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteAccountError(null);
                }}
                placeholder='Escribí "borrar" o tu contraseña'
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] focus:outline-none transition-colors"
                autoFocus
              />
              {deleteAccountError && (
                <p className="text-xs text-red-400 font-medium">{deleteAccountError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  setIsDeletingAccount(false);
                  setDeleteConfirmText('');
                  setDeleteAccountError(null);
                }}
                disabled={isProcessingDelete}
                className="flat-btn text-xs py-2 px-3.5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  isProcessingDelete ||
                  (deleteConfirmText.trim().toLowerCase() !== 'borrar' &&
                   deleteConfirmText.trim().toLowerCase() !== 'delete' &&
                   deleteConfirmText.trim().length < 4)
                }
                className="flat-btn text-xs py-2 px-3.5 bg-red-600 hover:bg-red-500 text-white font-bold border-red-500 disabled:opacity-40 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isProcessingDelete ? 'Eliminando cuenta…' : 'Eliminar mi cuenta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal selector de color de portada (Paleta Oficial Omniboxd) */}
      {isEditingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[var(--text)]">
                    Color de portada
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Formato 16:9 • Paleta oficial Omniboxd
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingBanner(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text)] text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Vista previa 16:9 con el color seleccionado */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Vista previa del banner
              </span>
              <div
                className="w-full aspect-video rounded-xl relative overflow-hidden border border-white/20 shadow-inner flex items-center justify-center transition-colors duration-200"
                style={{
                  backgroundColor: selectedBannerColor,
                  backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0%, transparent 60%), linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)`
                }}
              >
                <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-center">
                  <svg viewBox="0 0 400 225" className="w-full h-full object-cover">
                    <path d="M 0 150 Q 140 70 400 115" stroke="#fff" strokeWidth="2.5" fill="none" strokeDasharray="6 4" />
                    <path d="M 0 175 Q 210 110 400 185" stroke="#fff" strokeWidth="1.5" fill="none" />
                    <circle cx="295" cy="98" r="18" stroke="#fff" strokeWidth="2" fill="none" />
                    <circle cx="295" cy="98" r="4" fill="#fff" />
                    {/* Vector Omnibus on route */}
                    <g transform="translate(160, 68) scale(1.1)">
                      <rect x="0" y="0" width="70" height="34" rx="6" fill="#ffffff" fillOpacity="0.25" stroke="#ffffff" strokeWidth="1.8" />
                      <rect x="22" y="-4" width="26" height="4" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <rect x="5" y="4" width="22" height="5" rx="1" fill="#ffffff" fillOpacity="0.4" />
                      <rect x="5" y="11" width="14" height="11" rx="2" fill="#ffffff" fillOpacity="0.45" />
                      <rect x="23" y="11" width="11" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <rect x="37" y="11" width="11" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <rect x="51" y="11" width="12" height="10" rx="1.5" fill="#ffffff" fillOpacity="0.35" />
                      <circle cx="4" cy="25" r="2" fill="#ffffff" fillOpacity="0.8" />
                      <circle cx="16" cy="34" r="6.5" fill="#111827" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx="16" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.6" />
                      <circle cx="52" cy="34" r="6.5" fill="#111827" stroke="#ffffff" strokeWidth="1.8" />
                      <circle cx="52" cy="34" r="2.5" fill="#ffffff" fillOpacity="0.6" />
                    </g>
                  </svg>
                </div>
                <div className="relative z-10 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white font-display font-bold flex items-center gap-1.5 shadow-sm">
                  <span>@{profile.username}</span>
                  {profile.profile_flair && <span className={`profile-flair profile-flair-${profile.profile_flair.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ó/g, 'o')}`}>{profile.profile_flair}</span>}
                </div>
              </div>
            </div>

            {/* Selector de los 6 colores oficiales */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Elegí tu color temático
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OMNIBOXD_PALETTE_COLORS.map((col) => {
                  const isSelected = selectedBannerColor.toLowerCase() === col.hex.toLowerCase();
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setSelectedBannerColor(col.hex)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative ${
                        isSelected
                          ? 'border-amber-400 bg-[var(--surface-2)] shadow-md ring-2 ring-amber-400/30'
                          : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-5 h-5 rounded-full shadow-xs border border-white/30 shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-[var(--text)] leading-tight">
                          {col.name}
                        </div>
                        <div className="text-[9px] text-[var(--text-dim)] truncate">
                          {col.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsEditingBanner(false)}
                disabled={isSavingBanner}
                className="flat-btn text-xs py-2 px-3 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveBannerColor(selectedBannerColor)}
                disabled={isSavingBanner}
                className="flat-btn text-xs py-2 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold border-amber-400 cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingBanner ? 'Guardando…' : 'Aplicar color'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de seguidores y seguidos */}
      {profile && (
        <MemoizedFollowsModal
          isOpen={followsModalOpen}
          onClose={() => setFollowsModalOpen(false)}
          initialTab={followsModalTab}
          profileUserId={profile.id}
          profileUsername={profile.username}
          currentUser={currentUser}
          onNavigate={onNavigate}
          onFollowCountChange={(deltaFollowers, deltaFollowing) => {
            if (deltaFollowers !== 0) {
              setFollowersCount((prev) => Math.max(0, prev + deltaFollowers));
            }
            if (deltaFollowing !== 0) {
              setFollowingCount((prev) => Math.max(0, prev + deltaFollowing));
            }
          }}
        />
      )}
    </div>
  );
};

const MemoizedFollowsModal = React.memo(FollowsModal);