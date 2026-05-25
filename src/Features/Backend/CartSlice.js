import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./UserSlice";

const CART_STORAGE_KEY = "localCart";

const getProductPrice = (product) => {
  if (!product) return 0;
  if (product.prodisprice > 0) return product.prodisprice;
  if (product.pactualprice > 0) return product.pactualprice;
  return product.pprice || 0;
};

export const getCartProductId = (item) => {
  const product = item?.productId;
  if (product && typeof product === "object" && product._id) {
    return String(product._id);
  }
  if (product) return String(product);
  return null;
};

const cartItemsMatch = (a, b) => {
  const pidA = getCartProductId(a);
  const pidB = getCartProductId(b);
  if (!pidA || !pidB || pidA !== pidB) return false;
  return (a.color ?? null) === (b.color ?? null) && (a.size ?? null) === (b.size ?? null);
};

const makeLineId = (productId, color, size) =>
  `cart-${productId}-${color ?? "none"}-${size ?? "none"}`;

const recalcTotals = (state) => {
  state.totalItems = state.cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );
  state.totalCartValue = state.cartItems.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );
  state.cartCount = state.cartItems.length;
};

const persistCart = (items) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota errors */
  }
};

const loadCartFromStorage = () => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const initialCartItems = loadCartFromStorage();

const CartSlice = createSlice({
  name: "cart",

  initialState: {
    cartItems: initialCartItems,
    loading: false,
    error: null,
    cartCount: initialCartItems.length,
    totalItems: initialCartItems.reduce((s, i) => s + (i.quantity || 0), 0),
    totalCartValue: initialCartItems.reduce((s, i) => s + (i.totalPrice || 0), 0),
  },

  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    addToCart: (state, action) => {
      const { product, quantity = 1, color = null, size = null } = action.payload;
      if (!product?._id) return;

      const productId = String(product._id);
      const qty = Math.max(1, Number(quantity) || 1);
      const itemPrice = getProductPrice(product);

      const existingIdx = state.cartItems.findIndex((item) =>
        cartItemsMatch(item, { productId: product, color, size })
      );

      if (existingIdx !== -1) {
        const existing = state.cartItems[existingIdx];
        existing.quantity += qty;
        existing.totalPrice = existing.price * existing.quantity;
      } else {
        state.cartItems.push({
          _id: makeLineId(productId, color, size),
          productId: product,
          quantity: qty,
          color: color ?? null,
          size: size ?? null,
          price: itemPrice,
          totalPrice: itemPrice * qty,
        });
      }

      recalcTotals(state);
      persistCart(state.cartItems);
    },
    updateCartItem: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const qty = Math.max(1, Number(quantity) || 1);
      const item = state.cartItems.find((i) => i._id === cartItemId);
      if (!item) return;

      item.quantity = qty;
      item.totalPrice = (item.price || 0) * qty;
      recalcTotals(state);
      persistCart(state.cartItems);
    },
    removeFromCart: (state, action) => {
      const cartItemId = action.payload;
      state.cartItems = state.cartItems.filter((item) => item._id !== cartItemId);
      recalcTotals(state);
      persistCart(state.cartItems);
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.totalItems = 0;
      state.totalCartValue = 0;
      state.cartCount = 0;
      state.error = null;
      persistCart([]);
    },
    hydrateCart: (state) => {
      state.cartItems = loadCartFromStorage();
      recalcTotals(state);
    },
  },

  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.cartItems = [];
      state.totalItems = 0;
      state.totalCartValue = 0;
      state.cartCount = 0;
      state.loading = false;
      state.error = null;
      persistCart([]);
    });
  },
});

export const {
  clearCartError,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  hydrateCart,
} = CartSlice.actions;

export default CartSlice.reducer;

export const selectCartItems = (state) => state.cart.cartItems;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectCartCount = (state) => state.cart.cartItems.length;
export const selectCartBadgeCount = (state) =>
  state.cart.cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
export const selectTotalItems = (state) => state.cart.totalItems;
export const selectTotalCartValue = (state) => state.cart.totalCartValue;
