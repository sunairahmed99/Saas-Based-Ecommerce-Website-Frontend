import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "../utils/auth";

/** Shared React Query keys for admin panel caching */
export const adminQueryKeys = {
  users: ["admin-users"],
  sellers: ["sellers"],
  products: (isSellerView, sellerId) => ["products", isSellerView, sellerId],
  orders: ["admin-orders"],
  categories: ["categories"],
  subcategories: ["subcategories"],
  dashboardStats: ["admin-dashboard-stats"],
  profitAnalytics: ["admin-profit-analytics"],
  contacts: ["admin-contacts"],
  websiteReviews: ["website-reviews"],
  productReviews: ["product-reviews"],
  coupons: (page) => ["admin-coupons", page],
  refunds: ["admin-refunds"],
  refundStats: ["admin-refund-stats"],
  wallets: (page) => ["admin-wallets", page],
  walletCoupons: (page, status) => ["admin-user-coupons", page, status],
  flashPending: ["admin-pending-flash-deals"],
  flashApproved: ["admin-approved-flash-deals"],
  boostPackages: ["admin-boost-packages"],
  boostRequests: ["admin-boost-requests"],
  platformSettings: ["admin-platform-settings"],
  banners: ["admin-banners"],
  bannerOffers: ["admin-banner-offers"],
  chatUsers: ["admin-chat-users"],
  chatMessages: (userId) => ["admin-chat-messages", userId],
};

const ADMIN_STALE_TIME = 5 * 60 * 1000;

/**
 * Admin data query — only runs when auth token exists.
 * Pair with global axios interceptor (auth_token header) in main.jsx.
 */
export function useAdminQuery(options) {
  const token = getAuthToken();
  const { enabled, staleTime, ...rest } = options;

  return useQuery({
    staleTime: ADMIN_STALE_TIME,
    ...rest,
    enabled: Boolean(token) && (enabled ?? true),
  });
}

export function useAdminMutation(options) {
  return useMutation(options);
}

export { useQueryClient };
