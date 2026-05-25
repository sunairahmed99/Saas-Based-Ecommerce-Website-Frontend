import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import {
  FaShoppingCart,
  FaTrash,
  FaPlus,
  FaMinus,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  updateCartItem,
  removeFromCart,
  clearCart,
  selectCartItems,
  selectTotalItems,
  selectTotalCartValue,
} from "../Features/Backend/CartSlice";
import { resolveProductImage, handleImageError } from "../constants/images";

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector(selectCartItems) || [];
  const totalItems = useSelector(selectTotalItems);
  const totalCartValue = useSelector(selectTotalCartValue);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const loginType = localStorage.getItem("loginType");
    if (!token || loginType === "seller") {
      navigate("/login");
    }
  }, [navigate]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleQuantityChange = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      dispatch(removeFromCart(cartItemId));
      setToast({
        type: "success",
        message: "Item removed from cart",
        icon: <FaCheckCircle />,
      });
      return;
    }

    dispatch(updateCartItem({ cartItemId, quantity: newQuantity }));
  };

  const handleRemoveItem = (cartItemId) => {
    dispatch(removeFromCart(cartItemId));
    setToast({
      type: "success",
      message: "Item removed from cart",
      icon: <FaCheckCircle />,
    });
  };

  const handleClearCart = () => {
    if (!window.confirm("Are you sure you want to clear all items from your cart?")) {
      return;
    }
    dispatch(clearCart());
    setToast({
      type: "success",
      message: "Cart cleared successfully",
      icon: <FaCheckCircle />,
    });
  };

  return (
    <>
      <Navbar />
      <div className="cart-page">
        <style>{`
          .cart-page {
            min-height: 100vh;
            background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
            padding: 80px 1rem 2rem 1rem;
            color: #fff;

            /* Mobile optimizations */
            @media (max-width: 768px) {
              padding: 70px 0.75rem 2rem 0.75rem;
            }

            /* Tablet optimizations */
            @media (min-width: 769px) and (max-width: 1024px) {
              padding: 80px 1.5rem 2rem 1.5rem;
              max-width: 100%;
              margin: 0 auto;
            }

            /* Desktop enhancements */
            @media (min-width: 1025px) {
              max-width: 1400px;
              margin: 0 auto;
              padding: 80px 2rem 2rem 2rem;
            }
            overflow-x: hidden;
          }
          .cart-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .cart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border-radius: 16px;
            padding: 1.5rem;
            border: 2px solid rgba(0, 234, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 234, 255, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
          }
          .cart-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 30% 20%, rgba(0, 234, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 70% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%);
            pointer-events: none;
          }
          .cart-title {
            font-size: clamp(1.5rem, 2.5vw, 1.8rem);
            font-weight: 800;
            background: linear-gradient(135deg, #00eaff 0%, #ffffff 50%, #f97316 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: none;
            display: flex;
            align-items: center;
            gap: 1rem;
            position: relative;
            z-index: 2;
          }
          .clear-cart-btn {
            padding: 0.6rem 1.2rem;
            border-radius: 10px;
            border: 2px solid #ef4444;
            background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%);
            color: #ef4444;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            z-index: 2;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.2);
          }
          .clear-cart-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
          }
          .clear-cart-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .cart-content {
            display: grid;
            grid-template-columns: 1fr 350px;
            gap: 2rem;
          }
          .cart-items-section {
            display: flex;
            flex-direction: column;
            gap: 2rem;
          }
          .seller-group {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1.5rem;
            border: 2px solid rgba(0, 234, 255, 0.3);
          }
          .seller-header {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(0, 234, 255, 0.3);
          }
          .seller-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: #00eaff;
            text-shadow: 0 2px 10px #00eaff33;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .seller-items {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .cart-item {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.15);
            display: grid;
            grid-template-columns: 100px 1fr auto;
            gap: 1rem;
            transition: transform 0.2s, box-shadow 0.2s;
            align-items: center;
            min-height: 120px; /* Prevent layout shifts */
          }
          .cart-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 234, 255, 0.15);
          }
          .cart-item-image {
            width: 100px;
            height: 100px;
            border-radius: 10px;
            object-fit: cover;
            background: rgba(255, 255, 255, 0.05);
            flex-shrink: 0; /* Prevent image from shrinking */
          }
          .cart-item-info {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
          }
          .cart-item-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 0.2rem;
            word-break: break-word;
          }
          .cart-item-name a {
            color: #fff;
            text-decoration: none;
            transition: color 0.2s;
          }
          .cart-item-name a:hover {
            color: #00eaff;
          }
          .cart-item-details {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 1rem;
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.7);
            flex-wrap: wrap;
          }
          .detail-row {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0;
          }
          .detail-label {
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.7rem;
          }
          .detail-value {
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.75rem;
          }
          .description-row {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            width: 100%;
            margin-top: 0.3rem;
          }
          .description-text {
            font-size: 0.8rem;
            line-height: 1.4;
            color: rgba(255, 255, 255, 0.65);
            max-height: 40px;
            overflow-y: auto;
            word-break: break-word;
          }
          .price-row {
            margin: 0;
            padding: 0;
            background: transparent;
            border-radius: 0;
          }
          .price-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .current-price-label {
            font-weight: 600;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.7rem;
          }
          .current-price-value {
            font-size: 0.85rem;
            font-weight: 700;
            color: #fbbf24;
          }
          .original-price-value {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.5);
            text-decoration: line-through;
          }
          .discount-badge-small {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
          }
          .cart-item-price {
            font-size: 0.95rem;
            font-weight: 700;
            color: #fbbf24;
            margin-top: 0;
          }
          .cart-item-actions {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
            gap: 0.8rem;
          }
          .quantity-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 0.3rem;
          }
          .quantity-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            font-size: 1rem;
          }
          .quantity-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }
          .quantity-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .quantity-value {
            min-width: 40px;
            text-align: center;
            font-weight: 600;
            color: #fff;
          }
          .remove-btn {
            padding: 0.6rem 1rem;
            border-radius: 8px;
            border: 2px solid #ef4444;
            background: transparent;
            color: #ef4444;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
            font-weight: 600;
          }
          .remove-btn:hover:not(:disabled) {
            background: #ef4444;
            color: #fff;
            transform: translateY(-2px);
          }
          .remove-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .cart-summary {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.15);
            height: fit-content;
            position: sticky;
            top: 100px;
          }
          .summary-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: #00eaff;
            margin-bottom: 1.5rem;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
            color: rgba(255, 255, 255, 0.8);
          }
          .summary-label {
            font-size: 0.9rem;
          }
          .summary-value {
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
          }
          .summary-total {
            display: flex;
            justify-content: space-between;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 2px solid rgba(255, 255, 255, 0.2);
          }
          .summary-total-label {
            font-size: 1.1rem;
            font-weight: 700;
            color: #fff;
          }
          .summary-total-value {
            font-size: 1.3rem;
            font-weight: 800;
            color: #fbbf24;
          }
          .checkout-btn {
            width: 100%;
            padding: 1rem 2rem;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #f97316, #facc15);
            color: #1e293b;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            margin-top: 1.5rem;
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
          }
          .checkout-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
          }
          .checkout-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .empty-cart {
            text-align: center;
            padding: 4rem 2rem;
            color: rgba(255, 255, 255, 0.7);
          }
          .empty-cart-icon {
            font-size: 4rem;
            color: rgba(255, 255, 255, 0.3);
            margin-bottom: 1.5rem;
          }
          .empty-cart-title {
            font-size: 1.6rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 1rem;
          }
          .empty-cart-message {
            font-size: 1rem;
            margin-bottom: 2rem;
          }
          .shop-now-btn {
            padding: 1rem 2.5rem;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #f97316, #facc15);
            color: #1e293b;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
            text-decoration: none;
            display: inline-block;
          }
          .shop-now-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
          }
          .cart-toast {
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
          .cart-toast.success {
            background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95));
            color: white;
            border-color: rgba(34, 197, 94, 0.5);
          }
          .cart-toast.error {
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
          @media (max-width: 1024px) {
            .cart-content {
              grid-template-columns: 1fr;
            }
            .cart-summary {
              position: static;
              width: 100%;
            }
          }
          @media (max-width: 768px) {
            .cart-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 1rem;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            }
            .cart-title {
              font-size: clamp(1.8rem, 4vw, 2.2rem);
            }
            .clear-cart-btn {
              width: 100%;
              justify-content: center;
              padding: 1rem 2rem;
            }
            .cart-item {
              grid-template-columns: 100px 1fr;
              gap: 1rem;
            }
            .cart-item-image {
              width: 100px;
              height: 100px;
            }
            .cart-item-actions {
              grid-column: 1 / -1;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              width: 100%;
            }
            .quantity-controls {
              width: 100%;
              justify-content: space-between;
            }
            .cart-item-details {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.45rem;
            }
            .cart-toast {
              bottom: 1rem;
              right: 1rem;
              left: 1rem;
              min-width: auto;
              max-width: none;
            }
          }
          @media (max-width: 640px) {
            .cart-page {
              padding: 1.2rem 4vw 2.5rem 4vw;
              padding-top: 90px;
            }
            .cart-item {
              grid-template-columns: 1fr;
              align-items: flex-start;
            }
            .cart-item-image {
              width: 100%;
              max-width: 140px;
              height: 140px;
              margin: 0 auto;
            }
            .cart-item-actions {
              flex-direction: column;
              align-items: stretch;
              gap: 0.6rem;
            }
            .quantity-controls {
              justify-content: center;
            }
            .remove-btn {
              width: 100%;
              justify-content: center;
              text-align: center;
            }
            .cart-item-details {
              width: 100%;
            }
          }
          @media (max-width: 480px) {
            .cart-header {
              padding: 1.2rem;
              margin-bottom: 1.2rem;
            }
            .cart-title {
              font-size: 1.6rem;
              gap: 0.6rem;
            }
            .cart-item-image {
              max-width: 120px;
              height: 120px;
            }
            .cart-item {
              padding: 0.9rem;
            }
            .cart-summary {
              padding: 1.4rem;
            }
          }
        `}</style>

        <div className="cart-container">
          <div className="cart-header">
            <h1 className="cart-title">
              <FaShoppingCart /> My Cart ({totalItems} {totalItems === 1 ? "item" : "items"})
            </h1>
            {cartItems.length > 0 && (
              <button
                className="clear-cart-btn"
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
              >
                <FaTrash /> Clear Cart
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <FaShoppingCart className="empty-cart-icon" />
              <h2 className="empty-cart-title">Your cart is empty</h2>
              <p className="empty-cart-message">Looks like you haven't added anything to your cart yet.</p>
              <Link to="/shop" className="shop-now-btn">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items-section">
                {(() => {
                  // Group cart items by seller
                  const groupedBySeller = cartItems.reduce((acc, item) => {
                    const product = item.productId || {};
                    const sellerId = product.sellerid?._id || product.sellerid || "unknown";
                    const sellerName = product.sellerid?.sname || product.sellerid?.name || product.sellerid || "Unknown Seller";
                    
                    if (!acc[sellerId]) {
                      acc[sellerId] = {
                        sellerId,
                        sellerName,
                        items: []
                      };
                    }
                    acc[sellerId].items.push(item);
                    return acc;
                  }, {});

                  return Object.values(groupedBySeller).map((sellerGroup) => (
                    <div key={sellerGroup.sellerId} className="seller-group">
                      <div className="seller-header">
                        <h3 className="seller-name">Seller: {sellerGroup.sellerName}</h3>
                      </div>
                      <div className="seller-items">
                        {sellerGroup.items.map((item) => {
                          const product = item.productId || {};
                          const productId = product._id || product;
                          const productName = product.pname || product.name || "Unknown Product";
                          const productImage = resolveProductImage(
                            product.pimage1 || product.image
                          );
                          const productDescription = product.pdescription || product.description || "";
                          const categoryName = product.catid?.name || product.catid?.cname || product.catid || "N/A";
                          const subcategoryName = product.subcatid?.name || product.subcatid?.scname || product.subcatid || "N/A";
                          const originalPrice = product.pactualprice || product.originalPrice || product.pprice || 0;
                          const discountPrice = product.prodisprice || product.discountPrice || product.pprice || 0;
                          const discount = product.pdis || product.discount || 0;
                          const itemPrice = item.price || discountPrice;
                          const itemTotal = item.totalPrice || (itemPrice * item.quantity);

                          return (
                            <motion.div
                              key={item._id}
                              className="cart-item"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                            >
                              <img
                                src={productImage}
                                alt={productName}
                                className="cart-item-image"
                                onError={handleImageError}
                              />
                              <div className="cart-item-info">
                                <h3 className="cart-item-name">
                                  <Link to={`/product/${productId}`}>{productName}</Link>
                                </h3>
                                <div className="cart-item-details">
                                  {item.size && (
                                    <div className="detail-row">
                                      <span className="detail-label">Size:</span>
                                      <span className="detail-value">{item.size}</span>
                                    </div>
                                  )}
                                  {item.color && (
                                    <div className="detail-row">
                                      <span className="detail-label">Color:</span>
                                      <span className="detail-value">{item.color}</span>
                                    </div>
                                  )}
                                  <div className="detail-row">
                                    <span className="detail-label">Price:</span>
                                    <span className="current-price-value">PKR {discountPrice}</span>
                                    {originalPrice > discountPrice && (
                                      <>
                                        <span className="original-price-value">PKR {originalPrice}</span>
                                        {discount > 0 && (
                                          <span className="discount-badge-small">{discount}%</span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Qty:</span>
                                    <span className="detail-value">{item.quantity}</span>
                                  </div>
                                </div>
                                <div className="cart-item-price">Total: PKR {itemTotal}</div>
                              </div>
                              <div className="cart-item-actions">
                                <div className="quantity-controls">
                                  <button
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(item._id, item.quantity, -1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <FaMinus />
                                  </button>
                                  <span className="quantity-value">{item.quantity}</span>
                                  <button
                                    className="quantity-btn"
                                    onClick={() => handleQuantityChange(item._id, item.quantity, 1)}
                                    disabled={false}
                                  >
                                    <FaPlus />
                                  </button>
                                </div>
                                <button
                                  className="remove-btn"
                                  onClick={() => handleRemoveItem(item._id)}
                                  disabled={false}
                                >
                                  <FaTrash /> Remove
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="cart-summary">
                <h2 className="summary-title">Order Summary</h2>
                <div className="summary-row">
                  <span className="summary-label">Items ({totalItems})</span>
                  <span className="summary-value">PKR {totalCartValue.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Shipping</span>
                  <span className="summary-value">Free</span>
                </div>
                <div className="summary-total">
                  <span className="summary-total-label">Total</span>
                  <span className="summary-total-value">PKR {totalCartValue.toFixed(2)}</span>
                </div>
                <button
                  className="checkout-btn"
                  disabled={cartItems.length === 0}
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`cart-toast ${toast.type || "info"}`}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="toast-icon">{toast.icon}</div>
              <div className="toast-message">{toast.message}</div>
              <button
                onClick={() => setToast(null)}
                style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "0.2rem" }}
              >
                <FaTimes />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </>
  );
};

export default Cart;

