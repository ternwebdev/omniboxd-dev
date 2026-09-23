import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Star, RefreshCw, Bus, CheckCircle2, X, Search, LogIn, TrendingUp, Compass, MessageSquare, Building2, ChevronDown, Filter } from 'lucide-react';
import { ReviewItem, UserProfile } from '../types';
import { ReviewCard } from '../components/ReviewCard';
import { fetchFeedReviews, subscribeToRealtimeUpdates, supabase } from '../lib/supabase';

interface HomeFeedViewProps {
  currentUser: UserProfile | null;
  onNavigate: (view: string, param?: string) => void;
  onOpenNewReview: () => void;
  onOpenShare: (review: ReviewItem) => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  currentUser,
  onNavigate,
  onOpenNewReview,
  onOpenShare
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState<boolean>(false);
  const [favoriteLineIds, setFavoriteLineIds] = useState<string[]>([]);
  const [hasNewPostsPending, setHasNewPostsPending] = useState<number>(0);
  const [statusToast, setStatusToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string; short_name: string; color?: string }[]>([]);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFeedReviews(currentUser?.id);
      setReviews(data);
      setHasNewPostsPending(0);
    } catch (e) {
      console.error('Error loading feed reviews:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  // Fetch favorites if user is logged in
  useEffect(() => {
    if (!currentUser) return;
    const loadFavs = async () => {
      const { data } = await supabase
        .from('favorites')
        .select('line_id')
        .eq('user_id', currentUser.id);
      if (data) {
        setFavoriteLineIds(data.map((f: any) => f.line_id).filter(Boolean));
      }
    };
    loadFavs();
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

// Cargar empresas reales desde la DB (no las hardcodeadas)
useEffect(() => {
  let cancelled = false;
  (async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, short_name, color')
      .order('short_name');
    if (!cancelled && data) {
      setCompanies(data as any[]);
    }
  })();
  return () => { cancelled = true; };
}, []);

  // Listen for local creation / edit events for instant reactive feed update
  useEffect(() => {
    let timeoutId: any = null;

    const handleCreated = (e: any) => {
      const msg = e.detail?.message || '¡Omnipost publicado con éxito! Ya está disponible en el muro.';
      setStatusToast({ type: 'success', message: msg });
      loadReviews();
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setStatusToast(null);
      }, 5000);
    };

    const handleUpdated = (e: any) => {
      const msg = e.detail?.message || '¡Omnipost actualizado con éxito!';
      setStatusToast({ type: 'success', message: msg });
      loadReviews();
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setStatusToast(null);
      }, 5000);
    };

    window.addEventListener('omniboxd_review_created', handleCreated);
    window.addEventListener('omniboxd_review_updated', handleUpdated);

    return () => {
      window.removeEventListener('omniboxd_review_created', handleCreated);
      window.removeEventListener('omniboxd_review_updated', handleUpdated);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadReviews]);

  // Real-time synchronization subscription!
  useEffect(() => {
    const channel = subscribeToRealtimeUpdates((payload) => {
      // If a new review was inserted by anyone
      if (payload.table === 'reviews' && payload.event === 'INSERT') {
        // Auto-refresh seamlessly or prompt with counter
        loadReviews();
        setStatusToast({ type: 'info', message: '¡Nuevo omnipost publicado en la comunidad!' });
        setTimeout(() => setStatusToast(null), 4000);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadReviews]);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'favorites') {
      if (!r.lines?.id || !favoriteLineIds.includes(r.lines.id)) {
        return false;
      }
    }
    if (selectedCompany) {
      const companyShort = r.lines?.companies?.short_name || (r as any).company_name;
      if (!companyShort || companyShort.toLowerCase() !== selectedCompany.toLowerCase()) {
        return false;
      }
    }
    return true;
  });

  // Top active lines calculated from recent reviews for the desktop sidebar widget
