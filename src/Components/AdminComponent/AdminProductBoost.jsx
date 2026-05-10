import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Tab,
  Tabs,
  Card,
  Badge,
  Row,
  Col,
  InputGroup,
  FormControl
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";
import { API_BASE_URL } from '../../config';
import {
  fetchAllBoostPackages,
  createBoostPackage,
  updateBoostPackage,
  toggleBoostPackageStatus,
  selectAllBoostPackages,
  selectActiveBoostPackages,
  selectBoostPackageLoading,
  selectBoostPackageError
} from "../../Features/Backend/BoostPackageSlice";
import {
  fetchPendingBoostRequests,
  fetchAllBoostRequests,
  approveOrRejectBoostRequest,
  selectPendingBoostRequests,
  selectAllBoostRequests,
  selectProductBoostLoading,
  selectProductBoostError
} from "../../Features/Backend/ProductBoostSlice";
import {
  FaCheck,
  FaTimes,
  FaPlus,
  FaEdit,
  FaToggleOn,
  FaToggleOff,
  FaRocket,
  FaEye,
  FaClock,
  FaSearch,
  FaBan,
  FaCheckCircle,
  FaCog,
  FaList,
  FaStore,
  FaTag,
  FaCoins
} from "react-icons/fa";

function AdminProductBoost() {
  const dispatch = useDispatch();

  const styles = `
    .modern-admin-boost {
      padding: 0;
      min-height: auto;
    }

    .boost-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      margin-bottom: 2rem;
    }

    .p-toolbar-title {
      font-size: 1.1rem !important;
      font-weight: 800 !important;
      color: #00eaff !important;
      text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-section-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 234, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .filters-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      align-items: end;
    }

    .filter-group { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
    }

    .filter-label {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .search-input, .form-select {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(0, 234, 255, 0.2) !important;
      color: #f8fafc !important;
      padding: 10px 15px !important;
      border-radius: 10px !important;
      height: 45px !important;
    }

    /* Standardized Tabs Styling */
    .nav-tabs {
      border-bottom: 2px solid rgba(0, 234, 255, 0.1) !important;
      gap: 12px;
      margin-bottom: 30px !important;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .nav-tabs::-webkit-scrollbar { display: none; }

    .nav-tabs .nav-link {
      background: transparent !important;
      color: #94a3b8 !important;
      border: none !important;
      border-bottom: 2px solid transparent !important;
      padding: 12px 20px !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 1px;
      transition: all 0.3s ease !important;
      white-space: nowrap;
    }

    .nav-tabs .nav-link.active {
      color: #00eaff !important;
      border-bottom: 2px solid #00eaff !important;
      text-shadow: 0 0 10px rgba(0, 234, 255, 0.5);
    }

    .table-responsive-container {
      background: rgba(15, 23, 42, 0.8);
      border-radius: 16px;
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.05);
      margin-bottom: 10px;
      width: 100%;
      -webkit-overflow-scrolling: touch;
    }

    .p-table-glass { 
      margin-bottom: 0 !important; 
      min-width: 1200px;
    }

    .p-table-glass th, .p-table-glass td {
      white-space: nowrap;
      padding: 18px 20px;
      text-align: left;
    }

    .p-table-glass th {
      background: #1e293b !important;
      color: #ffffff !important;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.5px;
      border-bottom: 2px solid rgba(0, 234, 255, 0.2) !important;
      padding: 18px 20px !important;
    }

    .p-table-glass td {
      color: #f1f5f9;
      vertical-align: middle;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      padding: 15px 20px !important;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    @media (max-width: 768px) {
      .boost-header-row { 
        flex-direction: column; 
        align-items: stretch; 
        gap: 20px;
        margin-bottom: 2rem;
      }
      .p-toolbar-title { 
        font-size: 1.2rem !important; 
        justify-content: center;
      }
      .filters-row { 
        grid-template-columns: 1fr; 
        gap: 15px; 
      }
      .nav-tabs {
        flex-direction: row;
        width: 100%;
        justify-content: flex-start;
      }
      .admin-btn-primary {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  const packages = useSelector(selectAllBoostPackages) || [];
  const packageLoading = useSelector(selectBoostPackageLoading);
  const packageError = useSelector(selectBoostPackageError);

  const allRequests = useSelector(selectAllBoostRequests) || [];
  const requestLoading = useSelector(selectProductBoostLoading);
  const requestError = useSelector(selectProductBoostError);

  const [activeTab, setActiveTab] = useState("packages");
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    title: "",
    description: "",
    price: "",
    productLimit: "",
    duration: "",
    durationType: "days"
  });
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);

  const [paymentInstruction, setPaymentInstruction] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [packagesPage, setPackagesPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const itemsPerPage = 10;

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/platform-settings`);
      if (res.data.success && res.data.data) {
        setPaymentInstruction(res.data.data.paymentInstruction);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.patch(`${API_BASE_URL}/api/platform-settings`, { paymentInstruction });
      showToast("Payment instructions updated", "success");
    } catch (error) {
      showToast("Failed to update settings", "danger");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    dispatch(fetchAllBoostPackages());
    dispatch(fetchPendingBoostRequests());
    dispatch(fetchAllBoostRequests());
    fetchSettings();
  }, [dispatch]);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...packageForm,
      price: Number(packageForm.price),
      productLimit: Number(packageForm.productLimit),
      duration: Number(packageForm.duration)
    };

    try {
      if (editingPackage) {
        await dispatch(
          updateBoostPackage({
            packageId: editingPackage._id,
            updateData: data
          })
        ).unwrap();
        showToast("Package updated successfully", "success");
      } else {
        await dispatch(createBoostPackage(data)).unwrap();
        showToast("Package created successfully", "success");
      }
      setShowPackageModal(false);
      resetForm();
    } catch (err) {
      showToast(err?.message || "Error", "danger");
    }
  };

  const resetForm = () => {
    setPackageForm({
      title: "",
      description: "",
      price: "",
      productLimit: "",
      duration: "",
      durationType: "days"
    });
    setEditingPackage(null);
  };

  const handleToggleStatus = async (packageId, isActive) => {
    try {
      await dispatch(toggleBoostPackageStatus({ packageId, isActive })).unwrap();
      showToast(`Package ${isActive ? 'activated' : 'deactivated'} successfully`, "success");
    } catch (err) {
      showToast(err?.message || "Error updating package status", "danger");
    }
  };

  const handleApproveRequest = async (requestId, action) => {
    try {
      await dispatch(approveOrRejectBoostRequest({ requestId, action })).unwrap();
      showToast(`Request ${action} successfully`, "success");
      dispatch(fetchPendingBoostRequests());
      dispatch(fetchAllBoostRequests());
    } catch (err) {
      showToast(err?.message || "Error updating request", "danger");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FaClock className="text-warning" />;
      case 'approved': return <FaCheck className="text-success" />;
      case 'rejected': return <FaTimes className="text-danger" />;
      case 'active': return <FaRocket className="text-primary" />;
      case 'cancelled': return <FaBan className="text-dark" />;
      default: return null;
    }
  };

  const filteredRequests = useMemo(() => {
    let list = [...allRequests];
    if (searchTerm) {
      list = list.filter(
        (r) =>
          r.sellerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.packageId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    
    if (sortBy === "newest") list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === "oldest") list.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === "highest-amount") list.sort((a,b) => b.totalAmount - a.totalAmount);
    else if (sortBy === "lowest-amount") list.sort((a,b) => a.totalAmount - b.totalAmount);

    return list;
  }, [allRequests, searchTerm, statusFilter, sortBy]);

  const currentPackages = useMemo(() => {
    const start = (packagesPage - 1) * itemsPerPage;
    return packages.slice(start, start + itemsPerPage);
  }, [packages, packagesPage]);

  const currentRequests = useMemo(() => {
    const start = (requestsPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, requestsPage]);

  const totalPackagesPages = Math.ceil(packages.length / itemsPerPage);
  const totalRequestsPages = Math.ceil(filteredRequests.length / itemsPerPage);

  useEffect(() => {
    setRequestsPage(1);
  }, [searchTerm, statusFilter, sortBy]);

  return (
    <motion.div
      className="modern-admin-boost"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <style>{styles}</style>

      <div className="boost-header-row">
        <div className="p-toolbar-title">
          <FaRocket /> Product Boost Management
        </div>
        <div className="d-flex gap-2 flex-wrap" style={{ width: '100%', maxWidth: '400px' }}>
          <motion.button
            className="admin-btn admin-btn-primary flex-fill"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowPackageModal(true)}
            style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem' }}
          >
            <FaPlus /> Create Package
          </motion.button>
          <motion.button
            className="admin-btn admin-btn-secondary flex-fill"
            whileHover={{ scale: 1.05 }}
            onClick={() => setActiveTab("settings")}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
          >
            <FaCog /> Platform Settings
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className={`p-toast ${toast.type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {(packageError || requestError) && (
        <div style={{margin:'20px auto',maxWidth:480,background:'linear-gradient(90deg,#ff5f7a 30%,#ff3838 100%)',color:'white',fontWeight:700,padding:'18px',borderRadius:'11px',boxShadow:'0 2px 24px #ff475766',textAlign:'center',letterSpacing:'0.04em',fontSize:'1.10rem'}}>
          {packageError || requestError}
        </div>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => k && setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="packages" title={<span><FaRocket className="me-2" /> Boost Packages</span>}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(0, 234, 255, 0.1)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}
              className="mb-4"
            >
              <Card.Body style={{ padding: '1.5rem' }}>
                {packageLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="info" />
                    <div className="text-info mt-2">Loading packages...</div>
                  </div>
                ) : packages.length === 0 ? (
                  <div className="text-center py-5 text-muted">No boost packages found</div>
                ) : (
                  <>
                    <div className="table-responsive-container">
                      <Table striped bordered hover variant="dark" className="p-table-glass">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Price</th>
                            <th>Products</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentPackages.map((pkg, index) => (
                            <motion.tr
                              key={pkg._id}
                              className="p-row-anim"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.35, delay: index * 0.05 }}
                            >
                              <td style={{ fontWeight: 600 }}>
                                <FaTag style={{ color: '#00eaff', marginRight: '8px' }} />
                                {pkg.title}
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                <FaCoins style={{ color: '#f59e0b', marginRight: '8px' }} />
                                PKR {pkg.price}
                              </td>
                              <td>{pkg.productLimit} products</td>
                              <td>{pkg.duration} {pkg.durationType}</td>
                              <td>
                                <Badge bg={pkg.isActive ? 'success' : 'secondary'}>
                                  {pkg.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                              <td>
                                <div className="p-actions">
                                  <motion.button
                                    className="admin-btn admin-btn-warning"
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                    onClick={() => {
                                      setEditingPackage(pkg);
                                      setPackageForm({
                                        title: pkg.title,
                                        description: pkg.description,
                                        price: pkg.price,
                                        productLimit: pkg.productLimit,
                                        duration: pkg.duration,
                                        durationType: pkg.durationType
                                      });
                                      setShowPackageModal(true);
                                    }}
                                  >
                                    <FaEdit />
                                  </motion.button>
                                  <motion.button
                                    className={`admin-btn ${pkg.isActive ? 'admin-btn-danger' : 'admin-btn-success'}`}
                                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                    onClick={() => handleToggleStatus(pkg._id, !pkg.isActive)}
                                  >
                                    {pkg.isActive ? <FaToggleOff /> : <FaToggleOn />}
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <ReusablePagination 
                      currentPage={packagesPage}
                      totalPages={totalPackagesPages}
                      onPageChange={setPackagesPage}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Tab>

        <Tab eventKey="requests" title={<span><FaList className="me-2" /> Boost Requests</span>}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="filter-section-card">
              <div className="filters-row">
                <div className="filter-group">
                  <label className="filter-label">Search Requests</label>
                  <FormControl
                    className="search-input"
                    placeholder="Search seller, package, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label className="filter-label">Filter by Status</label>
                  <Form.Select
                    className="search-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="active">Active</option>
                  </Form.Select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">Sort Requests</label>
                  <Form.Select
                    className="search-input"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest-amount">Highest Amount</option>
                    <option value="lowest-amount">Lowest Amount</option>
                  </Form.Select>
                </div>
                <div className="filter-group">
                  <label className="filter-label">&nbsp;</label>
                  <div className="text-info text-center" style={{ fontSize: '0.85rem', fontWeight: 600, height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 234, 255, 0.05)', borderRadius: '10px', border: '1px solid rgba(0, 234, 255, 0.1)' }}>
                    {filteredRequests.length} Total
                  </div>
                </div>
              </div>
            </div>

            <Card
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(0, 234, 255, 0.1)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Card.Body style={{ padding: '1.5rem' }}>
                {requestLoading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="info" />
                    <div className="text-info mt-2">Loading requests...</div>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-5 text-muted">No boost requests found</div>
                ) : (
                  <>
                    <div className="table-responsive-container">
                      <Table striped bordered hover variant="dark" className="p-table-glass">
                        <thead>
                          <tr>
                            <th>Seller</th>
                            <th>Package</th>
                            <th>Status</th>
                            <th>Amount</th>
                            <th>Requested</th>
                            <th>Screenshot</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentRequests.map((request, index) => (
                            <motion.tr
                              key={request._id}
                              className="p-row-anim"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <td style={{ fontWeight: 600 }}>
                                <FaStore style={{ color: '#00eaff', marginRight: '8px' }} />
                                {request.sellerId?.name || 'N/A'}
                              </td>
                              <td>
                                <FaTag style={{ color: '#10b981', marginRight: '8px' }} />
                                {request.packageId?.title || 'N/A'}
                              </td>
                              <td>
                                <div className="status-badge" style={{ 
                                  background: request.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 
                                              request.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: request.status === 'pending' ? '#f59e0b' : 
                                         request.status === 'approved' ? '#10b981' : '#ef4444',
                                  border: `1px solid ${request.status === 'pending' ? '#f59e0b40' : 
                                                      request.status === 'approved' ? '#10b98140' : '#ef444440'}`
                                }}>
                                  {getStatusIcon(request.status)}
                                  <span className="ms-1">{request.status}</span>
                                </div>
                              </td>
                              <td style={{ fontWeight: 700 }}>
                                <FaCoins style={{ color: '#f59e0b', marginRight: '8px' }} />
                                PKR {request.totalAmount}
                              </td>
                              <td style={{ fontSize: '0.85rem' }}>
                                {new Date(request.createdAt).toLocaleDateString()}
                              </td>
                              <td>
                                {request.paymentScreenshot ? (
                                  <div 
                                    style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(0,234,255,0.3)' }}
                                    onClick={() => setSelectedScreenshot(request.paymentScreenshot)}
                                  >
                                    <img 
                                      src={request.paymentScreenshot} 
                                      alt="Payment" 
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted" style={{ fontSize: '0.75rem' }}>No Photo</span>
                                )}
                              </td>
                              <td>
                                <div className="p-actions">
                                  {request.status === 'pending' && (
                                    <>
                                      <motion.button
                                        className="admin-btn admin-btn-success"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => handleApproveRequest(request._id, 'approve')}
                                      >
                                        <FaCheck /> Approve
                                      </motion.button>
                                      <motion.button
                                        className="admin-btn admin-btn-danger"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => handleApproveRequest(request._id, 'reject')}
                                      >
                                        <FaTimes /> Reject
                                      </motion.button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <ReusablePagination 
                      currentPage={requestsPage}
                      totalPages={totalRequestsPages}
                      onPageChange={setRequestsPage}
                    />
                  </>
                )}
              </Card.Body>
            </Card>
          </motion.div>
        </Tab>

        <Tab eventKey="settings" title={<span><FaCog className="me-2" /> Settings</span>}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(0, 234, 255, 0.1)',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Card.Body style={{ padding: '2rem' }}>
                <h4 style={{ color: '#00eaff', marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.1rem' }}>Platform Settings</h4>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label style={{ color: '#00eaff', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Payment Instructions (for Sellers)</Form.Label>
                      <InputGroup>
                        <Form.Control
                          as="textarea"
                          rows={6}
                          placeholder="Enter payment instructions for sellers to follow when requesting a boost..."
                          value={paymentInstruction}
                          onChange={(e) => setPaymentInstruction(e.target.value)}
                          style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(0, 234, 255, 0.2)',
                            color: '#f8fafc',
                            borderRadius: '12px 12px 0 0',
                            padding: '15px'
                          }}
                        />
                      </InputGroup>
                      <Button 
                        variant="primary" 
                        className="w-100 py-3 admin-btn admin-btn-primary"
                        disabled={savingSettings}
                        onClick={saveSettings}
                        style={{ height: '55px', borderRadius: '0 0 12px 12px' }}
                      >
                        {savingSettings ? <Spinner size="sm" /> : 'Save Instructions'}
                      </Button>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </motion.div>
        </Tab>
      </Tabs>

      <Modal
        show={showPackageModal}
        onHide={() => {
          setShowPackageModal(false);
          resetForm();
        }}
        centered
        size="lg"
        className="modern-modal-anim"
      >
        <Form onSubmit={handlePackageSubmit}>
          <Modal.Header closeButton>
            <Modal.Title style={{color:'white'}}>
              {editingPackage ? "Edit Package" : "Create Package"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Package Title</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter package title"
                      value={packageForm.title}
                      onChange={(e) => setPackageForm({ ...packageForm, title: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0'
                      }}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter package description"
                      value={packageForm.description}
                      onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0',
                        resize: 'vertical'
                      }}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Price (PKR)</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter price"
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0'
                      }}
                      min="0"
                      step="0.01"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Product Limit</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Max products per boost"
                      value={packageForm.productLimit}
                      onChange={(e) => setPackageForm({ ...packageForm, productLimit: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0'
                      }}
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Duration</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Enter duration"
                      value={packageForm.duration}
                      onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0'
                      }}
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#00eaff', fontWeight: '600' }}>Duration Type</Form.Label>
                    <Form.Select
                      value={packageForm.durationType}
                      onChange={(e) => setPackageForm({ ...packageForm, durationType: e.target.value })}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid #00eaff40',
                        color: '#e0e0e0'
                      }}
                      required
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {editingPackage && (
                <Row>
                  <Col md={12}>
                    <div style={{
                      background: 'rgba(0, 234, 255, 0.1)',
                      border: '1px solid #00eaff40',
                      borderRadius: '8px',
                      padding: '15px',
                      marginTop: '10px'
                    }}>
                      <h6 style={{ color: '#00eaff', margin: 0, fontWeight: '600' }}>
                        <FaEdit style={{ marginRight: '8px' }} />
                        Editing Package: {editingPackage.title}
                      </h6>
                      <p style={{ color: '#b0b0b0', margin: '5px 0 0 0', fontSize: '0.9rem' }}>
                        Make your changes and click "Save" to update the package
                      </p>
                    </div>
                  </Col>
                </Row>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      <Modal
        show={!!selectedScreenshot}
        onHide={() => setSelectedScreenshot(null)}
        centered
        size="lg"
        className="modern-modal-anim"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{color:'white'}}>Payment Screenshot</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 text-center" style={{ background: '#0f172a' }}>
          {selectedScreenshot && (
            <img 
              src={selectedScreenshot} 
              alt="Payment Full" 
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} 
            />
          )}
        </Modal.Body>
      </Modal>
    </motion.div>
  );
};

export default AdminProductBoost;
