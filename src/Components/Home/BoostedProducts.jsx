import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaHeart, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { fetchFeaturedProducts, selectFeaturedProducts, selectFeaturedLoading } from "../../Features/Backend/ProductSlice";
import { fetchActiveBoosts, selectActiveBoosts } from "../../Features/Backend/ProductBoostSlice";
import { addToFavorites, fetchFavorites, deleteFavorite, selectFavorites, selectAddFavoriteLoading } from "../../Features/Backend/FavoriteSlice";
import { selectUser } from "../../Features/Backend/UserSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";

const BoostedProducts = () => {
  const dispatch = useDispatch();
  const featured = useSelector(selectFeaturedProducts) || [];
  const activeBoosts = useSelector(selectActiveBoosts) || [];
  const loading = useSelector(selectFeaturedLoading);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);

  // Favorite functionality (same as ProductCarousel)
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const favorites = useSelector(selectFavorites) || [];
  const [processingIds, setProcessingIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchActiveBoosts());
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Combine admin-controlled featured products with active boosted products from sellers
  const displayedProducts = useMemo(() => {
    // Extract products from active boosts
    const boostedProducts = activeBoosts.reduce((acc, boost) => {
      if (boost.productIds && Array.isArray(boost.productIds)) {
        return [...acc, ...boost.productIds];
      }
      return acc;
    }, []);

    // Merge and remove duplicates (by _id)
    const combined = [...featured, ...boostedProducts];
    const unique = [];
    const seenIds = new Set();

    combined.forEach(p => {
      if (p && p._id && !seenIds.has(p._id)) {
        unique.push(p);
        seenIds.add(p._id);
      }
    });

    return unique;
  }, [featured, activeBoosts]);




  return (
    <>
      <section className="section" style={{ background: "rgba(30, 32, 39, 0.35)" }}>
        <div className="boosted-header">
          <h2>Featured Products</h2>
          <span className="boosted-sub">Popular products from our sellers</span>
        </div>

      {loading ? (
        <div className="boosted-empty">Loading featured products...</div>
      ) : displayedProducts.length === 0 ? (
        <div className="boosted-empty">
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
          <div>Featured products will appear here soon!</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>
            Curated top-quality items approved by admins.
          </div>
        </div>
      ) : (
        <div className="boosted-products-grid">
            {displayedProducts.map((product, idx) => {
              const productId = product._id || product.id || `boost-${idx}`;
              const name = product.pname || product.name || "Product";
              const discountPrice = product.prodisprice || product.pprice || product.price || 0;
              const originalPrice = product.pprice || product.pactualprice || product.price || 0;
              const hasDiscount = discountPrice < originalPrice && originalPrice > 0;
              const image = product.pimage1 || product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300";
              const sold = product.totalSold || product.soldCount || product.salesCount || product.ordersCount;
              const views = product.views || 0;
              const reviews = product.reviewCount || (Array.isArray(product.reviews) ? product.reviews.length : null);

              return (
                <Link to={`/product/${productId}`} key={productId} className="boost-card">
                  <div className="boost-img">
                    <img src={image} alt={name} loading="lazy" />
                    <div className="pill-stack">
                      <span className="pill pill-views">👁️ {views}</span>
                      <span className="pill pill-sold">🛒 {sold || 0}</span>
                    </div>
                  </div>
                  <div className="boost-body">
                    <div className="boost-name" title={name}>{name}</div>
                    <div className="boost-price">
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
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      )}

      <style>{`
        .boosted-section {
          width: 100%;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, rgba(32, 40, 62, 0.75), rgba(18, 26, 38, 0.85));
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          overflow-x: hidden;
        }
        .boosted-header {
          display: flex;
          align-items: baseline;
          justify-content: flex-start;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .boosted-header h2 {
          margin: 0;
          color: #e7f7ff;
          letter-spacing: 0.4px;
        }
        .boosted-sub {
          margin: 4px 0 0;
          color: rgba(231, 247, 255, 0.8);
          font-size: 0.95rem;
        }
        .boosted-empty {
          padding: 1.2rem;
          color: rgba(255, 255, 255, 0.72);
          text-align: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
        }
        .boosted-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
          width: 100%;
        }
        .boosted-track::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .boosted-track {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        .boost-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 0.75rem;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          height: 100%;
          min-height: 320px;
        }
        .boost-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
        }
        .boost-img {
          position: relative;
          width: 100%;
          height: 140px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }
        .pill-stack {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pill {
          background: rgba(0, 0, 0, 0.8);
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          line-height: 1.1;
        }
        .boost-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .boost-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .boost-name {
          font-size: 0.98rem;
          font-weight: 700;
          color: #e7f7ff;
          line-height: 1.25;
          min-height: 2.4rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .boost-price {
          font-weight: 800;
          font-size: 1rem;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .original-price {
          color: #94a3b8;
          text-decoration: line-through;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .discount-price {
          color: #f59e0b;
          font-weight: 800;
          font-size: 1rem;
        }
        @media (max-width: 640px) {
          .boosted-section {
            width: 100%;
            max-width: 100vw;
            padding: 1.4rem 1rem;
            overflow-x: hidden;
          }
          .boosted-header {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 1.5rem;
          }
          .boosted-header h2 {
            font-size: 1.5rem;
          }
          .boosted-sub {
            margin-top: 0.3rem;
          }
          .boosted-products-grid {
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 0.8rem;
          }
          .boost-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          }
          .boost-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
          }
          .boost-img {
            height: 140px;
          }
        }
      `}</style>
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
};

export default BoostedProducts;