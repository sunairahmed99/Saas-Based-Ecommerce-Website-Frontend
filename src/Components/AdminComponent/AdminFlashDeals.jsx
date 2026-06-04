import React, { useMemo, useState, useEffect } from "react";
import { Table, Form, Spinner } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { useAdminQuery, adminQueryKeys, useQueryClient } from "../../hooks/useAdminApi";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";
import { FaCheck, FaTimes, FaBan, FaStore, FaBolt, FaTag } from 'react-icons/fa';

function AdminFlashDeals() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [toast, setToast] = useState(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const itemsPerPage = 10;

  const { data: pending = [], isLoading: pendingLoading, error: pendingError } = useAdminQuery({
    queryKey: adminQueryKeys.flashPending,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/flashdeal/admin/pending`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: approved = [], isLoading: approvedLoading, error: approvedError } = useAdminQuery({
    queryKey: adminQueryKeys.flashApproved,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/flashdeal/admin/approved`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ flashDealId, action }) => {
      const res = await axios.patch(`${API_BASE_URL}/flashdeal/approve`, { flashDealId, action });
      return res.data?.data;
    },
    onSuccess: (data, variables) => {
      setToast({ type: "success", message: `Status changed: ${variables.action}` });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.flashPending });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.flashApproved });
    },
    onError: (err) => {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Operation failed" });
    }
  });

  const loading = pendingLoading || approvedLoading || actionMutation.isPending;
  const error = pendingError?.response?.data?.message || pendingError?.message || approvedError?.response?.data?.message || approvedError?.message || null;

  // Filtering
  const filteredPending = useMemo(() => {
    const sorted = [...pending].sort((a, b) => {
      const pnA = a?.productId?.pname?.toLowerCase() ?? "";
      const pnB = b?.productId?.pname?.toLowerCase() ?? "";
      return sortOrder === "asc" ? pnA.localeCompare(pnB) : pnB.localeCompare(pnA);
    });
    const f = filter.toLowerCase();
    return sorted.filter(
      (fd) =>
        fd?.productId?.pname?.toLowerCase().includes(f) ||
        fd?.sellerId?.sname?.toLowerCase().includes(f)
    );
  }, [pending, filter, sortOrder]);

  const totalPendingPages = Math.ceil(filteredPending.length / itemsPerPage);
  const currentPendingItems = filteredPending.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage);

  const filteredApproved = useMemo(() => {
    const sorted = [...approved].sort((a, b) => {
      const pnA = a?.productId?.pname?.toLowerCase() ?? "";
      const pnB = b?.productId?.pname?.toLowerCase() ?? "";
      return sortOrder === "asc" ? pnA.localeCompare(pnB) : pnB.localeCompare(pnA);
    });
    const f = filter.toLowerCase();
    return sorted.filter(
      (fd) =>
        fd?.productId?.pname?.toLowerCase().includes(f) ||
        fd?.sellerId?.sname?.toLowerCase().includes(f)
    );
  }, [approved, filter, sortOrder]);

  const totalApprovedPages = Math.ceil(filteredApproved.length / itemsPerPage);
  const currentApprovedItems = filteredApproved.slice((approvedPage - 1) * itemsPerPage, approvedPage * itemsPerPage);

  // Reset pages on filter change
  useEffect(() => {
    setPendingPage(1);
    setApprovedPage(1);
  }, [filter, sortOrder]);

  const handleAction = async (id, action) => {
    try {
      await actionMutation.mutateAsync({ flashDealId: id, action });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <motion.div className="modern-flashdeals-admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <style>{`
        .modern-flashdeals-admin {
          padding: 0;
          min-height: auto;
        }

        .fd-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .fd-toolbar-title {
          font-size: 1.1rem !important; 
          font-weight: 800; 
          color: #00eaff;
          text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .filter-section-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 234, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .filters-row {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 200px; }
        .filter-label {
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .search-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(0, 234, 255, 0.2) !important;
          color: #f8fafc !important;
          padding: 10px 15px !important;
          border-radius: 10px !important;
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
        }

        .fd-table-glass { margin-bottom: 0 !important; }
        .fd-table-glass th, .fd-table-glass td {
          white-space: nowrap;
          padding: 14px 18px;
          text-align: left;
        }

        .fd-table-glass th {
          background: rgba(0, 234, 255, 0.05) !important;
          color: #00eaff;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.8rem;
          border-bottom: 1px solid rgba(0, 234, 255, 0.1) !important;
        }

        .fd-table-glass td {
          color: #cbd5e1;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .fd-status-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .fd-actions { display: flex; gap: 8px; }

        .fd-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          padding: 14px 24px;
          border-radius: 12px;
          color: white;
          z-index: 9999;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(0,0,0,0.4);
        }
        .fd-toast.success { background: linear-gradient(135deg, #059669, #10b981); border: 1px solid #34d399; }
        .fd-toast.danger { background: linear-gradient(135deg, #dc2626, #ef4444); border: 1px solid #f87171; }
      `}</style>

      <div className="fd-header-row">
        <span className="fd-toolbar-title"><FaBolt /> Flash Deals Admin</span>
      </div>

      <div className="filter-section-card">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Search Flash Deals</label>
            <Form.Control
              type="text"
              className="search-input"
              placeholder="🔍 Search by product or seller name..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
          <div className="filter-group action-group">
            <label className="filter-label">&nbsp;</label>
            <motion.button 
              className="admin-btn admin-btn-ghost w-100" 
              whileTap={{ scale: 0.97 }} 
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "Sort A-Z ↑" : "Sort Z-A ↓"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Pending Flash Deals Table */}
      <h4 style={{ color: '#f59e42', margin: '20px 0 15px', fontWeight: 700, fontSize: '1rem' }}>Pending Approvals ({filteredPending.length})</h4>
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="fd-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Seller</th>
              <th>Product</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentPendingItems.length > 0 ? (
                currentPendingItems.map((fd, idx) => {
                  const globalIdx = (pendingPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <motion.tr key={fd._id} className="fd-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                      <td>{globalIdx}</td>
                      <td style={{ fontWeight: 600 }}><FaStore style={{ color: '#00eaff', marginRight: 8 }} /> {fd.sellerId?.name || fd.sellerId?.sname || 'Seller'}</td>
                      <td><FaTag style={{ color: '#10b981', marginRight: 8 }} /> {fd.productId?.pname || 'Product'}</td>
                      <td style={{ color: '#94a3b8' }}>{fd.productId?.catid?.name || fd.productId?.catid?.cname || (typeof fd.productId?.catid === 'string' ? fd.productId.catid : '-')}</td>
                      <td style={{ color: '#94a3b8' }}>{fd.productId?.subcatid?.name || fd.productId?.subcatid?.scname || (typeof fd.productId?.subcatid === 'string' ? fd.productId.subcatid : '-')}</td>
                      <td><span className="fd-status-badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' }}>{fd.status}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(fd.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="fd-actions">
                          <button className="admin-btn admin-btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Approve" onClick={() => handleAction(fd._id, 'approve')}><FaCheck /> Approve</button>
                          <button className="admin-btn admin-btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Reject" onClick={() => handleAction(fd._id, 'reject')}><FaTimes /> Reject</button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: 30 }}>No pending requests found.</td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </Table>
      </div>
      <ReusablePagination 
        currentPage={pendingPage}
        totalPages={totalPendingPages}
        onPageChange={setPendingPage}
      />

      {/* Approved Deals Table */}
      <h4 style={{ color: '#16e0a0', margin: '26px 0 15px', fontWeight: 700, fontSize: '1rem' }}>Approved Deals ({filteredApproved.length})</h4>
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="fd-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Seller</th>
              <th>Product</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentApprovedItems.length > 0 ? (
                currentApprovedItems.map((fd, idx) => {
                  const globalIdx = (approvedPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <motion.tr key={fd._id} className="fd-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                      <td>{globalIdx}</td>
                      <td style={{ fontWeight: 600 }}><FaStore style={{ color: '#00eaff', marginRight: 8 }} /> {fd.sellerId?.name || fd.sellerId?.sname || 'Seller'}</td>
                      <td><FaTag style={{ color: '#10b981', marginRight: 8 }} /> {fd.productId?.pname || 'Product'}</td>
                      <td style={{ color: '#94a3b8' }}>{fd.productId?.catid?.name || fd.productId?.catid?.cname || (typeof fd.productId?.catid === 'string' ? fd.productId.catid : '-')}</td>
                      <td style={{ color: '#94a3b8' }}>{fd.productId?.subcatid?.name || fd.productId?.subcatid?.scname || (typeof fd.productId?.subcatid === 'string' ? fd.productId.subcatid : '-')}</td>
                      <td><span className="fd-status-badge" style={{ background: 'rgba(22, 224, 160, 0.2)', color: '#16e0a0', border: '1px solid #16e0a0' }}>{fd.status}</span></td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {fd.startDate ? new Date(fd.startDate).toLocaleDateString() : '-'} to {fd.endDate ? new Date(fd.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn-warning" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Disapprove" onClick={() => handleAction(fd._id, 'reject')}><FaBan /> Disapprove</button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="8" className="text-center text-muted" style={{ padding: 30 }}>No approved deals found.</td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </Table>
      </div>
      <ReusablePagination 
        currentPage={approvedPage}
        totalPages={totalApprovedPages}
        onPageChange={setApprovedPage}
      />

      {loading && <Spinner style={{ marginTop: 16 }} animation="border" variant="info" />}
      {error && <p className="text-danger mt-2">{error}</p>}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`fd-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminFlashDeals;
