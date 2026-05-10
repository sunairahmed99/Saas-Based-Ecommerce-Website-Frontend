import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCopy, FaSearch } from 'react-icons/fa';
import { createCoupon, fetchCoupons, updateCoupon, deleteCoupon, toggleCouponStatus } from '../../Features/Backend/CouponSlice';
import ReusablePagination from '../ReusablePagination';
import './AdminCoupons.css';

const AdminCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading, error, pagination } = useSelector(state => state.coupons);

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    totalUsageLimit: '',
    usagePerUser: '1',
    isActive: true
  });

  useEffect(() => {
    dispatch(fetchCoupons({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscount: '',
      startDate: '',
      endDate: '',
      totalUsageLimit: '',
      usagePerUser: '1',
      isActive: true
    });
    setEditingCoupon(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingCoupon) {
      dispatch(updateCoupon({
        id: editingCoupon._id,
        updates: formData
      })).then(() => {
        resetForm();
        dispatch(fetchCoupons({ page: currentPage, limit: 10 }));
      });
    } else {
      dispatch(createCoupon(formData)).then(() => {
        resetForm();
        dispatch(fetchCoupons({ page: currentPage, limit: 10 }));
      });
    }
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      totalUsageLimit: coupon.totalUsageLimit || '',
      usagePerUser: coupon.usagePerUser || '1',
      isActive: coupon.isActive
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      dispatch(deleteCoupon(id)).then(() => {
        dispatch(fetchCoupons({ page: currentPage, limit: 10 }));
      });
    }
  };

  const handleToggleStatus = (id) => {
    dispatch(toggleCouponStatus(id)).then(() => {
      dispatch(fetchCoupons({ page: currentPage, limit: 10 }));
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    alert('Coupon code copied to clipboard!');
  };

  const filteredCoupons = (coupons || []).filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-coupons animated-container">
      <div className="coupons-header-row">
        <div className="admin-coupons-title">Coupon Management 🎟️</div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add Coupon
        </button>
      </div>

      <div className="filter-section-card">
        <div className="search-wrapper" style={{ marginBottom: 0 }}>
          <FaSearch className="search-icon" style={{ left: '15px' }} />
          <input
            type="text"
            placeholder="🔍 Search coupons by code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '45px' }}
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="coupon-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER2024"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Discount Type *</label>
                  <CustomSelect
                    value={formData.discountType}
                    options={[
                      { value: 'percentage', label: 'Percentage' },
                      { value: 'fixed', label: 'Fixed Amount (PKR)' }
                    ]}
                    onChange={(val) => setFormData({...formData, discountType: val})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                    placeholder={formData.discountType === 'percentage' ? '10' : '500'}
                    min="0"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                    required
                  />
                  <small>{formData.discountType === 'percentage' ? '%' : 'PKR'}</small>
                </div>

                <div className="form-group">
                  <label>Minimum Order Amount</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                    placeholder="500"
                    min="0"
                  />
                  <small>PKR</small>
                </div>
              </div>

              {formData.discountType === 'percentage' && (
                <div className="form-group">
                  <label>Maximum Discount (Optional)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
                    placeholder="500"
                    min="0"
                  />
                  <small>PKR (for percentage discounts)</small>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    value={formData.totalUsageLimit}
                    onChange={(e) => setFormData({...formData, totalUsageLimit: e.target.value})}
                    placeholder="100"
                    min="1"
                  />
                  <small>Leave empty for unlimited</small>
                </div>

                <div className="form-group">
                  <label>Usage Per User</label>
                  <input
                    type="number"
                    value={formData.usagePerUser}
                    onChange={(e) => setFormData({...formData, usagePerUser: e.target.value})}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Optional description for the coupon"
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Create Coupon')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-responsive-container">
        <table className="glass-table coupons-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.map(coupon => (
              <tr key={coupon._id}>
                <td>
                  <div className="coupon-code-cell">
                    <span className="coupon-code">{coupon.code}</span>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(coupon.code)}
                      title="Copy code"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </td>
                <td>
                  <span className={`discount-type ${coupon.discountType}`}>
                    {coupon.discountType === 'percentage' ? '%' : 'PKR'}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>
                  {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : ' PKR'}
                </td>
                <td>
                  {coupon.minOrderAmount ? `PKR ${Number(coupon.minOrderAmount).toLocaleString()}` : 'No minimum'}
                </td>
                <td className="usage-cell">
                  <div className="usage-info">
                    <div className="current-usage">{coupon.usageCount || 0}</div>
                    {coupon.totalUsageLimit && (
                      <div className="usage-limit">/ {coupon.totalUsageLimit}</div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${coupon.isActive ? 'active' : 'inactive'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ fontSize: '0.85rem' }}>
                  {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString() : 'No expiry'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="admin-btn admin-btn-warning"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleEdit(coupon)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleToggleStatus(coupon._id)}
                    >
                      {coupon.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCoupons.length === 0 && !loading && (
        <div className="no-data">
          No coupons found
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <ReusablePagination 
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default AdminCoupons;
