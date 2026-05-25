import React, { lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// Helper to retry lazy loading on chunk load failures (common after new deployments)
const lazyWithRetry = (componentImport) => 
  lazy(() => 
    componentImport().catch((error) => {
      const isChunkError = 
        error.name === "ChunkLoadError" || 
        /Failed to fetch dynamically imported module/i.test(error.message) ||
        /Failed to load module script/i.test(error.message);
      
      if (isChunkError) {
        console.warn("Chunk load failed. Reloading page for latest version...", error);
        window.location.reload();
        return new Promise(() => {}); // Keep in pending state until reload
      }
      throw error;
    })
  );

// Lazy Load Pages
const Home = lazyWithRetry(() => import("./Pages/Home"));
const Shop = lazyWithRetry(() => import("./Pages/Shop"));
const ProductDetail = lazyWithRetry(() => import("./Pages/ProductDetail"));
const Cart = lazyWithRetry(() => import("./Pages/Cart"));
const Checkout = lazyWithRetry(() => import("./Pages/Checkout"));
const Login = lazyWithRetry(() => import("./Pages/Login"));
const Register = lazyWithRetry(() => import("./Pages/Register"));
const ForgotPassword = lazyWithRetry(() => import("./Pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./Pages/ResetPassword"));
const VerifyCodeScreen = lazyWithRetry(() => import("./Pages/VerifyCodeScreen"));
const Profile = lazyWithRetry(() => import("./Pages/Profile"));
const MyOrders = lazyWithRetry(() => import("./Pages/MyOrders"));
const Favorites = lazyWithRetry(() => import("./Pages/Favorites"));
const ContactUs = lazyWithRetry(() => import("./Pages/ContactUs"));
const Reviews = lazyWithRetry(() => import("./Pages/Reviews"));
const Wallet = lazyWithRetry(() => import("./Pages/Wallet"));
import GoogleCallback from "./Pages/GoogleCallback";
const Admin = lazyWithRetry(() => import("./Pages/Admin/Admin"));
const AdminChat = lazyWithRetry(() => import("./Pages/AdminChat"));
const SellerAdmin = lazyWithRetry(() => import("./Pages/SellerAdmin"));
const SellerProfile = lazyWithRetry(() => import("./Pages/SellerProfile"));
const SellerChat = lazyWithRetry(() => import("./Pages/SellerChat"));

// Regular Components
import Chatbot from "./Components/Chatbot";
import LiveChat from "./Components/LiveChat";
import { useLocation } from "react-router-dom";
import ScrollToTop from "./Components/ScrollToTop";
import { ToastContainer } from "./Components/Toast";
import SplashScreen from "./Components/SplashScreen";
import AdminProtectedRoute from "./Components/AdminComponent/AdminProtectedRoute";

const AppContent = () => {
  const location = useLocation();
  const isGoogleAuthCallback = location.pathname === "/auth/google/callback";
  const [isSplashComplete, setIsSplashComplete] = useState(isGoogleAuthCallback);
  const hideChatWidgets = 
    location.pathname.startsWith("/admin") || 
    location.pathname.startsWith("/seller-admin") || 
    location.pathname.startsWith("/seller-chat");

  if (!isSplashComplete && !isGoogleAuthCallback) {
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
          <Route path="/admin/*" element={<AdminProtectedRoute><Admin /></AdminProtectedRoute>} />
          <Route path="/admin/chat" element={<AdminProtectedRoute><AdminChat /></AdminProtectedRoute>} />

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