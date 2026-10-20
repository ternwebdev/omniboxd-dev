import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Hash, TrendingUp, Filter } from 'lucide-react';
import { ReviewItem, UserProfile } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { fetchReviewsByTag, fetchTagMetadata } from '../lib/supabase';

interface TagViewProps {
  currentUser: UserProfile | null;
  tagSlug: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenShare: (review: ReviewItem) => void;
}

export const TagView: React.FC<TagViewProps> = ({
  currentUser,
  tagSlug,
  onNavigate,
  onOpenShare
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [tagMeta, setTagMeta] = useState<{
    label: string;
    emoji?: string;
    category?: string;
    usageCount: number;
  } | null>(null);
  const PAGE_SIZE = 30;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Cargar metadata del tag
  useEffect(() => {
    let cancelled = false;
    fetchTagMetadata(tagSlug).then((meta) => {
      if (!cancelled && meta) {
        setTagMeta({
          label: meta.label,
          emoji: meta.emoji,
          category: meta.category,
          usageCount: meta.usageCount
        });
      }
    });
    return () => { cancelled = true; };
  }, [tagSlug]);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setHasMore(true);
    try {
      const data = await fetchReviewsByTag(tagSlug, currentUser?.id, 0, PAGE_SIZE);
      setReviews(data);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (e) {
      console.error('Error loading tag reviews:', e);
    } finally {
      setIsLoading(false);
    }
  }, [tagSlug, currentUser?.id]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchReviewsByTag(tagSlug, currentUser?.id, reviews.length, PAGE_SIZE);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setReviews((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const filtered = data.filter((r) => !existingIds.has(r.id));
          return [...prev, ...filtered];
        });
        setHasMore(data.length >= PAGE_SIZE);
      }
    } catch (e) {
      console.error('Error loading more tag reviews:', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [tagSlug, currentUser?.id, reviews.length, isLoadingMore, hasMore, isLoading]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadMore]);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      {/* Botón volver */}
      <button
        onClick={() => onNavigate('feed')}
        className="flat-btn text-xs py-1.5 px-3 hover:text-amber-400 cursor-pointer inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver al inicio</span>
      </button>

      {/* Header del tag */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-3xl shrink-0">
            {tagMeta?.emoji || '🏷️'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              Etiqueta
            </span>
            <h1 className="font-display font-bold text-xl text-[var(--text)] mt-1">
              {tagMeta?.label || tagSlug}
            </h1>
            {tagMeta?.category && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">
                Categoría: {tagMeta.category}
              </p>
            )}
          </div>
        </div>

        {tagMeta && (
          <div className="flex items-center gap-3 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                <strong className="text-[var(--text)]">{tagMeta.usageCount}</strong>{' '}
                {tagMeta.usageCount === 1 ? 'omniposteo' : 'omniposteos'}
              </span>
            </div>
            <span className="text-[var(--border)]">·</span>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-sky-400" />
              <span>Ordenados por más recientes</span>
            </div>
          </div>
        )}
      </div>

      {/* Lista de reviews */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl bg-[var(--surface)] border border-[var(--border)] animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="h-5 w-28 bg-[var(--surface-2)] rounded" />
              <div className="h-10 w-full bg-[var(--surface-2)] rounded my-2" />
              <div className="h-4 w-40 bg-[var(--surface-2)] rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-2xl">
            {tagMeta?.emoji || '🏷️'}
          </div>
          <h3 className="font-display font-bold text-base text-[var(--text)] mb-1">
            Todavía no hay omniposteos con esta etiqueta
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
            Sé la primera persona en usar <strong>{tagMeta?.emoji} {tagMeta?.label || tagSlug}</strong> en un viaje.
          </p>
          <button
            onClick={() => onNavigate('feed')}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              currentUser={currentUser}
              onNavigate={onNavigate}
              onOpenShare={onOpenShare}
              onReviewUpdated={loadReviews}
            />
          ))}

          <div ref={loadMoreRef} className="h-4" />

          {isLoadingMore && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
              <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span>Cargando más viajes…</span>
            </div>
          )}

          {!hasMore && reviews.length > 0 && (
            <div className="py-6 text-center text-xs text-[var(--text-dim)] italic">
              — Llegaste al final —
            </div>
          )}
        </div>
      )}
    </div>
  );
};