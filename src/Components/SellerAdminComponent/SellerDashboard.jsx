import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaBox, FaCheckCircle, FaTimesCircle, FaChartLine, FaMoneyBillWave, FaUndoAlt, FaExclamationTriangle } from "react-icons/fa";
import LoaderOverlay from "../LoaderOverlay";
import "./SellerDashboard.css";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from 'chartjs-plugin-datalabels';;
import { API_BASE_URL } from '../../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const API_BASE = `${API_BASE_URL}`;

function AnimatedCounter({ value, prefix = "" }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      style={{
        fontSize: '1.3rem', // smaller for dashboard
        fontWeight: 800,
        color: '#00eaff',
        letterSpacing: '1px',
        filter: 'drop-shadow(0 2px 10px #00eaff40)',
      }}
    >
      {prefix}{value}
    </motion.span>
  );
}

const SellerDashboard = ({ setIsSidebarOpen }) => {
  const seller = useSelector(selectSeller);
  const sellerId = seller?.data?._id || seller?._id;



  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");
  const [timePeriod, setTimePeriod] = useState("all"); // daily, weekly, monthly, yearly, all, custom
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  const { data: orders = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['seller-orders', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const res = await axios.get(`${API_BASE}/checkout?sellerId=${sellerId}`, {
        headers: { auth_token: token },
      });
      return res.data.data || [];
    },
    enabled: !!sellerId,
    staleTime: 5 * 60 * 1000,
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (queryError) {
      setError(queryError?.response?.data?.message || "Unable to fetch orders");
    } else {
      setError(null);
    }
  }, [queryError]);

  // Filter orders by seller items and calculate metrics
  const sellerMetrics = useMemo(() => {
    if (!orders.length || !sellerId) {
      return {
        totalOrders: 0,
        totalRevenue: 0,
        totalRefunds: 0,
        grossProfit: 0,
        netProfit: 0,
        commission: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        returnOrders: 0,
        refundedOrders: [],
        dailySales: [],
        weeklySales: [],
        monthlySales: [],
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate period boundaries
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Filter orders based on selected time period
    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.created_at);

      switch (timePeriod) {
        case "daily":
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          return orderDate >= sevenDaysAgo;
        case "weekly":
          return orderDate >= weekStart;
        case "monthly":
          return orderDate >= monthStart;
        case "yearly":
          return orderDate >= new Date(new Date().getFullYear(), 0, 1);
        case "all":
          return true;
        case "custom":
          return orderDate.getFullYear() === parseInt(selectedYear) && 
                 orderDate.getMonth() === parseInt(selectedMonth);
        default:
          return true;
      }
    });

    let totalRevenue = 0;
    let totalRefunds = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let confirmedOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let returnOrders = 0;
    const refundedOrders = [];

    const dailySalesMap = {};
    const weeklySalesMap = {};
    const monthlySalesMap = {};
    const yearlySalesMap = {};

    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt || order.created_at);
      const orderDay = orderDate.toISOString().split('T')[0];
      const orderWeek = `${orderDate.getFullYear()}-W${Math.ceil((orderDate.getDate() + (orderDate.getDay() === 0 ? 7 : orderDate.getDay()) - 1) / 7)}`;
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const orderYear = `${orderDate.getFullYear()}`;

      // Filter items belonging to this seller
      const sellerItems = (order.items || []).filter(
        (item) => {
          const itemSellerId = item.sellerId?._id || item.sellerId;
          const sellerIdStr = typeof itemSellerId === 'string' ? itemSellerId : itemSellerId?.toString();
          return sellerIdStr === sellerId.toString();
        }
      );

      if (sellerItems.length === 0) return;

      const orderTotal = sellerItems.reduce((sum, item) => {
        const itemTotal = item.total || item.price * item.quantity || 0;
        return sum + itemTotal;
      }, 0);
      const orderStatus = (order.status || "pending").toLowerCase();

      // Count orders by status
      if (orderStatus === "pending" || orderStatus === "placed" || orderStatus === "processing") {
        pendingOrders++;
      } else if (orderStatus === "confirmed" || orderStatus === "seller_accepted" || orderStatus === "ready_for_pickup") {
        confirmedOrders++;
      } else if (orderStatus === "delivered") {
        deliveredOrders++;
        totalRevenue += orderTotal;
      } else if (orderStatus === "returned" || orderStatus === "return_requested" || orderStatus === "return_approved") {
        returnOrders++;
        if (orderStatus === "returned") {
          totalRefunds += orderTotal;
          refundedOrders.push({
            orderId: order._id,
            orderNumber: order.orderNumber || order._id,
            amount: orderTotal,
            date: orderDate,
            reason: order.returnReason || "Customer return",
            status: "Returned"
          });
        }
      } else if (orderStatus === "refunded" || orderStatus === "cancelled_by_seller" || orderStatus === "return_rejected") {
        cancelledOrders++;
        if (orderStatus === "refunded") {
          totalRefunds += orderTotal;
          refundedOrders.push({
            orderId: order._id,
            orderNumber: order.orderNumber || order._id,
            amount: orderTotal,
            date: orderDate,
            reason: order.refundReason || "Order cancelled/refunded",
            status: "Refunded"
          });
        }
      }

      totalOrders++;

      // Track sales by period (only delivered orders)
      if (orderStatus === "delivered") {
        dailySalesMap[orderDay] = (dailySalesMap[orderDay] || 0) + orderTotal;
        weeklySalesMap[orderWeek] = (weeklySalesMap[orderWeek] || 0) + orderTotal;
        monthlySalesMap[orderMonth] = (monthlySalesMap[orderMonth] || 0) + orderTotal;
        yearlySalesMap[orderYear] = (yearlySalesMap[orderYear] || 0) + orderTotal;
      }
    });

    // Calculate profit with admin commission (10%)
    const commissionRate = 0.10;
    const grossProfit = totalRevenue;
    const commission = totalRevenue * commissionRate;
    const netProfit = grossProfit - commission - totalRefunds;

    // Format sales data for charts
    const formatSalesData = (salesMap, period) => {
      const entries = Object.entries(salesMap).sort();
      if (period === "daily") {
        return entries.slice(-7).map(([date, amount]) => ({ date, amount }));
      } else if (period === "weekly") {
        return entries.slice(-4).map(([week, amount]) => ({ date: week, amount }));
      } else if (period === "yearly") {
        return entries.slice(-3).map(([year, amount]) => ({ date: year, amount }));
      } else if (period === "custom") {
        // For custom month, show daily breakdown for that month
        return entries.map(([date, amount]) => ({ date, amount }));
      } else {
        // For All Time, show the most significant trend (e.g., monthly for the last year or yearly if many years)
        return entries.slice(-12).map(([label, amount]) => ({ date: label, amount }));
      }
    };

    const result = {
      totalOrders,
      totalRevenue,
      totalRefunds,
      grossProfit,
      netProfit,
      commission: commission,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      cancelledOrders,
      returnOrders,
      refundedOrders,
      dailySales: formatSalesData(dailySalesMap, "daily"),
      weeklySales: formatSalesData(weeklySalesMap, "weekly"),
      monthlySales: formatSalesData(monthlySalesMap, "monthly"),
      yearlySales: formatSalesData(yearlySalesMap, "yearly"),
    };

    return result;
  }, [orders, sellerId, timePeriod, selectedYear, selectedMonth]);

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#cbd5e1',
          font: { family: "'Outfit', sans-serif", size: 12 },
          padding: 20,
          usePointStyle: true
        }
      },
      datalabels: {
        color: '#ffffff',
        font: {
          weight: 'bold',
          size: 12,
          family: "'Outfit', sans-serif"
        },
        formatter: (value, ctx) => {
          const datapoints = ctx.chart.data.datasets[0].data;
          const total = datapoints.reduce((acc, val) => acc + val, 0);
          if (total === 0) return '';
          const percentage = ((value / total) * 100).toFixed(0);
          const label = ctx.chart.data.labels[ctx.dataIndex];
          return `${label}\n${percentage}%`;
        },
        anchor: 'center',
        align: 'center',
        textAlign: 'center',
        display: (ctx) => {
          return ctx.dataset.data[ctx.dataIndex] > 0;
        },
        textShadowBlur: 4,
        textShadowColor: 'rgba(0,0,0,0.5)'
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 234, 255, 0.2)',
        bodyFont: { family: "'Outfit', sans-serif" }
      }
    }
  };

  const chartData = useMemo(() => {
    const salesData = timePeriod === "daily"
      ? sellerMetrics?.dailySales
      : timePeriod === "weekly"
      ? sellerMetrics?.weeklySales
      : timePeriod === "monthly"
      ? sellerMetrics?.monthlySales
      : sellerMetrics?.yearlySales;

    return {
      labels: (salesData || []).map((d) => d.date),
      datasets: [
        {
          data: (salesData || []).map((d) => d.amount),
          backgroundColor: [
            '#3b82f6', '#f97316', '#f43f5e', '#db2777', '#a855f7', '#8b5cf6', '#6366f1'
          ],
          borderColor: '#1e293b',
          borderWidth: 2
        },
      ],
    };
  }, [sellerMetrics, timePeriod]);

  const revenueVsRefundData = {
    labels: ["Revenue", "Refunds"],
    datasets: [
      {
        data: [
          sellerMetrics?.totalRevenue || 0,
          sellerMetrics?.totalRefunds || 0
        ],
        backgroundColor: ['#3b82f6', '#f97316'],
        borderColor: '#1e293b',
        borderWidth: 2
      },
    ],
  };

  const profitData = {
    labels: ["Revenue", "Comm.", "Refunds", "Net"],
    datasets: [
      {
        data: [
          sellerMetrics?.grossProfit || 0,
          sellerMetrics?.commission || 0,
          sellerMetrics?.totalRefunds || 0,
          sellerMetrics?.netProfit || 0
        ],
        backgroundColor: ['#3b82f6', '#a855f7', '#f43f5e', '#10b981'],
        borderColor: '#1e293b',
        borderWidth: 2
      },
    ],
  };

  const orderStatusData = {
    labels: ["Pending", "Confirmed", "Delivered", "Returns", "Cancelled"],
    datasets: [
      {
        data: [
          sellerMetrics?.pendingOrders || 0,
          sellerMetrics?.confirmedOrders || 0,
          sellerMetrics?.deliveredOrders || 0,
          sellerMetrics?.returnOrders || 0,
          sellerMetrics?.cancelledOrders || 0
        ],
        backgroundColor: ['#f97316', '#6366f1', '#10b981', '#a855f7', '#f43f5e'],
        borderColor: '#1e293b',
        borderWidth: 2
      },
    ],
  };

  const sellerName = (seller?.data?.name || seller?.name || seller?.storeName || seller?.email || '').split(' ')[0];

  if (loading) {
    return (
      <>
        <LoaderOverlay show={loading} message="Loading dashboard..." />
        <div style={{ minHeight: "94vh", background: "linear-gradient(128deg, #181c21 0%, #262a36 100%)" }} />
      </>
    );
  }

  return (
    <div className="seller-dashboard">

      <div className="dashboard-title">
        <span className="dashboard-title-text">
          {sellerName ? `${sellerName} Dashboard` : 'Dashboard'}
        </span>
        <div className="period-indicator">
          Showing data for: <span className="period-text">{timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}</span>
        </div>
      </div>

      <div className="period-selector">
        <button
          className={`period-btn ${timePeriod === "daily" ? "active" : ""}`}
          onClick={() => setTimePeriod("daily")}
        >
          Daily
        </button>
        <button
          className={`period-btn ${timePeriod === "weekly" ? "active" : ""}`}
          onClick={() => setTimePeriod("weekly")}
        >
          Weekly
        </button>
        <button
          className={`period-btn ${timePeriod === "monthly" ? "active" : ""}`}
          onClick={() => setTimePeriod("monthly")}
        >
          Monthly
        </button>
        <button
          className={`period-btn ${timePeriod === "yearly" ? "active" : ""}`}
          onClick={() => setTimePeriod("yearly")}
        >
          Yearly
        </button>
        <button
          className={`period-btn ${timePeriod === "all" ? "active" : ""}`}
          onClick={() => setTimePeriod("all")}
        >
          All Time
        </button>
        <button
          className={`period-btn ${timePeriod === "custom" ? "active" : ""}`}
          onClick={() => setTimePeriod("custom")}
        >
          Custom Select
        </button>
      </div>

      {timePeriod === "custom" && (
        <motion.div 
          className="custom-selectors"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className="selector-group">
            <label>Select Year:</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {Array.from({ length: 2035 - 2024 + 1 }, (_, i) => 2024 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="selector-group">
            <label>Select Month:</label>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="error-box">
          <FaTimesCircle style={{ marginRight: "0.5rem" }} />
          {error}
        </div>
      )}

      <div className="dashboard-cards">
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaBox /> Total Orders
          </div>
          <AnimatedCounter value={sellerMetrics?.totalOrders || 0} />
          <div className="dash-card-subtext">All time orders</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaMoneyBillWave /> Total Revenue
          </div>
          <AnimatedCounter value={Number(sellerMetrics?.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="PKR " />
          <div className="dash-card-subtext">From delivered orders</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaMoneyBillWave /> Gross Profit
          </div>
          <AnimatedCounter value={Number(sellerMetrics?.grossProfit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="PKR " />
          <div className="dash-card-subtext">From delivered orders</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaExclamationTriangle /> Admin Commission (10%)
          </div>
          <AnimatedCounter value={Number(sellerMetrics?.commission || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="PKR " />
          <div className="dash-card-subtext">Platform fee deducted</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaChartLine /> Net Profit
          </div>
          <AnimatedCounter value={Number(sellerMetrics?.netProfit || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="PKR " />
          <div className="dash-card-subtext">After commission & refunds</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaCheckCircle /> Delivered
          </div>
          <AnimatedCounter value={sellerMetrics?.deliveredOrders || 0} />
          <div className="dash-card-subtext">Completed orders</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaTimesCircle /> Refunds
          </div>
          <AnimatedCounter value={Number(sellerMetrics?.totalRefunds || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} prefix="PKR " />
          <div className="dash-card-subtext">Total refunded amount</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Pending Orders</div>
          <AnimatedCounter value={sellerMetrics?.pendingOrders || 0} />
          <div className="dash-card-subtext">Awaiting confirmation</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Confirmed Orders</div>
          <AnimatedCounter value={sellerMetrics?.confirmedOrders || 0} />
          <div className="dash-card-subtext">Ready for pickup</div>
        </motion.div>

        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">
            <FaTimesCircle /> Return Orders
          </div>
          <AnimatedCounter value={sellerMetrics?.returnOrders || 0} />
          <div className="dash-card-subtext">Items returned by customers</div>
        </motion.div>
      </div>

      {/* Refunded Orders Section */}
      {sellerMetrics?.refundedOrders?.length > 0 && (
        <motion.div
          className="refunded-orders-section"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="section-title">
            <FaUndoAlt /> Refunded Orders ({timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})
          </div>
          <div className="refunded-orders-table">
            <div className="table-header">
              <div>Order #</div>
              <div>Date</div>
              <div>Reason</div>
              <div>Status</div>
              <div>Amount</div>
            </div>
            {(sellerMetrics.refundedOrders || []).map((refund, index) => (
              <div key={refund.orderId || index} className="table-row">
                <div className="order-number">#{refund.orderNumber?.slice(-8)}</div>
                <div className="refund-date">{new Date(refund.date).toLocaleDateString()}</div>
                <div className="refund-reason">{refund.reason}</div>
                <div className={`refund-status ${refund.status.toLowerCase()}`}>
                  {refund.status}
                </div>
                <div className="refund-amount">PKR {Number(refund.amount).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="charts-section">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="chart-title">Sales Trends</div>
          <div className="chart-wrapper">
            {(chartData.datasets[0].data.some(d => d > 0)) ? (
              <Pie data={chartData} options={pieOptions} plugins={[ChartDataLabels]} />
            ) : (
              <div className="no-data-placeholder">No sales data for this period</div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="chart-title">Revenue vs Refunds</div>
          <div className="chart-wrapper">
            {(revenueVsRefundData.datasets[0].data.some(d => d > 0)) ? (
              <Pie data={revenueVsRefundData} options={pieOptions} plugins={[ChartDataLabels]} />
            ) : (
              <div className="no-data-placeholder">No revenue/refund data</div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <div className="chart-title">Revenue Breakdown</div>
          <div className="chart-wrapper">
            {(profitData.datasets[0].data.some(d => d > 0)) ? (
              <Pie data={profitData} options={pieOptions} plugins={[ChartDataLabels]} />
            ) : (
              <div className="no-data-placeholder">No profit data available</div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="chart-title">Order Status Distribution</div>
          <div className="chart-wrapper">
            {(orderStatusData.datasets[0].data.some(d => d > 0)) ? (
              <Pie data={orderStatusData} options={pieOptions} plugins={[ChartDataLabels]} />
            ) : (
              <div className="no-data-placeholder">No orders found for this period</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SellerDashboard;

