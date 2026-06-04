import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAdminQuery, adminQueryKeys, useQueryClient } from '../../hooks/useAdminApi';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCopy, FaSearch } from 'react-icons/fa';
import ReusablePagination from '../ReusablePagination';
import './AdminCoupons.css';

const AdminCoupons = () => {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: couponsData, isLoading, error: queryError } = useAdminQuery({
    queryKey: adminQueryKeys.coupons(currentPage),
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/coupon?page=${currentPage}&limit=10`);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const coupons = couponsData?.data || [];
  const pagination = couponsData?.pagination;

  const createCouponMutation = useMutation({
    mutationFn: async (couponData) => {
      const res = await axios.post(`${API_BASE_URL}/coupon`, couponData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); // prefix match all pages
    }
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await axios.put(`${API_BASE_URL}/coupon/${id}`, updates);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); // prefix match all pages
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${API_BASE_URL}/coupon/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); // prefix match all pages
    }
  });

  const toggleCouponStatusMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(`${API_BASE_URL}/coupon/${id}/toggle`, {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); // prefix match all pages
    }
  });

  const loading = isLoading || createCouponMutation.isPending || updateCouponMutation.isPending || deleteCouponMutation.isPending || toggleCouponStatusMutation.isPending;
  const error = queryError?.response?.data?.message || queryError?.message || createCouponMutation.error?.response?.data?.message || createCouponMutation.error?.message || updateCouponMutation.error?.response?.data?.message || updateCouponMutation.error?.message || deleteCouponMutation.error?.response?.data?.message || deleteCouponMutation.error?.message || toggleCouponStatusMutation.error?.response?.data?.message || toggleCouponStatusMutation.error?.message || null;

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
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        startDate: formData.startDate ? formData.startDate : null,
        endDate: formData.endDate ? formData.endDate : null,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
        usagePerUser: formData.usagePerUser ? Number(formData.usagePerUser) : 1,
        isActive: formData.isActive
      };

      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({
          id: editingCoupon._id,
          updates: payload
        });
      } else {
        await createCouponMutation.mutateAsync(payload);
      }
      resetForm();
    } catch (err) {
      alert("Failed to save coupon: " + (err?.response?.data?.message || err?.message));
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCouponMutation.mutateAsync(id);
      } catch (err) {
        alert("Failed to delete coupon: " + (err?.response?.data?.message || err?.message));
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleCouponStatusMutation.mutateAsync(id);
    } catch (err) {
      alert("Failed to toggle coupon status: " + (err?.response?.data?.message || err?.message));
    }
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
                      title="Edit coupon"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleToggleStatus(coupon._id)}
                      title={coupon.isActive ? "Deactivate coupon" : "Activate coupon"}
                    >
                      {coupon.isActive ? <FaToggleOn /> : <FaToggleOff />}
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      onClick={() => handleDelete(coupon._id)}
                      title="Delete coupon"
                    >
                      <FaTrash />
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
