import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeedView } from './views/HomeFeedView';
import { SearchView } from './views/SearchView';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { ManualView } from './views/ManualView';
import { NewsView } from './views/NewsView';
import { AchievementsView } from './views/AchievementsView';
import { AdminView } from './views/AdminView';
import { ShareModal } from './components/ShareModal';
import { NewReviewModal } from './components/NewReviewModal';
import { SingleReviewModal } from './components/SingleReviewModal';
import { ThemeMode, UserProfile, ReviewItem } from './types';
import { supabase } from './lib/supabase';
import { hydrateProfileMeta } from './lib/profileSync';
import { getAchievementEntitlements } from './lib/achievementEntitlements';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('feed');
  const [viewParam, setViewParam] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Modals
  const [shareReview, setShareReview] = useState<ReviewItem | null>(null);
  const [newReviewModalOpen, setNewReviewModalOpen] = useState<boolean>(false);
  const [preselectedLineId, setPreselectedLineId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  // Read review query parameter from URL on mount & back/forward navigation
  useEffect(() => {
    const handleUrlReview = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rId = params.get('review');
        if (rId) {
          setSelectedReviewId(rId);
        }
      } catch (e) {}
    };

    handleUrlReview();
    window.addEventListener('popstate', handleUrlReview);
    return () => window.removeEventListener('popstate', handleUrlReview);
  }, []);

  // Open or close review with browser URL synchronization
  const handleSelectReview = (revId: string | null) => {
    setSelectedReviewId(revId);
    try {
      const url = new URL(window.location.href);
      if (revId) {
        url.searchParams.set('review', revId);
      } else {
        url.searchParams.delete('review');
      }
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem('omniboxd_theme') as ThemeMode) || 'dark';
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    const level = currentUser?.achievement_level || 0.5;
    const entitlements = getAchievementEntitlements(level >= 5 ? 49 : level >= 4.5 ? 40 : level >= 4 ? 31 : level >= 3.5 ? 24 : level >= 3 ? 17 : level >= 2.5 ? 12 : level >= 2 ? 7 : level >= 1.5 ? 4 : level >= 1 ? 1 : 0);
    if ((newTheme === 'medium' && !entitlements.canUseMediumTheme) ||
        (newTheme === 'night' && !entitlements.canUseNightTheme) ||
        (newTheme === 'galaxy' && !entitlements.canUseGalaxyTheme) ||
        (newTheme === 'auto' && !entitlements.canUseAutomaticTheme)) {
      return;
    }
    setTheme(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('omniboxd_theme', newTheme);
  };

  useEffect(() => {
    if (theme !== 'auto') return;
    const applyAutomaticTheme = () => {
      const hour = new Date().getHours();
      document.documentElement.dataset.theme = hour >= 19 || hour < 7 ? 'night' : 'light';
    };
    applyAutomaticTheme();
    const timer = window.setInterval(applyAutomaticTheme, 60000);
    return () => window.clearInterval(timer);
  }, [theme]);

  // Check auth session
  useEffect(() => {
    const mergeUserProfile = (user: any, prof: any): UserProfile => {
      let extraData: any = {};
      try {
        const extraStr = localStorage.getItem(`omniboxd_profile_extra_${user.id}`);
        if (extraStr) extraData = JSON.parse(extraStr);
      } catch (e) {}

      const mergedLocation = prof?.location || user.user_metadata?.location || extraData.location || null;
      const mergedBirthDate = prof?.birth_date || user.user_metadata?.birth_date || extraData.birth_date || null;
      const mergedVisibility = prof?.birth_date_visibility || user.user_metadata?.birth_date_visibility || extraData.birth_date_visibility || null;

      let baseProfile: UserProfile;
      if (prof) {
        baseProfile = {
          ...prof,
          location: mergedLocation,
          birth_date: mergedBirthDate,
          birth_date_visibility: mergedVisibility
        };
      } else {
        baseProfile = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'viajero',
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          location: mergedLocation,
          birth_date: mergedBirthDate,
          birth_date_visibility: mergedVisibility
        };
      }

      return hydrateProfileMeta(baseProfile);
    };

    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (user) {
          const { data: prof } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          setCurrentUser(mergeUserProfile(user, prof));
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();

    // Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) {
        const { data: prof } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setCurrentUser(mergeUserProfile(user, prof));
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Parse initial route from URL
  useEffect(() => {
    const parseRouteFromLocation = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const userParam = params.get('u');
      const lineParam = params.get('line');
      const reviewParam = params.get('review') || params.get('post') || params.get('omnipost');

      if (reviewParam) {
        setSelectedReviewId(reviewParam);
      }

      if (userParam) {
        setCurrentView('profile');
        setViewParam(userParam);
      } else if (lineParam) {
        setCurrentView('line');
        setViewParam(lineParam);
      } else if (path.startsWith('/perfil') || path.startsWith('/html/profile.html')) {
        setCurrentView('profile');
      } else if (path.startsWith('/buscar') || path.startsWith('/html/search.html')) {
        setCurrentView('search');
      } else if (path.startsWith('/linea') || path.startsWith('/html/line.html')) {
        setCurrentView('line');
      } else if (path.startsWith('/entrar') || path.startsWith('/html/login.html')) {
        setCurrentView('auth');
      } else if (path.startsWith('/manual') || path.startsWith('/html/help.html')) {
        setCurrentView('help');
      } else if (path.startsWith('/novedades') || path.startsWith('/html/news.html')) {
        setCurrentView('news');
      } else if (path.startsWith('/logros') || path.startsWith('/html/achievements.html')) {
        setCurrentView('achievements');
      } else if (path.startsWith('/admin') || path.startsWith('/html/admin.html')) {
        setCurrentView('admin');
      } else {
        setCurrentView('feed');
      }
    };

    parseRouteFromLocation();

    const handlePopState = () => {
      parseRouteFromLocation();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update browser URL for friendly Netlify routes
    try {
      let targetPath = '/inicio';
      if (view === 'profile') targetPath = param ? `/perfil?u=${encodeURIComponent(param)}` : '/perfil';
      else if (view === 'search') targetPath = '/buscar';
      else if (view === 'line') targetPath = param ? `/linea?line=${encodeURIComponent(param)}` : '/linea';
      else if (view === 'auth') targetPath = '/entrar';
      else if (view === 'help') targetPath = '/manual';
      else if (view === 'news') targetPath = '/novedades';
      else if (view === 'achievements') targetPath = '/logros';
      else if (view === 'admin') targetPath = '/admin';

      if (window.location.pathname !== targetPath) {
        window.history.pushState({ view, param }, '', targetPath);
      }
    } catch (e) {}
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    handleNavigate('feed');
  };

  const handleOpenNewReviewForLine = (lineId: string) => {
    setPreselectedLineId(lineId);
    setNewReviewModalOpen(true);
  };

  const handleOpenGeneralNewReview = () => {
    if (!currentUser) {
      handleNavigate('auth');
      return;
    }
    setPreselectedLineId(null);
    setNewReviewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors duration-200">
      {/* Top Header */}
      {currentView !== 'auth' && (
        <>
          <Header
            theme={theme}
            onThemeChange={handleThemeChange}
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            onOpenReview={(revId) => handleSelectReview(revId)}
            currentView={currentView}
            onOpenNewReview={handleOpenGeneralNewReview}
          />
          {/* Spacer so fixed header doesn't cover top content */}
          <div className="h-[var(--head-h)] shrink-0 pointer-events-none" aria-hidden="true" />
        </>
      )}

      {/* Main View Router */}
      <main className="transition-all">
        {currentView === 'feed' && (
          <HomeFeedView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenNewReview={handleOpenGeneralNewReview}
            onOpenShare={(rev) => setShareReview(rev)}
          />
        )}

        {currentView === 'search' && (
          <SearchView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenShare={(rev) => setShareReview(rev)}
            onOpenNewReviewForLine={handleOpenNewReviewForLine}
            selectedLineId={viewParam}
          />
        )}

        {currentView === 'line' && (
          <SearchView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onOpenShare={(rev) => setShareReview(rev)}
            onOpenNewReviewForLine={handleOpenNewReviewForLine}
            selectedLineId={viewParam}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            targetUsername={viewParam}
            onNavigate={handleNavigate}
            onOpenShare={(rev) => setShareReview(rev)}
            onSignOut={handleSignOut}
            onProfileUpdated={(updated) => setCurrentUser(updated)}
          />
        )}

        {currentView === 'auth' && (
          <AuthView
            onNavigate={handleNavigate}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              handleNavigate('feed');
            }}
          />
        )}

        {currentView === 'help' && (
          <ManualView onNavigate={handleNavigate} />
        )}

        {currentView === 'news' && (
          <NewsView onNavigate={handleNavigate} />
        )}
        {currentView === 'achievements' && (
          <AchievementsView onNavigate={handleNavigate} currentUser={currentUser} />
        )}

        {currentView === 'admin' && (
          <AdminView
            currentUser={currentUser}
            isAuthChecking={isAuthChecking}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      {currentView !== 'auth' && (
        <BottomNav
          currentView={currentView}
          onNavigate={(v) => handleNavigate(v)}
          currentUser={currentUser}
          onOpenNewReview={handleOpenGeneralNewReview}
        />
      )}

      {/* New Review Modal */}
      <NewReviewModal
        isOpen={newReviewModalOpen}
        onClose={() => {
          setNewReviewModalOpen(false);
          setPreselectedLineId(null);
        }}
        currentUser={currentUser}
        initialLineId={preselectedLineId}
        onReviewCreated={() => {
          // If on feed, this will be reflected via realtime or tab reload
          handleNavigate('feed');
        }}
        onNavigateToAuth={() => {
          setNewReviewModalOpen(false);
          handleNavigate('auth');
        }}
      />

      {/* Single Referenced Review Modal (e.g. from Notifications or direct link) */}
      <SingleReviewModal
        reviewId={selectedReviewId}
        currentUser={currentUser}
        onClose={() => handleSelectReview(null)}
        onNavigate={handleNavigate}
        onOpenShare={(rev) => setShareReview(rev)}
      />

      {/* Share Modal (html-to-image preview, copy image, png download) - rendered in front of referenced omnipost */}
      {shareReview && (
        <ShareModal
          review={shareReview}
          currentTheme={theme}
          onClose={() => setShareReview(null)}
        />
      )}
    </div>
  );
}
