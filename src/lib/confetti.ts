import confetti from 'canvas-confetti';

/**
 * Confeti violeta para chiflidos en omnis de autor nivel 4.5+
 */
export function fireChiflidoConfettiAt(x: number, y: number, level: number) {
  const isLegend = level >= 5;

  confetti({
    particleCount: isLegend ? 50 : 25,
    spread: isLegend ? 70 : 45,
    origin: { x, y },
    colors: isLegend
      ? ['#fbbf24', '#f59e0b', '#c084fc', '#a855f7', '#e879f9']
      : ['#c084fc', '#a855f7', '#8b5cf6'],
    scalar: isLegend ? 1 : 0.8,
    gravity: 1.2,
    ticks: isLegend ? 120 : 80,
    disableForReducedMotion: true
  });
}