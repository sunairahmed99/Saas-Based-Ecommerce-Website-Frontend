import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import HeroBanner from "../Components/Home/HeroBanner";
import { FaStar, FaHeart, FaSearch, FaFilter, FaTimes, FaCheckCircle, FaExclamationCircle, FaUser, FaHome } from "react-icons/fa";
import { fetchproducts, selectProducts, selectProductsLoading, fetchProductsByCategory, fetchProductsBySubcategory, fetchProductsBySeller, searchProducts, selectSearchResults, selectSearchLoading, selectProductsBySeller } from "../Features/Backend/ProductSlice";
import { addToFavorites, deleteFavorite, fetchFavorites, selectFavorites } from "../Features/Backend/FavoriteSlice";
import { selectUser } from "../Features/Backend/UserSlice";
import { selectSeller } from "../Features/Backend/SellerSlice";
import { fetchcategories, selectcategories } from "../Features/Backend/CategorySlice";
import { fetchsubcategories, selectsubcategories } from "../Features/Backend/SubCategorySlice";
import { fetchSeller, selectSellers } from "../Features/Backend/SellerSlice";
import { fetchBanners, selectBanners } from "../Features/Backend/BannerSlice";
import SEOHead from "../Components/SEOHead";
import { trackCategoryVisit } from "../utils/userBehavior";

