import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { verifyCode, selectVerifyLoading, selectVerifyError } from "../Features/Backend/UserSlice";
import { verifySellerCode, selectSellerVerifyLoading, selectSellerVerifyError, resetSellerRegistration } from "../Features/Backend/SellerSlice";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import { resetUserRegistration } from "../Features/Backend/UserSlice";
import LoaderOverlay from "../Components/LoaderOverlay";

const VerifyCodeScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const accountType = location.state?.accountType || "customer";

  const userLoading = useSelector(selectVerifyLoading);
  const userError = useSelector(selectVerifyError);
  const sellerLoading = useSelector(selectSellerVerifyLoading);
  const sellerError = useSelector(selectSellerVerifyError);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [success, setSuccess] = React.useState(false);
  const showSellerOverlay = accountType === "seller" && sellerLoading;

  const onSubmit = async (data) => {
    if (accountType === "seller") {
      const result = await dispatch(verifySellerCode(data));
      if (verifySellerCode.fulfilled.match(result)) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 800);
      }
    } else {
      const result = await dispatch(verifyCode(data));
      if (verifyCode.fulfilled.match(result)) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 800);
      }
    }
  };

  return (
    <>
      <LoaderOverlay show={showSellerOverlay} message="Verifying seller account..." />
      <Navbar />
      <section className="login-bg">
        <div className="login-box">
          <h2>Verify Account</h2>
          <p className="desc">Enter the code sent to your email to complete registration.</p>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              placeholder="Verification Code"
              {...register("code", { required: "Code required" })}
            />
            {errors.code && <span className="error-msg">{errors.code.message}</span>}
            {(userError || sellerError) && <span className="error-msg">{accountType === "customer" ? userError : sellerError}</span>}
            {success && <div style={{color:'#ffd043',textAlign:'center', fontSize: '0.85rem'}}>Account verified!</div>}
            
            <button className="btn-full-width-orange" type="submit" disabled={accountType === "seller" ? sellerLoading : userLoading}>
              {accountType === "seller" ? (sellerLoading ? <span className="spinner" /> : "Verify Now") : (userLoading ? <span className="spinner" /> : "Verify Now")}
            </button>
            
            <button
              className="btn-back-link"
              type="button"
              onClick={() => {
                if (accountType === "seller") dispatch(resetSellerRegistration());
                else dispatch(resetUserRegistration());
                navigate("/register", { state: { accountType } });
              }}
            >
              Back to Register
            </button>
          </form>
        </div>
      </section>
      <style>{`
        .login-bg {
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          min-height: 60vh;
          padding: 40px 15px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .login-box {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          padding: 1.5rem 1.2rem;
          backdrop-filter: blur(10px);
          width: 100%;
          max-width: 320px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .login-box h2 {
          color: #ffd043;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }
        .desc {
          color: white;
          font-size: 0.75rem;
          text-align: center;
          margin-bottom: 1rem;
          opacity: 0.8;
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
          text-align: center;
          letter-spacing: 2px;
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
        .btn-back-link {
          background: transparent;
          border: none;
          color: #ffd043;
          text-decoration: underline;
          cursor: pointer;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        .error-msg {
          color: #ff4d4f;
          font-size: 0.75rem;
          text-align: center;
        }
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 480px) {
          .login-bg {
            padding: 20px 10px;
            width: 100%;
            overflow-x: hidden;
          }
          .login-box {
            max-width: 100%;
            width: 100%;
            padding: 1.2rem 0.8rem;
          }
          .login-box h2 {
            font-size: 1.1rem;
          }
          .login-form input {
             letter-spacing: 1px;
             font-size: 0.85rem;
             width: 100%;
             padding: 0.6rem 0.5rem;
          }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default VerifyCodeScreen;
