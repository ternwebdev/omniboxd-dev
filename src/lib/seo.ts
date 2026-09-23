// Utility to update document title and Open Graph tags dynamically for social preview and browser tabs

export interface SeoMetadata {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
}

export function updateSeoMetadata({ title, description, image, url }: SeoMetadata) {
  const fullTitle = title 
    ? (title.includes('omniboxd') ? title : `${title} — omniboxd`)
    : 'omniboxd — Letterboxd de los bondis uruguayos';
  
  const finalDesc = description || 'Diario de viajes y reseñas de ómnibus uruguayos al estilo Letterboxd. Calificá tus viajes, choferes y líneas favoritas.';
  const finalImage = image || `${window.location.origin}/img/og-preview.jpg`;
  const finalUrl = url || window.location.href;

  document.title = fullTitle;

  const setMetaTag = (selector: string, attr: string, value: string) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const [key, val] = selector.replace(/[\[\]']/g, '').split('=');
      el.setAttribute(key, val);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  // Open Graph
  setMetaTag('meta[property="og:title"]', 'content', fullTitle);
  setMetaTag('meta[property="og:description"]', 'content', finalDesc);
  setMetaTag('meta[property="og:image"]', 'content', finalImage);
  setMetaTag('meta[property="og:image:secure_url"]', 'content', finalImage);
  setMetaTag('meta[property="og:url"]', 'content', finalUrl);

  // Twitter
  setMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
  setMetaTag('meta[name="twitter:description"]', 'content', finalDesc);
  setMetaTag('meta[name="twitter:image"]', 'content', finalImage);

  // Description
  setMetaTag('meta[name="description"]', 'content', finalDesc);
}
