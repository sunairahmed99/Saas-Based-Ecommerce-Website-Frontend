import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getAuthToken } from "../../utils/auth";
import { logout } from "./UserSlice";

const API_URL = `${API_BASE_URL}/cart`;
const REQUEST_TIMEOUT = 12000;
const CART_CACHE_MS = 30000;

const cartAxios = (config) =>
  axios({
    timeout: REQUEST_TIMEOUT,
    ...config,
  });

export const getCartProductId = (item) => {
  const product = item?.productId;
  if (product && typeof product === "object" && product._id) {
    return String(product._id);
  }
  if (product) return String(product);
  return null;
};

const cartItemsMatch = (a, b) => {
  const pidA = getCartProductId(a);
  const pidB = getCartProductId(b);
  if (!pidA || !pidB || pidA !== pidB) return false;
  return (a.color ?? null) === (b.color ?? null) && (a.size ?? null) === (b.size ?? null);
};

const recalcTotals = (state) => {
  state.totalItems = state.cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  state.totalCartValue = state.cartItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );
  state.cartCount = state.cartItems.length;
};

const getProductPrice = (product) => {
  if (!product) return 0;
  if (product.prodisprice > 0) return product.prodisprice;
  if (product.pactualprice > 0) return product.pactualprice;
  return product.pprice || 0;
};

const removeOptimisticByVariant = (state, productId, color, size) => {
  state.cartItems = state.cartItems.filter((item) => {
    if (!item._optimistic) return true;
    return !(
      getCartProductId(item) === String(productId) &&
      (item.color ?? null) === (color ?? null) &&
      (item.size ?? null) === (size ?? null)
    );
  });
};

const isTempCartId = (id) => String(id || "").startsWith("opt-");

const mergeServerWithLocalCart = (serverItems, localItems) => {
  const byId = new Map();
  const optimistic = [];

  (serverItems || []).forEach((item) => {
    if (item?._id) byId.set(String(item._id), item);
  });

  (localItems || []).forEach((item) => {
    if (item._optimistic) {
      optimistic.push(item);
      return;
    }
    const id = String(item._id || "");
    if (!id || isTempCartId(id)) return;
    if (!byId.has(id)) byId.set(id, item);
  });

  const merged = Array.from(byId.values());
  optimistic.forEach((opt) => {
    if (!merged.some((s) => cartItemsMatch(s, opt))) merged.push(opt);
  });

  return merged;
};

export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity = 1, color = null, size = null }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return rejectWithValue("Please login to add items to cart");
      }

      const res = await cartAxios({
        method: "post",
        url: `${API_URL}/add`,
        data: { productId, quantity, color, size },
        headers: { auth_token: token },
      });

      const data = res.data?.data ?? res.data;
      if (!data || !data._id) {
        return rejectWithValue("Invalid cart response from server");
      }
      return data;
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        return rejectWithValue("Request timed out. Please try again.");
      }
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to add to cart"
      );
    }
  }
);

export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (options = {}, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const res = await cartAxios({
        method: "get",
        url: `${API_URL}/getall`,
        headers: { auth_token: token },
      });

      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch cart items"
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { force = false } = options;
      const { cartItems, lastFetchedAt, loading, addLoading } = getState().cart;
      if (loading || addLoading) return false;
      if (cartItems.some((item) => item._optimistic)) return false;
      if (
        !force &&
        cartItems.length > 0 &&
        lastFetchedAt &&
        Date.now() - lastFetchedAt < CART_CACHE_MS
      ) {
        return false;
      }
      return true;
    },
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ cartItemId, quantity, color, size }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Please login to update cart");

      const res = await cartAxios({
        method: "put",
        url: `${API_URL}/update/${cartItemId}`,
        data: { quantity, color, size },
        headers: { auth_token: token },
      });

      return res.data?.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to update cart item"
      );
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async (cartItemId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Please login to remove cart items");

      await cartAxios({
        method: "delete",
        url: `${API_URL}/delete/${cartItemId}`,
        headers: { auth_token: token },
      });

      return cartItemId;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to remove cart item"
      );
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      if (!token) return rejectWithValue("Please login to clear cart");

      await cartAxios({
        method: "delete",
        url: `${API_URL}/clear`,
        headers: { auth_token: token },
      });

      return true;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to clear cart"
      );
    }
  }
);

export const fetchCartCount = createAsyncThunk(
  "cart/fetchCartCount",
  async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        return { count: 0, totalItems: 0, totalCartValue: 0 };
      }

      const res = await cartAxios({
        method: "get",
        url: `${API_URL}/count`,
        headers: { auth_token: token },
      });

      return {
        count: res.data?.count || 0,
        totalItems: res.data?.totalItems || 0,
        totalCartValue: res.data?.totalCartValue || 0,
      };
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginType");
      }
      return { count: 0, totalItems: 0, totalCartValue: 0 };
    }
  }
);

