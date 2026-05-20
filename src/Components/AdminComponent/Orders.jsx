import React, { useEffect, useState } from "react";
import axios from "axios";
import LoaderOverlay from "../LoaderOverlay";
import { FaClock, FaMapMarkerAlt, FaUser } from "react-icons/fa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from '../../config';
import ReusablePagination from "../ReusablePagination";

const API_BASE = `${API_BASE_URL}`;

const STATUS_FLOW = [
  "placed",
  "pending",
  "processing",
  "confirmed",
  "cancelled_by_seller",
  "ready_for_pickup",
  "picked_up",
  "out_for_delivery",
  "delivered",
  "returned",
  "refunded",
];

const STATUS_META = {
  placed: { label: "Placed", color: "#22d3ee" },
  pending: { label: "Pending", color: "#fbbf24" },
  processing: { label: "Processing", color: "#38bdf8" },
  confirmed: { label: "Confirmed", color: "#22c55e" },
  cancelled_by_seller: { label: "Cancelled by Seller", color: "#ef4444" },
  ready_for_pickup: { label: "Ready for Pickup", color: "#22c55e" },
  picked_up: { label: "Picked Up", color: "#6366f1" },
  out_for_delivery: { label: "Out for Delivery", color: "#f97316" },
  delivered: { label: "Delivered", color: "#22c55e" },
  returned: { label: "Returned", color: "#f97316" },
  refunded: { label: "Refunded", color: "#22d3ee" },
};

