import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/review`;

// Public: approved reviews
export const fetchApprovedReviews = createAsyncThunk(
  "reviews/fetchApprovedReviews",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/approved`);
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load reviews");
    }
  }
);

// Admin: all reviews
export const fetchAllReviews = createAsyncThunk(
  "reviews/fetchAllReviews",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/getall`, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load all reviews");
    }
  }
);

// User: create review
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/create`, payload, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to submit review");
    }
  }
);

// Admin: approve review
export const approveReview = createAsyncThunk(
  "reviews/approveReview",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/approve/${id}`,
        {},
        { headers: { auth_token: token || undefined } }
      );
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to approve");
    }
  }
);

// Admin: delete review
export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/${id}`, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || { _id: id };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to delete");
    }
  }
);

// Product Reviews
export const fetchUserOrderedProducts = createAsyncThunk(
  "reviews/fetchUserOrderedProducts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/user-ordered-products`, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load ordered products");
    }
  }
);

export const createProductReview = createAsyncThunk(
  "reviews/createProductReview",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/product/create`, payload, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to submit product review");
    }
  }
);

export const fetchProductReviews = createAsyncThunk(
  "reviews/fetchProductReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/product/${productId}`);
      return { productId, reviews: res.data?.data || [] };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load product reviews");
    }
  }
);

// Admin: all product reviews
export const fetchAllProductReviews = createAsyncThunk(
  "reviews/fetchAllProductReviews",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/product/getall`, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to load all product reviews");
    }
  }
);

// Admin: approve product review
export const approveProductReview = createAsyncThunk(
  "reviews/approveProductReview",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.patch(
        `${API_URL}/product/approve/${id}`,
        {},
        { headers: { auth_token: token || undefined } }
      );
      return res.data?.data || res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to approve product review");
    }
  }
);

// Admin: delete product review
export const deleteProductReview = createAsyncThunk(
  "reviews/deleteProductReview",
  async (id, { rejectWithValue, getState }) => {
    try {
      const token =
        getState().users.user?.token ||
        getState().users.user?.data?.token ||
        localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/product/${id}`, {
        headers: { auth_token: token || undefined },
      });
      return res.data?.data || { _id: id };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Failed to delete product review");
    }
  }
);

const ReviewSlice = createSlice({
  name: "reviews",
  initialState: {
    approved: [],
    all: [],
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
    // Product reviews
    userOrderedProducts: [],
    orderedProductsLoading: false,
    productReviews: {},
    productReviewsLoading: {},
    creatingProductReview: false,
    createProductReviewError: null,
    allProductReviews: [],
    allProductReviewsLoading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovedReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovedReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.approved = action.payload;
      })
      .addCase(fetchApprovedReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.all = action.payload;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createReview.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.submitting = false;
        // add to all (pending) list optimistically
        state.all = [action.payload, ...state.all];
      })
      .addCase(createReview.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })
      .addCase(approveReview.fulfilled, (state, action) => {
        const updated = action.payload;
        state.all = state.all.map((r) => (r._id === updated._id ? updated : r));
        state.approved = [updated, ...state.approved];
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const id = action.payload?._id || action.meta?.arg;
        state.all = state.all.filter((r) => r._id !== id);
        state.approved = state.approved.filter((r) => r._id !== id);
      })
      // Product review actions
      .addCase(fetchUserOrderedProducts.pending, (state) => {
        state.orderedProductsLoading = true;
      })
      .addCase(fetchUserOrderedProducts.fulfilled, (state, action) => {
        state.orderedProductsLoading = false;
        state.userOrderedProducts = action.payload;
      })
      .addCase(fetchUserOrderedProducts.rejected, (state, action) => {
        state.orderedProductsLoading = false;
      })
      .addCase(createProductReview.pending, (state) => {
        state.creatingProductReview = true;
        state.createProductReviewError = null;
      })
      .addCase(createProductReview.fulfilled, (state, action) => {
        state.creatingProductReview = false;
        // Add to all product reviews list optimistically
        state.allProductReviews = [action.payload, ...state.allProductReviews];
      })
      .addCase(createProductReview.rejected, (state, action) => {
        state.creatingProductReview = false;
        state.createProductReviewError = action.payload;
      })
      .addCase(fetchProductReviews.pending, (state, action) => {
        state.productReviewsLoading[action.meta.arg] = true;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        const { productId, reviews } = action.payload;
        state.productReviewsLoading[productId] = false;
        state.productReviews[productId] = reviews;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.productReviewsLoading[action.meta.arg] = false;
      })
      .addCase(fetchAllProductReviews.pending, (state) => {
        state.allProductReviewsLoading = true;
      })
      .addCase(fetchAllProductReviews.fulfilled, (state, action) => {
        state.allProductReviewsLoading = false;
        state.allProductReviews = action.payload;
      })
      .addCase(fetchAllProductReviews.rejected, (state, action) => {
        state.allProductReviewsLoading = false;
      })
      .addCase(approveProductReview.fulfilled, (state, action) => {
        const updated = action.payload;
        state.allProductReviews = state.allProductReviews.map((r) =>
          r._id === updated._id ? updated : r
        );
      })
      .addCase(deleteProductReview.fulfilled, (state, action) => {
        const id = action.payload?._id || action.meta?.arg;
        state.allProductReviews = state.allProductReviews.filter((r) => r._id !== id);
      });
  },
});

export default ReviewSlice.reducer;

export const selectApprovedReviews = (state) => state.reviews.approved;
export const selectAllReviews = (state) => state.reviews.all;
export const selectReviewsLoading = (state) => state.reviews.loading;
export const selectReviewError = (state) => state.reviews.error;
export const selectReviewSubmitting = (state) => state.reviews.submitting;
export const selectReviewSubmitError = (state) => state.reviews.submitError;

// Product review selectors
export const selectUserOrderedProducts = (state) => state.reviews.userOrderedProducts;
export const selectOrderedProductsLoading = (state) => state.reviews.orderedProductsLoading;
export const selectProductReviews = (productId) => (state) => state.reviews.productReviews[productId] || [];
export const selectProductReviewsLoading = (productId) => (state) => state.reviews.productReviewsLoading[productId] || false;
export const selectCreatingProductReview = (state) => state.reviews.creatingProductReview;
export const selectCreateProductReviewError = (state) => state.reviews.createProductReviewError;
export const selectAllProductReviews = (state) => state.reviews.allProductReviews;
export const selectAllProductReviewsLoading = (state) => state.reviews.allProductReviewsLoading;

