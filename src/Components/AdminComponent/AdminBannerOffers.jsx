import React, { useMemo, useState, useEffect } from "react";
import { Table, Button, Form, Modal, Spinner, Image } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";
import { API_BASE_URL } from "../../config";

function AdminBannerOffers() {
  const queryClient = useQueryClient();

  const { data: offers = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['admin-banner-offers'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/offer/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const createOfferMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(`${API_BASE_URL}/offer/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banner-offers'] });
    }
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const res = await axios.patch(`${API_BASE_URL}/offer/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banner-offers'] });
    }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${API_BASE_URL}/offer/delete/${id}`);
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banner-offers'] });
    }
  });

  const isMutating = createOfferMutation.isPending || updateOfferMutation.isPending || deleteOfferMutation.isPending;
  const error = queryError?.response?.data?.message || queryError?.message || createOfferMutation.error?.response?.data?.message || createOfferMutation.error?.message || updateOfferMutation.error?.response?.data?.message || updateOfferMutation.error?.message || deleteOfferMutation.error?.response?.data?.message || deleteOfferMutation.error?.message || null;

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [currentOffer, setCurrentOffer] = useState({
    _id: "",
    title: "",
    description: "",
    image: "",
    offerStartDateTime: "",
    offerEndDateTime: "",
  });

  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Toast effect
  useEffect(() => {
    if (!toast && !error) return;
    if (error) setToast({ type: "danger", message: error });
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast, error]);

  const handleOpenModal = (offer = null) => {
    if (offer) {
      setEditMode(true);
      setCurrentOffer({
        _id: offer._id ?? "",
        title: offer.title ?? "",
        description: offer.description ?? "",
        image: offer.image ?? "",
        offerStartDateTime: offer.offerStartDateTime?.slice(0, 16) || "",
        offerEndDateTime: offer.offerEndDateTime?.slice(0, 16) || "",
      });
      setImagePreview(offer.image || "");
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentOffer({ _id: "", title: "", description: "", image: "", offerStartDateTime: "", offerEndDateTime: "" });
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

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files?.[0];
      setImageFile(file || null);
      setImagePreview(file ? URL.createObjectURL(file) : currentOffer.image);
    } else {
      setCurrentOffer({ ...currentOffer, [name]: value });
    }
  }

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("title", currentOffer.title || "");
    formData.append("description", currentOffer.description || "");
    formData.append("offerStartDateTime", currentOffer.offerStartDateTime);
    formData.append("offerEndDateTime", currentOffer.offerEndDateTime);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    try {
      if (editMode) {
        await updateOfferMutation.mutateAsync({ id: currentOffer._id, formData });
        setToast({ type: "success", message: "Banner offer updated" });
      } else {
        await createOfferMutation.mutateAsync(formData);
        setToast({ type: "success", message: "Banner offer created" });
      }
      setShowModal(false);
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete this offer?");
    if (!confirm) return;
    try {
      await deleteOfferMutation.mutateAsync(id);
      setToast({ type: "warning", message: "Banner offer deleted" });
    } catch (err) {
      console.error(err);
    }
  };

  const offersList = useMemo(() => offers.map((offer, i) => ({ ...offer, idx: i + 1 })), [offers]);

  // Pagination logic
  const totalPages = Math.ceil(offersList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOffersList = offersList.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <motion.div
      className="modern-banner-offers-admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <style>{`
        .modern-banner-offers-admin {
          padding: 0;
          min-height: auto;
        }

        .bo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .bo-toolbar-title {
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
          min-width: 1100px;
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
          .bo-header-row { margin-bottom: 1.5rem; }
          .bo-toolbar-title { font-size: 1.1rem !important; }
          .admin-btn-primary { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>
      <div className="bo-header-row">
        <span className="bo-toolbar-title">Banner Offers 🏷️</span>
        <motion.button className="admin-btn admin-btn-primary" whileHover={{ scale: 1.07 }} onClick={() => handleOpenModal()}>
          ➕ Add Offer
        </motion.button>
      </div>
      {loading && (
        <motion.p
          className="text-info"
          animate={{ opacity: [0.5, 1, 0.5], color: "#00eaff" }}
          transition={{ duration: 1.7, repeat: Infinity }}
        >
          Loading offers...
        </motion.p>
      )}
      {error && <p className="text-danger">Error: {error}</p>}
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="banner-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Description</th>
              <th>Image</th>
              <th>Start</th>
              <th>End</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentOffersList.length > 0 ? (
                currentOffersList.map((offer) => (
                  <motion.tr key={offer._id} className="bo-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.30 }}>
                    <td>{offer.idx}</td>
                    <td style={{ fontWeight: 600 }}>{offer.title}</td>
                    <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{offer.description}</td>
                    <td>
                      <Image
                        src={offer.image || "https://via.placeholder.com/80x50?text=No+Image"}
                        rounded
                        width="80"
                        height="45"
                        style={{ objectFit: "cover", border: '1px solid rgba(0, 234, 255, 0.1)' }}
                      />
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {offer.offerStartDateTime ? new Date(offer.offerStartDateTime).toLocaleString() : "-"}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {offer.offerEndDateTime ? new Date(offer.offerEndDateTime).toLocaleString() : "-"}
                    </td>
                    <td>
                      <div className="bo-actions">
                        <motion.button
                          className="admin-btn admin-btn-warning"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleOpenModal(offer)}
                        >✏️ Edit</motion.button>
                        <motion.button
                          className="admin-btn admin-btn-danger"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleDelete(offer._id)}
                        >🗑 Delete</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="7" className="text-center text-muted" style={{ padding: 30 }}>No banner offers found.</td>
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
      <Modal show={showModal} onHide={handleCloseModal} centered className="modern-bo-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Update Banner Offer" : "Add Banner Offer"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={currentOffer.title}
                onChange={handleChange}
                placeholder="Enter offer headline"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={currentOffer.description}
                onChange={handleChange}
                placeholder="Enter offer description"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="offerStartDateTime"
                value={currentOffer.offerStartDateTime}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="offerEndDateTime"
                value={currentOffer.offerEndDateTime}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image (banner)</Form.Label>
              <Form.Control type="file" accept="image/*" name="image" onChange={handleChange} />
              {(imagePreview || currentOffer.image) && (
                <div style={{ marginTop: "10px" }}>
                  <Image
                    src={imagePreview || currentOffer.image}
                    rounded
                    width="90"
                    height="55"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={loading}>
            {loading ? (
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
            className={`bo-toast ${toast.type || "info"}`}
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

export default AdminBannerOffers;
