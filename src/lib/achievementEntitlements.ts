export type AchievementEntitlements = {
  level: number;
  maxBioLength: number;
  maxLinks: number;
  canUseMediumTheme: boolean;
  canUseNightTheme: boolean;
  canUseGalaxyTheme: boolean;
  canUseAutomaticTheme: boolean;
  canUseProfileVideo: boolean;
  canUseCoverMedia: boolean;
  maxVisibleBadges: number;
  avatarBorder: 'none' | 'bronze' | 'silver' | 'premium';
  profileFlair: string | null;
};

export function getAchievementEntitlements(achievementCount: number): AchievementEntitlements {
  if (achievementCount >= 49) {
    return {
      level: 5,
      maxBioLength: 1000,
      maxLinks: 5,
      canUseMediumTheme: true,
      canUseNightTheme: true,
      canUseGalaxyTheme: true,
      canUseAutomaticTheme: true,
      canUseProfileVideo: true,
      canUseCoverMedia: true,
      maxVisibleBadges: Infinity,
      avatarBorder: 'premium',
      profileFlair: 'Leyenda'
    };
  }
  if (achievementCount >= 40) {
    return {
      level: 4.5,
      maxBioLength: 750,
      maxLinks: 4,
      canUseMediumTheme: true,
      canUseNightTheme: true,
      canUseGalaxyTheme: true,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: true,
      maxVisibleBadges: 4,
      avatarBorder: 'premium',
      profileFlair: 'Inspector'
    };
  }
  if (achievementCount >= 31) {
    return {
      level: 4,
      maxBioLength: 750,
      maxLinks: 4,
      canUseMediumTheme: true,
      canUseNightTheme: true,
      canUseGalaxyTheme: true,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: true,
      maxVisibleBadges: 3,
      avatarBorder: 'premium',
      profileFlair: 'Chófer'
    };
  }
  if (achievementCount >= 24) {
    return {
      level: 3.5,
      maxBioLength: 550,
      maxLinks: 3,
      canUseMediumTheme: true,
      canUseNightTheme: true,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: true,
      maxVisibleBadges: 3,
      avatarBorder: 'silver',
      profileFlair: 'Amante'
    };
  }
  if (achievementCount >= 17) {
    return {
      level: 3,
      maxBioLength: 450,
      maxLinks: 3,
      canUseMediumTheme: true,
      canUseNightTheme: true,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: true,
      maxVisibleBadges: 2,
      avatarBorder: 'bronze',
      profileFlair: 'Amante'
    };
  }
  if (achievementCount >= 12) {
    return {
      level: 2.5,
      maxBioLength: 350,
      maxLinks: 2,
      canUseMediumTheme: true,
      canUseNightTheme: false,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: false,
      maxVisibleBadges: 2,
      avatarBorder: 'bronze',
      profileFlair: 'Viajante'
    };
  }
  if (achievementCount >= 7) {
    return {
      level: 2,
      maxBioLength: 350,
      maxLinks: 2,
      canUseMediumTheme: true,
      canUseNightTheme: false,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: true,
      canUseCoverMedia: false,
      maxVisibleBadges: 1,
      avatarBorder: 'bronze',
      profileFlair: 'Viajante'
    };
  }
  if (achievementCount >= 4) {
    return {
      level: 1.5,
      maxBioLength: 200,
      maxLinks: 1,
      canUseMediumTheme: false,
      canUseNightTheme: false,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: false,
      canUseCoverMedia: false,
      maxVisibleBadges: 1,
      avatarBorder: 'bronze',
      profileFlair: 'Novatada'
    };
  }
  if (achievementCount >= 1) {
    return {
      level: 1,
      maxBioLength: 150,
      maxLinks: 1,
      canUseMediumTheme: false,
      canUseNightTheme: false,
      canUseGalaxyTheme: false,
      canUseAutomaticTheme: false,
      canUseProfileVideo: false,
      canUseCoverMedia: false,
      maxVisibleBadges: 0,
      avatarBorder: 'none',
      profileFlair: 'Novatada'
    };
  }
  return {
    level: 0.5,
    maxBioLength: 100,
    maxLinks: 0,
    canUseMediumTheme: false,
    canUseNightTheme: false,
    canUseGalaxyTheme: false,
    canUseAutomaticTheme: false,
    canUseProfileVideo: false,
    canUseCoverMedia: false,
    maxVisibleBadges: 0,
    avatarBorder: 'none',
    profileFlair: null
  };
}
