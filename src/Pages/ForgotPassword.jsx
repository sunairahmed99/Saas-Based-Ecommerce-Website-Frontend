import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, selectForgotLoading, selectForgotError } from "../Features/Backend/UserSlice";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectForgotLoading);
  const error = useSelector(selectForgotError);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    const result = await dispatch(forgotPassword({ email: data.email }));
    if (forgotPassword.fulfilled.match(result)) {
      navigate("/reset-password");
    }
  };

  return (
    <>
      <Navbar />
      <section className="login-bg">
        <div className="login-box">
          <h2>Forgot Password</h2>
          <p className="desc">
            Enter your registered email and we'll send you a reset code.
          </p>
          <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              placeholder="Email Address"
              autoFocus
            />
            {errors.email && <span className="error-msg">{errors.email.message}</span>}
            {error && <span className="error-msg">{error}</span>}
            <button className="btn-full-width-orange" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : "Send Reset Code"}
            </button>
            <button className="btn-back-link" type="button" onClick={() => navigate("/login")}>
              Back to Login
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
          text-align: center;
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

export default ForgotPassword;
