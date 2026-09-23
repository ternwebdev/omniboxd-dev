export type ThemeMode = 'dark' | 'medium' | 'light' | 'night' | 'galaxy' | 'auto';

export type BirthDateVisibility = 'none' | 'year' | 'month_year' | 'full';

export type GenderVisibility = 'public' | 'private';

export interface UserProfile {
  id: string;
  username: string;
  email?: string | null;
  avatar_url?: string | null;
  banner_color?: string | null;
  username_color?: string | null;
  avatar_border?: 'bronze' | 'silver' | null;
  visible_badges?: string[];
  profile_cover_url?: string | null;
  profile_flair?: string | null;
  achievement_level?: number;
  bio?: string | null;
  links?: string[];
  location?: string | null;
  birth_date?: string | null;
  birth_date_visibility?: BirthDateVisibility | null;
  gender_identity?: string | null;
  gender_identity_visibility?: GenderVisibility | null;
  is_admin?: boolean;
  username_changed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  pinned_badges?: string[];
}

export interface BusCompany {
  id: string;
  name: string;
  short_name: string;
  color?: string;
  logo_url?: string | null;
}

export interface BusRoute {
  origin: string;
  destination: string;
  label?: string;
}

export interface BusLine {
  id: string;
  number: string;
  company_id?: string;
  companies?: BusCompany;
  origin?: string;
  destination?: string;
  type?: string;
  routes?: BusRoute[] | string;
  active?: boolean;
  created_by?: string | null;
  creator?: { id: string; username: string } | null;
}

export interface LineType {
  id: string;
  slug: string;
  label: string;
  description?: string | null;
  created_at?: string;
}

export interface ReviewTag {
  id?: string;
  slug: string;
  label: string;
  emoji?: string;
  category?: string;
}

export interface TagCategory {
  slug: string;
  label: string;
  created_at?: string;
}

export interface CommentItem {
  id: string;
  review_id: string;
  user_id: string;
  body: string;
  created_at: string;
  users?: {
    username?: string;
    avatar_url?: string;
    profile_flair?: string | null;
    achievement_level?: number;
    visible_badges?: string[];
  };
  like_count?: number;
  dislike_count?: number;
  my_reaction?: 'like' | 'dislike' | null;
}

export interface ReviewItem {
  id: string;
  user_id: string;
  line_id?: string;
  rating: number;
  body: string;
  trip_date?: string | null;
  created_at: string;
  route_label?: string | null;
  vehicle_number?: string | null;
users?: {
  id?: string;
  username?: string;
  avatar_url?: string | null;
  profile_flair?: string | null;
  username_color?: string | null;
  avatar_border?: 'bronze' | 'silver' | null;
  achievement_level?: number;
  visible_badges?: string[];
};
  lines?: {
    id?: string;
    number?: string;
    company_id?: string;
    companies?: {
      short_name?: string;
      color?: string;
      logo_url?: string | null;
    };
  };
  tags?: { label: string; emoji?: string }[];
  // Social metrics
  like_count?: number;
  dislike_count?: number;
  my_reaction?: 'like' | 'dislike' | null;
  comment_count?: number;
  repost_count?: number;
  my_reposted?: boolean;
  reposted_by?: string | null;
  repost_at?: string | null;
  _prio?: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  kind: string;
  body: string;
  read_at?: string | null;
  created_at: string;
  review_id?: string | null;
}

export interface FavoriteItem {
  id: string;
  user_id: string;
  line_id?: string | null;
  company_id?: string | null;
}
