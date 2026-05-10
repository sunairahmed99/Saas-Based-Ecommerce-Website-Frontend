import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/seller`;

// All sellers list (admin use)
export const fetchSeller = createAsyncThunk(
  "seller/fetchSeller",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/getall`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Create seller account
export const createSeller = createAsyncThunk(
  "seller/createSeller",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Something went wrong";
      return rejectWithValue(msg);
    }
  }
);

// Verify seller code
export const verifySellerCode = createAsyncThunk(
  "seller/verifySellerCode",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/verify`, payload);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Verification failed";
      return rejectWithValue(msg);
    }
  }
);

// Seller login
export const loginSeller = createAsyncThunk(
  "seller/loginSeller",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/login`, credentials);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login failed";
      return rejectWithValue(msg);
    }
  }
);

export const verifySellerLoginCode = createAsyncThunk(
  "seller/verifySellerLoginCode",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/verify-login`, payload);
      // check for active
      const sellerRes = res?.data?.seller || res?.data?.data || res?.data;
      if ((sellerRes && sellerRes.active === false) || (res?.data?.active === false)) {
        return rejectWithValue("Your seller account is not active yet. Please wait for active.");
      }
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("loginType", "seller");
      }
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Login verification failed";
      return rejectWithValue(msg);
    }
  }
);

// Seller forgot password
export const sellerForgotPassword = createAsyncThunk(
  "seller/forgotPassword",
  async (emailObj, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/forgot`, emailObj);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Forgot password failed";
      return rejectWithValue(msg);
    }
  }
);

// Seller reset password
export const sellerResetPassword = createAsyncThunk(
  "seller/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/resetpass`, payload);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Reset password failed";
      return rejectWithValue(msg);
    }
  }
);

// Update seller active status (admin)
export const updateSellerStatus = createAsyncThunk(
  "seller/updateSellerStatus",
  async ({ id, active }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/update-status/${id}`, {
        active,
      });
      // Backend returns { status: "success", data: seller }
      return res.data?.data || res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Update seller status failed";
      return rejectWithValue(msg);
    }
  }
);

// Update seller profile
export const updateProfile = createAsyncThunk(
  "seller/updateProfile",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.sellers.seller?.token || localStorage.getItem("token");
      const formData = new FormData();
      for (const key in payload) {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      }
      const res = await axios.patch(
        `${API_URL}/editprofile`,
        formData,
        {
          headers: {
            auth_token: token,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Update profile failed"
      );
    }
  }
);

// Current seller via token
export const fetchCurrentSeller = createAsyncThunk(
  "seller/fetchCurrentSeller",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/sellerverify`, {
        headers: {
          auth_token: token ? `${token}` : undefined,
        },
      });
      return res.data.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Fetch seller failed";
      return rejectWithValue(msg);
    }
  }
);

export const changePassword = createAsyncThunk(
  "seller/changePassword",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state.sellers.seller?.token || localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/changepassword`, payload, {
        headers: {
          auth_token: token,
        },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Change password failed"
      );
    }
  }
);

// Get top performing sellers based on sales
export const fetchTopPerformingSellers = createAsyncThunk(
  "seller/fetchTopPerformingSellers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/top-performing`);
      return res.data.data || [];
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

