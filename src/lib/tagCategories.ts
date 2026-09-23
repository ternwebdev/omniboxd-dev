import { TagCategory, ReviewTag } from '../types';

const STORAGE_KEY = 'omniboxd_tag_categories';

export const DEFAULT_TAG_CATEGORIES: TagCategory[] = [
  { slug: 'confort', label: 'Confort' },
  { slug: 'general', label: 'General' },
  { slug: 'seguridad', label: 'Seguridad' },
  { slug: 'chofer', label: 'Chofer' },
  { slug: 'puntualidad', label: 'Puntualidad' },
  { slug: 'manejo', label: 'Manejo' }
];

export function getTagCategories(existingTags?: ReviewTag[]): TagCategory[] {
  let categories: TagCategory[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      categories = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading tag categories from storage:', e);
  }

  if (!categories || categories.length === 0) {
    categories = [...DEFAULT_TAG_CATEGORIES];
  }

  // Ensure default categories are present unless explicitly removed
  const catMap = new Map<string, TagCategory>();
  categories.forEach((c) => catMap.set(c.slug.toLowerCase(), c));

  // Also include any category found in existing tags from DB if not present
  if (existingTags && existingTags.length > 0) {
    existingTags.forEach((tag) => {
      if (tag.category) {
        const slug = tag.category.toLowerCase().trim();
        if (!catMap.has(slug)) {
          const label = slug.charAt(0).toUpperCase() + slug.slice(1);
          const newCat: TagCategory = { slug, label };
          catMap.set(slug, newCat);
        }
      }
    });
  }

  return Array.from(catMap.values());
}

export function saveTagCategories(categories: TagCategory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.warn('Error saving tag categories:', e);
  }
}

export function addTagCategory(label: string, customSlug?: string): TagCategory[] {
  const cleanLabel = label.trim();
  const slug = (customSlug?.trim() || cleanLabel.toLowerCase().replace(/[^a-z0-9-]/g, '-')).toLowerCase();
  
  const current = getTagCategories();
  if (current.some((c) => c.slug === slug)) {
    throw new Error(`La categoría con slug "${slug}" ya existe.`);
  }

  const updated = [...current, { slug, label: cleanLabel }];
  saveTagCategories(updated);
  return updated;
}

export function removeTagCategory(slugToRemove: string): TagCategory[] {
  const current = getTagCategories();
  const updated = current.filter((c) => c.slug !== slugToRemove);
  saveTagCategories(updated);
  return updated;
}
