import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}`;

// Get dashboard statistics
export const fetchDashboardStats = createAsyncThunk(
  "analytics/fetchDashboardStats",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || 
                    getState().users.user?.token || 
                    localStorage.getItem("token");

      if (!token) {
        return rejectWithValue("Authentication token missing. Please login again.");
      }

      const response = await axios.get(`${API_URL}/analytics/dashboard`, {
        headers: {
          auth_token: token,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch dashboard stats");
    }
  }
);

// Get profit analytics
export const fetchProfitAnalytics = createAsyncThunk(
  "analytics/fetchProfitAnalytics",
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || 
                    getState().users.user?.token || 
                    localStorage.getItem("token");

      if (!token) {
        console.error('No auth token found in Redux state or localStorage');
        return rejectWithValue("Authentication token missing. Please login again.");
      }

      const response = await axios.get(`${API_URL}/analytics/profit`, {
        headers: {
          auth_token: token,
        },
        params,
      });

      return response.data;
    } catch (error) {
      console.error('Profit analytics error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch profit analytics");
    }
  }
);

// Get seller-specific profit analytics
export const fetchSellerProfitAnalytics = createAsyncThunk(
  "analytics/fetchSellerProfitAnalytics",
  async ({ sellerId, params = {} }, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/analytics/seller/${sellerId}`, {
        headers: {
          auth_token: token,
        },
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch seller analytics");
    }
  }
);

const initialState = {
  dashboardStats: null,
  profitAnalytics: null,
  sellerAnalytics: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
    resetAnalytics: (state) => {
      state.dashboardStats = null;
      state.profitAnalytics = null;
      state.sellerAnalytics = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload.data;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Profit Analytics
      .addCase(fetchProfitAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfitAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAnalytics = action.payload.data;
      })
      .addCase(fetchProfitAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Seller Profit Analytics
      .addCase(fetchSellerProfitAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProfitAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerAnalytics = action.payload.data;
      })
      .addCase(fetchSellerProfitAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAnalyticsError, resetAnalytics } = analyticsSlice.actions;

// Selectors
export const selectDashboardStats = (state) => state.analytics.dashboardStats;
export const selectProfitAnalytics = (state) => state.analytics.profitAnalytics;
export const selectSellerAnalytics = (state) => state.analytics.sellerAnalytics;
export const selectAnalyticsLoading = (state) => state.analytics.loading;
export const selectAnalyticsError = (state) => state.analytics.error;

export default analyticsSlice.reducer;
