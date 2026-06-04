import React, { useMemo, memo } from "react";
import Charts from "./Chart";
import { motion } from "framer-motion";
import { useAdminQuery, adminQueryKeys } from "../../hooks/useAdminApi";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { FaWallet } from "react-icons/fa";
import "./Dashboard.css";

function AnimatedCounter({ value }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="dash-counter-value"
      style={{
        fontSize: '1.2rem',
        fontWeight: 800,
        color: '#00eaff',
        letterSpacing: '1px',
        filter: 'drop-shadow(0 0 10px #00eaff30)',
      }}
    >
      {value}
    </motion.span>
  );
}

const Dashboard = memo(() => {
  const { data: users = [] } = useAdminQuery({
    queryKey: adminQueryKeys.users,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/user/getall`);
      return res.data?.data || [];
    },
  });

  const { data: sellers = [] } = useAdminQuery({
    queryKey: adminQueryKeys.sellers,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/seller/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: products = [] } = useAdminQuery({
    queryKey: adminQueryKeys.products(false, undefined),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/product/getall`);
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useAdminQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/category/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: subcategories = [] } = useAdminQuery({
    queryKey: adminQueryKeys.subcategories,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/subcategory/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: analytics } = useAdminQuery({
    queryKey: adminQueryKeys.dashboardStats,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/analytics/dashboard`);
      return res.data?.data || res.data;
    },
  });

  const { data: profitAnalytics } = useAdminQuery({
    queryKey: adminQueryKeys.profitAnalytics,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/analytics/profit`);
      return res.data?.data || res.data;
    },
  });

  // Memoize calculated values
  const statsData = useMemo(() => ({
    totalUsers: users.length,
    totalSellers: sellers.length,
    totalProducts: products.length,
    totalCategories: categories.length,
    totalSubcategories: subcategories.length,
    totalRevenue: analytics?.overview?.totalRevenue || 0,
    totalProfit: analytics?.overview?.totalProfit || 0,
    totalAdminProfit: analytics?.overview?.totalAdminProfit || 0,
    totalOrders: analytics?.overview?.totalOrders || 0,
    deliveredOrders: analytics?.overview?.deliveredOrders || 0,
    pendingOrders: analytics?.overview?.pendingOrders || 0
  }), [users.length, sellers.length, products.length, categories.length, subcategories.length, analytics]);

  // Use memoized stats data
  const metrics = useMemo(() => ({
    users: statsData.totalUsers,
    sellers: statsData.totalSellers,
    products: statsData.totalProducts,
    categories: statsData.totalCategories,
    totalOrders: statsData.totalOrders,
    pendingOrders: statsData.pendingOrders,
    deliveredOrders: statsData.deliveredOrders,
    totalRevenue: statsData.totalRevenue,
    totalProfit: statsData.totalProfit,
    totalAdminProfit: statsData.totalAdminProfit,
    profitMargin: analytics?.overview?.profitMargin || 0,
    walletBalance: analytics?.wallet?.totalBalance || 0,
    walletUsers: analytics?.wallet?.activeUsers || 0
  }), [statsData, analytics]);
  return (
    <div className="modern-admin-dashboard">
      <div className="dashboard-title">
        <motion.span
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          Dashboard Overview
        </motion.span>
      </div>
      <div className="dashboard-cards">
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Users</div>
          <AnimatedCounter value={metrics.users} />
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Sellers</div>
          <AnimatedCounter value={metrics.sellers} />
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Products</div>
          <AnimatedCounter value={metrics.products} />
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Orders</div>
          <AnimatedCounter value={metrics.totalOrders} />
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Revenue</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>PKR</span>
            <AnimatedCounter value={Math.round(metrics.totalRevenue)} />
          </div>
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Profit</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>PKR</span>
            <AnimatedCounter value={Math.round(metrics.totalProfit)} />
          </div>
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Total Admin Profit</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>PKR</span>
            <AnimatedCounter value={Math.round(metrics.totalAdminProfit)} />
          </div>
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Profit Margin</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            <AnimatedCounter value={metrics.profitMargin.toFixed(1)} />
            <span style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#00eaff' }}>%</span>
          </div>
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Wallet Balance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FaWallet size={20} />
            <AnimatedCounter value={Math.round(metrics.walletBalance)} />
          </div>
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Pending Orders</div>
          <AnimatedCounter value={metrics.pendingOrders} />
        </motion.div>
        <motion.div className="dash-card" whileHover={{ scale: 1.03 }}>
          <div className="dash-card-label">Delivered Orders</div>
          <AnimatedCounter value={metrics.deliveredOrders} />
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
        <div style={{ marginTop: 30 }}>
          <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.65 }}>
            <Charts metrics={metrics} profitAnalytics={profitAnalytics} />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
});

export default Dashboard;
