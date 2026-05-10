import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllReviews,
  approveReview,
  deleteReview,
  selectAllReviews,
  selectReviewsLoading,
  selectReviewError,
  // Product review imports
  fetchAllProductReviews,
  approveProductReview,
  deleteProductReview,
  selectAllProductReviews,
  selectAllProductReviewsLoading,
} from "../../Features/Backend/ReviewSlice";
import ReusablePagination from "../ReusablePagination";

const Reviews = () => {
  const dispatch = useDispatch();
  const websiteReviews = useSelector(selectAllReviews) || [];
  const productReviews = useSelector(selectAllProductReviews) || [];
  const websiteLoading = useSelector(selectReviewsLoading);
  const productLoading = useSelector(selectAllProductReviewsLoading);
  const error = useSelector(selectReviewError);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // all, website, product
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const CustomSelect = ({ value, options, onChange, label, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container" style={{ flex: 1, minWidth: '200px', ...style }}>
        <div 
          className="custom-select-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption?.label || label}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div className="custom-select-options">
            {options.map(opt => (
              <div 
                key={opt.value}
                className={`custom-select-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
        {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />}
      </div>
    );
  };

  const loading = websiteLoading || productLoading;

  useEffect(() => {
    dispatch(fetchAllReviews());
    dispatch(fetchAllProductReviews());
  }, [dispatch]);

  // Combine and format reviews
  const allReviews = useMemo(() => {
    const formattedWebsiteReviews = websiteReviews.map(review => ({
      ...review,
      reviewType: 'website',
      displayType: '🌐 Website'
    }));

    const formattedProductReviews = productReviews.map(review => ({
      ...review,
      reviewType: 'product',
      displayType: '📦 Product',
      // Add product name if available
      productName: review.productId?.pname || 'Unknown Product'
    }));

    return [...formattedWebsiteReviews, ...formattedProductReviews];
  }, [websiteReviews, productReviews]);

  const handleApprove = async (review) => {
    const { _id, reviewType } = review;
    let result;

    if (reviewType === 'website') {
      result = await dispatch(approveReview(_id));
    } else if (reviewType === 'product') {
      result = await dispatch(approveProductReview(_id));
    }

    if (result && (approveReview.fulfilled.match(result) || approveProductReview.fulfilled.match(result))) {
      // Refetch both types of reviews after successful approval
      dispatch(fetchAllReviews());
      dispatch(fetchAllProductReviews());
    }
  };

  const handleDelete = async (review) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      const { _id, reviewType } = review;
      if (reviewType === 'website') {
        await dispatch(deleteReview(_id));
        dispatch(fetchAllReviews());
      } else if (reviewType === 'product') {
        await dispatch(deleteProductReview(_id));
        dispatch(fetchAllProductReviews());
      }
    }
  };

  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      const matchesSearch =
        (r.name && r.name.toLowerCase().includes(search.toLowerCase())) ||
        (r.message && r.message.toLowerCase().includes(search.toLowerCase())) ||
        (r.productName && r.productName.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && r.approved) ||
        (statusFilter === "pending" && !r.approved);

      const matchesType =
        typeFilter === "all" || typeFilter === r.reviewType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allReviews, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const currentReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  return (
    <div style={{ padding: "10px", maxWidth: "100%" }}>
      <style>{`
        .reviews-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          align-items: center;
          margin-bottom: 25px;
          background: rgba(30, 41, 59, 0.5);
          padding: 15px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .reviews-input {
          flex: 1;
          min-width: 280px;
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px 15px;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .reviews-input:focus {
          border-color: #53e5ff;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          color: #dbeafe; 
          table-layout: auto; 
          min-width: 1100px;
        }
        th, td { 
          padding: 14px 20px; 
          border-bottom: 1px solid #1f2f4b; 
          text-align: left; 
          white-space: nowrap;
        }
        th { 
          background: #0f1e38; 
          color: #53e5ff; 
          text-transform: uppercase; 
          font-size: 0.85rem;
          font-weight: 700;
        }
        tr:hover { background: rgba(59,130,246,0.08); }
        .badge { 
          padding: 6px 12px; 
          border-radius: 6px; 
          font-size: 0.8rem; 
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .pending { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
        .approved { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

        .admin-reviews-title {
          color: #53e5ff;
          font-size: 1.8rem !important;
          font-weight: 800;
          margin-bottom: 1.5rem;
          letter-spacing: -0.5px;
        }

        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Custom Select Styles */
        .custom-select-container {
          position: relative;
          z-index: 10;
        }

        .custom-select-trigger {
          background: #0f172a !important;
          border: 1px solid #334155;
          color: #e6f0fd;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-select-trigger:hover {
          border-color: #53e5ff;
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #0f1e38;
          border: 1px solid #334155;
          border-radius: 10px;
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .custom-select-option {
          padding: 10px 15px;
          cursor: pointer;
          color: #e5e7eb;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .custom-select-option:hover {
          background: rgba(83, 229, 255, 0.1);
          color: #53e5ff;
        }

        .table-responsive-container {
          overflow-x: auto;
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glass-table {
          min-width: 1100px;
        }
        .admin-btn {
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .admin-btn-primary { background: #3b82f6; color: white; }
        .admin-btn-primary:hover { background: #2563eb; }
        .admin-btn-danger { background: #ef4444; color: white; }
        .admin-btn-danger:hover { background: #dc2626; }
      `}</style>
      <div className="admin-reviews-title">All Reviews (Website & Product)</div>
      <div className="reviews-toolbar">
        <input
          className="reviews-input"
          type="text"
          placeholder="Search name, message, or product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <CustomSelect
          value={statusFilter}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'approved', label: 'Approved' },
            { value: 'pending', label: 'Pending' }
          ]}
          onChange={(val) => setStatusFilter(val)}
        />
        <CustomSelect
          value={typeFilter}
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'website', label: 'Website Reviews' },
            { value: 'product', label: 'Product Reviews' }
          ]}
          onChange={(val) => setTypeFilter(val)}
        />
      </div>
      {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
      {loading ? (
        <div style={{ color: "#53e5ff", padding: "20px" }}>Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ color: "#9ca3af", padding: "20px" }}>No reviews yet.</div>
      ) : (
        <div className="table-responsive-container">
          <table className="glass-table reviews-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Message</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentReviews.map((r) => (
                <tr key={`${r.reviewType}-${r._id || r.id}`}>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>{r.name || "User"}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.reviewType === 'website' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      color: r.reviewType === 'website' ? '#60a5fa' : '#a78bfa',
                      border: `1px solid ${r.reviewType === 'website' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`
                    }}>
                      {r.displayType}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{r.productName || "-"}</td>
                  <td style={{ fontWeight: 700, color: '#fbbf24' }}>{r.rating || 5}⭐</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word', fontSize: '0.85rem', opacity: 0.8 }}>
                    {r.message || "-"}
                  </td>
                  <td>
                    <span className={`badge ${r.approved ? "approved" : "pending"}`}>
                      {r.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td>
                    {!r.approved && (
                      <button className="admin-btn admin-btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApprove(r)}>
                        Approve
                      </button>
                    )}
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{marginLeft:'8px', padding: '6px 12px', fontSize: '0.8rem'}}
                      onClick={() => handleDelete(r)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReusablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default Reviews;
