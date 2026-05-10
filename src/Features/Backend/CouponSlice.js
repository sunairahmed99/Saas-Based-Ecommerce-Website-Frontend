import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}`;

// Async thunks for admin coupon management
export const createCoupon = createAsyncThunk(
  "coupons/createCoupon",
  async (couponData, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/coupon`, couponData, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create coupon");
    }
  }
);

export const fetchCoupons = createAsyncThunk(
  "coupons/fetchCoupons",
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/coupon`, {
        headers: {
          auth_token: token,
        },
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch coupons");
    }
  }
);

export const updateCoupon = createAsyncThunk(
  "coupons/updateCoupon",
  async ({ id, updates }, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/coupon/${id}`, updates, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update coupon");
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  "coupons/deleteCoupon",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      await axios.delete(`${API_URL}/coupon/${id}`, {
        headers: {
          auth_token: token,
        },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete coupon");
    }
  }
);

export const toggleCouponStatus = createAsyncThunk(
  "coupons/toggleCouponStatus",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.patch(`${API_URL}/coupon/${id}/toggle`, {}, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle coupon status");
    }
  }
);

// User coupon actions
export const validateCoupon = createAsyncThunk(
  "coupons/validateCoupon",
  async ({ code, orderAmount }, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/coupon/validate`, {
        code,
        subtotal: orderAmount
      }, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Invalid coupon code");
    }
  }
);

export const fetchAvailableCoupons = createAsyncThunk(
  "coupons/fetchAvailableCoupons",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/coupon/available`, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch coupons");
    }
  }
);

const initialState = {
  coupons: [],
  availableCoupons: [],
  currentCoupon: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCoupons: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const couponSlice = createSlice({
  name: "coupons",
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
    clearCurrentCoupon: (state) => {
      state.currentCoupon = null;
    },
    resetCouponState: (state) => {
      state.coupons = [];
      state.availableCoupons = [];
      state.currentCoupon = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create coupon
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons.unshift(action.payload.data);
        state.totalCoupons += 1;
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch coupons
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update coupon
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.coupons[index] = action.payload.data;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete coupon
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
        state.totalCoupons -= 1;
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle coupon status
      .addCase(toggleCouponStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.coupons[index] = action.payload.data;
        }
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate coupon (for users)
      .addCase(validateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCoupon = action.payload.data;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentCoupon = null;
      })

      // Fetch available coupons
      .addCase(fetchAvailableCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.availableCoupons = action.payload.data;
      })
      .addCase(fetchAvailableCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponError, clearCurrentCoupon, resetCouponState } = couponSlice.actions;

// Selectors
export const selectCoupons = (state) => state.coupons.coupons;
export const selectCurrentCoupon = (state) => state.coupons.currentCoupon;
export const selectCouponLoading = (state) => state.coupons.loading;
export const selectCouponError = (state) => state.coupons.error;
export const selectAvailableCoupons = (state) => state.coupons.availableCoupons;
export const selectCouponPagination = (state) => state.coupons.pagination;

export default couponSlice.reducer;
