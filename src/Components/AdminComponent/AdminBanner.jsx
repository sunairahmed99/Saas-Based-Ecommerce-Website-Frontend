import React, { useEffect, useState } from "react";
import { Table, Button, Form, Modal, Spinner, Image, Badge } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";
import {
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  selectBanners,
  selectBannersLoading,
  selectBannersError,
  selectCreatingBanner,
  selectUpdatingBanner,
  selectDeletingBanner,
} from "../../Features/Backend/BannerSlice";

function AdminBanner() {
  const dispatch = useDispatch();
  const banners = useSelector(selectBanners) || [];
  const loading = useSelector(selectBannersLoading);
  const error = useSelector(selectBannersError);
  const creating = useSelector(selectCreatingBanner);
  const updating = useSelector(selectUpdatingBanner);
  const deleting = useSelector(selectDeletingBanner);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [currentBanner, setCurrentBanner] = useState({
    _id: "",
    title: "",
    subtitle: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    color: "#00eaff",
    isActive: true,
    sortOrder: 0,
    image: "",
  });

  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  // Toast effect
  useEffect(() => {
    if (!toast && !error) return;
    if (error) setToast({ type: "danger", message: error });
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast, error]);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditMode(true);
      setCurrentBanner({
        _id: banner._id ?? "",
        title: banner.title ?? "",
        subtitle: banner.subtitle ?? "",
        description: banner.description ?? "",
        buttonText: banner.buttonText ?? "",
        buttonLink: banner.buttonLink ?? "",
        color: banner.color ?? "#00eaff",
        isActive: banner.isActive ?? true,
        sortOrder: banner.sortOrder ?? 0,
        image: banner.image ?? "",
      });
      setImagePreview(banner.image || "");
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentBanner({
        _id: "",
        title: "",
        subtitle: "",
        description: "",
        buttonText: "Shop Now",
        buttonLink: "/shop",
        color: "#00eaff",
        isActive: true,
        sortOrder: 0,
        image: "",
      });
      setImagePreview("");
      setImageFile(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setImageFile(null);
    setImagePreview("");
  };

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === "image") {
      const file = files?.[0];
      setImageFile(file || null);
      setImagePreview(file ? URL.createObjectURL(file) : currentBanner.image);
    } else if (type === "checkbox") {
      setCurrentBanner({ ...currentBanner, [name]: checked });
    } else {
      setCurrentBanner({ ...currentBanner, [name]: value });
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", currentBanner.title || "");
    formData.append("subtitle", currentBanner.subtitle || "");
    formData.append("description", currentBanner.description || "");
    formData.append("buttonText", currentBanner.buttonText || "Shop Now");
    formData.append("buttonLink", currentBanner.buttonLink || "/shop");
    formData.append("color", currentBanner.color || "#00eaff");
    formData.append("isActive", currentBanner.isActive ? "true" : "false");
    formData.append("sortOrder", currentBanner.sortOrder?.toString() || "0");
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editMode) {
        await dispatch(updateBanner({ id: currentBanner._id, bannerData: formData })).unwrap();
        setToast({ type: "success", message: "Banner updated successfully" });
      } else {
        await dispatch(createBanner(formData)).unwrap();
        setToast({ type: "success", message: "Banner created successfully" });
      }
      setShowModal(false);
      setImageFile(null);
      setImagePreview("");
      dispatch(fetchBanners()); // Refresh the list
    } catch (err) {
      setToast({ type: "danger", message: err || "Operation failed" });
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this banner?");
    if (!confirm) return;
    try {
      await dispatch(deleteBanner(id)).unwrap();
      setToast({ type: "warning", message: "Banner deleted successfully" });
      dispatch(fetchBanners()); // Refresh the list
    } catch (err) {
      setToast({ type: "danger", message: err || "Delete failed" });
    }
  };

  const bannersList = banners.map((banner, i) => ({ ...banner, idx: i + 1 }));

  // Pagination logic
  const totalPages = Math.ceil(bannersList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBanners = bannersList.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <motion.div
      className="modern-banner-admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <style>{`
        .modern-banner-admin {
          padding: 0;
          min-height: auto;
        }

        .banner-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .banner-toolbar-title {
          font-size: 1.1rem !important; 
          font-weight: 800; 
          color: #00eaff;
          text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .banner-table-glass { 
          margin-bottom: 0 !important; 
          min-width: 1200px;
        }

        .banner-table-glass th, .banner-table-glass td {
          white-space: nowrap;
          padding: 15px 20px;
          text-align: left;
        }

        .banner-table-glass th {
          background: rgba(0, 234, 255, 0.05) !important;
          color: #00eaff;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(0, 234, 255, 0.1) !important;
        }

        .banner-table-glass td {
          color: #cbd5e1;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        @media (max-width: 768px) {
          .banner-header-row { margin-bottom: 1.5rem; }
          .banner-toolbar-title { font-size: 1.1rem !important; }
          .admin-btn-primary { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>

      <div className="banner-header-row">
        <span className="banner-toolbar-title">Homepage Banners 🖼️</span>
        <motion.button className="admin-btn admin-btn-primary" whileHover={{ scale: 1.07 }} onClick={() => handleOpenModal()}>
          ➕ Add Banner
        </motion.button>
      </div>

      {loading && (
        <motion.p
          className="text-info"
          animate={{ opacity: [0.5, 1, 0.5], color: "#00eaff" }}
          transition={{ duration: 1.7, repeat: Infinity }}
        >
          Loading banners...
        </motion.p>
      )}

      {error && <p className="text-danger">Error: {error}</p>}

      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="banner-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Image</th>
              <th>Status</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentBanners.length > 0 ? (
                currentBanners.map((banner) => (
                  <motion.tr key={banner._id} className="banner-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.30 }}>
                    <td>{banner.idx}</td>
                    <td style={{ fontWeight: 600 }}>{banner.title}</td>
                    <td>
                      <Image
                        src={banner.image || "https://via.placeholder.com/80x50?text=No+Image"}
                        rounded
                        width="80"
                        height="45"
                        style={{ objectFit: "cover", border: '1px solid rgba(0, 234, 255, 0.1)' }}
                      />
                    </td>
                    <td>
                      <Badge bg={banner.isActive ? "success" : "secondary"} style={{ padding: '6px 10px', borderRadius: '6px' }}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>{banner.sortOrder}</td>
                    <td>
                      <div className="banner-actions">
                        <motion.button
                          className="admin-btn admin-btn-warning"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleOpenModal(banner)}
                        >✏️ Edit</motion.button>
                        <motion.button
                          className="admin-btn admin-btn-danger"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleDelete(banner._id)}
                        >🗑 Delete</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="6" className="text-center text-muted" style={{ padding: 30 }}>No banners found.</td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </Table>
      </div>
      <ReusablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal for add/edit */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg" className="modern-banner-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Update Banner" : "Add Banner"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentBanner.title}
                onChange={handleChange}
                placeholder="Enter banner title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subtitle *</Form.Label>
              <Form.Control
                type="text"
                name="subtitle"
                value={currentBanner.subtitle}
                onChange={handleChange}
                placeholder="Enter banner subtitle"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={currentBanner.description}
                onChange={handleChange}
                placeholder="Enter banner description"
                required
              />
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Button Text</Form.Label>
                  <Form.Control
                    type="text"
                    name="buttonText"
                    value={currentBanner.buttonText}
                    onChange={handleChange}
                    placeholder="Shop Now"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Button Link</Form.Label>
                  <Form.Control
                    type="text"
                    name="buttonLink"
                    value={currentBanner.buttonLink}
                    onChange={handleChange}
                    placeholder="/shop"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Theme Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="color"
                    value={currentBanner.color}
                    onChange={handleChange}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Sort Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="sortOrder"
                    value={currentBanner.sortOrder}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                label="Active"
                checked={currentBanner.isActive}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Banner Image *</Form.Label>
              <Form.Control type="file" accept="image/*" name="image" onChange={handleChange} />
              {(imagePreview || currentBanner.image) && (
                <div style={{ marginTop: "10px" }}>
                  <Image
                    src={imagePreview || currentBanner.image}
                    rounded
                    width="200"
                    height="100"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={creating || updating}>
            {creating || updating ? (
              <Spinner animation="border" size="sm" />
            ) : editMode ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`banner-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AdminBanner;
