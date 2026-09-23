import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { ReviewItem, UserProfile, CommentItem, BusLine, LineType, ReviewTag } from '../types';

export const SUPABASE_URL = 'https://udhawkzkxpmquxcvymqa.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_OzFEH5y3RtfGMQCC7iwX_g_TZGC6kxs';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Listener subscriptions
type RealtimeCallback = (payload: { event: string; table: string; record: any }) => void;

export function subscribeToRealtimeUpdates(callback: RealtimeCallback): RealtimeChannel {
  const channel = supabase
    .channel('omniboxd-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, (payload) => {
      callback({ event: payload.eventType, table: 'reviews', record: payload.new || payload.old });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, (payload) => {
      callback({ event: payload.eventType, table: 'likes', record: payload.new || payload.old });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
      callback({ event: payload.eventType, table: 'comments', record: payload.new || payload.old });
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reposts' }, (payload) => {
      callback({ event: payload.eventType, table: 'reposts', record: payload.new || payload.old });
    })
    .subscribe();

  return channel;
}

// Fetch helper with full metrics and tags
export async function fetchFeedReviews(currentUserId?: string | null): Promise<ReviewItem[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, body, trip_date, route_label, vehicle_number, created_at, user_id, users(id, username, avatar_url, profile_flair, username_color, avatar_border, achievement_level, visible_badges), lines(id, number, company_id, companies(short_name, color, logo_url))')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Supabase fetchFeedReviews error:', error.message);
      return [];
    }

    const reviews: ReviewItem[] = (data || []).map((r: any) => ({
      id: r.id,
      rating: Number(r.rating) || 0,
      body: r.body || '',
      trip_date: r.trip_date,
      created_at: r.created_at,
      user_id: r.user_id || r.users?.id,
      route_label: r.route_label,
      vehicle_number: r.vehicle_number,
      users: r.users,
      lines: r.lines,
      tags: [],
      like_count: 0,
      dislike_count: 0,
      my_reaction: null,
      comment_count: 0,
      repost_count: 0,
      my_reposted: false
    }));

    if (reviews.length === 0) return [];

    const reviewIds = reviews.map((r) => r.id);

    // Fetch tags, likes, comments, reposts in parallel
    const [tagsRes, likesRes, commentsRes, repostsRes] = await Promise.all([
      supabase.from('review_tags').select('review_id, tags(label, emoji)').in('review_id', reviewIds),
      supabase.from('likes').select('review_id, user_id, reaction').in('review_id', reviewIds),
      supabase.from('comments').select('review_id').in('review_id', reviewIds),
      supabase.from('reposts').select('review_id, user_id').in('review_id', reviewIds)
    ]);

    // Map tags
    if (tagsRes.data) {
      const tagsByReview: Record<string, { label: string; emoji?: string }[]> = {};
      tagsRes.data.forEach((rt: any) => {
        if (!tagsByReview[rt.review_id]) tagsByReview[rt.review_id] = [];
        if (rt.tags) {
          tagsByReview[rt.review_id].push({
            label: rt.tags.label,
            emoji: rt.tags.emoji
          });
        }
      });
      reviews.forEach((r) => {
        r.tags = tagsByReview[r.id] || [];
      });
    }

    // Map likes / dislikes uniquely per user to avoid duplicate rows inflating counts
    if (likesRes.data) {
      const reactionsByReview: Record<string, Record<string, 'like' | 'dislike'>> = {};

      likesRes.data.forEach((l: any) => {
        if (!reactionsByReview[l.review_id]) reactionsByReview[l.review_id] = {};
        reactionsByReview[l.review_id][l.user_id] = l.reaction === 'dislike' ? 'dislike' : 'like';
      });

      reviews.forEach((r) => {
        const userReactions = reactionsByReview[r.id] || {};
        let likes = 0;
        let dislikes = 0;
        Object.values(userReactions).forEach((reaction) => {
          if (reaction === 'dislike') dislikes++;
          else likes++;
        });

        r.like_count = likes;
        r.dislike_count = dislikes;
        r.my_reaction = currentUserId ? userReactions[currentUserId] || null : null;
      });
    }

    // Map comments count
    if (commentsRes.data) {
      const commentsMap: Record<string, number> = {};
      commentsRes.data.forEach((c: any) => {
        commentsMap[c.review_id] = (commentsMap[c.review_id] || 0) + 1;
      });
      reviews.forEach((r) => {
        r.comment_count = commentsMap[r.id] || 0;
      });
    }

    // Map reposts count & my_reposted uniquely per user
    if (repostsRes.data) {
      const repostUsersByReview: Record<string, Set<string>> = {};
      repostsRes.data.forEach((rp: any) => {
        if (!repostUsersByReview[rp.review_id]) repostUsersByReview[rp.review_id] = new Set();
        repostUsersByReview[rp.review_id].add(rp.user_id);
      });
      reviews.forEach((r) => {
        const usersSet = repostUsersByReview[r.id];
        r.repost_count = usersSet ? usersSet.size : 0;
        r.my_reposted = !!(currentUserId && usersSet && usersSet.has(currentUserId));
      });
    }

    return reviews;
  } catch (err) {
    console.error('fetchFeedReviews caught error:', err);
    return [];
  }
}