const activeLines = React.useMemo(() => {
  const counts: Record<string, { count: number; line: string; lineId?: string; companyName?: string; companyColor?: string }> = {};
  for (const r of reviews) {
    const lineNumber = r.lines?.number;
    if (!lineNumber) continue;
    const companyName = r.lines?.companies?.short_name;
    const companyColor = r.lines?.companies?.color;
    const key = `${lineNumber}-${companyName || ''}`;
    if (!counts[key]) {
      counts[key] = {
        count: 0,
        line: lineNumber,
        lineId: r.lines?.id,
        companyName,
        companyColor
      };
    }
    counts[key].count += 1;
  }
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}, [reviews]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 pb-24 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Feed header & filter tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div>
              <h1 className="font-display font-bold text-lg text-[var(--text)] tracking-tight">
                Últimos viajes
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                El pulso en tiempo real del transporte colectivo
              </p>
            </div>

            {/* Filter tabs & Company selector */}
            <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-lg border border-[var(--border)] text-xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>Frecuentes</span>
              </button>

              {/* Compact company selector next to Frecuentes */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
                  className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    selectedCompany
                      ? 'bg-[var(--yellow)] text-[var(--bg)] font-bold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  title="Filtrar por empresa en Inicio"
                >
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-[70px] sm:max-w-none">{selectedCompany || 'Empresas'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isCompanyMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCompanyMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsCompanyMenuOpen(false)} 
                    />
                    <div className="absolute right-0 mt-1.5 w-48 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider border-b border-[var(--border-soft)] mb-1 flex items-center justify-between">
                        <span>Empresas</span>
                        {selectedCompany && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCompany(null);
                              setIsCompanyMenuOpen(false);
                            }}
                            className="text-[10px] text-red-400 hover:underline cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCompany(null);
                          setIsCompanyMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer ${
                          !selectedCompany
                            ? 'bg-amber-400/15 text-amber-400 font-bold'
                            : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <span>Todas las empresas</span>
                        {!selectedCompany && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                      {companies.map((comp) => {
                        const isSelected = selectedCompany?.toLowerCase() === comp.short_name.toLowerCase();
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(isSelected ? null : comp.short_name);
                              setIsCompanyMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--surface-2)] font-bold text-[var(--text)]'
                                : 'text-[var(--text)] hover:bg-[var(--surface-2)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: comp.color }}
                              />
                              <span>{comp.short_name}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Active Company Filter Notice Banner */}
          {selectedCompany && (
            <div className="px-3 py-2 rounded-xl bg-[var(--yellow)] border border-amber-400/30 text-amber-400 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2 font-medium">
                <Filter className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Filtrando por <strong>{selectedCompany}</strong> ({filteredReviews.length} {filteredReviews.length === 1 ? 'viaje' : 'viajes'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="px-2 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-semibold cursor-pointer text-[11px] flex items-center gap-1 transition-colors"
                title="Quitar filtro de empresa"
              >
                <span>Quitar filtro</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Realtime post submission / update toast banner */}
          {statusToast && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-between gap-2 text-xs shadow-md animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{statusToast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusToast(null)}
                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400/80 hover:text-emerald-400 cursor-pointer transition-colors"
                title="Cerrar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Realtime new posts toast notification */}
          {hasNewPostsPending > 0 && (
            <button
              onClick={loadReviews}
              className="w-full p-2.5 rounded-xl bg-amber-400 text-black font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-all animate-bounce cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {hasNewPostsPending === 1 ? '¡Hay 1 nuevo omnipost!' : `¡Hay ${hasNewPostsPending} nuevos omniposts!`} Clic para actualizar
              </span>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Reviews list */}
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
          ) : filteredReviews.length === 0 ? (
            activeTab === 'favorites' ? (
              !currentUser ? (
                /* User not logged in */
                <div className="text-center py-12 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-300">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-base text-[var(--text)] mb-1">
                    Iniciá sesión para ver tus frecuentes
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
                    Guardá las líneas que tomás todos los días para tener un muro personalizado con los viajes y novedades de tus bondis habituales.
                  </p>
                  <button
                    onClick={() => onNavigate('auth')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar sesión o registrarme</span>
                  </button>
                </div>
              ) : favoriteLineIds.length === 0 ? (
                /* User has NO favorites saved */
                <div className="text-center py-12 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-300">
                    <Star className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-base text-[var(--text)] mb-1">
                    Aún no tenés líneas frecuentes guardadas
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
                    Para ver novedades de tus líneas habituales acá, andá a <strong>Buscar</strong> y tocá la estrella <strong>(★)</strong> en los bondis que usás todos los días.
                  </p>
                  <button
                    onClick={() => onNavigate('search')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer inline-flex items-center gap-2 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>Buscar y marcar mis líneas frecuentes</span>
                  </button>
                </div>
              ) : (
                /* User has favorites, but no reviews posted for them */
                <div className="text-center py-12 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-2xl">
                    🚌
                  </div>
                  <h3 className="font-display font-bold text-base text-[var(--text)] mb-1">
                    Sin omniposteos en tus frecuentes todavía
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mb-5 leading-relaxed">
                    Tenés <strong>{favoriteLineIds.length}</strong> {favoriteLineIds.length === 1 ? 'línea frecuente guardada' : 'líneas frecuentes guardadas'}, pero aún no hay publicaciones registradas sobre {favoriteLineIds.length === 1 ? 'ella' : 'ellas'}. ¡Sé el primero en contar cómo viajaste!
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      onClick={onOpenNewReview}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Bus className="w-4 h-4" />
                      <span>Publicar viaje en mis frecuentes</span>
                    </button>
                    <button
                      onClick={() => onNavigate('search', 'favorites')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)] font-medium text-xs tracking-wide transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Ver mis frecuentes</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              /* All tab empty */
              <div className="text-center py-12 px-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-14 h-14 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-2xl">
                  🚌
                </div>
                <h3 className="font-display font-bold text-base text-[var(--text)] mb-1">
                  Ningún omnipost todavía
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mb-4">
                  Sé el primero en reseñar un bondi y compartir cómo viaja la gente hoy.
                </p>
                <button
                  onClick={onOpenNewReview}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wide transition-colors cursor-pointer"
                >
                  Publicar mi primer viaje
                </button>
              </div>
            )
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  currentUser={currentUser}
                  onNavigate={onNavigate}
                  onOpenShare={onOpenShare}
                  onReviewUpdated={loadReviews}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Column (Intermediate & Desktop Screens) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-18">
          {/* Quick Post CTA Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[var(--surface)] to-[var(--surface)] border border-amber-500/25 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                <Bus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--text)]">
                  ¿Viajaste recién?
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Contá cómo vino el coche, el aire y el chofer
                </p>
              </div>
            </div>
            <button
              onClick={onOpenNewReview}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[var(--yellow)] hover:brightness-110 text-[var(--bg)] font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Crear Omnipost</span>
            </button>
          </div>

          {/* Active Lines / Tendencia de Líneas */}
          {activeLines.length > 0 && (
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text)]">
                    Líneas con más viajes
                  </h3>
                </div>
                <span className="text-[10px] text-[var(--text-dim)]">Hoy</span>
              </div>

              <div className="space-y-2">
                {activeLines.map((item) => (
                  <button
                    key={`${item.line}-${item.companyName || ''}`}
                    onClick={() => onNavigate('search', item.line)}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border-soft)] transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded font-mono font-bold text-xs text-white shadow-xs"
                        style={{ backgroundColor: item.companyColor || '#3b82f6' }}
                      >
                        {item.line}
                      </span>
                      {item.companyName && (
                        <span className="text-xs text-[var(--text-muted)] truncate group-hover:text-[var(--text)]">
                          {item.companyName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
                      {item.count} {item.count === 1 ? 'viaje' : 'viajes'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Companies Filter Fast Access in Sidebar */}
          <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400" />
                <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[var(--text)]">
                  Empresas
                </h3>
              </div>
              {selectedCompany ? (
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-[10px] text-red-400 hover:underline cursor-pointer font-medium"
                >
                  Quitar filtro
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('search')}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                >
                  Ver en buscar
                </button>
              )}
            </div>

            <p className="text-[11px] text-[var(--text-dim)]">
              Filtra directamente los viajes de tu empresa preferida:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {companies.slice(0, 8).map((comp) => {
                const isSelected = selectedCompany?.toLowerCase() === comp.short_name.toLowerCase();
                return (
                  <button
                    key={comp.id}
                    onClick={() => setSelectedCompany(isSelected ? null : comp.short_name)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-white transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                      isSelected
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--surface)] scale-105 opacity-100'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: comp.color }}
                    title={isSelected ? `Quitar filtro de ${comp.name}` : `Filtrar viajes de ${comp.name} en Inicio`}
                  >
                    <span>{comp.short_name}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>

            {selectedCompany && (
              <button
                onClick={() => setSelectedCompany(null)}
                className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text)] py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] cursor-pointer transition-colors"
              >
                ✕ Mostrar todas las empresas
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
