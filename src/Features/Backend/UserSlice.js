import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';
import { getAuthToken } from '../../utils/auth';

const API_URL = `${API_BASE_URL}/user`;


export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login as admin to access users");
      }

      const res = await axios.get(`${API_URL}/getall`, {
        headers: {
          auth_token: token,
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


export const createUsers = createAsyncThunk(
  "users/createUsers",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // success: backend ka data object return karo
      return res.data.data;

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Something went wrong";
      return rejectWithValue(msg);
    }
  }
);

export const loginUser = createAsyncThunk(
  "users/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/login`, credentials);
      // Save token if available (for regular users who don't need verification)
      if (res.data.token) {
        const cleanToken = res.data.token.replace(/^Bearer\s+/i, "").trim();
        localStorage.setItem("token", cleanToken);
        localStorage.setItem("loginType", "user");
      }
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

export const verifyLoginCode = createAsyncThunk(
  "users/verifyLoginCode",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/verify-login`, payload);

      // Save token if available
      if (res.data.token) {
        const cleanToken = res.data.token.replace(/^Bearer\s+/i, "").trim();
        localStorage.setItem("token", cleanToken);
        localStorage.setItem("loginType", "user");
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Login verification failed");
    }
  }
);

export const verifyCode = createAsyncThunk(
  "users/verifyCode",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/verify`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Verification failed");
    }
  }
);

export const handleGoogleLogin = createAsyncThunk(
  "users/handleGoogleLogin",
  async (token, { rejectWithValue }) => {
    try {
      // Token and loginType should already be stored from URL parameters
      // Just fetch and return user data using the token
      const res = await axios.get(`${API_URL}/userverify`, {
        headers: {
          auth_token: token,
        },
      });

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Google login failed");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "users/forgotPassword",
  async (emailObj, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/forgot`, emailObj);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Forgot password failed");
    }
  }
);

export const resetPassword = createAsyncThunk(
  "users/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`${API_URL}/resetpass`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Reset password failed");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "users/updateProfile",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to update profile");
      }

      const formData = new FormData();

      // Add text fields
      if (payload.name) formData.append('name', payload.name);
      if (payload.phone) formData.append('phone', payload.phone);
      if (payload.gender) formData.append('gender', payload.gender);

      // Add file if exists
      if (payload.image) {
        formData.append('image', payload.image);
      }

      const res = await axios.patch(`${API_URL}/editprofile`, formData, {
        headers: {
          auth_token: token,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Update profile failed");
    }
  }
);

export const changePassword = createAsyncThunk(
  "users/changePassword",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to change password");
      }

      const res = await axios.post(`${API_URL}/changepassword`, payload, {
        headers: {
          auth_token: token,
        },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Change password failed");
    }
  }
);

export const updateRole = createAsyncThunk(
  "users/updateRole",
  async (payload, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return rejectWithValue("Please login to update role");
      }

      const res = await axios.patch(`${API_URL}/updaterole`, payload, {
        headers: {
          auth_token: token,
        },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || "Update role failed");
    }
  }
);

// Optional: token se current user verify karne ke liye (GET /user/userverify)
export const fetchCurrentUser = createAsyncThunk(
  "users/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error('No token available');
      }

      const res = await axios.get(`${API_URL}/userverify`, {
        headers: {
          auth_token: token,
        },
        timeout: 20000,
      });

      return res.data?.data;
    } catch (err) {
      // If token is invalid, clear it from localStorage
      if (err?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("loginType");
      }
      return rejectWithValue(err?.response?.data?.message || "Fetch user failed");
    }
  }
);


const usersSlice = createSlice({
  name: "users",

  initialState: {
    users: [],
    loading: false,
    error: null,
    createdUser: null,
    user: null,
    loginLoading: false,
    loginError: null,
    verifyLoading: false,
    verifyError: null,
    forgotLoading: false,
    forgotError: null,
    resetLoading: false,
    resetError: null,
    updateLoading: false,
    updateError: null,
    passwordLoading: false,
    passwordError: null,
    initializing: false,
    googleLoginLoading: false,
  },

  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem("token");
      localStorage.removeItem("loginType");
      state.initializing = false;
    },
    resetUserRegistration: (state) => {
      state.createdUser = null;
      state.error = null;
      state.loading = false;
    },
  },

  extraReducers: (builder) => {
    builder


      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })

      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      .addCase(createUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createdUser = null;
      })

      .addCase(createUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.createdUser = action.payload;
        state.users.push(action.payload); // Add new user to list
      })

      .addCase(createUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message || "Registration failed";
      })

      .addCase(loginUser.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginLoading = false;
        // Only update user state if login was successful and token was provided
        // (for regular users who don't need verification)
        if (action.payload.token && action.payload.data) {
          state.user = { data: action.payload.data };
        }
        // For admin users, we don't update state here - verification comes next
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload || action.error?.message || "Login failed";
      })
      .addCase(verifyLoginCode.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifyLoginCode.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.initializing = false;
        state.user = { data: action.payload?.data };
      })
      .addCase(verifyLoginCode.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      })
      .addCase(verifyCode.pending, (state) => {
        state.verifyLoading = true;
        state.verifyError = null;
      })
      .addCase(verifyCode.fulfilled, (state, action) => {
        state.verifyLoading = false;
      })
      .addCase(verifyCode.rejected, (state, action) => {
        state.verifyLoading = false;
        state.verifyError = action.payload;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.forgotLoading = true;
        state.forgotError = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotLoading = false;
        state.forgotError = action.payload;
      })
      .addCase(resetPassword.pending, (state) => {
        state.resetLoading = true;
        state.resetError = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetLoading = false;
        state.resetError = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.user = { ...(state.user || {}), data: action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      .addCase(changePassword.pending, (state) => {
        state.passwordLoading = true;
        state.passwordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.passwordLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.passwordLoading = false;
        state.passwordError = action.payload;
      })
      .addCase(updateRole.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateRole.fulfilled, (state) => {
        state.updateLoading = false;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.initializing = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.initializing = false;
        state.user = { data: action.payload };
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.initializing = false;
      })
      .addCase(handleGoogleLogin.pending, (state) => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(handleGoogleLogin.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = { data: action.payload };
      })
      .addCase(handleGoogleLogin.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload;
        state.user = null;
      });
  },
});

export const { logout } = usersSlice.actions;
export const { resetUserRegistration } = usersSlice.actions;

export default usersSlice.reducer;

export const selectUsers = (state) => state.users.users;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;
export const selectCreatedUser = (state) => state.users.createdUser;
export const selectLoginLoading = (state) => state.users.loginLoading;
export const selectLoginError = (state) => state.users.loginError;
export const selectUser = (state) => state.users.user;
export const selectVerifyLoading = (state) => state.users.verifyLoading;
export const selectVerifyError = (state) => state.users.verifyError;
export const selectForgotLoading = (state) => state.users.forgotLoading;
export const selectForgotError = (state) => state.users.forgotError;
export const selectResetLoading = (state) => state.users.resetLoading;
export const selectResetError = (state) => state.users.resetError;
export const selectUpdateLoading = (state) => state.users.updateLoading;
export const selectUpdateError = (state) => state.users.updateError;
export const selectPasswordLoading = (state) => state.users.passwordLoading;
export const selectPasswordError = (state) => state.users.passwordError;
export const selectUserInitializing = (state) => state.users.initializing;
export const selectGoogleLoginLoading = (state) => state.users.googleLoginLoading;
