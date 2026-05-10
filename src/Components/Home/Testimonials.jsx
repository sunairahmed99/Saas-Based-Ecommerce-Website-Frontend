import React, { useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchApprovedReviews, selectApprovedReviews } from "../../Features/Backend/ReviewSlice";

const Testimonials = () => {
  const scrollRef = useRef(null);
  const dispatch = useDispatch();
  const approved = useSelector(selectApprovedReviews) || [];

  const placeholders = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200",
    "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=200",
  ];

  useEffect(() => {
    dispatch(fetchApprovedReviews());
  }, [dispatch]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>What Our Customers Say</h2>
        </div>
        <div className="carousel-wrapper">
          <button className="arrow-btn left" onClick={() => scroll("left")}>
            ←
          </button>
          <div className="card-row scroll-x" ref={scrollRef}>
            {approved.length === 0 ? (
              <div className="empty">No reviews yet.</div>
            ) : (
              approved.map((r, i) => {
                const imgSrc = r.image || placeholders[i % placeholders.length];
                const stars = "★".repeat(r.rating || 5);
                return (
                  <div key={r._id || r.id || i} className="testimonial-card">
                    <p className="quote">{r.message || "—"}</p>
                    <div className="testimonial-footer">
                      <div className="avatar-sm">
                        {imgSrc ? (
                          <img src={imgSrc} alt={r.name || "user"} />
                        ) : (
                          <div className="avatar-fallback">
                            {(r.name || "U").charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <strong>{r.name || "User"}</strong>
                        <span>{stars} Verified Buyer</span>
                      </div>
                    </div>
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
      <style>{`
        .section {
          width: 100%;
          padding: 2rem;
          background: rgba(51, 68, 102, 0.25);
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
        .testimonial-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          min-width: 230px;
          max-width: 260px;
          padding: 1rem 1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .quote {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 0.7rem 0;
          line-height: 1.5;
        }
        .testimonial-footer {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.8rem;
        }
        .avatar-sm {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          color: #e2e8f0;
          font-weight: 700;
        }
        .avatar-sm img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00eaff, #2563eb);
          color: #fff;
          font-weight: 700;
        }
        .testimonial-footer strong {
          display: block;
          color: #ffffff;
          font-weight: 600;
        }
        .testimonial-footer span {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.75rem;
        }
        .empty {
          color: #e2e8f0;
          opacity: 0.8;
          padding: 0.6rem 0.8rem;
        }
        @media (max-width: 480px) {
          .section {
            padding-inline: 1rem;
          }
          .arrow-btn {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default Testimonials;
