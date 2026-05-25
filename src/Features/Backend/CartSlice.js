import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getAuthToken } from "../../utils/auth";
import { logout } from "./UserSlice";

const API_URL = `${API_BASE_URL}/cart`;
const REQUEST_TIMEOUT = 20000;

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

      return res.data?.data ?? null;
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
  async (_, { rejectWithValue }) => {
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
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload || [];
        recalcTotals(state);
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
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

        const idx = state.cartItems.findIndex((item) =>
          cartItemsMatch(item, payload)
        );
        if (idx !== -1) {
          state.cartItems[idx] = payload;
        } else {
          state.cartItems.push(payload);
        }
        recalcTotals(state);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
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
        state.cartCount = action.payload.count;
        state.totalItems = action.payload.totalItems;
        state.totalCartValue = action.payload.totalCartValue;
      })
      .addCase(fetchCartCount.rejected, (state) => {
        state.countLoading = false;
      })

      .addCase(logout, (state) => {
        state.cartItems = [];
        state.loading = false;
        state.addLoading = false;
        state.cartCount = 0;
        state.totalItems = 0;
        state.totalCartValue = 0;
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
export const selectCartCount = (state) => state.cart.cartCount;
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalCartValue = (state) => state.cart.totalCartValue;
export const selectCartCountLoading = (state) => state.cart.countLoading;
