import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/cart`;

// Add product to cart
export const addToCart = createAsyncThunk(
  "cart/addToCart",
  async ({ productId, quantity = 1, color = null, size = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to add items to cart");
      }

      const res = await axios.post(
        `${API_URL}/add`,
        { productId, quantity, color, size },
        {
          headers: {
            auth_token: token,
          },
        }
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to add to cart"
      );
    }
  }
);

// Get all cart items for a user
export const fetchCartItems = createAsyncThunk(
  "cart/fetchCartItems",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return [];
      }

      const res = await axios.get(`${API_URL}/getall`, {
        headers: {
          auth_token: token,
        },
      });

      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to fetch cart items"
      );
    }
  }
);

// Update cart item (quantity, color, size)
export const updateCartItem = createAsyncThunk(
  "cart/updateCartItem",
  async ({ cartItemId, quantity, color, size }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to update cart");
      }

      const res = await axios.put(
        `${API_URL}/update/${cartItemId}`,
        { quantity, color, size },
        {
          headers: {
            auth_token: token,
          },
        }
      );

      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to update cart item"
      );
    }
  }
);

// Delete cart item
export const deleteCartItem = createAsyncThunk(
  "cart/deleteCartItem",
  async (cartItemId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to remove cart items");
      }

      await axios.delete(`${API_URL}/delete/${cartItemId}`, {
        headers: {
          auth_token: token,
        },
      });

      return cartItemId;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to remove cart item"
      );
    }
  }
);

// Clear all cart items
export const clearCart = createAsyncThunk(
  "cart/clearCart",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to clear cart");
      }

      await axios.delete(`${API_URL}/clear`, {
        headers: {
          auth_token: token,
        },
      });

      return true;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to clear cart"
      );
    }
  }
);

// Get cart count and total value
export const fetchCartCount = createAsyncThunk(
  "cart/fetchCartCount",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { count: 0, totalItems: 0, totalCartValue: 0 };
      }

      const res = await axios.get(`${API_URL}/count`, {
        headers: {
          auth_token: token,
        },
      });

      return {
        count: res.data.count || 0,
        totalItems: res.data.totalItems || 0,
        totalCartValue: res.data.totalCartValue || 0,
      };
    } catch (err) {
      // If token is invalid, clear it
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
  },

  extraReducers: (builder) => {
    builder
      // Fetch cart items
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        state.cartItems = action.payload;
        // Calculate totals from cart items
        state.totalItems = action.payload.reduce((sum, item) => sum + (item.quantity || 0), 0);
        state.totalCartValue = action.payload.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        state.cartCount = action.payload.length;
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addLoading = false;
        state.addError = null;
        // Check if item already exists (same productId, color, size)
        const existingIndex = state.cartItems.findIndex(
          (item) =>
            (item.productId?._id || item.productId) === (action.payload.productId?._id || action.payload.productId) &&
            item.color === action.payload.color &&
            item.size === action.payload.size
        );
        if (existingIndex !== -1) {
          // Update existing item
          state.cartItems[existingIndex] = action.payload;
        } else {
          // Add new item
          state.cartItems.push(action.payload);
        }
        // Recalculate totals
        state.totalItems = state.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        state.totalCartValue = state.cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        state.cartCount = state.cartItems.length;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateError = null;
        const index = state.cartItems.findIndex((item) => item._id === action.payload._id);
        if (index !== -1) {
          // Preserve the existing product data completely, only update quantity and totals
          const existingItem = state.cartItems[index];
          state.cartItems[index] = {
            ...existingItem,
            // Only update fields that should change from server
            quantity: action.payload.quantity || existingItem.quantity,
            totalPrice: action.payload.totalPrice || existingItem.totalPrice,
            price: action.payload.price || existingItem.price,
            // Keep all other fields including productId unchanged
          };
        }
        // Recalculate totals immediately
        state.totalItems = state.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        state.totalCartValue = state.cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        state.cartCount = state.cartItems.length;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // Delete cart item
      .addCase(deleteCartItem.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = null;
        state.cartItems = state.cartItems.filter((item) => item._id !== action.payload);
        // Recalculate totals
        state.totalItems = state.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        state.totalCartValue = state.cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        state.cartCount = state.cartItems.length;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      // Clear cart
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
      // Fetch cart count
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
      });
  },
});

export const { clearCartError } = CartSlice.actions;

export default CartSlice.reducer;

// Selectors
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

