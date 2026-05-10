import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/boost`;

// Seller: Request product boost
export const requestProductBoost = createAsyncThunk(
  "productBoost/requestProductBoost",
  async ({ sellerId, packageId, productIds }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/request`, {
        sellerId,
        packageId,
        productIds
      }, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Seller: Fetch own boost requests
export const fetchSellerBoostRequests = createAsyncThunk(
  "productBoost/fetchSellerBoostRequests",
  async ({ sellerId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = status ? `?status=${status}` : '';
      const res = await axios.get(`${API_URL}/seller/${sellerId}${queryParams}`, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Seller: Cancel boost request
export const cancelBoostRequest = createAsyncThunk(
  "productBoost/cancelBoostRequest",
  async ({ requestId, sellerId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/cancel`, { requestId, sellerId }, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Seller: Add products to existing boost request
export const addProductsToBoostRequest = createAsyncThunk(
  "productBoost/addProductsToBoostRequest",
  async ({ requestId, sellerId, newProductIds }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/request/add-products`, {
        requestId,
        sellerId,
        newProductIds
      }, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: Fetch pending boost requests
export const fetchPendingBoostRequests = createAsyncThunk(
  "productBoost/fetchPendingBoostRequests",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/admin/pending`, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: Fetch all boost requests
export const fetchAllBoostRequests = createAsyncThunk(
  "productBoost/fetchAllBoostRequests",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams(filters).toString();
      const res = await axios.get(`${API_URL}/admin/all?${queryParams}`, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Admin: Approve or reject boost request
export const approveOrRejectBoostRequest = createAsyncThunk(
  "productBoost/approveOrRejectBoostRequest",
  async ({ requestId, action, notes }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/admin/approve`, {
        requestId,
        action,
        notes
      }, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

// Public: Fetch active boosts
export const fetchActiveBoosts = createAsyncThunk(
  "productBoost/fetchActiveBoosts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/active`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

const ProductBoostSlice = createSlice({
  name: "productBoost",
  initialState: {
    sellerRequests: [],    // seller's own requests
    pendingRequests: [],   // admin: pending requests
    allRequests: [],       // admin: all requests
    activeBoosts: [],      // public: active boosts
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Seller request boost
      .addCase(requestProductBoost.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(requestProductBoost.fulfilled, (state, action) => {
        state.loading = false;
        state.sellerRequests.push(action.payload);
      })
      .addCase(requestProductBoost.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Seller add products to existing boost
      .addCase(addProductsToBoostRequest.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(addProductsToBoostRequest.fulfilled, (state, action) => {
        state.loading = false;
        // update the request in sellerRequests
        const idx = state.sellerRequests.findIndex(req => req._id === action.payload._id);
        if (idx !== -1) {
          state.sellerRequests[idx] = action.payload;
        }
      })
      .addCase(addProductsToBoostRequest.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Seller fetch requests
      .addCase(fetchSellerBoostRequests.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchSellerBoostRequests.fulfilled, (state, action) => {
        state.loading = false; state.sellerRequests = action.payload;
      })
      .addCase(fetchSellerBoostRequests.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Seller cancel request
      .addCase(cancelBoostRequest.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(cancelBoostRequest.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sellerRequests.findIndex(req => req._id === action.payload._id);
        if (index !== -1) {
          state.sellerRequests[index] = action.payload;
        }
      })
      .addCase(cancelBoostRequest.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Admin fetch pending
      .addCase(fetchPendingBoostRequests.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchPendingBoostRequests.fulfilled, (state, action) => {
        state.loading = false; state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingBoostRequests.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Admin fetch all
      .addCase(fetchAllBoostRequests.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchAllBoostRequests.fulfilled, (state, action) => {
        state.loading = false; state.allRequests = action.payload;
      })
      .addCase(fetchAllBoostRequests.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Admin approve/reject
      .addCase(approveOrRejectBoostRequest.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(approveOrRejectBoostRequest.fulfilled, (state, action) => {
        state.loading = false;
        // Remove from pending
        const pendingIndex = state.pendingRequests.findIndex(req => req._id === action.payload._id);
        if (pendingIndex !== -1) {
          state.pendingRequests.splice(pendingIndex, 1);
        }
        // Update in all requests
        const allIndex = state.allRequests.findIndex(req => req._id === action.payload._id);
        if (allIndex !== -1) {
          state.allRequests[allIndex] = action.payload;
        }
        // Add to active boosts if approved
        if (action.payload.status === "active") {
          state.activeBoosts.push(action.payload);
        }
      })
      .addCase(approveOrRejectBoostRequest.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Fetch active boosts
      .addCase(fetchActiveBoosts.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchActiveBoosts.fulfilled, (state, action) => {
        state.loading = false; state.activeBoosts = action.payload;
      })
      .addCase(fetchActiveBoosts.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  }
});

export default ProductBoostSlice.reducer;

// SELECTORS
export const selectSellerBoostRequests = (state) => state.productBoost.sellerRequests;
export const selectPendingBoostRequests = (state) => state.productBoost.pendingRequests;
export const selectAllBoostRequests = (state) => state.productBoost.allRequests;
export const selectActiveBoosts = (state) => state.productBoost.activeBoosts;
export const selectProductBoostLoading = (state) => state.productBoost.loading;
export const selectProductBoostError = (state) => state.productBoost.error;
