import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Card, Button, Modal, Form, Badge, Spinner, Alert, Row, Col, Table, InputGroup, FormControl } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchActiveBoostPackages,
  selectActiveBoostPackages,
  selectBoostPackageLoading,
  selectBoostPackageError
} from "../../Features/Backend/BoostPackageSlice";
import {
  requestProductBoost,
  fetchSellerBoostRequests,
  cancelBoostRequest,
  addProductsToBoostRequest,
  selectSellerBoostRequests,
  selectProductBoostLoading,
  selectProductBoostError
} from "../../Features/Backend/ProductBoostSlice";
import { fetchProductsBySeller, selectProductsBySeller, selectSellerProductsLoading } from "../../Features/Backend/ProductSlice";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaRocket, FaPlus, FaEye, FaTimes, FaCheckCircle, FaClock, FaBan, FaSearch, FaFilter, FaStar } from 'react-icons/fa';
import LoaderOverlay from "../LoaderOverlay";
import { API_BASE_URL } from '../../config';

function SellerProductBoost() {
  const dispatch = useDispatch();
  const seller = useSelector(selectSeller);
  const sellerData = seller?.data || seller;
  const sellerId = sellerData?._id;

  // Boost packages state
  const activePackages = useSelector(selectActiveBoostPackages) || [];
  const packageLoading = useSelector(selectBoostPackageLoading);
  const packageError = useSelector(selectBoostPackageError);

  // Seller requests state
  const rawSellerRequests = useSelector(selectSellerBoostRequests) || [];
  const sellerRequests = rawSellerRequests.filter(req => req.status !== 'cancelled');
  const requestLoading = useSelector(selectProductBoostLoading);
  const requestError = useSelector(selectProductBoostError);

  // Products state
  const userProducts = useSelector(selectProductsBySeller) || [];
  const productsLoading = useSelector(selectSellerProductsLoading);

  // UI state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [ssPreview, setSsPreview] = useState(null);
  const [toast, setToast] = useState(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // For add more
  const [showAddMoreModal, setShowAddMoreModal] = useState(false);
  const [addMoreRequest, setAddMoreRequest] = useState(null);
  const [addProducts, setAddProducts] = useState([]);
  const [addingProducts, setAddingProducts] = useState(false);
  const [paymentInstruction, setPaymentInstruction] = useState("Pay at this number 03082011585 JazzCash/EasyPaisa");

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchActiveBoostPackages());
      dispatch(fetchSellerBoostRequests({ sellerId })); // This fetches ALL requests (no status filter)
      dispatch(fetchProductsBySeller(sellerId));
    }
    
    // Fetch dynamic payment instructions
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/platform-settings`);
        if (res.data.success && res.data.data && res.data.data.paymentInstruction) {
          setPaymentInstruction(res.data.data.paymentInstruction);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [dispatch, sellerId]);

  const handleRequestBoost = (pkg) => {
    setSelectedPackage(pkg);
    setSelectedProducts([]);
    setPaymentScreenshot(null);
    setSsPreview(null);
    setShowRequestModal(true);
  };

  const handleOpenAddMore = (request) => {
    setAddMoreRequest(request);
    setAddProducts([]);
    setShowAddMoreModal(true);
  };

  const handleAddMoreProductToggle = (productId) => {
    setAddProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmitAddMore = async (e) => {
    if (e) e.preventDefault();
    if (!addProducts.length) {
      showToast("Select products to add!", "warning");
      return;
    }
    setAddingProducts(true);
    try {
      await dispatch(
        addProductsToBoostRequest({
          requestId: addMoreRequest._id,
          sellerId,
          newProductIds: addProducts,
        })
      ).unwrap();
      setShowAddMoreModal(false);
      setAddProducts([]);
      setAddMoreRequest(null);
      dispatch(fetchSellerBoostRequests({ sellerId }));
      showToast("Products added successfully!", "success");
    } catch (err) {
      showToast(err || "Failed to add products", "error");
    } finally {
      setAddingProducts(false);
    }
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSsPreview(reader.result);
      setPaymentScreenshot(reader.result); // Base64
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRequest = async (e) => {
    // Prevent any default form submission
    if (e) e.preventDefault();

    if (!selectedPackage || selectedProducts.length === 0) {
      showToast('Please select products to boost', 'warning');
      return;
    }

    if (!paymentScreenshot) {
      showToast('Please upload payment screenshot', 'warning');
      return;
    }

    if (selectedProducts.length > selectedPackage.productLimit) {
      showToast(`Maximum ${selectedPackage.productLimit} products allowed`, 'warning');
      return;
    }

    if (submittingRequest) {
      return; // Prevent multiple submissions
    }

    setSubmittingRequest(true);

    try {
      const result = await dispatch(requestProductBoost({
        sellerId,
        packageId: selectedPackage._id,
        productIds: selectedProducts,
        paymentScreenshot
      })).unwrap();

      showToast('Request sent successfully!', 'success');

      // Close modal and reset form
      setShowRequestModal(false);
      setSelectedPackage(null);
      setSelectedProducts([]);
      setPaymentScreenshot(null);
      setSsPreview(null);

      // Refresh the requests list to show the new request
      dispatch(fetchSellerBoostRequests({ sellerId }));

    } catch (error) {
      console.error('Request failed:', error);
      showToast(error || 'Failed to send request', 'error');

      // Don't close modal on error so user can try again
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await dispatch(cancelBoostRequest({ requestId, sellerId })).unwrap();
      showToast('Request cancelled successfully!', 'success');
      dispatch(fetchSellerBoostRequests({ sellerId }));
    } catch (error) {
      showToast(error, 'error');
    }
  };

  const handleProductSelection = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
      active: 'primary',
      expired: 'secondary',
      cancelled: 'dark'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-warning" />;
      case 'approved': return <FaCheckCircle className="text-success" />;
      case 'rejected': return <FaTimes className="text-danger" />;
      case 'active': return <FaRocket className="text-primary" />;
      case 'cancelled': return <FaBan className="text-dark" />;
      default: return null;
    }
  };

  if (!sellerId) {
    return <div className="text-center p-4">Please login as a seller to access this page.</div>;
  }

  const styles = `
    .modern-seller-boost {
      padding: 32px 3vw 6vw 3vw;
      min-height: 100vh;
      background: linear-gradient(145deg,#1a1f2c 40%,#202d49 100%);
      margin-left: 80px;
      overflow-x: hidden;
    }
    @media (max-width: 1000px) {
      .modern-seller-boost {
        margin-left: 0;
      }
    }
    .products-admin-toolbar {

      display: flex;
      flex-direction: column;
      gap: 13px;
      margin-bottom: 22px;
      align-items: flex-start;
    }
    @media (min-width: 700px) {
      .products-admin-toolbar { flex-direction: row; align-items: center; justify-content: space-between; }
    }
    .p-toolbar-title {
      font-size: 1.3rem !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      letter-spacing: 1.2px;
      text-shadow: 0 3px 24px rgba(255, 255, 255, 0.1);
      margin: 0;
      padding: 0;
      line-height: 1.3;
    }
    @media (max-width: 768px) {
      .p-toolbar-title { font-size: 1.05rem !important; }
    }
    @media (max-width: 480px) {
      .p-toolbar-title { font-size: 0.8rem !important; letter-spacing: 0.3px; }
    }
    .admin-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .admin-btn-primary {
      background: linear-gradient(45deg, #00eaff, #0080ff);
      color: #0c1220;
    }
    .admin-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px #00eaff50;
    }
    .admin-btn-warning {
      background: linear-gradient(45deg, #ffb340, #ff8c00);
      color: #0c1220;
    }
    .admin-btn-warning:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px #ffb34050;
    }
    .admin-btn-danger {
      background: linear-gradient(45deg, #ff4757, #ff3838);
      color: white;
    }
    .admin-btn-danger:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px #ff475750;
    }
    .p-table-glass {
      background: rgba(0,0,0,0.95) !important;
      border-radius: 17px;
      box-shadow: 0 6px 28px #29deff16;
      overflow: hidden;
    }
    .p-table-glass th, .p-table-glass td {
      backdrop-filter: blur(6px);
    }
    .p-row-anim {
      transition: box-shadow 0.22s, background 0.16s;
    }
    .p-row-anim:hover {
      background: #232d3b !important;
      box-shadow: 0 4px 20px #00eaff14 !important;
      outline: 2.5px solid #00eaff33;
    }
    .p-actions {
      display: inline-flex;
      gap: 8px;
      flex-wrap: nowrap;
    }
    .p-toast {
      position: fixed;
      top: 18px;
      right: 16px;
      z-index: 1400;
      background: rgba(9, 14, 25, 0.96);
      border: 1px solid #00eaff55;
      color: #e5e7eb;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 28px #0007;
      min-width: 240px;
    }
    .p-toast.success { border-color: #16e0a0; }
    .p-toast.danger { border-color: #ff5f7a; }
    .p-toast.warning { border-color: #f5c542; }
    .p-toast.info { border-color: #22c8ff; }
    .modern-modal-anim .modal-dialog {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      min-height: calc(100% - 1rem) !important;
      margin: auto !important;
      max-width: 800px !important;
    }
    .modern-modal-anim .modal-content {
      background: rgba(15, 23, 42, 0.99) !important;
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 234, 255, 0.3);
      border-radius: 16px;
      box-shadow: 0 0 60px rgba(0, 234, 255, 0.15);
      width: 100% !important;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
    }
    .modern-modal-anim .modal-header {
      padding: 12px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .modern-modal-anim .modal-title {
      font-size: 1.1rem;
      color: #ffffff !important;
      font-weight: 700;
    }
    .modern-modal-anim .modal-footer {
      padding: 10px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .package-summary-card {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 16px;
    }
    .package-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .package-stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 600;
    }
    .package-stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
    }
    .product-grid-select {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      padding: 4px;
    }
    .product-select-card {
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .product-select-card:hover {
      background: rgba(255, 255, 255, 0.06);
      transform: translateY(-2px);
    }
    .product-select-card.selected {
      background: rgba(0, 234, 255, 0.05);
      border-color: #00eaff;
      box-shadow: 0 0 20px rgba(0, 234, 255, 0.15);
    }
    .product-select-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }
    .product-select-image {
      width: 100%;
      height: 70px;
      border-radius: 4px;
      background: #0f172a;
      object-fit: cover;
    }
    .product-grid-select {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      padding: 2px;
    }
    .product-select-card {
      padding: 8px;
    }
    .product-select-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.3;
    }
    .product-select-price {
      font-size: 0.85rem;
      color: #00eaff;
      font-weight: 700;
    }
    .selection-check {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: #00eaff;
      color: #0c1220;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      box-shadow: 0 2px 8px rgba(0, 234, 255, 0.4);
    }
    .limit-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .limit-pill {
      background: rgba(255, 255, 255, 0.05);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .limit-pill.near-limit {
      color: #ffb340;
      background: rgba(255, 179, 64, 0.1);
    }
    .limit-pill.at-limit {
      color: #ff4757;
      background: rgba(255, 71, 87, 0.1);
    }
  `;

  return (
    <motion.div className="modern-seller-boost" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <style>{styles}</style>
      <>
      <div className="products-admin-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="p-toolbar-title">
            <FaRocket style={{ marginRight: '10px' }} />
            Product Boost Management
          </div>
          <Badge
            style={{
              background: 'linear-gradient(45deg, #00eaff, #0080ff)',
              border: 'none',
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}
          >
            {activePackages.length} Active Packages
          </Badge>
        </div>
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`p-toast ${toast.type}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Messages */}
      {(packageError || requestError) && (
        <div style={{margin:'20px auto',maxWidth:480,background:'linear-gradient(90deg,#ff5f7a 30%,#ff3838 100%)',color:'white',fontWeight:700,padding:'18px',borderRadius:'11px',boxShadow:'0 2px 24px #ff475766',textAlign:'center',letterSpacing:'0.04em',fontSize:'1.10rem'}}>
          {packageError || requestError}
        </div>
      )}

      {/* Boost Packages Tab */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          style={{
            background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a4a 100%)',
            border: '1px solid #00eaff40',
            borderRadius: '15px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 234, 255, 0.1)'
          }}
          className="mb-4"
        >
          <Card.Header
            style={{
              background: 'linear-gradient(45deg, #00eaff20, #0080ff20)',
              borderBottom: '1px solid #00eaff40',
              borderRadius: '15px 15px 0 0'
            }}
          >
            <h5 style={{ color: '#00eaff', margin: 0, fontWeight: 600 }}>
              <FaRocket style={{ marginRight: '10px' }} />
              Available Boost Packages
            </h5>
          </Card.Header>
          <Card.Body style={{ padding: '2rem' }}>
            {packageLoading ? (
              <div className="text-center py-5">
                <Spinner
                  animation="border"
                  style={{ color: '#00eaff', width: '3rem', height: '3rem' }}
                />
                <div style={{ color: '#00eaff', marginTop: '1rem' }}>Loading packages...</div>
              </div>
            ) : activePackages.length === 0 ? (
              <div className="text-center py-5">
                <FaRocket size={48} style={{ color: '#00eaff40', marginBottom: '1rem' }} />
                <div style={{ color: '#b0b0b0' }}>No boost packages available</div>
              </div>
            ) : (
              <Table striped bordered hover variant="dark" responsive className="p-table-glass">
                <thead style={{ background: 'rgba(0, 234, 255, 0.1)', borderBottom: '2px solid #00eaff40' }}>
                  <tr>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Title</th>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Description</th>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Price</th>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Products</th>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Duration</th>
                    <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activePackages.map((pkg, index) => {
                    // Check if pending request exists for this package & it's not yet full
                    const pendingReq = sellerRequests.find(
                      req => req.packageId?._id === pkg._id && req.status === 'pending' && req.productIds.length < pkg.productLimit
                    );
                    return (
                      <motion.tr
                        key={pkg._id}
                        className="p-row-anim"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        style={{ cursor: pendingReq ? 'not-allowed' : 'pointer' }}
                        onClick={() => { if (!pendingReq) handleRequestBoost(pkg); }}
                      >
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ color: '#00eaff', fontWeight: 600 }}>{pkg.title}</div>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ color: '#b0b0b0', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pkg.description}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <span style={{ color: '#00eaff', fontWeight: 600, fontSize: '1.1rem' }}>PKR {Number(pkg.price).toFixed(2)}</span>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ color: '#b0b0b0' }}>{pkg.productLimit} products</div>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ color: '#b0b0b0' }}>{pkg.duration} {pkg.durationType}</div>
                      </td>
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        {pendingReq ? (
                          <motion.button
                            className="admin-btn admin-btn-warning"
                            disabled
                            style={{ fontSize: '0.85rem', padding: '8px 16px', opacity: 0.7 }}
                          >
                            Pending Not Full (Add More)
                          </motion.button>
                        ) : (
                          <motion.button
                            className="admin-btn admin-btn-primary"
                            whileHover={{ scale: 1.05 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestBoost(pkg);
                            }}
                            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                          >
                            <FaPlus style={{ marginRight: '6px' }} />
                            Request Boost
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </motion.div>

        {/* Seller Boost Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card
            style={{
              background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a4a 100%)',
              border: '1px solid #00eaff40',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 234, 255, 0.1)'
            }}
          >
            <Card.Header
              style={{
                background: 'linear-gradient(45deg, #00eaff20, #0080ff20)',
                borderBottom: '1px solid #00eaff40',
                borderRadius: '15px 15px 0 0'
              }}
            >
              <h5 style={{ color: '#00eaff', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaClock style={{ marginRight: '10px' }} />
                My Boost Requests ({sellerRequests.length})
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '2rem' }}>
              {requestLoading ? (
                <div className="text-center py-5">
                  <Spinner
                    animation="border"
                    style={{ color: '#00eaff', width: '3rem', height: '3rem' }}
                  />
                  <div style={{ color: '#00eaff', marginTop: '1rem' }}>Loading requests...</div>
                </div>
              ) : sellerRequests.length === 0 ? (
                <div className="text-center py-5">
                  <FaClock size={48} style={{ color: '#00eaff40', marginBottom: '1rem' }} />
                  <div style={{ color: '#b0b0b0' }}>No boost requests yet</div>
                  <div style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Create your first boost request above
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    striped
                    bordered
                    hover
                    variant="dark"
                    responsive
                    className="p-table-glass"
                  >
                    <thead>
                      <tr style={{ borderBottom: '2px solid #00eaff40' }}>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '180px', whiteSpace: 'nowrap' }}>Package</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '220px' }}>Products</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '150px', whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '160px', whiteSpace: 'nowrap' }}>Amount</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '160px', whiteSpace: 'nowrap' }}>Requested</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '150px', whiteSpace: 'nowrap' }}>Start</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '150px', whiteSpace: 'nowrap' }}>End</th>
                        <th style={{ color: '#00eaff', fontWeight: 600, padding: '1rem', minWidth: '180px', whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerRequests.map((request, index) => (
                        <motion.tr
                          key={request._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-row-anim"
                        >
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            <div style={{ color: '#00eaff', fontWeight: 500 }}>
                              {request.packageId?.title || 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            {request.productIds?.length > 0 ? (
                              <div>
                                {request.productIds.slice(0, 2).map((product, idx) => (
                                  <div key={idx} style={{ fontSize: '0.85rem', marginBottom: '2px' }}>
                                    {product.pname}
                                  </div>
                                ))}
                                {request.productIds.length > 2 && (
                                  <div style={{ fontSize: '0.8rem' }}>
                                    +{request.productIds.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span>No products</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            <div className="d-flex align-items-center">
                              {getStatusIcon(request.status)}
                              <span className="ms-2">{getStatusBadge(request.status)}</span>
                            </div>
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            <span style={{ color: '#00eaff', fontWeight: 600 }}>
                              PKR {Number(request.totalAmount).toFixed(2)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            {formatDate(request.createdAt)}
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            {request.startDate ? formatDate(request.startDate) : '-'}
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            {request.endDate ? formatDate(request.endDate) : '-'}
                          </td>
                          <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  style={{
                                    background: 'linear-gradient(45deg, #ff4757, #ff3838)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    padding: '6px 12px',
                                    transition: 'all 0.3s ease',
                                    marginRight: 8
                                  }}
                                  onClick={() => handleCancelRequest(request._id)}
                                  onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                  }}
                                >
                                  <FaTimes style={{ marginRight: '5px' }} />
                                  Cancel
                                </Button>
                                {request.packageId && request.productIds.length < request.packageId.productLimit && (
                                  <Button
                                    size="sm"
                                    style={{
                                      background: 'linear-gradient(45deg, #00eaff, #0080ff)',
                                      color: '#0c1220',
                                      border: 'none',
                                      borderRadius: '6px',
                                      fontSize: '0.8rem',
                                      padding: '6px 12px',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => handleOpenAddMore(request)}
                                  >
                                    <FaPlus style={{ marginRight: 4 }} /> Add More
                                  </Button>
                                )}
                              </>
                            )}
                            {request.status === 'approved' && (
                              <Badge bg="success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                <FaCheckCircle style={{ marginRight: '5px' }} />
                                Approved
                              </Badge>
                            )}
                            {request.status === 'rejected' && (
                              <Badge bg="danger" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                <FaBan style={{ marginRight: '5px' }} />
                                Rejected
                              </Badge>
                            )}
                            {request.status === 'active' && (
                              <Badge bg="primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                                <FaRocket style={{ marginRight: '5px' }} />
                                Active
                              </Badge>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

      {/* Add More Products Modal */}
      <Modal show={showAddMoreModal} onHide={() => setShowAddMoreModal(false)} size="lg" centered className="modern-modal-anim">
        <Modal.Header closeButton>
          <Modal.Title>Add More Products</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitAddMore}>
          <Modal.Body style={{ padding: '15px 20px' }}>
            {addMoreRequest && (
              <>
                <div className="package-summary-card">
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Package</span>
                        <span className="package-stat-value">{addMoreRequest.packageId?.title}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Product Limit</span>
                        <span className="package-stat-value">{addMoreRequest.packageId?.productLimit}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Already Added</span>
                        <span className="package-stat-value">{addMoreRequest.productIds.length}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Remaining</span>
                        <span className="package-stat-value" style={{ color: '#00eaff' }}>
                          {addMoreRequest.packageId?.productLimit - addMoreRequest.productIds.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="limit-indicator">
                  <label className="form-label mb-0" style={{ color: '#00eaff', fontWeight: '700' }}>Available Products</label>
                  <div className={`limit-pill ${addProducts.length + addMoreRequest.productIds.length >= (addMoreRequest.packageId?.productLimit || 0) ? 'at-limit' : ''}`}>
                    Selected: {addProducts.length + addMoreRequest.productIds.length} / {addMoreRequest.packageId?.productLimit}
                  </div>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '4px' }}>
                  {productsLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" style={{ color: '#00eaff' }} />
                    </div>
                  ) : (
                    <div className="product-grid-select">
                      {userProducts
                        .filter(product => product.pstatus === 'active')
                        .filter(product => !addMoreRequest.productIds.some(id => (id._id || id) === product._id))
                        .map(product => {
                          const isSelected = addProducts.includes(product._id);
                          const isDisabled = !isSelected && (addProducts.length + addMoreRequest.productIds.length >= (addMoreRequest.packageId?.productLimit || 0));
                          
                          return (
                            <motion.div
                              key={product._id}
                              className={`product-select-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                              whileHover={!isDisabled ? { scale: 1.02 } : {}}
                              whileTap={!isDisabled ? { scale: 0.98 } : {}}
                              onClick={() => !isDisabled && handleAddMoreProductToggle(product._id)}
                            >
                              <img 
                                src={product.pimage1 || product.image || 'https://via.placeholder.com/150'} 
                                alt={product.pname}
                                className="product-select-image"
                              />
                              <div className="product-select-name">{product.pname}</div>
                              <div className="product-select-price">PKR {Number(product.pprice).toFixed(0)}</div>
                              {isSelected && (
                                <div className="selection-check">
                                  <FaCheckCircle />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-light" onClick={() => setShowAddMoreModal(false)} style={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="admin-btn-primary" 
              disabled={addProducts.length === 0 || addingProducts}
              style={{ padding: '10px 24px', borderRadius: '8px' }}
            >
              {addingProducts ? <Spinner animation="border" size="sm" style={{ marginRight: 8 }} /> : <FaPlus style={{ marginRight: 8 }} />} 
              Add Selected
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Request Boost Modal */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} size="lg" centered className="modern-modal-anim">
        <Modal.Header closeButton>
          <Modal.Title>
            <FaRocket style={{ marginRight: '12px', color: '#ffffff' }} />
            Request Product Boost
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitRequest}>
          <Modal.Body style={{ padding: '15px 20px' }}>
            {selectedPackage && (
              <>
                <div className="package-summary-card">
                  <div className="row g-3">
                    <div className="col-md-12 mb-2">
                      <h5 style={{ color: '#fff', marginBottom: '4px' }}>{selectedPackage.title}</h5>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 0 }}>{selectedPackage.description}</p>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Price</span>
                        <span className="package-stat-value" style={{ color: '#00eaff' }}>PKR {Number(selectedPackage.price).toFixed(0)}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Limit</span>
                        <span className="package-stat-value">{selectedPackage.productLimit} Products</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Duration</span>
                        <span className="package-stat-value">{selectedPackage.duration} {selectedPackage.durationType}</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="package-stat">
                        <span className="package-stat-label">Selected</span>
                        <span className="package-stat-value" style={{ color: selectedProducts.length === selectedPackage.productLimit ? '#ff4757' : '#00eaff' }}>
                          {selectedProducts.length} / {selectedPackage.productLimit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="limit-indicator">
                  <label className="form-label mb-0" style={{ color: '#00eaff', fontWeight: '700' }}>Select Products to Boost</label>
                  <div className={`limit-pill ${selectedProducts.length >= selectedPackage.productLimit ? 'at-limit' : selectedProducts.length > 0 ? 'near-limit' : ''}`}>
                    {selectedProducts.length === 0 ? 'Pick up to ' + selectedPackage.productLimit + ' items' : selectedProducts.length + ' / ' + selectedPackage.productLimit + ' selected'}
                  </div>
                </div>

                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px', marginBottom: '15px' }}>
                  {productsLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" style={{ color: '#00eaff' }} />
                    </div>
                  ) : (
                    <div className="product-grid-select">
                      {userProducts
                        .filter(product => product.pstatus === 'active')
                        .map(product => {
                          const isSelected = selectedProducts.includes(product._id);
                          const isDisabled = !isSelected && (selectedProducts.length >= selectedPackage.productLimit);
                          
                          return (
                            <motion.div
                              key={product._id}
                              className={`product-select-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                              whileHover={!isDisabled ? { scale: 1.02 } : {}}
                              whileTap={!isDisabled ? { scale: 0.98 } : {}}
                              onClick={() => !isDisabled && handleProductSelection(product._id)}
                            >
                              <img 
                                src={product.pimage1 || product.image || 'https://via.placeholder.com/150'} 
                                alt={product.pname}
                                className="product-select-image"
                              />
                              <div className="product-select-name">{product.pname}</div>
                              <div className="product-select-price">PKR {Number(product.pprice).toFixed(0)}</div>
                              {isSelected && (
                                <div className="selection-check">
                                  <FaCheckCircle />
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="payment-ss-section">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0" style={{ color: '#00eaff', fontWeight: '700', fontSize: '0.85rem' }}>Upload Payment Screenshot</label>
                    <span style={{ fontSize: '0.8rem', color: '#16e0a0', fontWeight: '600', padding: '4px 10px', background: 'rgba(22, 224, 160, 0.1)', borderRadius: '6px' }}>
                      {paymentInstruction}
                    </span>
                  </div>
                  <div className="d-flex gap-3 align-items-center">
                    <div 
                      style={{ 
                        width: '80px', 
                        height: '60px', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px dashed rgba(0,234,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}
                    >
                      {ssPreview ? (
                        <img src={ssPreview} alt="SS Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem', opacity: 0.3 }}>📷</span>
                      )}
                    </div>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        border: '1px solid rgba(0,234,255,0.2)',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-light" onClick={() => setShowRequestModal(false)} style={{ borderRadius: '8px' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="admin-btn-primary"
              disabled={selectedProducts.length === 0 || selectedProducts.length > (selectedPackage?.productLimit || 0) || submittingRequest}
              style={{ padding: '10px 32px', borderRadius: '8px' }}
            >
              {submittingRequest ? (
                <>
                  <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
                  Sending...
                </>
              ) : (
                <>
                  <FaRocket style={{ marginRight: '8px' }} />
                  Submit Request
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      </>
    </motion.div>
  );
}

export default SellerProductBoost;