const Orders = () => {
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSeller, setFilterSeller] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  const { data: sellers = [] } = useQuery({
    queryKey: ['sellers'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE}/seller/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: orders = [], isLoading: loading, error: queryError, refetch: loadOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login as admin to view orders.");
      const res = await axios.get(`${API_BASE}/checkout/admin`, {
        headers: { auth_token: token }
      });
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (queryError) {
      setError(queryError.response?.data?.message || queryError.message || "Failed to load orders");
    } else {
      setError(null);
    }
  }, [queryError]);

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

  const updateOrderStatusRequest = async (orderId, status) => {
    // primary PATCH; fallback to POST if server rejects PATCH (some hosts block it)
    const url = `${API_BASE}/checkout/${orderId}/status`;
    const token = localStorage.getItem("token");


    const config = {
      headers: {
        auth_token: token,
      },
    };

    try {
      const result = await axios.patch(url, { status }, config);
("Order status update success:", result.data);
      return result;
    } catch (err) {
      console.error("Order status update error:", err?.response?.data);
      const maybeCannotPatch =
        err?.response?.status === 404 ||
        err?.response?.status === 405 ||
        (typeof err?.response?.data === "string" && err.response.data.includes("Cannot"));
      if (maybeCannotPatch) {
        return await axios.post(url, { status }, config);
      }
      throw err;
    }
  };

  const normalizeStatus = (status) => (status || "placed").toLowerCase().replace(/\s+/g, "_");

  const sendNotification = async (payload) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE}/notifications`, payload, {
        headers: {
          auth_token: token,
        },
      });
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const refundMutation = useMutation({
    mutationFn: async ({ orderId, refundAmount, reason }) => {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login as admin to process refunds.");
      const response = await axios.post(`${API_BASE}/wallet/admin/refund`, {
        orderId,
        refundAmount: parseFloat(refundAmount),
        reason
      }, {
        headers: { auth_token: token },
      });
      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Failed to process refund");
      }
    },
    onSuccess: () => {
      alert("Refund processed successfully!");
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => {
      console.error("Refund processing error:", err);
      alert("Refund failed: " + (err?.message || "Failed to process refund"));
    }
  });

  const processRefund = (orderId, refundAmount, reason) => {
    refundMutation.mutate({ orderId, refundAmount, reason });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await updateOrderStatusRequest(orderId, status);
      if (["out_for_delivery", "delivered"].includes(status)) {
        await sendNotification({ to: "customer", type: status, orderId });
      }
      if (status === "pickup_assigned") {
        await sendNotification({ to: "seller", type: "pickup_assigned", orderId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => {
      console.error("Order update error:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to update order");
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const updateStatus = (orderId, status) => {
    setUpdatingId(orderId);
    updateStatusMutation.mutate({ orderId, status });
  };

  // Filtering logic
  const filteredOrders = orders.filter(order => {
    const statusKey = normalizeStatus(order.status);
    let matches = true;
    if (filterStatus && statusKey !== filterStatus) matches = false;

    const sellerObj =
      order.sellerId ||
      order.seller ||
      order.items?.find((it) => it?.sellerId)?.sellerId ||
      null;
    const sellerIdStr = String(sellerObj?._id || sellerObj || '');
    const sellerName = sellerObj?.name || order.sellerName || '';

    if (filterSeller && sellerIdStr !== String(filterSeller)) matches = false;
    if (search) {
      const lowerSearch = search.toLowerCase();
      const matchesSearch = 
        (order._id && order._id.toLowerCase().includes(lowerSearch)) ||
        (order.address?.fullName && order.address.fullName.toLowerCase().includes(lowerSearch)) ||
        (order.address?.city && order.address.city.toLowerCase().includes(lowerSearch)) ||
        sellerName.toLowerCase().includes(lowerSearch);
      if (!matchesSearch) matches = false;
    }
    return matches;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterSeller, search]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <LoaderOverlay show={loading} message="Loading orders..." />
      <style>{`
        .orders-filter-bar {
          display: flex;
          gap: 16px;
          margin-bottom: 22px;
          padding: 0;
          align-items: center;
          flex-wrap: wrap;
        }
        .orders-filter-bar select, .orders-filter-bar input {
          background: #262a36 !important;
          color: #e6f0fd !important;
          border-radius: 7px;
          border: 1.5px solid #365266;
          font-size: 1rem;
          font-weight: 600;
          padding: 8px 11px;
          outline: none;
        }
        .orders-filter-bar select option {
          background: #1a2232 !important;
          color: #e5e7eb !important;
        }
        .orders-filter-bar label {
          font-weight: 700;
          margin-right: 9px;
          color: #77eaff;
        }
        .admin-orders-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(24,28,33,1);
          color: #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          table-layout: auto;
          min-width: 1500px;
        }
        .table-container {
          width: 100%;
          overflow-x: auto;
          background: rgba(24,28,33,1);
          border-radius: 16px;
          border: 1px solid #35435577;
          margin-bottom: 2rem;
        }
        th, td { 
          padding: 1rem 1.2rem; 
          border-bottom: 1px solid #35435577; 
          font-size: 0.98rem; 
          text-align: left; 
          white-space: nowrap;
        }
          background: #19202b;
          font-weight: 800;
          text-transform: uppercase;
          color: #53e5ff;
          white-space: nowrap;
        }
        .admin-orders-table tbody tr:last-child td {
          border-bottom: none;
        }
        .admin-orders-table td.status-cell { min-width: 220px; }
        .admin-orders-table .actions-cell  { min-width: 360px; }
        .admin-orders-table .order-id { font-weight: 700; letter-spacing: 0.05em; color: #15ffe6; }
        .admin-orders-table .amount-cell { font-weight: 700; color: #0df0b7; }
        .admin-orders-table .status-pill { border-radius: 24px; padding: 0.23em 0.9em; font-weight: 700; font-size: 0.97em; margin-right: 0.5em; }
        .admin-orders-table select {
          background: #000000 !important;
          color: #e6f0fd !important;
          border: 1px solid #365266 !important;
          border-radius: 10px;
          padding: 8px 12px;
          min-width: 180px;
          max-width: 200px;
          font-size: 13px;
        }
        .admin-orders-table option {
          background: #000000 !important;
          color: #e6f0fd !important;
        }
        .admin-orders-table select:focus, .admin-orders-table select:active {
          outline: 2px solid #00eaff;
        }
        .status-cell-content {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .actions-cell {
          vertical-align: middle;
        }
        .action-stack {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .action-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 234, 255, 0.3);
        }

        .view-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .view-btn:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }

        .print-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .print-btn:hover {
          background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
        }

        .refund-btn {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .refund-btn:hover {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
        }

        .action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .action-btn:disabled:hover {
          transform: none;
          box-shadow: none;
        }

        /* Responsive dropdown styling */
        @media (max-width: 768px) {
          .admin-orders-table select {
            min-width: 150px;
            max-width: 170px;
            font-size: 12px;
            padding: 6px 8px;
          }

          .admin-orders-table td.status-cell {
            min-width: 180px;
          }
        }

        @media (max-width: 576px) {
          .admin-orders-table select {
            min-width: 130px;
            max-width: 150px;
            font-size: 11px;
            padding: 4px 6px;
          }

          .admin-orders-table td.status-cell {
            min-width: 160px;
          }
        }
        
        .orders-filter-bar input::placeholder {
          color: #ffffff;
          opacity: 0.7;
        }

        .custom-select-container {
          position: relative;
        }
        .custom-select-trigger {
          background: #262a36 !important;
          border: 1.5px solid #365266;
          color: #e6f0fd;
          padding: 8px 11px;
          border-radius: 7px;
          font-weight: 600;
          font-size: 1rem;
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
          background: #1a2232;
          border: 1.5px solid #365266;
          border-radius: 7px;
          z-index: 1000;
          max-height: 250px;
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
          background: rgba(0, 234, 255, 0.1);
          color: #00eaff;
        }
        .custom-select-option.selected {
          background: rgba(0, 234, 255, 0.2);
          color: #00eaff;
          font-weight: 700;
        }

        .admin-orders-title {
          color: #00eaff;
          font-size: 1.1rem !important;
          font-weight: 800;
          margin-bottom: 0;
          text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
        }

        .filter-section-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 234, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .search-wrapper { margin-bottom: 20px; }
        .search-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(0, 234, 255, 0.2) !important;
          color: #f8fafc !important;
          padding: 12px 20px !important;
          border-radius: 12px !important;
          width: 100%;
        }

        .filters-row {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-width: 180px;
        }

        .filter-group label {
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

        .admin-orders-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0 !important;
          min-width: 1600px;
        }

        .admin-orders-table th, .admin-orders-table td {
          white-space: nowrap;
          padding: 15px 20px;
          text-align: left;
        }

        .admin-orders-table th {
          background: rgba(0, 234, 255, 0.05) !important;
          color: #00eaff;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          padding: 18px 15px;
          border-bottom: 1px solid rgba(0, 234, 255, 0.1) !important;
          text-align: left;
          white-space: nowrap;
        }

        .admin-orders-table td {
          padding: 15px;
          color: #cbd5e1;
          font-size: 0.9rem;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .order-id-badge { color: #00eaff; font-weight: 700; font-family: monospace; }
        .amount-text { color: #10b981; font-weight: 700; }

        .order-items-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 150px;
          overflow-y: auto;
          padding-right: 5px;
        }
        .order-items-column::-webkit-scrollbar { width: 4px; }
        .order-items-column::-webkit-scrollbar-thumb { background: rgba(0, 234, 255, 0.2); border-radius: 10px; }

        .order-item-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.03);
          padding: 6px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .item-mini-img {
          width: 35px;
          height: 35px;
          object-fit: cover;
          border-radius: 4px;
        }
        .item-mini-info { display: flex; flex-direction: column; }
        .item-mini-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #f1f5f9;
          max-width: 150px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-mini-qty { font-size: 0.7rem; color: #94a3b8; }

        .orders-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
          width: 100%;
        }

        @media (max-width: 1000px) {
          .admin-orders-table { min-width: 1300px; }
          .table-responsive-container { overflow-x: auto; }
        }

        @media (max-width: 768px) {
          .orders-header-row {
            margin-bottom: 1.5rem;
            gap: 10px;
          }
          .admin-orders-title { font-size: 1.1rem !important; margin-bottom: 0; }
          .filters-row { grid-template-columns: 1fr; display: grid; gap: 15px; }
        }

        @media (max-width: 480px) {
          .orders-header-row {
            flex-direction: row;
            justify-content: space-between;
          }
          .admin-orders-title { font-size: 1.2rem !important; }
          .admin-btn-primary { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>
      <div className="orders-header-row">
        <div className="admin-orders-title">All Orders 📦</div>
        <button className="admin-btn admin-btn-primary" onClick={loadOrders} disabled={loading}>
          {loading ? '...' : 'Refresh All'}
        </button>
      </div>

      <div className="filter-section-card">
        <div className="search-wrapper">
          <label className="filter-label">Search Orders</label>
          <input
            className="search-input"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by Order ID, Customer Name, City or Seller..."
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>Status</label>
            <CustomSelect
              value={filterStatus}
              options={[
                { value: '', label: 'All Statuses' },
                ...STATUS_FLOW.map(st => ({ value: st, label: STATUS_META[st]?.label || st }))
              ]}
              onChange={(val) => setFilterStatus(val)}
            />
          </div>

          <div className="filter-group">
            <label>Seller</label>
            <CustomSelect
              value={filterSeller}
              options={[
                { value: '', label: 'All Sellers' },
                ...sellers.map(sel => ({ value: sel._id, label: sel.name || sel.storeName || sel.email || sel.phone }))
              ]}
              onChange={(val) => setFilterSeller(val)}
            />
          </div>

          <div className="filter-group action-group">
            <label>&nbsp;</label>
            {(!!filterSeller || !!filterStatus || !!search) ? (
              <button
                className="admin-btn admin-btn-danger w-100"
                onClick={()=> {setFilterSeller('');setFilterStatus('');setSearch('')}}
              >Clear Filters</button>
            ) : (
              <button className="admin-btn admin-btn-ghost w-100" disabled>Filters Active</button>
            )}
          </div>
        </div>
      </div>
      {error && <div style={{ color: "#fca5a5", marginBottom: "0.8rem" }}>{error}</div>}
      <div className="table-container">
        <table className="admin-orders-table">
        <thead>
          <tr>
            <th style={{ minWidth: '100px' }}>Order #</th>
            <th style={{ minWidth: '180px' }}>Date</th>
            <th style={{ minWidth: '200px' }}>Customer</th>
            <th style={{ minWidth: '250px' }}>Products Sold</th>
            <th style={{ minWidth: '180px' }}>Seller</th>
            <th style={{ minWidth: '100px' }}>Seller Img</th>
            <th style={{ minWidth: '120px' }}>Amount</th>
            <th style={{ minWidth: '120px' }}>Payment</th>
            <th style={{ minWidth: '220px' }}>Status</th>
            <th style={{ minWidth: '300px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentOrders.map((order) => {
            const statusKey = normalizeStatus(order.status);
            const meta = STATUS_META[statusKey] || STATUS_META.pending;
            const sellerObj =
              order.sellerId ||
              order.seller ||
              order.items?.find((it) => it?.sellerId)?.sellerId ||
              null;
            const sellerName =
              sellerObj?.name ||
              order.sellerName ||
              "Multiple / Unknown";
            const sellerImage =
              sellerObj?.image ||
              (typeof sellerObj === "object" && sellerObj !== null ? sellerObj.photo : null) ||
              null;
            return (
              <tr key={order._id}>
                <td className="order-id">{order._id?.slice(-6)}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
                <td>{order.address?.fullName || "Customer"}, {order.address?.city || ""}</td>
                <td>
                  <div className="order-items-column">
                    {order.items?.map((item, idx) => {
                      if (!item) return null;
                      return (
                        <div key={idx} className="order-item-mini">
                          <img 
                            src={item.image || item.productId?.pimage1 || "/placeholder.png"} 
                            alt={item.name || "Product"} 
                            className="item-mini-img"
                          />
                          <div className="item-mini-info">
                            <div className="item-mini-name" title={item.name || item.productId?.pname}>
                              {item.name || item.productId?.pname || "Product"}
                            </div>
                            <div className="item-mini-qty">Qty: {item.quantity || 1}</div>
                          </div>
                        </div>
                      );
                    })}
                    {!order.items?.length && <span style={{color: '#6c757d'}}>No items found</span>}
                  </div>
                </td>
                <td>{sellerName}</td>
                <td>
                  {sellerImage ? (
                    <img
                      src={sellerImage}
                      alt="seller"
                      style={{ width: 42, height: 42, objectFit: "cover", borderRadius: "50%", border: "1px solid #2dd4bf" }}
                    />
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#1f2937", color: "#a5f3fc", display: "grid", placeItems: "center", fontWeight: 700 }}>
                      {sellerName?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                  )}
                </td>
                <td className="amount-cell">PKR {order.total || 0}</td>
                <td>{(order.paymentMethod || "N/A").toUpperCase()}</td>
                <td className="status-cell">
                  <CustomSelect
                    value={statusKey}
                    options={STATUS_FLOW.map(s => ({ value: s, label: STATUS_META[s]?.label || s }))}
                    onChange={(val) => updateStatus(order._id, val)}
                  />
                </td>
                <td className="actions-cell">
                  <div className="action-stack">
                    <button
                      className="action-btn view-btn"
                      onClick={() => window.open(`/admin/order/${order._id}`, '_blank')}
                      title="View Order Details"
                    >
                      👁 View
                    </button>
                    <button
                      className="action-btn print-btn"
                      onClick={() => window.open(`${API_BASE}/checkout/${order._id}/slip`, '_blank')}
                      title="Print Invoice"
                    >
                      🖨 Print
                    </button>
                    {statusKey === 'delivered' && (
                      <button
                        className="action-btn refund-btn"
                        onClick={() => {
                          const refundAmount = order.total;
                          const reason = `Refund for order ${order._id}`;
                          if (window.confirm(`Process refund of PKR ${refundAmount} for order ${order._id}?`)) {
                            processRefund(order._id, refundAmount, reason);
                          }
                        }}
                        disabled={updatingId === order._id}
                        title="Process Refund"
                      >
                        ↩ Refund
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {!currentOrders.length && !loading && (
            <tr><td colSpan={10} style={{ color: "#94a3b8", textAlign: 'center', padding: 32 }}>No orders available.</td></tr>
          )}
        </tbody>
        </table>
      </div>
      <ReusablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Orders;