const SellerSlice = createSlice({
  name: "sellers",

  initialState: {
    sellers: [],
    loading: false,
    error: null,
    createdSeller: null,
    seller: null,
    loginLoading: false,
    loginError: null,
    verifyLoading: false,
    verifyError: null,
    updateLoading: false,
    updateError: null,
    passwordLoading: false,
    passwordError: null,
    initializing: false,
    topPerformingSellers: [],
    topPerformingLoading: false,
    topPerformingError: null,
  },

  reducers: {
    logoutSeller: (state) => {
      state.seller = null;
      localStorage.removeItem("token");
      localStorage.removeItem("loginType");
      state.initializing = false;
    },
    resetSellerRegistration: (state) => {
      state.createdSeller = null;
      state.error = null;
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // all sellers list
      .addCase(fetchSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.sellers = action.payload;
      })
      .addCase(fetchSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // create seller
      .addCase(createSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createdSeller = null;
      })
      .addCase(createSeller.fulfilled, (state, action) => {
        state.loading = false;
        state.createdSeller = action.payload;
        state.sellers.push(action.payload);
      })
      .addCase(createSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // login seller
      .addCase(loginSeller.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(loginSeller.fulfilled, (state, action) => {
        state.loginLoading = false;
        // Defensive: don't mutate state if seller not active (should not happen from thunk, but extra safe)
        const sellerPayload = action.payload?.seller || action.payload?.data || action.payload;
        if (sellerPayload && sellerPayload.active === false) {
          // Do nothing, error should be handled by rejected case already
          return;
        }
        if (action.payload?.active === false) {
          // Do nothing, error handled by rejected
          return;
        }
        // If active true, save seller
        state.seller = action.payload;
      })
      .addCase(loginSeller.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload;
      })
      // verify seller login code
      .addCase(verifySellerLoginCode.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifySellerLoginCode.fulfilled, (state, action) => {
        state.verifyLoading = false;
        const sellerPayload = action.payload?.seller || action.payload?.data || action.payload;
        if (sellerPayload && sellerPayload.active === false) {
          return;
        }
        state.seller = action.payload;
      })
      .addCase(verifySellerLoginCode.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      })
      // verify seller code
      .addCase(verifySellerCode.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifySellerCode.fulfilled, (state) => {
        state.verifyLoading = false;
      })
      .addCase(verifySellerCode.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      })
      // update seller active status
      .addCase(updateSellerStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSellerStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSeller = action.payload;
        if (!updatedSeller?._id) return;
        state.sellers = state.sellers.map((s) =>
          s._id === updatedSeller._id ? updatedSeller : s
        );
      })
      .addCase(updateSellerStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // update seller profile
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.seller = { ...(state.seller || {}), data: action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      // current seller via token
      .addCase(fetchCurrentSeller.pending, (state) => {
        state.initializing = true;
      })
      .addCase(fetchCurrentSeller.fulfilled, (state, action) => {
        state.initializing = false;
        if (action.payload) {
          state.seller = { ...(state.seller || {}), data: action.payload };
        }
      })
      .addCase(fetchCurrentSeller.rejected, (state) => {
        state.initializing = false;
        state.seller = null;
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordLoading = true;
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.passwordLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordLoading = false;
        state.passwordError = action.payload;
      })
      .addCase(fetchTopPerformingSellers.pending, (state) => {
        state.topPerformingLoading = true;
        state.topPerformingError = null;
      })
      .addCase(fetchTopPerformingSellers.fulfilled, (state, action) => {
        state.topPerformingLoading = false;
        state.topPerformingSellers = action.payload;
      })
      .addCase(fetchTopPerformingSellers.rejected, (state, action) => {
        state.topPerformingLoading = false;
        state.topPerformingError = action.payload;
      });
  },
});

export const { logoutSeller, resetSellerRegistration } = SellerSlice.actions;

export default SellerSlice.reducer;

export const selectSellers = (state) => state.sellers.sellers;
export const selectSellersLoading = (state) => state.sellers.loading;
export const selectSellersError = (state) => state.sellers.error;
export const selectCreatedSeller = (state) => state.sellers.createdSeller;
export const selectSeller = (state) => state.sellers.seller;
export const selectSellerLoginLoading = (state) => state.sellers.loginLoading;
export const selectSellerLoginError = (state) => state.sellers.loginError;
export const selectSellerVerifyLoading = (state) => state.sellers.verifyLoading;
export const selectSellerVerifyError = (state) => state.sellers.verifyError;
export const selectUpdateLoading = (state) => state.sellers.updateLoading;
export const selectUpdateError = (state) => state.sellers.updateError;
export const selectPasswordLoading = (state) => state.sellers.passwordLoading;
export const selectPasswordError = (state) => state.sellers.passwordError;
export const selectSellerInitializing = (state) => state.sellers.initializing;
export const selectTopPerformingSellers = (state) => state.sellers.topPerformingSellers;
export const selectTopPerformingLoading = (state) => state.sellers.topPerformingLoading;
