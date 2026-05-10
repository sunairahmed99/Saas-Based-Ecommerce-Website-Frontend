import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaChartLine, FaStore, FaBox, FaCalendarAlt, FaDownload, FaFilter } from 'react-icons/fa';
import { fetchProfitAnalytics, selectProfitAnalytics, selectDashboardStats } from '../../Features/Backend/AnalyticsSlice';
import ReusablePagination from '../ReusablePagination';
import './AdminProfitAnalytics.css';

const AdminProfitAnalytics = memo(() => {
  const dispatch = useDispatch();
  const profitData = useSelector(selectProfitAnalytics);
  const dashboardStats = useSelector(selectDashboardStats);
  const { loading, error } = useSelector(state => state.analytics);

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedSeller, setSelectedSeller] = useState('');
  const [sellerPage, setSellerPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const itemsPerPage = 10;

  // Memoize the fetch function
  const fetchAnalytics = useCallback(() => {
    dispatch(fetchProfitAnalytics(dateRange));
  }, [dispatch, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Memoize processed data
  const processedData = useMemo(() => {
    if (!profitData || !Array.isArray(profitData)) return { sellers: [], totals: {} };

    const sellers = profitData.map(item => ({
      ...item,
      totalRevenue: Number(item.totalRevenue) || 0,
      totalProfit: Number(item.totalProfit) || 0,
      totalAdminProfit: Number(item.totalAdminProfit) || 0,
      ordersCount: Number(item.ordersCount) || 0
    }));

    const totals = sellers.reduce((acc, seller) => ({
      totalRevenue: acc.totalRevenue + seller.totalRevenue,
      totalProfit: acc.totalProfit + seller.totalProfit,
      totalAdminProfit: acc.totalAdminProfit + seller.totalAdminProfit,
      totalOrders: acc.totalOrders + seller.ordersCount
    }), { totalRevenue: 0, totalProfit: 0, totalAdminProfit: 0, totalOrders: 0 });

    return { sellers, totals };
  }, [profitData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const overview = profitData?.overview || {};
  const sellerAnalytics = profitData?.sellerAnalytics || [];
  const productAnalytics = profitData?.productAnalytics || [];

  const totalProfit = overview.totalProfit || 0;
  const adminProfit = overview.totalAdminProfit || 0;
  const sellerProfit = totalProfit;

  // Pagination logic
  const totalSellerPages = Math.ceil(sellerAnalytics.length / itemsPerPage);
  const currentSellerItems = sellerAnalytics.slice((sellerPage - 1) * itemsPerPage, sellerPage * itemsPerPage);

  const sortedProducts = useMemo(() => {
    return [...productAnalytics].sort((a, b) => b.totalSold - a.totalSold);
  }, [productAnalytics]);

  const totalProductPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const currentProductItems = sortedProducts.slice((productPage - 1) * itemsPerPage, productPage * itemsPerPage);

  // Reset pages on range change
  useEffect(() => {
    setSellerPage(1);
    setProductPage(1);
  }, [dateRange]);

  if (loading) {
    return (
      <div className="admin-profit-analytics">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div>Loading profit analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-profit-analytics">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
          <div>Error loading profit analytics: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profit-analytics">
      <div className="profit-analytics-header-row">
        <div className="admin-profit-title">Profit Analytics 📈</div>
        <div className="analytics-controls">
          <div className="date-filter">
            <FaCalendarAlt className="filter-icon" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              placeholder="Start Date"
            />
            <span className="separator">-</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              placeholder="End Date"
            />
          </div>
          <button className="download-report-btn" onClick={() => window.print()}>
            <FaDownload /> Report
          </button>
        </div>
      </div>

      <div className="profit-stats-grid">
        <div className="profit-stat-card total-revenue">
          <div className="stat-card-icon"><FaChartLine /></div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Revenue</span>
            <span className="stat-card-value">{formatCurrency(overview.totalRevenue || 0)}</span>
          </div>
        </div>
        <div className="profit-stat-card total-profit">
          <div className="stat-card-icon"><FaStore /></div>
          <div className="stat-card-content">
            <span className="stat-card-label">Seller Profit (90%)</span>
            <span className="stat-card-value">{formatCurrency(totalProfit)}</span>
          </div>
        </div>
        <div className="profit-stat-card admin-profit">
          <div className="stat-card-icon"><FaBox /></div>
          <div className="stat-card-content">
            <span className="stat-card-label">Admin Profit (10%)</span>
            <span className="stat-card-value">{formatCurrency(adminProfit)}</span>
          </div>
        </div>
        <div className="profit-stat-card total-orders">
          <div className="stat-card-icon"><FaFilter /></div>
          <div className="stat-card-content">
            <span className="stat-card-label">Total Orders</span>
            <span className="stat-card-value">{overview.orderCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Seller Profit Analysis */}
        <div className="analytics-section">
          <h4 className="section-title">Seller Profit Analysis</h4>
          <div className="table-responsive-container">
            <table className="glass-table analytics-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '180px' }}>Seller Name</th>
                  <th style={{ minWidth: '120px' }}>Seller ID</th>
                  <th style={{ minWidth: '100px' }}>Orders</th>
                  <th style={{ minWidth: '140px' }}>Actual Price</th>
                  <th style={{ minWidth: '150px' }}>Commission (10%)</th>
                  <th style={{ minWidth: '120px' }}>Discount</th>
                  <th style={{ minWidth: '140px' }}>Final Profit</th>
                </tr>
              </thead>
              <tbody>
                {currentSellerItems.length > 0 ? (
                  currentSellerItems.map((seller) => {
                    const actualPrice = seller.totalRevenue;
                    const totalProfitBeforeSplit = (seller.totalRevenue - seller.totalCost);
                    const commission = totalProfitBeforeSplit * 0.10;
                    const discount = seller.totalCost > 0 ? Math.max(0, seller.totalRevenue - seller.totalProfit - commission) : 0;
                    const finalProfit = seller.totalProfit;

                    return (
                      <tr key={seller.sellerId}>
                        <td>
                          <div className="seller-info">
                            <FaStore className="seller-icon" />
                            <span>{seller.sellerName}</span>
                          </div>
                        </td>
                        <td className="seller-id-cell">
                          {seller.sellerId}
                        </td>
                        <td>{seller.orderCount}</td>
                        <td>{formatCurrency(actualPrice)}</td>
                        <td className="commission-cell">{formatCurrency(commission)}</td>
                        <td className="discount-cell">{formatCurrency(discount)}</td>
                        <td className="profit-cell">{formatCurrency(finalProfit)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No seller data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ReusablePagination 
            currentPage={sellerPage}
            totalPages={totalSellerPages}
            onPageChange={setSellerPage}
          />
        </div>

        {/* Top Selling Products */}
        <div className="analytics-section">
          <h4 className="section-title">Top Selling Products</h4>
          <div className="table-responsive-container">
            <table className="glass-table analytics-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>Product</th>
                  <th style={{ minWidth: '120px' }}>Units Sold</th>
                  <th style={{ minWidth: '140px' }}>Revenue</th>
                  <th style={{ minWidth: '140px' }}>Profit</th>
                  <th style={{ minWidth: '120px' }}>Margin</th>
                  <th style={{ minWidth: '100px' }}>Rank</th>
                </tr>
              </thead>
              <tbody>
                {currentProductItems.length > 0 ? (
                  currentProductItems.map((product, index) => {
                    const globalIdx = (productPage - 1) * itemsPerPage + index + 1;
                    return (
                      <tr key={product.productId}>
                        <td>
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                          </div>
                        </td>
                        <td className="units-sold">{product.totalSold}</td>
                        <td>{formatCurrency(product.totalRevenue)}</td>
                        <td className="profit-cell">{formatCurrency(product.totalProfit)}</td>
                        <td className="margin-cell">
                          {formatPercentage(product.totalRevenue > 0 ? (product.totalProfit / product.totalRevenue) * 100 : 0)}
                        </td>
                        <td className="rank-cell">
                          <span className={`rank rank-${globalIdx}`}>
                            #{globalIdx}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No product data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ReusablePagination 
            currentPage={productPage}
            totalPages={totalProductPages}
            onPageChange={setProductPage}
          />
        </div>
      </div>

      <div className="analytics-summary">
        <div className="summary-section">
          <h4>Dynamic Profit Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Total Revenue:</span>
              <span className="summary-value revenue">{formatCurrency(overview.totalRevenue || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Cost:</span>
              <span className="summary-value cost">{formatCurrency(overview.totalCost || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Gross Profit:</span>
              <span className="summary-value profit">{formatCurrency((overview.totalRevenue || 0) - (overview.totalCost || 0))}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Admin Commission (10%):</span>
              <span className="summary-value commission">{formatCurrency(((overview.totalRevenue || 0) - (overview.totalCost || 0)) * 0.10)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Net Seller Profit (90%):</span>
              <span className="summary-value profit">{formatCurrency(overview.totalProfit || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Average Order Value:</span>
              <span className="summary-value">{formatCurrency(overview.averageOrderValue || 0)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Orders:</span>
              <span className="summary-value">{overview.orderCount || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Items Sold:</span>
              <span className="summary-value">{overview.itemCount || 0}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Active Sellers:</span>
              <span className="summary-value">{sellerAnalytics.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Top Selling Product:</span>
              <span className="summary-value">
                {productAnalytics.length > 0
                  ? [...productAnalytics].sort((a, b) => b.totalSold - a.totalSold)[0].name
                  : 'N/A'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Best Performing Seller:</span>
              <span className="summary-value">
                {sellerAnalytics.length > 0
                  ? (() => {
                      const bestSeller = sellerAnalytics.reduce((prev, current) =>
                        (prev.totalProfit > current.totalProfit) ? prev : current
                      );
                      return `${bestSeller.sellerName} (${bestSeller.sellerId})`;
                    })()
                  : 'N/A'
                }
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Profit Margin:</span>
              <span className="summary-value margin">{formatPercentage(overview.profitMargin || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminProfitAnalytics;
