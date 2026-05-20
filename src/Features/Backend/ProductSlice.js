import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_BASE_URL } from '../../config';

const API_URL = `${API_BASE_URL}/product`;

// Helper to filter out dummy products with broken loremflickr images
const filterDummyProducts = (products) => {
  if (!Array.isArray(products)) return products;
  return products.filter(p => {
    const isPulseDummy = p.pname && p.pname.includes('Pulse');
    return !isPulseDummy;
  });
};

export const fetchproducts = createAsyncThunk(
  "products/fetchproducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/getall`);
      return filterDummyProducts(res.data.data); // Array of products
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  "products/fetchRelatedProducts",
  async ({ productId, catId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/related`, { params: { productId, catId } });
      return filterDummyProducts(res.data.data);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

export const fetchLatestProducts = createAsyncThunk(
  "products/fetchLatestProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/latest`);
      return filterDummyProducts(res.data.data);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// seller-id se sirf us seller ke products
export const fetchSellerProducts = createAsyncThunk(
  "products/fetchSellerProducts",
  async (sellerId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/getsellerproduct`, {
        headers: {
          "seller_id": sellerId,
        },
      });
      return filterDummyProducts(res.data.data);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Admin: Update product status (approve/reject)
// Backend expects: "pending", "active", "inactive", "outofstock", "delivered"
export const updateProductStatus = createAsyncThunk(
  "products/updateProductStatus",
  async ({ productId, status }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      // Accept string status directly, or convert boolean/other values
      let statusValue;
      if (typeof status === "string" && ["pending", "active", "inactive", "outofstock", "delivered"].includes(status)) {
        statusValue = status;
      } else if (status === true || status === "active") {
        statusValue = "active";
      } else {
        statusValue = "pending";
      }
      const res = await axios.patch(
        `${API_URL}/update-status/${productId}`,
        { pstatus: statusValue },
        {
          headers: {
            ...(token ? { auth_token: token } : {}),
          },
        }
      );
      return res.data.data || res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update product status failed";
      return rejectWithValue(msg);
    }
  }
);

// create product (frontend builds FormData and sends sellerid)
export const createProduct = createAsyncThunk(
  "products/createProduct",
  async ({ product, sellerId, token }, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // basic fields
      if (product._id) formData.append("_id", product._id); // Include _id for updates
      formData.append("pname", product.pname || "");
      formData.append("pdescription", product.pdescription || "");
      formData.append("pprice", product.pprice ?? "");
      formData.append("discountPercent", product.discountPercent ?? "");
      formData.append("sku", product.sku || "");
      formData.append("stockType", product.stockType || "in_stock");
      formData.append("totalStock", product.totalStock ?? "");
      formData.append("minStockAlert", product.minStockAlert ?? "10");
      formData.append("warehouse", product.warehouse || "");
      formData.append("catid", product.catid || "");
      formData.append("subcatid", product.subcatid || "");
      formData.append("sellerid", sellerId || "");

      // optional arrays (stored as comma separated strings)
      formData.append("psize", Array.isArray(product.psize) ? product.psize : product.psize || "");
      formData.append("pcolor", Array.isArray(product.pcolor) ? product.pcolor : product.pcolor || "");

      // images
      if (product.pimage1) formData.append("pimage1", product.pimage1);
      if (product.pimage2) formData.append("pimage2", product.pimage2);
      if (product.pimage3) formData.append("pimage3", product.pimage3);

      const res = await axios.post(`${API_URL}/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { auth_token: token } : {}),
        },
      });

      return res.data.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Create product failed";
      return rejectWithValue(msg);
    }
  }
);

// Get trending products (top 10 by views)
export const fetchTrendingProducts = createAsyncThunk(
  "products/fetchTrendingProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/trending`);
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Delete product
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (productId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/delete/${productId}`, {
        headers: {
          ...(token ? { auth_token: token } : {}),
        },
      });
      return res.data.data || { _id: productId };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete product failed";
      return rejectWithValue(msg);
    }
  }
);

// Get "For You" personalized products
export const fetchForYouProducts = createAsyncThunk(
  "products/fetchForYouProducts",
  async (userId, { rejectWithValue }) => {
    try {
      if (!userId) {
        return []; // Return empty array if no userId
      }
      const res = await axios.get(`${API_URL}/foryou/${userId}`);
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      // If error, return empty array instead of rejecting (user might not have viewed products)
      return [];
    }
  }
);

// Get products by category
export const fetchProductsByCategory = createAsyncThunk(
  "products/fetchProductsByCategory",
  async (categoryId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/category/${categoryId}`);
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Get products by subcategory
export const fetchProductsBySubcategory = createAsyncThunk(
  "products/fetchProductsBySubcategory",
  async (subcategoryId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/subcategory/${subcategoryId}`);
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Get products by seller
export const fetchProductsBySeller = createAsyncThunk(
  "products/fetchProductsBySeller",
  async (sellerId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/seller/${sellerId}`, {
        headers: {
          auth_token: token
        }
      });
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Search products by query
export const searchProducts = createAsyncThunk(
  "products/searchProducts",
  async (query, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }
      const res = await axios.get(`${API_URL}/search`, {
        params: { query: query.trim() }
      });
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Search failed");
    }
  }
);


// Fetch Featured Products
export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeaturedProducts",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/featured`);
      return filterDummyProducts(res.data.data || []);
    } catch (err) {
      return rejectWithValue(err?.message || "Something went wrong");
    }
  }
);

