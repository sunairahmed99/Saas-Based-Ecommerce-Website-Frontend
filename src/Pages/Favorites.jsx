import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Components/Navbar";
import HeroBanner from "../Components/Home/HeroBanner";
import Footer from "../Components/Home/Footer";
import { FaHeart, FaTrash, FaShoppingBag, FaExclamationCircle } from "react-icons/fa";
import {
  fetchFavorites,
} from "../Features/Backend/FavoriteSlice";
import { selectUser } from "../Features/Backend/UserSlice";
import { selectSeller } from "../Features/Backend/SellerSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../config";

const Favorites = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");
  const loginType = localStorage.getItem("loginType");

  const [deletingId, setDeletingId] = useState(null);

  const { data: favorites = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['favorites', token],
    queryFn: async () => {
      if (!token || loginType === 'seller') return [];
      const res = await axios.get(`${API_BASE_URL}/favorite/getall`, {
        headers: { auth_token: token }
      });
      return res.data?.data || [];
    },
    enabled: !!token && loginType !== 'seller',
    staleTime: 5 * 60 * 1000,
  });

  const deleteFavoriteMutation = useMutation({
    mutationFn: async ({ favoriteId, productId }) => {
      const headers = { auth_token: token };
      if (favoriteId) {
        await axios.delete(`${API_BASE_URL}/favorite/delete/${favoriteId}`, { headers });
      } else {
        await axios.delete(`${API_BASE_URL}/favorite/remove`, {
          data: { productId },
          headers
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', token] });
      dispatch(fetchFavorites()); // Sync Redux count for Navbar
    },
    onError: (err) => {
      console.error("Error deleting favorite:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to remove favorite. Please try again.");
    }
  });

  const error = queryError?.response?.data?.message || queryError?.message || null;
  const deleteLoading = deleteFavoriteMutation.isPending;

  // Check if user or seller is logged in
  useEffect(() => {
    if (!token && !user && !seller) {
      navigate("/login");
    }
  }, [user, seller, navigate, token]);

  const handleDelete = (favoriteId, productId) => {
    setDeletingId(favoriteId);
    deleteFavoriteMutation.mutate({ favoriteId, productId }, {
      onSettled: () => setDeletingId(null)
    });
  };

  const getProductData = (favorite) => {
    const product = favorite.productId || {};
    return {
      id: favorite._id,
      productId: product._id || product,
      name: product.pname || product.name || "Unknown Product",
      price: product.prodisprice || product.pprice || product.price || 0,
      originalPrice: product.pactualprice || product.pprice || product.originalPrice || 0,
      image: product.pimage1 || product.image || "https://via.placeholder.com/400?text=No+Image",
      category: product.catid?.name || product.catid?.cname || product.category || "Uncategorized",
      discount: product.pdis || product.discount || 0,
      rating: product.rating || 0,
      reviews: product.reviewCount || 0,
      inStock: product.pqty > 0 && product.pstatus === "active",
    };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: -100,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      <Navbar />
      <div className="favorites-page">
        <motion.div
          className="favorites-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Content */}
          {loading ? (
            <motion.div
              className="loading-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="loading-spinner"></div>
              <p>Loading your favorites...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              className="error-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <FaExclamationCircle />
              <h3>Error loading favorites</h3>
              <p>{error}</p>
              <button onClick={() => dispatch(fetchFavorites())}>Try Again</button>
            </motion.div>
          ) : favorites.length === 0 ? (
            <motion.div
              className="empty-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <motion.div
                className="empty-icon"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <FaHeart />
              </motion.div>
              <h2>No favorites yet</h2>
              <p>Start adding products to your favorites list!</p>
              <Link to="/shop">
                <button className="shop-button">
                  <FaShoppingBag /> Browse Products
                </button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              className="favorites-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {favorites
                  .filter(favorite => {
                    const product = favorite.productId || {};
                    return product.pstatus === "active";
                  })
                  .map((favorite) => {
                  const product = getProductData(favorite);
                  const isDeleting = deletingId === favorite._id;

                  return (
                    <motion.div
                      key={favorite._id}
                      className="favorite-card"
                      variants={itemVariants}
                      exit="exit"
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="card-image-wrapper">
                        <Link to={`/product/${product.productId}`}>
                          <motion.img
                            src={product.image}
                            alt={product.name}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Link>
                        {product.discount > 0 && (
                          <motion.span
                            className="discount-badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                          >
                            {product.discount}%
                          </motion.span>
                        )}
                        <motion.button
                          className={`delete-button ${isDeleting ? "deleting" : ""}`}
                          onClick={() => handleDelete(favorite._id, product.productId)}
                          disabled={isDeleting || deleteLoading}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isDeleting ? (
                            <div className="spinner-small"></div>
                          ) : (
                            <FaTrash />
                          )}
                        </motion.button>
                        {!product.inStock && (
                          <div className="out-of-stock-badge">Out of Stock</div>
                        )}
                      </div>
                      <div className="card-content">
                        <span className="product-category">{product.category}</span>
                        <Link to={`/product/${product.productId}`}>
                          <h3>{product.name}</h3>
                        </Link>
                        <div className="product-price-section">
                          <span className="current-price">PKRS {product.price}</span>
                          {product.originalPrice > product.price && (
                            <span className="original-price">PKRS {product.originalPrice}</span>
                          )}
                        </div>
                        <Link to={`/product/${product.productId}`}>
                          <motion.button
                            className="view-product-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            View Product
                          </motion.button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>

      <style>{`
        .favorites-page {
          background: linear-gradient(128deg, #0a1428 0%, #0f1f3c 100%);
          min-height: 100vh;
          color: #ffffff;
          padding-top: 100px;
          padding-bottom: 3rem;
          font-family: 'Inter', sans-serif;
        }
        .favorites-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .favorites-header {
          margin-bottom: 3rem;
          padding: 2rem 0;
        }
        .header-content {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .header-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316, #facc15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: #1e293b;
          box-shadow: 0 8px 25px rgba(249, 115, 22, 0.4);
        }
        .favorites-header h1 {
          font-size: 2.5rem;
          margin: 0;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .favorites-header p {
          margin: 0.5rem 0 0 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }
        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }
        .favorite-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s;
        }
        .favorite-card:hover {
          box-shadow: 0 12px 35px rgba(249, 115, 22, 0.3);
          border-color: rgba(249, 115, 22, 0.5);
        }
        .card-image-wrapper {
          position: relative;
          width: 100%;
          height: 280px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
        }
        .card-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .discount-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.4);
        }
        .delete-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: none;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          transition: all 0.3s;
        }
        .delete-button:hover:not(:disabled) {
          background: #ef4444;
          transform: scale(1.1);
        }
        .delete-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .delete-button.deleting {
          background: rgba(239, 68, 68, 0.6);
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .out-of-stock-badge {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          text-align: center;
          padding: 0.6rem;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .card-content {
          padding: 1.5rem;
        }
        .product-category {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card-content h3 {
          margin: 0.5rem 0;
          font-size: 1.2rem;
          color: #ffffff;
          font-weight: 600;
          line-height: 1.4;
        }
        .card-content h3:hover {
          color: #fbbf24;
        }
        .product-price-section {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin: 1rem 0;
        }
        .current-price {
          font-size: 1.5rem;
          font-weight: 700;
          color: #fbbf24;
        }
        .original-price {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: line-through;
        }
        .view-product-btn {
          width: 100%;
          padding: 0.8rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 0.5rem;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .view-product-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .loading-container,
        .error-container,
        .empty-container {
          text-align: center;
          padding: 4rem 2rem;
        }
        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 5px solid rgba(255, 255, 255, 0.2);
          border-top-color: #f97316;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1.5rem;
        }
        .loading-container p,
        .error-container p,
        .empty-container p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
          margin: 0.5rem 0;
        }
        .error-container svg,
        .empty-icon {
          font-size: 3rem;
          color: rgba(255, 255, 255, 0.2);
          margin-bottom: 0.5rem;
        }
        .error-container h3,
        .empty-container h2 {
          font-size: 1.4rem;
          margin: 0.5rem 0;
          color: #ffffff;
          font-weight: 700;
        }
        .error-container button {
          margin-top: 1rem;
          padding: 0.8rem 2rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .error-container button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .shop-button {
          margin-top: 1.5rem;
          padding: 1rem 2.5rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-weight: 700;
          font-size: 1.1rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .shop-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        @media (max-width: 768px) {
          .favorites-header h1 {
            font-size: 2rem;
          }
          .header-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }
          .favorites-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1.5rem;
          }
          .favorites-container {
            padding: 0 1rem;
          }
        }
        @media (max-width: 480px) {
          .favorites-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default Favorites;