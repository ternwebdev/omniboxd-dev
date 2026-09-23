import React, { useState, useEffect, useRef } from 'react';
import { Search, Star, ArrowRight, ArrowLeft, Bus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { BusLine, ReviewItem, UserProfile } from '../types';
import { BUS_COMPANIES, COMPANY_COLORS } from '../lib/constants';
import { fetchAllLines, fetchAllCompanies, supabase } from '../lib/supabase';
import { ReviewCard } from '../components/ReviewCard';
import { getLineRoutes } from '../lib/routes';

export { getLineRoutes };

interface SearchViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenShare: (review: ReviewItem) => void;
  onOpenNewReviewForLine: (lineId: string) => void;
  selectedLineId?: string | null;
}

export const SearchView: React.FC<SearchViewProps> = ({
  currentUser,
  onNavigate,
  onOpenShare,
  onOpenNewReviewForLine,
  selectedLineId: propLineId
}) => {
  const [lines, setLines] = useState<BusLine[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>(BUS_COMPANIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(propLineId === 'favorites');
  const [activeLineId, setActiveLineId] = useState<string | null>(
    propLineId && propLineId !== 'favorites' ? propLineId : null
  );
  const [activeLineReviews, setActiveLineReviews] = useState<ReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [favoriteLineIds, setFavoriteLineIds] = useState<string[]>([]);

  // Sync prop changes (e.g. navigation with 'favorites' param)
  useEffect(() => {
    if (propLineId === 'favorites') {
      setOnlyFavorites(true);
      setActiveLineId(null);
    } else if (propLineId) {
      setActiveLineId(propLineId);
    }
  }, [propLineId]);

  // Filter horizontal scrolling refs & controls
  const companiesScrollRef = useRef<HTMLDivElement>(null);
  const typesScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const amount = direction === 'left' ? -220 : 220;
      ref.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const toggleCompany = (compName: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(compName) ? prev.filter((c) => c !== compName) : [...prev, compName]
    );
  };

  const toggleType = (typeName: string) => {
    const lower = typeName.toLowerCase();
    setSelectedTypes((prev) =>
      prev.includes(lower) ? prev.filter((t) => t !== lower) : [...prev, lower]
    );
  };

  // Load all bus lines and companies
  useEffect(() => {
    const load = async () => {
      const [linesData, compData] = await Promise.all([
        fetchAllLines(),
        fetchAllCompanies()
      ]);
      const sortedLines = [...linesData].sort((a, b) =>
  (a.number || '').localeCompare(b.number || '', 'es', { numeric: true, sensitivity: 'base' })
);
setLines(sortedLines);
      if (compData && compData.length > 0) {
        setCompaniesList(compData);
      }
    };
    load();
  }, []);

  // Load user favorites
  useEffect(() => {
    if (!currentUser) return;
    const loadFavorites = async () => {
      const { data } = await supabase
        .from('favorites')
        .select('line_id')
        .eq('user_id', currentUser.id);
      if (data) {
        setFavoriteLineIds(data.map((f: any) => f.line_id).filter(Boolean));
      }
    };
    loadFavorites();
  }, [currentUser]);

  // Load reviews for selected line
  useEffect(() => {
    if (!activeLineId) {
      setActiveLineReviews([]);
      return;
    }

    const loadLineReviews = async () => {
      setIsLoadingReviews(true);
      try {
        const { data } = await supabase
          .from('reviews')
          .select('id, rating, body, trip_date, route_label, vehicle_number, created_at, user_id, users(id, username, avatar_url), lines(id, number, company_id, companies(short_name, color, logo_url))')
          .eq('line_id', activeLineId)
          .order('created_at', { ascending: false });

        if (data) {
          const revs = data.map((r: any) => ({
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
            comment_count: 0,
            repost_count: 0
          }));
          setActiveLineReviews(revs);
        }
      } catch (err) {
        console.error('Error loading line reviews:', err);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    loadLineReviews();
  }, [activeLineId]);

  // Toggle favorite line
  const handleToggleFavorite = async (lineId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onNavigate('auth');
      return;
    }

    const isFav = favoriteLineIds.includes(lineId);
    if (isFav) {
      setFavoriteLineIds((prev) => prev.filter((id) => id !== lineId));
      await supabase.from('favorites').delete().eq('line_id', lineId).eq('user_id', currentUser.id);
    } else {
      setFavoriteLineIds((prev) => [...prev, lineId]);
      await supabase.from('favorites').insert({ line_id: lineId, user_id: currentUser.id });
    }
  };

  // Available line types from catalog
  const availableLineTypes: string[] = Array.from<string>(
    new Set(
      lines
        .map((l) => (l.type || 'urbana').trim().toLowerCase())
        .filter(Boolean)
    )
  ).sort();

  const filteredLines = lines.filter((l) => {
    // 0. Only favorites filter
    if (onlyFavorites) {
      if (!favoriteLineIds.includes(l.id)) return false;
    }

    // 1. Company multi-select filter
    if (selectedCompanies.length > 0) {
      const coName = l.companies?.short_name;
      const coId = l.company_id;
      const matchesCompany = (coName && selectedCompanies.includes(coName)) || (coId && selectedCompanies.includes(coId));
      if (!matchesCompany) return false;
    }

    // 2. Type multi-select filter
    if (selectedTypes.length > 0) {
      const lineType = (l.type || 'urbana').trim().toLowerCase();
      const matchesType = selectedTypes.includes(lineType);
      if (!matchesType) return false;
    }

    // 3. Search input: only matches line number or destination/routes (NO company search here)
if (searchQuery.trim()) {
  const q = searchQuery.toLowerCase().trim();
  const num = (l.number || '').toLowerCase();
  // Prefijo exacto: "l1" matchea "l1", "l1x", "l14" pero NO "ml1"
  const numMatch = num.startsWith(q);
  // Rutas/orígenes/destinos siguen siendo "includes" porque son texto libre
  const routesMatch = getLineRoutes(l).some((r) => r.toLowerCase().includes(q));
  const originMatch = (l as any).origin?.toLowerCase().includes(q);
  const destMatch = (l as any).destination?.toLowerCase().includes(q);
  return numMatch || routesMatch || originMatch || destMatch;
}

    return true;
  });

  const activeLine = lines.find((l) => l.id === activeLineId);

  // Calculate stats for active line
  const averageRating = activeLineReviews.length > 0
    ? (activeLineReviews.reduce((acc, r) => acc + r.rating, 0) / activeLineReviews.length).toFixed(1)
    : '—';

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      {/* If viewing a single line detail */}
      {activeLine ? (
        <div className="space-y-4">
          <button
            onClick={() => setActiveLineId(null)}
            className="flat-btn text-xs hover:text-amber-400 py-1.5 px-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al buscador</span>
          </button>

          {/* Line header summary */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {activeLine.companies?.logo_url && (
                  <img
                    src={activeLine.companies.logo_url}
                    alt={activeLine.companies.short_name || 'Empresa'}
                    className="w-10 h-10 rounded-lg object-contain bg-white p-1 border border-[var(--border)] shadow-xs shrink-0"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                )}
                <span
                  className="px-3.5 py-1.5 rounded-lg font-mono font-bold text-xl text-white shadow-sm"
                  style={{
                    backgroundColor: activeLine.companies?.color || COMPANY_COLORS[activeLine.companies?.short_name || ''] || '#555f5e'
                  }}
                >
                  {activeLine.number}
                </span>
                <div>
                  <h2 className="font-display font-bold text-lg text-[var(--text)] leading-tight">
                    {activeLine.companies?.name || activeLine.companies?.short_name || 'CUTCSA'}
                  </h2>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">
                    {activeLine.type || 'Línea urbana'}
                  </span>
                </div>
              </div>

              {/* Frecuente favorite button */}
              <button
                onClick={(e) => handleToggleFavorite(activeLine.id, e)}
                className={`flat-btn flat-btn-frecuente ${favoriteLineIds.includes(activeLine.id) ? 'active' : ''}`}
                title="Marcar como frecuente"
              >
                <Star className="w-4 h-4" />
                <span>{favoriteLineIds.includes(activeLine.id) ? 'Frecuente' : 'Guardar'}</span>
              </button>
            </div>

            {/* Average rating and review count */}
            <div className="flex items-center gap-4 py-2 border-y border-[var(--border-soft)] my-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold text-base">{averageRating}</span>
                <span className="text-[var(--text-muted)]">promedio</span>
              </div>
              <div className="text-[var(--text-muted)]">
                <strong className="text-[var(--text)]">{activeLineReviews.length}</strong> omniposts
              </div>
            </div>

            {/* Known routes */}
            {getLineRoutes(activeLine).length > 0 && (
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Recorridos registrados:
                </span>
                <div className="space-y-1">
                  {getLineRoutes(activeLine).map((r: string, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] px-2.5 py-1.5 rounded-md border border-[var(--border-soft)] flex items-center gap-2"
                    >
                      <span className="text-amber-400 text-xs">📍</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick action: Review this line */}
            <button
              onClick={() => onOpenNewReviewForLine(activeLine.id)}
              className="mt-4 w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer"
            >
              + Publicar omnipost de la línea {activeLine.number}
            </button>
          </div>

          {/* Line reviews list */}
          <h3 className="font-display font-bold text-sm text-[var(--text)] uppercase tracking-wider pt-2">
            Reseñas de la línea {activeLine.number}
          </h3>

          {isLoadingReviews ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-6">Cargando viajes…</p>
          ) : activeLineReviews.length === 0 ? (
            <div className="text-center py-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <p className="text-xs text-[var(--text-muted)]">Todavía no hay reseñas de esta línea.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLineReviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  currentUser={currentUser}
                  onNavigate={onNavigate}
                  onOpenShare={onOpenShare}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Main search view */
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">
                Buscar líneas
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Encontrá cualquier línea de Montevideo y el área metropolitana
              </p>
            </div>

            {/* Quick button: Mis frecuentes */}
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onNavigate('auth');
                  return;
                }
                setOnlyFavorites((prev) => !prev);
              }}
              className={`text-xs py-1.5 px-3 rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shrink-0 border ${
                onlyFavorites
                  ? 'border-amber-400 text-amber-300 bg-amber-400/20 font-bold shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/50'
              }`}
              title={currentUser ? 'Filtrar solo mis líneas frecuentes' : 'Iniciá sesión para ver tus frecuentes'}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Mis frecuentes</span>
              {currentUser && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none ${
                    onlyFavorites
                      ? 'bg-amber-400 text-black'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {favoriteLineIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Search input (only by number or route/destination) */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por número o destino… ej: 103, 183, Pocitos, Portones"
              className="w-full pl-9 pr-3 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] focus:border-amber-400 focus:outline-none shadow-sm"
            />
          </div>

          {/* Active favorites banner */}
          {onlyFavorites && (
            <div className="p-2.5 px-3 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between gap-2 text-xs text-amber-300 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>
                  Mostrando tus <strong>{filteredLines.length}</strong> {filteredLines.length === 1 ? 'línea frecuente' : 'líneas frecuentes'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className="text-[11px] text-amber-400 underline hover:text-amber-200 cursor-pointer font-medium"
              >
                Ver todas
              </button>
            </div>
          )}

          {/* Company filter chips (Multi-select) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Empresas {selectedCompanies.length > 0 && `(${selectedCompanies.length} seleccionada${selectedCompanies.length > 1 ? 's' : ''})`}
              </span>
              {selectedCompanies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCompanies([])}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={() => scrollContainer(companiesScrollRef, 'left')}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Empresas anteriores"
                aria-label="Empresas anteriores"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div
                ref={companiesScrollRef}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll-x select-none min-w-0"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCompanies([])}
                  className={`flat-btn text-[11px] py-1 px-2.5 rounded-full cursor-pointer shrink-0 transition-all ${
                    selectedCompanies.length === 0
                      ? 'is-active !border-amber-400 !text-amber-400 !bg-amber-400/25 font-bold shadow-xs'
                      : 'hover:border-[var(--text-muted)]'
                  }`}
                >
                  Todas
                </button>
                {companiesList.map((c) => {
                  const sName = c.short_name || c.name;
                  const isSelected = selectedCompanies.includes(sName);
                  return (
                    <button
                      key={c.id || sName}
                      type="button"
                      onClick={() => toggleCompany(sName)}
                      className={`flat-btn text-[11px] py-1 px-2.5 rounded-full cursor-pointer shrink-0 flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'is-active !border-amber-400 !text-amber-400 !bg-amber-400/25 font-bold shadow-xs ring-1 ring-amber-400/50'
                          : 'hover:border-[var(--text-muted)]'
                      }`}
                    >
                      {c.logo_url && (
                        <img
                          src={c.logo_url}
                          alt={sName}
                          className="w-3.5 h-3.5 object-contain rounded-xs shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                      <span>{sName}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollContainer(companiesScrollRef, 'right')}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Más empresas"
                aria-label="Más empresas"
              >
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Line Type filter chips (Multi-select) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Tipo de línea {selectedTypes.length > 0 && `(${selectedTypes.length} seleccionado${selectedTypes.length > 1 ? 's' : ''})`}
              </span>
              {selectedTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTypes([])}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Limpiar filtro
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 w-full">
              <button
                type="button"
                onClick={() => scrollContainer(typesScrollRef, 'left')}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Tipos anteriores"
                aria-label="Tipos anteriores"
              >
                <ChevronLeft className="w-3.5 h-3.5 shrink-0" />
              </button>

              <div
                ref={typesScrollRef}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scroll-x select-none min-w-0"
              >
                <button
                  type="button"
                  onClick={() => setSelectedTypes([])}
                  className={`flat-btn text-[11px] py-1 px-2.5 rounded-full cursor-pointer shrink-0 transition-all capitalize ${
                    selectedTypes.length === 0
                      ? 'is-active !border-amber-400 !text-amber-400 !bg-amber-400/25 font-bold shadow-xs'
                      : 'hover:border-[var(--text-muted)]'
                  }`}
                >
                  Todos
                </button>
                {availableLineTypes.map((t) => {
                  const isSelected = selectedTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={`flat-btn text-[11px] py-1 px-2.5 rounded-full cursor-pointer shrink-0 capitalize flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'is-active !border-amber-400 !text-amber-400 !bg-amber-400/25 font-bold shadow-xs ring-1 ring-amber-400/50'
                          : 'hover:border-[var(--text-muted)]'
                      }`}
                    >
                      <span>{t}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollContainer(typesScrollRef, 'right')}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Más tipos"
                aria-label="Más tipos"
              >
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>

          {/* Lines results list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredLines.length === 0 ? (
              onlyFavorites ? (
                <div className="col-span-full text-center py-12 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-300">
                    <Star className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-display font-bold text-[var(--text)] mb-1">
                    {favoriteLineIds.length === 0
                      ? 'No tenés líneas frecuentes guardadas'
                      : 'Ninguna de tus líneas frecuentes coincide con los filtros'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-4">
                    {favoriteLineIds.length === 0
                      ? 'Tocá la estrella (★) en cualquier línea de la lista para guardarla como frecuente y tenerla siempre a mano acá y en el inicio.'
                      : 'Probá limpiando el texto de búsqueda o los filtros de empresas y tipos.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOnlyFavorites(false);
                      setSearchQuery('');
                      setSelectedCompanies([]);
                      setSelectedTypes([]);
                    }}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer"
                  >
                    Ver todas las líneas del catálogo
                  </button>
                </div>
              ) : (
                <div className="col-span-full text-center py-12 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
                  <p className="text-sm font-semibold text-[var(--text)] mb-1">Sin resultados</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Probá con el número de línea, la empresa o un barrio.
                  </p>
                </div>
              )
            ) : (
              filteredLines.map((line) => {
                const isFav = favoriteLineIds.includes(line.id);
                const coColor = line.companies?.color || COMPANY_COLORS[line.companies?.short_name || ''] || '#555f5e';
                const routes = getLineRoutes(line);

                return (
                  <div
                    key={line.id}
                    onClick={() => setActiveLineId(line.id)}
                    className="p-3 bg-[var(--surface)] border border-[var(--border)] hover:border-amber-400/40 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-all hover:bg-[var(--surface-hover)] group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Company logo on the left of each line */}
                      {line.companies?.logo_url ? (
                        <img
                          src={line.companies.logo_url}
                          alt={line.companies.short_name || 'Empresa'}
                          className="w-9 h-9 rounded-lg object-contain bg-white p-1 border border-[var(--border)] shadow-xs shrink-0 mt-0.5"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🚌
                        </div>
                      )}

                      {/* Line Number Badge */}
                      <span
                        className="px-2.5 py-1 rounded font-mono font-bold text-sm text-white shrink-0 shadow-sm mt-0.5"
                        style={{ backgroundColor: coColor }}
                      >
                        {line.number}
                      </span>

                      {/* Details & all routes */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-[var(--text)]">
                            {line.companies?.short_name || 'CUTCSA'}
                          </span>
                          {line.type && (
                            <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-mono">
                              {line.type}
                            </span>
                          )}
                        </div>

                        {/* All available routes shown */}
                        {routes.length > 0 ? (
                          <div className="space-y-1 mt-1">
                            {routes.map((route, rIdx) => (
                              <div key={rIdx} className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 leading-snug">
                                <span className="text-amber-400/80 text-[11px] shrink-0">📍</span>
                                <span>{route}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            Sin recorridos registrados
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {/* Frecuente star button */}
                      <button
                        onClick={(e) => handleToggleFavorite(line.id, e)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-amber-400/15 border-amber-400 text-amber-400'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-dim)] hover:text-amber-400'
                        }`}
                        title={isFav ? 'Quitar de frecuentes' : 'Marcar como frecuente'}
                      >
                        <Star className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                      <ArrowRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
