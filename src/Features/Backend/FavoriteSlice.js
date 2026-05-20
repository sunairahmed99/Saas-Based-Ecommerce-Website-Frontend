import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/favorite`;

// Get all favorites for a user or seller
export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      const loginType = localStorage.getItem("loginType");

      if (!token) {
        return [];
      }

      // Sellers don't use favorites functionality, return empty array
      if (loginType === "seller") {
        return [];
      }

      const headers = {
        auth_token: token,
      };

      const res = await axios.get(`${API_URL}/getall`, {
        headers,
      });

      return res.data.data || [];
    } catch (err) {
      // Gracefully ignore 404s (endpoint missing for this account type)
      if (err?.response?.status === 404) {
        return [];
      }
      // If token is invalid, clear it and return empty array
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginType");
        return [];
      }
      console.error("Error fetching favorites:", err.response?.data || err.message);
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to fetch favorites"
      );
    }
  }
);

// Add product to favorites
export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (productOrId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      const loginType = localStorage.getItem("loginType");

      if (!token) {
        return rejectWithValue("Please login to add favorites");
      }

      // Sellers don't use favorites functionality
      if (loginType === "seller") {
        return rejectWithValue("Sellers cannot add favorites");
      }

      const productId = typeof productOrId === "object" ? productOrId._id : productOrId;

      const headers = {
        auth_token: token,
      };

      const res = await axios.post(
        `${API_URL}/add`,
        { productId },
        {
          headers,
        }
      );

      return res.data.data;
    } catch (err) {
      console.error("Error adding to favorites:", err.response?.data || err.message);
      return rejectWithValue(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to add to favorites"
      );
    }
  }
);

// Delete favorite by favorite ID or productId
export const deleteFavorite = createAsyncThunk(
  "favorites/deleteFavorite",
  async ({ favoriteId, productId }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      const loginType = localStorage.getItem("loginType");

      // Sellers don't use favorites functionality
      if (loginType === "seller") {
        return rejectWithValue("Sellers cannot delete favorites");
      }

      const headers = {
        ...(token ? { auth_token: token } : {}),
      };

      let res;

      if (favoriteId) {
        // Delete by favorite ID
        res = await axios.delete(`${API_URL}/delete/${favoriteId}`, {
          headers,
        });
      } else if (productId) {
        // Delete by productId
        res = await axios.delete(`${API_URL}/remove`, {
          data: { productId },
          headers,
        });
      } else {
        return rejectWithValue("Favorite ID or Product ID is required");
      }

      return { favoriteId, productId };
    } catch (err) {
      console.error("Delete favorite error:", err);
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to remove favorite"
      );
    }
  }
);

// Check if product is in favorites
export const checkFavorite = createAsyncThunk(
  "favorites/checkFavorite",
  async (productId, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      const loginType = localStorage.getItem("loginType");

      // Sellers don't use favorites functionality, return false
      if (loginType === "seller") {
        return { isFavorite: false };
      }

      const headers = {
        ...(token ? { auth_token: token } : {}),
      };

      const res = await axios.get(`${API_URL}/check/${productId}`, {
        headers,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Failed to check favorite"
      );
    }
  }
);

const FavoriteSlice = createSlice({
  name: "favorites",

  initialState: {
    favorites: [],
    previousFavorites: null, // backup for rollback
    loading: false,
    error: null,
    addLoading: false,
    addError: null,
    deleteLoading: false,
    deleteError: null,
    checkLoading: false,
    checkError: null,
  },

  reducers: {
    clearFavoritesError: (state) => {
      state.error = null;
      state.addError = null;
      state.deleteError = null;
      state.checkError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch favorites
      .addCase(fetchFavorites.pending, (state) => {
        // Only show loading spinner on first fetch (when no data exists yet)
        if (state.favorites.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add to favorites
      .addCase(addToFavorites.pending, (state, action) => {
        state.addLoading = true;
        state.addError = null;
        // Back up for rollback
        state.previousFavorites = [...state.favorites];
        // Optimistically add favorite
        const productOrId = action.meta.arg;
        const productId = typeof productOrId === "object" ? productOrId._id : productOrId;
        const product = typeof productOrId === "object" ? productOrId : null;

        if (productId) {
          const exists = state.favorites.some(
            (fav) => (fav.productId?._id || fav.productId) === productId
          );
          if (!exists) {
            state.favorites.push({
              _id: `temp-${Date.now()}`,
              productId: product || productId,
              isOptimistic: true
            });
          }
        }
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.addLoading = false;
        state.addError = null;
        state.previousFavorites = null; // Clear backup
        // Replace optimistic favorite with real one
        if (action.payload) {
          const productId = action.payload.productId?._id || action.payload.productId;
          const productOrId = action.meta.arg;
          const fullProduct = typeof productOrId === "object" ? productOrId : null;

          state.favorites = state.favorites.map((fav) => {
            const favProductId = fav.productId?._id || fav.productId;
            if (favProductId === productId) {
              return {
                ...action.payload,
                productId: fullProduct || fav.productId
              };
            }
            return fav;
          });
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
        // Rollback to previous state
        if (state.previousFavorites) {
          state.favorites = state.previousFavorites;
          state.previousFavorites = null;
        }
        console.error("Add to favorites rejected:", action.payload);
      })
      // Delete favorite
      .addCase(deleteFavorite.pending, (state, action) => {
        state.deleteLoading = true;
        state.deleteError = null;
        // Back up for rollback
        state.previousFavorites = [...state.favorites];
        // Optimistically remove from favorites array
        const { favoriteId, productId } = action.meta.arg || {};
        if (favoriteId) {
          state.favorites = state.favorites.filter(
            (fav) => fav._id !== favoriteId
          );
        } else if (productId) {
          state.favorites = state.favorites.filter((fav) => {
            const favProductId = fav.productId?._id || fav.productId;
            return favProductId !== productId;
          });
        }
      })
      .addCase(deleteFavorite.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.previousFavorites = null; // Clear backup
      })
      .addCase(deleteFavorite.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
        // Rollback to previous state
        if (state.previousFavorites) {
          state.favorites = state.previousFavorites;
          state.previousFavorites = null;
        }
      })
      // Check favorite
      .addCase(checkFavorite.pending, (state) => {
        state.checkLoading = true;
        state.checkError = null;
      })
      .addCase(checkFavorite.fulfilled, (state) => {
        state.checkLoading = false;
      })
      .addCase(checkFavorite.rejected, (state, action) => {
        state.checkLoading = false;
        state.checkError = action.payload;
      });
  },
});

export const { clearFavoritesError } = FavoriteSlice.actions;

export default FavoriteSlice.reducer;

// Selectors
export const selectFavorites = (state) => state.favorites.favorites;
export const selectFavoritesLoading = (state) => state.favorites.loading;
export const selectFavoritesError = (state) => state.favorites.error;
export const selectAddFavoriteLoading = (state) => state.favorites.addLoading;
export const selectAddFavoriteError = (state) => state.favorites.addError;
export const selectDeleteFavoriteLoading = (state) => state.favorites.deleteLoading;
export const selectDeleteFavoriteError = (state) => state.favorites.deleteError;
export const selectCheckFavoriteLoading = (state) => state.favorites.checkLoading;
export const selectCheckFavoriteError = (state) => state.favorites.checkError;

