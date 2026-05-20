import React, { useEffect, useState, useRef, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaHeart, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { fetchHomeFlashDeals, selectHomeFlashDeals, selectFlashDealLoading } from "../../Features/Backend/FlashDealSlice";
import { addToFavorites, deleteFavorite, fetchFavorites, selectFavorites, selectAddFavoriteLoading } from "../../Features/Backend/FavoriteSlice";
import { selectUser } from "../../Features/Backend/UserSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import OptimizedImage from "../OptimizedImage";

const FlashDeals = memo(() => {
  const dispatch = useDispatch();
  const dealsBySeller = useSelector(selectHomeFlashDeals) || [];
  const loading = useSelector(selectFlashDealLoading);
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const favorites = useSelector(selectFavorites) || [];
  const [processingIds, setProcessingIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Scroll function for navigation arrows (memoized)
  const scroll = useCallback((direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  // Check if product is in favorites
  const isFavorite = (productId) => {
    return favorites.some(
      (fav) => (fav.productId?._id || fav.productId) === productId
    );
  };

  // Handle favorite toggle (memoized)
  const handleFavoriteClick = useCallback(async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user && !seller && !localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }

    if (processingIds.has(productId)) return;

    setProcessingIds((prev) => new Set(prev).add(productId));

    try {
      if (isFavorite(productId)) {
        const favorite = favorites.find(
          (fav) => (fav.productId?._id || fav.productId) === productId
        );
        if (favorite) {
          await dispatch(deleteFavorite({ favoriteId: favorite._id, productId })).unwrap();
          setToast({
            type: "success",
            message: "Removed from favorites",
            icon: <FaHeart />
          });
        }
      } else {
        await dispatch(addToFavorites(productId)).unwrap();
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
  }, [user, seller, favorites, processingIds, dispatch]);

  // Fetch flash deals only if not already loaded
  useEffect(() => {
    if (!dealsBySeller || dealsBySeller.length === 0) {
      dispatch(fetchHomeFlashDeals());
    }
  }, [dispatch, dealsBySeller?.length]);


  return (
    <section className="section flash-section">
      <div className="section-header">
        <h2>Flash Deals</h2>
      </div>
      {loading && <p>Loading deals...</p>}
      {!loading && dealsBySeller.length === 0 && <p>No flash deals!</p>}
      <div className="carousel-wrapper">
        <button className="arrow-btn left" onClick={() => scroll("left")}>
          ←
        </button>
        <div className="card-row scroll-x" ref={scrollRef}>
          {dealsBySeller.map(({ seller, deals }) =>
            deals
              .filter(fd => fd.productId?.pstatus === "active") // Only show active products
              .map(fd => {
              const productId = fd.productId?._id || fd.productId || fd._id;
              const favorite = isFavorite(productId);
              const isProcessing = processingIds.has(productId);
              
              return (
                <div key={fd._id} className="product-card-wrapper">
                  <Link to={`/product/${productId}`} className="product-card flash" style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="product-image">
                      <OptimizedImage src={fd.productId?.pimage1 || fd.productId?.pimage || "https://via.placeholder.com/180"} alt={fd.productId?.pname || "Product"} />
                      <button
                        className={`favorite-btn ${favorite ? "active" : ""} ${isProcessing ? "processing" : ""}`}
                        onClick={(e) => handleFavoriteClick(e, productId)}
                        disabled={isProcessing}
                        title={favorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FaHeart />
                      </button>
                    </div>
                    <div className="product-body">
                      <h4>{fd.productId?.pname || "Product"}</h4>
                      <p className="price">
                        PKR {fd.productId?.pprice}
                        <span className="old">PKR {fd.productId?.pactualprice}</span>
                      </p>
                      <p className="tag">
                        {seller?.sname ? `by ${seller.sname}` : ""} {fd.status === "approved" ? "Deal Live!" : fd.status}
                      </p>
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
      <style>{`
        .section {
          width: 100%;
          padding: 2rem;
          background: rgba(30, 32, 39, 0.4);
        }
        .section-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 0.9rem;
        }
        .section-header h2 {
          margin: 0;
          font-size: 1.35rem;
          color: #ffffff;
        }
        .carousel-wrapper {
          position: relative;
          padding: 0 60px;
        }
        .card-row {
          display: flex;
          gap: 0.9rem;
          overflow-x: auto;
          padding: 0 0.5rem 0.4rem 0.5rem;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .card-row::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .product-card-wrapper {
          position: relative;
        }
        .product-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          min-width: 210px;
          max-width: 220px;
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
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
        }
        .product-image {
          height: 140px;
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
          padding: 0.8rem 0.85rem;
        }
        .product-body h4 {
          margin: 0 0 0.2rem 0;
          font-size: 0.92rem;
          color: #ffffff;
          font-weight: 600;
        }
        .price {
          margin: 0.1rem 0;
          font-size: 0.95rem;
          color: #f59e0b;
          font-weight: 700;
        }
        .price .old {
          font-size: 0.75rem;
          color: #94a3b8;
          text-decoration: line-through;
          margin-left: 0.4rem;
          font-weight: 400;
        }
        .tag {
          font-size: 0.75rem;
          color: #ef4444;
          font-weight: 600;
          margin-top: 0.2rem;
        }
        @media (max-width: 480px) {
          .section {
            padding-inline: 1rem;
          }
          .section-header {
            text-align: center;
            justify-content: center;
            margin-bottom: 1.5rem;
          }
          .section-header h2 {
            font-size: 1.5rem;
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
          .flash-section {
            padding: 1.5rem 0.5rem;
            overflow-x: hidden;
          }

          .carousel-wrapper {
            overflow-x: hidden;
          }

          .card-row {
            overflow-x: auto;
            scroll-behavior: smooth;
          }

          .favorite-toast {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            min-width: auto;
            max-width: none;
          }
        }

        /* Arrow Navigation */
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

        @media (max-width: 768px) {
          .arrow-btn {
            display: none; /* Hide arrows on mobile */
          }
          .carousel-wrapper {
            padding: 0;
          }
        }
      `}</style>
      
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
    </section>
  );
});

export default FlashDeals;
