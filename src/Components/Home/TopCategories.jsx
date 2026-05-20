import React, { useEffect, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchTrendingCategories, incrementCategoryClicks, selectTrendingCategories } from "../../Features/Backend/CategorySlice";
import OptimizedImage from "../OptimizedImage";

const TopCategories = memo(() => {
  const dispatch = useDispatch();
  const categories = useSelector(selectTrendingCategories);

  // Fetch trending categories only if not already loaded
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchTrendingCategories(10));
    }
  }, [dispatch, categories?.length]);

  // Handle category click tracking
  const handleCategoryClick = (categoryId) => {
    dispatch(incrementCategoryClicks(categoryId));
  };

  // Default colors for categories (cycling through if more categories than colors)
  const categoryColors = [
    "#3b82f6", // blue
    "#ec4899", // pink
    "#22c55e", // green
    "#f59e0b", // orange
    "#a855f7", // purple
    "#ef4444", // red
    "#06b6d4", // cyan
    "#8b5cf6", // violet
    "#f97316", // orange-600
    "#10b981", // emerald
  ];

  return (
    <>
      <section className="section">
        <div className="section-header">
          <h2>Top Categories</h2>
        </div>
        <div className="categories-grid">
          {categories.length === 0 ? (
            <div style={{ padding: "2rem", color: "rgba(255,255,255,0.7)", textAlign: "center", gridColumn: "1/-1" }}>
              No categories available
            </div>
          ) : (
            categories.map((cat, idx) => {
              const categoryColor = categoryColors[idx % categoryColors.length];
              return (
                <Link
                  key={cat._id || idx}
                  to={`/shop?category=${cat._id}`}
                  className="category-card"
                  style={{ textDecoration: "none", color: "inherit" }}
                  onClick={() => handleCategoryClick(cat._id)}
                >
                  <div className="category-icon" style={{ background: categoryColor }}>
                    {cat.Image ? (
                      <OptimizedImage
                        src={cat.Image}
                        alt={cat.name || "Category"}
                        className="category-image"
                      />
                    ) : null}
                    <span 
                      className="category-emoji" 
                      style={{ display: cat.Image ? "none" : "block" }}
                    >
                      {cat.name ? cat.name.charAt(0).toUpperCase() : "📦"}
                    </span>
                  </div>
                  <span>{cat.name || "Category"}</span>
                </Link>
              );
            })
          )}
        </div>
      </section>
      <style>{`
        .section {
          width: 100%;
          padding: 2rem;
          background: rgba(51, 68, 102, 0.2);
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
        .categories-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.9rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        .category-card {
          width: 180px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1rem 0.8rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.15);
        }
        .category-card span {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
        }
        .category-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .category-emoji {
          font-size: 1.8rem;
        }
        .category-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 16px;
        }
        .category-icon .optimized-image-wrapper {
          width: 100%;
          height: 100%;
          border-radius: 16px;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .category-card {
            width: calc(33.33% - 0.9rem);
          }
        }
        @media (max-width: 480px) {
          .section {
            padding-inline: 1rem;
          }
          .section-header {
            justify-content: center !important;
            text-align: center;
          }
          .categories-grid {
            gap: 0.6rem;
          }
          .category-card {
            width: calc(50% - 0.6rem);
          }
        }
      `}</style>
    </>
  );
});

export default TopCategories;

