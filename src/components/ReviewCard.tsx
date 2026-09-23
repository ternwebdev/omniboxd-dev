import React, { useState, useEffect } from 'react';
import { 
  ArrowDown,
  Bus,
  Signpost,
  Repeat, 
  Share2, 
  Users, 
  Edit3, 
  Trash2, 
  Send,
  Clock,
  Check,
  X
} from 'lucide-react';
import { ReviewItem, UserProfile, CommentItem } from '../types';
import { COMPANY_COLORS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { formatTripDate, formatPublicationDate, formatTime24h } from '../lib/dateUtils';
import { ReactorsModal } from './ReactorsModal';
import { CommentBody } from './UserMention';
import { StarRating } from './StarRating';
import { NewReviewModal } from './NewReviewModal';
import { pushNotification, removeNotificationsByReviewAndKind } from '../lib/notifications';

const OmniboxdBadge: React.FC<{ slug: string; complete?: boolean }> = ({ slug, complete = false }) => {
  const [hasSvg, setHasSvg] = useState(true);
  const label = slug.replaceAll('_', ' ');

  return (
    <span
      className={`omnipost-badge ${complete ? 'is-complete' : ''}`}
      title={complete ? `${label} · categoría completa` : label}
    >
      {hasSvg ? (
        <img
          src={`/img/achievements/${slug}.svg`}
          alt={label}
          onError={() => setHasSvg(false)}
        />
      ) : (
        <span className="text-[7px] leading-none text-amber-300">
          {label.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
};

interface ReviewCardProps {
  review: ReviewItem;
  currentUser: UserProfile | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenShare: (review: ReviewItem) => void;
  onReviewUpdated?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  currentUser,
  onNavigate,
  onOpenShare,
  onReviewUpdated
}) => {
  // Optimistic social states
  const [likesCount, setLikesCount] = useState(review.like_count || 0);
  const [dislikesCount, setDislikesCount] = useState(review.dislike_count || 0);
  const [myReaction, setMyReaction] = useState<'like' | 'dislike' | null>(review.my_reaction || null);
  const [repostsCount, setRepostsCount] = useState(review.repost_count || 0);
  const [isReposted, setIsReposted] = useState(review.my_reposted || false);
  const [commentsCount, setCommentsCount] = useState(review.comment_count || 0);
  const [latestComment, setLatestComment] = useState<CommentItem | null>(null);

  // Synchronize optimistic state whenever review data from feed changes
  useEffect(() => {
    setLikesCount(review.like_count || 0);
    setDislikesCount(review.dislike_count || 0);
    setMyReaction(review.my_reaction || null);
    setRepostsCount(review.repost_count || 0);
    setIsReposted(review.my_reposted || false);
    setCommentsCount(review.comment_count || 0);
  }, [
    review.id,
    review.like_count,
    review.dislike_count,
    review.my_reaction,
    review.repost_count,
    review.my_reposted,
    review.comment_count,
    currentUser?.id
  ]);

  useEffect(() => {
  let cancelled = false;
  (async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id, review_id, users(username, avatar_url, profile_flair, achievement_level, visible_badges)')
      .eq('review_id', review.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!cancelled && data) {
      setLatestComment({
        id: data.id,
        review_id: data.review_id || review.id,
        user_id: data.user_id,
        body: data.body,
        created_at: data.created_at,
        users: Array.isArray(data.users) ? data.users[0] : data.users
      });
    }
  })();
  return () => { cancelled = true; };
}, [review.id, commentsCount]);

  // Reactors modal state
  const [isReactorsModalOpen, setIsReactorsModalOpen] = useState(false);

  // Comments accordion state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<CommentItem[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Comment edit state (10-min window)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentBody, setEditCommentBody] = useState('');
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false);

  // Review text editing state
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isEditingFullReview, setIsEditingFullReview] = useState(false);
  const [editedBody, setEditedBody] = useState(review.body);

  const companyName = review.lines?.companies?.short_name || 'CUTCSA';
  const companyColor = review.lines?.companies?.color || COMPANY_COLORS[companyName] || '#555f5e';
  const lineNumber = review.lines?.number || '—';
  const authorName = review.users?.username || 'viajero';
  const authorAvatar = review.users?.avatar_url;
  const authorLevel = review.users?.achievement_level || 0;
  const starColor = authorLevel >= 4.5 && review.rating >= 4.5
    ? 'text-violet-400'
    : authorLevel >= 4.5 && review.rating <= 1
      ? 'text-slate-300'
      : authorLevel >= 2.5 && review.rating >= 3.5 && review.rating <= 4
        ? 'text-sky-400'
        : authorLevel >= 2.5 && review.rating >= 1.5 && review.rating <= 2
          ? 'text-slate-300/70'
          : 'text-emerald-400';
  const isOwnReview = !!(currentUser && review.user_id === currentUser.id);
  const avatarBorderClass = review.users?.avatar_border === 'premium'
    ? 'avatar-border-premium'
    : review.users?.avatar_border === 'silver'
      ? 'avatar-border-silver'
      : review.users?.avatar_border === 'bronze'
        ? 'avatar-border-bronze'
        : 'border-[var(--border)]';
  const flairClass = review.users?.profile_flair ? `profile-flair-${review.users.profile_flair.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ó/g, 'o')}` : '';

  // Within 15 min window for review editing/deleting
  const canEditReview = () => {
    if (!review.created_at) return false;
    const diff = Date.now() - new Date(review.created_at).getTime();
    return diff <= 15 * 60 * 1000;
  };

  // 1. Chiflido / Bajada toggle with instant optimistic update & clean deduplication
  const handleReaction = async (kind: 'like' | 'dislike') => {
    if (!currentUser) {
      onNavigate('auth');
      return;
    }
    if (isOwnReview) return;

    const previousReaction = myReaction;
    const previousLikes = likesCount;
    const previousDislikes = dislikesCount;

    // Optimistic UI calculation
    if (previousReaction === kind) {
      // Toggle off
      setMyReaction(null);
      if (kind === 'like') setLikesCount(Math.max(0, likesCount - 1));
      else setDislikesCount(Math.max(0, dislikesCount - 1));
    } else {
      // Switch or set
      setMyReaction(kind);
      if (kind === 'like') {
        setLikesCount(likesCount + 1);
        if (previousReaction === 'dislike') setDislikesCount(Math.max(0, dislikesCount - 1));
      } else {
        setDislikesCount(dislikesCount + 1);
        if (previousReaction === 'like') setLikesCount(Math.max(0, likesCount - 1));
      }
    }

    try {
      // Check existing rows in DB without maybeSingle to handle any historical duplicates cleanly
      const { data: existingRows } = await supabase
        .from('likes')
        .select('id, reaction')
        .eq('review_id', review.id)
        .eq('user_id', currentUser.id);

      const hasSameKind = existingRows && existingRows.some((r: any) => r.reaction === kind);

      if (hasSameKind) {
        // Toggle off: Delete ALL rows for this user and review
        await supabase
          .from('likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);

        // Dynamically remove notification if author is someone else
        if (review.user_id && review.user_id !== currentUser.id) {
          await removeNotificationsByReviewAndKind(
            review.user_id,
            review.id,
            kind,
            `@${currentUser.username}`
          );
        }
      } else {
        // Switching or fresh: Clean any previous rows first so there's never duplicate rows
        await supabase
          .from('likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);

        // Insert exactly one clean row
        await supabase.from('likes').insert({
          review_id: review.id,
          user_id: currentUser.id,
          reaction: kind
        });

        if (review.user_id && review.user_id !== currentUser.id) {
          if (existingRows && existingRows.length > 0) {
            // Delete previous notification
            await removeNotificationsByReviewAndKind(
              review.user_id,
              review.id,
              existingRows[0].reaction,
              `@${currentUser.username}`
            );
          }

          const bodyText =
            kind === 'like'
              ? `@${currentUser.username} te pegó un chiflido en tu omniposteo`
              : `@${currentUser.username} te dio una bajada en tu omniposteo`;

          await pushNotification({
            user_id: review.user_id,
            review_id: review.id,
            kind: kind,
            body: bodyText
          });
        }
      }
    } catch (err) {
      // Revert if error
      setMyReaction(previousReaction);
      setLikesCount(previousLikes);
      setDislikesCount(previousDislikes);
    }
  };

  // 2. Transbordo toggle with instant optimistic update & clean deduplication
  const handleToggleRepost = async () => {
    if (!currentUser) {
      onNavigate('auth');
      return;
    }
    if (isOwnReview) return;

    const wasReposted = isReposted;
    const previousCount = repostsCount;

    // Optimistic update
    setIsReposted(!wasReposted);
    setRepostsCount(wasReposted ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const { data: existingRows } = await supabase
        .from('reposts')
        .select('id')
        .eq('review_id', review.id)
        .eq('user_id', currentUser.id);

      if (existingRows && existingRows.length > 0) {
        // Remove repost: delete ALL matching rows for this user and review
        await supabase
          .from('reposts')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);

        // Dynamically remove notification if author is someone else
        if (review.user_id && review.user_id !== currentUser.id) {
          await removeNotificationsByReviewAndKind(
            review.user_id,
            review.id,
            'repost',
            `@${currentUser.username}`
          );
        }
      } else {
        // Add fresh repost
        await supabase.from('reposts').insert({
          review_id: review.id,
          user_id: currentUser.id
        });

        if (review.user_id && review.user_id !== currentUser.id) {
          await pushNotification({
            user_id: review.user_id,
            review_id: review.id,
            kind: 'repost',
            body: `@${currentUser.username} hizo transbordo de tu omniposteo`
          });
        }
      }
    } catch (err) {
      setIsReposted(wasReposted);
      setRepostsCount(previousCount);
    }
  };

  // 3. Comments load and toggle
  const handleToggleComments = async () => {
    const nextState = !commentsOpen;
    setCommentsOpen(nextState);

    if (nextState && commentsList.length === 0) {
      setIsLoadingComments(true);
      try {
        const { data } = await supabase
          .from('comments')
          .select('id, body, created_at, user_id, review_id, users(username, avatar_url, profile_flair, username_color, avatar_border, achievement_level)')
          .eq('review_id', review.id)
          .order('created_at', { ascending: true });

        if (data) {
          const mappedComments: CommentItem[] = (data || []).map((c: any) => ({
            id: c.id,
            review_id: c.review_id || review.id,
            user_id: c.user_id,
            body: c.body,
            created_at: c.created_at,
            users: Array.isArray(c.users) ? c.users[0] : c.users
          }));
          setCommentsList(mappedComments);
          // Cargar reacciones de los comentarios
const commentIds = mappedComments.map((c) => c.id);
if (commentIds.length > 0) {
  const { data: reactionsData } = await supabase
    .from('comment_likes')
    .select('comment_id, user_id, reaction')
    .in('comment_id', commentIds);

  if (reactionsData) {
    const reactionsByComment: Record<string, Record<string, 'like' | 'dislike'>> = {};
    reactionsData.forEach((r: any) => {
      if (!reactionsByComment[r.comment_id]) reactionsByComment[r.comment_id] = {};
      reactionsByComment[r.comment_id][r.user_id] = r.reaction === 'dislike' ? 'dislike' : 'like';
    });

    setCommentsList((prev) =>
      prev.map((c) => {
        const userReactions = reactionsByComment[c.id] || {};
        let likes = 0;
        let dislikes = 0;
        Object.values(userReactions).forEach((reaction) => {
          if (reaction === 'dislike') dislikes++;
          else likes++;
        });
        return {
          ...c,
          like_count: likes,
          dislike_count: dislikes,
          my_reaction: currentUser ? userReactions[currentUser.id] || null : null
        };
      })
    );
  }
}
        }
        
      } catch (err) {
        console.warn('Error loading comments:', err);
      } finally {
        setIsLoadingComments(false);
      }
    }
  };

const handleCommentReaction = async (commentId: string, kind: 'like' | 'dislike') => {
  if (!currentUser) { onNavigate('auth'); return; }

  const comment = commentsList.find((c) => c.id === commentId);
  if (!comment) return;
  if (comment.user_id === currentUser.id) return; // no self-reaction

  const previousReaction = comment.my_reaction || null;
  const previousLikes = comment.like_count || 0;
  const previousDislikes = comment.dislike_count || 0;

  // Optimistic
  setCommentsList((prev) =>
    prev.map((c) => {
      if (c.id !== commentId) return c;
      let likes = previousLikes;
      let dislikes = previousDislikes;
      let nextReaction: 'like' | 'dislike' | null = kind;

      if (previousReaction === kind) {
        nextReaction = null;
        if (kind === 'like') likes = Math.max(0, likes - 1);
        else dislikes = Math.max(0, dislikes - 1);
      } else {
        if (kind === 'like') {
          likes += 1;
          if (previousReaction === 'dislike') dislikes = Math.max(0, dislikes - 1);
        } else {
          dislikes += 1;
          if (previousReaction === 'like') likes = Math.max(0, likes - 1);
        }
      }
      return { ...c, like_count: likes, dislike_count: dislikes, my_reaction: nextReaction };
    })
  );

  try {
    const { data: existing } = await supabase
      .from('comment_likes')
      .select('id, reaction')
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id);

    const hasSame = existing?.some((r: any) => r.reaction === kind);

    await supabase
      .from('comment_likes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', currentUser.id);

    if (!hasSame) {
      await supabase.from('comment_likes').insert({
        comment_id: commentId,
        user_id: currentUser.id,
        reaction: kind
      });
    }
  } catch {
    // Revert
    setCommentsList((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, like_count: previousLikes, dislike_count: previousDislikes, my_reaction: previousReaction }
          : c
      )
    );
  }
};

  // 4. Send new comment with instant counter update
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigate('auth');
      return;
    }
    const text = newCommentText.trim();
    if (!text || text.length > 250) return;

    setIsSubmittingComment(true);

    // Optimistic comment item
    const tempId = 'temp-' + Date.now();
    const optimisticComment: CommentItem = {
      id: tempId,
      review_id: review.id,
      user_id: currentUser.id,
      body: text,
      created_at: new Date().toISOString(),
      users: {
        username: currentUser.username,
        avatar_url: currentUser.avatar_url
      }
    };

    setCommentsList((prev) => [...prev, optimisticComment]);
    setCommentsCount((prev) => prev + 1);
    setNewCommentText('');

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          review_id: review.id,
          user_id: currentUser.id,
          body: text
        })
        .select('id, created_at')
        .single();

      if (error) throw error;
      if (data) {
        setCommentsList((prev) =>
          prev.map((c) => (c.id === tempId ? { ...c, id: data.id, created_at: data.created_at } : c))
        );

        // Notify author of omnipost (charlas de parada)
        if (review.user_id && review.user_id !== currentUser.id) {
          const previewText = text.slice(0, 50);
          await pushNotification({
            user_id: review.user_id,
            kind: 'comment',
            body: `@${currentUser.username} comentó en tu charla de parada: "${previewText}${text.length > 50 ? '…' : ''}"`,
            review_id: review.id
          });
        }

        // Notify mentioned users (@usuario)
        const mentions: string[] = Array.from(
          new Set((text.match(/@([a-zA-Z0-9_-]+)/g) || []).map((m: string) => m.slice(1).toLowerCase()))
        );
        for (const targetName of mentions) {
          if (currentUser.username && targetName !== currentUser.username.toLowerCase()) {
            try {
              const { data: targetUser } = await supabase
                .from('users')
                .select('id')
                .ilike('username', targetName)
                .maybeSingle();

              if (targetUser?.id) {
                await pushNotification({
                  user_id: targetUser.id,
                  kind: 'mention',
                  body: `@${currentUser.username} te mencionó en una charla de parada`,
                  review_id: review.id
                });
              }
            } catch {
              // Notification insert is best-effort
            }
          }
        }
      }
    } catch (err: any) {
      // Revert optimistic on fail
      setCommentsList((prev) => prev.filter((c) => c.id !== tempId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      alert(err.message || 'No se pudo publicar la charla');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Edit comment within 10 min
  const handleSaveCommentEdit = async (commentId: string) => {
    const trimmed = editCommentBody.trim();
    if (!trimmed) return;
    setIsSavingCommentEdit(true);
    try {
      const { error } = await supabase
        .from('comments')
        .update({ body: trimmed })
        .eq('id', commentId);

      if (error) throw error;

      setCommentsList((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, body: trimmed } : c))
      );
      setEditingCommentId(null);
      setEditCommentBody('');
    } catch (e: any) {
      alert(e.message || 'Error al actualizar la charla');
    } finally {
      setIsSavingCommentEdit(false);
    }
  };

  // Delete comment within 10 min
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Borrar esta charla?')) return;
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setCommentsList((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));

      // Dynamically remove notification if user has no other comments remaining on this review
      if (currentUser && review.user_id && review.user_id !== currentUser.id) {
        const { count } = await supabase
          .from('comments')
          .select('id', { count: 'exact', head: true })
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);

        if (!count || count === 0) {
          await removeNotificationsByReviewAndKind(
            review.user_id,
            review.id,
            'comment',
            `@${currentUser.username}`
          );
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error al borrar');
    }
  };

  // Delete review (if own & <= 15 min)
  const handleDeleteReview = async () => {
    if (!confirm('¿Borrar este omnipost?')) return;
    try {
      // Clean up all notifications linked to this review
      if (review.user_id) {
        await removeNotificationsByReviewAndKind(review.user_id, review.id, 'all');
      }
      await supabase.from('notifications').delete().eq('review_id', review.id);
      window.dispatchEvent(new CustomEvent('omniboxd_notifications_changed'));

      await supabase.from('reviews').delete().eq('id', review.id);
      if (onReviewUpdated) onReviewUpdated();
    } catch (e: any) {
      alert(e.message || 'Error al borrar');
    }
  };

  // Save edited review
  const handleSaveReviewEdit = async () => {
    if (!editedBody.trim()) return;
    try {
      await supabase.from('reviews').update({ body: editedBody.trim() }).eq('id', review.id);
      review.body = editedBody.trim();
      setIsEditingReview(false);
      if (onReviewUpdated) onReviewUpdated();
    } catch (e: any) {
      alert(e.message || 'Error al editar');
    }
  };

  // Open sleek custom reactors modal (no native browser alert)
  const handleShowReactors = () => {
    setIsReactorsModalOpen(true);
  };

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5 text-sm" title={`${rating} estrellas`}>
        {[1, 2, 3, 4, 5].map((i) => {
          if (i <= full) return <span key={i} className="text-emerald-400">★</span>;
          if (i === full + 1 && hasHalf) return <span key={i} className="text-emerald-400/70">★</span>;
          return <span key={i} className="text-[var(--text-dim)]">★</span>;
        })}
      </div>
    );
  };

  return (
    <article className="review-card bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm hover:border-[var(--border-soft)] transition-all">
      {/* Transbordo badge if reposted */}
      {review.reposted_by && (
        <div className="px-3.5 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
          <Repeat className="w-3.5 h-3.5" />
          <span>Transbordo de @{review.reposted_by}</span>
        </div>
      )}

      <div className="p-3.5 sm:p-4">
        {/* Card top: Line badge + Rating */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={() => review.lines?.id && onNavigate('line', review.lines.id)}
            className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-black/80 border border-amber-400/40 text-amber-300 font-mono font-bold text-sm tracking-wide cursor-pointer hover:border-amber-400 transition-colors"
          >
            <span>{lineNumber}</span>
            <span
              className="text-[10px] font-sans font-medium px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: companyColor }}
            >
              {companyName}
            </span>
          </button>

          <StarRating rating={review.rating} size="sm" colorClass={starColor} />
        </div>

        {/* Route destination / bus car number */}
        {(review.route_label || review.vehicle_number) && (
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-[var(--text-muted)] font-medium">
            {review.route_label && (
              <span className="inline-flex items-center gap-1 bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
                📍 {review.route_label}
              </span>
            )}
            {review.vehicle_number && (
              <span className="inline-flex items-center gap-1 bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)] font-mono">
                <Bus className="w-3 h-3 text-amber-400" />
                Coche #{review.vehicle_number}
              </span>
            )}
          </div>
        )}

        {/* Review body */}
        {isEditingReview ? (
          <div className="my-2 space-y-2">
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-sm rounded-lg p-2.5 text-[var(--text)] focus:border-amber-400 focus:outline-none"
              rows={3}
              maxLength={750}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditingReview(false)}
                className="flat-btn text-xs py-1 px-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReviewEdit}
                className="flat-btn text-xs py-1 px-2.5 bg-emerald-500 text-black font-semibold border-emerald-400"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--text)] leading-relaxed my-2.5 whitespace-pre-wrap break-words">
            {review.body}
          </p>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 my-2.5">
            {review.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)]"
              >
                {t.emoji ? `${t.emoji} ` : ''}{t.label}
              </span>
            ))}
          </div>
        )}

        {/* Author actions (Edit / Delete if own & within 15 min) */}
        {isOwnReview && canEditReview() && (
          <div className="flex gap-1.5 my-2">
            <button
              onClick={() => setIsEditingFullReview(true)}
              className="flat-btn text-[11px] py-1 px-2 hover:text-amber-400"
              title="Editar omniposteo completo"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
            <button
              onClick={handleDeleteReview}
              className="flat-btn text-[11px] py-1 px-2 hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
              <span>Borrar</span>
            </button>
          </div>
        )}

        {/* Flat Buttons Action Bar (Chiflidos, Bajadas, Charlas, Transbordo, Compartir) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 mt-1 border-t border-[var(--border-soft)]">
          {/* Chiflido (Likes) */}
          <button
            onClick={() => handleReaction('like')}
            disabled={isOwnReview}
            className={`flat-btn flat-btn-chiflido ${myReaction === 'like' ? 'active' : ''}`}
            title={isOwnReview ? 'No podés chiflar tu propio viaje' : 'Chiflido (aplauso / me gusta)'}
          >
            <span className="text-xs leading-none">🗣️</span>
            <span>{likesCount}</span>
          </button>

          {/* Bajada (Dislikes) */}
          <button
            onClick={() => handleReaction('dislike')}
            disabled={isOwnReview}
            className={`flat-btn flat-btn-bajada ${myReaction === 'dislike' ? 'active' : ''}`}
            title={isOwnReview ? 'No podés dar bajada a tu propio viaje' : 'Bajada (no me gusta)'}
          >
            <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{dislikesCount}</span>
          </button>

          {/* Charlas de parada (Comments) */}
          <button
            onClick={handleToggleComments}
            className={`flat-btn flat-btn-charla ${commentsOpen ? 'active' : ''}`}
            title="Charlas de parada (comentarios)"
          >
            <Signpost className="w-3.5 h-3.5" />
            <span>{commentsCount}</span>
          </button>

          {/* Transbordo (Repost) */}
          <button
            onClick={handleToggleRepost}
            disabled={isOwnReview}
            className={`flat-btn flat-btn-transbordo ${isReposted ? 'active' : ''}`}
            title={isOwnReview ? 'Transbordo' : isReposted ? 'Quitar transbordo' : 'Hacer transbordo a tu perfil'}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>{repostsCount}</span>
          </button>

          {/* Compartir (HD Card) */}
          <button
            onClick={() => onOpenShare(review)}
            className="flat-btn hover:text-amber-400"
            title="Compartir tarjeta de viaje"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Ver quiénes interactuaron (Solo el propio autor) */}
          {isOwnReview && (
            <button
              onClick={handleShowReactors}
              className="flat-btn hover:text-amber-400 ml-auto"
              title="Ver quiénes chiflaron, bajaron o hicieron transbordo a tu viaje"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

{!commentsOpen && latestComment && (
  <button
    type="button"
    onClick={() => handleToggleComments()}
    className="w-full mt-2.5 p-2.5 rounded-lg bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-sky-400/40 transition-all text-left cursor-pointer group"
  >
    <div className="flex items-start gap-2">
      <Signpost className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[11px] font-semibold text-[var(--text)]">
            @{latestComment.users?.username || 'viajero'}
          </span>
          {latestComment.users?.profile_flair && (
            <span className={`profile-flair profile-flair-${latestComment.users.profile_flair.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ó/g, 'o')}`}>
              {latestComment.users.profile_flair}
            </span>
          )}
          <span className="text-[10px] text-[var(--text-dim)]">
            {formatTime24h(latestComment.created_at)} hs
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-snug">
          {latestComment.body}
        </p>
        {commentsCount > 1 && (
          <span className="text-[10px] text-sky-400 font-semibold mt-1 inline-block group-hover:underline">
            Ver las {commentsCount} charlas de parada →
          </span>
        )}
      </div>
    </div>
  </button>
)}

        {/* Expandable Charlas de Parada (Comments section) */}
        {commentsOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] bg-[var(--surface-2)] rounded-lg p-3 animate-in fade-in duration-150">
            <h4 className="text-xs font-display font-bold text-sky-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Charlas de parada ({commentsCount})</span>
            </h4>

            {/* Comments list */}
            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {isLoadingComments ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2">Cargando charlas…</p>
              ) : commentsList.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-2 italic">
                  Sé el primero en tirar una charla de parada.
                </p>
              ) : (
                commentsList.map((c) => {
                  const isAuthor = currentUser && c.user_id === currentUser.id;
                  const canEdit = isAuthor && (Date.now() - new Date(c.created_at).getTime()) <= 10 * 60 * 1000;
                  const isBeingEdited = editingCommentId === c.id;

                  return (
                    <div key={c.id} className="text-xs bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--border)]">
<div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] mb-1.5">
  <button
    onClick={() => onNavigate('profile', c.users?.username)}
    className="font-medium text-[var(--text)] hover:text-amber-400 cursor-pointer inline-flex items-center gap-2 flex-wrap"
  >
    {(() => {
      const commentLevel = (c.users as any)?.achievement_level || 0.5;
      const commentBorderCls = commentLevel >= 4.5
        ? 'avatar-border-premium'
        : commentLevel >= 3.5
          ? 'avatar-border-silver'
          : commentLevel >= 1.5
            ? 'avatar-border-bronze'
            : 'border-[var(--border)]';
      return (c.users as any)?.avatar_url ? (
        <img
          src={(c.users as any).avatar_url}
          alt={c.users?.username || 'viajero'}
          className={`w-5 h-5 rounded-full object-cover border ${commentBorderCls} shrink-0`}
        />
      ) : (
        <div className={`w-5 h-5 rounded-full bg-[var(--surface-2)] border text-amber-400 font-bold text-[9px] flex items-center justify-center shrink-0 ${commentBorderCls}`}>
          {(c.users?.username || 'v').charAt(0).toUpperCase()}
        </div>
      );
    })()}
    <span>@{c.users?.username || 'viajero'}</span>
    {c.users?.profile_flair && (
      <span className={`profile-flair profile-flair-${c.users.profile_flair.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ó/g, 'o')}`}>
        {c.users.profile_flair}
      </span>
    )}
  </button>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--text-dim)]">
                            {formatTime24h(c.created_at)} hs
                          </span>
                          {canEdit && !isBeingEdited && (
                            <div className="flex items-center gap-1 ml-1 border-l border-[var(--border)] pl-1.5">
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditCommentBody(c.body);
                                }}
                                className="text-sky-400 hover:text-sky-300 p-0.5 cursor-pointer"
                                title="Editar charla (dentro de los 10 min)"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                                title="Borrar charla"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {isBeingEdited ? (
                        <div className="mt-1.5 space-y-1.5">
                          <input
                            type="text"
                            value={editCommentBody}
                            onChange={(e) => setEditCommentBody(e.target.value)}
                            maxLength={250}
                            className="w-full bg-[var(--surface-2)] border border-sky-400/60 rounded px-2 py-1 text-xs text-[var(--text)] focus:outline-none"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentBody('');
                              }}
                              className="px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={!editCommentBody.trim() || isSavingCommentEdit}
                              onClick={() => handleSaveCommentEdit(c.id)}
                              className="px-2 py-0.5 rounded text-[10px] bg-sky-500 hover:bg-sky-400 text-black font-bold cursor-pointer disabled:opacity-50"
                            >
                              {isSavingCommentEdit ? 'Guardando…' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <CommentBody text={c.body} onNavigate={onNavigate} />
                        
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border-soft)]">
  <button
    type="button"
    disabled={c.user_id === currentUser?.id}
    onClick={() => handleCommentReaction(c.id, 'like')}
    className={`flat-btn flat-btn-chiflido text-[10px] py-0.5 px-1.5 ${c.my_reaction === 'like' ? 'active' : ''}`}
    title={c.user_id === currentUser?.id ? 'No podés chiflar tu propia charla' : 'Chiflido'}
  >
    <span className="text-[10px] leading-none">🗣️</span>
    <span>{c.like_count || 0}</span>
  </button>
  <button
    type="button"
    disabled={c.user_id === currentUser?.id}
    onClick={() => handleCommentReaction(c.id, 'dislike')}
    className={`flat-btn flat-btn-bajada text-[10px] py-0.5 px-1.5 ${c.my_reaction === 'dislike' ? 'active' : ''}`}
    title={c.user_id === currentUser?.id ? 'No podés dar bajada a tu propia charla' : 'Bajada'}
  >
    <ArrowDown className="w-2.5 h-2.5 stroke-[2.5]" />
    <span>{c.dislike_count || 0}</span>
  </button>
</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handleSendComment} className="flex gap-1.5 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Charla de parada (máx. 250)… podés usar @usuario"
                  maxLength={250}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-sky-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment}
                className="flat-btn bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs py-1.5 px-3 border-sky-400"
              >
                <Send className="w-3 h-3" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        )}

        {/* Modal de Reacciones y Transbordos */}
        <ReactorsModal
          isOpen={isReactorsModalOpen}
          onClose={() => setIsReactorsModalOpen(false)}
          reviewId={review.id}
          onNavigate={onNavigate}
        />

        {/* Modal de Edición Completa del Omniposteo */}
        {isEditingFullReview && (
          <NewReviewModal
            isOpen={isEditingFullReview}
            onClose={() => setIsEditingFullReview(false)}
            currentUser={currentUser}
            initialLineId={review.lines?.id || null}
            editReview={review}
            onReviewCreated={() => {
              setIsEditingFullReview(false);
              if (onReviewUpdated) onReviewUpdated();
            }}
            onNavigateToAuth={() => onNavigate('auth')}
          />
        )}

        {/* Card footer: Author & time */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[var(--border-soft)] text-xs text-[var(--text-muted)]">
          {/* Author info */}
          <button
            onClick={() => onNavigate('profile', authorName)}
            className="flex items-center gap-2 group cursor-pointer"
          >
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className={`w-6 h-6 rounded-full object-cover border group-hover:border-amber-400 transition-colors ${avatarBorderClass}`}
              />
            ) : (
              <div className={`w-6 h-6 rounded-full bg-[var(--surface-2)] border text-amber-400 font-bold text-xs flex items-center justify-center group-hover:border-amber-400 transition-colors ${avatarBorderClass}`}>
                {authorName.charAt(0).toUpperCase()}
              </div>
            )}
