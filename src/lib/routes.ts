import { BusLine } from '../types';

/**
 * Returns all registered routes for a bus line.
 * Handles both the modern `routes` column (array of destinations or objects)
 * and classic `origin` / `destination` fields, without inventing phantom arrows or placeholder labels.
 */
export function invertRoute(routeStr: string): string | null {
  if (!routeStr || typeof routeStr !== 'string') return null;
  const s = routeStr.trim();
  const sep = s.includes(' → ') ? ' → ' : s.includes(' -> ') ? ' -> ' : s.includes(' - ') ? ' - ' : null;
  if (!sep) return null;
  const parts = s.split(sep);
  if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
    return `${parts[1].trim()} → ${parts[0].trim()}`;
  }
  return null;
}

/**
 * Takes multiline text of routes, generates reverse routes for any 'A -> B' or 'A - B',
 * adds them if not already present, and returns the updated text.
 */
export function addInvertedRoutes(routesText: string): { updatedText: string; addedCount: number } {
  const lines = routesText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const existingSet = new Set(lines.map((l) => l.toLowerCase()));
  const newLines = [...lines];
  let addedCount = 0;

  for (const line of lines) {
    const inverted = invertRoute(line);
    if (inverted && !existingSet.has(inverted.toLowerCase())) {
      newLines.push(inverted);
      existingSet.add(inverted.toLowerCase());
      addedCount++;
    }
  }

  return {
    updatedText: newLines.join('\n'),
    addedCount
  };
}

export function getLineRoutes(line?: BusLine | null): string[] {
  if (!line) return [];
  const routesList: string[] = [];

  // 1. Process routes array, json or plain text stored in line.routes
  const rawRoutes = line.routes;
  if (rawRoutes) {
    if (Array.isArray(rawRoutes)) {
      rawRoutes.forEach((r: any) => {
        if (typeof r === 'object' && r && (r.origin || r.destination)) {
          if (r.origin && r.destination) {
            routesList.push(`${r.origin.trim()} → ${r.destination.trim()}`);
          } else {
            routesList.push((r.origin || r.destination || '').trim());
          }
        } else if (typeof r === 'string' && r.trim()) {
          routesList.push(r.trim());
        }
      });
    } else if (typeof rawRoutes === 'string') {
      try {
        const parsed = JSON.parse(rawRoutes);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: any) => {
            if (typeof r === 'object' && r && (r.origin || r.destination)) {
              if (r.origin && r.destination) {
                routesList.push(`${r.origin.trim()} → ${r.destination.trim()}`);
              } else {
                routesList.push((r.origin || r.destination || '').trim());
              }
            } else if (typeof r === 'string' && r.trim()) {
              routesList.push(r.trim());
            }
          });
        } else if (typeof parsed === 'string' && parsed.trim()) {
          routesList.push(parsed.trim());
        }
      } catch {
        rawRoutes
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => routesList.push(s));
      }
    }
  }

  // 2. If both origin and destination exist and are non-empty, preserve as base route
  if (line.origin && line.destination && line.origin.trim() && line.destination.trim()) {
    const base = `${line.origin.trim()} → ${line.destination.trim()}`;
    if (!routesList.includes(base)) {
      routesList.unshift(base);
    }
  } else if (routesList.length === 0) {
    // Only if routesList is empty, fall back to whatever single field exists
    const single = (line.origin || line.destination || '').trim();
    if (single) {
      routesList.push(single);
    }
  }

  // 3. Clean up arrows, double spaces, and deduplicate
  const cleaned = routesList
    .map((r) => r.replace(/\s*->\s*/g, ' → ').replace(/\s+/g, ' ').trim())
    .filter((r) => r.length > 0 && r !== '→');

  return Array.from(new Set(cleaned));
}
