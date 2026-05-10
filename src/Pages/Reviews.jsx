import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useForm } from "react-hook-form";
import {
  createReview,
  fetchApprovedReviews,
  selectApprovedReviews,
  selectReviewSubmitting,
  selectReviewSubmitError,
  // Product review imports
  createProductReview,
  fetchUserOrderedProducts,
  selectUserOrderedProducts,
  selectOrderedProductsLoading,
  selectCreatingProductReview,
  selectCreateProductReviewError,
} from "../Features/Backend/ReviewSlice";
import { selectUser, fetchCurrentUser } from "../Features/Backend/UserSlice";
import LoaderOverlay from "../Components/LoaderOverlay";
import { useNavigate } from "react-router-dom";

const Reviews = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const approved = useSelector(selectApprovedReviews) || [];
  const submitting = useSelector(selectReviewSubmitting);
  const submitError = useSelector(selectReviewSubmitError);
  const user = useSelector(selectUser);

  // Product review state
  const [reviewType, setReviewType] = useState("website"); // "website" or "product"
  const [selectedProduct, setSelectedProduct] = useState("");
  const userOrderedProducts = useSelector(selectUserOrderedProducts) || [];
  const orderedProductsLoading = useSelector(selectOrderedProductsLoading);
  const creatingProductReview = useSelector(selectCreatingProductReview);
  const createProductReviewError = useSelector(selectCreateProductReviewError);

  const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Check if user is logged in (regular user or google user)
  const isLoggedIn = token && (loginType === "user" || loginType === "google");

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

  useEffect(() => {
    dispatch(fetchApprovedReviews());
  }, [dispatch]);

  useEffect(() => {
    // ensure user data present for logged-in user
    if (token && (loginType === "user" || loginType === "google") && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, loginType, user]);

  // Fetch user's ordered products when switching to product review mode
  useEffect(() => {
    if (reviewType === "product" && isLoggedIn && userOrderedProducts.length === 0) {
      dispatch(fetchUserOrderedProducts());
    }
  }, [dispatch, reviewType, isLoggedIn, userOrderedProducts.length]);

  const onSubmit = async (data) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    if (reviewType === "product") {
      if (!selectedProduct) {
        alert("Please select a product to review");
        return;
      }

      const selectedProductData = userOrderedProducts.find(p => p._id === selectedProduct);
      if (!selectedProductData) {
        alert("Invalid product selected");
        return;
      }

      const productReviewData = {
        productId: selectedProduct,
        orderId: selectedProductData.orderId,
        message: data.message,
        rating: data.rating
      };

      const result = await dispatch(createProductReview(productReviewData));
      if (createProductReview.fulfilled.match(result)) {
        reset();
        setSelectedProduct("");
        setValue("message", "");
        setValue("rating", 5);
        alert("Product review submitted successfully!");
      }
    } else {
      // Website review
      const result = await dispatch(createReview(data));
      if (createReview.fulfilled.match(result)) {
        reset();
        alert("Website review submitted successfully!");
        // refresh approved list if admin approves later; keep user's optimism minimal
      }
    }
  };

  const notLoggedInUser = !isLoggedIn;

  return (
    <>
      <Navbar />
      <section className="reviews-page">
        <div className="reviews-shell">
          <div className="reviews-card">
            <h2>Share Your Experience</h2>
            <p className="subtitle">Choose what you'd like to review</p>

            {/* Review Type Selection */}
            <div className="review-type-selector">
              <button
                type="button"
                className={`review-type-btn ${reviewType === "website" ? "active" : ""}`}
                onClick={() => setReviewType("website")}
              >
                🌐 Website Review
                <span className="review-type-desc">Share your overall experience with our platform</span>
              </button>
              <button
                type="button"
                className={`review-type-btn ${reviewType === "product" ? "active" : ""}`}
                onClick={() => setReviewType("product")}
              >
                📦 Product Review
                <span className="review-type-desc">Review products you've purchased</span>
              </button>
            </div>

            {notLoggedInUser && (
              <div className="warn">
                Please login as a user to submit a review.
              </div>
            )}

            {/* Website Review Form */}
            {reviewType === "website" && (
              <>
                <div className="review-form-header">
                  <h3>Website Review</h3>
                  <p>Help us improve by sharing your experience with our platform</p>
                </div>
                {(submitting || creatingProductReview) && <LoaderOverlay show message="Submitting review..." />}
                <form className="review-form" onSubmit={handleSubmit(onSubmit)}>
                  <label>Rating (1-5 stars)</label>
                  <select {...register("rating", { valueAsNumber: true })} defaultValue={5}>
                    {[1,2,3,4,5].map(n => (
                      <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                    ))}
                  </select>
                  <label>Your Message</label>
                  <textarea
                    rows={4}
                    {...register("message", {
                      required: "Message is required",
                      minLength: { value: 10, message: "Min 10 characters" },
                      maxLength: { value: 200, message: "Max 200 characters" },
                    })}
                    maxLength={200}
                    placeholder="Tell us about your experience with our website..."
                  />
                  {errors.message && <span className="err">{errors.message.message}</span>}
                  {submitError && <span className="err">{submitError}</span>}
                  <button type="submit" disabled={submitting || notLoggedInUser}>
                    Submit Website Review
                  </button>
                </form>
              </>
            )}

            {/* Product Review Form */}
            {reviewType === "product" && (
              <>
                <div className="review-form-header">
                  <h3>Product Review</h3>
                  <p>Review products you've purchased and received</p>
                </div>

                {orderedProductsLoading && <LoaderOverlay show message="Loading your orders..." />}

                {(submitting || creatingProductReview) && <LoaderOverlay show message="Submitting review..." />}

                {userOrderedProducts.length === 0 && !orderedProductsLoading && (
                  <div className="no-products-message">
                    <p>You haven't purchased any products yet, or your orders haven't been delivered.</p>
                    <p>Only delivered orders can be reviewed.</p>
                  </div>
                )}

                {userOrderedProducts.length > 0 && (
                  <form className="review-form" onSubmit={handleSubmit(onSubmit)}>
                    <label>Select Product to Review</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                    >
                      <option value="">Choose a product...</option>
                      {userOrderedProducts.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - Rs. {product.price}
                        </option>
                      ))}
                    </select>

                    <label>Rating (1-5 stars)</label>
                    <select {...register("rating", { valueAsNumber: true })} defaultValue={5}>
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                      ))}
                    </select>

                    <label>Your Review</label>
                    <textarea
                      rows={4}
                      {...register("message", {
                        required: "Review message is required",
                        minLength: { value: 10, message: "Min 10 characters" },
                        maxLength: { value: 200, message: "Max 200 characters" },
                      })}
                      maxLength={200}
                      placeholder="Share your experience with this product..."
                    />
                    {errors.message && <span className="err">{errors.message.message}</span>}
                    {createProductReviewError && <span className="err">{createProductReviewError}</span>}
                    <button type="submit" disabled={creatingProductReview || notLoggedInUser || !selectedProduct}>
                      Submit Product Review
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="reviews-list">
            <h3>What people say</h3>
            {approved.length === 0 ? (
              <div className="empty">No reviews yet.</div>
            ) : (
              <div className="review-grid">
                {approved.map((r) => (
                  <div className="review-card" key={r._id || r.id}>
                    <div className="review-head">
                      <div className="avatar">{(r.name || "U").charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="name">{r.name || "User"}</div>
                        <div className="stars">{"★".repeat(r.rating || 5)}</div>
                      </div>
                    </div>
                    <p className="msg">{r.message}</p>
                    <div className="time">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <style>{`
        .reviews-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding-top: 0 !important;
          padding-inline: 1.5rem;
          padding-bottom: 4rem;
          display: flex;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }
        .reviews-shell {
          width: 100%;
          max-width: 1100px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          margin-top: 20px;
        }
        @media (max-width: 950px) {
          .reviews-page { padding-top: 0 !important; }
          .reviews-shell { grid-template-columns: 1fr; gap: 2rem; margin-top: 10px; }
          .reviews-card, .reviews-list { text-align: center; }
          .review-form-header { text-align: center; }
          .review-form label { text-align: left; }
          .review-type-selector {
            grid-template-columns: 1fr;
            gap: 0.8rem;
          }
          .reviews-card h2 { font-size: 1.4rem; text-align: center; }
          .subtitle { font-size: 0.85rem; text-align: center; }
          .reviews-list h3 { font-size: 1.25rem; text-align: center; }
        }
        .reviews-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          color: #fff;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          height: fit-content;
          width: 100%;
        }
        .reviews-card h2 { margin: 0 0 0.5rem 0; font-size: 1.7rem; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; }
        .subtitle { margin: 0 0 2rem 0; color: #94a3b8; font-size: 0.95rem; }

        /* Review Type Selector */
        .review-type-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
          width: 100%;
        }

        .review-type-btn {
          width: 100%;
          padding: 1.2rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
          font-weight: 600;
        }

        .review-type-btn:hover {
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        .review-type-btn.active {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          color: #ffffff;
        }

        /* Review Form */
        .review-form {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .review-form label { 
          width: 100%;
          font-size: 0.85rem; 
          font-weight: 600; 
          color: #64748b; 
          margin-top: 1rem; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
        }
        .review-form select,
        .review-form textarea {
          width: 100% !important;
          max-width: 100%;
          box-sizing: border-box;
          background: rgba(15, 23, 42, 0.5);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem 1.2rem;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
          margin-top: 5px;
        }
        .review-form select:focus,
        .review-form textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .review-form button {
          width: auto;
          min-width: 200px;
          margin: 20px auto 0 auto;
          display: flex;
          justify-content: center;
          background: linear-gradient(135deg, #f97316 0%, #facc15 100%);
          color: #1e293b;
          font-weight: 700;
          border-radius: 12px;
          border: none;
          padding: 12px 24px;
          font-size: 0.95rem;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
          cursor: pointer;
        }
        .review-form button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.4);
          filter: brightness(1.1);
        }
        .review-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reviews-list {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          color: #fff;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
        }
        .review-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .review-card {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 1.5rem;
          transition: all 0.3s ease;
          width: 100%;
        }
        .review-head {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .avatar {
          width: 50px; height: 50px;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6, #10b981);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 1.2rem;
          flex-shrink: 0;
        }
        .name { font-weight: 700; font-size: 1.1rem; color: #ffffff; }
        .stars { color: #fbbf24; font-size: 0.9rem; margin-top: 2px; }
        .msg { margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.6; }
        .time { margin-top: 1rem; font-size: 0.8rem; color: #475569; display: block; }
        @media (max-width: 480px) {
          .reviews-page { padding-inline: 1rem; }
          .reviews-card, .reviews-list { padding: 1.5rem; }
          .review-card { padding: 1.2rem; }
          .avatar { width: 44px; height: 44px; font-size: 1rem; }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default Reviews;

