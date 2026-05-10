import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/flashdeal`;

// Seller: fetch own flash deals
export const fetchSellerFlashDeals = createAsyncThunk(
  "flashdeal/fetchSellerFlashDeals",
  async (sellerId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/seller/${sellerId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Seller: request flash deal (creates in pending status)
export const requestFlashDeal = createAsyncThunk(
  "flashdeal/requestFlashDeal",
  async ({ sellerId, productId, startDate, endDate }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/add`, {
        sellerId,
        productId,
        startDate,
        endDate,
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: fetch all pending requests
export const fetchPendingFlashDeals = createAsyncThunk(
  "flashdeal/fetchPendingFlashDeals",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/pending`, {
        headers: {
          auth_token: token,
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: fetch approved flash deals (for admin section and home)
export const fetchApprovedFlashDeals = createAsyncThunk(
  "flashdeal/fetchApprovedFlashDeals",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/approved`, {
        headers: {
          auth_token: token,
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: approve/reject flash deal
export const approveOrRejectFlashDeal = createAsyncThunk(
  "flashdeal/approveOrRejectFlashDeal",
  async ({ flashDealId, action }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/approve`, { flashDealId, action }, {
        headers: {
          auth_token: token,
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Home: fetch approved flash deals grouped by seller
export const fetchHomeFlashDeals = createAsyncThunk(
  "flashdeal/fetchHomeFlashDeals",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/home`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Seller: delete own flash deal
export const deleteFlashDeal = createAsyncThunk(
  "flashdeal/deleteFlashDeal",
  async ({ sellerId, flashDealId }, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${API_URL}/remove`, {
        data: { sellerId, flashDealId }
      });
      return flashDealId; // Return ID to remove from state
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

const FlashDealSlice = createSlice({
  name: "flashdeal",
  initialState: {
    sellerDeals: [], // seller's own
    homeDeals: [],   // home deals, grouped
    pending: [],     // admin: pending requests
    approved: [],    // admin: approved
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // seller's deals
      .addCase(fetchSellerFlashDeals.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchSellerFlashDeals.fulfilled, (state, action) => {
        state.loading = false; state.sellerDeals = action.payload;
      })
      .addCase(fetchSellerFlashDeals.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // request new deal
      .addCase(requestFlashDeal.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(requestFlashDeal.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerDeals.push(action.payload);
      })
      .addCase(requestFlashDeal.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // admin fetch pending
      .addCase(fetchPendingFlashDeals.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchPendingFlashDeals.fulfilled, (state, action) => {
        state.loading = false; state.pending = action.payload;
      })
      .addCase(fetchPendingFlashDeals.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // admin fetch approved
      .addCase(fetchApprovedFlashDeals.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchApprovedFlashDeals.fulfilled, (state, action) => {
        state.loading = false; state.approved = action.payload;
      })
      .addCase(fetchApprovedFlashDeals.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // admin approve/reject
      .addCase(approveOrRejectFlashDeal.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(approveOrRejectFlashDeal.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from pending, add to approved if approved
        const idx = state.pending.findIndex(fd => fd._id === action.payload._id);
        if(idx !== -1) state.pending.splice(idx,1);
        if(action.payload.status === "approved") state.approved.push(action.payload);
      })
      .addCase(approveOrRejectFlashDeal.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // home (grouped by seller)
      .addCase(fetchHomeFlashDeals.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchHomeFlashDeals.fulfilled, (state, action) => {
        state.loading = false; state.homeDeals = action.payload;
      })
      .addCase(fetchHomeFlashDeals.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // seller delete flash deal
      .addCase(deleteFlashDeal.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(deleteFlashDeal.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from sellerDeals
        state.sellerDeals = state.sellerDeals.filter(fd => fd._id !== action.payload);
        // Also remove from pending/approved if exists
        state.pending = state.pending.filter(fd => fd._id !== action.payload);
        state.approved = state.approved.filter(fd => fd._id !== action.payload);
      })
      .addCase(deleteFlashDeal.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  }
});

export default FlashDealSlice.reducer;

// SELECTORS
export const selectSellerDeals = (state) => state.flashdeal.sellerDeals;
export const selectHomeFlashDeals = (state) => state.flashdeal.homeDeals;
export const selectPendingDeals = (state) => state.flashdeal.pending;
export const selectApprovedDeals = (state) => state.flashdeal.approved;
export const selectFlashDealLoading = (state) => state.flashdeal.loading;
export const selectFlashDealError = (state) => state.flashdeal.error;
