import React, { useEffect, useState, useMemo } from "react";
import { Table, Button, Form, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { fetchSellerProducts, selectProducts } from "../../Features/Backend/ProductSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaBolt, FaTag, FaPlus, FaCheckCircle, FaTrash } from 'react-icons/fa';

const statusColor = (status) => {
  if (status === "approved") return "#16e0a0";
  if (status === "pending") return "#ffb340";
  if (status === "rejected") return "#ff1a61";
  return "#646a7b";
};

const SellerFlashDeals = () => {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const seller = useSelector(selectSeller);
  const sellerData = seller?.data || seller;
  const sellerId = sellerData?._id;

  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");

  const { data: deals = [], isLoading: loadingDeals, error: errorDeals } = useQuery({
    queryKey: ['seller-flashdeals', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const res = await axios.get(`${API_BASE_URL}/flashdeal/seller/${sellerId}`);
      return res.data?.data || [];
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', true, sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const res = await axios.get(`${API_BASE_URL}/product/getsellerproduct`, {
        headers: { seller_id: sellerId, auth_token: token }
      });
      return res.data?.data || [];
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const requestDealMutation = useMutation({
    mutationFn: async ({ sellerId, productId }) => {
      const res = await axios.post(`${API_BASE_URL}/flashdeal/add`, { sellerId, productId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flashdeals'] });
    }
  });

  const deleteDealMutation = useMutation({
    mutationFn: async ({ sellerId, flashDealId }) => {
      const res = await axios.delete(`${API_BASE_URL}/flashdeal/remove`, {
        data: { sellerId, flashDealId }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-flashdeals'] });
    }
  });

  const loading = loadingDeals || loadingProducts || requestDealMutation.isPending || deleteDealMutation.isPending;
  const error = errorDeals?.message || requestDealMutation.error?.message || deleteDealMutation.error?.message;

  const [selectedProduct, setSelectedProduct] = useState("");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");
  const [toast, setToast] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const CustomSelect = ({ value, options, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container" style={{ width: 'auto', minWidth: '150px' }}>
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

  useEffect(() => {
    // Redux fetch removed, React Query handles it automatically via useQuery
  }, [sellerId]);

  // Filter out products already in a flashdeal request (pending/approved)
  const usedProductIds = deals.map((fd) => fd.productId?._id || fd.productId);
  const availableProducts = products.filter(
    (p) => !usedProductIds.includes(p._id)
  );

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let result = [...deals];
    
    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(fd => fd.status === statusFilter);
    }
    
    // Text filter
    if (filter) {
      const f = filter.toLowerCase();
      result = result.filter(
        (fd) =>
          fd?.productId?.pname?.toLowerCase().includes(f) ||
          fd?.status?.toLowerCase().includes(f)
      );
    }
    
    // Sort
    result.sort((a, b) => {
      const pnA = a?.productId?.pname?.toLowerCase() ?? "";
      const pnB = b?.productId?.pname?.toLowerCase() ?? "";
      return sortOrder === "asc" ? pnA.localeCompare(pnB) : pnB.localeCompare(pnA);
    });
    
    return result;
  }, [deals, filter, statusFilter, sortOrder]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedProduct || deals.length >= 3) return;
    try {
      await requestDealMutation.mutateAsync({ sellerId, productId: selectedProduct });
      setToast({ type: "success", message: "Flash deal requested successfully!" });
      setSelectedProduct("");
      setShowAddForm(false);
    } catch (err) {
      setToast({ type: "danger", message: typeof err === "string" ? err : err?.message || "Error requesting flash deal" });
    }
  };

  const handleDelete = async (flashDealId) => {
    if (!window.confirm("Are you sure you want to delete this flash deal request? You can add another product after deletion.")) {
      return;
    }
    try {
      await deleteDealMutation.mutateAsync({ sellerId, flashDealId });
      setToast({ type: "success", message: "Flash deal deleted successfully! You can now add another product." });
    } catch (err) {
      setToast({ type: "danger", message: typeof err === "string" ? err : err?.message || "Error deleting flash deal" });
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Group deals by status
  const pendingDeals = filteredDeals.filter(fd => fd.status === "pending");
  const approvedDeals = filteredDeals.filter(fd => fd.status === "approved");
  const rejectedDeals = filteredDeals.filter(fd => fd.status === "rejected");

  return (
    <motion.div className="modern-flashdeals-seller" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <style>{`
        .modern-flashdeals-seller {
          padding: 32px 3vw 6vw 3vw;
          min-height: 100vh;
          background: linear-gradient(145deg,#1d1c31 40%,#223147 100%);
        }
        .fd-seller-toolbar {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .fd-toolbar-title {
          font-size: 1.4rem; 
          font-weight: 800; 
          color: #00eaff;
          text-shadow: 0 3px 24px #00eaff11; 
          letter-spacing: 0.5px;
          display: flex; 
          align-items: center; 
          gap: 8px;
        }
        @media (min-width: 768px) {
          .fd-toolbar-title { font-size: 2rem; }
          .fd-seller-toolbar { gap: 20px; }
        }
        @media (max-width: 480px) {
          .fd-toolbar-title { font-size: 1.1rem; }
          .fd-seller-toolbar .admin-btn { 
            padding: 6px 10px !important; 
            font-size: 0.8rem !important;
          }
        }
        .fd-add-btn { /* deprecated, use admin-btn */ }
        .fd-sort-btn { /* deprecated, use admin-btn */ }
        .fd-table-glass {
          background: rgba(0,0,0,0.85)!important;
          border-radius: 16px;
          box-shadow: 0 6px 28px #29deff16;
          overflow: hidden;
        }
        .fd-table-glass th, .fd-table-glass td {
          backdrop-filter: blur(6px);
          color: #f2f6fa;
          white-space: nowrap;
          min-width: 160px;
          padding: 14px 18px !important;
          vertical-align: middle;
        }
        .fd-row-anim {
          transition: box-shadow 0.18s, background 0.15s;
        }
        .fd-row-anim:hover {
          background: #232d3b !important;
          box-shadow: 0 4px 20px #00eaff14 !important;
          outline: 2px solid #00eaff24;
        }
        .fd-status-badge {
          display: inline-block;
          min-width: 75px;
          padding: 6px 16px;
          border-radius: 22px;
          font-weight: 700;
          font-size: 0.97rem;
          text-transform: capitalize;
        }
        .fd-add-form {
          background: rgba(29, 42, 64, 0.81);
          border-radius: 13px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 3px 12px #1ad1e480;
        }
        .fd-add-form select {
          background: #0f1624;
          color: #f2f6fa;
          border: 1px solid #00eaff33;
        }
        .fd-add-form select option {
          background: #0f1624;
          color: #f2f6fa;
        }
        .fd-toast {
          position: fixed; top: 18px; right: 16px; z-index: 1400;
          background: rgba(14, 20, 30, 0.97);
          border: 1px solid #00eaff55;
          color: #e5e7eb; padding: 13px 17px; border-radius: 12px;
          box-shadow: 0 10px 28px #0007; min-width: 240px;
        }
        .fd-toast.success { border-color: #16e0a0; }
        .fd-toast.danger { border-color: #ff1a61; }
        .fd-action-btn {
          padding: 6px 16px;
          border-radius: 6px;
          font-weight: 600;
          border: none;
          color: #fff;
          transition: background 0.15s, transform 0.13s;
          font-size: 1rem;
          display: flex; align-items: center; gap: 7px;
          cursor: pointer;
        }
        .fd-action-delete { background: #ff1a61; }
        .fd-action-delete:hover { background: #d40033; transform: scale(1.05); }
        .premium-search-input::placeholder {
          color: #ffffff;
          opacity: 0.7;
        }
        
        .custom-select-container {
          position: relative;
        }
        .custom-select-trigger {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(0, 234, 255, 0.2);
          color: #f2f6fa;
          padding: 8px 15px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-select-trigger:hover {
          border-color: #00eaff;
        }
        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #101c28;
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 10px;
          z-index: 1000;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .custom-select-option {
          padding: 10px 15px;
          cursor: pointer;
          color: #cbd5e1;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .custom-select-option:hover {
          background: rgba(0, 234, 255, 0.1);
          color: #00eaff;
        }
        .custom-select-option.selected {
          background: rgba(0, 234, 255, 0.2);
          color: #00eaff;
          font-weight: 700;
        }
      `}</style>
      <div className="fd-seller-toolbar">
        <span className="fd-toolbar-title"><FaBolt /> My Flash Deals</span>
        <motion.button 
          className="admin-btn admin-btn-primary" 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={deals.length >= 3 || availableProducts.length === 0}
        >
          <FaPlus /> {showAddForm ? 'Cancel' : 'Request Flash Deal'}
        </motion.button>
      </div>
      
      {showAddForm && (
        <motion.div 
          className="fd-add-form"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Form onSubmit={handleAdd}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: '#00eaff', fontWeight: 600 }}>Select Product</Form.Label>
              <CustomSelect
                value={selectedProduct}
                options={[
                  { value: '', label: 'Choose a product...' },
                  ...availableProducts.map(p => ({ value: p._id, label: p.pname }))
                ]}
                onChange={val => setSelectedProduct(val)}
                label="Choose a product..."
              />
            </Form.Group>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button type="submit" variant="primary" disabled={!selectedProduct || deals.length >= 3}>
                <FaCheckCircle /> Request Flash Deal
              </Button>
              {deals.length >= 3 && (
                <span style={{ color: '#ffb340', fontWeight: 600 }}>Maximum 3 flash deals allowed</span>
              )}
            </div>
          </Form>
        </motion.div>
      )}

      <div className="fd-seller-filters" style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px', 
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Form.Control
            type="text"
            className="premium-search-input"
            placeholder="search here"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#f2f6fa',
              border: '1px solid rgba(0, 234, 255, 0.2)',
              borderRadius: '8px',
              paddingLeft: '15px'
            }}
          />
        </div>

        <CustomSelect
          value={statusFilter}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' }
          ]}
          onChange={(val) => setStatusFilter(val)}
        />

        <motion.button 
          className="admin-btn admin-btn-ghost" 
          whileTap={{ scale: 0.97 }} 
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          style={{ height: '38px', borderRadius: '8px' }}
        >
          {sortOrder === "asc" ? "↑ A-Z" : "↓ Z-A"}
        </motion.button>
      </div>

      {/* Pending Deals */}
      {pendingDeals.length > 0 && (
        <>
          <h4 style={{ color: '#ffb340', margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBolt /> Pending Requests ({pendingDeals.length})
          </h4>
          <Table striped bordered hover variant="dark" responsive className="fd-table-glass">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Status</th>
                <th>Requested</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {pendingDeals.map((fd, idx) => (
                  <motion.tr key={fd._id} className="fd-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                    <td>{idx + 1}</td>
                    <td><FaTag /> {fd.productId?.pname || 'Product'}</td>
                    <td>{fd.productId?.catid?.name || fd.productId?.catid?.cname || (typeof fd.productId?.catid === 'string' ? fd.productId.catid : '-')}</td>
                    <td>{fd.productId?.subcatid?.name || fd.productId?.subcatid?.scname || (typeof fd.productId?.subcatid === 'string' ? fd.productId.subcatid : '-')}</td>
                    <td><span className="fd-status-badge" style={{ background: statusColor(fd.status) }}>{fd.status}</span></td>
                    <td>{new Date(fd.createdAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-danger" 
                        onClick={() => handleDelete(fd._id)}
                        title="Delete"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        </>
      )}

      {/* Approved Deals */}
      {approvedDeals.length > 0 && (
        <>
          <h4 style={{ color: '#16e0a0', margin: '26px 0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheckCircle /> Approved Deals ({approvedDeals.length})
          </h4>
          <Table striped bordered hover variant="dark" responsive className="fd-table-glass">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Approved</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {approvedDeals.map((fd, idx) => (
                  <motion.tr key={fd._id} className="fd-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                    <td>{idx + 1}</td>
                    <td><FaTag /> {fd.productId?.pname || 'Product'}</td>
                    <td>{fd.productId?.catid?.name || fd.productId?.catid?.cname || (typeof fd.productId?.catid === 'string' ? fd.productId.catid : '-')}</td>
                    <td>{fd.productId?.subcatid?.name || fd.productId?.subcatid?.scname || (typeof fd.productId?.subcatid === 'string' ? fd.productId.subcatid : '-')}</td>
                    <td><span className="fd-status-badge" style={{ background: statusColor(fd.status) }}>{fd.status}</span></td>
                    <td>{fd.startDate ? new Date(fd.startDate).toLocaleDateString() : '-'}</td>
                    <td>{fd.endDate ? new Date(fd.endDate).toLocaleDateString() : '-'}</td>
                    <td>{fd.updatedAt ? new Date(fd.updatedAt).toLocaleString() : '-'}</td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-danger" 
                        onClick={() => handleDelete(fd._id)}
                        title="Delete"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        </>
      )}

      {/* Rejected Deals */}
      {rejectedDeals.length > 0 && (
        <>
          <h4 style={{ color: '#ff1a61', margin: '26px 0 10px' }}>Rejected Requests ({rejectedDeals.length})</h4>
          <Table striped bordered hover variant="dark" responsive className="fd-table-glass">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Status</th>
                <th>Requested</th>
                <th style={{ width: '120px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {rejectedDeals.map((fd, idx) => (
                  <motion.tr key={fd._id} className="fd-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                    <td>{idx + 1}</td>
                    <td><FaTag /> {fd.productId?.pname || 'Product'}</td>
                    <td><span className="fd-status-badge" style={{ background: statusColor(fd.status) }}>{fd.status}</span></td>
                    <td>{new Date(fd.createdAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="admin-btn admin-btn-danger" 
                        onClick={() => handleDelete(fd._id)}
                        title="Delete"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </Table>
        </>
      )}

      {filteredDeals.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '40px', color: '#b8ebff' }}
        >
          <FaBolt style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.2rem' }}>No flash deals yet. Request your first flash deal above!</p>
        </motion.div>
      )}

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
};

export default SellerFlashDeals;
