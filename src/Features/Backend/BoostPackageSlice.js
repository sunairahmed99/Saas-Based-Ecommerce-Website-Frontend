import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/boostpackage`;

// Admin: Create new boost package
export const createBoostPackage = createAsyncThunk(
  "boostPackage/createBoostPackage",
  async ({ title, description, price, productLimit, duration, durationType }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/admin/create`, {
        title,
        description,
        price,
        productLimit,
        duration,
        durationType
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

// Admin: Fetch all boost packages
export const fetchAllBoostPackages = createAsyncThunk(
  "boostPackage/fetchAllBoostPackages",
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

// Admin: Update boost package
export const updateBoostPackage = createAsyncThunk(
  "boostPackage/updateBoostPackage",
  async ({ packageId, updateData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/admin/update/${packageId}`, updateData, {
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

// Admin: Toggle package active status
export const toggleBoostPackageStatus = createAsyncThunk(
  "boostPackage/toggleBoostPackageStatus",
  async ({ packageId, isActive }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/admin/toggle/${packageId}`, { isActive }, {
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

// Public/Seller: Fetch active boost packages
export const fetchActiveBoostPackages = createAsyncThunk(
  "boostPackage/fetchActiveBoostPackages",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/active`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message);
    }
  }
);

const BoostPackageSlice = createSlice({
  name: "boostPackage",
  initialState: {
    packages: [],     // all packages for admin
    activePackages: [], // active packages for sellers
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Create package
      .addCase(createBoostPackage.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(createBoostPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.packages.push(action.payload);
      })
      .addCase(createBoostPackage.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Fetch all packages
      .addCase(fetchAllBoostPackages.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchAllBoostPackages.fulfilled, (state, action) => {
        state.loading = false; state.packages = action.payload;
      })
      .addCase(fetchAllBoostPackages.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Update package
      .addCase(updateBoostPackage.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(updateBoostPackage.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.packages.findIndex(pkg => pkg._id === action.payload._id);
        if (index !== -1) {
          state.packages[index] = action.payload;
        }
      })
      .addCase(updateBoostPackage.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Toggle status
      .addCase(toggleBoostPackageStatus.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(toggleBoostPackageStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.packages.findIndex(pkg => pkg._id === action.payload._id);
        if (index !== -1) {
          state.packages[index] = action.payload;
        }
        // Also update in active packages if present
        const activeIndex = state.activePackages.findIndex(pkg => pkg._id === action.payload._id);
        if (activeIndex !== -1) {
          if (action.payload.isActive) {
            state.activePackages[activeIndex] = action.payload;
          } else {
            state.activePackages.splice(activeIndex, 1);
          }
        }
      })
      .addCase(toggleBoostPackageStatus.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      // Fetch active packages
      .addCase(fetchActiveBoostPackages.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchActiveBoostPackages.fulfilled, (state, action) => {
        state.loading = false; state.activePackages = action.payload;
      })
      .addCase(fetchActiveBoostPackages.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  }
});

export default BoostPackageSlice.reducer;

// SELECTORS
export const selectAllBoostPackages = (state) => state.boostPackage.packages;
export const selectActiveBoostPackages = (state) => state.boostPackage.activePackages;
export const selectBoostPackageLoading = (state) => state.boostPackage.loading;
export const selectBoostPackageError = (state) => state.boostPackage.error;
