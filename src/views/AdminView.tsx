import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Lock,
  Bus, 
  Building2, 
  MessageSquare, 
  Tag,
  Sliders,
  Plus, 
  Trash2, 
  Edit3,
  RefreshCw, 
  Check, 
  Users,
  Search,
  ArrowLeft,
  X,
  AlertCircle,
  FolderPlus,
  ArrowLeftRight,
  Smile,
  Copy,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Repeat,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  PieChart,
  Star,
  ArrowDown,
  Signpost
} from 'lucide-react';
import { UserProfile, BusLine, LineType, ReviewTag, TagCategory } from '../types';
import { 
  supabase, 
  fetchAllLines, 
  fetchAllCompanies, 
  fetchLineTypes, 
  fetchAdminTags 
} from '../lib/supabase';
import { getLineRoutes, addInvertedRoutes } from '../lib/routes';
import { getTagCategories, addTagCategory, removeTagCategory } from '../lib/tagCategories';
import { StarRating } from '../components/StarRating';

const CURATED_EMOJI_GROUPS = [
  {
    name: 'Confort y Clima',
    emojis: ['🥶', '🥵', '❄️', '☀️', '💺', '🛋️', '🧼', '✨', '💨', '🐟', '🌡️', '🌬️']
  },
  {
    name: 'Servicio y Viaje',
    emojis: ['🚌', '⏱️', '⚡', '🐌', '🏎️', '🎶', '🔇', '📱', '🔋', '📶', '🎫', '💳', '🎒']
  },
  {
    name: 'Seguridad y Estado',
    emojis: ['🛡️', '⚠️', '🚨', '👮', '🪟', '♿', '🟢', '🔴', '🛑', '🚪']
  },
  {
    name: 'Vibe y Reacción',
    emojis: ['👍', '👎', '⭐', '❤️', '🔥', '👏', '💯', '🙏', '😴', '☕']
  }
];

