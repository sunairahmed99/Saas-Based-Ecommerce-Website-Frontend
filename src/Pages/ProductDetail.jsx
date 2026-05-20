import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Image } from "react-bootstrap";
import { FaStar, FaShoppingCart, FaHeart, FaUser, FaTag, FaBox, FaPalette, FaLayerGroup, FaSpinner } from "react-icons/fa";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { fetchRelatedProducts, selectRelatedProducts, selectProducts, selectProductsLoading, setProductViews } from "../Features/Backend/ProductSlice";
import { addToCart, fetchCartItems, fetchCartCount, selectAddCartLoading, selectAddCartError, selectCartItems } from "../Features/Backend/CartSlice";
import { selectUser } from "../Features/Backend/UserSlice";
import { addToFavorites, fetchFavorites, deleteFavorite, checkFavorite, selectAddFavoriteLoading, selectAddFavoriteError, selectFavorites } from "../Features/Backend/FavoriteSlice";
import { fetchUserOrderedProducts, createProductReview, selectUserOrderedProducts, selectCreatingProductReview, selectCreateProductReviewError } from "../Features/Backend/ReviewSlice";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { trackViewedProduct } from "../utils/userBehavior";
import { API_BASE_URL } from '../config';
import OptimizedImage from "../Components/OptimizedImage";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const allProducts = useSelector(selectProducts) || [];
  const loading = useSelector(selectProductsLoading);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [toast, setToast] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const user = useSelector(selectUser);
  const addCartLoading = useSelector(selectAddCartLoading);
  const addCartError = useSelector(selectAddCartError);
  const cartItems = useSelector(selectCartItems) || [];
  const favorites = useSelector(selectFavorites) || [];
  const addFavoriteLoading = useSelector(selectAddFavoriteLoading);
  const addFavoriteError = useSelector(selectAddFavoriteError);

  // Review related state
  const userOrderedProducts = useSelector(selectUserOrderedProducts) || [];
  const creatingProductReview = useSelector(selectCreatingProductReview);
  const createProductReviewError = useSelector(selectCreateProductReviewError);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [hasPurchasedProduct, setHasPurchasedProduct] = useState(false);
  const [forceMobileRender, setForceMobileRender] = useState(false);

  const deviceId = (() => {
    let d = localStorage.getItem("deviceId");
    if (!d) {
      const rand = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : String(Date.now() + Math.random());
      d = rand;
      localStorage.setItem("deviceId", d);
    }
    return d;
  })();

  const relatedProducts = useSelector(selectRelatedProducts) || [];

  // Find preloaded catalog details from Redux cache (pre-fetched on splash screen)
  const preloadedProduct = allProducts.find((p) => p._id === id);

  // High-performance caching and fetching using TanStack Query
  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const userId = user && user._id ? user._id : localStorage.getItem("userId") || undefined;
      const res = await axios.get(
        `${API_BASE_URL}/product/view/${id}`,
        { 
          params: { 
            device_id: deviceId,
            user_id: userId 
          } 
        }
      );
      
      const updated = res?.data?.data;
      if (updated) {
        if (updated._id && typeof updated.views === "number") {
          dispatch(setProductViews({ id: updated._id, views: updated.views }));
        }
        trackViewedProduct(updated._id, updated.category || updated.pcategory);
      }
      return updated;
    },
    // Seed the UI instantly with pre-fetched Redux data
    initialData: preloadedProduct || undefined,
    initialDataUpdatedAt: preloadedProduct ? Date.now() - 60000 : undefined, // Forces a quiet background refresh
    staleTime: 30000,
  });

  // Only show the loading spinner if we have absolutely no cached product data
  const localLoading = isLoading && !product;

  useEffect(() => {
    // Only fetch essential data, NOT all products
    const token = localStorage.getItem("token");
    const loginType = localStorage.getItem("loginType");

    if (token && (loginType === "user" || loginType === "google") && user) {
      dispatch(fetchCartItems());
      dispatch(fetchFavorites());
      dispatch(fetchUserOrderedProducts());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (product && product.catid) {
      const categoryId = product.catid._id || product.catid;
      dispatch(fetchRelatedProducts({ productId: product._id, catId: categoryId }));
    }
  }, [dispatch, product?._id, product?.catid]);




  // Auto-hide toast - MUST be before any early returns
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Only show loader if we don't have the product data yet
  if (localLoading) {
    return (
      <>
        <Navbar />
        <div className="product-detail-page">
          <div className="product-detail-container">
            <div className="product-images-section">
              <div className="main-image-wrapper skeleton-card">
                <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
              </div>
              <div className="thumbnail-row">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="thumbnail skeleton-card" style={{ border: 'none' }}>
                    <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="product-info-section" style={{ gap: '1rem' }}>
              <div className="skeleton-pulse" style={{ height: '32px', width: '80%', borderRadius: '8px' }}></div>
              <div className="skeleton-pulse" style={{ height: '18px', width: '30%', borderRadius: '4px' }}></div>
              <div className="skeleton-pulse" style={{ height: '24px', width: '40%', borderRadius: '6px', margin: '0.5rem 0' }}></div>
              <div className="skeleton-pulse" style={{ height: '80px', width: '100%', borderRadius: '12px' }}></div>
              <div className="skeleton-pulse" style={{ height: '100px', width: '100%', borderRadius: '12px', marginTop: '1rem' }}></div>
              <div className="skeleton-pulse" style={{ height: '45px', width: '50%', borderRadius: '10px', marginTop: '1rem' }}></div>
            </div>
          </div>
        </div>
        <Footer />
        <style>{`
          .product-detail-page {
            min-height: 90vh;
            background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
            padding: 2rem 2vw 4vw 2vw;
            color: #fff;
          }
          .product-detail-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-bottom: 4rem;
          }
          .product-images-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .main-image-wrapper {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(255,255,255,0.08);
          }
          .thumbnail-row {
            display: flex;
            gap: 1rem;
          }
          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 12px;
            overflow: hidden;
            background: rgba(255,255,255,0.06);
          }
          .product-info-section {
            display: flex;
            flex-direction: column;
          }
          .skeleton-card {
            pointer-events: none;
            background: rgba(255, 255, 255, 0.04) !important;
          }
          .skeleton-pulse {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
          }
          @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <motion.div className="product-detail-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexDirection: "column", gap: "1rem" }}>
          <h2>Product not found</h2>
          <button onClick={() => navigate("/shop")} style={{ padding: "0.8rem 1.5rem", borderRadius: "10px", background: "linear-gradient(135deg, #f97316, #facc15)", color: "#1e293b", border: "none", cursor: "pointer", fontWeight: "700", boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)", transition: "all 0.2s" }}>
            Back to Shop
          </button>
        </motion.div>
        <Footer />
        <style>{`
          .product-detail-page {
            min-height: 90vh;
            background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
            padding: 2rem 2vw 4vw 2vw;
            color: #fff;
          }
        `}</style>
      </>
    );
  }

  const images = product 
    ? [product.pimage1, product.pimage2, product.pimage3]
        .filter(img => img && typeof img === 'string' && img.trim() !== '' && img !== 'null' && img !== 'undefined')
    : [];
  const mainImage = images[selectedImage] || images[0] || "https://via.placeholder.com/600?text=No+Image";
  const sellerName = product?.sellerid?.sname || product?.sellerid?.name || product?.sellerid || "Unknown Seller";
  const categoryName = product?.catid?.name || product?.catid?.cname || product?.catid || "N/A";
  const subcategoryName = product?.subcatid?.name || product?.subcatid?.scname || product?.subcatid || "N/A";
  const sizes = product ? (Array.isArray(product.psize) ? product.psize : []) : [];
  const colors = product ? (Array.isArray(product.pcolor) ? product.pcolor : []) : [];

  // Check if product is in favorites
  const isInFavorites = favorites.some((fav) => {
    const favProductId = fav.productId?._id || fav.productId;
    return favProductId === product._id;
  });


  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      setToast({
        type: "error",
        message: "Please login to add items to cart",
        icon: <FaExclamationCircle />,
      });
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    if (product.pstatus === "outofstock" || product.pstatus === "inactive") {
      setToast({
        type: "error",
        message: "Product is not available",
        icon: <FaExclamationCircle />,
      });
      return;
    }

    // Check if color is required and not selected
    if (colors.length > 0 && !selectedColor) {
      setToast({
        type: "error",
        message: "Please select a color",
        icon: <FaExclamationCircle />,
      });
      return;
    }

    // Check if size is required and not selected
    if (sizes.length > 0 && !selectedSize) {
      setToast({
        type: "error",
        message: "Please select a size",
        icon: <FaExclamationCircle />,
      });
      return;
    }

    // Check if item already exists in cart with same color and size
    const existingItem = cartItems.find((item) => {
      const itemProductId = item.productId?._id || item.productId;
      return (
        itemProductId === product._id &&
        item.color === (selectedColor || null) &&
        item.size === (selectedSize || null)
      );
    });

    if (existingItem) {
      setToast({
        type: "error",
        message: "This product with selected color and size is already in your cart",
        icon: <FaExclamationCircle />,
      });
      return;
    }

    setAddingToCart(true);

    try {
      await dispatch(addToCart({
        productId: product._id,
        quantity: 1,
        color: selectedColor || null,
        size: selectedSize || null,
      })).unwrap();
      
      dispatch(fetchCartItems());
      dispatch(fetchCartCount());
      
      setToast({
        type: "success",
        message: "Product added to cart successfully!",
        icon: <FaCheckCircle />,
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error || "Failed to add to cart",
        icon: <FaExclamationCircle />,
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewMessage.trim()) {
      setToast({ type: "error", message: "Please write a review message" });
      return;
    }

    const selectedProductData = userOrderedProducts.find(p => p._id === product._id);
    if (!selectedProductData) {
      setToast({ type: "error", message: "Unable to find order details" });
      return;
    }

    const reviewData = {
      productId: product._id,
      orderId: selectedProductData.orderId,
      message: reviewMessage,
      rating: reviewRating
    };

    const result = await dispatch(createProductReview(reviewData));
    if (createProductReview.fulfilled.match(result)) {
      setToast({ type: "success", message: "Review submitted successfully!" });
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewMessage("");
      refetch(); // Instantly reload product reviews/details in cache
    }
  };

  const handleAddToFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      setToast({
        type: "error",
        message: "Please login to add items to favorites",
        icon: <FaExclamationCircle />,
      });
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      if (isInFavorites) {
        // Remove from favorites
        await dispatch(deleteFavorite({ productId: product._id })).unwrap();
        dispatch(fetchFavorites()); // Refresh favorites list

        setToast({
          type: "success",
          message: "Product removed from favorites",
          icon: <FaCheckCircle />,
        });
      } else {
        // Add to favorites
        await dispatch(addToFavorites(product._id)).unwrap();
        dispatch(fetchFavorites()); // Refresh favorites list

        setToast({
          type: "success",
          message: "Product added to favorites successfully!",
          icon: <FaCheckCircle />,
        });
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error || "Failed to update favorites",
        icon: <FaExclamationCircle />,
      });
    }
  };

  return (
    <>
      <Navbar />
      <motion.div className="product-detail-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
        <style>{`
          .product-detail-page {
            min-height: 90vh;
            background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
            padding: 2rem 2vw 4vw 2vw;
            color: #fff;
          }
          .product-detail-container {
            max-width: 1200px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3rem;
            margin-bottom: 4rem;
          }
          .product-images-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .main-image-wrapper {
            width: 100%;
            aspect-ratio: 1;
            border-radius: 20px;
            overflow: hidden;
            background: rgba(255,255,255,0.08);
            box-shadow: 0 8px 32px #00eaff15;
            position: relative;
          }
          .main-image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: rgba(0,0,0,0.15);
          }
          .main-image-wrapper .optimized-image-wrapper {
            width: 100%;
            height: 100%;
          }
          .thumbnail-row {
            display: flex;
            gap: 1rem;
          }
          .thumbnail {
            width: 100px;
            height: 100px;
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            border: 3px solid transparent;
            transition: border-color 0.2s, transform 0.2s;
            background: rgba(0,0,0,0.15);
          }
          .thumbnail.active {
            border-color: #00eaff;
            transform: scale(1.05);
          }
          .thumbnail:hover {
            border-color: #00eaff66;
            transform: scale(1.03);
          }
          .thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .thumbnail .optimized-image-wrapper {
            width: 100%;
            height: 100%;
          }
          .product-info-section {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .product-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #00eaff;
            text-shadow: 0 2px 20px #00eaff33;
            margin-bottom: 0.2rem;
          }
          .product-seller {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #b8d4ff;
            font-size: 0.8rem;
            margin-bottom: 0.3rem;
          }
          .product-price-section {
            display: flex;
            align-items: baseline;
            gap: 1rem;
            margin: 0.4rem 0;
          }
          .current-price {
            font-size: 1.2rem;
            font-weight: 800;
            color: #fbbf24;
            text-shadow: 0 2px 12px #fbbf2444;
          }
          .original-price {
            font-size: 1.1rem;
            color: rgba(255,255,255,0.5);
            text-decoration: line-through;
          }
          .discount-badge {
            background: linear-gradient(135deg, #ef4444, #f97316);
            color: #fff;
            padding: 0.4rem 0.9rem;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.85rem;
          }
          .product-description {
            font-size: 0.75rem;
            line-height: 1.4;
            color: rgba(255,255,255,0.85);
            background: rgba(255,255,255,0.06);
            padding: 0.5rem;
            border-radius: 12px;
            border-left: 4px solid #00eaff;
          }
          .product-details-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
            margin: 0.6rem 0;
          }
          .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem;
            background: rgba(255,255,255,0.08);
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .detail-item-icon {
            font-size: 1.2rem;
            color: #00eaff;
          }
          .detail-item-content {
            display: flex;
            flex-direction: column;
          }
          .detail-label {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.6);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .detail-value {
            font-size: 0.95rem;
            font-weight: 600;
            color: #fff;
          }
          .size-color-selection {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin: 0.75rem 0;
            padding: 0.75rem;
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.1);
          }

          .selection-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .color-selection-section,
          .size-selection-section {
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.8rem;
          }

          .color-selection-section .selection-label,
          .size-selection-section .selection-label {
            flex-shrink: 0;
            min-width: 70px;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            font-weight: 600;
            color: #00eaff;
          }


          .selection-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            min-width: 80px;
            font-size: 0.85rem;
            font-weight: 600;
            color: #00eaff;
          }

          .selection-icon {
            font-size: 1.1rem;
            color: #00eaff;
          }

          .selection-options {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .size-selection-grid,
          .color-selection-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            align-items: center;
          }

          .individual-size-box,
          .individual-color-box {
            width: 70px;
            height: 50px;
            border-radius: 10px;
            background: rgba(255,255,255,0.08);
            border: 2px solid rgba(255,255,255,0.2);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: 0.25s;
            font-size: 0.85rem;
            font-weight: 500;
            text-align: center;
            line-height: 1.2;
          }

          .individual-size-box:hover,
          .individual-color-box:hover {
            border-color: #00eaff;
            transform: translateY(-2px);
          }

          .selected-box {
            border-color: #00eaff;
            background: rgba(0,234,255,0.2);
          }

          .individual-size-box:hover {
            background: rgba(255,255,255,0.15);
            border-color: rgba(255,255,255,0.4);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,234,255,0.2);
          }

          .size-name-large {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          /* Make color options display vertically */
          .color-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.8rem;
          }

          .option-chip {
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid transparent;
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.8);
          }

          .option-chip:hover {
            background: rgba(255,255,255,0.15);
            transform: translateY(-1px);
          }

          .option-chip.selected {
            background: rgba(0,234,255,0.2);
            border-color: #00eaff;
            color: #00eaff;
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0,234,255,0.3);
          }

          .size-option {
            min-width: 50px;
            text-align: center;
          }

          .color-option {
            min-width: 90px;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.3rem;
          }

          .sizes-colors {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            margin-top: 0.3rem;
          }
          .size-chip, .color-chip {
            padding: 0.4rem 0.8rem;
            background: rgba(0,234,255,0.15);
            border: 1px solid #00eaff44;
            border-radius: 8px;
            font-size: 0.8rem;
            color: #00eaff;
            transition: all 0.2s;
          }
          .size-chip.selected, .color-chip.selected {
            background: rgba(0,234,255,0.3);
            border: 2px solid #00eaff;
            transform: scale(1.05);
          }
          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .action-buttons {
            display: flex;
            justify-content: center;
            margin-top: 0.75rem;
          }

          /* Mobile single button styling */
          @media (max-width: 768px) {
            .action-buttons {
              width: 100% !important;
              display: flex !important;
              justify-content: center !important;
            }

            .btn-primary {
              width: 100% !important;
              min-width: 100% !important;
              max-width: 100% !important;
              padding: 0.6rem 0.8rem !important;
              font-size: 0.9rem !important;
              flex-shrink: 0 !important;
              margin: 0 !important;
              box-sizing: border-box !important;
            }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
          .btn-primary {
            flex: 1;
            padding: 0.6rem 1.2rem;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #f97316, #facc15);
            color: #1e293b;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
            width: auto; /* Explicitly set for desktop */
            min-width: 0; /* Allow flex shrinking on desktop */
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
          }
          .related-products-section {
            max-width: 1200px;
            margin: 4rem auto 0 auto;
            padding-top: 3rem;
            border-top: 2px solid rgba(255,255,255,0.1);

            /* Mobile: Full width */
            @media (max-width: 768px) {
              max-width: 100%;
              margin: 2rem 0 0 0;
              padding: 1.5rem 0.5rem 1rem 0.5rem;
              border-top: 1px solid rgba(255,255,255,0.1);
            }

            /* Mobile related grid: Full width with better spacing */
            @media (max-width: 768px) {
              .related-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 0.75rem;
                padding: 0 0.25rem;
              }

              .related-card {
                background: rgba(255,255,255,0.08);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid rgba(255,255,255,0.15);
                transition: all 0.3s ease;
                padding: 0.5rem;
              }

              .related-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(0,234,255,0.2);
              }
            }

            /* Tablet optimizations */
            @media (min-width: 769px) and (max-width: 1024px) {
              max-width: 100%;
              margin: 3rem 1rem 0 1rem;
              padding: 2rem 1rem 1rem 1rem;
            }
          }
          .related-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: #00eaff;
            margin-bottom: 2rem;
            text-align: center;
          }
          .related-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1.5rem;
          }
          .related-card {
            background: rgba(255,255,255,0.08);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.15);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
          }
          .related-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 28px #00eaff22;
          }
          .related-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
          }
          .related-card .optimized-image-wrapper {
            width: 100%;
            height: 200px;
          }
          .related-info {
            padding: 1rem;
          }
          .related-name {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.3rem;
            color: #fff;
          }
          .related-seller {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 0.5rem;
            font-style: italic;
          }
          .related-price {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fbbf24;
          }
          /* ================= ENHANCED MOBILE RESPONSIVENESS ================= */

          @media (max-width: 1200px) {
            .product-detail-container {
              max-width: 100%;
              padding: 0 2rem;
            }
          }

          @media (max-width: 900px) {
            .product-detail-container {
              grid-template-columns: 1fr;
              gap: 2rem;
              padding: 0 1rem;
            }

            .product-image-section {
              order: -1;
            }

            .product-title {
              font-size: 1.6rem;
              text-align: center;
            }

            .current-price {
              font-size: 2rem;
              text-align: center;
            }

            .product-details-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }

            .detail-item {
              text-align: center;
            }

            .quantity-section {
              justify-content: center;
            }

            .action-buttons {
              flex-direction: column;
              gap: 1rem;
            }

            .add-to-cart-btn,
            .buy-now-btn {
              width: 100%;
              padding: 1rem;
              font-size: 1.1rem;
            }
          }

          @media (max-width: 768px) {
            .product-detail-page {
              padding: 1rem 0;
            }

            .product-detail-container {
              padding: 0 0.75rem;
              gap: 1.5rem;
            }

            .action-buttons {
              flex-direction: column;
              gap: 0.75rem;
              width: 100%;
            }


            .product-images {
              gap: 0.5rem;
            }

            .main-image {
              height: 300px;
            }

            .thumbnail-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 0.5rem;
            }

            .thumbnail {
              height: 60px;
            }

            .product-info {
              padding: 1.5rem;
            }

            .product-title {
              font-size: 1.4rem;
            }

            .price-section {
              flex-direction: column;
              align-items: center;
              gap: 0.75rem;
            }

            .current-price {
              font-size: 1.8rem;
            }

            .original-price {
              font-size: 1.1rem;
            }

            .discount-badge {
              font-size: 0.9rem;
              padding: 0.25rem 0.75rem;
            }

            .rating-section {
              justify-content: center;
            }

            .quantity-controls {
              justify-content: center;
            }

            .quantity-btn {
              width: 40px;
              height: 40px;
              font-size: 1.2rem;
            }

            .quantity-input {
              width: 60px;
              height: 40px;
              font-size: 1.1rem;
            }
          }

          @media (max-width: 576px) {
            .product-detail-page {
              padding: 0.75rem 0;
            }

            .product-detail-container {
              padding: 0 0.5rem;
            }

            .product-images {
              flex-direction: column;
            }

            .main-image {
              height: 250px;
              width: 100%;
            }

            .thumbnail-grid {
              grid-template-columns: repeat(5, 1fr);
              gap: 0.25rem;
            }

            .thumbnail {
              height: 50px;
            }

            .product-info {
              padding: 1rem;
            }

            .product-title {
              font-size: 1.2rem;
              line-height: 1.4;
            }

            .current-price {
              font-size: 1.6rem;
            }

            .original-price {
              font-size: 1rem;
            }

            .product-description {
              font-size: 0.9rem;
              line-height: 1.6;
            }

            .specifications-list {
              font-size: 0.9rem;
            }

            .spec-item {
              padding: 0.5rem;
            }

            .related-products {
              padding: 1rem 0.5rem;
            }

            .related-title {
              font-size: 1.2rem;
              text-align: center;
              color: #00eaff;
              font-weight: 600;
              margin-bottom: 1rem;
              padding: 0 1rem;
            }

            .related-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }

            .related-card {
              padding: 0.75rem;
            }

            .related-image {
              height: 120px;
            }

            .related-title {
              font-size: 0.9rem;
            }

            .related-price {
              font-size: 1rem;
            }

            /* Size and Color Selection Mobile Styles */
            .size-color-selection {
              padding: 1rem !important;
              margin: 1rem 0 !important;
            }

            .selection-group {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: 0.5rem !important;
            }

            /* Override for color selection to keep it horizontal on mobile */
            @media (max-width: 576px) {
              .color-selection-group,
              .size-selection-group {
                flex-direction: row !important;
                flex-wrap: wrap !important;
                align-items: flex-start !important;
              }
            }

            .selection-label {
              min-width: auto !important;
              font-size: 0.9rem !important;
            }

            .selection-options {
              width: 100% !important;
              justify-content: flex-start !important;
              gap: 0.4rem !important;
            }

            .color-selection-section,
            .size-selection-section {
              display: flex !important;
              align-items: center !important;
              gap: 0.8rem !important;
              margin-bottom: 1rem !important;
            }

            .color-selection-section .selection-label,
            .size-selection-section .selection-label {
              flex-shrink: 0 !important;
              min-width: 70px !important;
              display: flex !important;
              align-items: center !important;
              gap: 0.3rem !important;
              font-weight: 600 !important;
              color: #00eaff !important;
            }


            .color-options {
              flex-direction: column !important;
              gap: 0.6rem !important;
            }

            .size-selection-grid,
            .color-selection-grid {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 0.5rem !important;
              align-items: center !important;
            }

            .individual-size-box,
            .individual-color-box {
              width: 70px !important;
              height: 50px !important;
              border-radius: 10px !important;
              background: rgba(255,255,255,0.08) !important;
              border: 2px solid rgba(255,255,255,0.2) !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              cursor: pointer !important;
              transition: 0.25s !important;
              font-size: 0.85rem !important;
              font-weight: 500 !important;
              text-align: center !important;
              line-height: 1.2 !important;
            }

            .individual-size-box:hover,
            .individual-color-box:hover {
              border-color: #00eaff !important;
              transform: translateY(-2px) !important;
            }

            .selected-box {
              border-color: #00eaff !important;
              background: rgba(0,234,255,0.2) !important;
            }


            .color-icon-large {
              font-size: 1.4rem !important;
              margin-bottom: 0.1rem !important;
            }

            .color-name-large,
            .size-name-large {
              font-size: 0.8rem !important;
              font-weight: 700 !important;
              text-transform: capitalize !important;
            }

            .selection-indicator-large {
              position: absolute !important;
              top: 8px !important;
              right: 8px !important;
              font-size: 1.2rem !important;
              font-weight: 900 !important;
              color: #00eaff !important;
            }

            .option-chip {
              flex: 0 0 auto !important;
              font-size: 0.8rem !important;
              padding: 0.4rem 0.8rem !important;
              min-width: 80px !important;
            }

            .color-option {
              gap: 0.2rem !important;
            }
          }

          @media (max-width: 480px) {
            .product-detail-container {
              padding: 0 0.25rem;
            }

            .main-image {
              height: 200px;
            }

            .thumbnail-grid {
              grid-template-columns: repeat(4, 1fr);
            }

            .product-info {
              padding: 0.875rem;
            }

            .product-title {
              font-size: 1.1rem;
            }

            .current-price {
              font-size: 1.4rem;
            }

            .related-grid {
              grid-template-columns: 1fr;
            }

            .quantity-btn {
              width: 36px;
              height: 36px;
              font-size: 1.1rem;
            }

            .quantity-input {
              width: 50px;
              height: 36px;
              font-size: 1rem;
            }
          }

          /* Touch-friendly elements */
          @media (hover: none) and (pointer: coarse) {
            .add-to-cart-btn,
            .buy-now-btn,
            .quantity-btn {
              min-height: 44px;
            }

            .thumbnail {
              min-height: 44px;
              min-width: 44px;
            }
          }
            .action-buttons {
              flex-direction: column;
              gap: 0.75rem;
            }
          }
        `}</style>

        {/* Review Section Styles */}
        <style>{`
          .review-section {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 1.5rem;
            margin-top: 1.5rem;
            backdrop-filter: blur(10px);
          }

          .review-header {
            text-align: center;
            margin-bottom: 1rem;
          }

          .review-header h3 {
            color: #00eaff;
            margin: 0 0 0.5rem 0;
            font-size: 1.4rem;
          }

          .review-header p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0;
            font-size: 0.9rem;
          }

          .btn-review {
            background: linear-gradient(135deg, #f97316, #facc15);
            color: #1f2937;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0 auto;
            transition: all 0.3s ease;
          }

          .btn-review:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(249, 115, 22, 0.3);
          }

          .review-form {
            margin-top: 1rem;
          }

          .rating-input, .message-input {
            margin-bottom: 1rem;
          }

          .rating-input label, .message-input label {
            display: block;
            color: #e5e7eb;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }

          .stars {
            display: flex;
            gap: 0.5rem;
          }

          .star {
            font-size: 1.5rem;
            color: #6b7280;
            cursor: pointer;
            transition: color 0.2s;
          }

          .star.active {
            color: #f97316;
          }

          .message-input textarea {
            width: 100%;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 0.8rem;
            color: #fff;
            font-family: inherit;
            resize: vertical;
          }

          .message-input textarea:focus {
            outline: none;
            border-color: #00eaff;
            box-shadow: 0 0 0 2px rgba(0, 234, 255, 0.2);
          }

          .message-input small {
            display: block;
            margin-top: 0.25rem;
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.8rem;
          }

          .error-message {
            color: #fca5a5;
            font-size: 0.9rem;
            margin-bottom: 1rem;
            padding: 0.5rem;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 6px;
          }

          .review-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
          }

          .btn-submit-review, .btn-cancel-review {
            padding: 0.7rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-submit-review {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            border: none;
          }

          .btn-submit-review:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3);
          }

          .btn-submit-review:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .btn-cancel-review {
            background: transparent;
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: #e5e7eb;
          }

          .btn-cancel-review:hover {
            border-color: #e5e7eb;
            background: rgba(255, 255, 255, 0.1);
          }

          @media (max-width: 768px) {
            .review-actions {
              flex-direction: column;
            }

            .btn-submit-review, .btn-cancel-review {
              width: 100%;
            }
          }
        `}</style>

        <div className="product-detail-container">
          <motion.div className="product-images-section" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <div className="main-image-wrapper">
              <OptimizedImage src={mainImage} alt={product.pname} />
            </div>
            {images.length >= 1 && (
              <div className="thumbnail-row">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`thumbnail ${selectedImage === idx ? "active" : ""}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <OptimizedImage src={img} alt={`${product.pname} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
          <motion.div className="product-info-section" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h1 className="product-title">{product.pname}</h1>
            <div className="product-seller">
              <FaUser color="#00eaff" />
              <span>Sold by: <strong>{sellerName}</strong></span>
            </div>
            <div className="product-price-section">
              <span className="current-price">PKR {product.prodisprice || product.pprice}</span>
              {product.pactualprice && product.pactualprice > product.pprice && (
                <span className="original-price">PKR {product.pactualprice}</span>
              )}
              {product.pdis && product.pdis > 0 && (
                <span className="discount-badge">{product.pdis}% OFF</span>
              )}
            </div>
            <div className="product-description">
              <strong>Description:</strong>
              <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>{product.pdescription}</p>
            </div>
            <div className="product-details-grid">
              <div className="detail-item">
                <FaTag className="detail-item-icon" />
                <div className="detail-item-content">
                  <span className="detail-label">Category</span>
                  <span className="detail-value">{categoryName}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaLayerGroup className="detail-item-icon" />
                <div className="detail-item-content">
                  <span className="detail-label">Subcategory</span>
                  <span className="detail-value">{subcategoryName}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaBox className="detail-item-icon" />
                <div className="detail-item-content">
                  <span className="detail-label">Quantity Available</span>
                  <span className="detail-value">{product.totalStock} units</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className="detail-value" style={{ color: product.pstatus === "active" ? "#16e0a0" : "#ff5f7a" }}>
                  {product.pstatus || "N/A"}
                </span>
              </div>
            </div>

           {/* Size and Color Selection Section */}
{(sizes.length > 0 || colors.length > 0) && (
  <div className="size-color-selection">
    {sizes.length > 0 && (
      <div className="size-selection-section">
        <div className="selection-label">
          <FaBox className="selection-icon" />
          <span>Size:</span>
        </div>
        <div className="size-selection-grid">
          {sizes.map((size, idx) => {
            const isSelected = selectedSize === size;

            return (
              <div
                key={idx}
                className="individual-size-box"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof size === 'string') {
                    setSelectedSize(size);
                  }
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,234,255,0.25), rgba(0,234,255,0.15))'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: isSelected ? '#00eaff' : 'rgba(255,255,255,0.2)',
                  color: isSelected ? '#00eaff' : 'rgba(255,255,255,0.9)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 6px 20px rgba(0,234,255,0.4)' : 'none'
                }}
              >
                <div className="size-name-large">
                  {size}
                </div>
                {isSelected && (
                  <div className="selection-indicator-large">✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    {colors.length > 0 && (
      <div className="color-selection-section">
        <div className="selection-label">
          <FaPalette className="selection-icon" />
          <span>Color:</span>
        </div>
        <div className="color-selection-grid">
          {colors.map((color, idx) => {
            const getColorIcon = (colorName) => {
              const lowerColor = colorName.toLowerCase();
              if (lowerColor.includes('black')) return '⚫';
              if (lowerColor.includes('white')) return '⚪';
              if (lowerColor.includes('red')) return '🔴';
              if (lowerColor.includes('blue')) return '🔵';
              if (lowerColor.includes('green')) return '🟢';
              if (lowerColor.includes('yellow')) return '🟡';
              if (lowerColor.includes('purple') || lowerColor.includes('violet')) return '🟣';
              if (lowerColor.includes('orange')) return '🟠';
              if (lowerColor.includes('pink')) return '🩷';
              if (lowerColor.includes('brown')) return '🤎';
              if (lowerColor.includes('gray') || lowerColor.includes('grey')) return '⚪';
              return '🎨';
            };

            const isSelected = selectedColor === color;

            return (
              <div
                key={idx}
                className="individual-color-box"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (typeof color === 'string') {
                    setSelectedColor(color);
                  }
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(0,234,255,0.25), rgba(0,234,255,0.15))'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: isSelected ? '#00eaff' : 'rgba(255,255,255,0.2)',
                  color: isSelected ? '#00eaff' : 'rgba(255,255,255,0.9)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 6px 20px rgba(0,234,255,0.4)' : 'none'
                }}
              >
                <div className="color-icon-large">
                  {getColorIcon(color)}
                </div>
                <div className="color-name-large">
                  {color}
                </div>
                {isSelected && (
                  <div className="selection-indicator-large">✓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

    <div className="selected-combined" style={{ marginTop: '10px', fontWeight: '500' }}>
      Selected: {
        (() => {
          // Ensure we only show string values, not arrays
          const color = typeof selectedColor === 'string' ? selectedColor : null;
          const size = typeof selectedSize === 'string' ? selectedSize : null;

          if (color && size) {
            return `${color}, ${size}`;
          } else if (color) {
            return color;
          } else if (size) {
            return size;
          } else {
            return '-';
          }
        })()
      }
    </div>
  </div>
)}


            {localStorage.getItem("loginType") !== "seller" && (
              <div className="action-buttons">
                <motion.button
                  className="btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  disabled={addingToCart || addCartLoading || product.pstatus !== "active" || product.totalStock < 1}
                >
                  {addingToCart || addCartLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Adding...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart /> Add to Cart
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Review Section - Only show if user has purchased this product */}
        {hasPurchasedProduct && (
          <motion.div className="review-section" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <div className="review-header">
              <h3>Write a Review</h3>
              <p>Share your experience with this product</p>
            </div>

            {!showReviewForm ? (
              <button
                className="btn-review"
                onClick={() => setShowReviewForm(true)}
              >
                <FaStar /> Write Review
              </button>
            ) : (
              <div className="review-form">
                <div className="rating-input">
                  <label>Rating:</label>
                  <div className="stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`star ${star <= reviewRating ? 'active' : ''}`}
                        onClick={() => setReviewRating(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="message-input">
                  <label>Your Review:</label>
                  <textarea
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Tell others about your experience..."
                    rows={4}
                    maxLength={500}
                  />
                  <small>{reviewMessage.length}/500 characters</small>
                </div>

                {createProductReviewError && (
                  <div className="error-message">{createProductReviewError}</div>
                )}

                <div className="review-actions">
                  <button
                    className="btn-submit-review"
                    onClick={handleSubmitReview}
                    disabled={creatingProductReview || !reviewMessage.trim()}
                  >
                    {creatingProductReview ? "Submitting..." : "Submit Review"}
                  </button>
                  <button
                    className="btn-cancel-review"
                    onClick={() => {
                      setShowReviewForm(false);
                      setReviewRating(5);
                      setReviewMessage("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

{relatedProducts.length > 0 && (
          <motion.div className="related-products-section" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="related-title">More from {sellerName}</h2>
            <div className="related-grid">
              <AnimatePresence>
                {relatedProducts.map((rel) => (
                  <motion.div
                    key={rel._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Link to={`/product/${rel._id}`} className="related-card">
                      <OptimizedImage src={rel.pimage1 || "https://via.placeholder.com/220?text=No+Image"} alt={rel.pname} className="related-image" />
                      <div className="related-info">
                        <div className="related-name">{rel.pname}</div>
                        <div className="related-seller">by {rel.sellerid?.sname || rel.sellerid?.name || rel.sellerid || "Unknown Seller"}</div>
                        <div className="related-price">PKR {rel.prodisprice || rel.pprice}</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </motion.div>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`cart-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            style={{
              position: "fixed",
              bottom: "2rem",
              right: "2rem",
              background: toast.type === "success" ? "linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95))" : "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95))",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              zIndex: 10000,
              minWidth: "280px",
              maxWidth: "350px",
              border: `2px solid ${toast.type === "success" ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)"}`,
            }}
          >
            <div style={{ fontSize: "1.3rem", display: "flex", alignItems: "center" }}>{toast.icon}</div>
            <div style={{ fontSize: "0.95rem", fontWeight: "600", flex: 1 }}>{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />

    </>
  );
}

export default ProductDetail;

