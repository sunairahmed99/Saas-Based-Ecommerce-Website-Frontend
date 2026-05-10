import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/wallet`;

// Get user's wallet
export const fetchUserWallet = createAsyncThunk(
  "wallet/fetchUserWallet",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/user`, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch wallet");
    }
  }
);

// Get user's coupons
export const fetchUserCoupons = createAsyncThunk(
  "wallet/fetchUserCoupons",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/user/coupons`, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch coupons");
    }
  }
);

// Validate coupon
export const validateCoupon = createAsyncThunk(
  "wallet/validateCoupon",
  async ({ code, orderAmount }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/user/validate-coupon`, { code, orderAmount }, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Invalid coupon");
    }
  }
);

// Generate coupon with points
export const generateCouponWithPoints = createAsyncThunk(
  "wallet/generateCouponWithPoints",
  async ({ pointsToSpend }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/user/generate-coupon`, { pointsToSpend }, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to generate coupon");
    }
  }
);

// ADMIN FUNCTIONS

// Get all wallets
export const fetchAllWallets = createAsyncThunk(
  "wallet/fetchAllWallets",
  async ({ page = 1, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);

      const res = await axios.get(`${API_URL}/admin/all?${params}`, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch wallets");
    }
  }
);

// Get all user coupons
export const fetchAllUserCoupons = createAsyncThunk(
  "wallet/fetchAllUserCoupons",
  async ({ page = 1, limit = 20, status = 'all' } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status !== 'all') params.append('status', status);

      const res = await axios.get(`${API_URL}/admin/coupons?${params}`, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to fetch coupons");
    }
  }
);

// Add bonus points
export const addBonusPoints = createAsyncThunk(
  "wallet/addBonusPoints",
  async ({ userId, points, description }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/admin/add-bonus`, { userId, points, description }, {
        headers: {
          auth_token: token
        }
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to add bonus points");
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    wallet: null,
    coupons: [],
    allWallets: [],
    allCoupons: [],
    loading: false,
    error: null,
    validationResult: null,
    pagination: null,
    adminPagination: null,
    couponsPagination: null
  },
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
    resetWalletState: (state) => {
      state.wallet = null;
      state.coupons = [];
      state.allWallets = [];
      state.allCoupons = [];
      state.error = null;
      state.validationResult = null;
      state.pagination = null;
      state.adminPagination = null;
      state.couponsPagination = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch user wallet
    builder
      .addCase(fetchUserWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.wallet = action.payload.data;
      })
      .addCase(fetchUserWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch user coupons
      .addCase(fetchUserCoupons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data;
      })
      .addCase(fetchUserCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate coupon
      .addCase(validateCoupon.pending, (state) => {
        state.loading = true;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.validationResult = action.payload.data;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.validationResult = null;
      })

      // Generate coupon with points
      .addCase(generateCouponWithPoints.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateCouponWithPoints.fulfilled, (state, action) => {
        state.loading = false;
        // Update wallet data after coupon generation
        if (action.payload.data) {
          state.wallet = {
            ...state.wallet,
            totalPoints: action.payload.data.pointsRemaining
          };
          // Refresh coupons list
          state.coupons = [...state.coupons, action.payload.data.coupon];
        }
      })
      .addCase(generateCouponWithPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all wallets (admin)
      .addCase(fetchAllWallets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWallets.fulfilled, (state, action) => {
        state.loading = false;
        state.allWallets = action.payload.data;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAllWallets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch all user coupons (admin)
      .addCase(fetchAllUserCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUserCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.allCoupons = action.payload.data;
        state.couponsPagination = action.payload.pagination;
      })
      .addCase(fetchAllUserCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add bonus points
      .addCase(addBonusPoints.pending, (state) => {
        state.loading = true;
      })
      .addCase(addBonusPoints.fulfilled, (state, action) => {
        state.loading = false;
        // Update the wallet in allWallets if it exists
        const index = state.allWallets.findIndex(w => w.user._id === action.payload.data.user);
        if (index !== -1) {
          state.allWallets[index] = action.payload.data;
        }
      })
      .addCase(addBonusPoints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearWalletError, clearValidationResult, resetWalletState } = walletSlice.actions;

export default walletSlice.reducer;

export const selectWallet = (state) => state.wallet.wallet;
export const selectUserCoupons = (state) => state.wallet.coupons;
export const selectWalletLoading = (state) => state.wallet.loading;
export const selectWalletError = (state) => state.wallet.error;
export const selectCouponValidation = (state) => state.wallet.validationResult;
export const selectAllWallets = (state) => state.wallet.allWallets;
export const selectAllUserCoupons = (state) => state.wallet.allCoupons;
export const selectWalletPagination = (state) => state.wallet.adminPagination;
export const selectCouponsPagination = (state) => state.wallet.couponsPagination;
