import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Form, Image, Modal, Spinner } from "react-bootstrap";
import { useMutation } from "@tanstack/react-query";
import { useAdminQuery, adminQueryKeys, useQueryClient } from "../../hooks/useAdminApi";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";

function SubCategories() {
  const queryClient = useQueryClient();

  const { data: subcategoryData = [], isLoading, error: queryError } = useAdminQuery({
    queryKey: adminQueryKeys.subcategories,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/subcategory/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: categories = [] } = useAdminQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/category/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const createSubcategoryMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(`${API_BASE_URL}/subcategory/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.subcategories });
    }
  });

  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const res = await axios.patch(`${API_BASE_URL}/subcategory/update/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.subcategories });
    }
  });

  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${API_BASE_URL}/subcategory/delete/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.subcategories });
    }
  });

  const loading = isLoading || createSubcategoryMutation.isPending || updateSubcategoryMutation.isPending || deleteSubcategoryMutation.isPending;
  const error = queryError?.response?.data?.message || queryError?.message || createSubcategoryMutation.error?.response?.data?.message || createSubcategoryMutation.error?.message || updateSubcategoryMutation.error?.response?.data?.message || updateSubcategoryMutation.error?.message || deleteSubcategoryMutation.error?.response?.data?.message || deleteSubcategoryMutation.error?.message || null;

  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filteredBy, setFilteredBy] = useState("");
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [currentSubCategory, setCurrentSubCategory] = useState({
    _id: "",
    name: "",
    Image: "",
    catid: "",
  });

  const handleOpenModal = (subCat = null) => {
    if (subCat) {
      setEditMode(true);
      setCurrentSubCategory({
        _id: subCat?._id ?? "",
        name: subCat?.name ?? "",
        Image: subCat?.Image ?? "",
        catid: subCat?.catid?._id ?? "",
      });
      setImagePreview(subCat?.Image || "");
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentSubCategory({
        _id: "",
        name: "",
        Image: "",
        catid: "",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubCategory({ ...currentSubCategory, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : currentSubCategory.Image);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", currentSubCategory.name);
    formData.append("catid", currentSubCategory.catid);
    if (imageFile) formData.append("image", imageFile);

    try {
      if (editMode) {
        await updateSubcategoryMutation.mutateAsync({ id: currentSubCategory._id, formData });
        setToast({ type: "success", message: "Sub-category updated" });
      } else {
        await createSubcategoryMutation.mutateAsync(formData);
        setToast({ type: "success", message: "Sub-category created" });
      }
      setShowModal(false);
      setImageFile(null);
      setImagePreview("");
    } catch (err) {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Operation failed" });
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this sub-category?"
    );
    if (!confirm) return;
    try {
      await deleteSubcategoryMutation.mutateAsync(id);
      setToast({ type: "warning", message: "Sub-category deleted" });
    } catch (err) {
      setToast(
        {
          type: "danger",
          message:
            err?.response?.data?.message || err?.message ||
            "Delete failed (ensure backend delete route is enabled on /subcategory/delete/:id)",
        }
      );
    }
  };

  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
    setFilteredBy(value ? "Filtered By: " + value : "");
  };

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredSubCategories = useMemo(() => {
    const sortedData = [...(subcategoryData || [])].sort((a, b) => {
      const n1 = a?.name?.toLowerCase() ?? "";
      const n2 = b?.name?.toLowerCase() ?? "";
      return sortOrder === "asc" ? n1.localeCompare(n2) : n2.localeCompare(n1);
    });
    const f = filter.toLowerCase();
    return sortedData.filter((subCat) => {
      return (
        subCat?.name?.toLowerCase().includes(f) ||
        subCat?.catid?.name?.toLowerCase().includes(f) ||
        subCat?._id?.toLowerCase().includes(f)
      );
    });
  }, [subcategoryData, filter, sortOrder]);

  const totalPages = Math.ceil(filteredSubCategories.length / itemsPerPage);
  const currentSubCategories = filteredSubCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sortOrder]);

  useEffect(() => {
    if (!toast && !error) return;
    if (error) setToast({ type: "danger", message: error });
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast, error]);

  return (
    <motion.div
      className="modern-subcategories-admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <style>{`
        .modern-subcategories-admin {
          padding: 0;
          min-height: auto;
        }

        .subcat-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .subcat-toolbar-title {
          font-size: 1.1rem !important; font-weight: 800; color: #00eaff;
          text-shadow: 0 0 20px rgba(0, 234, 255, 0.2);
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
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          align-items: flex-end;
        }

        .filter-group { flex: 1; min-width: 250px; display: flex; flex-direction: column; gap: 8px; }
        .filter-label {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .search-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(0, 234, 255, 0.2) !important;
          color: #f8fafc !important;
          padding: 12px 20px !important;
          border-radius: 12px !important;
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .subcat-table-glass { 
          margin-bottom: 0 !important; 
          min-width: 1100px;
        }

        .subcat-table-glass th, .subcat-table-glass td {
          white-space: nowrap;
          padding: 15px 20px;
        }

        @media (max-width: 768px) {
          .subcat-header-row { margin-bottom: 1.5rem; }
          .subcat-toolbar-title { font-size: 1.1rem !important; }
          .filters-row { grid-template-columns: 1fr; display: grid; gap: 15px; }
          .admin-btn-primary { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>
      <div className="subcat-header-row">
        <span className="subcat-toolbar-title">Sub-Categories 📁</span>
        <motion.button className="admin-btn admin-btn-primary" whileHover={{ scale: 1.07 }} onClick={() => handleOpenModal()}>
          ➕ Add Sub-Category
        </motion.button>
      </div>

      <div className="filter-section-card">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Search Sub-Categories</label>
            <Form.Control
              className="search-input"
              type="text"
              placeholder="🔍 Search by category, name or ID..."
              value={filter}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group action-group">
            <label className="filter-label">&nbsp;</label>
            <motion.button className="admin-btn admin-btn-ghost w-100" whileTap={{ scale: 0.95 }} onClick={handleSort}>
              Sort by Name {sortOrder === "asc" ? "↑" : "↓"}
            </motion.button>
          </div>
        </div>
      </div>
      {filteredBy && (
        <motion.p
          className="text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <small>{filteredBy}</small>
        </motion.p>
      )}
      {loading && (
        <motion.p
          className="text-info"
          animate={{ opacity: [0.5, 1, 0.5], color: "#00eaff" }}
          transition={{ duration: 1.7, repeat: Infinity }}
        >
          Loading sub-categories...
        </motion.p>
      )}
      {error && <p className="text-danger">Error: {error}</p>}
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="subcat-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Sub Category Name</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentSubCategories.length > 0 ? (
                currentSubCategories.map((subCat, index) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                  <motion.tr key={subCat._id} className="subcat-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                    <td>{globalIdx}</td>
                    <td style={{ color: '#94a3b8' }}>{subCat?.catid?.name ?? "N/A"}</td>
                    <td style={{ fontWeight: 600 }}>{subCat?.name ?? "N/A"}</td>
                    <td>
                      <Image
                        src={subCat?.Image || "https://via.placeholder.com/60?text=No+Image"}
                        rounded
                        width="80"
                        height="50"
                        style={{ objectFit: "cover", border: '1px solid rgba(0, 234, 255, 0.2)' }}
                      />
                    </td>
                    <td>
                      <div className="subcat-actions">
                        <motion.button
                          className="admin-btn admin-btn-warning"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleOpenModal(subCat)}
                        >✏️ Edit</motion.button>
                        <motion.button
                          className="admin-btn admin-btn-danger"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleDelete(subCat._id)}
                        >🗑 Delete</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="5" className="text-center text-muted">No sub-categories found.</td>
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
      {/* Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered className="modern-subcat-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Update Sub-Category" : "Add Sub-Category"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Category</Form.Label>
              <Form.Select
                name="catid"
                value={currentSubCategory.catid}
                onChange={handleInputChange}
              >
                <option value="">Choose Category</option>
                {(categories || []).map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Sub Category Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentSubCategory.name}
                onChange={handleInputChange}
                placeholder="Enter Sub Category Name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image (optional)</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              {(imagePreview || currentSubCategory.Image) && (
                <div style={{ marginTop: "10px" }}>
                  <Image
                    src={imagePreview || currentSubCategory.Image}
                    rounded
                    width="100"
                    height="80"
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
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`subcat-toast ${toast.type || "info"}`}
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

export default SubCategories;
