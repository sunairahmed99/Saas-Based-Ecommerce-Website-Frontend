/** Inline fallback — no external requests, prevents onError loops */
export const NO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";

export const resolveProductImage = (src) => {
  if (!src || typeof src !== "string") return NO_IMAGE_PLACEHOLDER;
  if (src.includes("via.placeholder.com")) return NO_IMAGE_PLACEHOLDER;
  return src;
};

export const handleImageError = (e) => {
  const el = e?.target;
  if (!el || el.dataset.fallbackApplied === "1") return;
  el.dataset.fallbackApplied = "1";
  el.src = NO_IMAGE_PLACEHOLDER;
};
