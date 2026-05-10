import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/contact`;

// User submits contact form
export const createContact = createAsyncThunk(
  "contact/createContact",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_URL}/create`, payload);
      return res.data?.data || res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to submit message";
      return rejectWithValue(msg);
    }
  }
);

// Admin: fetch all contact queries
export const fetchContacts = createAsyncThunk(
  "contact/fetchContacts",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState().users.user?.data?.token || localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/getall`, {
        headers: {
          auth_token: token,
        },
      });
      return res.data?.data || res.data || [];
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to fetch contact queries";
      return rejectWithValue(msg);
    }
  }
);

const ContactSlice = createSlice({
  name: "contact",
  initialState: {
    list: [],
    loading: false,
    error: null,
    submitting: false,
    submitError: null,
    lastSubmitted: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createContact.pending, (state) => {
        state.submitting = true;
        state.submitError = null;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.submitting = false;
        state.lastSubmitted = action.payload;
      })
      .addCase(createContact.rejected, (state, action) => {
        state.submitting = false;
        state.submitError = action.payload;
      })
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ContactSlice.reducer;

export const selectContacts = (state) => state.contact.list;
export const selectContactLoading = (state) => state.contact.loading;
export const selectContactError = (state) => state.contact.error;
export const selectContactSubmitting = (state) => state.contact.submitting;
export const selectContactSubmitError = (state) => state.contact.submitError;
export const selectContactLastSubmitted = (state) => state.contact.lastSubmitted;

