import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import SellerSidebar from "../Components/SellerAdminComponent/SellerSidebar";
import SellerDashboard from "../Components/SellerAdminComponent/SellerDashboard";
import SellerProducts from "../Components/SellerAdminComponent/SellerProducts";
import SellerInventory from "../Components/SellerAdminComponent/SellerInventory";
import SellerFlashDeals from "../Components/SellerAdminComponent/SellerFlashDeals";
import SellerProductBoost from "../Components/SellerAdminComponent/SellerProductBoost";
import SellerOrders from "../Components/SellerAdminComponent/SellerOrders";
import SellerProfile from "./SellerProfile";
import SellerChat from "./SellerChat";
import { FaBars } from "react-icons/fa";

const SellerAdmin = () => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1000);

  const renderPage = () => {
    const props = { setIsSidebarOpen };
    switch (activePage) {
      case "dashboard":
        return <SellerDashboard {...props} />;
      case "products":
        return <SellerProducts {...props} />;
      case "inventory":
        return <SellerInventory {...props} />;
      case "flashdeals":
        return <SellerFlashDeals {...props} />;
      case "productboost":
        return <SellerProductBoost {...props} />;
      case "orders":
        return <SellerOrders {...props} />;
      case "chat":
        return <SellerChat {...props} />;
      default:
        return <SellerDashboard {...props} />;
    }
  };

  const getPageTitle = () => {
    switch (activePage) {
      case "dashboard": return "Dashboard";
      case "products": return "Products";
      case "inventory": return "Inventory";
      case "flashdeals": return "Flash Deals";
      case "productboost": return "Product Boost";
      case "orders": return "Orders";
      case "chat": return "Chat";
      case "profile": return "Profile";
      default: return "Seller Panel";
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Mobile Top Header */}
      <div className="seller-mobile-header d-md-none">
        <button className="mobile-nav-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
          <FaBars />
        </button>
        <span className="mobile-header-title">{getPageTitle()}</span>
      </div>

      <div className="seller-admin-container">
        <SellerSidebar 
          setActivePage={setActivePage} 
          activePage={activePage} 
          open={isSidebarOpen} 
          setOpen={setIsSidebarOpen} 
        />
        <div className="seller-admin-content">
          {renderPage()}
        </div>
      </div>

      <style>{`
        .seller-admin-container {
          display: flex;
          min-height: 94vh;
          background: linear-gradient(135deg, #0a1428 0%, #0f1f3c 100%);
          position: relative;
          overflow-x: hidden;
          width: 100%;
          max-width: 100vw;
        }

        .seller-admin-content {
          flex: 1;
          width: calc(100% - 250px);
          overflow-x: hidden;
          transition: width 0.3s ease;
          box-sizing: border-box;
        }

        @media (max-width: 1000px) {
          .seller-admin-content {
            width: 100%;
            margin-left: 0;
          }
        }

        @media (max-width: 768px) {
          .seller-admin-container {
            flex-direction: column;
          }

          .seller-admin-content {
            width: 100%;
          }
        }

        .seller-mobile-header {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px 20px;
          background: #111c30;
          border-bottom: 1px solid rgba(0, 234, 255, 0.2);
          position: sticky;
          top: 0;
          z-index: 100;
          min-height: 60px;
        }

        .mobile-nav-toggle-btn {
          position: absolute;
          left: 15px;
          background: rgba(0, 234, 255, 0.1);
          border: 1px solid rgba(0, 234, 255, 0.3);
          color: #00eaff;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .mobile-header-title {
          color: #fff;
          font-weight: 700;
          font-size: 1.2rem;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
      `}</style>


    </>
  );
};

export default SellerAdmin;



