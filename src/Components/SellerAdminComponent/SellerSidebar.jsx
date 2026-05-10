import React from "react";
import { useSelector } from "react-redux";
import { selectSeller } from "../../Features/Backend/SellerSlice";
import { FaBoxes, FaBolt, FaBars, FaChartLine, FaShoppingCart, FaCog, FaWarehouse, FaRocket, FaComments } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const SellerSidebar = ({ setActivePage, activePage, open, setOpen }) => {
  const seller = useSelector(selectSeller);
  const sellerData = seller?.data || seller;
  const sellerName = sellerData?.sname || sellerData?.name || "Seller";

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1000) {
        setOpen(false);
      } else {
        setOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setOpen]);

  const navItems = [
    { label: 'Dashboard', icon: <FaChartLine />, page: 'dashboard' },
    { label: 'Products', icon: <FaBoxes />, page: 'products' },
    { label: 'Inventory', icon: <FaWarehouse />, page: 'inventory' },
    { label: 'Orders', icon: <FaShoppingCart />, page: 'orders' },
    { label: 'Flash Deals', icon: <FaBolt />, page: 'flashdeals' },
    { label: 'Product Boost', icon: <FaRocket />, page: 'productboost' },
    { label: 'Chat with Admin', icon: <FaComments />, page: 'chat' },
  ];

  return (
    <>
      <style>{`
        .modern-sidebar {
          background: linear-gradient(180deg, rgba(17, 28, 48, 0.95) 0%, rgba(26, 42, 68, 0.95) 100%);
          backdrop-filter: blur(15px);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 0;
          width: ${open ? '250px' : '70px'};
          transition: width 0.3s cubic-bezier(.56,.08,.53,1.04), transform 0.3s ease;
          position: relative;
          z-index: 40;
          border-right: 3px solid #00eaff;
          box-shadow: 2px 0 20px rgba(0, 234, 255, 0.1);
        }
        .sidebar-logo-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #00eaff;
          letter-spacing: 1.2px;
          text-align: left;
          padding: 30px 22px 20px 22px;
          text-shadow: 0 2px 15px #00eaff60;
          background: linear-gradient(135deg, #00eaff 0%, #0099cc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          border-bottom: 1px solid rgba(0, 234, 255, 0.2);
          margin-bottom: 10px;
        }
        .sidebar-toggle {
          display: none;
          position: absolute;
          top: 18px;
          right: -38px;
          background: #0d192f;
          color: #00eaff;
          border: none;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          box-shadow: 0 2px 10px #18234436;
          font-size: 1.33rem;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        @media (max-width: 1000px) {
          .modern-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100vh;
            width: 85vw;
            transform: translateX(${open ? '0' : '-100%'});
            min-width: 0;
            box-shadow: ${open ? '10px 0 24px #191f2b2d' : 'none'};
            border-right: none;
            overflow: visible;
            z-index: 99;
          }
          .sidebar-toggle {
            display: flex !important;
          }
          .sidebar-logo-title {
            font-size: 1.22rem;
            padding: 25px 14vw 14px 24px;
          }
        }
        .sidebar-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: 20px;
        }
        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 1rem 1.4rem;
          margin: 3px 10px;
          border-radius: 12px;
          color: #b8ebff;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 1.05rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
          box-shadow: 0 2px 8px rgba(0, 234, 255, 0.1);
          position: relative;
          overflow: hidden;
        }
        .sidebar-nav-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 234, 255, 0.1), transparent);
          transition: left 0.5s;
        }
        .sidebar-nav-btn:hover::before {
          left: 100%;
        }
        .sidebar-nav-btn:hover, .sidebar-nav-btn.active {
          background: linear-gradient(135deg, rgba(0, 234, 255, 0.15) 0%, rgba(0, 234, 255, 0.05) 100%);
          color: #00eaff;
          transform: translateX(5px);
          border-color: rgba(0, 234, 255, 0.3);
          box-shadow: 0 4px 20px rgba(0, 234, 255, 0.2);
        }
        .sidebar-nav-btn.active {
          background: linear-gradient(135deg, #00eaff 0%, #0099cc 100%);
          color: #0f172a;
          border-color: #00eaff;
          box-shadow: 0 0 20px rgba(0, 234, 255, 0.4);
        }
        .sidebar-nav-btn .icon {
          min-width: 26px;
          font-size: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @media (max-width: 700px) {
          .modern-sidebar {
            width: ${open ? '100vw' : '0'} !important;
            min-width: 0;
            padding: 0;
          }
          .sidebar-logo-title {
            padding-left: 21px;
          }
        }
      `}</style>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>
        <FaBars />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="modern-sidebar" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: 'spring', stiffness: 70 }}>
            <div className="sidebar-logo-title">{sellerName} Panel</div>
            <nav className="sidebar-list">
              {navItems.map(item => (
                <button
                  className={`sidebar-nav-btn ${activePage === item.page ? "active" : ""}`}
                  key={item.label}
                  onClick={() => {
                    setActivePage(item.page);
                    if (window.innerWidth <= 1000) setOpen(false);
                  }}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SellerSidebar;


