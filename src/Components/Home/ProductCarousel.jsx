import React, { useRef, useState, useEffect, memo, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { addToFavorites, deleteFavorite, fetchFavorites, selectFavorites, selectAddFavoriteLoading } from "../../Features/Backend/FavoriteSlice";
import { selectUser } from "../../Features/Backend/UserSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import OptimizedImage from "../OptimizedImage";

const ProductCarousel = memo(({ title, subtitle, products, bgColor = "rgba(30, 32, 39, 0.3)", isLoading = false }) => {
  const scrollRef = useRef(null);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const favorites = useSelector(selectFavorites) || [];
  const addLoading = useSelector(selectAddFavoriteLoading);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  // Fetch favorites when user or seller is logged in
  useEffect(() => {
    if (user || seller || localStorage.getItem("token")) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, user, seller]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check if product is in favorites
  const isFavorite = (productId) => {
    return favorites.some(
      (fav) => (fav.productId?._id || fav.productId) === productId
    );
  };

  // Handle favorite toggle
  const handleFavoriteClick = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user && !seller && !localStorage.getItem("token")) {
      // Redirect to login if not logged in
      window.location.href = "/login";
      return;
    }

    if (processingIds.has(productId)) return;

    // Check if already favorite and show message
    if (isFavorite(productId)) {
      setToast({
        type: "info",
        message: "Already in favorites! Click again to remove.",
        icon: <FaCheckCircle />
      });
      // Still allow removal
    }

    setProcessingIds((prev) => new Set(prev).add(productId));

    try {
      if (isFavorite(productId)) {
        // Remove from favorites
        const favorite = favorites.find(
          (fav) => (fav.productId?._id || fav.productId) === productId
        );
        if (favorite) {
          const result = await dispatch(deleteFavorite({ favoriteId: favorite._id })).unwrap();
          // Refetch favorites after deletion
          dispatch(fetchFavorites());
          setToast({
            type: "success",
            message: "Removed from favorites",
            icon: <FaHeart />
          });
        }
      } else {
        // Add to favorites
      const result = await dispatch(addToFavorites(productId)).unwrap();
      // Refetch favorites to update UI
        dispatch(fetchFavorites());
        setToast({
          type: "success",
          message: "Added to favorites!",
          icon: <FaCheckCircle />
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToast({
        type: "error",
        message: error || "Failed to update favorite. Please try again.",
        icon: <FaHeart />
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const productImages = [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200",
  ];

  return (
    <>
      <section className="section" style={{ background: bgColor }}>
        <div className="section-header">
          <h2>{title}</h2>
          {subtitle && <span className="section-sub">{subtitle}</span>}
        </div>
        <div className="carousel-wrapper">
          <button className="arrow-btn left" onClick={() => scroll("left")}>
            ←
          </button>
          <div className="card-row scroll-x" ref={scrollRef}>
            {isLoading ? (
              [...Array(5)].map((_, idx) => (
                <div key={`skeleton-${idx}`} className="product-card-wrapper">
                  <div className="product-card skeleton-card">
                    <div className="product-image skeleton-image-wrapper">
                       <div className="skeleton-pulse" style={{ width: '100%', height: '100%' }}></div>
                    </div>
                    <div className="product-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeleton-pulse skeleton-title"></div>
                      <div className="skeleton-pulse skeleton-seller"></div>
                      <div className="skeleton-pulse skeleton-price"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div style={{ padding: "2rem", color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                No products available
              </div>
            ) : (
              products
                .filter(product => product.pstatus === "active") // Only show active products
                .map((product, idx) => {
                const productId = product._id || product.id || `temp-${idx}`;
                // Use backend field names: pname, prodisprice (or pprice), pimage1
                const productName = product.pname || product.name || "Product";
                const discountPrice = product.prodisprice || product.pprice || product.price || 0;
                const originalPrice = product.pprice || product.pactualprice || product.price || 0;
                const hasDiscount = discountPrice < originalPrice && originalPrice > 0;
                const productImage = product.pimage1 || product.image || productImages[idx % productImages.length];
                const sellerName = product.sellerid?.sname || product.sellerid?.name || product.sellerid || "Unknown Seller";
                const favorite = isFavorite(productId);
                const isProcessing = processingIds.has(productId);
                const views = product.views || 0;
                const sold = product.totalSold || product.soldCount || product.salesCount || product.ordersCount || 0;
                
                return (
                  <div key={productId} className="product-card-wrapper">
                    <Link to={`/product/${productId}`} className="product-card" style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="product-image">
                        <OptimizedImage
                          src={productImage}
                          alt={productName}
                          onError={(e) => {
                            e.target.src = productImages[idx % productImages.length];
                          }}
                        />
                        <div className="pill-stack">
                          <span className="pill pill-views">👁️ {views}</span>
                          <span className="pill pill-sold">🛒 {sold}</span>
                        </div>
                        {(user || seller || localStorage.getItem("token")) && (
                          <button
                            className={`favorite-btn ${favorite ? "active" : ""} ${isProcessing ? "processing" : ""}`}
                            onClick={(e) => handleFavoriteClick(e, productId)}
                            disabled={isProcessing}
                            title={favorite ? "Remove from favorites" : "Add to favorites"}
                          >
                            <FaHeart />
                          </button>
                        )}
                      </div>
                      <div className="product-body">
                        <h4>{productName}</h4>
                        <p className="seller-name">by {sellerName}</p>
                        <p className="price">
                          {hasDiscount ? (
                            <>
                              <span className="original-price">PKR {Number(originalPrice).toLocaleString('en-PK')}</span>
                              <span className="discount-price">PKR {Number(discountPrice).toLocaleString('en-PK')}</span>
                            </>
                          ) : (
                            <>
                              <span className="original-price" style={{ visibility: 'hidden' }}>PKR 0.00</span>
                              <span className="discount-price">PKR {Number(discountPrice).toLocaleString('en-PK')}</span>
                            </>
                          )}
                        </p>
                        {product.tag && <p className="tag">{product.tag}</p>}
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
          <button className="arrow-btn right" onClick={() => scroll("right")}>
            →
          </button>
        </div>
      </section>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`favorite-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="toast-icon">{toast.icon}</div>
            <div className="toast-message">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        /* Skeleton Pulse Animation */
        .skeleton-card {
          pointer-events: none;
        }
        .skeleton-pulse {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-image-wrapper {
          background: rgba(255, 255, 255, 0.03);
          width: 100%;
          height: 120px;
        }
        .skeleton-title {
          height: 16px;
          width: 80%;
          border-radius: 4px;
          margin-bottom: 4px;
        }
        .skeleton-seller {
          height: 12px;
          width: 50%;
          border-radius: 4px;
          margin-bottom: 8px;
        }
        .skeleton-price {
          height: 16px;
          width: 60%;
          border-radius: 4px;
          margin-top: auto;
        }

        .section {
          width: 100%;
          padding: 2rem;
        }
        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: flex-start;
          gap: 1rem;
          margin-bottom: 0.9rem;
        }
        .section-header h2 {
          margin: 0;
          font-size: 1.35rem;
          color: #ffffff;
        }
        .section-sub {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .carousel-wrapper {
          position: relative;
          padding: 0 60px;
        }
        .arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          font-size: 1.2rem;
          cursor: pointer;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          color: #1e293b;
        }
        .arrow-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .arrow-btn.left {
          left: 10px;
        }
        .arrow-btn.right {
          right: 10px;
        }
        .card-row {
          display: flex;
          gap: 0.9rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 0 0.5rem 0.4rem 0.5rem;
        }
        .card-row::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .card-row {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .product-card-wrapper {
          position: relative;
        }
        .product-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          min-width: 190px;
          max-width: 220px;
          min-height: 280px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 234, 255, 0.3);
        }
        .product-image {
          height: 120px;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
        }
        .favorite-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          transition: all 0.3s;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        .pill-stack {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pill {
          background: rgba(0, 0, 0, 0.68);
          color: #e7f7ff;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          line-height: 1.1;
        }
        .favorite-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }
        .favorite-btn.active {
          background: #ef4444;
          color: white;
        }
        .favorite-btn.processing {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .product-image .optimized-image-wrapper {
          width: 100%;
          height: 100%;
        }
        .product-body {
          padding: 0.7rem 0.75rem 0.8rem 0.75rem;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .product-body h4 {
          margin: 0 0 0.15rem 0;
          font-size: 0.92rem;
          color: #ffffff;
          font-weight: 600;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
          min-height: 2.6rem;
        }
        .seller-name {
          margin: 0.1rem 0;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }
        .price {
          margin: 0.1rem 0;
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .original-price {
          color: #94a3b8;
          text-decoration: line-through;
          font-size: 0.8rem;
          font-weight: 500;
        }
        .discount-price {
          color: #fbbf24;
          font-weight: 700;
          font-size: 0.9rem;
        }
          font-weight: 700;
        }
        .tag {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.7);
        }
        @media (max-width: 768px) {
          .section {
            padding-inline: 1rem;
          }
          .section-header {
            text-align: center;
            justify-content: center;
            flex-direction: column;
            gap: 0.3rem;
            margin-bottom: 1.5rem;
          }
          .section-header h2 {
            font-size: 1.5rem;
          }
          .section-sub {
            font-size: 0.85rem;
          }
          .arrow-btn {
            display: none;
          }
          .carousel-wrapper {
            padding: 0;
          }
        }
        .favorite-toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          z-index: 10000;
          min-width: 280px;
          max-width: 350px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .favorite-toast.success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95));
          color: white;
          border-color: rgba(34, 197, 94, 0.5);
        }
        .favorite-toast.info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
          color: white;
          border-color: rgba(59, 130, 246, 0.5);
        }
        .favorite-toast.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
          color: white;
          border-color: rgba(239, 68, 68, 0.5);
        }
        .toast-icon {
          font-size: 1.3rem;
          display: flex;
          align-items: center;
        }
        .toast-message {
          font-size: 0.95rem;
          font-weight: 600;
          flex: 1;
        }
        @media (max-width: 768px) {
          .favorite-toast {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            min-width: auto;
            max-width: none;
          }
        }
      `}</style>
    </>
  );
});

ProductCarousel.displayName = 'ProductCarousel';

export default ProductCarousel;
