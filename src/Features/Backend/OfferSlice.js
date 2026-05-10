import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/offer`;

export const fetchOffers = createAsyncThunk(
  "offers/fetchOffers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/getall`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const createOffer = createAsyncThunk(
  "offers/createOffer",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Create failed");
    }
  }
);

export const updateOffer = createAsyncThunk(
  "offers/updateOffer",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Update failed");
    }
  }
);

export const deleteOffer = createAsyncThunk(
  "offers/deleteOffer",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.delete(`${API_URL}/delete/${id}`);
      return res.data.data || { _id: id };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Delete failed");
    }
  }
);

const offerSlice = createSlice({
  name: "offers",
  initialState: {
    offers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.loading = false;
        state.offers.push(action.payload);
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOffer.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = state.offers.map((offer) =>
          offer._id === action.payload._id ? action.payload : offer
        );
      })
      .addCase(updateOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteOffer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = state.offers.filter(
          (offer) => offer._id !== (action.payload?._id || action.meta.arg)
        );
      })
      .addCase(deleteOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default offerSlice.reducer;
// SELECTORS
export const selectOffers = (state) => state.offers.offers;
export const selectOffersLoading = (state) => state.offers.loading;
export const selectOffersError = (state) => state.offers.error;
