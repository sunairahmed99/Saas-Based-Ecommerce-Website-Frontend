import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_BASE = `${API_BASE_URL}`;

export const fetchBanners = createAsyncThunk(
  "banners/fetchBanners",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE}/offer/banner/getall`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch banners");
    }
  }
);

export const createBanner = createAsyncThunk(
  "banners/createBanner",
  async (bannerData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE}/offer/banner/create`, bannerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'auth_token': localStorage.getItem('token')
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create banner");
    }
  }
);

export const updateBanner = createAsyncThunk(
  "banners/updateBanner",
  async ({ id, bannerData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_BASE}/offer/banner/update/${id}`, bannerData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'auth_token': localStorage.getItem('token')
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update banner");
    }
  }
);

export const deleteBanner = createAsyncThunk(
  "banners/deleteBanner",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE}/offer/banner/delete/${id}`, {
        headers: {
          'auth_token': localStorage.getItem('token')
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete banner");
    }
  }
);

const bannerSlice = createSlice({
  name: "banners",
  initialState: {
    banners: [],
    loading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch banners
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload.success ? action.payload.data : [];
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create banner
      .addCase(createBanner.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload.success) {
          state.banners.push(action.payload.data);
        }
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })

      // Update banner
      .addCase(updateBanner.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.updating = false;
        if (action.payload.success) {
          const index = state.banners.findIndex(b => b._id === action.payload.data._id);
          if (index !== -1) {
            state.banners[index] = action.payload.data;
          }
        }
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })

      // Delete banner
      .addCase(deleteBanner.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.deleting = false;
        if (action.payload.success) {
          state.banners = state.banners.filter(b => b._id !== action.meta.arg);
        }
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  }
});

export const { clearError } = bannerSlice.actions;
export const selectBanners = (state) => state.banners.banners;
export const selectBannersLoading = (state) => state.banners.loading;
export const selectBannersError = (state) => state.banners.error;
export const selectCreatingBanner = (state) => state.banners.creating;
export const selectUpdatingBanner = (state) => state.banners.updating;
export const selectDeletingBanner = (state) => state.banners.deleting;

export default bannerSlice.reducer;