const Shop = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allProducts = useSelector(selectProducts) || [];
  const sellerProducts = useSelector(selectProductsBySeller) || [];
  const loading = useSelector(selectProductsLoading);
  const searchResults = useSelector(selectSearchResults) || [];
  const searchLoading = useSelector(selectSearchLoading);
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const favorites = useSelector(selectFavorites) || [];
  const categories = useSelector(selectcategories) || [];
  const subcategories = useSelector(selectsubcategories) || [];
  const sellers = useSelector(selectSellers) || [];
  const dynamicBanners = useSelector(selectBanners) || [];
  const [bannersLoaded, setBannersLoaded] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [toast, setToast] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([1, 10000000]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("views");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 40;

  // Memoized category options
  const categoryOptions = useMemo(() => [
    "All",
    ...categories.map(cat => cat.name || cat.cname || "Category")
  ], [categories]);

  // Track category visits for recommendations
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "All") {
      trackCategoryVisit(selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch static lookups once on mount (only if not already loaded)
  useEffect(() => {
    if (!categories || categories.length === 0) {
      dispatch(fetchcategories());
    }
    if (!subcategories || subcategories.length === 0) {
      dispatch(fetchsubcategories());
    }
    if (!sellers || sellers.length === 0) {
      dispatch(fetchSeller());
    }
    if (!dynamicBanners || dynamicBanners.length === 0) {
      dispatch(fetchBanners()).then(() => {
        setBannersLoaded(true);
      });
    } else {
      setBannersLoaded(true);
    }
  }, [dispatch, categories?.length, subcategories?.length, sellers?.length, dynamicBanners?.length]);

  // Handle URL search parameters and fetch products
  useEffect(() => {
    const categoryId = searchParams.get('category');
    const subcategoryId = searchParams.get('subcategory');
    const sellerId = searchParams.get('seller');
    const searchQuery = searchParams.get('search');

    if (searchQuery) {
      dispatch(searchProducts(searchQuery));
    } else if (sellerId) {
      dispatch(fetchProductsBySeller(sellerId));
    } else if (subcategoryId) {
      dispatch(fetchProductsBySubcategory(subcategoryId));
    } else if (categoryId) {
      dispatch(fetchProductsByCategory(categoryId));
    } else {
      if (!allProducts || allProducts.length === 0) {
        dispatch(fetchproducts());
      }
    }
  }, [dispatch, searchParams, allProducts?.length]);

  // Fetch favorites when user or seller is logged in
  useEffect(() => {
    if (user || seller || localStorage.getItem("token")) {
      dispatch(fetchFavorites());
    }
  }, [dispatch, user, seller]);

  // Set breadcrumbs based on URL parameters
  useEffect(() => {
    const categoryId = searchParams.get('category');
    const subcategoryId = searchParams.get('subcategory');
    const sellerId = searchParams.get('seller');
    const searchQuery = searchParams.get('search');

    let newBreadcrumbs = [{ label: 'Home', path: '/', icon: <FaHome /> }];

    if (searchQuery) {
      newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
      newBreadcrumbs.push({ label: `Search: "${searchQuery}"`, path: `/shop?search=${encodeURIComponent(searchQuery)}` });
    } else if (sellerId) {
      // Find seller name for breadcrumb
      const seller = sellers.find(s => s._id === sellerId);
      if (seller) {
        newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
        newBreadcrumbs.push({ label: seller.shopName || seller.name, path: `/shop?seller=${sellerId}` });
      } else {
        newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
      }
    } else if (categoryId) {
      const category = categories.find(cat => cat._id === categoryId);
      if (category) {
        newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
        newBreadcrumbs.push({ label: category.name, path: `/shop?category=${categoryId}` });
      }
    } else if (subcategoryId) {
      const subcategory = subcategories.find(sub => sub._id === subcategoryId);
      const categoryIdFromParam = searchParams.get('category');
      if (subcategory && categoryIdFromParam) {
        const category = categories.find(cat => cat._id === categoryIdFromParam);
        if (category) {
          newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
          newBreadcrumbs.push({ label: category.name, path: `/shop?category=${categoryIdFromParam}` });
          newBreadcrumbs.push({ label: subcategory.name, path: `/shop?subcategory=${subcategoryId}&category=${categoryIdFromParam}` });
        }
      }
    } else {
      newBreadcrumbs.push({ label: 'Shop', path: '/shop' });
    }

    setBreadcrumbs(newBreadcrumbs);
  }, [searchParams, categories, subcategories, sellers]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Memoized favorites check
  const isFavorite = useCallback((productId) => {
    return favorites.some(
      (fav) => (fav.productId?._id || fav.productId) === productId
    );
  }, [favorites]);

  // Memoized favorite toggle handler
  const handleFavoriteClick = useCallback(async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user && !seller && !localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }

    if (processingIds.has(productId)) return;

    // Check if already favorite and show message
    if (isFavorite(productId)) {
      setToast({
        type: "info",
        message: "Already in favorites! Click again to remove.",
        icon: <FaCheckCircle />
      });
    }

    setProcessingIds((prev) => new Set(prev).add(productId));

    try {
      if (isFavorite(productId)) {
        const favorite = favorites.find(
          (fav) => (fav.productId?._id || fav.productId) === productId
        );
        if (favorite) {
          await dispatch(deleteFavorite({ favoriteId: favorite._id })).unwrap();
          dispatch(fetchFavorites());
          setToast({
            type: "success",
            message: "Removed from favorites",
            icon: <FaHeart />
          });
        }
      } else {
        await dispatch(addToFavorites(productId)).unwrap();
        dispatch(fetchFavorites());
        setToast({
          type: "success",
          message: "Added to favorites!",
          icon: <FaCheckCircle />
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setToast({
        type: "error",
        message: error || "Failed to update favorite. Please try again.",
        icon: <FaHeart />
      });
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  }, [user, seller, processingIds, isFavorite, dispatch]);

  // Memoized filtered and sorted products for performance
  const filteredProducts = useMemo(() => {
    // Check if we're using search results from URL or local products
    const searchQueryParam = searchParams.get('search');
    const sellerIdParam = searchParams.get('seller');
    const categoryIdParam = searchParams.get('category');
    const subcategoryIdParam = searchParams.get('subcategory');
    
    const isSearchMode = !!searchQueryParam;
    const isSellerMode = !!sellerIdParam;
    const isCategoryMode = !!categoryIdParam;
    const isSubcategoryMode = !!subcategoryIdParam;

    // Use appropriate source based on mode
    let sourceProducts;
    if (isSearchMode) {
      sourceProducts = searchResults;
    } else if (isSellerMode) {
      sourceProducts = sellerProducts;
    } else if (isCategoryMode || isSubcategoryMode) {
      // In category/subcategory mode, ProductSlice already filtered them into searchResults 
      // or we can use allProducts if searchResults is empty but we have them loaded
      sourceProducts = searchResults.length > 0 ? searchResults : allProducts;
    } else {
      sourceProducts = allProducts;
    }

    // Filter to show only active products
    const activeProducts = sourceProducts.filter(product => product.pstatus === "active");

    let filtered = activeProducts.map((p) => ({
      ...p,
      id: p._id,
      name: p.pname,
      category: p.catid?.name || p.catid?.cname || "All",
      price: p.prodisprice || p.pprice,
      originalPrice: p.pactualprice || p.pprice,
      image: p.pimage1,
      inStock: p.totalStock > 0 && p.pstatus === "active",
      discount: p.pdis || 0,
      rating: p.rating || 0,
      reviews: p.reviewCount || 0,
      sellerid: p.sellerid,
    }));

    // Search filter (local filter on top of search results or all products)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.pdescription?.toLowerCase().includes(searchLower)
      );
    }

    // Category selection filter (UI filter)
    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Rating filter
    filtered = filtered.filter((p) => parseFloat(p.rating) >= minRating);

    // Sort
    switch (sortBy) {
      case "views":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      case "name":
        filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      default:
        break;
    }

    return filtered;
  }, [searchQuery, selectedCategory, priceRange, minRating, sortBy, allProducts, searchResults, searchParams, sellerProducts]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, minRating, sortBy]);

  // Memoized pagination calculations
  const { paginatedProducts, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredProducts.length / productsPerPage);
    const paginated = filteredProducts.slice(
      (currentPage - 1) * productsPerPage,
      currentPage * productsPerPage
    );
    return { paginatedProducts: paginated, totalPages: total };
  }, [filteredProducts, currentPage, productsPerPage]);

  const [currentBanner, setCurrentBanner] = useState(0);

  const bannerAds = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
      title: "Electronics Sale",
      subtitle: "Up to 50% OFF",
      description: "Shop the latest gadgets and electronics",
      seller: "TechStore",
      link: "#electronics",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200",
      title: "Fashion Week",
      subtitle: "New Collection",
      description: "Discover trendy fashion items",
      seller: "FashionHub",
      link: "#fashion",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200",
      title: "Home Essentials",
      subtitle: "Best Deals",
      description: "Everything you need for your home",
      seller: "HomeMart",
      link: "#home",
    },
  ];

  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerAds.length);
    }, 4000);
    return () => clearInterval(bannerTimer);
  }, [bannerAds.length]);

  return (
    <>
      <SEOHead
        title="Shop - Electronics, Fashion & More"
        description="Browse our extensive collection of electronics, fashion, home goods and more. Find great deals with fast shipping and excellent customer service."
        keywords="shop, products, electronics, fashion, home goods, deals, online shopping"
        type="website"
      />
      <Navbar />

      {/* Conditional Banner: Dynamic from backend OR Static shop banner */}
      {!bannersLoaded ? (
        // Loading state - show nothing or a loading indicator
        <div style={{ height: '20px' }}></div>
      ) : dynamicBanners && dynamicBanners.length > 0 ? (
        <HeroBanner />
      ) : (
        <div className="shop-banner-slider">
          <div className="banner-wrapper">
            {bannerAds.map((banner, index) => (
              <div
                key={banner.id}
                className={`banner-slide ${index === currentBanner ? "active" : ""}`}
                style={{ backgroundImage: `url(${banner.image})` }}
              >
                <div className="banner-overlay" />
                <div className="banner-content">
                  <span className="banner-badge">Sponsored Ad</span>
                  <h2>{banner.title}</h2>
                  <p className="banner-subtitle">{banner.subtitle}</p>
                  <p className="banner-description">{banner.description}</p>
                  <div className="banner-seller">By {banner.seller}</div>
                  <button className="banner-cta">Shop Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 1 && (
        <div className="breadcrumb-container">
          <div className="breadcrumb-wrapper">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {index === breadcrumbs.length - 1 ? (
                  <span className="breadcrumb-current">{crumb.icon} {crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.icon} {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <div className="shop-page">
        <div className="shop-container">
          {/* Sidebar Filters */}
          <aside className={`filters-sidebar ${showFilters ? "open" : ""}`}>
            <div className="filters-header">
              <h2>Filters</h2>
              <button className="close-filters" onClick={() => setShowFilters(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Search */}
            <div className="filter-section">
              <h3>Search</h3>
              <div className="search-box">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Category */}
            <div className="filter-section">
              <h3>Category</h3>
              <div className="filter-options">
                {categoryOptions.map((cat) => (
                  <label key={cat} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) =>
                    setPriceRange([Math.min(Math.max(parseInt(e.target.value) || 1, 1), priceRange[1]), priceRange[1]])
                  }
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], Math.min(Math.max(parseInt(e.target.value) || 1, priceRange[0]), 10000000)])
                  }
                />
              </div>
              <input
                type="range"
                min="1"
                max="10000000"
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Math.min(Math.max(parseInt(e.target.value), 1), 10000000)])
                }
                className="price-slider"
              />
            </div>

            {/* Rating */}
            <div className="filter-section">
              <h3>Minimum Rating</h3>
              <div className="rating-filter">
                {[4, 3, 2, 1, 0].map((rating) => (
                  <label key={rating} className="rating-option">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                    />
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < rating ? "filled" : ""}
                          style={i < rating ? { color: '#f97316', fill: '#f97316' } : {}}
                        />
                      ))}
                      <span>& above</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <button
              className="clear-filters"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setPriceRange([1, 10000000]);
                setMinRating(0);
              }}
            >
              Clear All Filters
            </button>
          </aside>

          {/* Main Content */}
          <main className="shop-main">
            {/* Toolbar */}
            <div className="shop-toolbar">
              <button
                className="filter-toggle"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> Filters
              </button>
              <div className="sort-section">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="views">Most Viewed</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="no-products">
                <p>Loading products...</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="products-grid">
                {paginatedProducts.map((product) => (
                  <div key={product.id || product._id} className="product-card" onClick={() => navigate(`/product/${product.id || product._id}`)} style={{ cursor: "pointer" }}>
                    <div className="product-image-wrapper">
                      <img src={product.image || "https://via.placeholder.com/400?text=No+Image"} alt={product.name} />
                      {product.discount > 0 && (
                        <span className="discount-badge">{product.discount}%</span>
                      )}
                      <span className="pill pill-views">👁️ {product.views || 0}</span>
                      {(user || seller || localStorage.getItem("token")) && localStorage.getItem("loginType") !== "seller" && (
                        <button
                          className={`wishlist-btn ${isFavorite(product.id || product._id) ? "active" : ""} ${processingIds.has(product.id || product._id) ? "processing" : ""}`}
                          onClick={(e) => handleFavoriteClick(e, product.id || product._id)}
                          disabled={processingIds.has(product.id || product._id)}
                          title={isFavorite(product.id || product._id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <FaHeart />
                        </button>
                      )}
                      {!product.inStock && (
                        <div className="out-of-stock">Out of Stock</div>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-category">{product.category || "Uncategorized"}</span>
                      <h3>{product.name || product.pname}</h3>
                      <div className="product-seller-name">
                        <FaUser style={{ fontSize: "0.75rem", marginRight: "0.3rem" }} />
                        <span>{product.sellerid?.sname || product.sellerid?.name || product.sellerid || "Unknown Seller"}</span>
                      </div>
                      <div className="product-rating">
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < Math.floor(product.rating || 0) ? "filled" : ""}
                              style={i < Math.floor(product.rating || 0) ? { color: '#f97316', fill: '#f97316' } : {}}
                            />
                          ))}
                        </div>
                        <span>({product.reviews || 0})</span>
                      </div>
                      <div className="product-price">
                        {product.originalPrice > product.price && product.originalPrice > 0 ? (
                          <>
                            <span className="original-price">PKR {Number(product.originalPrice).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="current-price">PKR {Number(product.price).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </>
                        ) : (
                          <>
                            <span className="original-price" style={{ visibility: 'hidden' }}>PKR 0.00</span>
                            <span className="current-price">PKR {Number(product.price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </>
                        )}
                      </div>
                      <button
                        className="add-to-cart"
                        disabled={!product.inStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id || product._id}`);
                        }}
                      >
                        {product.inStock ? "View Details" : "Out of Stock"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>No products found matching your criteria.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="pagination">
                  <button
                    className="pagination-btn prev"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ← Previous
                  </button>
                  <div className="pagination-numbers">
                    {currentPage > 2 && (
                      <>
                        <button onClick={() => setCurrentPage(1)}>1</button>
                        {currentPage > 3 && <span className="pagination-dots">...</span>}
                      </>
                    )}
                    {currentPage > 1 && (
                      <button onClick={() => setCurrentPage(currentPage - 1)}>
                        {currentPage - 1}
                      </button>
                    )}
                    <button className="active">{currentPage}</button>
                    {currentPage < totalPages && (
                      <button onClick={() => setCurrentPage(currentPage + 1)}>
                        {currentPage + 1}
                      </button>
                    )}
                    {currentPage < totalPages - 1 && (
                      <>
                        {currentPage < totalPages - 2 && <span className="pagination-dots">...</span>}
                        <button onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                      </>
                    )}
                  </div>
                  <button
                    className="pagination-btn next"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <style>{`
        .shop-page {
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          min-height: 100vh;
          color: #ffffff;
          padding-top: 60px;
          padding-left: 0;
          padding-right: 0;
          width: 100%;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .shop-page {
            padding: 60px 0 2rem 0;
          }

          .shop-container {
            gap: 1rem;
            padding: 0;
          }

          .shop-toolbar {
            padding: 0.75rem;
            margin-bottom: 1rem;
          }

          .product-card {
            border-radius: 12px;
          }

          .pagination {
            flex-wrap: wrap;
            gap: 0.5rem;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 769px) and (max-width: 1024px) {
          .shop-page {
            padding: 60px 0 2rem 0;
          }

          .shop-container {
            width: 100%;
            max-width: none;
            gap: 1.5rem;
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1rem;
          }

          .filters-sidebar {
            width: 240px;
          }
        }

        /* Desktop enhancements */
        @media (min-width: 1025px) {
          .shop-page {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 60px 0 2rem 0;
          }
        }
        .shop-banner-slider {
          width: 100%;
          height: 400px;
          position: relative;
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .banner-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .banner-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transition: opacity 0.8s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .banner-slide.active {
          opacity: 1;
          z-index: 1;
        }
        .banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(30, 32, 39, 0.85), rgba(51, 68, 102, 0.75));
        }
        .banner-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          max-width: 700px;
          padding: 0 2rem;
        }
        .banner-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
        }
        .banner-content h2 {
          font-size: 3rem;
          margin: 0 0 0.5rem 0;
          font-weight: 700;
        }
        .banner-subtitle {
          font-size: 1.5rem;
          margin: 0 0 0.8rem 0;
          color: #fbbf24;
          font-weight: 600;
        }
        .banner-description {
          font-size: 1.1rem;
          margin: 0 0 1rem 0;
          opacity: 0.9;
        }
        .banner-seller {
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          opacity: 0.8;
          font-style: italic;
        }
        .banner-cta {
          padding: 0.8rem 2.5rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .banner-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .shop-container {
          display: flex;
          width: 100%;
          padding: 0 1rem 2rem 1rem;
          gap: 2rem;
        }

        /* Make shop container full width on all devices */
        @media (max-width: 768px) {
          .shop-container {
            padding: 0 0.5rem 2rem 0.5rem;
          }
        }

        @media (min-width: 769px) {
          .shop-container {
            padding: 0 1rem 2rem 1rem;
          }
        }
        .filters-sidebar {
          width: 260px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 1.2rem;
          height: fit-content;
          position: sticky;
          top: 80px;
        }
        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .filters-header h2 {
          margin: 0;
          font-size: 1.3rem;
        }
        .close-filters {
          display: none;
          background: none;
          border: none;
          color: #ffffff;
          font-size: 1.2rem;
          cursor: pointer;
        }
        .filter-section {
          margin-bottom: 1.5rem;
        }
        .filter-section h3 {
          font-size: 1rem;
          margin: 0 0 0.8rem 0;
          color: rgba(255, 255, 255, 0.9);
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 100%;
          box-sizing: border-box;
        }
        .search-box input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 0.9rem;
          width: 100%;
          box-sizing: border-box;
        }
        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        /* Mobile responsive search box */
        @media (max-width: 768px) {
          .search-box {
            padding: 0.5rem;
            gap: 0.4rem;
          }

          .search-box input {
            font-size: 0.85rem;
            padding: 0.2rem 0;
          }
        }

        @media (max-width: 480px) {
          .search-box {
            padding: 0.4rem;
            gap: 0.3rem;
          }

          .search-box input {
            font-size: 0.8rem;
          }
        }
        .filter-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }
        
        /* Scrollbar styling for filter options */
        .filter-options::-webkit-scrollbar {
          width: 6px;
        }
        .filter-options::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .filter-options::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .filter-options::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .filter-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .filter-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .filter-option input[type="radio"] {
          cursor: pointer;
        }
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          margin-bottom: 0.8rem;
          flex-wrap: wrap;
        }
        .price-inputs input {
          flex: 1;
          min-width: 0;
          padding: 0.4rem 0.3rem;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          outline: none;
          font-size: 0.85rem;
          text-align: center;
        }
        .price-inputs span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }
        .price-slider {
          width: 100%;
        }
        .rating-filter {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .rating-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 6px;
          transition: background 0.2s;
        }
        .rating-option:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .stars {
          display: flex;
          gap: 0.2rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .stars .filled,
        .stars svg.filled {
          color: #f97316 !important;
          fill: #f97316 !important;
        }
        .clear-filters {
          width: 100%;
          padding: 0.7rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .clear-filters:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        .shop-main {
          flex: 1;
        }
        .shop-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
        }
        .filter-toggle {
          display: none;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
        }
        .sort-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .sort-section label {
          color: rgba(255, 255, 255, 0.9);
        }
        .sort-section select {
          padding: 0.6rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: #222a35; /* Changed to dark color */
          color: #ffffff;
          outline: none;
          cursor: pointer;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .product-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.2s, box-shadow 0.2s;
          height: 100%;
          min-height: 380px;
          display: flex;
          flex-direction: column;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
        .product-image-wrapper {
          position: relative;
          width: 100%;
          height: 250px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
        }
        .product-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .discount-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          background: #ef4444;
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .pill {
          background: rgba(0, 0, 0, 0.68);
          color: #e7f7ff;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 0.7rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
          line-height: 1.1;
        }
        .pill-views {
          position: absolute;
          top: 2.2rem; /* Position below discount badge */
          left: 0.5rem;
          background: rgba(30, 32, 39, 0.8);
        }
        .wishlist-btn {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }
        .wishlist-btn:hover:not(:disabled),
        .wishlist-btn.active {
          background: #ef4444;
          color: white;
          transform: scale(1.1);
        }
        .wishlist-btn.processing {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .out-of-stock {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          text-align: center;
          padding: 0.5rem;
          font-weight: 600;
        }
        .product-info {
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex-grow: 1;
          text-align: left;
          align-items: flex-start;
        }
        .product-category {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          display: block;
        }
        .product-info h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #ffffff;
          font-weight: 700;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .product-seller-name {
          display: flex;
          align-items: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          font-style: italic;
        }
        .product-seller-name svg {
          color: #00eaff;
        }
        .product-rating {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .product-price {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          margin: 0.4rem 0 0.8rem 0;
          flex-grow: 1; /* Pushes the button to the bottom */
          justify-content: flex-end;
          align-self: stretch;
        }
        .current-price {
          font-size: 1.2rem;
          font-weight: 700;
          color: #fbbf24;
        }
        .original-price {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          text-decoration: line-through;
          font-weight: 500;
        }
        .add-to-cart {
          align-self: stretch;
          width: 100%;
          padding: 0.7rem;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .add-to-cart:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .add-to-cart:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .no-products {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .pagination-wrapper {
          margin-top: 3rem;
          padding: 2rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .pagination-info {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          text-align: center;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .pagination-btn {
          padding: 0.7rem 1.2rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .pagination-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        .pagination-numbers {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .pagination-numbers button {
          min-width: 40px;
          height: 40px;
          padding: 0.6rem 0.8rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pagination-numbers button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        .pagination-numbers button.active {
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
          border-color: transparent;
        }
        .pagination-numbers button.active:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .pagination-dots {
          color: rgba(255, 255, 255, 0.6);
          padding: 0 0.5rem;
          font-size: 1rem;
        }
        @media (max-width: 768px) {
          .pagination-wrapper {
            margin-top: 2rem;
            padding: 1.5rem 0;
          }
          .pagination-info {
            font-size: 0.85rem;
          }
          .pagination-btn {
            padding: 0.6rem 1rem;
            font-size: 0.9rem;
          }
          .pagination-numbers button {
            min-width: 36px;
            height: 36px;
            padding: 0.5rem 0.6rem;
            font-size: 0.85rem;
          }
        }
        @media (max-width: 1024px) {
          .filters-sidebar {
            position: fixed;
            top: 0;
            left: -100%;
            width: 280px;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s;
            overflow-y: auto;
          }
          .filters-sidebar.open {
            left: 0;
          }
          .close-filters {
            display: block;
          }
          .filter-toggle {
            display: flex;
          }
        }
        @media (max-width: 768px) {
          .filters-sidebar {
            width: 100%;
            margin-bottom: 1rem;
          }

          .search-box {
            max-width: 100%;
            overflow: hidden;
          }

          .pill-views {
            top: 2rem; /* Adjust for mobile */
          }

          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 0.75rem;
          }

          /* Extra small mobile screens */
          @media (max-width: 480px) {
            .products-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
          }
        }
          .shop-header h1 {
            font-size: 2rem;
          }
          .sort-section label {
            display: none;
          }
        }
        .favorite-toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          z-index: 10000;
          min-width: 280px;
          max-width: 350px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .favorite-toast.success {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.95), rgba(22, 163, 74, 0.95));
          color: white;
          border-color: rgba(34, 197, 94, 0.5);
        }
        .favorite-toast.info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.95));
          color: white;
          border-color: rgba(59, 130, 246, 0.5);
        }
        .favorite-toast.error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
          color: white;
          border-color: rgba(239, 68, 68, 0.5);
        }
        .toast-icon {
          font-size: 1.3rem;
          display: flex;
          align-items: center;
        }
        .toast-message {
          font-size: 0.95rem;
          font-weight: 600;
          flex: 1;
        }
        @media (max-width: 768px) {
          .favorite-toast {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            min-width: auto;
            max-width: none;
          }
        }
        .breadcrumb-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem 0;
          position: sticky;
          top: 60px;
          z-index: 100;
          margin-bottom: 0;
        }
        .breadcrumb-wrapper {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }
        .breadcrumb-separator {
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0.5rem;
        }
        .breadcrumb-link {
          color: #fbbf24;
          text-decoration: none;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .breadcrumb-link:hover {
          color: #f59e0b;
          text-decoration: underline;
        }
        .breadcrumb-current {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .breadcrumb-link svg,
        .breadcrumb-current svg {
          font-size: 0.8rem;
        }
      `}</style>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`favorite-toast ${toast.type || "info"}`}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="toast-icon">{toast.icon}</div>
            <div className="toast-message">{toast.message}</div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
});

Shop.displayName = 'Shop';

export default Shop;

