import React from 'react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colorClass?: string;
  emptyColorClass?: string;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 'sm',
  colorClass = 'text-amber-400',
  emptyColorClass = 'text-[var(--text-dim)]',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const effectClass = colorClass.includes('violet')
    ? 'star-effect-inter'
    : colorClass.includes('sky')
      ? 'star-effect-difer'
      : colorClass.includes('slate')
        ? 'star-effect-stormy'
        : colorClass.includes('emerald')
          ? ''
          : 'star-effect-opaquestar';

  const stars = [];
  for (let i = 1; i <= max; i++) {
    const isFull = rating >= i;
    const isHalf = !isFull && rating >= i - 0.5;

    if (isFull) {
      stars.push(
          <span key={i} className={`${colorClass} ${effectClass} select-none leading-none`}>
          ★
        </span>
      );
    } else if (isHalf) {
      stars.push(
        <span
          key={i}
          className="relative inline-block select-none leading-none overflow-hidden align-middle"
          style={{ width: '1em', height: '1em' }}
        >
          {/* Base empty star */}
          <span className={`${emptyColorClass} absolute left-0 top-0 leading-none select-none`}>
            ★
          </span>
          {/* Exact 50% split colored star */}
          <span
            className={`${colorClass} ${effectClass} absolute left-0 top-0 overflow-hidden select-none leading-none whitespace-nowrap`}
            style={{ width: '50%' }}
          >
            ★
          </span>
        </span>
      );
    } else {
      stars.push(
        <span key={i} className={`${emptyColorClass} select-none leading-none`}>
          ★
        </span>
      );
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 leading-none ${sizeClasses[size]} ${className}`}
      title={`${rating} estrellas`}
      aria-label={`${rating} de ${max} estrellas`}
    >
      {stars}
    </div>
  );
};
