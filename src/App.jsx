import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Import Pages
import Home from "./Pages/Home";
import Shop from "./Pages/Shop";
import ProductDetail from "./Pages/ProductDetail";
import Cart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import VerifyCodeScreen from "./Pages/VerifyCodeScreen";
import Profile from "./Pages/Profile";
import MyOrders from "./Pages/MyOrders";
import Favorites from "./Pages/Favorites";
import ContactUs from "./Pages/ContactUs";
import Reviews from "./Pages/Reviews";
import Wallet from "./Pages/Wallet";
import GoogleCallback from "./Pages/GoogleCallback";
import Admin from "./Pages/Admin/Admin";
import AdminChat from "./Pages/AdminChat";
import SellerAdmin from "./Pages/SellerAdmin";
import SellerProfile from "./Pages/SellerProfile";
import SellerChat from "./Pages/SellerChat";
import Chatbot from "./Components/Chatbot";
import LiveChat from "./Components/LiveChat";
import { useLocation } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import { ToastContainer } from "./Components/Toast";

const AppContent = () => {
  const location = useLocation();
  const hideChatWidgets = 
    location.pathname.startsWith("/admin") || 
    location.pathname.startsWith("/seller-admin") || 
    location.pathname.startsWith("/seller-chat");

  return (
    <div className="App">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verifycode" element={<VerifyCodeScreen />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={<Admin />} />
        <Route path="/admin/chat" element={<AdminChat />} />

        {/* Seller Routes */}
        <Route path="/seller-admin/*" element={<SellerAdmin />} />
        <Route path="/seller-profile" element={<SellerProfile />} />
        <Route path="/seller-chat" element={<SellerChat />} />
      </Routes>
      {!hideChatWidgets && (
        <>
          <Chatbot />
          <LiveChat />
        </>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
      <ToastContainer />
    </Router>
  );
};

export default App;