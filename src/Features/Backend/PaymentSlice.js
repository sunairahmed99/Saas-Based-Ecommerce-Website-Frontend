import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_BASE = `${API_BASE_URL}`;

// Async thunk for creating payment intent
export const createPaymentIntent = createAsyncThunk(
  "payment/createPaymentIntent",
  async ({ amount, currency = "pkr", cardType }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE}/api/payment/create-intent`,
        { amount, currency, cardType },
        {
          headers: {
            auth_token: token,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // If backend API doesn't exist (404), return mock data for development
      if (error.response?.status === 404) {
        return {
          paymentIntent: {
            id: `pi_mock_${Date.now()}`,
            client_secret: `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount,
            currency: currency,
            status: 'requires_payment_method'
          },
          clientSecret: `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to create payment intent"
      );
    }
  }
);

// Async thunk for confirming payment
export const confirmPayment = createAsyncThunk(
  "payment/confirmPayment",
  async ({ paymentIntentId, paymentMethodId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/payment/confirm`,
        { paymentIntentId, paymentMethodId },
        {
          headers: {
            auth_token: token,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // If backend API doesn't exist (404), return mock data for development
      if (error.response?.status === 404) {
        return {
          paymentIntent: {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 1000, // Mock amount
            currency: 'pkr'
          }
        };
      }
      return rejectWithValue(
        error.response?.data?.message || "Payment confirmation failed"
      );
    }
  }
);

// Async thunk for processing order with card payment
export const processCardPayment = createAsyncThunk(
  "payment/processCardPayment",
  async (orderData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE}/api/orders/card-payment`,
        orderData,
        {
          headers: {
            auth_token: token,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      // If backend API doesn't exist (404), return mock data for development
      if (error.response?.status === 404) {
        return {
          order: {
            _id: `order_mock_${Date.now()}`,
            status: 'confirmed',
            paymentMethod: orderData.paymentMethod,
            totalAmount: orderData.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
            createdAt: new Date().toISOString()
          },
          message: "Order placed successfully with mock payment"
        };
      }
      return rejectWithValue(
        error.response?.data?.message || "Card payment processing failed"
      );
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState: {
    paymentIntent: null,
    clientSecret: null,
    cardType: "credit", // "credit" or "debit"
    paymentMethod: null,
    loading: false,
    error: null,
    paymentStatus: "idle", // "idle", "processing", "succeeded", "failed"
  },
  reducers: {
    setCardType: (state, action) => {
      state.cardType = action.payload;
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    resetPayment: (state) => {
      state.paymentIntent = null;
      state.clientSecret = null;
      state.paymentMethod = null;
      state.loading = false;
      state.error = null;
      state.paymentStatus = "idle";
    },
    clearPaymentError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Payment Intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.paymentStatus = "processing";
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentIntent = action.payload.paymentIntent;
        state.clientSecret = action.payload.clientSecret;
        state.paymentStatus = "succeeded";
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paymentStatus = "failed";
      })
      // Confirm Payment
      .addCase(confirmPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = "succeeded";
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paymentStatus = "failed";
      })
      // Process Card Payment
      .addCase(processCardPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.paymentStatus = "processing";
      })
      .addCase(processCardPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentStatus = "succeeded";
      })
      .addCase(processCardPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.paymentStatus = "failed";
      });
  },
});

export const { setCardType, setPaymentMethod, resetPayment, clearPaymentError } = paymentSlice.actions;

// Selectors
export const selectPaymentIntent = (state) => state.payment.paymentIntent;
export const selectClientSecret = (state) => state.payment.clientSecret;
export const selectCardType = (state) => state.payment.cardType;
export const selectPaymentMethod = (state) => state.payment.paymentMethod;
export const selectPaymentLoading = (state) => state.payment.loading;
export const selectPaymentError = (state) => state.payment.error;
export const selectPaymentStatus = (state) => state.payment.paymentStatus;

export default paymentSlice.reducer;
