import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Form, Image, Modal, Spinner } from "react-bootstrap";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { motion, AnimatePresence } from "framer-motion";
import ReusablePagination from "../ReusablePagination";

function Categories() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token")?.replace(/^Bearer\s+/i, "");

  const { data: categoryData = [], isLoading, error: queryError } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/category/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axios.post(`${API_BASE_URL}/category/create`, formData, {
        headers: {
          auth_token: token,
          "Content-Type": "multipart/form-data",
        }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, formData }) => {
      const res = await axios.patch(`${API_BASE_URL}/category/update/${id}`, formData, {
        headers: {
          auth_token: token,
          "Content-Type": "multipart/form-data",
        }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`${API_BASE_URL}/category/delete/${id}`, {
        headers: { auth_token: token }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    }
  });

  const loading = isLoading || createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending;
  const error = queryError?.response?.data?.message || queryError?.message || createCategoryMutation.error?.response?.data?.message || createCategoryMutation.error?.message || updateCategoryMutation.error?.response?.data?.message || updateCategoryMutation.error?.message || deleteCategoryMutation.error?.response?.data?.message || deleteCategoryMutation.error?.message || null;

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

  const [currentCategory, setCurrentCategory] = useState({
    _id: "",
    name: "",
    Image: "",
  });

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory({
        _id: category._id ?? "",
        name: category.name ?? "",
        Image: category.Image ?? "",
      });
      setImagePreview(category.Image || "");
      setImageFile(null);
    } else {
      setEditMode(false);
      setCurrentCategory({ _id: "", name: "", Image: "" });
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
    setCurrentCategory({ ...currentCategory, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setImageFile(file || null);
    setImagePreview(file ? URL.createObjectURL(file) : currentCategory.Image);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append("name", currentCategory.name);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      if (editMode) {
        await updateCategoryMutation.mutateAsync({ id: currentCategory._id, formData });
        setToast({ type: "success", message: "Category updated" });
      } else {
        await createCategoryMutation.mutateAsync(formData);
        setToast({ type: "success", message: "Category created" });
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
      "Are you sure you want to delete this category?"
    );
    if (!confirm) return;
    try {
      await deleteCategoryMutation.mutateAsync(id);
      setToast({ type: "warning", message: "Category deleted" });
    } catch (err) {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Delete failed" });
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
  const filteredCategories = useMemo(() => {
    const sortedData = [...(categoryData || [])].sort((a, b) => {
      const nameA = a?.name?.toLowerCase() ?? "";
      const nameB = b?.name?.toLowerCase() ?? "";
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
    const f = filter.toLowerCase();
    return sortedData.filter(
      (cat) =>
        cat?.name?.toLowerCase().includes(f) ||
        cat?._id?.toLowerCase().includes(f)
    );
  }, [categoryData, filter, sortOrder]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const currentCategories = filteredCategories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on filter change
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
      className="modern-categories-admin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      <style>{`
        .modern-categories-admin {
          padding: 0;
          min-height: auto;
        }

        .cat-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 2rem;
        }

        .cat-toolbar-title {
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

        .filter-group { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }
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

        .cat-table-glass { 
          margin-bottom: 0 !important; 
          min-width: 1100px;
        }

        .cat-table-glass th, .cat-table-glass td {
          white-space: nowrap;
          padding: 15px 20px;
        }

        @media (max-width: 768px) {
          .cat-header-row { margin-bottom: 1.5rem; }
          .cat-toolbar-title { font-size: 1.1rem !important; }
          .filters-row { grid-template-columns: 1fr; display: grid; gap: 15px; }
          .admin-btn-primary { padding: 8px 12px; font-size: 0.8rem; }
        }
      `}</style>
      <div className="cat-header-row">
        <span className="cat-toolbar-title">Categories 📂</span>
        <motion.button className="admin-btn admin-btn-primary" whileHover={{ scale: 1.07 }} onClick={() => handleOpenModal()}>
          ➕ Add Category
        </motion.button>
      </div>

      <div className="filter-section-card">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Search Categories</label>
            <Form.Control
              className="search-input"
              type="text"
              placeholder="🔍 Search by name or ID..."
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
          Loading categories...
        </motion.p>
      )}
      {error && <p className="text-danger">Error: {error}</p>}
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="cat-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Image</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentCategories.length > 0 ? (
                currentCategories.map((cat, index) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                  <motion.tr key={cat._id} className="cat-row-anim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.33 }}>
                    <td>{globalIdx}</td>
                    <td style={{ fontWeight: 600 }}>{cat?.name ?? "N/A"}</td>
                    <td>
                      <Image
                        src={cat?.Image || "https://via.placeholder.com/60?text=No+Image"}
                        rounded
                        width="50"
                        height="50"
                        style={{ objectFit: "cover", border: '1px solid rgba(0, 234, 255, 0.2)' }}
                      />
                    </td>
                    <td>
                      <div className="cat-actions">
                        <motion.button
                          className="admin-btn admin-btn-warning"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleOpenModal(cat)}
                        >✏️ Edit</motion.button>
                        <motion.button
                          className="admin-btn admin-btn-danger"
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleDelete(cat._id)}
                        >🗑 Delete</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="4" className="text-center text-muted">No categories found.</td>
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
      <Modal show={showModal} onHide={handleCloseModal} centered className="modern-cat-modal">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Update Category" : "Add Category"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={currentCategory.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image (optional)</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
              {(imagePreview || currentCategory.Image) && (
                <div style={{ marginTop: "10px" }}>
                  <Image
                    src={imagePreview || currentCategory.Image}
                    rounded
                    width="80"
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
            className={`cat-toast ${toast.type || "info"}`}
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

export default Categories;
