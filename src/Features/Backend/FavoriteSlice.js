import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { getAuthToken } from "../../utils/auth";
import { logout } from "./UserSlice";

const API_URL = `${API_BASE_URL}/favorite`;

const isValidMongoId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));

export const getProductIdFromFavorite = (favorite) => {
  if (!favorite) return null;
  const product = favorite.productId;
  if (product && typeof product === "object" && product._id) {
    return String(product._id);
  }
  if (product) return String(product);
  return null;
};

export const dedupeFavorites = (list) => {
  const seen = new Set();
  const result = [];
  for (const fav of list || []) {
    const pid = getProductIdFromFavorite(fav);
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    result.push(fav);
  }
  return result;
};

const upsertFavorite = (list, favorite, productOrId) => {
  const pid = getProductIdFromFavorite(favorite);
  if (!pid) return dedupeFavorites(list);

  const fullProduct = typeof productOrId === "object" ? productOrId : null;
  const entry = {
    ...favorite,
    productId: fullProduct || favorite.productId,
    isOptimistic: false,
  };

  const rest = (list || []).filter((f) => getProductIdFromFavorite(f) !== pid);
  return dedupeFavorites([entry, ...rest]);
};

const removeFavoriteFromList = (list, { favoriteId, productId }) => {
  const pid = productId ? String(productId) : null;
  return (list || []).filter((f) => {
    if (pid && getProductIdFromFavorite(f) === pid) return false;
    if (favoriteId && String(f._id) === String(favoriteId)) return false;
    return true;
  });
};

let latestFetchId = 0;

export const fetchFavorites = createAsyncThunk(
  "favorites/fetchFavorites",
  async (_, { rejectWithValue }) => {
    const fetchId = ++latestFetchId;
    try {
      const token = getAuthToken();
      const loginType = localStorage.getItem("loginType");

      if (!token || loginType === "seller") {
        return { items: [], fetchId };
      }

      const res = await axios.get(`${API_URL}/getall`, {
        headers: { auth_token: token },
      });

      return {
        items: dedupeFavorites(res.data?.data || []),
        fetchId,
      };
    } catch (err) {
      if (err?.response?.status === 404) {
        return { items: [], fetchId };
      }
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginType");
        return { items: [], fetchId };
      }
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to fetch favorites"
      );
    }
  },
  {
    condition: (_, { getState }) => !getState().favorites.loading,
  }
);

export const addToFavorites = createAsyncThunk(
  "favorites/addToFavorites",
  async (productOrId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const loginType = localStorage.getItem("loginType");

      if (!token) {
        return rejectWithValue("Please login to add favorites");
      }
      if (loginType === "seller") {
        return rejectWithValue("Sellers cannot add favorites");
      }

      const productId =
        typeof productOrId === "object" ? productOrId._id : productOrId;

      const res = await axios.post(
        `${API_URL}/add`,
        { productId },
        { headers: { auth_token: token } }
      );

      return { data: res.data?.data, productOrId };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to add to favorites";
      return rejectWithValue(msg);
    }
  }
);

export const deleteFavorite = createAsyncThunk(
  "favorites/deleteFavorite",
  async ({ favoriteId, productId }, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const loginType = localStorage.getItem("loginType");

      if (loginType === "seller") {
        return rejectWithValue("Sellers cannot delete favorites");
      }
      if (!token) {
        return rejectWithValue("Please login to remove favorites");
      }

      const headers = { auth_token: token };
      const pid = productId ? String(productId) : null;

      if (favoriteId && isValidMongoId(favoriteId)) {
        await axios.delete(`${API_URL}/delete/${favoriteId}`, { headers });
      } else if (pid) {
        await axios.delete(`${API_URL}/remove`, {
          data: { productId: pid },
          headers,
        });
      } else {
        return rejectWithValue("Product ID is required to remove favorite");
      }

      return { favoriteId, productId: pid };
    } catch (err) {
      if (err?.response?.status === 404) {
        return { favoriteId, productId: productId ? String(productId) : null, notFound: true };
      }
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to remove favorite"
      );
    }
  }
);

export const checkFavorite = createAsyncThunk(
  "favorites/checkFavorite",
  async (productId, { rejectWithValue }) => {
    try {
      const token = getAuthToken();
      const loginType = localStorage.getItem("loginType");

      if (loginType === "seller") {
        return { isFavorite: false };
      }

      const res = await axios.get(`${API_URL}/check/${productId}`, {
        headers: { ...(token ? { auth_token: token } : {}) },
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
    clearFavorites: (state) => {
      state.favorites = [];
      state.loading = false;
      state.error = null;
      state.addLoading = false;
      state.addError = null;
      state.deleteLoading = false;
      state.deleteError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.fetchId === latestFetchId) {
          state.favorites = action.payload.items;
        }
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToFavorites.pending, (state) => {
        state.addLoading = true;
        state.addError = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.addLoading = false;
        const { data, productOrId } = action.payload || {};
        if (data) {
          state.favorites = upsertFavorite(state.favorites, data, productOrId);
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.addLoading = false;
        state.addError = action.payload;
      })

      .addCase(deleteFavorite.pending, (state, action) => {
        state.deleteLoading = true;
        state.deleteError = null;
        state.favorites = removeFavoriteFromList(
          state.favorites,
          action.meta.arg || {}
        );
      })
      .addCase(deleteFavorite.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.favorites = removeFavoriteFromList(
          state.favorites,
          action.payload || {}
        );
      })
      .addCase(deleteFavorite.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })

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
      })

      .addCase(logout, (state) => {
        state.favorites = [];
        state.loading = false;
        state.error = null;
        state.addLoading = false;
        state.addError = null;
        state.deleteLoading = false;
        state.deleteError = null;
      });
  },
});

export const { clearFavoritesError, clearFavorites } = FavoriteSlice.actions;

export default FavoriteSlice.reducer;

export const selectFavorites = (state) => state.favorites.favorites;
export const selectFavoritesLoading = (state) => state.favorites.loading;
export const selectFavoritesError = (state) => state.favorites.error;
export const selectAddFavoriteLoading = (state) => state.favorites.addLoading;
export const selectAddFavoriteError = (state) => state.favorites.addError;
export const selectDeleteFavoriteLoading = (state) => state.favorites.deleteLoading;
export const selectDeleteFavoriteError = (state) => state.favorites.deleteError;
export const selectCheckFavoriteLoading = (state) => state.favorites.checkLoading;
export const selectCheckFavoriteError = (state) => state.favorites.checkError;

/** Whether a product id is in the current favorites list */
export const selectIsProductFavorite = (productId) => (state) => {
  if (!productId) return false;
  const pid = String(productId);
  return (state.favorites.favorites || []).some(
    (f) => getProductIdFromFavorite(f) === pid
  );
};
