import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/category`;

export const fetchcategories = createAsyncThunk(
  "category/fetchcategory",
  async (_, { rejectWithValue }) => {
    try {

      // Explicitly don't send any auth headers for public routes
      const res = await axios.get(`${API_URL}/getall`, {
        headers: {}
      });

      return res.data.data;
    } catch (err) {
      console.error("API Error:", err);
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const fetchTrendingCategories = createAsyncThunk(
  "category/fetchTrendingCategories",
  async (limit = 6, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/trending?limit=${limit}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const incrementCategoryClicks = createAsyncThunk(
  "category/incrementCategoryClicks",
  async (categoryId, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/click/${categoryId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const createCategory = createAsyncThunk(
  "category/createCategory",
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

export const updateCategory = createAsyncThunk(
  "category/updateCategory",
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

export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
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

const categorySlice = createSlice({
  name: "categories",

  initialState: {
    categories: [],
    trendingCategories: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchcategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchcategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchcategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.map((cat) =>
          cat._id === action.payload._id ? action.payload : cat
        );
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(
          (cat) => cat._id !== action.payload?._id
        );
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTrendingCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingCategories = action.payload;
      })
      .addCase(fetchTrendingCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(incrementCategoryClicks.fulfilled, (state, action) => {
        // Update the trending categories list with the updated category
        state.trendingCategories = state.trendingCategories.map((cat) =>
          cat._id === action.payload._id ? action.payload : cat
        );
      });
  },
});

export default categorySlice.reducer;

// SELECTORS
export const selectcategories = (state) => state.categories.categories;
export const selectTrendingCategories = (state) => state.categories.trendingCategories;
export const selectcategoriesLoading = (state) => state.categories.loading;
export const selectcategoriesError = (state) => state.categories.error;
