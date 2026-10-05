import React, { useEffect, useState, useRef } from 'react';
import { X, Bus } from 'lucide-react';
import { ReviewItem, UserProfile } from '../types';
import { fetchSingleReview } from '../lib/supabase';
import { ReviewCard } from './ReviewCard';
import { useScrollLock } from '../lib/scrollLock';

interface SingleReviewModalProps {
  reviewId: string | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onNavigate: (view: string, param?: string) => void;
  onOpenShare: (review: ReviewItem) => void;
}

export const SingleReviewModal: React.FC<SingleReviewModalProps> = ({
  reviewId,
  currentUser,
  onClose,
  onNavigate,
  onOpenShare
}) => {
  const [review, setReview] = useState<ReviewItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Lock background scroll when modal is active
  useScrollLock(Boolean(reviewId));

  // Back button popstate support for mobile/browser
  useEffect(() => {
    if (!reviewId) return;

    const modalSessionKey = 'omniboxd_single_review_' + Date.now();
    window.history.pushState({ modal: modalSessionKey }, '');

    let closedByPop = false;
    const handlePopState = () => {
      closedByPop = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!closedByPop && window.history.state?.modal === modalSessionKey) {
        window.history.back();
      }
    };
  }, [reviewId]);

  useEffect(() => {
    if (!reviewId) {
      setReview(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchSingleReview(reviewId, currentUser?.id)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setReview(res);
        } else {
          setError('No se pudo encontrar el omniposteo o fue eliminado.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Error al cargar el omniposteo.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reviewId, currentUser?.id]);

  if (!reviewId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 touch-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col touch-auto modal-scroll-area"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-2)]/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Bus className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-sm text-[var(--text)]">
              Omniposteo referenciado
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-7 h-7 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-muted)]">Cargando omniposteo…</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm text-red-400 font-medium">{error}</p>
              <button
                onClick={onClose}
                className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          ) : review ? (
            <ReviewCard
              review={review}
              currentUser={currentUser}
              onNavigate={(v, p) => {
                onClose();
                onNavigate(v, p);
              }}
              onOpenShare={onOpenShare}
              onReviewUpdated={() => {
                // Refresh single review
                if (reviewId) {
                  fetchSingleReview(reviewId, currentUser?.id).then((r) => r && setReview(r));
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

