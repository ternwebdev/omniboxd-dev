import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Bus, AlertCircle, Layers, Plus } from 'lucide-react';
import { BusLine, UserProfile, ReviewItem } from '../types';
import { DEFAULT_TAGS, BUS_COMPANIES } from '../lib/constants';
import { supabase, fetchAllLines, fetchAllCompanies, fetchAdminTags } from '../lib/supabase';
import { getLineRoutes } from '../lib/routes';
import { 
  formatDateTimeForPayload, 
  isFutureDateOrTime, 
  getCurrentDateMax, 
  getCurrentDateTimeMax 
} from '../lib/dateUtils';
import { useScrollLock } from '../lib/scrollLock';
import { ComboPataForm, PataData } from './ComboPataForm';

interface NewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onReviewCreated: () => void;
  onNavigateToAuth: () => void;
  initialLineId?: string | null;
  editReview?: ReviewItem | null;
}

export const NewReviewModal: React.FC<NewReviewModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onReviewCreated,
  onNavigateToAuth,
  initialLineId,
  editReview
}) => {
  const [lines, setLines] = useState<BusLine[]>([]);
  const [companiesList, setCompaniesList] = useState<any[]>(BUS_COMPANIES);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedLineId, setSelectedLineId] = useState<string>(initialLineId || '');
  const [lineSearchQuery, setLineSearchQuery] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [rating, setRating] = useState<number>(4.0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<any[]>(DEFAULT_TAGS);
  const [showAllTags, setShowAllTags] = useState<boolean>(false);
  const [reviewBody, setReviewBody] = useState<string>('');
  const [tripDateMode, setTripDateMode] = useState<'date' | 'datetime'>('date');
  const [tripDate, setTripDate] = useState<string>('');
  const [tripDateTime, setTripDateTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onCloseRef = useRef(onClose);
    // Combinaciones
  const [isCombo, setIsCombo] = useState<boolean>(false);
  const [patas, setPatas] = useState<PataData[]>([]);
  const [expandedPataId, setExpandedPataId] = useState<string | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Lock background scroll when modal is active
  useScrollLock(isOpen);

  // Handle mobile and browser Back button to cleanly close modal without jumping views
  useEffect(() => {
    if (!isOpen) return;

    // Unique history state key for this modal session
    const modalSessionKey = 'omniboxd_review_modal_' + Date.now();
    window.history.pushState({ modal: modalSessionKey }, '');

    let closedByPopState = false;

    const handlePopState = () => {
      closedByPopState = true;
      onCloseRef.current();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      // If closed by user clicking X, backdrop, or form submission (not by back button)
      if (!closedByPopState && window.history.state?.modal === modalSessionKey) {
        window.history.back();
      }
    };
  }, [isOpen]);

  // Load catalog of lines and real companies from database
  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      const [linesData, companiesData, tagsData] = await Promise.all([
        fetchAllLines(),
        fetchAllCompanies(),
        fetchAdminTags()
      ]);
      setLines(linesData);
      if (companiesData && companiesData.length > 0) {
        setCompaniesList(companiesData);
      }
      if (tagsData && tagsData.length > 0) {
        setTagsList(tagsData);
      }
    };
    loadData();
  }, [isOpen]);

  // Pre-fill form when editReview is provided or reset when creating
  useEffect(() => {
    if (!isOpen) return;

    if (editReview) {
      setSelectedLineId(editReview.line_id || editReview.lines?.id || '');
      setSelectedRoute(editReview.route_label || '');
      setVehicleNumber(editReview.vehicle_number || '');
      setRating(Number(editReview.rating) || 4.0);
      setReviewBody(editReview.body || '');

      if (editReview.trip_date) {
        const td = String(editReview.trip_date).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(td)) {
          setTripDateMode('date');
          setTripDate(td);
          setTripDateTime('');
        } else {
          setTripDateMode('datetime');
          const d = new Date(td);
          if (!isNaN(d.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0');
            setTripDateTime(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
          } else {
            setTripDateTime(td.replace(' ', 'T').slice(0, 16));
          }
          setTripDate('');
        }
      } else {
        setTripDate('');
        setTripDateTime('');
      }

      if (editReview.tags && editReview.tags.length > 0) {
        const slugs = editReview.tags.map((t: any) => t.slug || t.label.toLowerCase().replace(/\s+/g, '-'));
        setSelectedTags(slugs);
      } else {
        setSelectedTags([]);
      }
    } else {
      if (initialLineId) {
        setSelectedLineId(initialLineId);
      } else {
        setSelectedLineId('');
      }
      setSelectedRoute('');
      setVehicleNumber('');
      setRating(4.0);
      setReviewBody('');
      setTripDate('');
      setTripDateTime('');
      setSelectedTags([]);
      setErrorMessage(null);
      // 👇 Resetear combos
      setIsCombo(false);
      setPatas([]);
      setExpandedPataId(null);
    }
  }, [isOpen, editReview, initialLineId]);

  // When a line is selected, parse its unique routes
  useEffect(() => {
    if (!selectedLineId || lines.length === 0) {
      setAvailableRoutes([]);
      if (!editReview) setSelectedRoute('');
      return;
    }

    const line = lines.find((l) => l.id === selectedLineId);
    if (!line) return;

    const uniqueRoutes = getLineRoutes(line);
    setAvailableRoutes(uniqueRoutes);
    if (uniqueRoutes.length === 1 && !selectedRoute) {
      setSelectedRoute(uniqueRoutes[0]);
    }
  }, [selectedLineId, lines]);

  if (!isOpen) return null;

  // Extract unique types from lines in database
  const availableTypes: string[] = Array.from(
    new Set<string>(lines.map((l) => l.type).filter((t): t is string => Boolean(t)))
  ).sort();

  // Filter lines by selected type, company, and search query
  const filteredLines = lines.filter((l) => {
    if (selectedType && l.type?.toLowerCase() !== selectedType.toLowerCase()) return false;
    if (selectedCompany) {
      const matchCompId = l.company_id === selectedCompany;
      const matchCompShort = l.companies?.short_name?.toLowerCase() === selectedCompany.toLowerCase();
      const matchCompName = l.companies?.name?.toLowerCase() === selectedCompany.toLowerCase();
      if (!matchCompId && !matchCompShort && !matchCompName) return false;
    }
    if (lineSearchQuery) {
      const q = lineSearchQuery.toLowerCase();
      const numMatch = l.number.toLowerCase().includes(q);
      const coMatch = l.companies?.short_name?.toLowerCase().includes(q) || l.companies?.name?.toLowerCase().includes(q);
      const routesMatch = getLineRoutes(l).some((r) => r.toLowerCase().includes(q));
      return numMatch || coMatch || routesMatch;
    }
    return true;
  });

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Handlers de combinaciones
  // ─────────────────────────────────────────────────────────────
  const addPata = () => {
    if (patas.length >= 2) return; // Ya hay 2 extras (total 3 con la principal)
    const newPata: PataData = {
      tempId: `pata-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      lineId: '',
      rating: 4.0,
      body: '',
      selectedTags: [],
      selectedType: '',
      selectedCompany: '',
      lineSearchQuery: '',
      routeLabel: '',
      vehicleNumber: '',
      tripDateMode: 'date',
      tripDate: '',
      tripDateTime: '',
      showAllTags: false
    };
    setPatas((prev) => [...prev, newPata]);
    setExpandedPataId(newPata.tempId);
  };

  const updatePata = (tempId: string, updates: Partial<PataData>) => {
    setPatas((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, ...updates } : p))
    );
  };

  const removePata = (tempId: string) => {
    setPatas((prev) => prev.filter((p) => p.tempId !== tempId));
    if (expandedPataId === tempId) setExpandedPataId(null);
  };

  const togglePataExpand = (tempId: string) => {
    setExpandedPataId((prev) => (prev === tempId ? null : tempId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigateToAuth();
      return;
    }

    if (!selectedLineId) {
      setErrorMessage('Por favor seleccioná una línea de ómnibus.');
      return;
    }

    if (availableRoutes.length > 1 && !selectedRoute) {
      setErrorMessage('Seleccioná el recorrido que hiciste.');
      return;
    }

    if (!reviewBody.trim()) {
      setErrorMessage('Escribí tu reseña sobre el viaje.');
      return;
    }

    const selectedTripDateVal = tripDateMode === 'date' ? tripDate : tripDateTime;

    // Strict validation: Future date/time is NOT allowed!
    if (selectedTripDateVal && isFutureDateOrTime(selectedTripDateVal)) {
      setErrorMessage('La fecha y hora del viaje no puede ser posterior a la fecha y hora actual.');
      return;
    }

    // 👇 Validar patas del combo (si es combo)
    if (!editReview && isCombo && patas.length > 0) {
      for (let i = 0; i < patas.length; i++) {
        const p = patas[i];
        if (!p.lineId) {
          setErrorMessage(`La pata ${i + 2} no tiene línea seleccionada.`);
          return;
        }
        if (!p.body.trim()) {
          setErrorMessage(`La pata ${i + 2} no tiene reseña escrita.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        line_id: selectedLineId,
        rating: rating,
        body: reviewBody.trim(),
        route_label: selectedRoute || null,
        vehicle_number: vehicleNumber.trim() || null,
        trip_date: selectedTripDateVal ? formatDateTimeForPayload(selectedTripDateVal) : null
      };

      if (editReview) {
        // --- Full Edit Flow ---
        const { error: updateError } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', editReview.id);

        if (updateError) throw updateError;

        await supabase.from('review_tags').delete().eq('review_id', editReview.id);

        if (selectedTags.length > 0) {
          const { data: tagRows } = await supabase
            .from('tags')
            .select('id, slug')
            .in('slug', selectedTags);

          if (tagRows && tagRows.length > 0) {
            const reviewTagsPayload = tagRows.map((t) => ({
              review_id: editReview.id,
              tag_id: t.id
            }));
            await supabase.from('review_tags').insert(reviewTagsPayload);
          }
        }

        window.dispatchEvent(
          new CustomEvent('omniboxd_review_updated', {
            detail: { id: editReview.id, message: '¡Omnipost modificado con éxito!' }
          })
        );
      } else if (isCombo && patas.length > 0) {
        // ─────────────────────────────────────────────────────────
        // 🚌 Nuevo COMBO (2 o 3 patas)
        // ─────────────────────────────────────────────────────────
                // Fallback de UUID compatible con HTTP local (sin crypto.randomUUID)
        const comboId = (() => {
          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
          }
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        })();
        const allPatas = [
          // Pata principal (la del form de arriba)
          {
            line_id: selectedLineId,
            rating: rating,
            body: reviewBody.trim(),
            route_label: selectedRoute || null,
            vehicle_number: vehicleNumber.trim() || null,
            trip_date: selectedTripDateVal ? formatDateTimeForPayload(selectedTripDateVal) : null,
            tags: selectedTags
          },
          // Patas extra
          ...patas.map((p) => ({
            line_id: p.lineId,
            rating: p.rating,
            body: p.body.trim(),
            route_label: p.routeLabel || null,
            vehicle_number: p.vehicleNumber.trim() || null,
            trip_date: (() => {
              const val = p.tripDateMode === 'date' ? p.tripDate : p.tripDateTime;
              return val ? formatDateTimeForPayload(val) : null;
            })(),
            tags: p.selectedTags
          }))
        ];

        // Insertar secuencialmente para respetar el trigger de max 3
        const insertedIds: string[] = [];
        for (let i = 0; i < allPatas.length; i++) {
          const p = allPatas[i];
          const isAnchor = i === allPatas.length - 1; // La última es la que recibe interacciones

          const { data: inserted, error: insertErr } = await supabase
            .from('reviews')
            .insert({
              user_id: currentUser.id,
              line_id: p.line_id,
              rating: p.rating,
              body: p.body,
              route_label: p.route_label,
              vehicle_number: p.vehicle_number,
              trip_date: p.trip_date,
              combo_id: comboId,
              combo_order: i,
              is_combo_anchor: isAnchor
            })
            .select('id')
            .single();

          if (insertErr) throw insertErr;
          if (inserted) insertedIds.push(inserted.id);

          // Insertar tags de esta pata
          if (p.tags.length > 0 && inserted) {
            const { data: tagRows } = await supabase
              .from('tags')
              .select('id, slug')
              .in('slug', p.tags);

            if (tagRows && tagRows.length > 0) {
              const reviewTagsPayload = tagRows.map((t) => ({
                review_id: inserted.id,
                tag_id: t.id
              }));
              await supabase.from('review_tags').insert(reviewTagsPayload);
            }
          }
        }

        window.dispatchEvent(
          new CustomEvent('omniboxd_review_created', {
            detail: { id: insertedIds[insertedIds.length - 1], message: `¡Combinación de ${allPatas.length} patas publicada con éxito!` }
          })
        );
      } else {
        // --- New Review Flow (individual) ---
        payload.user_id = currentUser.id;

        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .insert(payload)
          .select('id')
          .single();

        if (reviewError) throw reviewError;

        if (selectedTags.length > 0 && reviewData) {
          const { data: tagRows } = await supabase
            .from('tags')
            .select('id, slug')
            .in('slug', selectedTags);

          if (tagRows && tagRows.length > 0) {
            const reviewTagsPayload = tagRows.map((t) => ({
              review_id: reviewData.id,
              tag_id: t.id
            }));
            await supabase.from('review_tags').insert(reviewTagsPayload);
          }
        }

        window.dispatchEvent(
          new CustomEvent('omniboxd_review_created', {
            detail: { id: reviewData?.id, message: '¡Omnipost publicado con éxito!' }
          })
        );
      }

      onReviewCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al guardar el omnipost.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-150 touch-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-t-2xl sm:rounded-2xl max-w-lg md:max-w-2xl lg:max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto overscroll-contain touch-auto modal-scroll-area"
      >
        {/* Natural clean header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚌</span>
            <h3 className="font-display font-bold text-lg text-[var(--text)]">
              {editReview ? 'Editar omnipost' : 'Nuevo omnipost'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer transition-colors"
            title="Cerrar modal"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cascading Filters */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Tipo (Opcional)
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setSelectedLineId('');
                }}
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
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Empresa (Opcional)
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  setSelectedCompany(e.target.value);
                  setSelectedLineId('');
                }}
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

          {/* Line Selection (Cleaned up, no routeHint clutter) */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Línea de Ómnibus *
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={lineSearchQuery}
                onChange={(e) => setLineSearchQuery(e.target.value)}
                placeholder="Filtrar por número o destino… ej: 103, 183, Pocitos"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />

              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                required
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

          {/* Route Variant Selector - Disabled until line is chosen */}
          <div>
            <label
              className={`text-xs font-semibold uppercase tracking-wider block mb-1 ${
                selectedLineId ? 'text-amber-400' : 'text-[var(--text-muted)]'
              }`}
            >
              Recorrido / Destino {availableRoutes.length > 1 ? '*' : '(Opcional)'}
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              disabled={!selectedLineId}
              required={availableRoutes.length > 1}
              className={`w-full border rounded-lg p-2.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-medium transition-all ${
                !selectedLineId
                  ? 'bg-[var(--surface-2)]/50 border-[var(--border)] opacity-50 cursor-not-allowed'
                  : 'bg-[var(--surface-2)] border-amber-400/50'
              }`}
            >
              {!selectedLineId ? (
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

          {/* Bus coche number & Trip date with mode selector (Solo fecha vs Fecha y hora) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Nº de coche (Opcional)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Ej: 1042"
                maxLength={16}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  ¿Cuándo viajaste?
                </label>
                {/* Mode toggle */}
                <div className="inline-flex rounded-md bg-[var(--surface-2)] border border-[var(--border)] p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTripDateMode('date')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer font-medium transition-all ${
                      tripDateMode === 'date'
                        ? 'bg-amber-400 text-black font-bold shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Solo fecha
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripDateMode('datetime')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer font-medium transition-all ${
                      tripDateMode === 'datetime'
                        ? 'bg-amber-400 text-black font-bold shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Fecha y hora
                  </button>
                </div>
              </div>

              {tripDateMode === 'date' ? (
                <input
                  type="date"
                  value={tripDate}
                  max={getCurrentDateMax()}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              ) : (
                <input
                  type="datetime-local"
                  value={tripDateTime}
                  max={getCurrentDateTimeMax()}
                  onChange={(e) => setTripDateTime(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              )}
              <span className="text-[10px] text-[var(--text-dim)] mt-0.5 block">
                {tripDateMode === 'date'
                  ? 'Opcional. Máximo hasta hoy (sin fechas futuras).'
                  : 'Opcional. Máximo hasta el momento actual.'}
              </span>
            </div>
          </div>

          {/* Rating (Interactive stars & number buttons with coherent emerald color) */}
          <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Puntuación
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {rating.toFixed(1)}
                </span>
                <span className="text-emerald-400 font-bold">★</span>
              </div>
            </div>

            {/* Visual stars */}
            <div className="flex items-center justify-center gap-1.5 py-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => {
                const full = Math.floor(rating);
                const hasHalf = rating - full >= 0.5;
                const isFull = i <= full;
                const isHalf = i === full + 1 && hasHalf;

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setRating(rating === i ? i - 0.5 : i)}
                    className="text-2xl transition-all cursor-pointer hover:scale-115 focus:outline-none p-0.5"
                    title={`${i} estrellas`}
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

            {/* Number buttons */}
            <div className="flex items-center gap-1 justify-center flex-wrap">
              {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setRating(val)}
                  className={`px-2 py-1 text-xs rounded-md transition-all font-mono font-bold cursor-pointer ${
                    rating === val
                      ? 'bg-emerald-400 text-black shadow-md scale-105 font-extrabold ring-2 ring-emerald-400/40'
                      : 'text-[var(--text-muted)] hover:text-emerald-400 hover:bg-[var(--surface-hover)] border border-[var(--border-soft)]'
                  }`}
                >
                  {val.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags with distinct active pressed state */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Etiquetas / Vibe del viaje
              </label>
              <button
                type="button"
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                {showAllTags ? 'Ver menos' : `Ver más (${tagsList.length})`}
              </button>
            </div>
            <div className={`flex flex-wrap gap-1.5 ${showAllTags ? 'max-h-48 sm:max-h-56 overflow-y-auto p-1.5 bg-[var(--surface-2)]/40 rounded-lg border border-[var(--border)] custom-scroll-x' : ''}`}>
              {(showAllTags ? tagsList : tagsList.slice(0, 8)).map((tag) => {
                const isSelected = selectedTags.includes(tag.slug);
                return (
                  <button
                    type="button"
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`text-xs py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-xs ring-2 ring-amber-400/30 scale-[1.02]'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span>{tag.emoji}</span>
                    <span>{tag.label}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-black/20 text-black px-1 rounded-full font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                ¿Qué tal estuvo el viaje? *
              </label>
              <span className="text-[11px] text-[var(--text-dim)] font-mono">
                {reviewBody.length}/750
              </span>
            </div>
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder="Contá cómo estuvo el viaje: el chofer, si iba repleto, aire acondicionado, música, frenadas…"
              rows={4}
              maxLength={750}
              required
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 text-sm text-[var(--text)] focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Submit button */}
          {/* ─────────────────────────────────────────────────────── */}
          {/* 🚌 Combinación (solo para nuevos, no en edición) */}
          {/* ─────────────────────────────────────────────────────── */}
          {!editReview && (
            <div className="border-2 border-dashed border-amber-400/40 rounded-xl p-3 space-y-3 bg-amber-400/5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-display font-bold text-[var(--text)]">
                      ¿Hiciste una combinación?
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                      Sumá hasta 2 patas más al mismo viaje
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isCombo}
                    onChange={(e) => {
                      setIsCombo(e.target.checked);
                      if (!e.target.checked) {
                        setPatas([]);
                        setExpandedPataId(null);
                      } else if (patas.length === 0) {
                        addPata();
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--surface-2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400 border border-[var(--border)]"></div>
                </label>
              </div>

              {isCombo && (
                <>
                  <div className="space-y-2">
                    {patas.map((p, idx) => (
                      <ComboPataForm
                        key={p.tempId}
                        pata={p}
                        index={idx + 1}
                        lines={lines}
                        allTags={tagsList}
                        companiesList={companiesList}
                        isExpanded={expandedPataId === p.tempId}
                        onToggleExpand={() => togglePataExpand(p.tempId)}
                        onUpdate={(updates) => updatePata(p.tempId, updates)}
                        onRemove={() => removePata(p.tempId)}
                      />
                    ))}
                  </div>

                  {patas.length < 2 && (
                    <button
                      type="button"
                      onClick={addPata}
                      className="w-full py-2 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar pata {patas.length + 2}</span>
                    </button>
                  )}

                  {patas.length >= 2 && (
                    <p className="text-[10px] text-center text-[var(--text-dim)] italic">
                      Máximo alcanzado (3 patas en total)
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-emerald-500/25 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting
              ? editReview ? 'Guardando cambios…' : 'Publicando omnipost…'
              : editReview ? 'Guardar cambios del omnipost' : 'Publicar omnipost'}
          </button>
        </form>
      </div>
    </div>
  );
};