// Fetch user's own reviews
export async function fetchUserReviews(userId: string, currentUserId?: string | null): Promise<ReviewItem[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, body, trip_date, route_label, vehicle_number, created_at, user_id, users(id, username, avatar_url, profile_flair, username_color, avatar_border, achievement_level, visible_badges), lines(id, number, company_id, companies(short_name, color, logo_url))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const reviews: ReviewItem[] = data.map((r: any) => ({
      id: r.id,
      rating: Number(r.rating) || 0,
      body: r.body || '',
      trip_date: r.trip_date,
      created_at: r.created_at,
      user_id: r.user_id || r.users?.id,
      route_label: r.route_label,
      vehicle_number: r.vehicle_number,
      users: r.users,
      lines: r.lines,
      tags: [],
      like_count: 0,
      dislike_count: 0,
      my_reaction: null,
      comment_count: 0,
      repost_count: 0,
      my_reposted: false
    }));

    const reviewIds = reviews.map((r) => r.id);
    const [likesRes, commentsRes, repostsRes, tagsRes] = await Promise.all([
      supabase.from('likes').select('review_id, user_id, reaction').in('review_id', reviewIds),
      supabase.from('comments').select('review_id').in('review_id', reviewIds),
      supabase.from('reposts').select('review_id, user_id').in('review_id', reviewIds),
      supabase.from('review_tags').select('review_id, tags(label, emoji)').in('review_id', reviewIds)
    ]);

    if (likesRes.data) {
      const reactionsByReview: Record<string, Record<string, 'like' | 'dislike'>> = {};

      likesRes.data.forEach((l: any) => {
        if (!reactionsByReview[l.review_id]) reactionsByReview[l.review_id] = {};
        reactionsByReview[l.review_id][l.user_id] = l.reaction === 'dislike' ? 'dislike' : 'like';
      });

      reviews.forEach((r) => {
        const userReactions = reactionsByReview[r.id] || {};
        let likes = 0;
        let dislikes = 0;
        Object.values(userReactions).forEach((reaction) => {
          if (reaction === 'dislike') dislikes++;
          else likes++;
        });

        r.like_count = likes;
        r.dislike_count = dislikes;
        r.my_reaction = currentUserId ? userReactions[currentUserId] || null : null;
      });
    }

    if (commentsRes.data) {
      const commentsMap: Record<string, number> = {};
      commentsRes.data.forEach((c: any) => {
        commentsMap[c.review_id] = (commentsMap[c.review_id] || 0) + 1;
      });
      reviews.forEach((r) => {
        r.comment_count = commentsMap[r.id] || 0;
      });
    }

    if (repostsRes.data) {
      const repostUsersByReview: Record<string, Set<string>> = {};
      repostsRes.data.forEach((rp: any) => {
        if (!repostUsersByReview[rp.review_id]) repostUsersByReview[rp.review_id] = new Set();
        repostUsersByReview[rp.review_id].add(rp.user_id);
      });
      reviews.forEach((r) => {
        const usersSet = repostUsersByReview[r.id];
        r.repost_count = usersSet ? usersSet.size : 0;
        r.my_reposted = !!(currentUserId && usersSet && usersSet.has(currentUserId));
      });
    }

    if (tagsRes.data) {
      tagsRes.data.forEach((rt: any) => {
        const item = reviews.find((r) => r.id === rt.review_id);
        if (item && rt.tags) {
          item.tags = item.tags || [];
          item.tags.push({ label: rt.tags.label, emoji: rt.tags.emoji });
        }
      });
    }

    return reviews;
  } catch (err) {
    console.error('fetchUserReviews error:', err);
    return [];
  }
}