<span className="inline-flex items-center gap-2 flex-wrap">
  <span
    className={`font-medium text-[var(--text)] group-hover:text-amber-400 transition-colors ${authorLevel >= 5 ? 'username-legend' : ''}`}
    style={authorLevel >= 5 ? undefined : review.users?.username_color ? { color: review.users.username_color } : undefined}
  >
    @{authorName}
  </span>
  {review.users?.profile_flair && (
    <span className={`profile-flair ${flairClass}`}>{review.users.profile_flair}</span>
  )}
  {(() => {
    // Insignias de categoría completa del autor (vienen de users.visible_badges).
    // El nivel decide cuántas puede mostrar; como visible_badges solo guarda
    // las de categoría completa, respetamos ese tope.
    const badges = review.users?.visible_badges || [];
    if (badges.length === 0) return null;
    const maxByLevel = authorLevel >= 5
      ? Infinity
      : authorLevel >= 4.5
        ? 4
        : authorLevel >= 4
          ? 3
          : authorLevel >= 3.5
            ? 3
            : authorLevel >= 3
              ? 2
              : authorLevel >= 2.5
                ? 2
                : authorLevel >= 2
                  ? 1
                  : authorLevel >= 1.5
                    ? 1
                    : 0;
    if (maxByLevel === 0) return null;
    return (
      <span className="inline-flex items-center gap-1">
        {badges.slice(0, maxByLevel).map((slug) => (
          <OmniboxdBadge key={slug} slug={slug} complete />
        ))}
      </span>
    );
  })()}
</span>
          </button>

          {/* Timestamps (Ocurrido / Publicado with hour and minute) */}
          <div className="flex flex-col items-end text-[11px] text-[var(--text-dim)] leading-tight text-right">
            {(() => {
              const tripInfo = formatTripDate(review.trip_date);
              const pubInfo = formatPublicationDate(review.created_at);

              if (tripInfo) {
                return (
                  <>
                    <div className="flex items-center gap-1 text-[var(--text-muted)] font-medium">
                      <Clock className="w-3 h-3 text-amber-400/90 shrink-0" />
                      <span>
                        Ocurrido el {tripInfo.date}
                        {tripInfo.time ? `, ${tripInfo.time} hs` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-dim)] mt-0.5">
                      <span>
                        Publicado el {pubInfo.date}, {pubInfo.time} hs
                      </span>
                    </div>
                  </>
                );
              }

              return (
                <div className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Clock className="w-3 h-3 text-[var(--text-dim)] shrink-0" />
                  <span>
                    Publicado el {pubInfo.date}, {pubInfo.time} hs
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </article>
  );
};