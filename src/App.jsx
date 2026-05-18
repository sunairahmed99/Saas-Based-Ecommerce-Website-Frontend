import React, { lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Lazy Load Pages
const Home = lazy(() => import("./Pages/Home"));
const Shop = lazy(() => import("./Pages/Shop"));
const ProductDetail = lazy(() => import("./Pages/ProductDetail"));
const Cart = lazy(() => import("./Pages/Cart"));
const Checkout = lazy(() => import("./Pages/Checkout"));
const Login = lazy(() => import("./Pages/Login"));
const Register = lazy(() => import("./Pages/Register"));
const ForgotPassword = lazy(() => import("./Pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./Pages/ResetPassword"));
const VerifyCodeScreen = lazy(() => import("./Pages/VerifyCodeScreen"));
const Profile = lazy(() => import("./Pages/Profile"));
const MyOrders = lazy(() => import("./Pages/MyOrders"));
const Favorites = lazy(() => import("./Pages/Favorites"));
const ContactUs = lazy(() => import("./Pages/ContactUs"));
const Reviews = lazy(() => import("./Pages/Reviews"));
const Wallet = lazy(() => import("./Pages/Wallet"));
const GoogleCallback = lazy(() => import("./Pages/GoogleCallback"));
const Admin = lazy(() => import("./Pages/Admin/Admin"));
const AdminChat = lazy(() => import("./Pages/AdminChat"));
const SellerAdmin = lazy(() => import("./Pages/SellerAdmin"));
const SellerProfile = lazy(() => import("./Pages/SellerProfile"));
const SellerChat = lazy(() => import("./Pages/SellerChat"));

// Regular Components
import Chatbot from "./Components/Chatbot";
import LiveChat from "./Components/LiveChat";
import { useLocation } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import { ToastContainer } from "./Components/Toast";
import SplashScreen from "./Components/SplashScreen";

const AppContent = () => {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const location = useLocation();
  const hideChatWidgets = 
    location.pathname.startsWith("/admin") || 
    location.pathname.startsWith("/seller-admin") || 
    location.pathname.startsWith("/seller-chat");

  if (!isSplashComplete) {
    return <SplashScreen onComplete={() => setIsSplashComplete(true)} />;
  }

  return (
    <div className="App">
      <ScrollToTop />
      <Suspense fallback={
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(128deg, #1e2027 0%, #334466 100%)", color: "#00eaff" }}>
          <div style={{
            width: "50px",
            height: "50px",
            border: "3px solid rgba(0, 234, 255, 0.1)",
            borderTopColor: "#00eaff",
            borderRadius: "50%",
            animation: "spin-app 1s linear infinite"
          }}></div>
          <style>{`
            @keyframes spin-app {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }>
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
      </Suspense>
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