// Fetch user's transbordos (reposts) - with full like/repost state reflection!
export async function fetchUserReposts(userId: string, currentUserId?: string | null): Promise<ReviewItem[]> {
  try {
    // 1. Fetch the user's repost records
    const { data: repostRecords, error: repostError } = await supabase
      .from('reposts')
      .select('id, review_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (repostError || !repostRecords || repostRecords.length === 0) {
      return [];
    }

    const reviewIds = repostRecords.map((r: any) => r.review_id).filter(Boolean);
    if (reviewIds.length === 0) return [];

    // 2. Fetch the corresponding reviews directly
    const { data: reviewRows, error: reviewError } = await supabase
      .from('reviews')
      .select('id, rating, body, trip_date, route_label, vehicle_number, created_at, user_id, users(id, username, avatar_url, profile_flair, username_color, avatar_border, achievement_level, visible_badges), lines(id, number, company_id, companies(short_name, color, logo_url))')
      .in('id', reviewIds);

    if (reviewError || !reviewRows) {
      console.warn('fetchUserReposts reviewRows error:', reviewError?.message);
      return [];
    }

    const reviewsMap = new Map<string, any>();
    reviewRows.forEach((r: any) => reviewsMap.set(r.id, r));

    const result: ReviewItem[] = [];

    // Maintain the order of repost timestamp
    for (const rep of repostRecords) {
      const r = reviewsMap.get(rep.review_id);
      if (!r) continue;

      result.push({
        id: r.id,
        rating: Number(r.rating) || 0,
        body: r.body || '',
        trip_date: r.trip_date,
        created_at: r.created_at,
        user_id: r.user_id || r.users?.id,
        route_label: r.route_label,
        vehicle_number: r.vehicle_number,
        users: r.users,
        lines: r.lines,
        tags: [],
        like_count: 0,
        dislike_count: 0,
        my_reaction: null,
        comment_count: 0,
        repost_count: 0,
        my_reposted: false,
        reposted_by: r.users?.username,
        repost_at: rep.created_at
      });
    }

    // Enrich like/comment/repost counts & user reaction states
    if (result.length > 0) {
      const [likesRes, commentsRes, repostsRes, tagsRes] = await Promise.all([
        supabase.from('likes').select('review_id, user_id, reaction').in('review_id', reviewIds),
        supabase.from('comments').select('review_id').in('review_id', reviewIds),
        supabase.from('reposts').select('review_id, user_id').in('review_id', reviewIds),
        supabase.from('review_tags').select('review_id, tags(label, emoji)').in('review_id', reviewIds)
      ]);

      if (likesRes.data) {
        const reactionsByReview: Record<string, Record<string, 'like' | 'dislike'>> = {};

        likesRes.data.forEach((l: any) => {
          if (!reactionsByReview[l.review_id]) reactionsByReview[l.review_id] = {};
          reactionsByReview[l.review_id][l.user_id] = l.reaction === 'dislike' ? 'dislike' : 'like';
        });

        result.forEach((item) => {
          const userReactions = reactionsByReview[item.id] || {};
          let likes = 0;
          let dislikes = 0;
          Object.values(userReactions).forEach((reaction) => {
            if (reaction === 'dislike') dislikes++;
            else likes++;
          });

          item.like_count = likes;
          item.dislike_count = dislikes;
          item.my_reaction = currentUserId ? userReactions[currentUserId] || null : null;
        });
      }

      if (commentsRes.data) {
        const commentsMap: Record<string, number> = {};
        commentsRes.data.forEach((c: any) => {
          commentsMap[c.review_id] = (commentsMap[c.review_id] || 0) + 1;
        });
        result.forEach((item) => {
          item.comment_count = commentsMap[item.id] || 0;
        });
      }

      if (repostsRes.data) {
        const repostUsersByReview: Record<string, Set<string>> = {};
        repostsRes.data.forEach((rp: any) => {
          if (!repostUsersByReview[rp.review_id]) repostUsersByReview[rp.review_id] = new Set();
          repostUsersByReview[rp.review_id].add(rp.user_id);
        });
        result.forEach((item) => {
          const usersSet = repostUsersByReview[item.id];
          item.repost_count = usersSet ? usersSet.size : 0;
          item.my_reposted = !!(currentUserId && usersSet && usersSet.has(currentUserId));
        });
      }

      if (tagsRes.data) {
        tagsRes.data.forEach((rt: any) => {
          const item = result.find((r) => r.id === rt.review_id);
          if (item && rt.tags) {
            item.tags = item.tags || [];
            item.tags.push({ label: rt.tags.label, emoji: rt.tags.emoji });
          }
        });
      }
    }

    return result;
  } catch (err) {
    console.error('fetchUserReposts caught error:', err);
    return [];
  }
}

