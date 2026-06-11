import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/subcategory`;

export const fetchsubcategories = createAsyncThunk(
  "subcategory/fetchsubcategory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/getall`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const createSubcategory = createAsyncThunk(
  "subcategory/createSubcategory",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "auth_token": token
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Create failed");
    }
  }
);

export const updateSubcategory = createAsyncThunk(
  "subcategory/updateSubcategory",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "auth_token": token
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Update failed");
    }
  }
);

// Note: backend delete route is commented; call only if available.
export const deleteSubcategory = createAsyncThunk(
  "subcategory/deleteSubcategory",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/delete/${id}`, {
        headers: { "auth_token": token }
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Delete failed");
    }
  }
);

const SubcategorySlice = createSlice({
  name: "subcategories",

  initialState: {
    subcategories: [],
    loading: false,
    error: null,
  },

  reducers: {
    hydrateSubcategoriesFromCache: (state, action) => {
      if (!state.subcategories?.length && Array.isArray(action.payload) && action.payload.length > 0) {
        state.subcategories = action.payload;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchsubcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchsubcategories.fulfilled, (state, action) => {
        state.loading = false;
        state.subcategories = action.payload;
      })
      .addCase(fetchsubcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.subcategories.push(action.payload);
      })
      .addCase(createSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.subcategories = state.subcategories.map((sub) =>
          sub._id === action.payload._id ? action.payload : sub
        );
      })
      .addCase(updateSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.subcategories = state.subcategories.filter(
          (s) => s._id !== action.payload?._id
        );
      })
      .addCase(deleteSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { hydrateSubcategoriesFromCache } = SubcategorySlice.actions;
export default SubcategorySlice.reducer;

export const selectsubcategories = (state) => state.subcategories.subcategories;
export const selectsubcategoriesLoading = (state) => state.subcategories.loading;
export const selectsubcategoriesError = (state) => state.subcategories.error;
