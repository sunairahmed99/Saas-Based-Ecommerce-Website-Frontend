import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import LoaderOverlay from "../Components/LoaderOverlay";
import { selectUser } from "../Features/Backend/UserSlice";
import { API_BASE_URL } from '../config';
import {
  FaBoxOpen,
  FaClipboardList,
  FaExclamationCircle,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaUndo,
} from "react-icons/fa";

const API_BASE = `${API_BASE_URL}`;

const statusStyles = {
  placed: { bg: "rgba(34,211,238,0.18)", color: "#22d3ee", label: "Placed" },
  pending: { bg: "rgba(251,191,36,0.18)", color: "#fbbf24", label: "Pending" },
  paid: { bg: "rgba(34,197,94,0.2)", color: "#22c55e", label: "Paid" },
  processing: { bg: "rgba(56,189,248,0.2)", color: "#38bdf8", label: "Processing" },
  confirmed: { bg: "rgba(251,191,36,0.18)", color: "#fbbf24", label: "Pending" },
  cancelled_by_seller: { bg: "rgba(239,68,68,0.2)", color: "#ef4444", label: "Cancelled" },
  ready_for_pickup: { bg: "rgba(34,197,94,0.2)", color: "#22c55e", label: "Ready for Pickup" },
  picked_up: { bg: "rgba(99,102,241,0.18)", color: "#6366f1", label: "Picked Up" },
  out_for_delivery: { bg: "rgba(249,115,22,0.2)", color: "#f97316", label: "Out for Delivery" },
  delivered: { bg: "rgba(34,197,94,0.2)", color: "#22c55e", label: "Delivered" },
  returned: { bg: "rgba(249,115,22,0.2)", color: "#f97316", label: "Returned" },
  refunded: { bg: "rgba(34,211,238,0.2)", color: "#22d3ee", label: "Refunded" },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const authHeaders = useMemo(() => {
    const rawToken =
      user?.token ||
      user?.data?.token ||
      localStorage.getItem("token");
    if (!rawToken) return {};
    const token = rawToken.replace(/^Bearer\s+/i, "");
    return { auth_token: token };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/checkout`, {
        headers: authHeaders,
      });
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err?.response?.data?.message || "Unable to load your orders right now.");
    } finally {
      setLoading(false);
    }
  };

  const canReturnOrder = (order) => {
    const status = (order.status || "").toLowerCase();
    if (status !== "delivered" && status !== "out_for_delivery") return false;
    const orderCreatedAt = new Date(order.createdAt);
    const now = new Date();
    const timeDiff = now - orderCreatedAt;
    return timeDiff <= 60 * 60 * 1000;
  };

  const formatDate = (iso) => {
    if (!iso) return "Just now";
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusStyle = (status) => {
    const key = status?.toLowerCase?.() || "placed";
    return statusStyles[key] || statusStyles.placed;
  };

  const handleReturnOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to return this order? Admin will process your refund.")) {
      return;
    }
    try {
      setLoading(true);
      const url = `${API_BASE}/checkout/${orderId}/status`;
      const config = { headers: authHeaders };
      try {
        await axios.patch(url, { status: "returned" }, config);
      } catch (err) {
        if (err?.response?.status === 404 || err?.response?.status === 405) {
          await axios.post(url, { status: "returned" }, config);
        } else {
          throw err;
        }
      }
      setError(null);
      await fetchOrders();
      alert("Return request submitted successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to submit return request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoaderOverlay show={loading} message="Loading your orders..." />
      <Navbar />
      <div className="orders-page">
        <style jsx>{`
          .orders-page {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 0 1.5rem 4rem 1.5rem;
            color: #fff;
            padding-top: 0 !important;
            margin-top: 0 !important;
            font-family: 'Inter', sans-serif;
          }
          .orders-shell {
            max-width: 1200px;
            margin: 0 auto;
            padding-top: 20px;
          }
          .orders-head {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-top: 10px;
          }
          .title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.6rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .refresh-btn {
            padding: 0.6rem 1.2rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
          }
          .refresh-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #3b82f6;
            transform: translateY(-1px);
          }
          .orders-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 1.5rem;
          }
          .order-card {
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 1.5rem;
            backdrop-filter: blur(12px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          }
          .order-top {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            align-items: flex-start;
            margin-bottom: 1rem;
          }
          .order-id {
            font-size: 1rem;
            font-weight: 800;
            color: #ffffff;
          }
          .status {
            padding: 0.3rem 0.8rem;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .order-meta {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.2rem;
            color: #94a3b8;
            font-size: 0.9rem;
          }
          .order-items {
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
          }
          .item-row {
            display: grid;
            grid-template-columns: 60px 1fr auto;
            gap: 1rem;
            align-items: center;
            padding: 0.8rem;
            border-radius: 14px;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .item-img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 10px;
          }
          .item-name {
            font-size: 0.9rem;
            font-weight: 700;
            color: #fff;
            margin: 0;
          }
          .item-meta {
            font-size: 0.8rem;
            color: #64748b;
          }
          .item-price {
            font-weight: 800;
            color: #fbbf24;
            font-size: 0.9rem;
          }
          @media (max-width: 768px) {
            .orders-page { padding-top: 0 !important; }
            .orders-shell { padding-top: 10px; }
            .orders-head {
              flex-direction: column;
              text-align: center;
              gap: 0.8rem;
              margin-bottom: 1.5rem;
            }
            .title {
              flex-direction: column;
              font-size: 1.3rem;
              gap: 0.3rem;
              justify-content: center;
            }
            .title span { font-size: 0.85rem !important; }
            .orders-grid { grid-template-columns: 1fr; gap: 1.2rem; }
            .order-card { padding: 1.2rem; }
          }
        `}</style>

        <div className="orders-shell">
          <div className="orders-head">
            <div className="title">
              <FaClipboardList /> My Orders
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
                {orders.length} {orders.length === 1 ? "order" : "orders"}
              </span>
            </div>
            <button className="refresh-btn" onClick={fetchOrders} disabled={loading}>
              Refresh
            </button>
          </div>

          {error && (
            <div className="error-box">
              <FaExclamationCircle size={18} />
              <div>
                <div style={{ fontWeight: 700 }}>Something went wrong</div>
                <div style={{ fontSize: "0.95rem" }}>{error}</div>
              </div>
            </div>
          )}

          {orders.length === 0 && !loading ? (
            <div className="empty-state">
              <FaBoxOpen className="empty-icon" />
              <h2 style={{ margin: "0 0 0.4rem 0", color: "#fff" }}>No orders yet</h2>
              <p style={{ margin: "0 0 1.1rem 0" }}>Place your first order to see it here.</p>
              <button
                className="refresh-btn"
                style={{ borderColor: "#fbbf24", color: "#fbbf24", background: "rgba(251,191,36,0.12)" }}
                onClick={() => navigate("/shop")}
              >
                <FaShoppingBag style={{ marginRight: "0.4rem" }} />
                Shop Now
              </button>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order) => {
                const displayStatus = order.status || 'pending';
                const paymentMethod = order.payment?.method || 'cod';
                const statusStyle = getStatusStyle(displayStatus);
                const orderIdShort = order._id ? order._id.slice(-6) : "—";
                const items = order.items || [];
                return (
                  <motion.div
                    key={order._id}
                    className="order-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="order-top">
                      <div>
                        <div className="order-id">Order #{orderIdShort}</div>
                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <span
                        className="status"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.color}44`,
                        }}
                      >
                        {statusStyle.label || displayStatus || "Placed"}
                      </span>
                    </div>

                    <div className="order-meta">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FaMapMarkerAlt /> {order.address?.city || order.address?.line1 || "Address on file"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>PKR</span> Total: PKR {order.total || order.amount || 0}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <FaClipboardList />
                        Payment: {(order.payment?.method || paymentMethod).toUpperCase()}
                      </div>
                    </div>

                    <div className="order-items">
                      {items.map((item, idx) => {
                        const product = item.productId || item.product || {};
                        const name = product.pname || product.name || item.name || item.productName || "Product";
                        const image =
                          product.pimage1 ||
                          product.image ||
                          item.image ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI2NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==";
                        const qty = item.quantity || 1;
                        const price = item.total || item.price || 0;
                        return (
                          <div key={`${order._id}-${idx}`} className="item-row">
                            <img src={image} alt={name} className="item-img" />
                            <div className="item-info">
                              <div className="item-name">{name}</div>
                              <div className="item-meta">Qty: {qty}</div>
                            </div>
                            <div className="item-price">PKR {price}</div>
                          </div>
                        );
                      })}
                    </div>

                    {canReturnOrder(order) && (
                      <div style={{ marginTop: "1.2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <button
                          className="return-btn"
                          onClick={() => handleReturnOrder(order._id)}
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "0.8rem",
                            borderRadius: "12px",
                            border: "1px solid #f97316",
                            background: "transparent",
                            color: "#f97316",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            transition: "all 0.3s",
                          }}
                        >
                          <FaUndo /> Return Order
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
