import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Form, Image, Modal, Spinner } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaBars } from "react-icons/fa";
import ReusablePagination from "../ReusablePagination";

function Products({ isSellerView = false, setIsSidebarOpen }) {
  const seller = useSelector(selectSeller);
  const sellerId = seller?.data?._id || seller?._id;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: loading, error: productsError } = useQuery({
    queryKey: ['products', isSellerView, sellerId],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (isSellerView) {
        if (!sellerId) return [];
        const res = await axios.get(`${API_BASE_URL}/product/getsellerproduct`, {
          headers: { seller_id: sellerId, auth_token: token }
        });
        return res.data?.data || [];
      } else {
        const res = await axios.get(`${API_BASE_URL}/product/getall`);
        return res.data?.data || [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const error = productsError ? (productsError?.message || "Failed to load products") : null;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/category/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/subcategory/getall`);
      return res.data?.data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const CustomSelect = ({ value, options, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(o => o.value === value) || options[0];

    return (
      <div className="custom-select-container">
        <div 
          className={`custom-select-trigger ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          <span>{selectedOption?.label}</span>
          <span>{isOpen ? '▲' : '▼'}</span>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="custom-select-options"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 1000 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
        {isOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setIsOpen(false)} />}
      </div>
    );
  };

  const [filter, setFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filteredBy, setFilteredBy] = useState("");
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState("");
  const [colorSearch, setColorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New filter states
  const [sellerFilter, setSellerFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [currentProduct, setCurrentProduct] = useState({
    _id: "",
    pname: "",
    pdescription: "",
    pprice: "",
    discountPercent: "", // seller discount %
    sku: "",
    stockType: "in_stock",
    totalStock: "",
    minStockAlert: "10",
    warehouse: "",
    psize: "",
    pcolor: "",
    variations: [], // Array of variation objects
    catid: "",
    subcatid: "",
    pimage1: null,
    pimage2: null,
    pimage3: null,
    existingImage1: null,
    existingImage2: null,
    existingImage3: null,
  });

  // Replaced legacy useEffect data fetching with useQuery hook definitions.


  // Open modal
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditMode(true);

      // Handle sizes - convert array to comma-separated string
      let sizesString = "";
      if (product?.psize) {
        if (Array.isArray(product.psize)) {
          sizesString = product.psize.join(",");
        } else if (typeof product.psize === 'string') {
          sizesString = product.psize;
        }
      }

      // Handle colors - convert array to comma-separated string
      let colorsString = "";
      if (product?.pcolor) {
        if (Array.isArray(product.pcolor)) {
          colorsString = product.pcolor.join(",");
        } else if (typeof product.pcolor === 'string') {
          colorsString = product.pcolor;
        }
      }

      setCurrentProduct({
        _id: product?._id ?? "",
        pname: product?.pname ?? "",
        pdescription: product?.pdescription ?? "",
        pprice: product?.pprice ?? "",
        discountPercent: product?.pdis ? String(product.pdis) : '',
        sku: product?.sku ?? "",
        stockType: product?.stockType ?? "in_stock",
        totalStock: product?.totalStock ?? "",
        minStockAlert: product?.minStockAlert ?? "10",
        warehouse: product?.warehouse ?? "",
        psize: sizesString,
        pcolor: colorsString,
        variations: [], // Will be populated from API if needed
        catid: (product?.catid?._id || product?.catid) ?? "",
        subcatid: (product?.subcatid?._id || product?.subcatid) ?? "",
        pimage1: null, // Keep as null for file input, but we'll show existing images
        pimage2: null,
        pimage3: null,
        // Store existing image URLs for display
        existingImage1: product?.pimage1 ?? null,
        existingImage2: product?.pimage2 ?? null,
        existingImage3: product?.pimage3 ?? null,
      });
    } else {
      setEditMode(false);
      setCurrentProduct({
        _id: "",
        pname: "",
        pdescription: "",
        pprice: "",
        discountPercent: '',
        sku: "",
        stockType: "in_stock",
        totalStock: "",
        minStockAlert: "10",
        warehouse: "",
        psize: "",
        pcolor: "",
        variations: [],
        catid: "",
        subcatid: "",
        pimage1: null,
        pimage2: null,
        pimage3: null,
        existingImage1: null,
        existingImage2: null,
        existingImage3: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setCurrentProduct({ ...currentProduct, [name]: files?.[0] || null });
  };

  // --- ENHANCED INPUT HANDLERS ---
  // Define industry sizes
  const ALL_SIZES = [
    "NB", "3M", "6M", "9M", "12M", "18M", "24M", "2T", "3T", "4T", "5T", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "Junior", "Adult", "Child", "Infant"
  ];

  // Define common colors
  const ALL_COLORS = [
    // Basic Colors
    "Black", "White", "Gray", "Silver", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink", "Brown",

    // Dark Colors
    "Dark Black", "Dark Gray", "Dark Red", "Dark Blue", "Dark Green", "Dark Purple", "Dark Brown", "Dark Orange", "Dark Pink", "Navy Blue", "Charcoal", "Ebony",

    // Light Colors
    "Light Gray", "Light Blue", "Light Green", "Light Yellow", "Light Pink", "Light Purple", "Light Orange", "Light Brown", "Off White", "Cream", "Ivory", "Beige",

    // Shades of Red
    "Crimson", "Scarlet", "Maroon", "Burgundy", "Cherry", "Ruby", "Rose", "Coral", "Salmon", "Tomato", "Firebrick",

    // Shades of Blue
    "Sky Blue", "Royal Blue", "Navy", "Teal", "Turquoise", "Azure", "Cyan", "Indigo", "Cobalt", "Sapphire", "Midnight Blue",

    // Shades of Green
    "Lime", "Forest Green", "Olive", "Mint", "Emerald", "Jade", "Sage", "Sea Green", "Kelly Green", "Lime Green",

    // Shades of Yellow
    "Gold", "Lemon", "Mustard", "Amber", "Khaki", "Pale Yellow", "Banana", "Butter",

    // Shades of Purple
    "Lavender", "Violet", "Plum", "Lilac", "Eggplant", "Magenta", "Deep Purple", "Amethyst",

    // Shades of Pink
    "Hot Pink", "Fuchsia", "Bubblegum", "Blush", "Peach", "Rose Pink", "Baby Pink",

    // Shades of Brown
    "Tan", "Chocolate", "Coffee", "Taupe", "Mocha", "Chestnut", "Walnut", "Caramel", "Copper",

    // Neutral Colors
    "Slate", "Ash", "Pearl", "Almond", "Sand", "Mauve",

    // International Colors
    "Sangria", "Vermilion", "Cerulean", "Chartreuse", "Ultramarine", "Zaffre", "Aureolin", "Gamboge",

    // Metallic Colors
    "Bronze", "Brass", "Chrome", "Platinum", "Rose Gold", "Gunmetal",

    // Earth Tones
    "Terracotta", "Clay", "Rust", "Moss", "Pine", "Hunter Green", "Army Green",

    // Pastel Colors
    "Pastel Blue", "Pastel Green", "Pastel Pink", "Pastel Purple", "Pastel Yellow", "Pastel Orange",

    // Bright Colors
    "Electric Blue", "Neon Green", "Neon Pink", "Neon Orange", "Fluorescent Yellow",

    // Additional Colors
    "Aqua", "Aquamarine", "Beryl", "Bisque", "Blanched Almond", "Blue Violet", "Cadet Blue",
    "Cornflower Blue", "Cornsilk", "Dark Cyan", "Dark Goldenrod", "Dark Khaki",
    "Dark Magenta", "Dark Olive Green", "Dark Orchid", "Dark Salmon", "Dark Sea Green",
    "Dark Slate Blue", "Dark Slate Gray", "Dark Turquoise", "Dark Violet", "Deep Pink",
    "Deep Sky Blue", "Dim Gray", "Dodger Blue", "Floral White", "Gainsboro",
    "Ghost White", "Goldenrod", "Green Yellow", "Honeydew", "Indian Red",
    "Lavender Blush", "Lawn Green", "Lemon Chiffon", "Light Coral", "Light Cyan",
    "Light Goldenrod Yellow", "Light Salmon", "Light Sea Green", "Light Sky Blue",
    "Light Slate Gray", "Light Steel Blue", "Linen",
    "Medium Aquamarine", "Medium Blue", "Medium Orchid", "Medium Purple", "Medium Sea Green",
    "Medium Slate Blue", "Medium Spring Green", "Medium Turquoise", "Medium Violet Red",
    "Mint Cream", "Misty Rose", "Moccasin", "Navajo White", "Old Lace", "Olive Drab",
    "Orange Red", "Orchid", "Pale Goldenrod", "Pale Green", "Pale Turquoise", "Pale Violet Red",
    "Papaya Whip", "Peach Puff", "Peru", "Powder Blue", "Rebecca Purple", "Rosy Brown",
    "Saddle Brown", "Sandy Brown", "Seashell", "Sienna",
    "Slate Blue", "Slate Gray", "Snow", "Spring Green", "Steel Blue", "Thistle",
    "Wheat", "White Smoke", "Yellow Green"
  ];
  // Sizes Multi-Select UI
  const handleToggleSize = (size) => {
    setCurrentProduct((prev) => {
      let current = (prev.psize || "").split(",").map(e => e.trim()).filter(Boolean);
      if (current.includes(size)) {
        current = current.filter(e => e !== size);
      } else {
        current.push(size);
      }
      return { ...prev, psize: current.join(",") };
    });
  };

  // Colors Multi-Select UI
  const handleToggleColor = (color) => {
    setCurrentProduct((prev) => {
      let current = (prev.pcolor || "").split(",").map(e => e.trim()).filter(Boolean);
      if (current.includes(color)) {
        current = current.filter(e => e !== color);
      } else {
        current.push(color);
      }
      return { ...prev, pcolor: current.join(",") };
    });
  };
  const renderSizesField = () => {
    const selected = (currentProduct.psize || "").split(",").map(e=>e.trim()).filter(Boolean);
    return (
      <div style={{
        background: '#181f2f', borderRadius: 10, padding: 12, boxShadow: '0 1px 5px #0004', maxHeight: 102, overflowY: 'auto', marginBottom:10, display: 'flex', flexWrap: 'wrap', gap: '9px 12px', minWidth: 180
      }}>
        {ALL_SIZES.map((size) => {
          const isSel = selected.includes(size);
          return (
            <span
              key={size}
              role="button"
              tabIndex={0}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleToggleSize(size)}
              className={`admin-btn admin-btn-outline`}
              style={{
                cursor: 'pointer', fontSize: '0.99rem', padding: '5px 14px',
                background: isSel ? '#22d3ee' : '',
                color: isSel ? '#0b1624' : '',
                border: isSel ? '2px solid #1ad1e4':'1px solid #334155',
                fontWeight: isSel ? 700 : 500,
                transition:'background .16s,border .16s,color .13s',
              }}
            >
              {isSel && <span style={{fontWeight:900,marginRight:4}}>✓</span>}{size}
            </span>
          );
        })}
      </div>
    );
  };

  const renderColorsField = () => {
    const selected = (currentProduct.pcolor || "").split(",").map(e=>e.trim()).filter(Boolean);

    // Filter colors based on search term
    const filteredColors = ALL_COLORS.filter(color =>
      color.toLowerCase().includes(colorSearch.toLowerCase())
    );

    return (
      <div style={{ marginBottom: 10 }}>
        {/* Color Search Input */}
        <div style={{ marginBottom: 12 }}>
          <Form.Control
            type="text"
            placeholder="🔍 Search colors..."
            value={colorSearch}
            onChange={(e) => setColorSearch(e.target.value)}
            style={{
              background: 'rgba(29, 42, 64, 0.81)',
              border: '1px solid #334155',
              color: '#e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.9rem'
            }}
          />
          <small style={{ color: '#6c757d', marginTop: '4px', display: 'block' }}>
            Showing {filteredColors.length} of {ALL_COLORS.length} colors
          </small>
        </div>

        {/* Color Selection Grid */}
        <div style={{
          background: '#181f2f', borderRadius: 10, padding: 12, boxShadow: '0 1px 5px #0004', maxHeight: 200, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px', minWidth: 200
        }}>
          {filteredColors.length > 0 ? (
            filteredColors.map((color) => {
              const isSel = selected.includes(color);
              return (
                <span
                  key={color}
                  role="button"
                  tabIndex={0}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handleToggleColor(color)}
                  className={`admin-btn admin-btn-outline`}
                  style={{
                    cursor: 'pointer', fontSize: '0.8rem', padding: '8px 10px',
                    background: isSel ? '#22d3ee' : '#2a3441',
                    color: isSel ? '#0b1624' : '#e2e8f0',
                    border: isSel ? '2px solid #1ad1e4':'1px solid #334155',
                    fontWeight: isSel ? 700 : 500,
                    transition:'background .16s,border .16s,color .13s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: '40px',
                    borderRadius: '6px',
                    wordWrap: 'break-word',
                    lineHeight: '1.2'
                  }}
                >
                  {isSel && <span style={{fontWeight:900,marginRight:4}}>✓</span>}{color}
                </span>
              );
            })
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              color: '#6c757d',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No colors found matching "{colorSearch}"
            </div>
          )}
        </div>
      </div>
    );
  };

  // Validate on save
  const isValidSizes = () => {
    const entries = (currentProduct.psize+"").split(",").map(v=>v.trim()).filter(Boolean);
    return entries.length > 0 && entries.every(s => ALL_SIZES.includes(s));
  };

  const handleSave = async () => {

    // Get fresh values from form inputs to ensure we have latest data
    const form = document.querySelector('form');
    const skuInput = form?.querySelector('input[name="sku"]');
    const currentSku = skuInput?.value || currentProduct.sku || '';

    // Validate SKU
    if (!currentSku || currentSku.trim().length === 0) {
      setFormError("SKU is required.");
      setToast({ type: 'danger', message: "SKU is required." });
      return;
    }
    if (currentSku.trim().length < 3) {
      setFormError("SKU must be at least 3 characters long.");
      setToast({ type: 'danger', message: "SKU must be at least 3 characters long." });
      return;
    }

    // Update the currentProduct with the latest SKU value
    const updatedProduct = { ...currentProduct, sku: currentSku.trim() };

    // In edit mode, only validate SKU uniqueness and basic required fields
    // Images are completely optional in edit mode
    const required = [];

    if (!editMode) {
      // Create mode - full validation
      required.push(
        updatedProduct.pname,
        updatedProduct.pdescription,
        updatedProduct.pprice,
        updatedProduct.discountPercent,
        updatedProduct.sku,
        updatedProduct.totalStock,
        updatedProduct.catid,
        updatedProduct.subcatid,
        updatedProduct.pcolor,
        updatedProduct.pimage1
      );
    }

    // Check if any is missing
    const missingFields = required.filter(x => {
      if (x === null || x === undefined || x === "") return true;
      if (Array.isArray(x) && x.length === 0) return true;
      return false;
    });

    if (missingFields.length > 0) {
      setFormError("Please fill in all required fields.");
      setToast({type:'danger', message: 'Please fill in all required fields.'});
      return;
    }

    // If validation passes, set submitting state
    setIsSubmitting(true);

    // Skip additional validations in edit mode
    if (!editMode) {
      // Validate colors
      const selectedColors = (updatedProduct.pcolor || "").split(",").map(c => c.trim()).filter(Boolean);
      if (selectedColors.length === 0) {
        setIsSubmitting(false);
        setFormError("Please select at least one color.");
        setToast({type:'danger', message: 'Please select at least one color.'});
        return;
      }

      // Validate stock values
      if (parseInt(currentProduct.totalStock) < 0) {
        setIsSubmitting(false);
        setFormError("Total stock cannot be negative.");
        setToast({type:'danger', message: 'Total stock cannot be negative.'});
        return;
      }

      if (parseInt(currentProduct.minStockAlert) < 0) {
        setIsSubmitting(false);
        setFormError("Minimum stock alert cannot be negative.");
        setToast({type:'danger', message: 'Minimum stock alert cannot be negative.'});
        return;
      }
    }

    setFormError("");

    const sellerId = seller?.data?._id || seller?._id;
    const token = localStorage.getItem("token");
    // Only enforce seller presence when in seller view; admin can create freely.
    if (isSellerView && !sellerId) {
      setToast({ type: "warning", message: "Seller login required before creating product." });
      return;
    }

    const buildArray = (val) =>
      typeof val === "string"
        ? val
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : Array.isArray(val)
        ? val
        : [];

    const payload = {
      pname: updatedProduct.pname,
      pdescription: updatedProduct.pdescription,
      pprice: Number(updatedProduct.pprice) || 0,
      discountPercent: Number(updatedProduct.discountPercent) || 0, // seller discount %
      sku: updatedProduct.sku,
      stockType: updatedProduct.stockType,
      totalStock: Number(updatedProduct.totalStock) || 0,
      minStockAlert: Number(updatedProduct.minStockAlert) || 10,
      warehouse: updatedProduct.warehouse.trim() || null,
      psize: updatedProduct.psize,
      pcolor: updatedProduct.pcolor,
      variations: updatedProduct.variations || [],
      catid: updatedProduct.catid,
      subcatid: updatedProduct.subcatid,
      pimage1: updatedProduct.pimage1,
      pimage2: updatedProduct.pimage2,
      pimage3: updatedProduct.pimage3,
    };

    // Only add _id for update operations
    if (editMode) {
      payload._id = updatedProduct._id;
    }

    // Final check - ensure SKU is not empty
    if (!payload.sku || payload.sku.trim().length === 0) {
      console.error('SKU is empty in final payload!');
      setFormError("SKU is required.");
      setToast({ type: 'danger', message: "SKU is required." });
      return;
    }

    const productMutation = {
      pname: payload.pname,
      pdescription: payload.pdescription,
      pprice: payload.pprice,
      discountPercent: payload.discountPercent,
      sku: payload.sku,
      stockType: payload.stockType,
      totalStock: payload.totalStock,
      minStockAlert: payload.minStockAlert,
      warehouse: payload.warehouse,
      psize: payload.psize,
      pcolor: payload.pcolor,
      catid: payload.catid,
      subcatid: payload.subcatid,
      pimage1: payload.pimage1,
      pimage2: payload.pimage2,
      pimage3: payload.pimage3,
      ...(editMode ? { _id: payload._id } : {})
    };

    saveMutation.mutate(productMutation);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const formData = new FormData();
      if (payload._id) formData.append("_id", payload._id);
      formData.append("pname", payload.pname || "");
      formData.append("pdescription", payload.pdescription || "");
      formData.append("pprice", payload.pprice ?? "");
      formData.append("discountPercent", payload.discountPercent ?? "");
      formData.append("sku", payload.sku || "");
      formData.append("stockType", payload.stockType || "in_stock");
      formData.append("totalStock", payload.totalStock ?? "");
      formData.append("minStockAlert", payload.minStockAlert ?? "10");
      formData.append("warehouse", payload.warehouse || "");
      formData.append("catid", payload.catid || "");
      formData.append("subcatid", payload.subcatid || "");
      formData.append("sellerid", sellerId || "");
      formData.append("psize", payload.psize || "");
      formData.append("pcolor", payload.pcolor || "");
      if (payload.pimage1) formData.append("pimage1", payload.pimage1);
      if (payload.pimage2) formData.append("pimage2", payload.pimage2);
      if (payload.pimage3) formData.append("pimage3", payload.pimage3);

      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/product/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { auth_token: token } : {}),
        },
      });
      return res.data.data;
    },
    onSuccess: () => {
      setIsSubmitting(false);
      setShowModal(false);
      setToast({ type: "success", message: editMode ? "Product updated" : "Product created" });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      setIsSubmitting(false);
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Failed to save product" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/product/delete/${id}`, {
        headers: {
          ...(token ? { auth_token: token } : {}),
        },
      });
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Failed to delete product" });
    }
  });

  const handleDelete = (id) => {
    if (!window.confirm("Delete product?")) return;
    deleteMutation.mutate(id);
  };

  const statusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }) => {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${API_BASE_URL}/product/update-status/${productId}`,
        { pstatus: newStatus },
        {
          headers: {
            ...(token ? { auth_token: token } : {}),
          },
        }
      );
    },
    onSuccess: (_, variables) => {
      setToast({ 
        type: "success", 
        message: variables.newStatus === "active" 
          ? "Product approved successfully!" 
          : "Product status set to pending!" 
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Failed to update product status" });
    }
  });

  const handleToggleProductStatus = (productId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "pending" : "active";
    statusMutation.mutate({ productId, newStatus });
  };

  const featureMutation = useMutation({
    mutationFn: async (productId) => {
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE_URL}/product/toggle-feature/${productId}`, {}, {
        headers: {
          auth_token: token
        }
      });
    },
    onSuccess: () => {
      setToast({ type: "success", message: "Featured status updated!" });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      setToast({ type: "danger", message: err?.response?.data?.message || err?.message || "Failed to update featured status" });
    }
  });

  const handleToggleFeatured = (productId) => {
    featureMutation.mutate(productId);
  };

  // Filter
  const handleFilterChange = (e) => {
    const value = e.target.value.toLowerCase();
    setFilter(value);
    setFilteredBy(value ? "Filtered By: " + value : "");
  };

  // Sort
  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredProducts = useMemo(() => {
    const sellerId = seller?.data?._id || seller?._id;
    let scoped = isSellerView && sellerId
      ? (products || []).filter((p) => {
          const pid = p?.sellerid?._id || p?.sellerid;
          return pid === sellerId;
        })
      : (products || []);

    // Apply filters
    scoped = scoped.filter((p) => {
      // Text search filter
      const f = filter.toLowerCase();
      const matchesSearch = !f ||
        p?.pname?.toLowerCase().includes(f) ||
        p?.pdescription?.toLowerCase().includes(f) ||
        p?._id?.toLowerCase().includes(f);

      // Seller filter
      const matchesSeller = sellerFilter === "all" || sellerFilter === "" ||
        (p?.sellerid?.name || p?.sellerid)?.toLowerCase().includes(sellerFilter.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === "all" ||
        (p?.catid?._id === categoryFilter || p?.catid === categoryFilter);

      // Subcategory filter
      const matchesSubcategory = subcategoryFilter === "all" ||
        (p?.subcatid?._id === subcategoryFilter || p?.subcatid === subcategoryFilter);

      // Status filter
      const matchesStatus = statusFilter === "all" ||
        p?.pstatus === statusFilter;

      // Stock filter
      const matchesStock = stockFilter === "all" ||
        p?.stockType === stockFilter;

      return matchesSearch && matchesSeller && matchesCategory &&
             matchesSubcategory && matchesStatus && matchesStock;
    });

    // Sort products
    const sortedProducts = [...scoped].sort((a, b) => {
      const n1 = a?.pname?.toLowerCase() ?? "";
      const n2 = b?.pname?.toLowerCase() ?? "";
      return sortOrder === "asc" ? n1.localeCompare(n2) : n2.localeCompare(n1);
    });

    return sortedProducts;
  }, [products, filter, sortOrder, isSellerView, seller?.data?._id, seller?._id,
      sellerFilter, categoryFilter, subcategoryFilter, statusFilter, stockFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, sellerFilter, categoryFilter, subcategoryFilter, statusFilter, stockFilter, sortOrder]);

  useEffect(() => {
    if (!error) return;
    setToast({ type: "danger", message: error });
  }, [error]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <motion.div className="modern-products-admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <style>{`
        .modern-products-admin {
          padding: 0;
          min-height: auto;
          background: transparent;
        }
        .products-admin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .p-toolbar-title {
          font-size: 1.1rem !important;
          font-weight: 800;
          color: #00eaff;
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

        .search-wrapper { margin-bottom: 20px; }
        .search-input {
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(0, 234, 255, 0.2) !important;
          color: #f8fafc !important;
          padding: 12px 20px !important;
          border-radius: 12px !important;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          align-items: flex-end;
        }

        .filter-group { display: flex; flex-direction: column; gap: 8px; }
        .filter-label {
          color: #94a3b8;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .filter-input {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
          padding: 10px 15px !important;
          border-radius: 10px !important;
        }

        .table-responsive-container {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 16px;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 30px;
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }

        .p-table-glass { 
          margin-bottom: 0 !important; 
          min-width: 2500px;
          table-layout: auto;
        }

        .p-table-glass thead th, .p-table-glass tbody td {
          white-space: nowrap;
          padding: 15px 20px;
          text-align: left;
        }

        .p-table-glass thead th {
          background: rgba(0, 234, 255, 0.05) !important;
          color: #00eaff;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(0, 234, 255, 0.1) !important;
        }

        .p-table-glass tbody td {
          color: #cbd5e1;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }

        .stock-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8rem;
        }
        .status-approved { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
        .status-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; }

        .variation-tag-container { display: flex; flex-wrap: wrap; gap: 4px; }
        .variation-tag {
          background: #2a3441;
          color: #e2e8f0;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        .table-img { width: 60px; height: 50px; object-fit: cover; }

        @media (max-width: 768px) {
          .modern-products-admin { padding: 15px; }
          .products-admin-toolbar { flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 20px; }
          .p-toolbar-title { font-size: 1.1rem !important; }
          .filters-grid { grid-template-columns: 1fr; gap: 15px; }
          .filter-section-card { padding: 15px; }
        }

        @media (max-width: 500px) {
          .filters-grid { grid-template-columns: 1fr; }
        }

        .search-input-wrapper input {
          font-size: 1rem;
          background: rgba(15, 23, 42, 0.6) !important;
          border: 1px solid rgba(0, 234, 255, 0.3) !important;
          color: #fff !important;
          border-radius: 12px !important;
        }

        .search-input-wrapper input:focus {
          border-color: #00eaff !important;
          box-shadow: 0 0 15px rgba(0, 234, 255, 0.2) !important;
        }


        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 100%;
          position: relative;
          overflow: visible;
        }

        .filter-group select, .filter-group input {
          background: #1e293b !important;
          border: 1px solid rgba(0, 234, 255, 0.4) !important;
          color: #ffffff !important;
          border-radius: 10px !important;
          padding: 8px 12px !important;
          height: 45px;
          cursor: pointer;
          width: 100% !important;
          max-width: 100% !important;
          font-size: 0.95rem;
          outline: none;
          box-sizing: border-box !important;
        }

        .filter-group select option {
          background: #1e293b;
          color: #ffffff;
        }

        .filter-group select:focus, .filter-group input:focus {
          border-color: #00eaff !important;
          box-shadow: 0 0 12px rgba(0, 234, 255, 0.3) !important;
        }

        @media (max-width: 576px) {
          .filter-group select, .filter-group input {
            font-size: 0.85rem;
            height: 40px;
            padding: 6px 10px !important;
          }
        }

        .sort-group .admin-btn {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          color: #00eaff;
        }

        .sort-group .admin-btn:hover {
          background: rgba(0, 234, 255, 0.2);
        }
        .p-table-glass {
          background: rgba(0,0,0,0.85) !important;
          border-radius: 17px;
          box-shadow: 0 6px 28px #29deff16;
          overflow: hidden;
        }
        .p-table-glass th, .p-table-glass td {
          backdrop-filter: blur(6px);
          padding: 12px 18px !important;
          white-space: nowrap;
          vertical-align: middle;
        }

        /* Specific column widths for desktop */
        .p-table-glass th:nth-child(2), .p-table-glass td:nth-child(2) { min-width: 220px; } /* Name */
        .p-table-glass th:nth-child(4), .p-table-glass td:nth-child(4) { min-width: 160px; } /* Category */
        .p-table-glass th:nth-child(5), .p-table-glass td:nth-child(5) { min-width: 160px; } /* Subcategory */
        .p-table-glass th:nth-child(12), .p-table-glass td:nth-child(12) { min-width: 150px; } /* SKU */
        .p-desc-col {
          min-width: 300px;
          max-width: 600px;
          white-space: normal !important;
        }

        /* Table responsiveness */
        @media (max-width: 1200px) {
          .p-table-glass th:nth-child(3), .p-table-glass td:nth-child(3) { min-width: 120px; } /* Seller column */
          .p-desc-col { min-width: 200px; max-width: 400px; }
        }

        @media (max-width: 992px) {
          .p-table-glass th:nth-child(3), .p-table-glass td:nth-child(3) { min-width: 100px; } /* Seller column */
          .p-desc-col { min-width: 150px; max-width: 300px; }
        }

        @media (max-width: 768px) {
          .p-table-glass th:nth-child(3), .p-table-glass td:nth-child(3) { min-width: 80px; } /* Seller column */
          .p-desc-col { min-width: 120px; max-width: 250px; }

          .p-table-glass th, .p-table-glass td {
            font-size: 12.5px;
            padding: 10px 12px;
            white-space: nowrap;
          }

          .p-table-glass th:nth-child(1), .p-table-glass td:nth-child(1) { width: 50px; } /* # */
          .p-table-glass th:nth-child(2), .p-table-glass td:nth-child(2) { min-width: 180px; } /* Name */
          .p-table-glass th:nth-child(4), .p-table-glass td:nth-child(4) { min-width: 140px; } /* Category */
          .p-table-glass th:nth-child(5), .p-table-glass td:nth-child(5) { min-width: 140px; } /* Subcategory */
          .p-table-glass th:nth-child(7), .p-table-glass td:nth-child(7) { min-width: 120px; } /* Price */
        }

        @media (max-width: 576px) {
          .p-table-glass th:nth-child(3), .p-table-glass td:nth-child(3) { display: none; } /* Hide seller column on very small screens */
          .p-desc-col { display: none; } /* Hide description column on very small screens */

          .p-table-glass th, .p-table-glass td {
            font-size: 12px;
            padding: 8px 10px;
            white-space: nowrap;
          }
        }
        .p-desc-text {
          max-height: 116px;
          min-height: 38px;
          overflow-y: auto;
          display: block;
          padding-right: 6px;
          white-space: pre-line;
        }
        .p-sort-btn { /* deprecated, use admin-btn */ }
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
        .modern-modal-anim.modal-dialog {
          max-width: 85vw !important;
          width: 85% !important;
          margin: 1.75rem auto !important;
        }

        @media (max-width: 768px) {
          .modern-modal-anim.modal-dialog {
            max-width: 95vw !important;
            width: 95% !important;
            margin: 10px auto !important;
          }
        }

        .modern-modal-anim .modal-content {
          background: rgba(22,30,38,0.98)!important;
          border-radius: 17px !important;
          border: 2px solid #0dcaf0b4 !important;
          box-shadow: 0 8px 50px #07e0ff29 !important;
          direction: ltr !important;
          width: 100% !important;
        }
        .modern-modal-anim .modal-body {
          direction: ltr !important;
          padding: 25px 30px !important;
        }
        .modern-modal-anim .modal-header, .modern-modal-anim .modal-footer {
          padding: 15px 30px !important;
          border: none !important;
        }
        .modern-modal-anim .modal-title {
          color: #e2e8f0 !important;
          font-weight: 700 !important;
          font-size: 1.5rem !important;
        }
        .modern-modal-anim .btn-close {
          filter: invert(1) !important;
          opacity: 0.8 !important;
        }
        .modern-modal-anim .btn-close:hover {
          opacity: 1 !important;
        }
        .modern-modal-anim label {
          color: #13dcfc;
          font-weight: 600;
        }
        .product-modal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px 22px;
        }
        @media (min-width: 800px) {
          .product-modal-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1100px) {
          .product-modal-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .product-modal-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px 22px;
        }
        @media (min-width: 800px) {
          .product-modal-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .span-2 { grid-column: span 2; }
        }
        @media (min-width: 1100px) {
          .product-modal-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .span-2 { grid-column: span 2; }
          .span-3 { grid-column: span 3; }
        }
        
        .product-modal-grid .mb-3 {
          margin-bottom: 0!important;
          max-width: 100%;
          overflow-x: hidden;
        }

        .custom-select-container {
          position: relative;
          width: 100%;
        }

        .custom-select-trigger {
          background: #1e293b;
          border: 1px solid rgba(0, 234, 255, 0.4);
          color: #ffffff;
          border-radius: 10px;
          padding: 8px 12px;
          height: 45px;
          cursor: pointer;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .custom-select-trigger:hover {
          border-color: rgba(0, 234, 255, 0.8);
        }

        .custom-select-options {
          position: absolute;
          top: calc(100% + 5px);
          left: 0;
          width: 100%;
          background: #1e293b;
          border: 1px solid rgba(0, 234, 255, 0.4);
          border-radius: 10px;
          z-index: 1000;
          max-height: 250px;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          overflow-x: hidden;
        }

        .custom-select-option {
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
          color: #e2e8f0;
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-select-option:hover {
          background: rgba(0, 234, 255, 0.1);
          color: #00eaff;
        }

        .custom-select-option.selected {
          background: rgba(0, 234, 255, 0.2);
          color: #00eaff;
          font-weight: 600;
        }

        @media (max-width: 576px) {
          .custom-select-trigger {
            height: 40px;
            font-size: 0.85rem;
            padding: 6px 10px;
          }
          .custom-select-option {
            padding: 8px 12px;
            font-size: 0.85rem;
          }
        }
        .search-input-wrapper input::placeholder {
          color: #ffffff !important;
          opacity: 0.9;
        }
      `}</style>

      <div className="products-admin-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="p-toolbar-title">Products</span>
        </div>
        <motion.button 
          className="admin-btn admin-btn-primary" 
          whileHover={{ scale: 1.07 }} 
          onClick={() => handleOpenModal()}
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          ➕ Add Product
        </motion.button>
      </div>
      <div className="products-admin-filters">
        <div className="filter-group main-search">
          <label className="filter-label">Search Products</label>
          <div className="search-input-wrapper">
            <Form.Control
              type="text"
              placeholder="search here"
              value={filter}
              onChange={handleFilterChange}
            />
          </div>
        </div>

        <div className="filters-grid">
          {!isSellerView && (
            <div className="filter-group">
              <label className="filter-label">Seller</label>
              <div className="seller-filter-combined">
                <Form.Control
                  type="text"
                  placeholder="Seller name..."
                  value={sellerFilter}
                  onChange={(e) => setSellerFilter(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="filter-group">
            <label className="filter-label">Category</label>
            <CustomSelect
              value={categoryFilter}
              options={[
                { value: 'all', label: '📂 All Categories' },
                ...(categories?.map(cat => ({ value: cat._id, label: cat.cname || cat.name })) || [])
              ]}
              onChange={(val) => setCategoryFilter(val)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Subcategory</label>
            <CustomSelect
              value={subcategoryFilter}
              disabled={categoryFilter === 'all'}
              options={[
                { value: 'all', label: '📁 All Subcategories' },
                ...(subcategories
                  ?.filter(sub => categoryFilter === 'all' || sub.catid === categoryFilter || sub.catid?._id === categoryFilter)
                  ?.map(sub => ({ value: sub._id, label: sub.scname || sub.name })) || [])
              ]}
              onChange={(val) => setSubcategoryFilter(val)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <CustomSelect
              value={statusFilter}
              options={[
                { value: 'all', label: '📊 All Status' },
                { value: 'active', label: '✅ Active' },
                { value: 'pending', label: '⏳ Pending' },
                { value: 'inactive', label: '❌ Inactive' },
                { value: 'outofstock', label: '📦 Out of Stock' }
              ]}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Stock</label>
            <CustomSelect
              value={stockFilter}
              options={[
                { value: 'all', label: '📦 All Stock Types' },
                { value: 'in_stock', label: '✅ In Stock' },
                { value: 'out_of_stock', label: '❌ Out of Stock' }
              ]}
              onChange={(val) => setStockFilter(val)}
            />
          </div>

          <div className="filter-group sort-group">
            <label className="filter-label">Sorting</label>
            <motion.button className="admin-btn admin-btn-ghost w-100" whileTap={{ scale: 0.95 }} onClick={handleSort}>
              {sortOrder === "asc" ? "Sort A-Z ↑" : "Sort Z-A ↓"}
            </motion.button>
          </div>
        </div>
      </div>
      {filteredBy && (
        <motion.p className="text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <small>{filteredBy}</small>
        </motion.p>
      )}
      {loading && <motion.p className="text-info" animate={{ opacity: [0.5, 1, 0.5], color: "#00eaff" }} transition={{ duration: 1.7, repeat: Infinity }}>Loading products...</motion.p>}
      {error && <p className="text-danger">Error: {error}</p>}
      <div className="table-responsive-container">
        <Table striped bordered hover variant="dark" className="p-table-glass">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Seller</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th className="p-desc-col">Description</th>
              <th>Price</th>
              <th>Actual Price</th>
              <th>Discount %</th>
              <th>Discounted Price</th>
              <th>Stock</th>
              <th>SKU</th>
              <th>Colors</th>
              <th>Sizes</th>
              <th>Min Alert</th>
              <th>Warehouse</th>
              <th>Status</th>
              <th>Image 1</th>
              <th>Image 2</th>
              <th>Image 3</th>
              <th>Created</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentProducts.length > 0 ? (
                currentProducts.map((prod, index) => {
                  const globalIndex = indexOfFirstItem + index + 1;
                  return (
                  <motion.tr 
                    key={prod._id} 
                    className="p-row-anim" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} 
                    transition={{ duration: 0.35 }}
                    style={{ backgroundColor: prod.isFeatured ? 'rgba(255, 215, 0, 0.05)' : 'transparent' }}
                  >
                    <td>{globalIndex}</td>
                    <td className="fw-bold">
                      {prod.pname}
                      {prod.isFeatured && <span title="Featured Product" style={{marginLeft: '8px', cursor: 'help'}}>⭐</span>}
                    </td>
                    <td>{prod.sellerid?.name || prod.sellerid?.shopName || (typeof prod.sellerid === 'string' ? prod.sellerid : '-')}</td>
                    <td>{prod.catid?.name || prod.catid?.cname || (typeof prod.catid === 'string' ? prod.catid : '-') }</td>
                    <td>{prod.subcatid?.name || prod.subcatid?.scname || (typeof prod.subcatid === 'string' ? prod.subcatid : '-')}</td>
                    <td className="p-desc-col">
                      <span className="p-desc-text">{prod.pdescription}</span>
                    </td>
                    <td>PKR {Number(prod.pprice).toFixed(2)}</td>
                    <td>PKR {Number(prod.pactualprice).toFixed(2)}</td>
                    <td>{prod.pdis}%</td>
                    <td>PKR {Number(prod.prodisprice).toFixed(2)}</td>
                    <td>
                      <span className="stock-badge" style={{
                        background: prod.totalStock > prod.minStockAlert ? 'rgba(16, 185, 129, 0.2)' : prod.totalStock > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: prod.totalStock > prod.minStockAlert ? '#10b981' : prod.totalStock > 0 ? '#f59e0b' : '#ef4444',
                        border: `1px solid ${prod.totalStock > prod.minStockAlert ? '#10b981' : prod.totalStock > 0 ? '#f59e0b' : '#ef4444'}`
                      }}>
                        {prod.totalStock || 0}
                      </span>
                    </td>
                    <td>{prod.sku || '-'}</td>
                    <td>
                      {prod.pcolor && prod.pcolor.length > 0 ? (
                        <div className="variation-tag-container">
                          {prod.pcolor.slice(0, 3).map((color, index) => (
                            <span key={index} className="variation-tag">{color}</span>
                          ))}
                          {prod.pcolor.length > 3 && <span className="variation-more">+{prod.pcolor.length - 3}</span>}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {prod.psize && prod.psize.length > 0 ? (
                        <div className="variation-tag-container">
                          {prod.psize.slice(0, 3).map((size, index) => (
                            <span key={index} className="variation-tag">{size}</span>
                          ))}
                          {prod.psize.length > 3 && <span className="variation-more">+{prod.psize.length - 3}</span>}
                        </div>
                      ) : '-'}
                    </td>
                    <td>{prod.minStockAlert || 10}</td>
                    <td>{prod.warehouse || '-'}</td>
                    <td>
                      <span className={`status-badge ${prod.pstatus === "active" ? "status-approved" : "status-pending"}`}>
                        {prod.pstatus === "active" ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td><Image src={prod.pimage1} className="table-img" rounded /></td>
                    <td><Image src={prod.pimage2} className="table-img" rounded /></td>
                    <td><Image src={prod.pimage3} className="table-img" rounded /></td>
                    <td className="date-col">{new Date(prod.createdAt).toLocaleString()}</td>
                    <td className="date-col">{new Date(prod.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="p-actions">
                        {!isSellerView && (
                          <>
                            <motion.button
                              className={`admin-btn ${prod.pstatus === "active" ? "admin-btn-warning" : "admin-btn-primary"}`}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleToggleProductStatus(prod._id, prod.pstatus)}
                              title={prod.pstatus === "active" ? "Set Pending" : "Approve"}
                            >
                              {prod.pstatus === "active" ? "⏸ Pend" : "✓ Appr"}
                            </motion.button>
                            <motion.button
                              className={`admin-btn ${prod.isFeatured ? "admin-btn-warning" : "admin-btn-success"}`}
                              whileHover={{ scale: 1.05 }}
                              onClick={() => handleToggleFeatured(prod._id)}
                              title={prod.isFeatured ? "Remove from Featured" : "Add to Featured"}
                            >
                              ⭐
                            </motion.button>
                          </>
                        )}
                        <motion.button className="admin-btn admin-btn-edit" whileHover={{ scale: 1.05 }} onClick={() => handleOpenModal(prod)}>✏️</motion.button>
                        <motion.button className="admin-btn admin-btn-danger" whileHover={{ scale: 1.05 }} onClick={() => handleDelete(prod._id)}>🗑</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                )})
              ) : (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan="23" className="text-center text-muted">No products found.</td>
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
      <Modal show={showModal} onHide={handleCloseModal} centered size="xl" dialogClassName="modern-modal-anim">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Update Product" : "Add Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="product-modal-grid">
              <Form.Group className="mb-3">
                <Form.Label>Product Name {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Control
                  type="text"
                  name="pname"
                  value={currentProduct.pname}
                  onChange={handleInputChange}
                  placeholder="Enter Product Name"
                  required={!editMode}
                  disabled={isSubmitting}
                />
              </Form.Group>
              <Form.Group className="mb-3 span-2">
                <Form.Label>Description {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="pdescription"
                  value={currentProduct.pdescription}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  required={!editMode}
                  style={{ resize: 'vertical' }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Price (MRP) {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Control
                  type="number"
                  name="pprice"
                  value={currentProduct.pprice}
                  onChange={handleInputChange}
                  placeholder="Enter Price"
                  required={!editMode}
                />
              </Form.Group>
              {/* Discount field for sellers and admins */}
              <Form.Group className="mb-3">
                <Form.Label>Discount % {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                {isSellerView ? (
                  <Form.Select
                    name="discountPercent"
                    value={currentProduct.discountPercent || ''}
                    onChange={handleInputChange}
                    required={!editMode}
                    style={{ minWidth: 100 }}
                  >
                    <option value="">Choose discount...</option>
                    {Array.from({length: 100}, (_, i) => i+1).map(val => (
                      <option value={val} key={val}>{val}%</option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    type="text"
                    name="discountPercent"
                    value={currentProduct.discountPercent || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 15 for 15%"
                    required={!editMode}
                  />
                )}
              </Form.Group>
              {/* Inventory Fields */}
              <Form.Group className="mb-3">
                <Form.Label>SKU (Stock Unit) <span style={{color:'red'}}>*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="sku"
                  value={currentProduct.sku}
                  onChange={handleInputChange}
                  placeholder="e.g. TS-RED-M"
                  required
                  disabled={editMode || isSubmitting} // SKU shouldn't be editable after creation or during submission
                />
                <small style={{color: '#6c757d'}}>Unique product identifier</small>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Total Stock {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Control
                  type="number"
                  name="totalStock"
                  value={currentProduct.totalStock}
                  onChange={handleInputChange}
                  placeholder="Total available units"
                  min="0"
                  required={!editMode}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Minimum Stock Alert</Form.Label>
                <Form.Control
                  type="number"
                  name="minStockAlert"
                  value={currentProduct.minStockAlert}
                  onChange={handleInputChange}
                  placeholder="Alert when stock drops below"
                  min="0"
                />
                <small style={{color: '#6c757d'}}>Get notified when stock is low</small>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Warehouse/Location</Form.Label>
                <Form.Control
                  type="text"
                  name="warehouse"
                  value={currentProduct.warehouse}
                  onChange={handleInputChange}
                  placeholder="Warehouse A, Shelf B2"
                />
              </Form.Group>
              <Form.Group className="mb-3 span-3">
                <Form.Label>Sizes (select multiple, required)</Form.Label>
                {renderSizesField()}
                {isSellerView && <small style={{color:'#3ff',fontWeight:600}}>You can choose as many as apply</small>}
              </Form.Group>
              <Form.Group className="mb-3 span-3">
                <Form.Label>Colors (select multiple, required) <span style={{color:'red'}}>*</span></Form.Label>
                {renderColorsField()}
                {isSellerView && <small style={{color:'#3ff',fontWeight:600}}>You can choose as many as apply</small>}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Select
                  name="catid"
                  value={currentProduct.catid}
                  onChange={handleInputChange}
                  required={!editMode}
                  disabled={isSubmitting}
                >
                  <option value="">Select category</option>
                  {categories?.map((c) => (
                    <option key={c._id} value={c._id}>{c.cname || c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Subcategory {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                <Form.Select
                  name="subcatid"
                  value={currentProduct.subcatid}
                  onChange={handleInputChange}
                  required={!editMode}
                  disabled={isSubmitting}
                >
                  <option value="">Select subcategory</option>
                  {subcategories
                    ?.filter((s) => !currentProduct.catid || s.catid === currentProduct.catid || s.catid?._id === currentProduct.catid)
                    ?.map((s) => (
                      <option key={s._id} value={s._id}>{s.scname || s.name}</option>
                    ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image 1 {editMode ? '' : '(required)'} {editMode ? '' : <span style={{color:'red'}}>*</span>}</Form.Label>
                {currentProduct.existingImage1 && (
                  <div style={{ marginBottom: '10px' }}>
                    <small style={{ color: '#6c757d', marginBottom: '5px', display: 'block' }}>Current Image:</small>
                    <Image src={currentProduct.existingImage1} width={100} height={80} rounded style={{ border: '1px solid #334155' }} />
                  </div>
                )}
                <Form.Control type="file" name="pimage1" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
                <small style={{color: '#6c757d'}}>Leave empty to keep current image</small>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image 2</Form.Label>
                {currentProduct.existingImage2 && (
                  <div style={{ marginBottom: '10px' }}>
                    <small style={{ color: '#6c757d', marginBottom: '5px', display: 'block' }}>Current Image:</small>
                    <Image src={currentProduct.existingImage2} width={100} height={80} rounded style={{ border: '1px solid #334155' }} />
                  </div>
                )}
                <Form.Control type="file" name="pimage2" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
                {currentProduct.existingImage2 && <small style={{color: '#6c757d'}}>Leave empty to keep current image</small>}
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Image 3</Form.Label>
                {currentProduct.existingImage3 && (
                  <div style={{ marginBottom: '10px' }}>
                    <small style={{ color: '#6c757d', marginBottom: '5px', display: 'block' }}>Current Image:</small>
                    <Image src={currentProduct.existingImage3} width={100} height={80} rounded style={{ border: '1px solid #334155' }} />
                  </div>
                )}
                <Form.Control type="file" name="pimage3" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} />
                {currentProduct.existingImage3 && <small style={{color: '#6c757d'}}>Leave empty to keep current image</small>}
              </Form.Group>
            </div>
            {formError && <p className="text-danger">{formError}</p>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  style={{ marginRight: '8px' }}
                />
                {editMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              editMode ? "Update" : "Create"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`p-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      {toast && toast.type === "success" && !showModal && (
        <div style={{margin:'20px auto',maxWidth:480,background:'linear-gradient(90deg,#16e0a0 30%,#22d3ee 100%)',color:'#0b1624',fontWeight:700,padding:'18px',borderRadius:'11px',boxShadow:'0 2px 24px #00eaff66',textAlign:'center',letterSpacing:'0.04em',fontSize:'1.10rem'}}>
          {toast.message}
        </div>
      )}
    </motion.div>
  );
}

export default Products;