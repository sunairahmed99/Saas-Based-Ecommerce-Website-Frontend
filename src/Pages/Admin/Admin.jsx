import React, { useState } from "react";
import Sidebar from "../../Components/AdminComponent/Sidebar";
import Users from "../../Components/AdminComponent/Users";
import Product from "../../Components/AdminComponent/Products";
import Orders from "../../Components/AdminComponent/Orders";
import Dashboard from "../../Components/AdminComponent/Dashboard";
import Categories from "../../Components/AdminComponent/Categories";
import SubCategories from "../../Components/AdminComponent/SubCategories";
import Sellerss from "../../Components/AdminComponent/Sellerss";
import AdminFlashDeals from "../../Components/AdminComponent/AdminFlashDeals";
import AdminProductBoost from "../../Components/AdminComponent/AdminProductBoost";
import AdminBannerOffers from "../../Components/AdminComponent/AdminBannerOffers";
import AdminBanner from "../../Components/AdminComponent/AdminBanner";
import Contacts from "../../Components/AdminComponent/Contacts";
import Reviews from "../../Components/AdminComponent/Reviews";
import AdminWallet from "../../Components/AdminComponent/AdminWallet";
import AdminCoupons from "../../Components/AdminComponent/AdminCoupons";
import AdminRefunds from "../../Components/AdminComponent/AdminRefunds";
import AdminProfitAnalytics from "../../Components/AdminComponent/AdminProfitAnalytics";
import AdminChat from "../AdminChat";
import "./Admin.css";

function Admin() {
  const [activePage, setActivePage] = useState("dashboard");

  const renderPage = () => {
    switch (activePage) {
      case "users":
        return <Users />;
      case "sellers":
        return <Sellerss />;
      case "products":
        return <Product />;
      case "orders":
        return <Orders />;
      case "categories":
        return <Categories />;
      case "Subcategories":
        return <SubCategories />;
      case "flashdeals":
        return <AdminFlashDeals />;
      case "productboost":
        return <AdminProductBoost />;
      case "banners":
        return <AdminBanner />;
      case "banneroffers":
        return <AdminBannerOffers />;
      case "contacts":
        return <Contacts />;
      case "reviews":
        return <Reviews />;
      case "wallet":
        return <AdminWallet />;
      case "coupons":
        return <AdminCoupons />;
      case "refunds":
        return <AdminRefunds />;
      case "profit-analytics":
        return <AdminProfitAnalytics />;
      case "chat":
        return <AdminChat />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      className="admin-layout"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a1428 0%, #0f1f3c 100%)",
        color: "#e5e7eb",
        display: "flex",
      }}
    >
      <Sidebar setActivePage={setActivePage} activePage={activePage} />
      <div className="admin-content">
        {renderPage()}
      </div>
    </div>
  );
}

export default Admin;
