import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAdminQuery, adminQueryKeys, useQueryClient } from "../../hooks/useAdminApi";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { FaPlus, FaCoins, FaGift, FaUsers } from "react-icons/fa";
import ReusablePagination from "../ReusablePagination";

const AdminWallet = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('wallets');
  const [currentPage, setCurrentPage] = useState(1);
  const [couponsPage, setCouponsPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBonusModal, setShowBonusModal] = useState(false);

  const [bonusData, setBonusData] = useState({
    userId: '',
    points: '',
    description: ''
  });

  const { data: walletsData, isLoading: walletsLoading, error: walletsError } = useAdminQuery({
    queryKey: adminQueryKeys.wallets(currentPage),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/wallet/admin/all?page=${currentPage}&limit=20`);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const wallets = walletsData?.data || [];
  const walletPagination = walletsData?.pagination;

  const { data: couponsData, isLoading: couponsLoading, error: couponsError } = useAdminQuery({
    queryKey: adminQueryKeys.walletCoupons(couponsPage, statusFilter),
    queryFn: async () => {
      const statusParam = statusFilter !== 'all' ? `&status=${statusFilter}` : '';
      const res = await axios.get(`${API_BASE_URL}/wallet/admin/coupons?page=${couponsPage}&limit=20${statusParam}`);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'coupons',
  });

  const coupons = couponsData?.data || [];
  const couponsPagination = couponsData?.pagination;

  const addBonusMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post(`${API_BASE_URL}/wallet/admin/add-bonus`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
    }
  });

  const loading = walletsLoading || (activeTab === 'coupons' && couponsLoading) || addBonusMutation.isPending;
  const error = (activeTab === 'wallets' ? walletsError?.response?.data?.message || walletsError?.message : couponsError?.response?.data?.message || couponsError?.message) || addBonusMutation.error?.response?.data?.message || addBonusMutation.error?.message || null;

  const CustomSelect = ({ value, options, onChange, label, style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container" style={{ width: '200px', ...style }}>
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const handleAddBonus = async (e) => {
    e.preventDefault();

    if (!bonusData.userId || !bonusData.points || bonusData.points <= 0) {
      alert('Please fill all required fields with valid data');
      return;
    }

    try {
      await addBonusMutation.mutateAsync(bonusData);
      setShowBonusModal(false);
      setBonusData({ userId: '', points: '', description: '' });
    } catch (err) {
      console.error('Error adding bonus points:', err);
      alert('Failed to add bonus points: ' + (err?.response?.data?.message || err?.message));
    }
  };

  const getCouponStatus = (coupon) => {
    if (coupon.isUsed) return 'Used';
    if (new Date(coupon.expiresAt) < new Date()) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Used': return '#10b981';
      case 'Expired': return '#ef4444';
      case 'Active': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-wallet animated-container">
      <div className="wallet-header-row">
        <div className="admin-wallet-title">Wallet & Rewards 💰</div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowBonusModal(true)}
        >
          <FaPlus /> Add Bonus
        </button>
      </div>

      {/* Stats Cards */}
      <div className="wallet-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-info">
            <h3>{wallets.length}</h3>
            <p>Total Users with Wallets</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCoins />
          </div>
          <div className="stat-info">
            <h3>{wallets.reduce((sum, w) => sum + w.totalPoints, 0)}</h3>
            <p>Total Points Issued</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaGift />
          </div>
          <div className="stat-info">
            <h3>{coupons.filter(c => !c.isUsed && new Date(c.expiresAt) > new Date()).length}</h3>
            <p>Active Coupons</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button
          className={`tab-btn ${activeTab === 'wallets' ? 'active' : ''}`}
          onClick={() => setActiveTab('wallets')}
        >
          User Wallets
        </button>
        <button
          className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setActiveTab('coupons')}
        >
          User Coupons
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'wallets' && (
          <div className="wallets-table">
            <div className="table-responsive-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Points</th>
                    <th>Spent</th>
                    <th>Last Coupon</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet._id}>
                    <td>
                      <div className="user-info">
                        <strong>{wallet.user?.name || 'Unknown'}</strong>
                        <br />
                        <small>{wallet.user?.email || 'No email'}</small>
                      </div>
                    </td>
                    <td>
                      <span className="points-badge">{wallet.totalPoints}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(wallet.totalSpent)}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {wallet.lastCouponGenerated.points || 0} pts
                      {wallet.lastCouponGenerated.generatedAt && (
                        <>
                          <br />
                          <small>{formatDate(wallet.lastCouponGenerated.generatedAt)}</small>
                        </>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(wallet.createdAt)}</td>
                    <td>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          setBonusData({...bonusData, userId: wallet.user._id});
                          setShowBonusModal(true);
                        }}
                        title="Add bonus points"
                      >
                        <FaPlus />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

            {wallets.length === 0 && !loading && (
              <div className="no-data">
                <p>No wallet data found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="coupons-section">
            <div className="filter-section-card">
              <div className="filters-row">
                <div className="filter-group">
                  <label className="filter-label">Filter by Status</label>
                  <CustomSelect
                    value={statusFilter}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'unused', label: 'Active' },
                      { value: 'used', label: 'Used' },
                      { value: 'expired', label: 'Expired' }
                    ]}
                    onChange={(val) => {
                      setStatusFilter(val);
                      setCouponsPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="table-responsive-container">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Expires</th>
                  </tr>
                </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id}>
                    <td>
                      <div className="user-info">
                        <strong>{coupon.user?.name || 'Unknown'}</strong>
                        <br />
                        <small>{coupon.user?.email || 'No email'}</small>
                      </div>
                    </td>
                    <td>
                      <code className="coupon-code">{coupon.code}</code>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {coupon.discountType === 'fixed'
                        ? formatCurrency(coupon.discountValue)
                        : `${coupon.discountValue}%`
                      }
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(getCouponStatus(coupon)) }}
                      >
                        {getCouponStatus(coupon)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{coupon.generatedFrom.replace('_', ' ').toUpperCase()}</td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(coupon.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

              {coupons.length === 0 && !loading && (
                <div className="no-data">
                  <p>No coupon data found</p>
                </div>
              )}
            </div>
        )}
      </div>

      {/* Pagination */}
      {activeTab === 'wallets' && walletPagination && walletPagination.totalPages > 1 && (
        <ReusablePagination 
          currentPage={currentPage}
          totalPages={walletPagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {activeTab === 'coupons' && couponsPagination && couponsPagination.totalPages > 1 && (
        <ReusablePagination 
          currentPage={couponsPage}
          totalPages={couponsPagination.totalPages}
          onPageChange={setCouponsPage}
        />
      )}

      {/* Bonus Points Modal */}
      {showBonusModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Bonus Points</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowBonusModal(false);
                  setBonusData({ userId: '', points: '', description: '' });
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddBonus} className="bonus-form">
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  value={bonusData.userId}
                  onChange={(e) => setBonusData({...bonusData, userId: e.target.value})}
                  placeholder="Enter user ID"
                  required
                />
              </div>

              <div className="form-group">
                <label>Points</label>
                <input
                  type="number"
                  value={bonusData.points}
                  onChange={(e) => setBonusData({...bonusData, points: e.target.value})}
                  placeholder="Enter points to add"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={bonusData.description}
                  onChange={(e) => setBonusData({...bonusData, description: e.target.value})}
                  placeholder="Reason for bonus points"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowBonusModal(false);
                    setBonusData({ userId: '', points: '', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Bonus Points
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-wallet {
          padding: 0;
          background: transparent;
          min-height: auto;
        }

        .wallet-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .admin-wallet-title {
          margin: 0;
          color: #00eaff;
          font-size: 1.1rem !important;
          font-weight: 800;
          text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
        }

        @media (max-width: 768px) {
          .wallet-header-row { margin-bottom: 1.5rem; }
          .admin-wallet-title { font-size: 1.1rem !important; }
          .stat-card { padding: 1.2rem; gap: 1rem; }
          .stat-info h3 { font-size: 1.2rem; }
          .stat-icon { font-size: 1.2rem; padding: 0.6rem; }
        }

        .btn-primary {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background 0.3s ease;
        }

        .btn-primary:hover {
          background: #5a67d8;
        }

        .wallet-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #1f2937;
          padding: 2rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .stat-icon {
          font-size: 2rem;
          color: #667eea;
          background: #374151;
          padding: 1rem;
          border-radius: 12px;
        }

        .stat-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          color: #e5e7eb;
        }

        .stat-info p {
          margin: 0;
          color: #9ca3af;
          font-weight: 500;
        }

        .wallet-tabs {
          display: flex;
          margin-bottom: 2rem;
          border-bottom: 2px solid #374151;
        }

        .tab-btn {
          padding: 1rem 2rem;
          border: none;
          background: none;
          color: #9ca3af;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
        }

        .tab-btn.active,
        .tab-btn:hover {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 12px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .tab-content {
          background: transparent;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #374151;
          white-space: nowrap;
        }

        th {
          background: #111827;
          color: #e5e7eb;
          font-weight: 600;
        }

        td {
          color: #d1d5db;
        }

        .user-info strong {
          color: #e5e7eb;
        }

        .user-info small {
          color: #9ca3af;
        }

        .points-badge {
          background: #667eea;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .status-badge {
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .coupon-code {
          background: #374151;
          color: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
        }

        .btn-icon {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.3s ease;
        }

        .btn-icon:hover {
          background: #374151;
          color: #e5e7eb;
        }

        .filter-section {
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          background: #111827;
        }

        .filter-section label {
          color: #e5e7eb;
        }

        .filter-section select {
          padding: 8px 12px;
          border: 2px solid #374151;
          background: #1f2937;
          color: #e5e7eb;
          border-radius: 6px;
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
        }

        .pagination button {
          padding: 8px 16px;
          background: #374151;
          color: #e5e7eb;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .pagination button:hover:not(:disabled) {
          background: #4b5563;
        }

        .pagination button.active {
          background: #667eea;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: #1f2937;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2rem;
          border-bottom: 1px solid #374151;
        }

        .modal-header h3 {
          margin: 0;
          color: #e5e7eb;
        }

        .modal-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: background 0.3s ease;
        }

        .modal-close:hover {
          background: #374151;
          color: #e5e7eb;
        }

        .bonus-form {
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #e5e7eb;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #374151;
          background: #111827;
          color: #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #374151;
        }

        .btn-secondary {
          background: #374151;
          color: #e5e7eb;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .error-message {
          background: #dc2626;
          color: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
        }

        .no-data {
          text-align: center;
          padding: 4rem 2rem;
          color: #9ca3af;
        }

        .not-used {
          color: #6b7280;
        }


        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Custom Select Styles */
        .custom-select-container {
          position: relative;
          z-index: 5;
        }

        .custom-select-trigger {
          background: #111827 !important;
          border: 1px solid #374151;
          color: #e5e7eb;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .custom-select-trigger:hover {
          border-color: #667eea;
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #1f2937;
          border: 1px solid #374151;
          border-radius: 6px;
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
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .custom-select-option.selected {
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AdminWallet;
