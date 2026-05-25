import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, verifyLoginCode, selectLoginLoading, selectLoginError, selectUser, selectVerifyLoading, selectVerifyError } from "../Features/Backend/UserSlice";
import { loginSeller, verifySellerLoginCode, selectSellerLoginLoading, selectSellerLoginError, selectSeller, selectSellerVerifyLoading, selectSellerVerifyError } from "../Features/Backend/SellerSlice";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import LoaderOverlay from "../Components/LoaderOverlay";
import { API_BASE_URL } from '../config';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loadingUser = useSelector(selectLoginLoading);
  const loginError = useSelector(selectLoginError);
  const user = useSelector(selectUser);

  const loadingSeller = useSelector(selectSellerLoginLoading);
  const sellerLoginError = useSelector(selectSellerLoginError);
  const seller = useSelector(selectSeller);
  const verifyLoadingUser = useSelector(selectVerifyLoading);
  const verifyErrorUser = useSelector(selectVerifyError);
  const verifyLoadingSeller = useSelector(selectSellerVerifyLoading);
  const verifyErrorSeller = useSelector(selectSellerVerifyError);

  const [accountType, setAccountType] = React.useState("customer");
  const [showPwd, setShowPwd] = React.useState(false);
  const [verificationStep, setVerificationStep] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [showInactiveMsg, setShowInactiveMsg] = React.useState(false);
  const [googleLoginLoading, setGoogleLoginLoading] = React.useState(false);
  const [showSellerGoogleAlert, setShowSellerGoogleAlert] = React.useState(false);
  const inactiveTimerRef = React.useRef();
  const loginTriedRef = React.useRef(false);
  const showSellerOverlay = accountType === "seller" && (loadingSeller || verifyLoadingSeller);
  const showUserOverlay = accountType === "customer" && (loadingUser || verifyLoadingUser);

  const handleInactiveSeller = React.useCallback(() => {
    setShowInactiveMsg(true);
    if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    inactiveTimerRef.current = setTimeout(() => {
      setShowInactiveMsg(false);
    }, 5000);
  }, []);

  React.useEffect(() => {
    return () => {
      if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (user?.data) {
      const redirectTo = user.data.role === "admin" ? "/admin" : "/";
      navigate(redirectTo);
      return;
    }
    if (
      accountType === "seller" &&
      loginTriedRef.current &&
      seller &&
      (seller.active === false || (seller.data && seller.data.active === false))
    ) {
      handleInactiveSeller();
      loginTriedRef.current = false;
      return;
    }
    if (accountType === "seller" && seller &&
      (seller.active === true || (seller.data && seller.data.active === true))) {
      navigate("/");
    }
  }, [user, seller, navigate, accountType, handleInactiveSeller]);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    if (accountType === "seller") {
      loginTriedRef.current = true;
      setShowInactiveMsg(false);
      if (inactiveTimerRef.current) clearTimeout(inactiveTimerRef.current);
      dispatch(loginSeller(data)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled' && result.payload.requiresVerification) {
          setLoginEmail(data.email);
          setVerificationStep(true);
        }
      });
    } else {
      dispatch(loginUser(data)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          if (result.payload.requiresVerification) {
            setLoginEmail(data.email);
            setVerificationStep(true);
          } else {
            navigate(result.payload.redirectTo || '/');
          }
        }
      });
    }
  };

  const onVerifySubmit = (data) => {
    const verifyData = { email: loginEmail, code: data.code };
    if (accountType === "seller") {
      dispatch(verifySellerLoginCode(verifyData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') navigate(result.payload.redirectTo || '/');
      });
    } else {
      dispatch(verifyLoginCode(verifyData)).then((result) => {
        if (result.meta.requestStatus === 'fulfilled') {
          const redirect =
            result.payload?.redirectTo ||
            (result.payload?.data?.role === 'admin' ? '/admin' : '/');
          navigate(redirect);
        }
      });
    }
  };

  const handleGoogleLogin = async () => {
    if (accountType === 'seller') {
      setShowSellerGoogleAlert(true);
      return;
    }
    try {
      setGoogleLoginLoading(true);
      const frontendUrl = encodeURIComponent(window.location.origin);
      window.location.href = `${API_BASE_URL}/user/auth/google?frontend_url=${frontendUrl}`;
    } catch (error) {
      console.error('Google login error:', error);
      setGoogleLoginLoading(false);
    }
  };

  return (
    <>
      <LoaderOverlay show={showSellerOverlay} message="Seller login in progress..." />
      <LoaderOverlay show={showUserOverlay} message="Login in progress..." />
      <Navbar/>
      <section className="login-bg">
        <div className="login-box">
          <h2>{verificationStep ? "Verify Login" : "Sign In"}</h2>
          {!verificationStep && (
            <div className="account-toggle">
              <button
                type="button"
                className={accountType === "customer" ? "toggle-btn active" : "toggle-btn"}
                onClick={() => setAccountType("customer")}
              >
                User
              </button>
              <button
                type="button"
                className={accountType === "seller" ? "toggle-btn active" : "toggle-btn"}
                onClick={() => setAccountType("seller")}
              >
                Seller
              </button>
            </div>
          )}
          {!verificationStep ? (
            <form className="login-form" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
              <input
                type="email"
                placeholder="Email Address"
                {...register("email", { required: "Email is required" })}
                autoFocus
                autoComplete="off"
              />
              {errors.email && <span className="error-msg">{errors.email.message}</span>}
              <div className="pwd-field">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  {...register("password", { required: "Password is required" })}
                  autoComplete="new-password"
                />
                <span className="show-hide" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? "🙈" : "👁️"}
                </span>
              </div>
              {errors.password && <span className="error-msg">{errors.password.message}</span>}
              {(loginError || sellerLoginError) && (
                <span className="error-msg">{accountType === "customer" ? loginError : sellerLoginError}</span>
              )}
              {accountType === "seller" && showInactiveMsg && (
                <span className="error-msg">Account not active. Please wait.</span>
              )}
              <button
              className="btn-full-width-orange"
              type="submit"
                disabled={accountType === "seller" ? loadingSeller : loadingUser}
              >
                {accountType === "seller" 
                  ? (loadingSeller ? <span className="spinner" /> : "Login") 
                  : (loadingUser ? <span className="spinner" /> : "Login")}
              </button>
              <button className="btn-google" type="button" onClick={handleGoogleLogin} disabled={googleLoginLoading}>
                {googleLoginLoading ? <span className="spinner" /> : <span className="google-icon">G</span>}
                {googleLoginLoading ? 'Connecting...' : 'Login with Google'}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleSubmit(onVerifySubmit)} autoComplete="off">
              <p className="verification-msg">Code sent to: <strong>{loginEmail}</strong></p>
              <input
                type="text"
                placeholder="6-digit code"
                {...register("code", { required: "Code is required", pattern: { value: /^\d{6}$/, message: "Invalid code" } })}
                autoFocus
                maxLength="6"
              />
              {errors.code && <span className="error-msg">{errors.code.message}</span>}
              {(verifyErrorUser || verifyErrorSeller) && (
                <span className="error-msg">{accountType === "customer" ? verifyErrorUser : verifyErrorSeller}</span>
              )}
              <button
                className="btn-primary"
                type="submit"
                disabled={accountType === "seller" ? verifyLoadingSeller : verifyLoadingUser}
              >
                {accountType === "seller"
                  ? (verifyLoadingSeller ? <span className="spinner" /> : "Verify & Login")
                  : (verifyLoadingUser ? <span className="spinner" /> : "Verify & Login")}
              </button>
              <button className="btn-back" type="button" onClick={() => { setVerificationStep(false); setLoginEmail(""); }}>
                Back to Login
              </button>
            </form>
          )}
          {!verificationStep && (
            <div className="login-links">
              <button type="button" className="link-btn" onClick={() => navigate("/forgot-password")}>Forgot password?</button>
              {" | "}
              <button type="button" className="link-btn" onClick={() => navigate("/register")}>Create account</button>
            </div>
          )}
        </div>
      </section>

      {/* STYLES */}
      <style>{`
        .login-bg {
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          min-height: 80vh;
          padding: 40px 15px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .login-box {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 1.5rem 1rem;
          backdrop-filter: blur(10px);
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .login-box h2 {
          color: #ffd043;
          font-size: 1.1rem;
          margin-bottom: 0.8rem;
          text-align: center;
          width: 100%;
        }
        .account-toggle {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          width: 100%;
        }
        .toggle-btn {
          padding: 0.2rem 0.8rem;
          font-size: 0.75rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: transparent;
          color: white;
          cursor: pointer;
        }
        .toggle-btn.active {
          background: #ffd043;
          color: #1e2027;
          border-color: #ffd043;
        }
        .login-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .login-form input {
          width: 100%;
          padding: 0.6rem 0.8rem;
          border-radius: 6px;
          border: none;
          font-size: 0.85rem;
          background: #f8fafd;
          color: #333;
        }
        .login-form input::placeholder {
          color: #888;
          font-size: 0.8rem;
        }
        .pwd-field {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .pwd-field input {
          padding-right: 2.2rem;
        }
        .show-hide {
          position: absolute;
          right: 0.6rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn-full-width-orange {
          width: 100% !important;
          min-width: 100% !important;
          padding: 0.7rem;
          background: linear-gradient(135deg, #f97316, #ff8c00);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch !important;
        }
        .btn-google {
          width: 100% !important;
          padding: 0.65rem;
          background: white;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        .google-icon {
          color: #4285F4;
          font-weight: bold;
        }
        .login-links {
          margin-top: 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          width: 100%;
        }
        .link-btn {
          background: transparent;
          border: none;
          color: #ffd043;
          text-decoration: underline;
          cursor: pointer;
          font-size: 0.75rem;
        }
        .error-msg {
          color: #ff4d4f;
          font-size: 0.7rem;
        }
        .verification-msg {
          color: white;
          font-size: 0.8rem;
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .btn-back {
          background: transparent;
          color: #ffd043;
          border: 1px solid #ffd043;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          cursor: pointer;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .login-box {
            max-width: 290px;
            padding: 1.2rem 0.8rem;
          }
          .login-box h2 { font-size: 1rem; }
          .login-form input { font-size: 0.8rem; }
          .btn-primary, .btn-google { font-size: 0.8rem; }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default Login;
