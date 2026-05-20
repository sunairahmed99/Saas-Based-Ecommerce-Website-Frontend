import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaChartBar, FaUsers, FaBoxes, FaThList, FaUserTie, FaClipboardList, FaListUl, FaBars, FaBolt, FaImage, FaEnvelope, FaRocket, FaComments, FaSignOutAlt } from 'react-icons/fa';
import { FaStar, FaWallet, FaTags, FaUndoAlt } from 'react-icons/fa';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectUser } from '../../Features/Backend/UserSlice';
import { useNavigate } from 'react-router-dom';

function Sidebar({ setActivePage, activePage }) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const userData = user?.data || user;

  React.useEffect(() => {
    // Only set open to true if it's a desktop on initial load
    if (window.innerWidth > 1000) {
      setOpen(true);
    }
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleNavClick = (page) => {
    setActivePage(page);
    if (window.innerWidth <= 1000) {
      setOpen(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: <FaChartBar />, page: 'dashboard' },
    { label: 'Users', icon: <FaUsers />, page: 'users' },
    { label: 'Sellers', icon: <FaUserTie />, page: 'sellers' },
    { label: 'Products', icon: <FaBoxes />, page: 'products' },
    { label: 'Orders', icon: <FaClipboardList />, page: 'orders' },
    { label: 'Categories', icon: <FaThList />, page: 'categories' },
    { label: 'SCategories', icon: <FaListUl />, page: 'Subcategories' },
    { label: 'Flash Deals', icon: <FaBolt />, page: 'flashdeals' },
    { label: 'Product Boost', icon: <FaRocket />, page: 'productboost' },
    { label: 'Banners', icon: <FaImage />, page: 'banners' },
    { label: 'Banner Offers', icon: <FaImage />, page: 'banneroffers' },
    { label: 'Coupons', icon: <FaTags />, page: 'coupons' },
    { label: 'Profit Anal', icon: <FaChartBar />, page: 'profit-analytics' },
    { label: 'Refunds', icon: <FaUndoAlt />, page: 'refunds' },
    { label: 'Wall & Rew', icon: <FaWallet />, page: 'wallet' },
    { label: 'Contact', icon: <FaEnvelope />, page: 'contacts' },
    { label: 'Chat Support', icon: <FaComments />, page: 'chat' },
    { label: 'Reviews', icon: <FaStar />, page: 'reviews' },
  ];

  return (
    <>
      <style>{`
        .modern-sidebar {
          background: rgba(17, 28, 48, 0.98);
          backdrop-filter: blur(15px);
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 0;
          width: 260px;
          position: sticky;
          top: 0;
          z-index: 10005;
          border-right: 1px solid rgba(0, 234, 255, 0.1);
          box-shadow: 10px 0 30px rgba(0,0,0,0.5);
          overflow: hidden;
        }
        .sidebar-logo-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #00eaff;
          letter-spacing: 1.5px;
          padding: 30px 25px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          text-shadow: 0 0 15px rgba(0, 234, 255, 0.3);
        }
        .sidebar-toggle {
          position: fixed;
          top: 15px;
          left: 15px;
          background: #00eaff;
          color: #0a1428;
          border: none;
          border-radius: 8px;
          width: 35px;
          height: 35px;
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 10006;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(0, 234, 255, 0.4);
          transition: all 0.3s ease;
        }
        .sidebar-toggle:hover {
          transform: scale(1.1);
          background: #fff;
        }
        .sidebar-toggle.open {
          left: 275px;
        }
        @media (max-width: 1000px) {
          .modern-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 280px;
            max-width: 85vw;
          }
          .sidebar-logo-title {
            font-size: 0.9rem;
            padding: 15px 15px;
          }
          .sidebar-nav-btn {
            font-size: 0.75rem;
            padding: 8px 12px;
          }
          .sidebar-toggle {
            display: flex !important;
          }
          .sidebar-toggle.open {
            left: auto;
            right: 20px;
            background: #ff4757;
            color: white;
          }
        }
        .sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 20px 10px;
          overflow-y: auto;
          flex: 1;
        }
        /* Custom Scrollbar */
        .sidebar-list::-webkit-scrollbar {
          width: 5px;
        }
        .sidebar-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-list::-webkit-scrollbar-thumb {
          background: rgba(0, 234, 255, 0.2);
          border-radius: 10px;
        }
        .sidebar-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 234, 255, 0.4);
        }
        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 18px;
          border-radius: 10px;
          color: #a0aec0;
          background: none;
          border: none;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }
        .sidebar-nav-btn:hover {
          color: #00eaff;
          background: rgba(0, 234, 255, 0.05);
          padding-left: 22px;
        }
        .sidebar-nav-btn.active {
          color: #0a1428;
          background: #00eaff;
          box-shadow: 0 4px 15px rgba(0, 234, 255, 0.3);
        }
        .sidebar-nav-btn .icon {
          font-size: 1.2rem;
        }
        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px 18px;
          border-radius: 10px;
          color: #ff4757;
          background: rgba(255, 71, 87, 0.1);
          border: 1px solid rgba(255, 71, 87, 0.2);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }
        .sidebar-logout-btn:hover {
          background: #ff4757;
          color: white;
          transform: translateY(-2px);
        }
        
        /* Mobile Overlay */
        .sidebar-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 10004;
        }
      `}</style>

      <button className={`sidebar-toggle ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        {open ? (window.innerWidth <= 1000 ? '✕' : <FaBars />) : <FaBars />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {window.innerWidth <= 1000 && (
              <motion.div 
                className="sidebar-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
            )}
            <motion.div 
              className="modern-sidebar" 
              initial={{ x: -300 }} 
              animate={{ x: 0 }} 
              exit={{ x: -300 }} 
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
              <div className="sidebar-logo-title">
                ADMIN PANEL
                {userData && (
                  <div className="admin-profile-section" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="admin-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#00eaff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1428', fontWeight: 'bold', fontSize: '1.2rem', overflow: 'hidden', flexShrink: 0 }}>
                      {userData.Image ? (
                        <img src={userData.Image} alt="admin avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        userData.name ? userData.name.charAt(0).toUpperCase() : 'A'
                      )}
                    </div>
                    <div className="admin-info" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span className="admin-name" style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData.name || 'Admin'}</span>
                      <span className="admin-role" style={{ fontSize: '0.75rem', color: '#00eaff', fontWeight: '500' }}>{userData.role ? userData.role.toUpperCase() : 'ADMIN'}</span>
                    </div>
                  </div>
                )}
              </div>
              <nav className="sidebar-list">
                {navItems.map(item => (
                  <button
                    className={`sidebar-nav-btn ${activePage === item.page ? "active" : ""}`}
                    key={item.label}
                    onClick={() => handleNavClick(item.page)}
                  >
                    <span className="icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="sidebar-footer">
                <button
                  className="sidebar-logout-btn"
                  onClick={handleLogout}
                >
                  <span className="icon"><FaSignOutAlt /></span>
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
