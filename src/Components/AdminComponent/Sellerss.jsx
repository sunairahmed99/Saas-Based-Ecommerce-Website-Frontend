import React, { useEffect, useState } from "react";
import { Table, Button, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSeller,
  selectSellers,
  selectSellersLoading,
  selectSellersError,
  updateSellerStatus,
} from "../../Features/Backend/SellerSlice";
import ReusablePagination from "../ReusablePagination";

function Sellerss() {
  const [sellers, setSellers] = useState([]);
  const [filter, setFilter] = useState("");
  const [verifyFilter, setVerifyFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const CustomSelect = ({ value, options, onChange, label, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container" style={{ width: '100%', ...style }}>
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

  const dispatch = useDispatch();
  const sellerData = useSelector(selectSellers);
  const loading = useSelector(selectSellersLoading);
  const error = useSelector(selectSellersError);

  useEffect(() => {
    if (sellerData && Array.isArray(sellerData)) {
      const mapped = sellerData.map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        role: s.role,
        verifyStatus: s.verifiedstatus ? "Verified" : "Pending",
        activeStatus: s.active,
        shopName: s.shopName || "N/A",
        shopAddress: s.shopAddress || "N/A",
        image: s.image || "",
      }));

      setSellers(mapped);
    }
  }, [sellerData]);

  useEffect(() => {
    dispatch(fetchSeller());
  }, []);

  const handleSort = () => {
    const sorted = [...sellers].sort((a, b) =>
      sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    setSellers(sorted);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleToggleActive = async (id, currentActive, name) => {
    try {
      await dispatch(updateSellerStatus({ id, active: !currentActive })).unwrap();
      const msg = !currentActive ? `${name || "Seller"} is now Active` : `${name || "Seller"} is now Inactive`;
      alert(msg);
      // No need to refresh - Redux state is already updated by updateSellerStatus.fulfilled
    } catch (err) {
      alert("Failed to update seller status");
    }
  };

  const filteredSellers = sellers.filter((s) => {
    const textMatch =
      s.name.toLowerCase().includes(filter) ||
      s.email.toLowerCase().includes(filter) ||
      s.phone.toLowerCase().includes(filter) ||
      s.role.toLowerCase().includes(filter) ||
      s.gender.toLowerCase().includes(filter) ||
      s.shopName.toLowerCase().includes(filter);

    const verifyMatch =
      verifyFilter === "all" ||
      s.verifyStatus.toLowerCase() === verifyFilter;

    const activeMatch =
      activeFilter === "all" ||
      (activeFilter === "active" && s.activeStatus) ||
      (activeFilter === "inactive" && !s.activeStatus);

    return textMatch && verifyMatch && activeMatch;
  });

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);
  const currentSellers = filteredSellers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, verifyFilter, activeFilter, sortOrder]);

  if (loading) return <h4 className="loadingText">Loading Sellers...</h4>;
  if (error) return <h4>Error loading sellers</h4>;

  return (
    <>
      {/* INLINE CSS */}
      <style>{`
        .animated-container {
          padding: 0;
          background: transparent;
          min-height: auto;
        }

        .admin-sellers-title {
          color: #15e7b1;
          font-size: 1.1rem !important;
          font-weight: 800;
          margin-bottom: 2rem;
          text-shadow: 0 0 20px rgba(21, 231, 177, 0.2);
        }

        .filter-section-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(21, 231, 177, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .search-wrapper { margin-bottom: 20px; }
        .search-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(21, 231, 177, 0.2) !important;
          color: #f8fafc !important;
          padding: 12px 20px !important;
          border-radius: 12px !important;
        }

        .filters-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          align-items: flex-end;
        }

        .filter-group { display: flex; flex-direction: column; gap: 8px; }
        .filter-label {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .glass-table { 
          margin-bottom: 0 !important; 
          min-width: 1500px;
          table-layout: auto;
        }

        .glass-table thead th, .glass-table tbody td {
          white-space: nowrap;
          padding: 15px 20px;
          text-align: left;
        }

        .glass-table thead th {
          background: rgba(21, 231, 177, 0.05) !important;
          color: #15e7b1;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(21, 231, 177, 0.1) !important;
        }

        .glass-table tbody td {
          color: #cbd5e1;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        @media (max-width: 768px) {
          .animated-container { padding: 15px; }
          .filters-row { grid-template-columns: 1fr; gap: 15px; }
          .admin-sellers-title { font-size: 1.1rem !important; }
        }

        /* Custom Select Styles */
        .custom-select-container {
          position: relative;
          z-index: 10;
        }

        .custom-select-trigger {
          background: #11161d !important;
          border: 1px solid #365266;
          color: #e5e7eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-select-trigger:hover {
          border-color: #15e7b1;
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #11161d;
          border: 1px solid #365266;
          border-radius: 8px;
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
          background: rgba(21, 231, 177, 0.1);
          color: #15e7b1;
        }

        .custom-select-option.selected {
          background: rgba(21, 231, 177, 0.2);
          color: #15e7b1;
          font-weight: 600;
        }

        /* Custom Select Styles */
        .custom-select-container {
          position: relative;
          z-index: 10;
        }

        .custom-select-trigger {
          background: #11161d !important;
          border: 1px solid #365266;
          color: #e5e7eb;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-select-trigger:hover {
          border-color: #15e7b1;
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #11161d;
          border: 1px solid #365266;
          border-radius: 8px;
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
          background: rgba(21, 231, 177, 0.1);
          color: #15e7b1;
        }

        .custom-select-option.selected {
          background: rgba(21, 231, 177, 0.2);
          color: #15e7b1;
          font-weight: 600;
        }
      `}</style>

      <motion.div
        className="animated-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="admin-sellers-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Sellers 🛒
        </motion.div>

        <div className="filter-section-card">
          <div className="search-wrapper">
            <label className="filter-label">Search Sellers</label>
            <Form.Control
              className="search-input"
              type="text"
              placeholder="🔍 Search by name, email, shop name, phone..."
              value={filter}
              onChange={(e) => setFilter(e.target.value.toLowerCase())}
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label className="filter-label">Verification</label>
              <CustomSelect
                value={verifyFilter}
                options={[
                  { value: 'all', label: '🛡️ All Status' },
                  { value: 'verified', label: '✅ Verified' },
                  { value: 'pending', label: '⏳ Pending' }
                ]}
                onChange={(val) => setVerifyFilter(val)}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Account Status</label>
              <CustomSelect
                value={activeFilter}
                options={[
                  { value: 'all', label: '📊 All Active' },
                  { value: 'active', label: '✅ Active' },
                  { value: 'inactive', label: '❌ Inactive' }
                ]}
                onChange={(val) => setActiveFilter(val)}
              />
            </div>

            <div className="filter-group action-group">
              <label className="filter-label">&nbsp;</label>
              <motion.button
                className="admin-btn admin-btn-primary w-100"
                onClick={handleSort}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sort Name {sortOrder === "asc" ? "↑" : "↓"}
              </motion.button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="table-responsive-container">
            <Table bordered hover variant="dark" className="glass-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Image</th>
                  <th>Seller Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Verify</th>
                  <th>Active Status</th>
                  <th>Shop Name</th>
                  <th>Shop Address</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {currentSellers.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td>
                      {s.image ? (
                        <img
                          src={s.image}
                          alt="seller"
                          style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "8px", border: "2px solid #15e7b1" }}
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: "8px", background: "#1f2937", color: "#a5f3fc", display: "grid", placeItems: "center", fontWeight: 700 }}>
                          {s.name?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: '#94a3b8' }}>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>{s.gender}</td>

                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: s.verifyStatus === "Verified" ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: s.verifyStatus === "Verified" ? '#10b981' : '#f59e0b',
                        border: `1px solid ${s.verifyStatus === "Verified" ? '#10b981' : '#f59e0b'}`
                      }}>
                        {s.verifyStatus}
                      </span>
                    </td>

                    <td>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: s.activeStatus ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: s.activeStatus ? '#10b981' : '#ef4444',
                        border: `1px solid ${s.activeStatus ? '#10b981' : '#ef4444'}`
                      }}>
                        {s.activeStatus ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600 }}>{s.shopName}</td>
                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{s.shopAddress}</td>

                    <td>
                      <motion.button
                        className={`admin-btn ${s.activeStatus ? "admin-btn-warning" : "admin-btn-primary"}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleActive(s.id, s.activeStatus, s.name)}
                      >
                        {s.activeStatus ? "⏸ Deactivate" : "✓ Activate"}
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </Table>
          </div>
          <ReusablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      </motion.div>
    </>
  );
}

export default Sellerss;