const CartSlice = createSlice({
  name: "cart",

  initialState: {
    cartItems: [],
    loading: false,
    error: null,
    addLoading: false,
    addError: null,
    updateLoading: false,
    updateError: null,
    deleteLoading: false,
    deleteError: null,
    clearLoading: false,
    clearError: null,
    cartCount: 0,
    totalItems: 0,
    totalCartValue: 0,
    countLoading: false,
    lastFetchedAt: null,
    refreshing: false,
  },

  reducers: {
    clearCartError: (state) => {
      state.error = null;
      state.addError = null;
      state.updateError = null;
      state.deleteError = null;
      state.clearError = null;
    },
    resetAddCartLoading: (state) => {
      state.addLoading = false;
    },
    optimisticAddToCart: (state, action) => {
      const { product, quantity = 1, color = null, size = null, tempId } = action.payload;
      if (!product?._id) return;

      const itemPrice = getProductPrice(product);
      const qty = quantity || 1;

      state.cartItems.push({
        _id: tempId,
        productId: product,
        quantity: qty,
        color: color ?? null,
        size: size ?? null,
        price: itemPrice,
        totalPrice: itemPrice * qty,
        _optimistic: true,
      });
      recalcTotals(state);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCartItems.pending, (state) => {
        state.error = null;
        if (state.cartItems.length === 0) {
          state.loading = true;
        } else {
          state.refreshing = true;
        }
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        const serverItems = (action.payload || []).filter((item) => !item?._optimistic);
        const confirmedLocal = state.cartItems.filter(
          (item) => !item._optimistic && !isTempCartId(item._id)
        );

        if (serverItems.length === 0 && confirmedLocal.length > 0) {
          state.lastFetchedAt = Date.now();
          recalcTotals(state);
          return;
        }

        state.cartItems = mergeServerWithLocalCart(serverItems, state.cartItems);
        state.lastFetchedAt = Date.now();
        recalcTotals(state);
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
      })

      .addCase(addToCart.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addLoading = false;
        state.addError = null;
        const payload = action.payload;
        if (!payload) return;

        const { productId, color, size } = action.meta.arg || {};
        if (productId) {
          removeOptimisticByVariant(state, productId, color, size);
        }

        const payloadId = String(payload._id);
        const byIdIdx = state.cartItems.findIndex(
          (item) => String(item._id) === payloadId
        );

        if (byIdIdx !== -1) {
          state.cartItems[byIdIdx] = {
            ...payload,
            productId:
              payload.productId || state.cartItems[byIdIdx].productId,
          };
        } else {
          const variantIdx = state.cartItems.findIndex(
            (item) => !item._optimistic && cartItemsMatch(item, payload)
          );
          if (variantIdx !== -1) {
            state.cartItems[variantIdx] = {
              ...payload,
              productId:
                payload.productId || state.cartItems[variantIdx].productId,
            };
          } else {
            state.cartItems.push(payload);
          }
        }
        state.lastFetchedAt = Date.now();
        recalcTotals(state);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
        const errMsg = String(action.payload || "").toLowerCase();
        const isTransient =
          errMsg.includes("timeout") ||
          errMsg.includes("network") ||
          errMsg.includes("econnaborted");

        if (isTransient) return;

        const { productId, color, size } = action.meta.arg || {};
        if (productId) {
          removeOptimisticByVariant(state, productId, color, size);
          recalcTotals(state);
        }
      })

      .addCase(updateCartItem.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;
        const payload = action.payload;
        if (!payload) return;

        const index = state.cartItems.findIndex(
          (item) => item._id === payload._id
        );
        if (index !== -1) {
          state.cartItems[index] = {
            ...state.cartItems[index],
            ...payload,
            productId: state.cartItems[index].productId || payload.productId,
          };
        }
        recalcTotals(state);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })

      .addCase(deleteCartItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = null;
        state.cartItems = state.cartItems.filter(
          (item) => item._id !== action.payload
        );
        recalcTotals(state);
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })

      .addCase(clearCart.pending, (state) => {
        state.clearLoading = true;
        state.clearError = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.clearLoading = false;
        state.clearError = null;
        state.cartItems = [];
        state.totalItems = 0;
        state.totalCartValue = 0;
        state.cartCount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.clearLoading = false;
        state.clearError = action.payload;
      })

      .addCase(fetchCartCount.pending, (state) => {
        state.countLoading = true;
      })
      .addCase(fetchCartCount.fulfilled, (state, action) => {
        state.countLoading = false;
        if (state.cartItems.length === 0) {
          state.cartCount = action.payload.count;
          state.totalItems = action.payload.totalItems;
          state.totalCartValue = action.payload.totalCartValue;
        } else {
          recalcTotals(state);
        }
      })
      .addCase(fetchCartCount.rejected, (state) => {
        state.countLoading = false;
      })

      .addCase(logout, (state) => {
        state.cartItems = [];
        state.loading = false;
        state.refreshing = false;
        state.addLoading = false;
        state.cartCount = 0;
        state.totalItems = 0;
        state.totalCartValue = 0;
        state.lastFetchedAt = null;
      });
  },
});

export const { clearCartError, resetAddCartLoading, optimisticAddToCart } = CartSlice.actions;

export default CartSlice.reducer;

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectAddCartLoading = (state) => state.cart.addLoading;
export const selectAddCartError = (state) => state.cart.addError;
export const selectUpdateCartLoading = (state) => state.cart.updateLoading;
export const selectUpdateCartError = (state) => state.cart.updateError;
export const selectDeleteCartLoading = (state) => state.cart.deleteLoading;
export const selectDeleteCartError = (state) => state.cart.deleteError;
export const selectClearCartLoading = (state) => state.cart.clearLoading;
export const selectClearCartError = (state) => state.cart.clearError;
/** Badge: number of distinct line items in cart */
export const selectCartCount = (state) => state.cart.cartItems.length;

/** Total units (sum of quantities) */
export const selectCartBadgeCount = (state) => {
  const items = state.cart.cartItems;
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
};
export const selectTotalItems = (state) => {
  const items = state.cart.cartItems;
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
  return state.cart.totalItems;
};
export const selectTotalCartValue = (state) => {
  const items = state.cart.cartItems;
  if (items.length > 0) {
    return items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }
  return state.cart.totalCartValue;
};
export const selectCartCountLoading = (state) => state.cart.countLoading;
export const selectCartRefreshing = (state) => state.cart.refreshing;
