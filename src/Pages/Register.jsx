import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createUsers, selectUsersLoading, selectCreatedUser, selectUser, selectUsersError } from "../Features/Backend/UserSlice";
import { createSeller, selectCreatedSeller, selectSellersError, selectSellersLoading } from "../Features/Backend/SellerSlice";
import { useNavigate } from "react-router-dom";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import LoaderOverlay from "../Components/LoaderOverlay";

const Register = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const location = useLocation();
  const initialAccountType = location.state?.accountType === "seller" ? "seller" : "customer";
  const [accountType, setAccountType] = useState(initialAccountType);
  const dispatch = useDispatch();
  const loading = useSelector(selectUsersLoading);
  const sellerLoading = useSelector(selectSellersLoading);
  const navigate = useNavigate();
  const createdUser = useSelector(selectCreatedUser);
  const user = useSelector(selectUser);
  const apiError = useSelector(selectUsersError);
  const createdSeller = useSelector(selectCreatedSeller);
  const sellerError = useSelector(selectSellersError);
  const isSubmitting = accountType === "seller" ? sellerLoading : loading;

  React.useEffect(() => {
    if (user) {
      navigate("/");
      return;
    }
    if (createdUser) {
      navigate("/verifycode", { state: { accountType: "customer" } });
    }
    if (createdSeller) {
      navigate("/verifycode", { state: { accountType: "seller" } });
    }
  }, [user, createdUser, createdSeller, navigate]);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const password = watch("password", "");

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    formData.append("gender", data.gender);
    formData.append("password", data.password);
    formData.append("conformpassword", data.confirmPassword);

    if (data.image && data.image.length > 0) {
      formData.append("image", data.image[0]);
    }

    if (accountType === "seller") {
      formData.append("shopName", data.shopName);
      formData.append("shopAddress", data.shopAddress);
      formData.append("shopDescription", data.shopDescription);
      dispatch(createSeller(formData));
    } else {
      dispatch(createUsers(formData));
    }
    reset();
  };

  return (
    <>
      <LoaderOverlay show={accountType === "seller" && sellerLoading} message="Creating seller account..." />
      <Navbar />
      <section className="login-bg">
        <div className="login-box">
          <h2 className="register-title">{accountType === "seller" ? "Seller Registration" : "Create Account"}</h2>
          <div className="account-toggle">
            <button
              type="button"
              className={accountType === "customer" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => setAccountType("customer")}
            >
              Customer
            </button>
            <button
              type="button"
              className={accountType === "seller" ? "toggle-btn active" : "toggle-btn"}
              onClick={() => setAccountType("seller")}
            >
              Seller
            </button>
          </div>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" autoComplete="off">
            <div className="two-fields-row">
              <div className="field-wrapper">
                <input type="text" placeholder="Name" {...register("name", { required: "Name is required" })} />
                {errors.name && <span className="error-msg">{errors.name.message}</span>}
              </div>
              <div className="field-wrapper">
                <input type="email" placeholder="Email" {...register("email", { required: "Required" })} />
                {errors.email && <span className="error-msg">{errors.email.message}</span>}
              </div>
            </div>
            <div className="two-fields-row">
              <div className="field-wrapper">
                <input type="tel" placeholder="Phone" {...register("phone", { required: "Required" })} />
                {errors.phone && <span className="error-msg">{errors.phone.message}</span>}
              </div>
              <div className="field-wrapper">
                <select {...register("gender", { required: "Required" })}>
                  <option value="">Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <span className="error-msg">{errors.gender.message}</span>}
              </div>
            </div>
            <div className="two-fields-row">
              <div className="field-wrapper">
                <div className="pwd-field">
                  <input type={showPwd ? "text" : "password"} placeholder="Password" {...register("password", { required: "Required" })} />
                  <span className="show-hide" onClick={() => setShowPwd(v => !v)}>{showPwd ? "🙈" : "👁️"}</span>
                </div>
                {errors.password && <span className="error-msg">{errors.password.message}</span>}
              </div>
              <div className="field-wrapper">
                <div className="pwd-field">
                  <input type={showConfirmPwd ? "text" : "password"} placeholder="Confirm" {...register("confirmPassword", { required: "Required" })} />
                  <span className="show-hide" onClick={() => setShowConfirmPwd(v => !v)}>{showConfirmPwd ? "🙈" : "👁️"}</span>
                </div>
                {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword.message}</span>}
              </div>
            </div>
            <input type="file" accept="image/*" {...register("image", { required: "Image required" })} className="file-input" />
            {errors.image && <span className="error-msg">{errors.image.message}</span>}
            
            {accountType === "seller" && (
              <>
                <div className="two-fields-row">
                  <div className="field-wrapper">
                    <input type="text" placeholder="Shop Name" {...register("shopName", { required: "Required" })} />
                  </div>
                  <div className="field-wrapper">
                    <input type="text" placeholder="Shop Address" {...register("shopAddress", { required: "Required" })} />
                  </div>
                </div>
                <input type="text" placeholder="Shop Description" {...register("shopDescription", { required: "Required" })} />
              </>
            )}

            {(apiError || sellerError) && <span className="error-msg">{accountType === "customer" ? apiError : sellerError}</span>}

            <button className="btn-register-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" /> : 'Register Now'}
            </button>
          </form>
          <div className="login-links">
            Already have an account? <Link to="/login">Login</Link>
          </div>
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
          max-width: 380px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .register-title {
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
          gap: 0.7rem;
          align-items: stretch;
        }
        .login-form input, .login-form select {
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
        .file-input {
          padding: 0.4rem !important;
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          font-size: 0.75rem !important;
          border: 1px dashed rgba(255, 255, 255, 0.3) !important;
        }
        .two-fields-row {
          display: flex;
          gap: 0.6rem;
          width: 100%;
        }
        .field-wrapper {
          flex: 1;
          min-width: 0;
        }
        .pwd-field {
          position: relative;
          width: 100%;
        }
        .pwd-field input {
          padding-right: 2.2rem;
        }
        .show-hide {
          position: absolute;
          right: 0.6rem;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 1rem;
        }
        .btn-register-submit {
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
        .login-links {
          margin-top: 1rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          width: 100%;
        }
        .login-links a {
          color: #ffd043;
          font-weight: 600;
          text-decoration: underline;
        }
        .error-msg {
          color: #ff4d4f;
          font-size: 0.7rem;
          margin-top: 2px;
          width: 100%;
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
          .login-box {
            max-width: 92vw;
            padding: 1.2rem 0.8rem;
          }
          .two-fields-row {
            flex-direction: column;
            gap: 0.7rem;
          }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default Register;