// Fetch a single review with full metrics
export async function fetchSingleReview(reviewId: string, currentUserId?: string | null): Promise<ReviewItem | null> {
  try {
    const { data: rawR, error } = await supabase
      .from('reviews')
      .select('id, rating, body, trip_date, route_label, vehicle_number, created_at, user_id, users(id, username, avatar_url, profile_flair, username_color, avatar_border, achievement_level, visible_badges), lines(id, number, company_id, companies(short_name, color, logo_url))')
      .eq('id', reviewId)
      .maybeSingle();

    if (error || !rawR) return null;
    const r: any = rawR;
    const userObj = Array.isArray(r.users) ? r.users[0] : r.users;
    const lineObj = Array.isArray(r.lines) ? r.lines[0] : r.lines;

    const review: ReviewItem = {
      id: r.id,
      rating: Number(r.rating) || 0,
      body: r.body || '',
      trip_date: r.trip_date,
      created_at: r.created_at,
      user_id: r.user_id || userObj?.id,
      route_label: r.route_label,
      vehicle_number: r.vehicle_number,
      users: userObj,
      lines: lineObj ? {
        ...lineObj,
        companies: Array.isArray(lineObj.companies) ? lineObj.companies[0] : lineObj.companies
      } : undefined,
      tags: [],
      like_count: 0,
      dislike_count: 0,
      my_reaction: null,
      comment_count: 0,
      repost_count: 0,
      my_reposted: false
    };

    const [likesRes, commentsRes, repostsRes, tagsRes] = await Promise.all([
      supabase.from('likes').select('user_id, reaction').eq('review_id', reviewId),
      supabase.from('comments').select('id').eq('review_id', reviewId),
      supabase.from('reposts').select('user_id').eq('review_id', reviewId),
      supabase.from('review_tags').select('tags(label, emoji)').eq('review_id', reviewId)
    ]);

    if (likesRes.data) {
      const userReactions: Record<string, 'like' | 'dislike'> = {};
      likesRes.data.forEach((l: any) => {
        userReactions[l.user_id] = l.reaction === 'dislike' ? 'dislike' : 'like';
      });

      let likes = 0;
      let dislikes = 0;
      Object.values(userReactions).forEach((reaction) => {
        if (reaction === 'dislike') dislikes++;
        else likes++;
      });

      review.like_count = likes;
      review.dislike_count = dislikes;
      review.my_reaction = currentUserId ? userReactions[currentUserId] || null : null;
    }

    if (commentsRes.data) {
      review.comment_count = commentsRes.data.length;
    }

    if (repostsRes.data) {
      const repostUsers = new Set(repostsRes.data.map((rp: any) => rp.user_id));
      review.repost_count = repostUsers.size;
      review.my_reposted = !!(currentUserId && repostUsers.has(currentUserId));
    }

    if (tagsRes.data) {
      review.tags = tagsRes.data.map((rt: any) => ({
        label: rt.tags?.label || '',
        emoji: rt.tags?.emoji
      })).filter((t: any) => t.label);
    }

    return review;
  } catch (err) {
    console.error('fetchSingleReview error:', err);
    return null;
  }
}

// Fetch all lines
export async function fetchAllLines(): Promise<BusLine[]> {
  try {
    const { data, error } = await supabase
      .from('lines')
      .select('id, number, type, company_id, routes, created_by, creator:created_by(id, username), companies(id, name, short_name, color, logo_url)')
      .eq('active', true)
      .order('number');

    if (error) throw error;
    return (data || []).map((l: any) => ({
      ...l,
      companies: Array.isArray(l.companies) ? l.companies[0] : l.companies,
      creator: Array.isArray(l.creator) ? l.creator[0] : l.creator
    })) as BusLine[];
  } catch (e) {
    console.warn('fetchAllLines error, using fallback:', e);
    return [];
  }
}

// Fetch all companies
export async function fetchAllCompanies(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchAllCompanies error:', e);
    return [];
  }
}

// Fetch user profile
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as UserProfile;
  } catch (err) {
    return null;
  }
}

// Fetch all line types
export async function fetchLineTypes(): Promise<LineType[]> {
  try {
    const { data, error } = await supabase
      .from('line_types')
      .select('*')
      .order('label');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchLineTypes error:', e);
    return [];
  }
}

// Fetch all tags
export async function fetchAdminTags(): Promise<ReviewTag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('label');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('fetchAdminTags error:', e);
    return [];
  }
}

