/** Persists shop catalog in sessionStorage so Google OAuth reloads do not wipe displayed data. */

const STORAGE_KEY = "myshop_catalog_v1";
const MAX_AGE_MS = 10 * 60 * 1000;

export const ALL_SHOP_QUERY_PARAMS = {
  categoryIdParam: null,
  subcategoryIdParam: null,
  sellerIdParam: null,
  searchQueryParam: null,
};

export function saveCatalogCache({ categories, subcategories, products } = {}) {
  try {
    const existing = readRaw() || {};
    const next = {
      categories: categories ?? existing.categories ?? [],
      subcategories: subcategories ?? existing.subcategories ?? [],
      products: products ?? existing.products ?? [],
      savedAt: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
}

function readRaw() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function loadCatalogCache() {
  const data = readRaw();
  if (!data) return null;
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
    products: Array.isArray(data.products) ? data.products : [],
  };
}

export function hydrateQueryClient(queryClient) {
  if (!queryClient) return;
  const cached = loadCatalogCache();
  if (!cached?.products?.length) return;
  queryClient.setQueryData(["shopProducts", ALL_SHOP_QUERY_PARAMS], cached.products);
}
