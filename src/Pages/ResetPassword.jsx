import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, selectResetLoading, selectResetError } from "../Features/Backend/UserSlice";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectResetLoading);
  const error = useSelector(selectResetError);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password", "");
  const [success, setSuccess] = React.useState(false);
  const [showPwd, setShowPwd] = React.useState(false);

  const onSubmit = async (data) => {
    const result = await dispatch(resetPassword(data));
    if (resetPassword.fulfilled.match(result)) {
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <>
      <Navbar />
      <section className="login-bg">
        <div className="login-box">
          <h2>Reset Password</h2>
          <p className="desc">Enter your 6-digit code and set a new password.</p>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="text"
              {...register("code", { required: "Code is required", minLength: { value: 6, message: "6 digits required" } })}
              placeholder="6-digit code"
              maxLength={6}
            />
            {errors.code && <span className="error-msg">{errors.code.message}</span>}
            
            <div className="pwd-field">
              <input
                type={showPwd ? "text" : "password"}
                {...register("password", { required: "New password required", minLength: { value: 6, message: "Min 6 chars" } })}
                placeholder="New password"
              />
              <span className="show-hide" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? "🙈" : "👁️"}
              </span>
            </div>
            {errors.password && <span className="error-msg">{errors.password.message}</span>}

            <div className="pwd-field">
              <input
                type={showPwd ? "text" : "password"}
                {...register("cpassword", { required: "Required", validate: value => value === password || "No match" })}
                placeholder="Confirm password"
              />
            </div>
            {errors.cpassword && <span className="error-msg">{errors.cpassword.message}</span>}
            
            {error && <span className="error-msg">{error}</span>}
            {success && <div style={{color:'#ffd043',textAlign:'center', fontSize: '0.85rem'}}>Password updated! Redirecting...</div>}

            <button className="btn-full-width-orange" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Update Password"}
            </button>
          </form>
        </div>
      </section>
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
          padding: 1.5rem 1.2rem;
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
          align-items: stretch;
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
          .login-box {
            max-width: 90vw;
            padding: 1.2rem 1rem;
          }
        }
      `}</style>
      <Footer />
    </>
  );
};

export default ResetPassword;
