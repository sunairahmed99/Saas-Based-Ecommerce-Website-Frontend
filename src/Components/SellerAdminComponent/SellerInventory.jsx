import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal, Alert, Tabs, Tab, Card, Row, Col, Badge } from "react-bootstrap";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { API_BASE_URL } from '../../config';
import ReusablePagination from "../ReusablePagination";

const API_BASE = `${API_BASE_URL}`;

function SellerInventory() {
  const dispatch = useDispatch();
  const seller = useSelector(selectSeller);
  const sellerData = seller?.data;

  const [activeTab, setActiveTab] = useState("overview");
  const [inventoryData, setInventoryData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stock update modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockUpdate, setStockUpdate] = useState({
    newStock: "",
    reason: "",
    notes: ""
  });

  // Bulk update modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState("");
  const [bulkResults, setBulkResults] = useState(null);

  // Reports data
  const [reports, setReports] = useState({
    summary: null,
    fastMoving: [],
    slowMoving: [],
    outOfStock: [],
    lowStock: []
  });

  // Initialize with empty arrays if undefined
  const safeReports = {
    summary: reports.summary || {},
    fastMoving: reports.fastMoving || [],
    slowMoving: reports.slowMoving || [],
    outOfStock: reports.outOfStock || [],
    lowStock: reports.lowStock || []
  };

  const exportReport = async (reportType, filename) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/inventory/reports/export?reportType=${reportType}&period=30`, {
        headers: {
          "auth_token": token
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setToast({ type: "success", message: `${filename} downloaded successfully` });
    } catch (error) {
      console.error("Export error:", error);
      setToast({ type: "danger", message: "Failed to export report. Please try again." });
    }
  };

  useEffect(() => {
    if (sellerData?._id) {
      loadInventoryData();
      loadAlerts();
      loadReports();
    }
  }, [sellerData]);

  // Force reload reports when inventory data changes
  useEffect(() => {
    if (sellerData?._id && inventoryData.length >= 0) {
      loadReports();
    }
  }, [inventoryData.length, sellerData]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/product/seller`, {
        headers: {
          "seller_id": sellerData._id,
          "auth_token": token
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setInventoryData(data.data || []);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      setToast({ type: "danger", message: "Failed to load inventory data" });
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/inventory/alerts`, {
        headers: {
          "auth_token": token
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data?.alerts || []);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  // Calculate product performance metrics from orders
  const calculateProductMetrics = async (periodDays = 30) => {
    try {
      const token = localStorage.getItem("token");
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      // Fetch orders for the seller using axios for consistency
      const ordersResponse = await axios.get(`${API_BASE}/checkout?sellerId=${sellerData?._id}`, {
        headers: { auth_token: token }
      });
      const orders = ordersResponse.data?.data || [];

      // Filter delivered orders within time period
      const deliveredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.created_at);
        return orderDate >= startDate && (order.status || "").toLowerCase() === "delivered";
      });

      // Aggregate product performance data
      const productStats = {};

      deliveredOrders.forEach(order => {
        const sellerItems = (order.items || []).filter(item => {
          const itemSellerId = item.sellerId?._id || item.sellerId;
          const currentSellerId = sellerData?._id || sellerData?.data?._id;
          return itemSellerId?.toString() === currentSellerId?.toString();
        });

        sellerItems.forEach(item => {
          const productId = item.productId?._id || item.productId;
          if (!productId) return;

          const quantity = item.quantity || 1;
          const revenue = item.total || (item.price * quantity) || 0;

          if (!productStats[productId]) {
            productStats[productId] = {
              productId: productId.toString(),
              productName: item.productId?.pname || item.name || 'Unknown Product',
              totalSold: 0,
              totalRevenue: 0,
              ordersCount: 0,
              lastSold: new Date(order.createdAt || order.created_at)
            };
          }

          productStats[productId].totalSold += quantity;
          productStats[productId].totalRevenue += revenue;
          productStats[productId].ordersCount += 1;

          const orderDate = new Date(order.createdAt || order.created_at);
          if (orderDate > productStats[productId].lastSold) {
            productStats[productId].lastSold = orderDate;
          }
        });
      });

      // Convert to arrays and calculate metrics
      const productArray = Object.values(productStats);

      // Fast moving: High sales volume in recent period
      const fastMoving = productArray
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10)
        .map(product => ({
          productId: product.productId,
          productName: product.productName,
          turnoverRate: product.totalSold,
          totalSold: product.totalSold,
          totalRevenue: product.totalRevenue
        }));

      // Slow moving: Low sales volume
      const slowMoving = productArray
        .filter(product => product.totalSold > 0)
        .sort((a, b) => a.totalSold - b.totalSold)
        .slice(0, 10)
        .map(product => ({
          productId: product.productId,
          productName: product.productName,
          totalSold: product.totalSold,
          lastSold: product.lastSold
        }));

      // Best performing: Highest revenue
      const bestProducts = productArray
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10)
        .map(product => ({
          productId: product.productId,
          productName: product.productName,
          totalSold: product.totalSold,
          totalRevenue: product.totalRevenue,
          averagePrice: product.totalSold > 0 ? product.totalRevenue / product.totalSold : 0
        }));

      // Worst performing: Lowest revenue (but sold at least 1 unit)
      const worstProducts = productArray
        .filter(product => product.totalSold > 0)
        .sort((a, b) => a.totalRevenue - b.totalRevenue)
        .slice(0, 10)
        .map(product => {
          // Get current stock for worst products
          const inventoryProduct = inventoryData.find(p => p._id === product.productId);
          return {
            productId: product.productId,
            productName: product.productName,
            totalSold: product.totalSold,
            totalRevenue: product.totalRevenue,
            currentStock: inventoryProduct?.totalStock || 0
          };
        });

      return {
        fastMoving,
        slowMoving,
        bestProducts,
        worstProducts
      };

    } catch (error) {
      console.error('Error calculating product metrics:', error);
      return {
        fastMoving: [],
        slowMoving: [],
        bestProducts: [],
        worstProducts: []
      };
    }
  };

  // Calculate seller metrics from orders (same as dashboard)
  const calculateSellerMetrics = async (periodDays = 30) => {
    try {
      const token = localStorage.getItem("token");
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      // Fetch orders for the seller using axios
      const ordersResponse = await axios.get(`${API_BASE}/checkout?sellerId=${sellerData?._id}`, {
        headers: { auth_token: token }
      });
      const orders = ordersResponse.data?.data || [];

      // Filter orders by time period
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt || order.created_at);
        return orderDate >= startDate;
      });

      let totalRevenue = 0;
      let totalOrders = 0;
      let totalStock = 0;
      let lowStockItems = 0;
      let productsCount = 0;

      // Calculate from delivered orders only
      filteredOrders.forEach((order) => {
        if ((order.status || "").toLowerCase() === "delivered") {
          const sellerItems = (order.items || []).filter(item => {
            const itemSellerId = item.sellerId?._id || item.sellerId;
            const currentSellerId = sellerData?._id || sellerData?.data?._id;
            return itemSellerId?.toString() === currentSellerId?.toString();
          });

          sellerItems.forEach(item => {
            const itemTotal = item.total || item.price * item.quantity || 0;
            totalRevenue += itemTotal;
          });

          if (sellerItems.length > 0) {
            totalOrders++;
          }
        }
      });

      // Get inventory data using axios
      const inventoryResponse = await axios.get(`${API_BASE}/product/seller`, {
        headers: {
          "seller_id": sellerData?._id,
          "auth_token": token
        }
      });
 
      if (inventoryResponse.data?.success) {
        const products = inventoryResponse.data.data || [];
          productsCount = products.length;
          products.forEach(product => {
            totalStock += product.totalStock || 0;
            if (product.totalStock <= (product.minStockAlert || 0) && product.totalStock > 0) {
              lowStockItems++;
            }
          });
        }

      return {
        overview: {
          totalProducts: productsCount,
          totalRevenue: totalRevenue,
          totalOrders: totalOrders,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        },
        inventory: {
          totalStock: totalStock,
          lowStockItems: lowStockItems,
        }
      };
    } catch (error) {
      console.error('Error calculating seller metrics:', error);
      return {
        overview: {
          totalProducts: inventoryData?.length || 0,
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        },
        inventory: {
          totalStock: 0,
          lowStockItems: 0,
        }
      };
    }
  };

  const loadReports = async () => {
    try {
      setReportsLoading(true);
      const token = localStorage.getItem("token");

      // Calculate summary data using same logic as dashboard - defaulting to all time (3650 days)
      const summaryData = await calculateSellerMetrics(3650);

 
      // Calculate product performance metrics from order data - defaulting to all time
      const productMetrics = await calculateProductMetrics(3650);

      const newReports = {
        summary: summaryData,
        ...productMetrics
      };

      setReports(newReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      setToast({ type: "danger", message: "Failed to load reports data" });
    } finally {
      setReportsLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/inventory/products/${selectedProduct._id}/stock`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "auth_token": token
        },
        body: JSON.stringify(stockUpdate)
      });

      const data = await response.json();
      if (data.success) {
        setToast({ type: "success", message: "Stock updated successfully" });
        setShowStockModal(false);
        loadInventoryData();
        loadAlerts();
      } else {
        setToast({ type: "danger", message: data.message || "Failed to update stock" });
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      setToast({ type: "danger", message: "Failed to update stock" });
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const updates = bulkUpdates.split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
          const [sku, variationSku, newStock, reason] = line.split(',');
          return {
            sku: sku?.trim(),
            variationSku: variationSku?.trim() || null,
            newStock: parseInt(newStock?.trim()),
            reason: reason?.trim() || "Bulk update"
          };
        })
        .filter(update => update.sku && !isNaN(update.newStock));

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/inventory/bulk-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth_token": token
        },
        body: JSON.stringify({ updates })
      });

      const data = await response.json();
      if (data.success) {
        setBulkResults(data.data);
        setToast({ type: "success", message: `Bulk update completed: ${data.data.successful} successful, ${data.data.failed} failed` });
        loadInventoryData();
        loadAlerts();
      } else {
        setToast({ type: "danger", message: data.message || "Bulk update failed" });
      }
    } catch (error) {
      console.error("Error in bulk update:", error);
      setToast({ type: "danger", message: "Bulk update failed" });
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/inventory/alerts/${alertId}/acknowledge`, {
        method: "PUT",
        headers: { "auth_token": token }
      });
      loadAlerts();
      setToast({ type: "success", message: "Alert acknowledged" });
    } catch (error) {
      setToast({ type: "danger", message: "Failed to acknowledge alert" });
    }
  };

  const getStockStatusColor = (product) => {
    if (product.stockType === "out_of_stock" || product.totalStock === 0) return "#dc3545";
    if (product.totalStock <= product.minStockAlert) return "#ffc107";
    return "#28a745";
  };

  const getStockStatusText = (product) => {
    if (product.stockType === "out_of_stock" || product.totalStock === 0) return "Out of Stock";
    if (product.totalStock <= product.minStockAlert) return "Low Stock";
    return "In Stock";
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <motion.div className="inventory-management" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <style>{`
        .inventory-management {
          padding: 32px 3vw 6vw 3vw;
          min-height: 100vh;
          background: linear-gradient(145deg,#1a1f2c 40%,#202d49 100%);
        }
        .inventory-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        .inventory-title {
          font-size: 2rem;
          font-weight: 800;
          color: #00eaff;
          letter-spacing: 1.2px;
          text-shadow: 0 3px 24px #00eaff25;
        }
        @media (max-width: 768px) {
          .inventory-title {
            font-size: 1.4rem;
          }
          .inventory-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
        .stats-card {
          background: rgba(0,0,0,0.85);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 1px solid rgba(0,234,255,0.2);
        }
        .stats-number {
          font-size: 2rem;
          font-weight: bold;
          color: #00eaff;
        }
        .alert-badge {
          background: #dc3545;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .report-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        .report-btn {
          padding: 12px 20px !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
          transition: all 0.3s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          background: rgba(255,255,255,0.03) !important;
          border-width: 1.5px !important;
        }
        .report-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          background: rgba(255,255,255,0.08) !important;
        }
        @media (max-width: 768px) {
          .report-buttons-grid {
            grid-template-columns: 1fr;
          }
        }
        .stock-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 0.9em;
        }
        .inventory-table {
          background: rgba(0,0,0,0.85);
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
        }
        .inventory-table th, .inventory-table td {
          white-space: nowrap !important;
          padding: 12px 15px !important;
          min-width: 120px;
          vertical-align: middle;
        }
        /* Specific column overrides for inventory */
        .inventory-table th:first-child, .inventory-table td:first-child {
          min-width: 200px; /* Product name needs more space */
        }
        .inventory-table th:nth-child(2), .inventory-table td:nth-child(2) {
          min-width: 140px; /* SKU */
        }
        .inventory-tabs {
          display: flex !important;
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
          border-bottom: 2px solid rgba(0, 234, 255, 0.1) !important;
          margin-bottom: 20px !important;
        }
        .inventory-tabs::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        .inventory-tabs .nav-link {
          color: #00eaff;
          border: none;
          background: transparent;
          white-space: nowrap !important;
          padding: 10px 20px !important;
          font-weight: 600;
        }
        .inventory-tabs .nav-link.active {
          background: rgba(0,234,255,0.2) !important;
          color: #00eaff !important;
          border-bottom: 2px solid #00eaff !important;
        }
      `}</style>

      <div className="inventory-header">
        <span className="inventory-title">📦 Inventory Management</span>
        <div>
          {/* Temporarily disabled - Bulk Update functionality */}
          {/* <Button
            variant="primary"
            onClick={() => setShowBulkModal(true)}
            style={{ marginRight: 10 }}
          >
            📤 Bulk Update
          </Button> */}
          <Button variant="success" onClick={loadInventoryData}>
            🔄 Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <Card.Title style={{ color: '#00eaff' }}>Total Products</Card.Title>
              <div className="stats-number">{inventoryData.length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <Card.Title style={{ color: '#ffc107' }}>Low Stock</Card.Title>
              <div className="stats-number">{inventoryData.filter(p => p.totalStock <= p.minStockAlert && p.totalStock > 0).length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <Card.Title style={{ color: '#dc3545' }}>Out of Stock</Card.Title>
              <div className="stats-number">{inventoryData.filter(p => p.totalStock === 0).length}</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stats-card">
            <Card.Body>
              <Card.Title style={{ color: '#28a745' }}>Active Alerts</Card.Title>
              <div className="stats-number">{alerts.length}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`alert alert-${toast.type} position-fixed`}
            style={{ top: 20, right: 20, zIndex: 1050, minWidth: 300 }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="inventory-tabs mb-4">
        <Tab eventKey="overview" title="📊 Overview">
          <Card className="stats-card">
            <Card.Body>
              <Table striped bordered hover variant="dark" responsive className="inventory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Current Stock</th>
                    <th>Status</th>
                    <th>Min Alert</th>
                    <th>Warehouse</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product, index) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                    <tr key={product._id}>
                      <td>{globalIdx}</td>
                      <td>{product.pname}</td>
                      <td>{product.sku}</td>
                      <td>{product.totalStock}</td>
                      <td>
                        <Badge
                          style={{
                            backgroundColor: getStockStatusColor(product),
                            color: 'white'
                          }}
                        >
                          {getStockStatusText(product)}
                        </Badge>
                      </td>
                      <td>{product.minStockAlert}</td>
                      <td>{product.warehouse || '-'}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setSelectedProduct(product);
                            setStockUpdate({ newStock: product.totalStock, reason: "", notes: "" });
                            setShowStockModal(true);
                          }}
                        >
                          ✏️ Update Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </Table>
              <ReusablePagination 
                currentPage={currentPage}
                totalPages={Math.ceil(inventoryData.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="alerts" title={`🚨 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ''}`}>
          <Card className="stats-card">
            <Card.Body>
              {alerts.length === 0 ? (
                <Alert variant="success">✅ No active alerts! Your inventory is well-stocked.</Alert>
              ) : (
                <Table striped bordered hover variant="dark" responsive className="inventory-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Alert Type</th>
                      <th>Current Stock</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert._id}>
                        <td>{alert.productName}</td>
                        <td>
                          <Badge variant={alert.alertType === 'out_of_stock' ? 'danger' : 'warning'}>
                            {alert.alertType.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td>{alert.currentStock}</td>
                        <td>{alert.message}</td>
                        <td>{new Date(alert.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => acknowledgeAlert(alert._id)}
                          >
                            ✓ Acknowledge
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="reports" title="📈 Reports & Analytics">
          <div className="report-buttons-grid">
            <Button
              variant="outline-success"
              className="report-btn"
              onClick={() => exportReport('summary', 'business_summary_report.csv')}
            >
              📊 Export Summary Report
            </Button>
            <Button
              variant="outline-primary"
              className="report-btn"
              onClick={() => exportReport('sales_report', 'sales_report.csv')}
            >
              📈 Export Sales Report
            </Button>
            <Button
              variant="outline-warning"
              className="report-btn"
              onClick={() => exportReport('profit_report', 'profit_report.csv')}
            >
              💰 Export Profit Report
            </Button>
            <Button
              variant="outline-info"
              className="report-btn"
              onClick={() => exportReport('best_products', 'best_products_report.csv')}
            >
              🏆 Export Best Products
            </Button>
          </div>

          <Row>
            <Col md={6}>
              <Card className="stats-card mb-4">
                <Card.Header style={{ color: '#28a745', fontWeight: 'bold' }}>📊 Business Summary</Card.Header>
                <Card.Body>
                  {reportsLoading ? (
                    <div style={{ textAlign: 'center', color: '#00eaff', padding: '20px' }}>
                      <div>Loading business summary...</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9em', lineHeight: '1.6', color: 'white' }}>
                      <div><strong>Total Products:</strong> {inventoryData.length}</div>
                      <div><strong>Total Revenue:</strong> PKR {Number(safeReports.summary?.overview?.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div><strong>Total Orders:</strong> {safeReports.summary?.overview?.totalOrders || 0}</div>
                      <div><strong>Avg Order Value:</strong> PKR {safeReports.summary?.overview?.averageOrderValue ? Number(safeReports.summary.overview.averageOrderValue).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                      <div><strong>Total Stock:</strong> {safeReports.summary?.inventory?.totalStock || 0} units</div>
                      <div><strong>Low Stock Items:</strong> {safeReports.summary?.inventory?.lowStockItems || 0}</div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              <Card className="stats-card mb-4">
                <Card.Header style={{ color: '#00eaff', fontWeight: 'bold' }}>⚡ Fast Moving Products</Card.Header>
                <Card.Body>
                  {safeReports.fastMoving?.length === 0 ? (
                    <p style={{ color: 'white' }}>No data available</p>
                  ) : (
                    safeReports.fastMoving?.slice(0, 5).map((product, index) => (
                      <div key={product.productId || index} style={{ marginBottom: 10 }}>
                        <strong style={{ color: 'white' }}>{index + 1}. {product.productName}</strong>
                        <br />
                        <small style={{ color: 'white' }}>
                          Turnover: {product.turnoverRate} units
                        </small>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="stats-card mb-4">
                <Card.Header style={{ color: '#ffc107', fontWeight: 'bold' }}>🐌 Slow Moving Products</Card.Header>
                <Card.Body>
                  {safeReports.slowMoving?.length === 0 ? (
                    <p style={{ color: 'white' }}>No data available</p>
                  ) : (
                    safeReports.slowMoving?.slice(0, 5).map((product, index) => (
                      <div key={product.productId || index} style={{ marginBottom: 10 }}>
                        <strong style={{ color: 'white' }}>{index + 1}. {product.productName}</strong>
                        <br />
                        <small style={{ color: 'white' }}>
                          Sold: {product.totalSold} units (90 days)
                        </small>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>

              <Card className="stats-card mb-4">
                <Card.Header style={{ color: '#17a2b8', fontWeight: 'bold' }}>🏆 Best Performing Products</Card.Header>
                <Card.Body>
                  {safeReports.bestProducts?.length === 0 ? (
                    <p style={{ color: '#6c757d' }}>No data available</p>
                  ) : (
                    safeReports.bestProducts?.slice(0, 5).map((product, index) => (
                      <div key={product.productId || index} style={{ marginBottom: 10 }}>
                        <strong>{index + 1}. {product.productName}</strong>
                        <br />
                        <small style={{ color: '#6c757d' }}>
                          Revenue: PKR {Number(product.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Sold: {product.totalSold} units
                        </small>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Card className="stats-card">
                <Card.Header style={{ color: '#dc3545', fontWeight: 'bold' }}>📉 Underperforming Products</Card.Header>
                <Card.Body>
                  {safeReports.worstProducts?.length === 0 ? (
                    <p style={{ color: '#6c757d' }}>No data available</p>
                  ) : (
                    <Table striped bordered hover variant="dark" responsive size="sm" className="inventory-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                          <th>Current Stock</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {safeReports.worstProducts?.slice(0, 10).map((product) => (
                          <tr key={product.productId}>
                            <td>{product.productName}</td>
                            <td>{product.totalSold}</td>
                            <td>PKR {Number(product.totalRevenue || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td>{product.currentStock}</td>
                            <td>
                              <Button size="sm" variant="outline-warning">
                                📈 Promote
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Stock Update Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'rgba(22,30,38,0.98)', color: '#00eaff' }}>
          <Modal.Title>Update Stock - {selectedProduct?.pname}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'rgba(22,30,38,0.98)', color: 'white' }}>
          <Form.Group className="mb-3">
            <Form.Label>New Stock Quantity</Form.Label>
            <Form.Control
              type="number"
              value={stockUpdate.newStock}
              onChange={(e) => setStockUpdate({...stockUpdate, newStock: e.target.value})}
              min="0"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Reason</Form.Label>
            <Form.Select
              value={stockUpdate.reason}
              onChange={(e) => setStockUpdate({...stockUpdate, reason: e.target.value})}
            >
              <option value="">Select reason</option>
              <option value="new_stock">New Stock Added</option>
              <option value="damage">Damage/Loss</option>
              <option value="correction">Stock Correction</option>
              <option value="return">Supplier Return</option>
              <option value="other">Other</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Notes (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={stockUpdate.notes}
              onChange={(e) => setStockUpdate({...stockUpdate, notes: e.target.value})}
              placeholder="Additional notes..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ background: 'rgba(22,30,38,0.98)' }}>
          <Button variant="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleStockUpdate}>Update Stock</Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: 'rgba(22,30,38,0.98)', color: '#00eaff' }}>
          <Modal.Title>Bulk Stock Update</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'rgba(22,30,38,0.98)', color: 'white' }}>
          <Alert variant="info">
            <strong>Format:</strong> SKU,VariationSKU,NewStock,Reason<br />
            <small>Example:<br />
            TS-RED-M,,50,New stock arrival<br />
            TSHIRT-001,RED-L,25,Restock<br />
            TSHIRT-001,BLUE-M,0,Damage</small>
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Update Data (one per line)</Form.Label>
            <Form.Control
              as="textarea"
              rows={10}
              value={bulkUpdates}
              onChange={(e) => setBulkUpdates(e.target.value)}
              placeholder="Enter bulk update data..."
            />
          </Form.Group>
          {bulkResults && (
            <Alert variant={bulkResults.failed > 0 ? "warning" : "success"}>
              <strong>Results:</strong> {bulkResults.successful} successful, {bulkResults.failed} failed
              {bulkResults.errors?.length > 0 && (
                <ul>
                  {bulkResults.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error.sku}: {error.error}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: 'rgba(22,30,38,0.98)' }}>
          <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleBulkUpdate}>Process Bulk Update</Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
}

export default SellerInventory;
