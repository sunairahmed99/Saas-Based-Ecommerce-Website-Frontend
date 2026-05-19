import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LoaderOverlay from "../LoaderOverlay";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaBox, FaCheckCircle, FaClock, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import { API_BASE_URL } from '../../config';
import ReusablePagination from "../ReusablePagination";

const API_BASE = `${API_BASE_URL}`;

const STATUS_FLOW = [
  "ready_for_pickup",
  "picked_up",
  "delivered",
  "cancelled_by_seller",
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
  return_requested: { label: "Return Requested", color: "#f59e0b" },
  return_approved: { label: "Return Approved", color: "#10b981" },
  return_rejected: { label: "Return Rejected", color: "#ef4444" },
  returned: { label: "Returned", color: "#f97316" },
  refunded: { label: "Refunded", color: "#22d3ee" },
};

const SellerOrders = () => {
  const seller = useSelector(selectSeller);
  const sellerId = seller?.data?._id || seller?._id;
  const [updatingId, setUpdatingId] = useState(null);
  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");
  const queryClient = useQueryClient();

  // Add state for filter & search
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: orders = [], isLoading: loading, error: queryError, refetch: loadOrders } = useQuery({
    queryKey: ['seller-orders', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const res = await axios.get(`${API_BASE}/checkout?sellerId=${sellerId}`, {
        headers: { auth_token: token },
      });
      return res.data?.data || [];
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (queryError) {
      setError(queryError?.response?.data?.message || "Unable to fetch orders for this seller.");
    } else {
      setError(null);
    }
  }, [queryError]);

  const CustomSelect = ({ value, options, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container">
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
    const url = `${API_BASE}/checkout/${orderId}/status`;
    const config = { headers: { auth_token: token } };
    try {
      return await axios.patch(url, { status, sellerId }, config);
    } catch (err) {
      const maybeCannotPatch =
        err?.response?.status === 404 ||
        err?.response?.status === 405 ||
        (typeof err?.response?.data === "string" && err.response.data.includes("Cannot"));
      if (maybeCannotPatch) {
        return await axios.post(url, { status, sellerId }, config);
      }
      throw err;
    }
  };

  // Legacy loadOrders has been migrated to useQuery hook

  const printOrderSlip = async (orderId) => {
    try {
      // Make authenticated request to get the HTML content
      const response = await axios.get(`${API_BASE}/checkout/${orderId}/slip/export`, {
        headers: { auth_token: token },
        responseType: 'text' // Get HTML as text
      });

      // Open the HTML content in a new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(response.data);
        printWindow.document.close();
        printWindow.focus();

        // Auto-print after a short delay to ensure content loads
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        alert("Please allow popups for this site to print order slips.");
      }
    } catch (error) {
      console.error("Error printing order slip:", error);
      alert("Failed to generate order slip. Please try again.");
    }
  };

  const sendNotification = async (payload) => {
    try {
      await axios.post(`${API_BASE}/notifications`, payload, {
        headers: { auth_token: token },
      });
    } catch (err) {
      // non-blocking

    }
  };

  const normalizeStatus = (status) => (status || "pending").toLowerCase().replace(/\s+/g, "_");

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, nextStatus }) => {
      setUpdatingId(orderId);
      await updateOrderStatusRequest(orderId, nextStatus);
      if (nextStatus === "ready_for_pickup") {
        await sendNotification({
          to: "admin",
          type: "seller_ready",
          message: `Seller marked Order #${orderId?.slice?.(-6)} ready for pickup`,
          orderId,
          sellerId,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders', sellerId] });
    },
    onError: (err) => {
      setError(err?.response?.data?.message || "Failed to update status");
    },
    onSettled: () => {
      setUpdatingId(null);
    }
  });

  const updateStatus = (orderId, nextStatus) => {
    updateStatusMutation.mutate({ orderId, nextStatus });
  };

  const nextActions = (status) => {
    const s = normalizeStatus(status);
    // Seller can mark as ready for pickup or cancel directly from initial states
    if (["placed", "pending", "processing", "confirmed"].includes(s)) {
      return {
        ready: { label: "Ready for Pickup", next: "ready_for_pickup" },
        reject: { label: "Cancel Order", next: "cancelled_by_seller" },
      };
    }
    return null;
  };

  const paymentLabel = (order) => {
    const method = (order.paymentMethod || "").toUpperCase();
    const isCOD = method === "COD" || method === "CASH";
    return isCOD ? "COD" : "Prepaid";
  };

  // Add filtering logic, full status flow support:
  const filteredOrders = orders.filter(order => {
    const statusKey = (order.status || "pending").toLowerCase().replace(/\s+/g, "_");
    let matches = true;

    // Tab filtering removed for minimal UI

    if (filterStatus && statusKey !== filterStatus) matches = false;
    if (search) {
      const lowerSearch = search.toLowerCase();
      if (!(order._id?.toLowerCase().includes(lowerSearch) ||
        order.address?.fullName?.toLowerCase().includes(lowerSearch) ||
        order.address?.city?.toLowerCase().includes(lowerSearch))) {
        matches = false;
      }
    }
    return matches;
  });

  return (
    <div style={{ padding: "20px", minHeight: "94vh", background: "linear-gradient(135deg, #0a1428 0%, #0f1f3c 100%)" }}>
      <LoaderOverlay show={loading} message="Loading orders..." />

      {/* Minimal Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ 
          color: "#00eaff", 
          marginBottom: "0.5rem", 
          fontSize: '2rem', 
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '1.5px'
        }}>
          Order Management
        </h2>
        <div style={{ 
          width: '60px', 
          height: '4px', 
          background: '#00eaff', 
          margin: '0 auto', 
          borderRadius: '2px',
          boxShadow: '0 0 10px #00eaff88'
        }}></div>
      </div>

      <div className="orders-filter-bar">
        <div className="filter-item">
          <label className="filter-label">Status</label>
          <CustomSelect
            value={filterStatus}
            options={[
              { value: '', label: 'All Status' },
              ...STATUS_FLOW.map(st => ({ value: st, label: (st||'').replace(/_/g,' ').toUpperCase() }))
            ]}
            onChange={(val) => {
              setFilterStatus(val);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div className="filter-item search-item">
          <label className="filter-label">Search</label>
          <input
            type="text"
            className="premium-input"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="search here"
          />
        </div>

        {(!!filterStatus || !!search) && (
          <button className="clear-filter-btn" onClick={()=>{setFilterStatus(''); setSearch(''); setCurrentPage(1);}}>
            Clear Filters
          </button>
        )}
      </div>
      <style>{`
        .orders-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 25px;
          align-items: flex-end;
          background: rgba(15, 23, 42, 0.4);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(0, 234, 255, 0.1);
        }
        .filter-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .search-item {
          flex: 1;
          min-width: 250px;
        }
        .filter-label {
          font-weight: 700;
          color: #7cfafc;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .premium-select, .premium-input {
          background: #101c28;
          border: 1px solid rgba(0, 234, 255, 0.3);
          color: #e6f0fd;
          padding: 10px 15px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .premium-select:focus, .premium-input:focus {
          border-color: #00eaff;
          box-shadow: 0 0 10px rgba(0, 234, 255, 0.2);
        }
        .premium-input::placeholder {
          color: #ffffff;
          opacity: 0.7;
        }

        .custom-select-container {
          position: relative;
          width: 100%;
          min-width: 200px;
        }
        .custom-select-trigger {
          background: #101c28;
          border: 1px solid rgba(0, 234, 255, 0.3);
          color: #e6f0fd;
          padding: 10px 15px;
          border-radius: 10px;
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
        .clear-filter-btn {
          height: 45px;
          border: none;
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 0 20px;
          border-radius: 10px;
          fontWeight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .clear-filter-btn:hover {
          background: rgba(239, 68, 68, 0.25);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .orders-filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }
          .search-item {
            min-width: 100%;
          }
          .clear-filter-btn {
            width: 100%;
          }
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1rem;
        }
        .order-card {
          background: rgba(17, 25, 40, 0.75);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 1.5rem;
          color: #e2e8f0;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          transition: transform 0.3s ease;
        }
        .order-card:hover {
          transform: translateY(-5px);
          border-color: rgba(0, 234, 255, 0.3);
        }
        .order-head {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-weight: 800;
          color: #fff;
          align-items: center;
          font-size: 1.1rem;
        }
        .pill {
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.3);
        }
        .order-item {
          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 1rem;
          align-items: start;
          padding: 1rem;
          border-radius: 15px;
          background: rgba(255,255,255,0.03);
          margin-bottom: 0.75rem;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .order-item img {
          width: 70px;
          height: 70px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .order-item-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .order-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        @media (max-width: 480px) {
          .order-actions {
            grid-template-columns: 1fr;
          }
          .order-head {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
        .btn {
          padding: 0.8rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #0f172a;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
        }
        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.16);
          color: #e2e8f0;
        }
        .meta-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: rgba(226,232,240,0.85);
          font-size: 0.95rem;
          margin-bottom: 0.2rem;
        }
        .tab-btn {
          padding: 0.6rem 1.2rem;
          border: none;
          background: rgba(40, 60, 70, 0.76);
          color: #b2ceff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .tab-btn:hover {
          background: rgba(0, 234, 255, 0.1);
          color: #00eaff;
        }
        .tab-btn.active {
          background: #00eaff;
          color: #0f172a;
          border-color: #00eaff;
        }
        .orders-filter-bar select {
          background: #000000 !important;
          color: #e6f0fd !important;
          border: 1px solid #365266 !important;
          border-radius: 7px;
          padding: 6px 11px;
          font-weight: 600;
          min-width: 150px;
        }
        .orders-filter-bar select:focus {
          outline: 2px solid #00eaff;
        }
        .orders-filter-bar option {
          background: #000000 !important;
          color: #e6f0fd !important;
        }
      `}</style>
      {error && (
        <div style={{ marginBottom: "1rem", color: "#fca5a5" }}>{error}</div>
      )}
      <div className="orders-grid">
        {filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => {
          const statusKey = normalizeStatus(order.status);
          const statusMeta = STATUS_META[statusKey] || STATUS_META.pending;
          const sellerItems = (order.items || []).filter((it) => {
            const itemSellerId = it.sellerId?._id || it.sellerId;
            const match = itemSellerId?.toString() === sellerId?.toString();
            return match;
          });
          return (
            <div key={order._id} className="order-card">
              <div className="order-head">
                <span>Order #{order._id?.slice(-6)}</span>
                <span className="pill" style={{ borderColor: `${statusMeta.color}55`, color: statusMeta.color }}>
                  {statusMeta.label}
                </span>
              </div>
              <div className="meta-row"><FaClock /> {new Date(order.createdAt).toLocaleString()}</div>
              <div className="meta-row"><FaMapMarkerAlt /> {order.address?.fullName || "Customer"}</div>
              <div className="meta-row"><span>PKR</span> Payment: <strong style={{color:'#10b981'}}>{paymentLabel(order)}</strong></div>

              <div style={{ margin: "0.5rem 0 0.2rem", color: "#cbd5e1", fontWeight: 700 }}>Product Details</div>
              {sellerItems.map((it) => {
                const prod = it.productId;
                const pId = prod?._id || prod;
                return (
                  <div key={`${order._id}-${pId}`} className="order-item">
                    <img 
                      src={prod?.pimage1 || prod?.image || it.pimage1 || it.image || "https://via.placeholder.com/100?text=No+Image"} 
                      alt={it.name || prod?.pname || "Product"} 
                    />
                    <div className="order-item-info">
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: '1rem' }}>{it.name || prod?.pname || "Product"}</div>
                      <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                        {it.productId?.sku && <span style={{ marginRight: '8px' }}>SKU: {it.productId.sku}</span>}
                        {it.size && <span style={{ marginRight: '8px', padding: '1px 5px', background: '#1e293b', borderRadius: '4px' }}>Size: {it.size}</span>}
                        {it.color && <span style={{ padding: '1px 5px', background: '#1e293b', borderRadius: '4px' }}>Color: {it.color}</span>}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: '4px' }}>
                        Qty: <strong>{it.quantity}</strong> • PKR {Number(it.price || 0).toFixed(2)}
                      </div>
                      <div style={{ fontWeight: 800, color: "#fbbf24", marginTop: '4px', fontSize: '1rem' }}>
                        PKR {Number(it.total || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  );
                })}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem", fontWeight: 700 }}>
                <span>Total</span>
                <span>PKR {order.total}</span>
              </div>

              <div className="order-actions">
                <button className="btn btn-ghost" onClick={loadOrders} disabled={updatingId === order._id}>Refresh</button>
                {(() => {
                  const actions = nextActions(statusKey);
                  if (!actions) return null;
                  return (
                    <>
                      {actions.accept && (
                        <button
                          className="btn btn-primary"
                          disabled={updatingId === order._id}
                          onClick={() => updateStatus(order._id, actions.accept.next)}
                        >
                          {actions.accept.label}
                        </button>
                      )}
                      {actions.reject && (
                        <button
                          className="btn btn-ghost"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                          disabled={updatingId === order._id}
                          onClick={() => updateStatus(order._id, actions.reject.next)}
                        >
                          {actions.reject.label}
                        </button>
                      )}
                      {actions.ready && (
                        <button
                          className="btn btn-primary"
                          disabled={updatingId === order._id}
                          onClick={() => updateStatus(order._id, actions.ready.next)}
                        >
                          {actions.ready.label}
                        </button>
                      )}
                      <button
                        className="btn btn-ghost"
                        style={{ borderColor: "#22d3ee", color: "#22d3ee" }}
                        onClick={() => printOrderSlip(order._id)}
                        title="Print Order Slip"
                      >
                        🖨️ Print Slip
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {!filteredOrders.length && !loading && (
          <div style={{ color: "#94a3b8", textAlign: 'center', padding: '2rem' }}>No orders found for this seller.</div>
        )}
      <ReusablePagination 
        currentPage={currentPage}
        totalPages={Math.ceil(filteredOrders.length / itemsPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default SellerOrders;
