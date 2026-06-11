import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { loadCatalogCache, hydrateQueryClient } from "../utils/catalogCache";
import { hydrateCategoriesFromCache } from "../Features/Backend/CategorySlice";
import { hydrateSubcategoriesFromCache } from "../Features/Backend/SubCategorySlice";
import { hydrateProductsFromCache } from "../Features/Backend/ProductSlice";

/** Restores catalog from sessionStorage after Google OAuth full-page reload. */
export default function CatalogHydrator() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const cached = loadCatalogCache();
    if (!cached) return;

    hydrateQueryClient(queryClient);
    if (cached.categories?.length) {
      dispatch(hydrateCategoriesFromCache(cached.categories));
    }
    if (cached.subcategories?.length) {
      dispatch(hydrateSubcategoriesFromCache(cached.subcategories));
    }
    if (cached.products?.length) {
      dispatch(hydrateProductsFromCache(cached.products));
    }
  }, [dispatch, queryClient]);

  return null;
}
