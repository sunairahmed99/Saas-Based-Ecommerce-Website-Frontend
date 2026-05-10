import React, { useRef, useEffect, memo, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchTopPerformingSellers, selectTopPerformingSellers, selectTopPerformingLoading } from "../../Features/Backend/SellerSlice";

const FeaturedSellers = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const topPerformingSellers = useSelector(selectTopPerformingSellers);
  const loading = useSelector(selectTopPerformingLoading);
  const scrollRef = useRef(null);

  // Fetch top performing sellers only if not loaded
  useEffect(() => {
    if (!topPerformingSellers || topPerformingSellers.length === 0) {
      dispatch(fetchTopPerformingSellers());
    }
  }, [dispatch, topPerformingSellers?.length]);

  // Use top performing sellers (they are already filtered for active status)
  const featuredSellers = topPerformingSellers || [];

  // Handle visiting seller store
  const handleVisitStore = (sellerId) => {
    // Navigate to shop with seller filter
    navigate(`/shop?seller=${sellerId}`);
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

  const sellerImages = [
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
  ];

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>Featured Sellers</h2>
        </div>
        <div className="carousel-wrapper">
          <button className="arrow-btn left" onClick={() => scroll("left")}>
            ←
          </button>
          <div className="card-row scroll-x" ref={scrollRef}>
            {loading ? (
              <div style={{ padding: "2rem", color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                Loading featured sellers...
              </div>
            ) : featuredSellers.length === 0 ? (
              <div style={{ padding: "2rem", color: "rgba(255,255,255,0.7)", textAlign: "center" }}>
                No featured sellers available
              </div>
            ) : (
              featuredSellers.slice(0, 10).map((seller, idx) => (
                <div key={seller._id || idx} className="seller-card">
                  <div className="seller-avatar">
                    <img
                      src={seller.image || sellerImages[idx % sellerImages.length]}
                      alt={seller.shopName || seller.name || `Seller ${idx + 1}`}
                      onError={(e) => {
                        e.target.src = sellerImages[idx % sellerImages.length];
                      }}
                    />
                    {seller.totalItemsSold > 0 && (
                      <div className="seller-badge">
                        <span>⭐</span>
                      </div>
                    )}
                  </div>
                  <h4>{seller.shopName || "Shop Name"}</h4>
                  <p>{seller.name || "Seller Name"}</p>
                  <div className="seller-stats">
                    <small style={{
                      color: seller.totalItemsSold > 0 ? "#fbbf24" : "rgba(255,255,255,0.6)",
                      fontSize: "0.75rem",
                      fontWeight: seller.totalItemsSold > 0 ? "600" : "normal"
                    }}>
                      {seller.totalItemsSold > 0 ? `${seller.totalItemsSold} items sold` : "New seller"}
                    </small>
                  </div>
                  <button
                    className="btn-visit"
                    onClick={() => handleVisitStore(seller._id)}
                  >
                    Visit Store
                  </button>
                </div>
              ))
            )}
          </div>
          <button className="arrow-btn right" onClick={() => scroll("right")}>
            →
          </button>
        </div>
      </section>
      <style>{`
        .section {
          width: 100%;
          padding: 2rem;
          background: rgba(51, 68, 102, 0.3);
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
          left: -20px;
        }
        .arrow-btn.right {
          right: -20px;
        }
        .card-row {
          display: flex;
          gap: 0.9rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 0.4rem;
        }
        .card-row::-webkit-scrollbar {
          height: 6px;
        }
        .card-row::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 999px;
        }
        .seller-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          min-width: 200px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          padding: 1rem 0.9rem;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .seller-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 0.6rem;
          border: 3px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .seller-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .seller-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.9);
        }
        .seller-card h4 {
          margin: 0 0 0.2rem 0;
          font-size: 0.95rem;
          color: #ffffff;
          font-weight: 600;
        }
        .seller-card p {
          margin: 0 0 0.3rem 0;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .seller-stats {
          margin-bottom: 0.8rem;
        }
        .btn-visit {
          padding: 0.5rem 1.2rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .btn-visit:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
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
          .arrow-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
});

export default FeaturedSellers;