interface AdminViewProps {
  currentUser: UserProfile | null;
  isAuthChecking?: boolean;
  onNavigate: (view: string, param?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, isAuthChecking, onNavigate }) => {
  // Auth Guard: If auth check is complete and not logged in, redirect to feed
  useEffect(() => {
    if (!isAuthChecking && !currentUser) {
      onNavigate('feed');
    }
  }, [isAuthChecking, currentUser, onNavigate]);

  const [activeTab, setActiveTab] = useState<'stats' | 'lines' | 'companies' | 'types' | 'tags' | 'reviews'>('stats');
  const [stats, setStats] = useState<{
    reviews: number;
    users: number;
    chiflidos: number;
    bajadas: number;
    charlas: number;
    transbordos: number;
  }>({
    reviews: 0,
    users: 0,
    chiflidos: 0,
    bajadas: 0,
    charlas: 0,
    transbordos: 0
  });

  const [lines, setLines] = useState<BusLine[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [lineTypes, setLineTypes] = useState<LineType[]>([]);
  const [tags, setTags] = useState<ReviewTag[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [statsTimeframe, setStatsTimeframe] = useState<'7d' | '30d' | 'all'>('30d');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ label: string; count: number; avgRating: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Line creation & editing state
  const [lineSearch, setLineSearch] = useState('');
  const [newLineNumber, setNewLineNumber] = useState('');
  const [newLineCompanyId, setNewLineCompanyId] = useState('');
  const [newLineType, setNewLineType] = useState('urbano');
  const [newLineRoutesText, setNewLineRoutesText] = useState('');
  const [isSubmittingLine, setIsSubmittingLine] = useState(false);
  const [editingLine, setEditingLine] = useState<BusLine | null>(null);

  // Company creation & editing state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLogoUrl, setNewCompanyLogoUrl] = useState('');
  const [newCompanyColor, setNewCompanyColor] = useState('#f59e0b');
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);

  // Type creation & editing state
  const [newTypeSlug, setNewTypeSlug] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [editingType, setEditingType] = useState<LineType | null>(null);

  // Tag creation & editing state
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [newTagEmoji, setNewTagEmoji] = useState('');
  const [newTagCategory, setNewTagCategory] = useState('confort');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<ReviewTag | null>(null);
  const [sqlHelpModal, setSqlHelpModal] = useState<{
    isOpen: boolean;
    title: string;
    explanation: string;
    sqlCommand: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Tag categories state (slug & label)
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [catSlugEditedManually, setCatSlugEditedManually] = useState(false);
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);

  // Moderation filter state
  const [modSearchText, setModSearchText] = useState('');
  const [modFilterUser, setModFilterUser] = useState('');
  const [modFilterLine, setModFilterLine] = useState('');
  const [modFilterRating, setModFilterRating] = useState<string>('all');

  // Horizontal tabs scroll ref & navigation for mouse/desktop users
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const scrollAdminTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      tabsContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      const activeBtn = container.querySelector(`[data-tab="${activeTab}"]`) as HTMLElement | null;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [linesData, companiesData, typesData, tagsData] = await Promise.all([
        fetchAllLines(),
        fetchAllCompanies(),
        fetchLineTypes(),
        fetchAdminTags()
      ]);

      setLines(linesData || []);
      setCompanies(companiesData || []);
      setLineTypes(typesData || []);
      setTags(tagsData || []);

      const initialCats = getTagCategories(tagsData || []);
      setCategories(initialCats);
      if (initialCats.length > 0 && !newTagCategory) {
        setNewTagCategory(initialCats[0].slug);
      }

      if (typesData && typesData.length > 0 && !newLineType) {
        setNewLineType(typesData[0].slug);
      }

      // Fetch review count, user count, interactions (chiflidos/bajadas, charlas, transbordos)
      const [revRes, userRes, likesRes, commentsRes, repostsRes, recRevs] = await Promise.all([
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('likes').select('reaction'),
        supabase.from('comments').select('id', { count: 'exact', head: true }),
        supabase.from('reposts').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select(`
          id,
          rating,
          body,
          created_at,
          trip_date,
          vehicle_number,
          route_label,
          users:user_id (username),
          lines:line_id (number)
        `).order('created_at', { ascending: false }).limit(300)
      ]);

      let chiflidosCount = 0;
      let bajadasCount = 0;
      if (likesRes.data) {
        likesRes.data.forEach((l: any) => {
          if (l.reaction === 'dislike') {
            bajadasCount++;
          } else {
            chiflidosCount++;
          }
        });
      }

      setStats({
        reviews: revRes.count || 0,
        users: userRes.count || 0,
        chiflidos: chiflidosCount,
        bajadas: bajadasCount,
        charlas: commentsRes.count || 0,
        transbordos: repostsRes.count || 0
      });

      if (recRevs.data) {
        setRecentReviews(recRevs.data);
      }
    } catch (err: any) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.is_admin) {
      loadData();
    }
  }, [currentUser]);

  // Auth Guard: If still verifying auth state, show loading spinner instead of kicking or locking
  if (isAuthChecking) {
    return (
      <div className="max-w-md mx-auto my-24 px-4 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-[var(--text-muted)] font-mono">Verificando permisos de administración…</p>
      </div>
    );
  }

  // Auth Guard: Non-admin screen with giant lock
  if (!currentUser || !currentUser.is_admin) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-widest text-red-400 font-mono font-bold block mb-1">
              Acceso Restringido
            </span>
            <h1 className="font-display font-bold text-xl text-[var(--text)]">
              Panel de Administración
            </h1>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            No contás con privilegios de administrador para ver o gestionar este panel. Si creés que esto es un error, comunicate con el equipo.
          </p>
          <button
            onClick={() => onNavigate('feed')}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // --- Handlers: Categories ---
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;

    try {
      setIsSubmittingCat(true);
      const updated = addTagCategory(newCatLabel, newCatSlug || undefined);
      setCategories(updated);
      setNewCatLabel('');
      setNewCatSlug('');
      setCatSlugEditedManually(false);
      setStatusMessage({ type: 'success', text: `Categoría "${newCatLabel}" creada con éxito.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear categoría' });
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleDeleteCategory = (slug: string, label: string) => {
    const confirm = window.confirm(`¿Seguro que querés eliminar la categoría "${label}" (${slug})?`);
    if (!confirm) return;

    try {
      const updated = removeTagCategory(slug);
      setCategories(updated);
      if (newTagCategory === slug && updated.length > 0) {
        setNewTagCategory(updated[0].slug);
      }
      setStatusMessage({ type: 'success', text: `Categoría "${label}" eliminada.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar categoría' });
    }
  };

  // --- Handlers: Lines ---
  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLineNumber.trim()) return;

    setIsSubmittingLine(true);
    setStatusMessage(null);

    try {
      const routesList = newLineRoutesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const { error } = await supabase.from('lines').insert({
        number: newLineNumber.trim().toUpperCase(),
        company_id: newLineCompanyId || null,
        type: newLineType || 'urbano',
        routes: routesList,
        created_by: currentUser.id,
        active: true
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Línea ${newLineNumber.toUpperCase()} creada exitosamente.` });
      setNewLineNumber('');
      setNewLineRoutesText('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear la línea' });
    } finally {
      setIsSubmittingLine(false);
    }
  };

  const handleUpdateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLine) return;

    setIsSubmittingLine(true);
    try {
      const routesList = newLineRoutesText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const { error } = await supabase.from('lines').update({
        number: newLineNumber.trim().toUpperCase(),
        company_id: newLineCompanyId || null,
        type: newLineType || 'urbano',
        routes: routesList,
      }).eq('id', editingLine.id);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Línea ${newLineNumber} actualizada con éxito.` });
      setEditingLine(null);
      setNewLineNumber('');
      setNewLineRoutesText('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar la línea' });
    } finally {
      setIsSubmittingLine(false);
    }
  };

  const handleDeleteLine = async (lineId: string, lineNumber: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar la línea ${lineNumber}?`)) return;

    try {
      const { error } = await supabase.from('lines').delete().eq('id', lineId);
      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Línea ${lineNumber} eliminada con éxito.` });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar línea' });
    }
  };

  const startEditLine = (line: BusLine) => {
    setEditingLine(line);
    setNewLineNumber(line.number);
    setNewLineCompanyId(line.company_id || '');
    setNewLineType(line.type || 'urbano');
    const existingRoutes = getLineRoutes(line);
    setNewLineRoutesText(existingRoutes.join('\n'));
    // Scroll to form on mobile
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // --- Handlers: Companies ---
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setIsSubmittingCompany(true);
    setStatusMessage(null);

    try {
      const trimmedName = newCompanyName.trim();
      const { error } = await supabase.from('companies').insert({
        name: trimmedName,
        short_name: trimmedName, // auto-fill short_name safely for database constraint
        logo_url: newCompanyLogoUrl.trim() || null,
        color: newCompanyColor
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Empresa ${trimmedName} creada exitosamente.` });
      setNewCompanyName('');
      setNewCompanyLogoUrl('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear empresa' });
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    setIsSubmittingCompany(true);
    try {
      const trimmedName = newCompanyName.trim();
      const { error } = await supabase.from('companies').update({
        name: trimmedName,
        short_name: trimmedName,
        logo_url: newCompanyLogoUrl.trim() || null,
        color: newCompanyColor
      }).eq('id', editingCompany.id);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Empresa ${trimmedName} actualizada con éxito.` });
      setEditingCompany(null);
      setNewCompanyName('');
      setNewCompanyLogoUrl('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar empresa' });
    } finally {
      setIsSubmittingCompany(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar la empresa ${companyName}?`)) return;

    try {
      const { error } = await supabase.from('companies').delete().eq('id', companyId);
      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Empresa ${companyName} eliminada.` });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar empresa' });
    }
  };

  const startEditCompany = (c: any) => {
    setEditingCompany(c);
    setNewCompanyName(c.name || '');
    setNewCompanyLogoUrl(c.logo_url || '');
    setNewCompanyColor(c.color || '#f59e0b');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // --- Handlers: Types ---
  const handleCreateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeSlug.trim() || !newTypeLabel.trim()) return;

    setIsSubmittingType(true);
    try {
      const { error } = await supabase.from('line_types').insert({
        slug: newTypeSlug.trim().toLowerCase().replace(/\s+/g, '-'),
        label: newTypeLabel.trim(),
        description: newTypeDesc.trim() || null
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Tipo "${newTypeLabel}" creado exitosamente.` });
      setNewTypeSlug('');
      setNewTypeLabel('');
      setNewTypeDesc('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear tipo' });
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleUpdateType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    setIsSubmittingType(true);
    try {
      const { error } = await supabase.from('line_types').update({
        label: newTypeLabel.trim(),
        description: newTypeDesc.trim() || null
      }).eq('id', editingType.id);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Tipo "${newTypeLabel}" actualizado.` });
      setEditingType(null);
      setNewTypeSlug('');
      setNewTypeLabel('');
      setNewTypeDesc('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar tipo' });
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleDeleteType = async (typeId: string, label: string) => {
    if (!confirm(`¿Eliminar el tipo "${label}"?`)) return;
    try {
      const { error } = await supabase.from('line_types').delete().eq('id', typeId);
      if (error) throw error;
      setStatusMessage({ type: 'success', text: `Tipo "${label}" eliminado.` });
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar tipo' });
    }
  };

  // --- Handlers: Tags ---
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagLabel.trim()) return;

    setIsSubmittingTag(true);
    try {
      const slug = (newTagSlug.trim() || newTagLabel.trim())
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { error } = await supabase.from('tags').insert({
        label: newTagLabel.trim(),
        slug: slug,
        emoji: newTagEmoji.trim() || null,
        category: newTagCategory || 'confort'
      });

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Tag "${newTagLabel}" creado exitosamente.` });
      setNewTagLabel('');
      setNewTagSlug('');
      setNewTagEmoji('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear tag' });
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const handleUpdateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTag) return;

    setIsSubmittingTag(true);
    try {
      const slug = (newTagSlug.trim() || newTagLabel.trim())
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { error } = await supabase.from('tags').update({
        label: newTagLabel.trim(),
        slug: slug,
        emoji: newTagEmoji.trim() || null,
        category: newTagCategory || 'confort'
      }).eq('id', editingTag.id);

      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Tag "${newTagLabel}" actualizado con slug "${slug}".` });
      setEditingTag(null);
      setNewTagLabel('');
      setNewTagSlug('');
      setNewTagEmoji('');
      loadData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar tag' });
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const handleDeleteTag = async (tagId: string, label: string) => {
    if (!confirm(`¿Eliminar el tag "${label}"? Si alguna reseña lo tiene asignado, se desvinculará.`)) return;
    try {
      // 1. Eliminar vínculos previos en review_tags para evitar restricciones de clave foránea
      const { error: relError } = await supabase.from('review_tags').delete().eq('tag_id', tagId);
      if (relError && relError.code !== 'PGRST116') {
        console.warn('Nota al limpiar review_tags:', relError.message);
      }

      // 2. Eliminar el tag en tags
      const { error } = await supabase.from('tags').delete().eq('id', tagId);
      if (error) throw error;

      setStatusMessage({ type: 'success', text: `Tag "${label}" eliminado con éxito.` });
      loadData();
    } catch (err: any) {
      console.error('Error al eliminar tag:', err);
      const isPermissionError = 
        err.code === '42501' || 
        err.status === 403 || 
        err.message?.toLowerCase().includes('permission denied') ||
        err.message?.includes('403');

      if (isPermissionError) {
        setSqlHelpModal({
          isOpen: true,
          title: 'Permiso DELETE bloqueado en Supabase (Error 403)',
          explanation: 'PostgreSQL rechazó la eliminación porque el rol "authenticated" en Supabase no tiene otorgado el permiso DELETE sobre la tabla "tags".\n\nEjecutá este comando en Supabase → SQL Editor para habilitar la eliminación:',
          sqlCommand: `-- Habilitar permisos de eliminación y administración total en tags y review_tags
GRANT ALL ON TABLE public.tags TO authenticated, anon;
GRANT ALL ON TABLE public.review_tags TO authenticated, anon;

-- Si tu tabla tiene Row Level Security (RLS) activo:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
    DROP POLICY IF EXISTS "Allow all tags" ON public.tags;
    CREATE POLICY "Allow all tags" ON public.tags FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'review_tags') THEN
    DROP POLICY IF EXISTS "Allow all review_tags" ON public.review_tags;
    CREATE POLICY "Allow all review_tags" ON public.review_tags FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
  END IF;
END $$;`
        });
        setStatusMessage({ 
          type: 'error', 
          text: `Error 403: La base de datos denegó el permiso DELETE. Abrí la ayuda SQL en pantalla.` 
        });
      } else {
        setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar tag' });
      }
    }
  };

  // --- Handlers: Reviews Moderation ---
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta reseña? Esta acción no se puede deshacer.')) return;

    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
      if (error) throw error;

      setRecentReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setStatusMessage({ type: 'success', text: 'Reseña eliminada con éxito.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar la reseña' });
    }
  };

  // Filtered reviews for moderation
  const filteredReviews = recentReviews.filter((rev) => {
    if (modSearchText) {
      const body = (rev.body || '').toLowerCase();
      if (!body.includes(modSearchText.toLowerCase())) return false;
    }
    if (modFilterUser) {
      const uname = (rev.users?.username || '').toLowerCase();
      if (!uname.includes(modFilterUser.toLowerCase())) return false;
    }
    if (modFilterLine) {
      const lNum = (rev.lines?.number || '').toLowerCase();
      if (!lNum.includes(modFilterLine.toLowerCase())) return false;
    }
    if (modFilterRating !== 'all') {
      if (rev.rating !== Number(modFilterRating)) return false;
    }
    return true;
  });

  // Filtered lines for lines tab (supports filtering by number, type, company, routes, creator)
  const filteredLines = lines.filter((l) => {
    if (!lineSearch) return true;
    const q = lineSearch.toLowerCase().trim();
    const routesStr = getLineRoutes(l).join(' ').toLowerCase();
    const lineTypeStr = (l.type || (l as any).line_types?.label || (l as any).line_types?.slug || '').toLowerCase();
    return (
      l.number.toLowerCase().includes(q) ||
      lineTypeStr.includes(q) ||
      l.companies?.name?.toLowerCase().includes(q) ||
      l.companies?.short_name?.toLowerCase().includes(q) ||
      l.creator?.username?.toLowerCase().includes(q) ||
      routesStr.includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('feed')}
            className="flat-btn p-2 hover:text-amber-400 cursor-pointer"
            title="Volver al feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-[var(--text)] leading-tight">
                Panel de Administración
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Líneas, empresas, tipos, tags y moderación de contenido
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flat-btn text-xs py-1.5 px-3 hover:text-amber-400 cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/15 border-red-500/30 text-red-400'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs with Mouse Controls and Responsive Layout */}
      <div className="flex items-center gap-1.5 w-full">
        {/* Left scroll chevron button (desktop/tablet) */}
        <button
          type="button"
          onClick={() => scrollAdminTabs('left')}
          className="hidden sm:flex shrink-0 w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/50 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Pestañas anteriores"
          aria-label="Pestañas anteriores"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
        </button>

        <div 
          ref={tabsContainerRef}
          className="flex-1 flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] custom-scroll-x gap-1 select-none min-w-0"
        >
          <button
            data-tab="stats"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 min-w-[85px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Resumen</span>
          </button>

          <button
            data-tab="lines"
            onClick={() => setActiveTab('lines')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lines'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Bus className="w-4 h-4 shrink-0" />
            <span>Líneas ({lines.length})</span>
          </button>

          <button
            data-tab="companies"
            onClick={() => setActiveTab('companies')}
            className={`flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'companies'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Empresas ({companies.length})</span>
          </button>

          <button
            data-tab="types"
            onClick={() => setActiveTab('types')}
            className={`flex-1 min-w-[85px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'types'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Tipos ({lineTypes.length})</span>
          </button>

          <button
            data-tab="tags"
            onClick={() => setActiveTab('tags')}
            className={`flex-1 min-w-[85px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tags'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span>Tags ({tags.length})</span>
          </button>

          <button
            data-tab="reviews"
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-display font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-[var(--surface)] text-amber-400 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Moderación</span>
          </button>
        </div>

        {/* Right scroll chevron button (desktop/tablet) */}
        <button
          type="button"
          onClick={() => scrollAdminTabs('right')}
          className="hidden sm:flex shrink-0 w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/50 shadow-sm items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Pestañas siguientes"
          aria-label="Pestañas siguientes"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </button>
      </div>

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Main 6 Community Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Omniposteos
                </span>
                <span className="text-base">🚌</span>
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-amber-400">
                {stats.reviews}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">reseñas publicadas</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Usuarios
                </span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-emerald-400">
                {stats.users}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">cuentas creadas</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Chiflidos
                </span>
                <span className="text-sm">🗣️</span>
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-amber-400">
                {stats.chiflidos}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">reacciones positivas</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Bajadas
                </span>
                <ArrowDown className="w-4 h-4 text-rose-400 stroke-[2.5]" />
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-rose-400">
                {stats.bajadas}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">reacciones negativas</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Charlas
                </span>
                <Signpost className="w-4 h-4 text-sky-400" />
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-sky-400">
                {stats.charlas}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">comentarios en paradas</span>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  Transbordos
                </span>
                <Bus className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-display font-bold text-2xl sm:text-3xl text-emerald-400">
                {stats.transbordos}
              </span>
              <span className="text-[10px] text-[var(--text-dim)] mt-1">omniposteos compartidos</span>
            </div>
          </div>

          {/* Estadísticas y Gráficos a lo largo del tiempo */}
          {(() => {
            const now = new Date();
            const filteredByTime = recentReviews.filter((r) => {
              if (statsTimeframe === 'all') return true;
              const dateVal = new Date(r.created_at || r.trip_date || Date.now());
              const daysDiff = (now.getTime() - dateVal.getTime()) / (1000 * 3600 * 24);
              if (statsTimeframe === '7d') return daysDiff <= 7;
              if (statsTimeframe === '30d') return daysDiff <= 30;
              return true;
            });

            // 1. Timeline series (by date)
            const timelineMap: Record<string, { count: number; totalRating: number; label: string; dateObj: Date }> = {};

            if (statsTimeframe === '7d') {
              for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('es-UY', { weekday: 'short', day: 'numeric' });
                timelineMap[key] = { count: 0, totalRating: 0, label: dayName, dateObj: d };
              }
            } else if (statsTimeframe === '30d') {
              for (let i = 29; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const dayName = d.toLocaleDateString('es-UY', { day: 'numeric', month: 'short' });
                timelineMap[key] = { count: 0, totalRating: 0, label: dayName, dateObj: d };
              }
            }

            filteredByTime.forEach((r) => {
              const d = new Date(r.created_at || r.trip_date || Date.now());
              const key = d.toISOString().split('T')[0];
              if (timelineMap[key]) {
                timelineMap[key].count += 1;
                timelineMap[key].totalRating += (r.rating || 0);
              } else if (statsTimeframe === 'all') {
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('es-UY', { month: 'short', year: '2-digit' });
                if (!timelineMap[monthKey]) {
                  timelineMap[monthKey] = { count: 0, totalRating: 0, label, dateObj: d };
                }
                timelineMap[monthKey].count += 1;
                timelineMap[monthKey].totalRating += (r.rating || 0);
              }
            });

            let timelinePoints = Object.entries(timelineMap).map(([key, val]) => ({
              key,
              label: val.label,
              count: val.count,
              avgRating: val.count > 0 ? Number((val.totalRating / val.count).toFixed(1)) : 0
            }));

            // Group 30d points into readable 3-day intervals if there are many points
            if (statsTimeframe === '30d' && timelinePoints.length > 12) {
              const aggregated: typeof timelinePoints = [];
              const chunkSize = 3;
              for (let i = 0; i < timelinePoints.length; i += chunkSize) {
                const chunk = timelinePoints.slice(i, i + chunkSize);
                const count = chunk.reduce((sum, c) => sum + c.count, 0);
                const totalRating = chunk.reduce((sum, c) => sum + (c.avgRating * c.count), 0);
                const first = chunk[0];
                const last = chunk[chunk.length - 1];
                const label = `${first.label.split(' ')[0]}-${last.label}`;
                aggregated.push({
                  key: first.key,
                  label,
                  count,
                  avgRating: count > 0 ? Number((totalRating / count).toFixed(1)) : 0
                });
              }
              timelinePoints = aggregated;
            }

            const maxTimelineCount = Math.max(1, ...timelinePoints.map((p) => p.count));

            // 2. Rating distribution (0.5 to 5.0 with intermediate half-stars)
            const ratingSteps = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5];
            const ratingCounts: Record<string, number> = {};
            ratingSteps.forEach((s) => { ratingCounts[s.toFixed(1)] = 0; });
            let totalRatingSum = 0;

            filteredByTime.forEach((r) => {
              const raw = Number(r.rating || 0);
              if (raw > 0) {
                const rounded = Math.round(raw * 2) / 2;
                const clamped = Math.min(5.0, Math.max(0.5, rounded)).toFixed(1);
                if (ratingCounts[clamped] !== undefined) {
                  ratingCounts[clamped] += 1;
                }
                totalRatingSum += raw;
              }
            });

            const avgRatingInPeriod = filteredByTime.length > 0 
              ? (totalRatingSum / filteredByTime.length).toFixed(2) 
              : '—';
            const maxRatingCount = Math.max(1, ...Object.values(ratingCounts));

            // 3. Peak travel hours distribution
            const timeOfDayCounts = {
              madrugada: { label: 'Madrugada', hours: '00:00 - 05:59', count: 0, icon: '🌙' },
              manana: { label: 'Mañana', hours: '06:00 - 11:59', count: 0, icon: '🌅' },
              tarde: { label: 'Tarde', hours: '12:00 - 17:59', count: 0, icon: '☀️' },
              noche: { label: 'Noche', hours: '18:00 - 23:59', count: 0, icon: '🌆' }
            };
            filteredByTime.forEach((r) => {
              const d = new Date(r.created_at || r.trip_date || Date.now());
              const hour = d.getHours();
              if (hour >= 0 && hour < 6) timeOfDayCounts.madrugada.count++;
              else if (hour >= 6 && hour < 12) timeOfDayCounts.manana.count++;
              else if (hour >= 12 && hour < 18) timeOfDayCounts.tarde.count++;
              else timeOfDayCounts.noche.count++;
            });
            const maxTimeOfDay = Math.max(1, ...Object.values(timeOfDayCounts).map(t => t.count));

            // 4. Day of the week distribution (Lun to Dom)
            const daysOrder = [
              { index: 1, name: 'Lun' },
              { index: 2, name: 'Mar' },
              { index: 3, name: 'Mié' },
              { index: 4, name: 'Jue' },
              { index: 5, name: 'Vie' },
              { index: 6, name: 'Sáb' },
              { index: 0, name: 'Dom' }
            ];
            const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            filteredByTime.forEach((r) => {
              const d = new Date(r.created_at || r.trip_date || Date.now());
              dayCounts[d.getDay()] = (dayCounts[d.getDay()] || 0) + 1;
            });
            const maxDayCount = Math.max(1, ...Object.values(dayCounts));

            return (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Timeframe Control Header */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                    <div>
                      <h3 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span>Evolución y estadísticas de omniposteos</span>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Métricas temporales, flujo de viajes registrados y hábitos de la comunidad.
                      </p>
                    </div>

                    {/* Timeframe pills */}
                    <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-lg border border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setStatsTimeframe('7d')}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          statsTimeframe === '7d'
                            ? 'bg-amber-400 text-black font-bold shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        7 días
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatsTimeframe('30d')}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          statsTimeframe === '30d'
                            ? 'bg-amber-400 text-black font-bold shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        30 días
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatsTimeframe('all')}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          statsTimeframe === 'all'
                            ? 'bg-amber-400 text-black font-bold shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                      >
                        Histórico
                      </button>
                    </div>
                  </div>

                  {/* Main Timeline Bar Chart */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-2 text-[var(--text-muted)]">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-[var(--text)]">Volumen de publicaciones</span>
                        <span className="text-[10px] text-[var(--text-dim)]">
                          ({filteredByTime.length} en este período)
                        </span>
                      </div>
                      {hoveredDataPoint ? (
                        <div className="text-xs bg-amber-400/10 border border-amber-400/30 text-amber-300 px-2 py-0.5 rounded-md font-mono">
                          <span className="font-bold">{hoveredDataPoint.label}: </span>
                          <span>{hoveredDataPoint.count} omniposteos</span>
                          {hoveredDataPoint.avgRating > 0 && (
                            <span className="ml-1.5 text-amber-400 font-bold">★ {hoveredDataPoint.avgRating}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--text-dim)]">
                          Pasá el cursor sobre las barras para ver detalles
                        </span>
                      )}
                    </div>

                    {/* Interactive Column Histogram */}
                    <div className="h-44 pt-4 pb-2 px-2 bg-[var(--surface-2)]/60 rounded-xl border border-[var(--border)] flex items-end gap-1.5 sm:gap-2">
                      {timelinePoints.map((pt) => {
                        const heightPct = Math.max(6, Math.round((pt.count / maxTimelineCount) * 100));
                        const isHovered = hoveredDataPoint?.label === pt.label;
                        return (
                          <div
                            key={pt.key}
                            className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer relative"
                            onMouseEnter={() => setHoveredDataPoint(pt)}
                            onMouseLeave={() => setHoveredDataPoint(null)}
                          >
                            {/* Hover tooltip popup */}
                            {isHovered && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-amber-400/50 shadow-md text-amber-300 text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 font-mono">
                                <span className="font-bold">{pt.count} posts</span>
                                {pt.avgRating > 0 && <span className="ml-1 text-[var(--text)]">· ★ {pt.avgRating}</span>}
                              </div>
                            )}

                            {/* Bar item */}
                            <div className="w-full flex justify-center h-full items-end pb-1">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                                  isHovered
                                    ? 'bg-amber-400 shadow-md shadow-amber-400/20'
                                    : pt.count > 0
                                    ? 'bg-amber-500/80 hover:bg-amber-400'
                                    : 'bg-[var(--border)]/60'
                                }`}
                              />
                            </div>

                            {/* X-axis label */}
                            <span
                              className={`text-[9px] sm:text-[10px] truncate max-w-full text-center transition-colors ${
                                isHovered ? 'text-amber-400 font-bold' : 'text-[var(--text-dim)]'
                              }`}
                              title={pt.label}
                            >
                              {pt.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reaction balance bar */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
                      <span className="font-medium text-[var(--text)] flex items-center gap-1.5 flex-wrap">
                        <span>Balance global de reacciones:</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span>🗣️</span> {stats.chiflidos} Chiflidos
                        </span>
                        <span className="text-[var(--text-dim)]">vs</span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" /> {stats.bajadas} Bajadas
                        </span>
                      </span>
                      <span className="text-[11px] text-[var(--text-dim)]">
                        {stats.chiflidos + stats.bajadas > 0
                          ? `${Math.round((stats.chiflidos / (stats.chiflidos + stats.bajadas)) * 100)}% de aprobación`
                          : 'Sin reacciones'}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500"
                        style={{
                          width: `${
                            stats.chiflidos + stats.bajadas > 0
                              ? (stats.chiflidos / (stats.chiflidos + stats.bajadas)) * 100
                              : 50
                          }%`
                        }}
                        title={`Chiflidos: ${stats.chiflidos}`}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${
                            stats.chiflidos + stats.bajadas > 0
                              ? (stats.bajadas / (stats.chiflidos + stats.bajadas)) * 100
                              : 50
                          }%`
                        }}
                        title={`Bajadas: ${stats.bajadas}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid: Rating Breakdown & Peak Travel Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rating Distribution Histogram with intermediate half-stars */}
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <h4 className="font-display font-bold text-xs text-[var(--text)]">
                          Distribución de calificaciones
                        </h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-[var(--text-muted)]">Promedio:</span>
                        <span className="font-bold text-xs text-amber-400">{avgRatingInPeriod} ★</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1">
                      {ratingSteps.map((stars) => {
                        const key = stars.toFixed(1);
                        const count = ratingCounts[key] || 0;
                        const pct = filteredByTime.length > 0 ? Math.round((count / filteredByTime.length) * 100) : 0;
                        return (
                          <div key={key} className="flex items-center gap-1.5 text-xs">
                            <span className="w-10 text-[10px] font-mono font-semibold text-[var(--text-muted)] flex items-center justify-end gap-0.5 shrink-0">
                              {key} <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 shrink-0" />
                            </span>
                            <div className="flex-1 h-2 rounded-md bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-sm transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-5 text-right font-mono text-[10px] text-[var(--text)] font-semibold shrink-0">
                              {count}
                            </span>
                            <span className="w-7 text-right font-mono text-[9px] text-[var(--text-dim)] shrink-0">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Peak Hours Breakdown */}
                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-400" />
                        <h4 className="font-display font-bold text-xs text-[var(--text)]">
                          Horarios de viaje registrados
                        </h4>
                      </div>
                      <span className="text-[10px] text-[var(--text-dim)]">Franjas horarias</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {Object.entries(timeOfDayCounts).map(([key, item]) => {
                        const pct = filteredByTime.length > 0 ? Math.round((item.count / filteredByTime.length) * 100) : 0;
                        return (
                          <div key={key} className="bg-[var(--surface-2)] p-2.5 rounded-lg border border-[var(--border)]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{item.icon}</span>
                              <span className="font-mono font-bold text-xs text-[var(--text)]">{item.count}</span>
                            </div>
                            <div className="font-semibold text-xs text-[var(--text)]">{item.label}</div>
                            <div className="text-[9px] text-[var(--text-dim)] font-mono">{item.hours}</div>
                            <div className="mt-2 h-1.5 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
                              <div
                                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-[var(--text-dim)] text-right mt-1 font-mono">{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Day of the Week Activity */}
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-display font-bold text-xs text-[var(--text)]">
                        Distribución por día de la semana
                      </h4>
                    </div>
                    <span className="text-[10px] text-[var(--text-dim)]">Días con mayor volumen de publicaciones</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 pt-2">
                    {daysOrder.map((day) => {
                      const count = dayCounts[day.index] || 0;
                      const heightPct = Math.max(8, Math.round((count / maxDayCount) * 100));
                      const isPeak = count === maxDayCount && count > 0;
                      return (
                        <div key={day.index} className="flex flex-col items-center gap-1">
                          <span className="font-mono text-[10px] text-[var(--text-muted)] font-semibold">{count}</span>
                          <div className="w-full h-20 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] flex items-end p-1">
                            <div
                              className={`w-full rounded-md transition-all duration-500 ${
                                isPeak ? 'bg-emerald-400 shadow-xs shadow-emerald-400/30' : 'bg-emerald-500/70 hover:bg-emerald-400'
                              }`}
                              style={{ height: `${heightPct}%` }}
                              title={`${day.name}: ${count} omniposteos`}
                            />
                          </div>
                          <span className={`text-[10px] font-semibold ${isPeak ? 'text-emerald-400 font-bold' : 'text-[var(--text-muted)]'}`}>
                            {day.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: Lines */}
      {activeTab === 'lines' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create or Edit Line Form */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                {editingLine ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Editar línea {editingLine.number}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Nueva línea</span>
                  </>
                )}
              </h3>
              {editingLine && (
                <button
                  onClick={() => {
                    setEditingLine(null);
                    setNewLineNumber('');
                    setNewLineRoutesText('');
                  }}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <form onSubmit={editingLine ? handleUpdateLine : handleCreateLine} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  required
                  value={newLineNumber}
                  onChange={(e) => setNewLineNumber(e.target.value)}
                  placeholder="Ej: 183, D11, G"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] font-mono font-bold focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Empresa operadora
                </label>
                <select
                  value={newLineCompanyId}
                  onChange={(e) => setNewLineCompanyId(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                >
                  <option value="">-- Sin asignar --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Tipo * (Obligatorio)
                </label>
                <select
                  required
                  value={newLineType}
                  onChange={(e) => setNewLineType(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                >
                  {lineTypes.map((t) => (
                    <option key={t.id || t.slug} value={t.slug}>
                      {t.label} ({t.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">
                    Recorridos (uno por línea) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newLineRoutesText.trim()) return;
                      const res = addInvertedRoutes(newLineRoutesText);
                      setNewLineRoutesText(res.updatedText);
                      if (res.addedCount > 0) {
                        setStatusMessage({
                          type: 'success',
                          text: `Se generaron e insertaron ${res.addedCount} recorrido(s) inverso(s). Podés editarlos si difieren.`
                        });
                      } else {
                        setStatusMessage({
                          type: 'success',
                          text: 'Los recorridos ya cuentan con sus inversos o no tienen formato "A → B" o "A - B".'
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 px-2 py-0.5 rounded border border-amber-400/30 transition-colors cursor-pointer"
                    title="Generar automáticamente los recorridos de vuelta (B → A) para que puedas editarlos si no son idénticos"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                    <span>Auto-generar inversos (B → A)</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newLineRoutesText}
                  onChange={(e) => setNewLineRoutesText(e.target.value)}
                  placeholder="Paso Molino - Pocitos&#10;Paso Molino - Punta Carretas"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-[var(--text-dim)] block mt-0.5">
                  Escribí los recorridos (ej: <code>A - B</code> o <code>A → B</code>). Al presionar <strong>Auto-generar inversos</strong> se agregará <code>B → A</code> directamente en el texto para que lo ajustes si hace falta antes de guardar.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingLine}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLine
                    ? 'Guardando…'
                    : editingLine
                    ? 'Guardar Cambios'
                    : 'Crear Línea'}
                </button>
              </div>
            </form>
          </div>

          {/* Lines List with creator and full routes */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-1.5">
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={lineSearch}
                onChange={(e) => setLineSearch(e.target.value)}
                placeholder="Buscar por número, tipo (urbano, suburbano…), empresa, recorrido o creador…"
                className="w-full bg-transparent text-xs text-[var(--text)] focus:outline-none py-1"
              />
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)] max-h-[650px] overflow-y-auto">
              {filteredLines.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No se encontraron líneas.
                </div>
              ) : (
                filteredLines.map((l) => {
                  const routes = getLineRoutes(l);
                  return (
                    <div key={l.id} className="p-3.5 space-y-2 hover:bg-[var(--surface-2)]/40 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Company logo or bus */}
                          {l.companies?.logo_url ? (
                            <img
                              src={l.companies.logo_url}
                              alt={l.companies.name}
                              className="w-8 h-8 rounded-lg object-contain bg-white p-1 border border-[var(--border)] shrink-0 mt-0.5"
                              referrerPolicy="no-referrer"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs shrink-0 mt-0.5">
                              🚌
                            </div>
                          )}

                          <span
                            className="px-2.5 py-1 rounded font-mono font-bold text-xs text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: l.companies?.color || '#3b82f6' }}
                          >
                            {l.number}
                          </span>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[var(--text)]">
                                {l.companies?.name || 'CUTCSA'}
                              </span>
                              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider font-mono">
                                {l.type || 'urbano'}
                              </span>
                            </div>

                            {/* Creator info */}
                            <div className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
                              Creada por: <span className="text-amber-400 font-medium">@{l.creator?.username || 'sistema'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditLine(l)}
                            className="flat-btn text-xs py-1 px-2 text-amber-400 border-amber-400/30 hover:bg-amber-400/10 flex items-center gap-1 cursor-pointer"
                            title="Editar línea"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLine(l.id, l.number)}
                            className="flat-btn text-xs py-1 px-2 text-red-400 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1 cursor-pointer"
                            title="Eliminar línea"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>

                      {/* Registered routes list */}
                      <div className="pl-11 pt-1 space-y-1">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--text-dim)] block">
                          Recorridos ({routes.length}):
                        </span>
                        {routes.length > 0 ? (
                          routes.map((route, rIdx) => (
                            <div key={rIdx} className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 leading-snug">
                              <span className="text-amber-400/80 text-[11px] shrink-0">📍</span>
                              <span>{route}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-[var(--text-muted)]">
                            Sin recorridos cargados
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Companies */}
      {activeTab === 'companies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                {editingCompany ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Editar Empresa</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Nueva Empresa</span>
                  </>
                )}
              </h3>
              {editingCompany && (
                <button
                  onClick={() => {
                    setEditingCompany(null);
                    setNewCompanyName('');
                    setNewCompanyLogoUrl('');
                  }}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Nombre de la empresa *
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="CUTCSA, COME, COETC…"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Logo de la empresa (URL opcional)
                </label>
                <input
                  type="url"
                  value={newCompanyLogoUrl}
                  onChange={(e) => setNewCompanyLogoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
                {newCompanyLogoUrl && (
                  <div className="mt-2 flex items-center gap-2 p-2 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
                    <img
                      src={newCompanyLogoUrl}
                      alt="Preview"
                      className="w-7 h-7 object-contain bg-white rounded p-0.5"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                    <span className="text-[10px] text-[var(--text-muted)]">Vista previa del logo</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Color distintivo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCompanyColor}
                    onChange={(e) => setNewCompanyColor(e.target.value)}
                    className="w-8 h-8 rounded border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCompanyColor}
                    onChange={(e) => setNewCompanyColor(e.target.value)}
                    className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text)] focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCompany}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCompany
                    ? 'Guardando…'
                    : editingCompany
                    ? 'Guardar Cambios'
                    : 'Crear Empresa'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between gap-3 hover:border-amber-400/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={c.name}
                        className="w-9 h-9 object-contain rounded-lg bg-white p-1 border border-[var(--border)] shadow-xs shrink-0"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span
                        className="w-6 h-6 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: c.color || '#3b82f6' }}
                      >
                        {c.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-[var(--text)] block truncate">
                        {c.name}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {c.color}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEditCompany(c)}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 cursor-pointer"
                      title="Editar empresa"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(c.id, c.name)}
                      className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title="Eliminar empresa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Types */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                {editingType ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Editar Tipo</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Nuevo Tipo de Línea</span>
                  </>
                )}
              </h3>
              {editingType && (
                <button
                  onClick={() => {
                    setEditingType(null);
                    setNewTypeSlug('');
                    setNewTypeLabel('');
                    setNewTypeDesc('');
                  }}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={editingType ? handleUpdateType : handleCreateType} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Identificador (Slug) *
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingType)}
                  value={newTypeSlug}
                  onChange={(e) => setNewTypeSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="urbano, diferencial, inter…"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text)] focus:border-amber-400 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Etiqueta visible (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={newTypeLabel}
                  onChange={(e) => setNewTypeLabel(e.target.value)}
                  placeholder="Urbano, Diferencial, Suburbano…"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newTypeDesc}
                  onChange={(e) => setNewTypeDesc(e.target.value)}
                  placeholder="Servicio regular dentro del departamento…"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingType}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingType
                    ? 'Guardando…'
                    : editingType
                    ? 'Guardar Cambios'
                    : 'Crear Tipo'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
              {lineTypes.map((t) => (
                <div key={t.id || t.slug} className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--surface-2)]/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text)]">{t.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-amber-400 border border-[var(--border)]">
                        {t.slug}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-xs text-[var(--text-muted)]">{t.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setEditingType(t);
                        setNewTypeSlug(t.slug);
                        setNewTypeLabel(t.label);
                        setNewTypeDesc(t.description || '');
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 cursor-pointer"
                      title="Editar tipo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteType(t.id, t.label)}
                      className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title="Eliminar tipo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Tags */}
      {activeTab === 'tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 h-fit space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-1.5">
                {editingTag ? (
                  <>
                    <Edit3 className="w-4 h-4 text-amber-400" />
                    <span>Editar Tag</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Nuevo Tag</span>
                  </>
                )}
              </h3>
              {editingTag && (
                <button
                  onClick={() => {
                    setEditingTag(null);
                    setNewTagLabel('');
                    setNewTagSlug('');
                    setNewTagEmoji('');
                  }}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={editingTag ? handleUpdateTag : handleCreateTag} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Nombre (Label) *
                </label>
                <input
                  type="text"
                  required
                  value={newTagLabel}
                  onChange={(e) => setNewTagLabel(e.target.value)}
                  placeholder="Aire al mango, Asientos cómodos…"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                      Emoji
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Smile className="w-3 h-3" />
                      <span>{showEmojiPicker ? 'Cerrar' : 'Elegir'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      maxLength={30}
                      value={newTagEmoji}
                      onChange={(e) => setNewTagEmoji(e.target.value)}
                      placeholder="🥶, ✨, 💺"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] text-center focus:border-amber-400 focus:outline-none"
                    />
                    {newTagEmoji && (
                      <button
                        type="button"
                        onClick={() => setNewTagEmoji('')}
                        className="p-2 text-xs text-[var(--text-muted)] hover:text-red-400 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg cursor-pointer shrink-0"
                        title="Borrar emoji"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                    Categoría
                  </label>
                  <select
                    value={newTagCategory}
                    onChange={(e) => setNewTagCategory(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label} ({c.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Emoji Picker Drawer / Grid */}
              {showEmojiPicker && (
                <div className="bg-[var(--surface-2)] border border-amber-400/30 rounded-xl p-2.5 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text)]">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Smile className="w-3.5 h-3.5" />
                      Elegir Emojis
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">
                      Hacé clic para agregar
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {CURATED_EMOJI_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-1">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                          {group.name}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {group.emojis.map((emoji) => {
                            const isIncluded = newTagEmoji.includes(emoji);
                            return (
                              <button
                                type="button"
                                key={emoji}
                                onClick={() => {
                                  const current = newTagEmoji.trim();
                                  if (!current) {
                                    setNewTagEmoji(emoji);
                                  } else if (current.includes(emoji)) {
                                    setNewTagEmoji(current.replace(emoji, '').replace(/\s+/g, ' ').trim());
                                  } else {
                                    setNewTagEmoji(`${current} ${emoji}`.trim());
                                  }
                                }}
                                className={`w-7 h-7 text-sm rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                  isIncluded
                                    ? 'bg-amber-400/20 border border-amber-400 scale-110 shadow-sm'
                                    : 'bg-[var(--surface)] hover:bg-[var(--surface-3)] border border-[var(--border)]'
                                }`}
                                title={`Agregar o quitar ${emoji}`}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tag Live Preview Card */}
              <div className="bg-[var(--surface-2)]/60 border border-dashed border-[var(--border)] rounded-lg p-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{newTagEmoji.trim() || '🏷️'}</span>
                  <span className="text-xs font-bold text-[var(--text)] truncate">
                    {newTagLabel.trim() || 'Nombre del tag'}
                  </span>
                </div>
                <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
                  {categories.find((c) => c.slug === newTagCategory)?.label || newTagCategory}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                  Slug {editingTag ? '(identificador único editable)' : '(opcional)'}
                </label>
                <input
                  type="text"
                  value={newTagSlug}
                  onChange={(e) => setNewTagSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="aire-al-mango (automático si vacío)"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex flex-col gap-1.5">
                <button
                  type="submit"
                  disabled={isSubmittingTag}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-display font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTag
                    ? 'Guardando…'
                    : editingTag
                    ? 'Guardar Cambios'
                    : 'Crear Tag'}
                </button>
                {editingTag && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTag(null);
                      setNewTagLabel('');
                      setNewTagSlug('');
                      setNewTagEmoji('');
                    }}
                    className="w-full py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] text-[var(--text-muted)] text-xs rounded-lg transition-all border border-[var(--border)] cursor-pointer"
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {tags.map((t) => (
                <div
                  key={t.id || t.slug}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-2 hover:border-amber-400/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {t.emoji && <span className="text-sm">{t.emoji}</span>}
                      <span className="text-xs font-bold text-[var(--text)] truncate">{t.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-[var(--text-dim)]">{t.slug}</span>
                      {t.category && (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--surface-2)] text-[var(--text-muted)]">
                          {t.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingTag(t);
                        setNewTagLabel(t.label);
                        setNewTagSlug(t.slug);
                        setNewTagEmoji(t.emoji || '');
                        setNewTagCategory(t.category || (categories[0]?.slug || 'confort'));
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                      }}
                      className="p-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-amber-400 cursor-pointer"
                      title="Editar tag"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(t.id || '', t.label)}
                      className="p-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer"
                      title="Eliminar tag"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Tag Categories Management */}
          <div className="lg:col-span-3 border-t border-[var(--border)] pt-6 mt-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-display font-bold text-sm text-[var(--text)] flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>Categorías de Tags</span>
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  Creá y administrá las categorías para clasificar tags (confort, general, seguridad, etc.) y organizar filtros.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form: Add Category */}
              <div className="bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-xl p-4 space-y-3 h-fit">
                <h5 className="font-bold text-xs text-[var(--text)] flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nueva Categoría</span>
                </h5>

                <form onSubmit={handleCreateCategory} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                      Etiqueta visible (Label) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCatLabel(val);
                        if (!catSlugEditedManually) {
                          const autoSlug = val
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '');
                          setNewCatSlug(autoSlug);
                        }
                      }}
                      placeholder="Confort, Seguridad, General…"
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block mb-1">
                      Slug (automático si vacío)
                    </label>
                    <input
                      type="text"
                      value={newCatSlug}
                      onChange={(e) => {
                        setCatSlugEditedManually(true);
                        setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                      }}
                      placeholder="confort, seguridad…"
                      className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-xs font-mono text-[var(--text)] focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingCat || !newCatLabel.trim()}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-black font-display font-bold text-xs rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingCat ? 'Creando…' : 'Crear Categoría'}
                  </button>
                </form>
              </div>

              {/* List of Categories */}
              <div className="lg:col-span-2 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {categories.map((c) => {
                    const tagCount = tags.filter((t) => (t.category || '').toLowerCase() === c.slug.toLowerCase()).length;
                    return (
                      <div
                        key={c.slug}
                        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex items-center justify-between gap-3 hover:border-amber-400/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text)] truncate">{c.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-amber-400 border border-[var(--border)]">
                              {c.slug}
                            </span>
                          </div>
                          <span className="text-[10px] text-[var(--text-dim)] block mt-0.5">
                            {tagCount} {tagCount === 1 ? 'tag asignado' : 'tags asignados'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.slug, c.label)}
                          className="p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer shrink-0 transition-colors"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Reviews Moderation */}
      {activeTab === 'reviews' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
          <div className="p-4 bg-[var(--surface-2)]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--text)]">
                  Moderación de omniposteos
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Buscá y filtrá opiniones para supervisar o eliminar contenido que no cumpla las normas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSqlHelpModal({
                    isOpen: true,
                    title: 'Permisos de Notificaciones en Supabase (SQL)',
                    explanation: 'Si las notificaciones entre cuentas o en tiempo real muestran error de permisos en Supabase (Error 42501), ejecutá este comando en Supabase → SQL Editor para otorgar permisos a todos los usuarios:',
                    sqlCommand: `-- Habilitar permisos de notificaciones para usuarios autenticados y anónimos:
GRANT ALL ON TABLE public.notifications TO anon, authenticated;

-- Si tu tabla tiene Row Level Security (RLS) activo:
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all notifications" ON public.notifications;
CREATE POLICY "Allow all notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`
                  });
                }}
                className="flat-btn text-[11px] py-1 px-2.5 text-amber-400 border-amber-400/30 hover:bg-amber-400/10 self-start sm:self-auto cursor-pointer"
                title="Ver comando SQL para configurar la tabla de notificaciones"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>SQL Notificaciones</span>
              </button>
            </div>

            {/* Filter controls: robust responsive grid that prevents any intermediate overflow */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
              <div className="sm:col-span-2 lg:col-span-5 relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={modSearchText}
                  onChange={(e) => setModSearchText(e.target.value)}
                  placeholder="Buscar en el texto de la reseña…"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-3">
                <input
                  type="text"
                  value={modFilterUser}
                  onChange={(e) => setModFilterUser(e.target.value)}
                  placeholder="Filtrar por @usuario…"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-1 lg:col-span-2">
                <input
                  type="text"
                  value={modFilterLine}
                  onChange={(e) => setModFilterLine(e.target.value)}
                  placeholder="Línea…"
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-2">
                <select
                  value={modFilterRating}
                  onChange={(e) => setModFilterRating(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs text-[var(--text)] focus:border-amber-400 focus:outline-none"
                >
                  <option value="all">★ Todas las estrellas</option>
                  <option value="5">★★★★★ (5.0)</option>
                  <option value="4.5">★★★★½ (4.5)</option>
                  <option value="4">★★★★☆ (4.0)</option>
                  <option value="3.5">★★★½☆ (3.5)</option>
                  <option value="3">★★★☆☆ (3.0)</option>
                  <option value="2.5">★★½☆☆ (2.5)</option>
                  <option value="2">★★☆☆☆ (2.0)</option>
                  <option value="1.5">★½☆☆☆ (1.5)</option>
                  <option value="1">★☆☆☆☆ (1.0)</option>
                  <option value="0.5">½☆☆☆☆ (0.5)</option>
                </select>
              </div>
            </div>

            {(modSearchText || modFilterUser || modFilterLine || modFilterRating !== 'all') && (
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                <span>{filteredReviews.length} resultado(s) encontrados</span>
                <button
                  onClick={() => {
                    setModSearchText('');
                    setModFilterUser('');
                    setModFilterLine('');
                    setModFilterRating('all');
                  }}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No se encontraron reseñas con los filtros especificados.
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <div key={rev.id} className="p-4 flex items-start justify-between gap-3 hover:bg-[var(--surface-2)]/30 transition-colors">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-xs text-amber-400">
                      @{rev.users?.username || 'anónimo'}
                    </span>
                    <span className="text-xs text-[var(--text-dim)]">en línea</span>
                    <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                      {rev.lines?.number || '—'}
                    </span>
                    {rev.vehicle_number && (
                      <span className="text-[10px] text-[var(--text-dim)] font-mono">
                        Coche #{rev.vehicle_number}
                      </span>
                    )}
                    {rev.route_label && (
                      <span className="text-[10px] text-[var(--text-dim)]">
                        · {rev.route_label}
                      </span>
                    )}
                    <span className="text-xs text-amber-400 font-bold ml-auto flex items-center gap-1.5 bg-[var(--surface)] px-2 py-0.5 rounded-md border border-[var(--border)]">
                      <StarRating rating={rev.rating} size="xs" colorClass="text-amber-400" />
                      <span>{rev.rating.toFixed(1)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                    {rev.body}
                  </p>

                  <span className="text-[10px] text-[var(--text-dim)] block">
                    {new Date(rev.created_at).toLocaleDateString('es-UY', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(rev.created_at).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false })} hs
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteReview(rev.id)}
                  className="flat-btn text-xs py-1 px-2.5 text-red-400 border-red-500/30 hover:bg-red-500/10 cursor-pointer shrink-0 flex items-center gap-1 ml-2"
                  title="Eliminar publicación"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Ayuda SQL para Permisos en Supabase */}
      {sqlHelpModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--surface)] border border-red-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-display font-bold text-sm text-[var(--text)]">
                  {sqlHelpModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSqlHelpModal(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed whitespace-pre-line">
              {sqlHelpModal.explanation}
            </p>

            <div className="relative">
              <pre className="bg-black/90 text-emerald-400 border border-[var(--border)] rounded-xl p-3 font-mono text-[11px] overflow-x-auto select-all leading-normal">
                {sqlHelpModal.sqlCommand}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlHelpModal.sqlCommand);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="absolute top-2 right-2 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-[10px] rounded-md flex items-center gap-1 cursor-pointer transition-all shadow-md"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-dim)]">
                Pegalo en <strong>Supabase → SQL Editor</strong> y dale a Run.
              </span>
              <button
                onClick={() => setSqlHelpModal(null)}
                className="px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs font-semibold text-[var(--text)] rounded-lg border border-[var(--border)] cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
