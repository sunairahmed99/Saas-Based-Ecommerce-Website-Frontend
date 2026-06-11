import axios from "axios";
import { API_BASE_URL } from "../config";

const getDeviceId = () => {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = window.crypto?.randomUUID?.() || String(Date.now() + Math.random());
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

export async function fetchProductById(id, userId) {
  const res = await axios.get(`${API_BASE_URL}/product/view/${id}`, {
    params: {
      device_id: getDeviceId(),
      user_id: userId || localStorage.getItem("userId") || undefined,
    },
  });
  return res?.data?.data;
}

export function prefetchProduct(queryClient, productId, userId) {
  if (!productId || !queryClient) return;
  return queryClient.prefetchQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProductById(productId, userId),
    staleTime: 5 * 60 * 1000,
  });
}

const filterDummyProducts = (products) => {
  if (!Array.isArray(products)) return [];
  return products.filter((p) => !(p?.pname && p.pname.includes("Pulse")));
};

export async function fetchAllShopProducts() {
  const res = await axios.get(`${API_BASE_URL}/product/getall`);
  return filterDummyProducts(res.data?.data || []);
}

export function prefetchAllShopProducts(queryClient) {
  if (!queryClient) return Promise.resolve();
  return queryClient.prefetchQuery({
    queryKey: ["shopProducts", ALL_SHOP_QUERY_KEY],
    queryFn: fetchAllShopProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchShopCategory(queryClient, categoryId) {
  if (!categoryId || !queryClient) return;
  return queryClient.prefetchQuery({
    queryKey: ["shopProducts", { categoryIdParam: categoryId, subcategoryIdParam: null, sellerIdParam: null, searchQueryParam: null }],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/product/category/${categoryId}`);
      return filterDummyProducts(res.data?.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function prefetchShopSubcategory(queryClient, subcategoryId) {
  if (!subcategoryId || !queryClient) return;
  return queryClient.prefetchQuery({
    queryKey: ["shopProducts", { categoryIdParam: null, subcategoryIdParam: subcategoryId, sellerIdParam: null, searchQueryParam: null }],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/product/subcategory/${subcategoryId}`);
      return filterDummyProducts(res.data?.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function findProductInShopCache(queryClient, productId) {
  if (!productId || !queryClient) return undefined;
  const entries = queryClient.getQueriesData({ queryKey: ["shopProducts"] });
  for (const [, data] of entries) {
    if (!Array.isArray(data)) continue;
    const match = data.find((p) => String(p._id) === String(productId));
    if (match) return match;
  }
  return undefined;
}

const ALL_SHOP_QUERY_KEY = {
  categoryIdParam: null,
  subcategoryIdParam: null,
  sellerIdParam: null,
  searchQueryParam: null,
};

const getRefId = (value) => {
  if (value == null) return null;
  if (typeof value === "object" && value._id != null) return String(value._id);
  return String(value);
};

/** Filter cached "all products" list for instant category/subcategory/seller views */
export function getFilteredProductsFromAllCache(queryClient, filters) {
  if (!queryClient) return undefined;
  const allCached = queryClient.getQueryData(["shopProducts", ALL_SHOP_QUERY_KEY]);
  if (!Array.isArray(allCached) || allCached.length === 0) return undefined;

  const { categoryId, subcategoryId, sellerId } = filters;
  if (subcategoryId) {
    return allCached.filter((p) => getRefId(p?.subcatid) === String(subcategoryId));
  }
  if (categoryId) {
    return allCached.filter((p) => getRefId(p?.catid) === String(categoryId));
  }
  if (sellerId) {
    return allCached.filter((p) => getRefId(p?.sellerid) === String(sellerId));
  }
  return undefined;
}
