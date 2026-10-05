import React from 'react';
import { Trash2, ChevronDown, ChevronUp, Bus } from 'lucide-react';
import { BusLine, ReviewTag, TagCategory } from '../types';
import { DEFAULT_TAGS, BUS_COMPANIES } from '../lib/constants';
import { getLineRoutes } from '../lib/routes';
import { getCurrentDateMax, getCurrentDateTimeMax } from '../lib/dateUtils';

export interface PataData {
  tempId: string;
  lineId: string;
  rating: number;
  body: string;
  selectedTags: string[];
  selectedType: string;
  selectedCompany: string;
  lineSearchQuery: string;
  routeLabel: string;
  vehicleNumber: string;
  tripDateMode: 'date' | 'datetime';
  tripDate: string;
  tripDateTime: string;
  showAllTags: boolean;
}

interface ComboPataFormProps {
  pata: PataData;
  index: number;
  lines: BusLine[];
  allTags: ReviewTag[];
  companiesList: any[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<PataData>) => void;
  onRemove: () => void;
}

export const ComboPataForm: React.FC<ComboPataFormProps> = ({
  pata,
  index,
  lines,
  allTags,
  companiesList,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove
}) => {
  const selectedLine = lines.find((l) => l.id === pata.lineId);
  const companyColor = selectedLine?.companies?.color || '#555f5e';
  const companyName = selectedLine?.companies?.short_name || '—';

  // Tipos únicos de todas las líneas
  const availableTypes: string[] = Array.from(
    new Set<string>(lines.map((l) => l.type).filter((t): t is string => Boolean(t)))
  ).sort();

  // Rutas de la línea actual
  const availableRoutes = selectedLine ? getLineRoutes(selectedLine) : [];

  // Filtro de líneas por tipo, empresa y query
  const filteredLines = lines.filter((l) => {
    if (pata.selectedType && l.type?.toLowerCase() !== pata.selectedType.toLowerCase()) return false;
    if (pata.selectedCompany) {
      const matchCompId = l.company_id === pata.selectedCompany;
      const matchCompShort = l.companies?.short_name?.toLowerCase() === pata.selectedCompany.toLowerCase();
      const matchCompName = l.companies?.name?.toLowerCase() === pata.selectedCompany.toLowerCase();
      if (!matchCompId && !matchCompShort && !matchCompName) return false;
    }
    if (pata.lineSearchQuery) {
      const q = pata.lineSearchQuery.toLowerCase();
      const numMatch = l.number.toLowerCase().includes(q);
      const coMatch =
        l.companies?.short_name?.toLowerCase().includes(q) ||
        l.companies?.name?.toLowerCase().includes(q);
      const routesMatch = getLineRoutes(l).some((r) => r.toLowerCase().includes(q));
      return numMatch || coMatch || routesMatch;
    }
    return true;
  });

  // Actualizar ruta cuando cambia la línea
  React.useEffect(() => {
    if (!selectedLine) {
      onUpdate({ routeLabel: '' });
      return;
    }
    const routes = getLineRoutes(selectedLine);
    if (routes.length === 1 && !pata.routeLabel) {
      onUpdate({ routeLabel: routes[0] });
    }
  }, [pata.lineId]);

  const toggleTag = (slug: string) => {
    const next = pata.selectedTags.includes(slug)
      ? pata.selectedTags.filter((s) => s !== slug)
      : [...pata.selectedTags, slug];
    onUpdate({ selectedTags: next });
  };

  const selectedTripDateVal = pata.tripDateMode === 'date' ? pata.tripDate : pata.tripDateTime;

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--surface-2)] overflow-hidden">
      {/* Header colapsable */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-2 p-3 text-left hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
            {index + 1}
          </div>
          {selectedLine ? (
            <>
              <span
                className="px-2 py-0.5 rounded font-mono font-bold text-xs text-white shrink-0 shadow-sm"
                style={{ backgroundColor: companyColor }}
              >
                {selectedLine.number}
              </span>
              <span className="text-xs text-[var(--text-muted)] truncate">{companyName}</span>
              {pata.routeLabel && (
                <span className="text-[10px] text-[var(--text-dim)] truncate hidden sm:inline">
                  · {pata.routeLabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-[var(--text-dim)] italic">Sin línea seleccionada</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {pata.rating > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-400">
              {pata.rating.toFixed(1)} ★
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="p-3 border-t border-[var(--border)] space-y-4 bg-[var(--surface)]">

          {/* Cascading Filters: Tipo + Empresa */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Tipo (Opcional)
              </label>
              <select
                value={pata.selectedType}
                onChange={(e) => onUpdate({ selectedType: e.target.value, lineId: '' })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none capitalize"
              >
                <option value="">Todos los tipos</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Empresa (Opcional)
              </label>
              <select
                value={pata.selectedCompany}
                onChange={(e) => onUpdate({ selectedCompany: e.target.value, lineId: '' })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              >
                <option value="">Todas las empresas</option>
                {companiesList.map((c) => {
                  const sName = c.short_name || c.name;
                  return (
                    <option key={c.id || sName} value={sName}>
                      {c.name || sName}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Line Selection */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Línea de Ómnibus *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={pata.lineSearchQuery}
                onChange={(e) => onUpdate({ lineSearchQuery: e.target.value })}
                placeholder="Filtrar por número o destino…"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
              <select
                value={pata.lineId}
                onChange={(e) => onUpdate({ lineId: e.target.value })}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-medium"
              >
                <option value="">-- Elegí la línea ({filteredLines.length} disponibles) --</option>
                {filteredLines.slice(0, 100).map((line) => (
                  <option key={line.id} value={line.id}>
                    Línea {line.number} · {line.companies?.short_name || 'Bondi'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Variant */}
          <div>
            <label
              className={`text-[10px] font-semibold uppercase tracking-wider block mb-1 ${
                pata.lineId ? 'text-amber-400' : 'text-[var(--text-muted)]'
              }`}
            >
              Recorrido / Destino {availableRoutes.length > 1 ? '*' : '(Opcional)'}
            </label>
            <select
              value={pata.routeLabel}
              onChange={(e) => onUpdate({ routeLabel: e.target.value })}
              disabled={!pata.lineId}
              className={`w-full border rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-medium transition-all ${
                !pata.lineId
                  ? 'bg-[var(--surface-2)]/50 border-[var(--border)] opacity-50 cursor-not-allowed'
                  : 'bg-[var(--surface-2)] border-amber-400/50'
              }`}
            >
              {!pata.lineId ? (
                <option value="">-- Primero seleccioná una línea arriba --</option>
              ) : (
                <>
                  <option value="">
                    {availableRoutes.length > 0
                      ? `-- Elegí el recorrido (${availableRoutes.length} disponibles) --`
                      : '-- Sin recorridos preestablecidos --'}
                  </option>
                  {availableRoutes.map((r, i) => (
                    <option key={i} value={r}>
                      {r}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Coche + Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Nº de coche (Opcional)
              </label>
              <input
                type="text"
                value={pata.vehicleNumber}
                onChange={(e) => onUpdate({ vehicleNumber: e.target.value })}
                placeholder="Ej: 1042"
                maxLength={16}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  ¿Cuándo viajaste?
                </label>
                <div className="inline-flex rounded-md bg-[var(--surface-2)] border border-[var(--border)] p-0.5 text-[9px]">
                  <button
                    type="button"
                    onClick={() => onUpdate({ tripDateMode: 'date' })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer font-medium transition-all ${
                      pata.tripDateMode === 'date'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Fecha
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ tripDateMode: 'datetime' })}
                    className={`px-1.5 py-0.5 rounded cursor-pointer font-medium transition-all ${
                      pata.tripDateMode === 'datetime'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Fecha y hora
                  </button>
                </div>
              </div>

              {pata.tripDateMode === 'date' ? (
                <input
                  type="date"
                  value={pata.tripDate}
                  max={getCurrentDateMax()}
                  onChange={(e) => onUpdate({ tripDate: e.target.value })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              ) : (
                <input
                  type="datetime-local"
                  value={pata.tripDateTime}
                  max={getCurrentDateTimeMax()}
                  onChange={(e) => onUpdate({ tripDateTime: e.target.value })}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Rating completo */}
          <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Puntuación
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {pata.rating.toFixed(1)}
                </span>
                <span className="text-emerald-400 font-bold">★</span>
              </div>
            </div>

            {/* Estrellas visuales */}
            <div className="flex items-center justify-center gap-1.5 py-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => {
                const full = Math.floor(pata.rating);
                const hasHalf = pata.rating - full >= 0.5;
                const isFull = i <= full;
                const isHalf = i === full + 1 && hasHalf;

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => onUpdate({ rating: pata.rating === i ? i - 0.5 : i })}
                    className="text-2xl transition-all cursor-pointer hover:scale-115 focus:outline-none p-0.5"
                  >
                    {isFull ? (
                      <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)] leading-none select-none">★</span>
                    ) : isHalf ? (
                      <span
                        className="relative inline-block select-none leading-none overflow-hidden align-middle drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                        style={{ width: '1em', height: '1em' }}
                      >
                        <span className="text-[var(--text-dim)] absolute left-0 top-0 select-none leading-none">★</span>
                        <span
                          className="text-emerald-400 absolute left-0 top-0 overflow-hidden select-none leading-none whitespace-nowrap"
                          style={{ width: '50%' }}
                        >
                          ★
                        </span>
                      </span>
                    ) : (
                      <span className="text-[var(--text-dim)] hover:text-emerald-400/40 leading-none select-none">★</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Botones numéricos */}
            <div className="flex items-center gap-1 justify-center flex-wrap">
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => onUpdate({ rating: val })}
                  className={`px-1.5 py-0.5 text-[10px] rounded-md transition-all font-mono font-bold cursor-pointer ${
                    pata.rating === val
                      ? 'bg-emerald-400 text-black shadow-md scale-105 font-extrabold'
                      : 'text-[var(--text-muted)] hover:text-emerald-400 hover:bg-[var(--surface-hover)] border border-[var(--border-soft)]'
                  }`}
                >
                  {val.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Etiquetas / Vibe del viaje
              </label>
              <button
                type="button"
                onClick={() => onUpdate({ showAllTags: !pata.showAllTags })}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                {pata.showAllTags ? 'Ver menos' : `Ver más (${allTags.length})`}
              </button>
            </div>
            <div
              className={`flex flex-wrap gap-1.5 ${
                pata.showAllTags
                  ? 'max-h-40 overflow-y-auto p-1.5 bg-[var(--surface-2)]/40 rounded-lg border border-[var(--border)]'
                  : ''
              }`}
            >
              {(pata.showAllTags ? allTags : allTags.slice(0, 8)).map((tag) => {
                const isSelected = pata.selectedTags.includes(tag.slug);
                return (
                  <button
                    type="button"
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`text-[10px] py-1 px-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-300 font-bold'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                ¿Qué tal estuvo este tramo? *
              </label>
              <span className={`text-[10px] font-mono ${pata.body.length >= 700 ? 'text-amber-400' : 'text-[var(--text-dim)]'}`}>
                {pata.body.length}/750
              </span>
            </div>
            <textarea
              value={pata.body}
              onChange={(e) => onUpdate({ body: e.target.value })}
              placeholder="Contá cómo estuvo este tramo del viaje…"
              maxLength={750}
              rows={3}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Botón eliminar */}
          <button
            type="button"
            onClick={onRemove}
            className="w-full text-center text-[11px] text-red-400 hover:bg-red-500/10 py-1.5 rounded-lg border border-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3 h-3" />
            <span>Eliminar esta pata</span>
          </button>
        </div>
      )}
    </div>
  );
};