import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUserWallet,
  fetchUserCoupons,
} from "../Features/Backend/WalletSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../config";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import LoaderOverlay from "../Components/LoaderOverlay";
import { FaWallet, FaCoins, FaShoppingCart, FaGift, FaCalendarAlt, FaCopy, FaCheck } from "react-icons/fa";

const Wallet = () => {
  const dispatch = useDispatch();

  const queryClient = useQueryClient();
  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");

  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(null);
  const [showGenerateCoupon, setShowGenerateCoupon] = useState(false);
  const [pointsToSpend, setPointsToSpend] = useState(10);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [showPendingPointsDetails, setShowPendingPointsDetails] = useState(false);

  // Custom notification state
  const [notification, setNotification] = useState(null);

  const { data: wallet, isLoading: walletLoading, error: walletError } = useQuery({
    queryKey: ['user-wallet', token],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/wallet/user`, {
        headers: { auth_token: token }
      });
      return res.data?.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const { data: coupons = [], isLoading: couponsLoading, error: couponsError } = useQuery({
    queryKey: ['user-coupons', token],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/wallet/user/coupons`, {
        headers: { auth_token: token }
      });
      return res.data?.data || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const generateCouponMutation = useMutation({
    mutationFn: async ({ pointsToSpend }) => {
      const res = await axios.post(`${API_BASE_URL}/wallet/user/generate-coupon`, { pointsToSpend }, {
        headers: { auth_token: token }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wallet', token] });
      queryClient.invalidateQueries({ queryKey: ['user-coupons', token] });
      // Keep Redux in sync
      dispatch(fetchUserWallet());
      dispatch(fetchUserCoupons());
    }
  });

  const loading = walletLoading || couponsLoading;
  const error = walletError?.response?.data?.message || walletError?.message || couponsError?.response?.data?.message || couponsError?.message || generateCouponMutation.error?.response?.data?.message || generateCouponMutation.error?.message || null;

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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earned': return '🪙';
      case 'spent': return '💰';
      case 'bonus': return '🎁';
      default: return '💳';
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Custom notification function
  const showNotification = (message, type = 'success', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const handleGenerateCoupon = () => {
    if ((wallet?.totalPoints || 0) < 10) {
      showNotification('You need at least 10 points to generate a coupon!', 'error');
      return;
    }

    // Check if user already has a user-generated coupon
    if (coupons?.some(coupon => coupon.generatedFrom === 'user_generated')) {
      showNotification('You can only generate one coupon using points. You already have a user-generated coupon!', 'error');
      setShowGenerateCoupon(false);
      return;
    }

    setGeneratingCoupon(true);
    generateCouponMutation.mutate({ pointsToSpend: 10 }, {
      onSuccess: (result) => {
        showNotification(`🎉 Coupon generated successfully!\n\nCode: ${result.data?.couponCode || result.data?.coupon?.code}\nValue: PKR 400 off\nValid for 1 month\nMinimum order: PKR 500`, 'success', 6000);
        setShowGenerateCoupon(false);
      },
      onError: (err) => {
        showNotification('Failed to generate coupon: ' + (err?.response?.data?.message || err?.message || err), 'error');
      },
      onSettled: () => {
        setGeneratingCoupon(false);
      }
    });
  };




  const getNextRewardInfo = () => {
    if (!wallet) return null;

    const currentPoints = wallet.totalPoints;
    const nextThresholds = [10, 20, 30, 50].filter(t => t > currentPoints);

    if (nextThresholds.length === 0) {
      return { message: "🎉 Congratulations! You've reached all reward levels!", points: 0 };
    }

    const nextThreshold = Math.min(...nextThresholds);
    const pointsNeeded = nextThreshold - currentPoints;
    const amountNeeded = pointsNeeded * 500; // Since 10 points = PKR 5000 spent

    let reward = '';
    switch (nextThreshold) {
      case 10: reward = 'PKR 400 coupon'; break;
      case 20: reward = 'PKR 800 coupon'; break;
      case 30: reward = 'PKR 1200 coupon'; break;
      case 50: reward = 'PKR 2000 coupon'; break;
    }

    return {
      message: `Spend ${formatCurrency(amountNeeded)} more to earn ${pointsNeeded} points and get a ${reward}!`,
      points: pointsNeeded,
      amount: amountNeeded,
      reward: reward
    };
  };

  if (loading && !wallet) {
    return <LoaderOverlay show={true} message="Loading wallet..." />;
  }

  const rewardInfo = getNextRewardInfo();

  return (
    <>
      <Navbar />
      <div className="wallet-container">
        {/* Banner Section */}
        <div className="wallet-banner">
          <div className="banner-overlay" />
          <div className="banner-content">
            <span className="banner-badge">Personal Finance</span>
            <h2>My Wallet</h2>
            <p className="banner-subtitle">Track your points, rewards, and exclusive coupons</p>
          </div>
        </div>

        {/* Main Content */}
        <section className="wallet-main">
          <div className="container">
    {error && (
      <div className="error-message">
        <p>{error}</p>
        {error.includes('token') || error.includes('login') ? (
          <p>Please <a href="/login" style={{ color: '#667eea', textDecoration: 'underline' }}>login again</a> to access your wallet.</p>
        ) : null}
      </div>
    )}

            <div className="wallet-content">
              {/* Stats Cards */}
              <div className="wallet-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <FaCoins />
                  </div>
                  <div className="stat-info">
                    <h3>{wallet?.totalPoints || 0}</h3>
                    <p>Total Points</p>
                  </div>
                  {(wallet?.totalPoints || 0) >= 10 && !coupons?.some(coupon => coupon.generatedFrom === 'user_generated') && (
                    <button
                      className="generate-coupon-btn"
                      onClick={() => setShowGenerateCoupon(true)}
                      title="Generate coupon with points"
                    >
                      🎁 Generate Coupon
                    </button>
                  )}
                  {coupons?.some(coupon => coupon.generatedFrom === 'user_generated') && (
                    <div className="coupon-limit-notice">
                      <span className="limit-icon">✅</span>
                      <span className="limit-text">Coupon Already Generated</span>
                    </div>
                  )}
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FaShoppingCart />
                  </div>
                  <div className="stat-info">
                    <h3>{formatCurrency(wallet?.totalSpent || 0)}</h3>
                    <p>Total Spent</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">
                    <FaGift />
                  </div>
                  <div className="stat-info">
                    <h3>{coupons?.length || 0}</h3>
                    <p>Active Coupons</p>
                  </div>
                </div>
              </div>

              {/* Next Reward */}
              {rewardInfo && rewardInfo.points > 0 && (
                <div className="next-reward-card">
                  <div className="reward-icon">🎯</div>
                  <div className="reward-content">
                    <h4>Next Reward</h4>
                    <p>{rewardInfo.message}</p>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min((wallet?.totalPoints / (wallet?.totalPoints + rewardInfo.points)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <p className="progress-text">
                      {wallet?.totalPoints} / {wallet?.totalPoints + rewardInfo.points} points
                    </p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="wallet-tabs">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('transactions')}
                >
                  Transactions
                </button>
                <button
                  className={`tab-btn ${activeTab === 'pending-points' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending-points')}
                >
                  ⏰ Pending Points
                </button>
                <button
                  className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`}
                  onClick={() => setActiveTab('coupons')}
                >
                  My Coupons
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-content">
                    <div className="overview-grid">
                      <div className="overview-card">
                        <h3>How Points Work</h3>
                        <ul className="points-info">
                          <li>🪙 Earn 10 points for every PKR 5000 spent</li>
                          <li>🎁 Spend 10 points to get PKR 400 off coupon</li>
                          <li>💰 Coupon minimum order: PKR 500</li>
                          <li>⏰ User-generated coupons valid for 1 month</li>
                          <li>🎯 Automatic coupons valid for 3 months</li>
                        </ul>
                      </div>

                      <div className="overview-card">
                        <h3>Reward Options</h3>
                        <div className="reward-tiers">
                          <div className="tier">
                            <span className="tier-points">Manual Generation</span>
                            <span className="tier-reward">10 pts = PKR 400 off</span>
                          </div>
                          <div className="tier">
                            <span className="tier-points">Auto Rewards</span>
                            <span className="tier-reward">Milestone coupons</span>
                          </div>
                          <div className="tier">
                            <span className="tier-points">Point Earning</span>
                            <span className="tier-reward">PKR 5000 = 10 pts</span>
                          </div>
                          <div className="tier">
                            <span className="tier-points">Coupon Validity</span>
                            <span className="tier-reward">1-3 months</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div className="transactions-content">
                    <h3>Transaction History</h3>
                    {wallet?.transactions && wallet.transactions.length > 0 ? (
                      <div className="transactions-list">
                        {[...wallet.transactions]
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map((transaction, index) => (
                          <div key={index} className={`transaction-item ${transaction.type}`}>
                            <div className="transaction-icon">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="transaction-info">
                              <h4>{transaction.description}</h4>
                              <div className="transaction-meta">
                                <span className="transaction-date">
                                  <FaCalendarAlt /> {formatDate(transaction.createdAt)}
                                </span>
                                {transaction.amount > 0 && (
                                  <span className="transaction-amount">
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="transaction-points">
                              <span className={`points-badge ${transaction.type}`}>
                                {transaction.type === 'spent' ? '-' : '+'}{transaction.points} pts
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-transactions">
                        <p>No transactions yet. Start shopping to earn points!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'pending-points' && (
                  <div className="pending-points-content">
                    <h3>⏰ Pending Points</h3>

                    {wallet?.upcomingPoints?.hasUpcomingPoints ? (
                      <div className="pending-points-section">
                        {/* Summary Card */}
                        <div className="pending-summary-card">
                          <div className="summary-header">
                            <div className="summary-icon">🎯</div>
                            <div className="summary-text">
                              <h4>Points Awaiting Award</h4>
                              <p className="total-pending-amount">
                                {wallet.upcomingPoints.totalPoints} points total
                              </p>
                            </div>
                          </div>
                          <div className="summary-stats">
                            <div className="stat-item">
                              <span className="stat-label">Next Award:</span>
                              <span className="stat-value">
                                {wallet.upcomingPoints.nextAwardIn > 0
                                  ? `${wallet.upcomingPoints.nextAwardIn} hour(s)`
                                  : 'Processing...'}
                              </span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">Orders:</span>
                              <span className="stat-value">
                                {wallet.upcomingPoints.details?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pending Points List */}
                        <div className="pending-points-list">
                          <h4>Order Details</h4>
                          {wallet.upcomingPoints.details?.map((order, index) => (
                            <div key={index} className={`pending-order-card ${order.type}`}>
                              <div className="order-card-header">
                                <div className="order-info">
                                  <span className="order-number">
                                    Order #{order.orderId?.toString().slice(-8) || 'N/A'}
                                  </span>
                                  <span className="order-amount">
                                    PKR {order.orderAmount || 'N/A'}
                                  </span>
                                </div>
                                <div className="order-points-badge">
                                  {order.points} points
                                </div>
                              </div>

                              <div className="order-card-body">
                                <p className="order-message">{order.message}</p>

                                {order.hoursRemaining > 0 && (
                                  <div className="time-remaining-indicator">
                                    <div className="time-icon">⏱️</div>
                                    <div className="time-info">
                                      <span className="time-label">Time Remaining:</span>
                                      <span className="time-value">{order.hoursRemaining} hour(s)</span>
                                    </div>
                                    <div className="progress-bar">
                                      <div
                                        className="progress-fill"
                                        style={{
                                          width: `${Math.max(10, (order.hoursRemaining / 24) * 100)}%`
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                )}

                                {order.type === 'processing' && (
                                  <div className="processing-indicator">
                                    <div className="processing-icon">⚙️</div>
                                    <span className="processing-text">Award failed - contact support</span>
                                  </div>
                                )}

                                {order.canRefund && (
                                  <div className="refund-indicator">
                                    <div className="refund-icon">🔄</div>
                                    <span className="refund-text">Refund available</span>
                                  </div>
                                )}
                              </div>

                              <div className="order-card-footer">
                                <div className="order-status">
                                  <span className={`status-badge ${order.type}`}>
                                    {order.type === 'refund_window' ? '⏳ Refund Window' :
                                     order.type === 'processing' ? '⚙️ Processing' :
                                     order.type === 'delayed_award' ? '⏰ Scheduled' : '📋 Pending'}
                                  </span>
                                </div>
                                <div className="order-date">
                                  <span className="date-label">Order Date:</span>
                                  <span className="date-value">
                                    {order.awardTime ? new Date(order.awardTime).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Information Section */}
                        <div className="pending-info-section">
                          <div className="info-card">
                            <h5>💡 How Points Work</h5>
                            <ul className="info-list">
                              <li><strong>1 Hour Rule:</strong> Points are awarded immediately after 1 hour</li>
                              <li><strong>Refund Window:</strong> You can request refunds within 1 hour of ordering</li>
                              <li><strong>Instant Award:</strong> Points are automatically added when refund window expires</li>
                              <li><strong>7-Day Hold:</strong> Points remain pending for 7 days before becoming active</li>
                              <li><strong>Active Points:</strong> After 7 days, points can be used for coupons and rewards</li>
                            </ul>
                          </div>

                          <div className="info-card">
                            <h5>🎯 What You Can Do</h5>
                            <ul className="info-list">
                              <li><strong>Generate Coupons:</strong> Use active points for PKR 400 off coupons</li>
                              <li><strong>Track Progress:</strong> Monitor your 7-day activation period</li>
                              <li><strong>Request Refunds:</strong> Within 1 hour of order placement only</li>
                              <li><strong>Monitor Status:</strong> See when your points become active</li>
                              <li><strong>Auto Processing:</strong> Points are awarded automatically - no action needed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-pending-points">
                        <div className="empty-state">
                          <div className="empty-icon">✅</div>
                          <h4>All Points Awarded</h4>
                          <p>You don't have any pending points at the moment.</p>
                          <p>Your points are ready to use for coupons and rewards!</p>
                          <div className="empty-action">
                            <button
                              className="generate-coupon-btn"
                              onClick={() => setActiveTab('coupons')}
                            >
                              🎁 View My Coupons
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'coupons' && (
                  <div className="coupons-content">
                    <h3>My Coupons</h3>

                    {/* Pending Points Bar - Click to expand */}
                    {wallet?.upcomingPoints?.hasUpcomingPoints && (
                      <div className="pending-points-bar">
                        <div
                          className="pending-points-summary"
                          onClick={() => setShowPendingPointsDetails(!showPendingPointsDetails)}
                        >
                          <div className="points-bar-icon">⏰</div>
                          <div className="points-bar-content">
                            <h4>Pending Points Available</h4>
                            <p>{wallet.upcomingPoints.totalPoints} points • Click to view details</p>
                          </div>
                          <div className="points-bar-arrow">
                            {showPendingPointsDetails ? '▲' : '▼'}
                          </div>
                        </div>

                        {/* Expandable Details */}
                        {showPendingPointsDetails && (
                          <div className="pending-points-expanded">
                            <div className="expanded-header">
                              <span className="total-pending">
                                Total Pending: {wallet.upcomingPoints.totalPoints} points
                              </span>
                              <span className="next-award">
                                Next award: {wallet.upcomingPoints.nextAwardIn > 0
                                  ? `in ${wallet.upcomingPoints.nextAwardIn} hour(s)`
                                  : 'Processing...'}
                              </span>
                            </div>

                            <div className="pending-orders-breakdown">
                              {wallet.upcomingPoints.details?.map((order, index) => (
                                <div key={index} className="pending-order-breakdown">
                                  <div className="breakdown-header">
                                    <span className="order-ref">
                                      Order #{order.orderId?.toString().slice(-8) || 'N/A'}
                                    </span>
                                    <span className="order-points">{order.points} pts</span>
                                  </div>
                                  <p className="breakdown-message">{order.message}</p>
                                  {order.hoursRemaining > 0 && (
                                    <div className="breakdown-timer">
                                      <span className="timer-icon">🕒</span>
                                      {order.hoursRemaining} hour(s) remaining
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            <div className="pending-points-footer">
                              <p className="footer-note">
                                💡 Points will be automatically awarded after the refund window expires.
                                You can still request refunds within the time limit.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {coupons && coupons.length > 0 ? (
                      <div className="coupons-grid">
                        {coupons.map((coupon) => (
                          <div key={coupon._id} className={`coupon-card ${coupon.isUsed ? 'used' : ''}`}>
                            <div className="coupon-header">
                              {coupon.isUsed && (
                                <div className="used-badge">USED</div>
                              )}
                              <div className="coupon-discount">
                                {coupon.discountType === 'fixed'
                                  ? formatCurrency(coupon.discountValue)
                                  : `${coupon.discountValue}%`
                                } OFF
                              </div>
                              <div className="coupon-code" onClick={() => !coupon.isUsed && copyToClipboard(coupon.code)}>
                                <span>{coupon.code}</span>
                                {coupon.isUsed ? (
                                  <span className="used-icon">🚫</span>
                                ) : copiedCode === coupon.code ? (
                                  <FaCheck className="copy-icon success" />
                                ) : (
                                  <FaCopy className="copy-icon" />
                                )}
                              </div>
                            </div>
                            <div className="coupon-body">
                              <h4>{coupon.description}</h4>
                              <div className="coupon-details">
                                <p><strong>Min Order:</strong> {formatCurrency(coupon.minOrderAmount)}</p>
                                <p><strong>Expires:</strong> {formatDate(coupon.expiresAt)}</p>
                                <p><strong>Generated:</strong> {formatDate(coupon.createdAt)}</p>
                              </div>
                            </div>
                            <div className="coupon-footer">
                              <span className="coupon-source">
                                Earned with {coupon.pointsUsed} points
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-coupons">
                        <p>No active coupons. Keep shopping to earn rewards!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Generate Coupon Modal */}
      {showGenerateCoupon && (
        <div className="modal-overlay" onClick={() => setShowGenerateCoupon(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎁 Generate Coupon with Points</h3>
              <button className="modal-close" onClick={() => setShowGenerateCoupon(false)}>×</button>
            </div>
            <div className="modal-notice">
              <p>💡 <strong>One-time only:</strong> You can generate only one coupon using your points.</p>
            </div>
            <div className="modal-body">
              <div className="coupon-info">
                <p><strong>Your Points:</strong> {wallet?.totalPoints || 0}</p>
                <p><strong>Exchange Rate:</strong> 10 points = PKR 400 coupon</p>
                <p><strong>Coupon Validity:</strong> 1 month</p>
                <p><strong>Minimum Order:</strong> PKR 500</p>
              </div>

              <div className="points-input-section">
                <label htmlFor="pointsInput">Points to Spend:</label>
                <div className="fixed-points-notice">
                  <p>🎯 <strong>Fixed Rate:</strong> Spend exactly 10 points to get PKR 400 off coupon</p>
                </div>
                <input
                  id="pointsInput"
                  type="number"
                  min="10"
                  max="10"
                  step="10"
                  value={pointsToSpend}
                  onChange={(e) => setPointsToSpend(10)} // Always set to 10
                  className="points-input"
                  disabled={true}
                />
                <div className="coupon-preview">
                  <p><strong>Coupon Value:</strong> PKR 400</p>
                  <p><strong>Min Order Amount:</strong> PKR 500</p>
                  <p><strong>Coupon Code:</strong> Auto-generated (8 characters)</p>
                </div>
              </div>

              {(wallet?.totalPoints || 0) < 10 && (
                <div className="error-message">You need at least 10 points to generate a coupon!</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowGenerateCoupon(false)}
              >
                Cancel
              </button>
              <button
                className="btn-generate"
                onClick={handleGenerateCoupon}
                disabled={generatingCoupon || (wallet?.totalPoints || 0) < 10}
              >
                {generatingCoupon ? 'Generating...' : 'Generate Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Custom Notification */}
        {notification && (
          <div className="custom-notification-overlay">
            <div className={`custom-notification ${notification.type}`}>
              <div className="notification-icon">
                {notification.type === 'success' ? '🎉' : notification.type === 'error' ? '❌' : 'ℹ️'}
              </div>
              <div className="notification-content">
                <div className="notification-message">
                  {notification.message.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
                <button
                  className="notification-close"
                  onClick={() => setNotification(null)}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

      <Footer />

      <style jsx>{`
        .wallet-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1428 0%, #0f1f3c 100%);
          padding-top: 0 !important;
          font-family: 'Inter', sans-serif;
        }

        .wallet-banner {
          width: 100%;
          height: 320px;
          position: relative;
          background: url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200") center/cover no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(10, 20, 40, 0.95), rgba(15, 31, 60, 0.8));
        }

        .banner-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 0 1rem;
          color: #fff;
        }

        .banner-badge {
          display: inline-block;
          background: rgba(249, 115, 22, 0.2);
          color: #f97316;
          padding: 0.4rem 1rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
        }

        .banner-content h2 {
          font-size: 2.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .banner-subtitle {
          font-size: 1.1rem;
          color: #94a3b8;
          max-width: 600px;
          margin: 0 auto;
        }
        .wallet-main {
          padding-bottom: 4rem;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .wallet-main {
          padding: 1rem 0 4rem 0;
        }

        .wallet-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .wallet-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          border: 1px solid #4b5563;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          position: relative;
          min-height: 140px;
          padding-bottom: 3rem;
        }

        .stat-icon {
          font-size: 2rem;
          color: #667eea;
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid #6b7280;
        }

        .stat-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #e5e7eb;
        }

        .stat-info p {
          margin: 0;
          color: #d1d5db;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .next-reward-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
          color: white;
          padding: 2rem;
          border-radius: 12px;
          margin-bottom: 3rem;
          border: 1px solid rgba(0, 234, 255, 0.2);
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.3);
        }

        .reward-icon {
          font-size: 3rem;
        }

        .reward-content h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.3);
          border-radius: 4px;
          margin: 1rem 0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: white;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .wallet-tabs {
          display: flex;
          justify-content: flex-start;
          gap: 2.5rem;
          padding: 0 1.5rem 10px 1.5rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          overflow-x: auto;
          white-space: nowrap;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @media (min-width: 1024px) {
          .wallet-tabs {
            justify-content: center;
          }
        }

        .wallet-tabs::-webkit-scrollbar {
          display: none;
        }

        .tab-btn {
          padding: 0.8rem 1.2rem;
          border: none;
          background: none;
          color: #94a3b8;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }

        .tab-btn.active,
        .tab-btn:hover {
          color: #667eea;
          border-bottom-color: #667eea;
        }

        .tab-content {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0,0,0,0.3);
          border: 1px solid #4b5563;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .overview-card {
          padding: 2rem;
          border: 2px solid #4b5563;
          border-radius: 8px;
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
        }

        .overview-card h3 {
          margin: 0 0 1rem 0;
          color: #e5e7eb;
          font-size: 1.1rem;
        }

        .points-info {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .points-info li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #6b7280;
          color: #d1d5db;
        }

        .reward-tiers {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .tier {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
          border-radius: 8px;
          border: 1px solid #9ca3af;
        }

        .tier-points {
          font-weight: 600;
          color: #e5e7eb;
        }

        .tier-reward {
          font-weight: 600;
          color: #e5e7eb;
        }

        .transactions-content h3 {
          text-align: center;
          margin-bottom: 2rem;
          color: #00eaff;
          font-size: 1.5rem;
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(55, 65, 81, 0.8) 100%);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .transaction-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          border-color: rgba(0, 234, 255, 0.3);
        }

        .transaction-icon {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
        }

        .transaction-info {
          flex: 1;
        }

        .transaction-info h4 {
          margin: 0 0 0.3rem 0;
          color: #e5e7eb;
          font-size: 0.95rem;
        }

        .transaction-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .transaction-points .points-badge {
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 700;
          font-size: 0.85rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .points-badge.earned {
          background: #d4edda;
          color: #155724;
        }

        .points-badge.spent {
          background: #f8d7da;
          color: #721c24;
        }

        .points-badge.bonus {
          background: #d1ecf1;
          color: #0c5460;
        }

        .coupons-content h3 {
          text-align: center;
          margin-bottom: 2rem;
          color: #00eaff;
          font-size: 1.5rem;
        }

        .coupons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .coupon-card {
          border: 2px dashed #667eea;
          border-radius: 12px;
          overflow: hidden;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
          position: relative;
        }

        .coupon-card.used {
          border-color: #6b7280;
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          opacity: 0.7;
        }

        .coupon-card.used .coupon-header {
          background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
        }

        .used-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #ef4444;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          z-index: 10;
        }

        .used-icon {
          font-size: 0.9rem;
          color: #ef4444;
        }

        .coupon-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .coupon-discount {
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .coupon-code {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          background: rgba(255,255,255,0.15);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .coupon-code:hover {
          background: rgba(255,255,255,0.3);
        }

        .copy-icon {
          font-size: 0.9rem;
        }

        .copy-icon.success {
          color: #28a745;
        }

        .coupon-body {
          padding: 1.5rem;
        }

        .coupon-body h4 {
          margin: 0 0 0.8rem 0;
          color: #e5e7eb;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .coupon-details p {
          margin: 0.4rem 0;
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .coupon-footer {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          padding: 1rem 1.5rem;
          text-align: center;
          border-top: 1px solid #6b7280;
        }

        .coupon-source {
          font-size: 0.9rem;
          color: #667eea;
          font-weight: 500;
        }

        .no-transactions,
        .no-coupons {
          text-align: center;
          padding: 4rem 2rem;
          color: #9ca3af;
        }

        .error-message {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: #fecaca;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          text-align: center;
          border: 1px solid #ef4444;
        }

        /* Generate Coupon Button */
        .generate-coupon-btn {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          border: none;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
          height: 32px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .generate-coupon-btn:hover {
          transform: translateX(-50%) translateY(-2px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
        }

        .coupon-limit-notice {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: default;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .limit-icon {
          font-size: 0.8rem;
        }

        .limit-text {
          white-space: nowrap;
        }


        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .modal-header h3 {
          margin: 0;
          color: #00eaff;
          font-size: 1.3rem;
        }

        .modal-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .modal-notice {
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin: 0 1.5rem;
          text-align: center;
        }

        .modal-notice p {
          margin: 0;
          color: #00eaff;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .coupon-info {
          background: rgba(0,234,255,0.1);
          border: 1px solid rgba(0,234,255,0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .coupon-info p {
          margin: 0.5rem 0;
          color: #d1d5db;
          font-size: 0.9rem;
        }

        .points-input-section {
          margin-bottom: 1.5rem;
        }

        .points-input-section label {
          display: block;
          margin-bottom: 0.5rem;
          color: #e5e7eb;
          font-weight: 600;
        }

        .fixed-points-notice {
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .fixed-points-notice p {
          margin: 0;
          color: #00eaff;
          font-weight: 600;
        }

        .points-input {
          width: 100%;
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.1);
          color: #e5e7eb;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        }

        .points-input:focus {
          border-color: #00eaff;
          box-shadow: 0 0 0 2px rgba(0,234,255,0.2);
        }

        .coupon-preview {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 8px;
        }

        .coupon-preview p {
          margin: 0.25rem 0;
          color: #10b981;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          justify-content: flex-end;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255,255,255,0.3);
          background: transparent;
          color: #9ca3af;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: #ef4444;
          color: #ef4444;
        }

        .btn-generate {
          padding: 0.75rem 1.5rem;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
        }

        .btn-generate:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }

        .btn-generate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* PENDING POINTS ALERT - यह नया styling add करें */
        .pending-points-alert {
          background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
          border: 2px solid #f39c12;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 8px 25px rgba(243, 156, 18, 0.2);
          animation: pulse 2s infinite;
          color: #000;
        }

        .alert-icon {
          font-size: 2rem;
          color: #f39c12;
          flex-shrink: 0;
        }

        .alert-content h3 {
          margin: 0 0 8px 0;
          color: #d68910;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .alert-message {
          margin: 0 0 8px 0;
          color: #8b4513;
          font-weight: 500;
          font-size: 1rem;
        }

        .alert-details {
          margin: 0;
          color: #a0522d;
          font-size: 0.9rem;
        }

        /* PENDING ORDERS SECTION */
        .pending-orders-section {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.9) 100%);
          border: 1px solid rgba(0, 234, 255, 0.2);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          color: white;
        }

        .pending-orders-section h3 {
          margin: 0 0 1.5rem 0;
          color: #00eaff;
          font-size: 1.3rem;
        }

        .pending-orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pending-order-card {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          border: 1px solid #6b7280;
          border-radius: 8px;
          padding: 1rem;
          transition: all 0.3s ease;
        }

        .pending-order-card:hover {
          border-color: #00eaff;
          box-shadow: 0 4px 15px rgba(0, 234, 255, 0.2);
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .order-number {
          font-weight: 600;
          color: #e5e7eb;
        }

        .points-amount {
          background: linear-gradient(135deg, #00eaff, #6366f1);
          color: #1e293b;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .order-status-message {
          margin: 0.5rem 0;
          color: #d1d5db;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .time-remaining {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .time-icon {
          font-size: 1rem;
        }

        /* PENDING POINTS TAB - Main Section */
        .pending-points-content h3 {
          margin: 0 0 1.5rem 0;
          color: #00eaff;
          font-size: 1.5rem;
          text-align: center;
          position: relative;
        }

        .pending-points-content h3::before {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #f39c12, #f1c40f);
          border-radius: 2px;
        }

        .pending-points-section {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Summary Card */
        .pending-summary-card {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid rgba(243, 156, 18, 0.3);
          box-shadow: 0 8px 25px rgba(243, 156, 18, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .summary-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .summary-icon {
          font-size: 3rem;
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          border-radius: 50%;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
        }

        .summary-text h4 {
          margin: 0 0 0.5rem 0;
          color: #e5e7eb;
          font-size: 1.4rem;
          font-weight: 700;
        }

        .total-pending-amount {
          margin: 0;
          color: #fbbf24;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .summary-stats {
          display: flex;
          gap: 2rem;
        }

        .stat-item {
          text-align: center;
        }

        .stat-label {
          display: block;
          color: #9ca3af;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          display: block;
          color: #00eaff;
          font-size: 1.2rem;
          font-weight: 700;
        }

        /* Pending Points List */
        .pending-points-list h4 {
          color: #e5e7eb;
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          border-bottom: 2px solid #4b5563;
          padding-bottom: 0.5rem;
        }

        .pending-order-card {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          border-radius: 12px;
          margin-bottom: 1.5rem;
          border: 1px solid #6b7280;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .pending-order-card:hover {
          border-color: #f39c12;
          box-shadow: 0 4px 15px rgba(243, 156, 18, 0.2);
          transform: translateY(-2px);
        }

        .pending-order-card.refund_window {
          border-left: 4px solid #f39c12;
        }

        .pending-order-card.processing {
          border-left: 4px solid #3498db;
        }

        .pending-order-card.delayed_award {
          border-left: 4px solid #e74c3c;
        }

        .order-card-header {
          background: rgba(255,255,255,0.05);
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #6b7280;
        }

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .order-number {
          font-weight: 700;
          color: #e5e7eb;
          font-size: 1rem;
        }

        .order-amount {
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .order-points-badge {
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          color: #2c3e50;
          padding: 0.5rem 1rem;
          border-radius: 25px;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 2px 8px rgba(243, 156, 18, 0.3);
        }

        .order-card-body {
          padding: 1.5rem;
        }

        .order-message {
          margin: 0 0 1rem 0;
          color: #d1d5db;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .time-remaining-indicator {
          background: rgba(243, 156, 18, 0.1);
          border: 1px solid rgba(243, 156, 18, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .time-icon {
          font-size: 1.5rem;
        }

        .time-info {
          flex: 1;
        }

        .time-label {
          display: block;
          color: #f39c12;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .time-value {
          display: block;
          color: #e5e7eb;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .progress-bar {
          width: 100px;
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #f39c12, #f1c40f);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .processing-indicator,
        .refund-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 6px;
          margin: 0.5rem 0;
        }

        .processing-indicator {
          background: rgba(52, 152, 219, 0.1);
          border: 1px solid rgba(52, 152, 219, 0.3);
          color: #3498db;
        }

        .refund-indicator {
          background: rgba(230, 126, 34, 0.1);
          border: 1px solid rgba(230, 126, 34, 0.3);
          color: #e67e22;
        }

        .processing-icon,
        .refund-icon {
          font-size: 1.2rem;
        }

        .processing-text,
        .refund-text {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .order-card-footer {
          background: rgba(0,0,0,0.2);
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #6b7280;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.refund_window {
          background: linear-gradient(135deg, #f39c12, #f1c40f);
          color: #2c3e50;
        }

        .status-badge.processing {
          background: linear-gradient(135deg, #3498db, #2980b9);
          color: white;
        }

        .status-badge.delayed_award {
          background: linear-gradient(135deg, #e74c3c, #c0392b);
          color: white;
        }

        .order-date {
          text-align: right;
        }

        .date-label {
          display: block;
          color: #9ca3af;
          font-size: 0.8rem;
          margin-bottom: 0.25rem;
        }

        .date-value {
          color: #d1d5db;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Information Section */
        .pending-info-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .info-card {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #4b5563;
        }

        .info-card h5 {
          margin: 0 0 1rem 0;
          color: #00eaff;
          font-size: 1.1rem;
        }

        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #4b5563;
          color: #d1d5db;
          line-height: 1.4;
        }

        .info-list li:last-child {
          border-bottom: none;
        }

        .info-list li strong {
          color: #e5e7eb;
        }

        /* No Pending Points State */
        .no-pending-points {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-state {
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h4 {
          color: #00eaff;
          margin: 1rem 0;
          font-size: 1.5rem;
        }

        .empty-state p {
          color: #9ca3af;
          margin: 0.5rem 0 2rem 0;
          line-height: 1.5;
        }

        .empty-action {
          margin-top: 2rem;
        }

        .generate-coupon-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .generate-coupon-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        /* PENDING POINTS BAR - Coupons Section */
        .pending-points-bar {
          margin-top: 1.5rem;
          margin-bottom: 2.5rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .pending-points-summary {
          background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
          color: #2c3e50;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          width: 100%;
          text-align: left;
        }

        .pending-points-summary:hover {
          background: linear-gradient(135deg, #e67e22 0%, #f39c12 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(243, 156, 18, 0.3);
        }

        .points-bar-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .points-bar-content {
          flex: 1;
        }

        .points-bar-content h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .points-bar-content p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .points-bar-arrow {
          font-size: 1.2rem;
          font-weight: bold;
          transition: transform 0.3s ease;
        }

        /* Expanded Details */
        .pending-points-expanded {
          background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
          border-top: 2px solid #f39c12;
          animation: slideDown 0.3s ease;
        }

        .expanded-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #6b7280;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .total-pending {
          color: #00eaff;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .next-award {
          color: #fbbf24;
          font-size: 0.9rem;
        }

        .pending-orders-breakdown {
          padding: 1rem 1.5rem;
        }

        .pending-order-breakdown {
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .pending-order-breakdown:last-child {
          margin-bottom: 0;
        }

        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .order-ref {
          font-weight: 600;
          color: #e5e7eb;
        }

        .order-points {
          background: linear-gradient(135deg, #00eaff, #6366f1);
          color: #1e293b;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .breakdown-message {
          margin: 0.5rem 0;
          color: #d1d5db;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .breakdown-timer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #fbbf24;
          font-weight: 500;
          font-size: 0.85rem;
        }

        .timer-icon {
          font-size: 1rem;
        }

        .pending-points-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid #6b7280;
          background: rgba(0,0,0,0.2);
        }

        .footer-note {
          margin: 0;
          color: #9ca3af;
          font-size: 0.85rem;
          text-align: center;
          line-height: 1.4;
        }

        /* Animations */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Pulse Animation */
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        /* Custom Notification Styles */
        .custom-notification-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(2px);
          animation: fadeIn 0.3s ease;
        }

        .custom-notification {
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          border-radius: 16px;
          border: 2px solid #4b5563;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          max-width: 500px;
          width: 90%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          position: relative;
          animation: slideInFromTop 0.4s ease;
        }

        .custom-notification.success {
          border-color: #10b981;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
        }

        .custom-notification.error {
          border-color: #ef4444;
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.3);
        }

        .notification-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .custom-notification.success .notification-icon {
          color: #10b981;
        }

        .custom-notification.error .notification-icon {
          color: #ef4444;
        }

        .notification-content {
          flex: 1;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .notification-message {
          flex: 1;
          color: #e5e7eb;
          line-height: 1.5;
        }

        .notification-message div {
          margin-bottom: 0.25rem;
        }

        .notification-message div:last-child {
          margin-bottom: 0;
        }

        .notification-close {
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .notification-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Notification Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }


        @media (max-width: 768px) {
          .wallet-banner {
            height: 220px;
            margin-bottom: 1.5rem;
          }

          .banner-content h2 {
            font-size: 1.8rem;
          }

          .banner-subtitle {
            font-size: 0.9rem;
          }

          .wallet-stats {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .stat-card {
            padding: 1.25rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .stat-info h3 {
            font-size: 1.4rem;
          }

          .wallet-tabs {
            justify-content: flex-start;
            gap: 2rem;
            padding: 0 1rem 0.5rem 1rem;
            margin-bottom: 1.5rem;
          }

          .coupons-content h3 {
            text-align: center;
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
          }

          .tab-btn {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
          }

          .next-reward-card {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1.25rem;
          }

          .reward-icon {
            font-size: 2rem;
          }

          .reward-content h4 {
            font-size: 1.1rem;
          }

          .reward-content p {
            font-size: 0.85rem;
          }

          .overview-grid {
            grid-template-columns: 1fr;
          }

          .coupons-grid {
            grid-template-columns: 1fr;
          }

          .transactions-content h3 {
            text-align: center;
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
          }

          .transaction-item {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
            padding: 1.25rem;
          }

          .transaction-meta {
            justify-content: center;
            gap: 0.5rem;
            flex-direction: column;
          }

          .transaction-points {
            width: 100%;
            display: flex;
            justify-content: center;
          }

          /* Responsive Pending Points Alert */
          .pending-points-alert {
            flex-direction: column;
            text-align: center;
            padding: 15px;
            margin-bottom: 1.5rem;
          }

          .pending-orders-section {
            padding: 1.5rem;
          }

          .pending-order-card {
            padding: 0.75rem;
          }

          .order-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          /* Responsive Pending Points Bar */
          .pending-points-summary {
            padding: 1rem;
            gap: 0.75rem;
          }

          .points-bar-content h4 {
            font-size: 1rem;
          }

          .points-bar-content p {
            font-size: 0.85rem;
          }

          .expanded-header {
            padding: 1rem;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .pending-orders-breakdown,
          .pending-points-footer {
            padding: 1rem;
          }

          .pending-order-breakdown {
            padding: 0.75rem;
          }

          .breakdown-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          /* Responsive Pending Points Tab */
          .pending-summary-card {
            padding: 1.25rem !important;
            flex-direction: column;
            text-align: center;
          }

          .summary-header {
            flex-direction: column;
          }

          .summary-icon {
            width: 60px;
            height: 60px;
            font-size: 2.2rem;
          }

          .summary-stats {
            gap: 1rem;
            width: 100%;
            justify-content: center;
          }

          .stat-value {
            font-size: 1rem;
          }

          .pending-order-card {
            margin-bottom: 1rem !important;
          }

          .order-card-header {
            padding: 0.8rem 1rem;
          }

          .order-card-body {
            padding: 1rem;
          }

          .pending-info-section {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Wallet;