// Toggle Featured Status (Admin)
export const toggleProductFeatured = createAsyncThunk(
  "products/toggleProductFeatured",
  async (productId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`${API_URL}/toggle-feature/${productId}`, {}, {
        headers: {
          auth_token: token
        }
      });
      return res.data.data || res.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err?.message || "Failed to toggle featured status");
    }
  }
);

const ProductSlice = createSlice({
  name: "products",

  initialState: {
    products: [],
    loading: false,
    error: null,
    createdProduct: null,
    productsBySeller: [],
    sellerProductsLoading: false,
    sellerProductsError: null,
    latestProducts: [],
    latestLoading: false,
    latestError: null,
    relatedProducts: [],
    relatedLoading: false,
    trendingProducts: [],
    trendingLoading: false,
    trendingError: null,
    forYouProducts: [],
    forYouLoading: false,
    forYouError: null,
    searchResults: [],
    searchLoading: false,
    searchError: null,
    featuredProducts: [],
    featuredLoading: false,
    featuredError: null,
  },

  reducers: {
    incrementProductViews: (state, action) => {
      const id = action.payload;
      const bump = (arr) => {
        const idx = arr.findIndex((p) => p._id === id);
        if (idx !== -1) {
          const current = arr[idx].views || 0;
          arr[idx] = { ...arr[idx], views: current + 1 };
        }
      };
      bump(state.products);
      bump(state.trendingProducts);
      bump(state.forYouProducts);
    },
    setProductViews: (state, action) => {
      const { id, views } = action.payload || {};
      const setVal = (arr) => {
        const idx = arr.findIndex((p) => p._id === id);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], views };
        }
      };
      if (id != null && views != null) {
        setVal(state.products);
        setVal(state.trendingProducts);
        setVal(state.forYouProducts);
      }
    }
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchproducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchproducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchproducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createdProduct = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.createdProduct = action.payload;
        if (action.payload) {
          state.products.push(action.payload);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload?._id || action.meta?.arg;
        state.products = state.products.filter((p) => p._id !== id);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProductStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the product in the products array
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(updateProductStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.trendingLoading = true;
        state.trendingError = null;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.trendingLoading = false;
        state.trendingProducts = action.payload;
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.trendingLoading = false;
        state.trendingError = action.payload;
      })
      .addCase(fetchForYouProducts.pending, (state) => {
        state.forYouLoading = true;
        state.forYouError = null;
      })
      .addCase(fetchForYouProducts.fulfilled, (state, action) => {
        state.forYouLoading = false;
        state.forYouProducts = action.payload;
      })
      .addCase(fetchForYouProducts.rejected, (state, action) => {
        state.forYouLoading = false;
        state.forYouError = action.payload;
      })
      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductsBySubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsBySubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProductsBySubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductsBySeller.pending, (state) => {
        state.sellerProductsLoading = true;
        state.sellerProductsError = null;
      })
      .addCase(fetchProductsBySeller.fulfilled, (state, action) => {
        state.sellerProductsLoading = false;
        state.productsBySeller = action.payload;
      })
      .addCase(fetchProductsBySeller.rejected, (state, action) => {
        state.sellerProductsLoading = false;
        state.sellerProductsError = action.payload;
      })
      .addCase(searchProducts.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
      })
      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.featuredLoading = true;
        state.featuredError = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredLoading = false;
        state.featuredProducts = action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.featuredLoading = false;
        state.featuredError = action.payload;
      })
      .addCase(fetchLatestProducts.pending, (state) => {
        state.latestLoading = true;
        state.latestError = null;
      })
      .addCase(fetchLatestProducts.fulfilled, (state, action) => {
        state.latestLoading = false;
        state.latestProducts = action.payload;
      })
      .addCase(fetchLatestProducts.rejected, (state, action) => {
        state.latestLoading = false;
        state.latestError = action.payload;
      })
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.relatedLoading = true;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.relatedProducts = action.payload;
      })
      .addCase(fetchRelatedProducts.rejected, (state) => {
        state.relatedLoading = false;
      })
      .addCase(toggleProductFeatured.fulfilled, (state, action) => {
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index].isFeatured = action.payload.isFeatured;
        }
        if (action.payload.isFeatured) {
          if (!state.featuredProducts.some(p => p._id === action.payload._id)) {
             state.featuredProducts.push(action.payload);
          }
        } else {
          state.featuredProducts = state.featuredProducts.filter(p => p._id !== action.payload._id);
        }
      });
  },
});

export const { incrementProductViews, setProductViews } = ProductSlice.actions;

export default ProductSlice.reducer;

export const selectProducts = (state) => state.products.products;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;
export const selectCreatedProduct = (state) => state.products.createdProduct;
export const selectProductsBySeller = (state) => state.products.productsBySeller;
export const selectSellerProductsLoading = (state) => state.products.sellerProductsLoading;
export const selectSellerProductsError = (state) => state.products.sellerProductsError;
export const selectTrendingProducts = (state) => state.products.trendingProducts;
export const selectTrendingLoading = (state) => state.products.trendingLoading;
export const selectForYouProducts = (state) => state.products.forYouProducts;
export const selectForYouLoading = (state) => state.products.forYouLoading;
export const selectSearchResults = (state) => state.products.searchResults;
export const selectSearchLoading = (state) => state.products.searchLoading;
export const selectSearchError = (state) => state.products.searchError;
export const selectFeaturedProducts = (state) => state.products.featuredProducts;
export const selectLatestProducts = (state) => state.products.latestProducts;
export const selectFeaturedLoading = (state) => state.products.featuredLoading;
export const selectLatestLoading = (state) => state.products.latestLoading;
export const selectRelatedProducts = (state) => state.products.relatedProducts;
export const selectRelatedLoading = (state) => state.products.relatedLoading;
