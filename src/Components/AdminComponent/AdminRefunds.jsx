import React, { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAdminQuery, adminQueryKeys, useQueryClient } from '../../hooks/useAdminApi';
import axios from 'axios';
import { FaCheck, FaTimes, FaEye, FaCalendarAlt, FaUser, FaClipboardList, FaCoins, FaStore, FaTag } from 'react-icons/fa';
import ReusablePagination from '../ReusablePagination';
import { API_BASE_URL } from '../../config';
import './AdminRefunds.css';

const AdminRefunds = () => {
  const queryClient = useQueryClient();

  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: refundsData, isLoading: refundsLoading } = useAdminQuery({
    queryKey: adminQueryKeys.refunds,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/refund/all`);
      // Transform the data to match the expected format
      return (res.data?.data || []).map(refund => ({
        _id: refund._id,
        orderId: refund.orderId?.orderId || refund.orderId,
        userId: {
          name: refund.userId?.name || 'Unknown User',
          email: refund.userId?.email || ''
        },
        amount: refund.refundAmount,
        reason: refund.refundReason,
        status: refund.status,
        createdAt: refund.createdAt,
        items: refund.items?.map(item => item.name) || [],
        processedBy: refund.processedBy,
        processedAt: refund.processedAt,
        adminNotes: refund.adminNotes
      }));
    },
    staleTime: 10 * 60 * 1000,
  });

  const refunds = refundsData || [];

  const { data: refundStatsData, isLoading: statsLoading } = useAdminQuery({
    queryKey: adminQueryKeys.refundStats,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/refund/stats`);
      const stats = res.data?.data?.stats || {};
      return {
        totalRequests: res.data?.data?.totalRequests || 0,
        pendingRequests: res.data?.data?.pendingRequests || 0,
        processedRequests: res.data?.data?.processedRequests || 0,
        totalRefunded: stats.refunded?.totalAmount || 0
      };
    },
    staleTime: 10 * 60 * 1000,
  });

  const refundStats = refundStatsData || {
    totalRequests: refunds.length,
    pendingRequests: refunds.filter(r => r.status === 'pending').length,
    processedRequests: refunds.filter(r => r.status === 'refunded').length,
    totalRefunded: refunds.filter(r => r.status === 'refunded').reduce((sum, r) => sum + r.amount, 0)
  };

  const processRefundMutation = useMutation({
    mutationFn: async ({ id, body }) => {
      const res = await axios.post(`${API_BASE_URL}/refund/process/${id}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.refunds });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.refundStats });
    }
  });

  const loading = refundsLoading || statsLoading || processRefundMutation.isPending;

  const handleApproveRefund = (refund) => {
    setSelectedRefund(refund);
    setRefundAmount(refund.amount);
    setRefundReason('');
    setShowModal(true);
  };

  const handleProcessRefund = async () => {
    try {
      await processRefundMutation.mutateAsync({
        id: selectedRefund._id,
        body: {
          status: 'refunded',
          refundAmount: Number(refundAmount),
          adminNotes: refundReason
        }
      });
      setShowModal(false);
      setSelectedRefund(null);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund: ' + (error?.response?.data?.message || error?.message));
    }
  };

  const handleRejectRefund = async (refundId) => {
    if (!window.confirm('Are you sure you want to reject this refund request?')) return;

    try {
      await processRefundMutation.mutateAsync({
        id: refundId,
        body: {
          status: 'rejected',
          adminNotes: 'Rejected by administrator'
        }
      });
      setSelectedRefund(null);
    } catch (error) {
      console.error('Error rejecting refund:', error);
      alert('Failed to reject refund: ' + (error?.response?.data?.message || error?.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved':
      case 'refunded': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(refunds.length / itemsPerPage);
  const currentRefunds = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return refunds.slice(start, start + itemsPerPage);
  }, [refunds, currentPage]);

  return (
    <div className="admin-refunds animated-container">
      <div className="refunds-header-row">
        <div className="admin-refunds-title">Refund Management 💸</div>
        <div className="refund-stats-mini">
          <div className="mini-stat-item">
            <span className="mini-stat-number">{refundStats.pendingRequests}</span>
            <span className="mini-stat-label">Pending</span>
          </div>
          <div className="mini-stat-item">
            <span className="mini-stat-number">PKR {refundStats.totalRefunded.toLocaleString()}</span>
            <span className="mini-stat-label">Refunded</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading refunds...</div>
      ) : (
        <div className="table-responsive-container">
          <table className="glass-table refunds-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRefunds.map(refund => (
                <tr key={refund._id}>
                  <td>
                    <div className="order-info">
                      <div className="order-id">#{refund.orderId}</div>
                      <div className="order-items" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                        {refund.items.slice(0, 1).join(', ')}
                        {refund.items.length > 1 && ` +${refund.items.length - 1} more`}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name" style={{ fontWeight: 600 }}>
                        <FaUser style={{ color: '#00eaff', marginRight: '8px' }} />
                        {refund.userId.name}
                      </div>
                      <div className="customer-email" style={{ fontSize: '0.75rem', opacity: 0.6 }}>{refund.userId.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="amount" style={{ fontWeight: 700 }}>
                      <FaCoins style={{ color: '#f59e0b', marginRight: '8px' }} />
                      PKR {refund.amount}
                    </div>
                  </td>
                  <td>
                    <div className="status-badge" style={{ 
                      background: refund.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 
                                  refund.status === 'approved' || refund.status === 'refunded' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: refund.status === 'pending' ? '#f59e0b' : 
                             refund.status === 'approved' || refund.status === 'refunded' ? '#10b981' : '#ef4444',
                      border: `1px solid ${refund.status === 'pending' ? '#f59e0b40' : 
                                          refund.status === 'approved' || refund.status === 'refunded' ? '#10b98140' : '#ef444440'}`
                    }}>
                      {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {formatDate(refund.createdAt)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        onClick={() => setSelectedRefund(refund)}
                      >
                        <FaEye />
                      </button>
                      {refund.status === 'pending' && (
                        <>
                          <button
                            className="admin-btn admin-btn-success"
                            style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#10b981' }}
                            onClick={() => handleApproveRefund(refund)}
                          >
                            <FaCheck />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReusablePagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Refund Processing Modal */}
      {showModal && selectedRefund && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Process Refund</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="refund-details">
                <h4>Refund Details</h4>
                <div className="detail-row">
                  <span>Order ID:</span>
                  <span>{selectedRefund.orderId}</span>
                </div>
                <div className="detail-row">
                  <span>Customer:</span>
                  <span>{selectedRefund.userId.name}</span>
                </div>
                <div className="detail-row">
                  <span>Requested Amount:</span>
                  <span>PKR {selectedRefund.amount}</span>
                </div>
                <div className="detail-row">
                  <span>Reason:</span>
                  <span>{selectedRefund.reason}</span>
                </div>
              </div>

              <div className="refund-form">
                <h4>Processing Information</h4>
                <div className="form-group">
                  <label>Refund Amount (PKR)</label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    min="0"
                    max={selectedRefund.amount}
                  />
                </div>
                <div className="form-group">
                  <label>Refund Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund processing"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleProcessRefund}
                disabled={!refundAmount || !refundReason}
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && !showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Refund Details</h3>
              <button className="close-btn" onClick={() => setSelectedRefund(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="refund-details-full">
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <div className="detail-row">
                    <span>Order ID:</span>
                    <span>{selectedRefund.orderId}</span>
                  </div>
                  <div className="detail-row">
                    <span>Items:</span>
                    <span>{selectedRefund.items.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span>Order Amount:</span>
                    <span>PKR {selectedRefund.amount}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Customer Information</h4>
                  <div className="detail-row">
                    <span>Name:</span>
                    <span>{selectedRefund.userId.name}</span>
                  </div>
                  <div className="detail-row">
                    <span>Email:</span>
                    <span>{selectedRefund.userId.email}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Refund Information</h4>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedRefund.status) }}>
                      {selectedRefund.status.charAt(0).toUpperCase() + selectedRefund.status.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Reason:</span>
                    <span>{selectedRefund.reason}</span>
                  </div>
                  <div className="detail-row">
                    <span>Requested Date:</span>
                    <span>{formatDate(selectedRefund.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedRefund(null)}>
                Close
              </button>
              {selectedRefund.status === 'pending' && (
                <>
                  <button
                    className="btn-danger"
                    onClick={() => handleRejectRefund(selectedRefund._id)}
                  >
                    Reject Refund
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => handleApproveRefund(selectedRefund)}
                  >
                    Process Refund
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRefunds;
