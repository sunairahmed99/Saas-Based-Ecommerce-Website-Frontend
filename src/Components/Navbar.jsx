import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaHeart, FaShoppingCart } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectUser, logout, fetchCurrentUser } from "../Features/Backend/UserSlice";
import { selectSeller, logoutSeller, fetchCurrentSeller } from "../Features/Backend/SellerSlice";
import { fetchFavorites, selectFavorites } from "../Features/Backend/FavoriteSlice";
import { fetchCartCount, selectCartCount } from "../Features/Backend/CartSlice";
import { fetchcategories, selectcategories } from "../Features/Backend/CategorySlice";
import { fetchsubcategories, selectsubcategories } from "../Features/Backend/SubCategorySlice";
import "./Navbar.css";

const Navbar = () => {
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [subPos, setSubPos] = useState({ left: false, top: false });
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 850);
  let profileTimeout = null;
  const dropdownCloseTimeout = useRef(null);
  const user = useSelector(selectUser);
  const seller = useSelector(selectSeller);
  const favorites = useSelector(selectFavorites) || [];
  const cartCount = useSelector(selectCartCount);
  const categories = useSelector(selectcategories) || [];
  const subcategories = useSelector(selectsubcategories) || [];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 850);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openDropdown = () => {
    if (dropdownCloseTimeout.current) clearTimeout(dropdownCloseTimeout.current);
    setShopOpen(true);
  };

  const scheduleCloseDropdown = () => {
    if (dropdownCloseTimeout.current) clearTimeout(dropdownCloseTimeout.current);
    dropdownCloseTimeout.current = setTimeout(() => {
      setShopOpen(false);
      setHoveredCategory(null);
    }, 150); // slight delay so mouse can move from tab to menu
  };

  useEffect(() => {
    // Fetch categories/subcategories for dynamic menu (public routes)
    dispatch(fetchcategories());
    dispatch(fetchsubcategories());

    const token = localStorage.getItem("token");
    const loginType = localStorage.getItem("loginType");

    // Only fetch user data if we have a token
    if (token && loginType === "user") {
      if (!user) {
        dispatch(fetchCurrentUser());
      }
    } else if (token && loginType === "seller") {
      if (!seller) {
        dispatch(fetchCurrentSeller());
      }
    }

    // Fetch favorites and cart only if user/seller is authenticated
    if (token && (user || seller)) {
      dispatch(fetchFavorites());
      dispatch(fetchCartCount());
    }
  }, [dispatch, user, seller]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(logoutSeller());
    navigate("/");
  };

  // Prepare categories with their subcategories
  const categoryList = React.useMemo(() => {
    return (categories || []).map((cat) => {
      const subs =
        (subcategories || []).filter(
          (sub) => sub?.catid === cat?._id || sub?.catid?._id === cat?._id
        ) || [];
      return {
        id: cat?._id || cat?.id || cat?.name,
        name: cat?.name || cat?.cname || "Category",
        subcategories: subs.map((s) => ({
          id: s?._id || s?.id,
          name: s?.name || s?.scname || "Subcategory",
        })),
      };
    });
  }, [categories, subcategories]);

  return (
    <nav className="custom-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/" className="navbar-logo-link">MyShop</Link>
        </div>
        <div className={`navbar-menu ${mobileMenu ? "open" : ""}`}>
          <Link to="/" className="navbar-item">Home</Link>
          <Link to="/shop" className="navbar-item">Shop</Link>
          <div
            className="navbar-item shop-dropdown"
            onMouseEnter={!isMobile ? openDropdown : undefined}
            onMouseLeave={!isMobile ? scheduleCloseDropdown : undefined}
            onClick={(e) => {
              if (!isMobile) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              setShopOpen((prev) => !prev);
              setHoveredCategory(null);
            }}
          >
            Categories
            <div
              className={`dropdown-menu ${shopOpen ? "show" : ""}`}
              onMouseEnter={!isMobile ? openDropdown : undefined}
              onMouseLeave={!isMobile ? scheduleCloseDropdown : undefined}
            > 
              {categoryList.length === 0 && (
                <div className="dropdown-category" style={{ opacity: 0.7 }}>
                  No categories found
                </div>
              )}
              {categoryList.map((cat, i) => (
                <div
                  className="dropdown-category"
                  key={cat.id || cat.name || i}
                  onMouseEnter={!isMobile ? (e) => {
                    setHoveredCategory(i);
                    const rect = e.currentTarget.getBoundingClientRect();
                    const winW = window.innerWidth;
                    const winH = window.innerHeight;
                    
                    // If near right edge, pop left (threshold 250px for menu width)
                    const popLeft = rect.right + 250 > winW;
                    // If near bottom, pop top (threshold 300px for menu height)
                    const popTop = rect.bottom + 300 > winH;
                    
                    setSubPos({ left: popLeft, top: popTop });
                  } : undefined}
                  onMouseLeave={!isMobile ? () => {
                    setHoveredCategory(null);
                    setSubPos({ left: false, top: false });
                  } : undefined}
                  onClick={(e) => {
                    if (!isMobile) return;
                    e.preventDefault();
                    e.stopPropagation();
                    setHoveredCategory((prev) => prev === i ? null : i);
                  }}
                >
                  <div
                    className="cat-title"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/shop?category=${cat.id}`);
                      setShopOpen(false);
                      setHoveredCategory(null);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    
                  </div>
                  <div className="cat-title">{cat.name}</div>
                  {/* On mobile: Always show subcategories. On desktop: show on hover/click */}
                  {(
                    (mobileMenu && isMobile && hoveredCategory === i) ||
                    (!isMobile && hoveredCategory === i)
                  ) && (
                    <div className={`subcategory-list ${subPos.left ? 'pop-left' : ''} ${subPos.top ? 'pop-top' : ''}`}>

                      {cat.subcategories.length === 0 ? (
                        <div className="subcategory" style={{ opacity: 0.7 }}>No subcategories</div>
                      ) : (
                        cat.subcategories.map((sub) => (
                          <div
                            className="subcategory"
                            key={sub.id || sub.name}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              navigate(`/shop?subcategory=${sub.id}`);
                              setShopOpen(false);
                              setHoveredCategory(null);
                            }}
                          >
                            {sub.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Link to="/contact" className="navbar-item">Contact</Link>
          <Link to="/reviews" className="navbar-item">Reviews</Link>
        </div>
        <div className="navbar-right">
        {/* Cart icon - ONLY FOR USER */}
        {user && (
          <div  
            className="favorite-icon-wrapper"
            onClick={() => navigate("/cart")}
            title="My Cart"
            style={{ marginRight: "1rem" }}
          >
            <FaShoppingCart className="favorite-icon" />
            {cartCount > 0 && (
              <span className="favorite-badge">{cartCount}</span>
            )}
          </div>
        )}
        {/* Favorites icon - ONLY FOR USER */}
        {user && (
          <div  
            className="favorite-icon-wrapper"
            onClick={() => navigate("/favorites")}
            title="My Favorites"
          >
            <FaHeart className="favorite-icon" />
            {favorites.length > 0 && (
              <span className="favorite-badge">{favorites.length}</span>
            )}
          </div>
        )}
        {/* Profile icon menu as before for dropdown... (no change here, already splits user & seller) */}
        <div className="profile-menu"
          tabIndex={0} // for keyboard users
          style={{position:'relative'}}
          onMouseEnter={() => { clearTimeout(profileTimeout); setProfileOpen(true)} }
          onMouseLeave={() => { profileTimeout = setTimeout(() => setProfileOpen(false), 180); }}
          onFocus={() => setProfileOpen(true)}
          onBlur={() => setProfileOpen(false)}
        >
          {/* Profile Avatar - Show user image if available, otherwise show initials avatar */}
          {(user || seller) ? (
            <div className="profile-avatar" style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              backgroundImage: (user?.Image || user?.data?.Image)
                ? `url(${user?.Image || user?.data?.Image})`
                : (seller?.image || seller?.data?.image)
                  ? `url(${seller?.image || seller?.data?.image})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              border: '2px solid rgba(255,255,255,0.3)',
              marginBottom: '7px'
            }}>
              {/* Debug: Show what we're checking */}

              {!(user?.Image || user?.data?.Image) && !(seller?.image || seller?.data?.image) && (
                <span>
                  {(user?.name || user?.data?.name || seller?.name || seller?.data?.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ) : (
            <FaUserCircle size={29} className="profile-icon" style={{marginBottom:'7px'}} />
          )}
          <div className={profileOpen ? "profile-dropdown show" : "profile-dropdown"}>
            {!user && !seller && (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
            {user && (
              <>
                <Link to="/profile">My Profile</Link>
                <Link to="/orders">My Orders</Link>
                <Link to="/wallet">My Wallet</Link>
                <div style={{height: '1px', background: '#243b55', margin: '0.5rem 0'}}></div>
                <button type="button" className="dropdown-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
            {/* Seller Admin for active sellers only */}
            {seller && (seller.active === true || (seller.data && seller.data.active === true)) && (
              <>
                <Link to="/seller-profile">Seller Profile</Link>
                <Link to="/seller-admin">Seller Admin</Link>
                <button type="button" className="dropdown-logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
        <div
          className={`navbar-toggle ${mobileMenu ? "open" : ""}`}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle Menu"
        >
          <span /> <span /> <span />
        </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
