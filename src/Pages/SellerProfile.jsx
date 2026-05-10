import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSeller,
  updateProfile,
  selectUpdateLoading,
  selectUpdateError,
  selectPasswordLoading,
  selectPasswordError,
  changePassword,
  selectSellerInitializing,
} from "../Features/Backend/SellerSlice";
import { useNavigate } from "react-router-dom";
import LoaderOverlay from "../Components/LoaderOverlay";

const SellerProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const seller = useSelector(selectSeller);
  const updateLoading = useSelector(selectUpdateLoading);
  const updateError = useSelector(selectUpdateError);
  const passwordLoading = useSelector(selectPasswordLoading);
  const passwordError = useSelector(selectPasswordError);
  const initializing = useSelector(selectSellerInitializing);
  const sellerData = seller?.data;
  const isGoogleUser = sellerData?.authProvider === 'google';
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const { 
    register: registerPassword, 
    handleSubmit: handleSubmitPassword, 
    watch: watchPassword, 
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm();
  const newPassword = watchPassword("newPassword", "");

  useEffect(() => {
    if (initializing) {
      return;
    }
    if (!sellerData || sellerData.verifiedstatus !== true || sellerData.active !== true) {
      navigate("/login");
      return;
    }
    if (sellerData?.name) setValue("name", sellerData.name);
    if (sellerData?.email) setValue("email", sellerData.email);
    if (sellerData?.phone) setValue("phone", sellerData.phone);
    if (sellerData?.gender) setValue("gender", sellerData.gender);
    if (sellerData?.shopName) setValue("shopName", sellerData.shopName);
    if (sellerData?.shopDescription) setValue("shopDescription", sellerData.shopDescription);
    if (sellerData?.shopAddress) setValue("shopAddress", sellerData.shopAddress);
  }, [sellerData, navigate, setValue, initializing]);

  // Handle successful profile update
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000); // Hide success message after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  if (initializing) {
    return <LoaderOverlay show={true} message="Loading..." />;
  }
  if (!sellerData || sellerData.verifiedstatus !== true || sellerData.active !== true) {
    return null;
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const onSubmitProfile = (data) => {
    const newData = { ...data };
    if (data.image && data.image.length > 0) newData.image = data.image[0];
    else delete newData.image;
    dispatch(updateProfile(newData));
  };

  // Listen for successful profile update
  useEffect(() => {
    if (!updateLoading && !updateError && sellerData) {
      // If we just finished loading and there's no error, it means update was successful
      setUpdateSuccess(true);
    }
  }, [updateLoading, updateError, sellerData]);

  const onSubmitPassword = (data) => {
    dispatch(
      changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    ).then((action) => {
      if (changePassword.fulfilled.match(action)) {
        resetPasswordForm();
        setPasswordChangeSuccess(true);
      }
    });
  };

  // Clear success messages after 3 seconds
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => setUpdateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess]);

  useEffect(() => {
    if (passwordChangeSuccess) {
      const timer = setTimeout(() => setPasswordChangeSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [passwordChangeSuccess]);

  return (
    <>
      <Navbar />
      <section className="profile-bg">
        <div className="profile-shell">
          <div className="profile-card">
            <div className="profile-header">
              <div className="avatar-wrapper">
                <div className="avatar-ring" />
                <label className="avatar">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" />
                  ) : sellerData?.image ? (
                    <img src={sellerData.image} alt="avatar" />
                  ) : (
                    <span className="avatar-initials">
                      {sellerData?.name ? sellerData.name.charAt(0).toUpperCase() : "S"}
                    </span>
                  )}
                  <input type="file" accept="image/*" {...register("image")} onChange={handleAvatarChange} />
                  <span className="avatar-edit">Change</span>
                </label>
              </div>
              <div className="profile-intro">
                <h2>Seller Profile</h2>
                <p>Update your seller info. Email cannot be changed.</p>
              </div>
            </div>

            <div className="profile-content">
              <form className="profile-form" onSubmit={handleSubmit(onSubmitProfile)}>
                <h3>Personal / Shop Details</h3>
                <div className="two-fields-row">
                  <div className="field">
                    <label>Name</label>
                    <input
                      type="text"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && <span className="error-msg">{errors.name.message}</span>}
                  </div>
                  <div className="field">
                    <label>Phone</label>
                    <input
                      type="tel"
                      {...register("phone", {
                        required: "Phone is required",
                        minLength: { value: 10, message: "At least 10 digits" },
                      })}
                    />
                    {errors.phone && <span className="error-msg">{errors.phone.message}</span>}
                  </div>
                </div>
                <div className="two-fields-row">
                  <div className="field">
                    <label>Gender</label>
                    <select {...register("gender")}> 
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" {...register("email")} disabled />
                  </div>
                </div>
                <div className="two-fields-row">
                  <div className="field">
                    <label>Shop Name</label>
                    <input
                      type="text"
                      {...register("shopName", { required: "Shop name is required" })}
                    />
                    {errors.shopName && <span className="error-msg">{errors.shopName.message}</span>}
                  </div>
                  <div className="field">
                    <label>Shop Address</label>
                    <input
                      type="text"
                      {...register("shopAddress", { required: "Shop address required" })}
                    />
                    {errors.shopAddress && <span className="error-msg">{errors.shopAddress.message}</span>}
                  </div>
                </div>
                <div className="field">
                  <label>Shop Description</label>
                  <textarea style={{resize:'vertical',minHeight:48}} {...register("shopDescription")}/>
                </div>
                {updateSuccess && <span className="success-msg">Profile updated successfully!</span>}
                {updateError && <span className="error-msg">{updateError}</span>}
                <button className="btn-primary" type="submit" disabled={updateLoading}>
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>
              <form className="password-form" onSubmit={handleSubmitPassword(onSubmitPassword)} >
                <h3>Change Password</h3>
                {isGoogleUser && (
                  <div className="google-notice">
                    <span className="google-icon">🔒</span>
                    Password change is not available for Google accounts. Please manage your password through your Google account settings.
                  </div>
                )}
                <div className="field">
                  <label>Current Password</label>
                  <input
                    type="password"
                    disabled={isGoogleUser}
                    {...registerPassword("currentPassword", { required: isGoogleUser ? false : "Current password is required" })}
                  />
                  {passwordErrors.currentPassword && (
                    <span className="error-msg">{passwordErrors.currentPassword.message}</span>
                  )}
                </div>
                <div className="two-fields-row">
                  <div className="field">
                    <label>New Password</label>
                    <input
                      type="password"
                      disabled={isGoogleUser}
                      {...registerPassword("newPassword", {
                        required: isGoogleUser ? false : "New password is required",
                        minLength: { value: 6, message: "Min 6 characters" }
                      })}
                    />
                    {passwordErrors.newPassword && (
                      <span className="error-msg">{passwordErrors.newPassword.message}</span>
                    )}
                  </div>
                  <div className="field" >
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      disabled={isGoogleUser}
                      {...registerPassword("confirmPassword", {
                        required: isGoogleUser ? false : "Confirm your password",
                        validate: (value) => value === newPassword || "Passwords do not match"
                      })}
                    />
                    {passwordErrors.confirmPassword && (
                      <span className="error-msg">{passwordErrors.confirmPassword.message}</span>
                    )}
                  </div>
                </div>
                {passwordChangeSuccess && (
                  <div className="success-alert">
                    ✅ Password changed successfully!
                  </div>
                )}
                {passwordError && <span className="error-msg">{passwordError}</span>}
                <button className="btn-primary" type="submit" disabled={passwordLoading || isGoogleUser}>
                  {isGoogleUser ? "Not Available for Google Accounts" : (passwordLoading ? "Updating..." : "Update Password")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <style jsx>{`
        .profile-bg {
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 75px 1rem 3rem 1rem;
        }
        .profile-shell {
          width: 100%;
          max-width: 1100px;
        }
        .profile-card {
          background: rgba(30, 39, 64, 0.91);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          padding: 2rem;
          color: #f7f7f7;
          overflow: hidden;
          position: relative;
        }
        .profile-card::before {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, #ffd04355, transparent 70%);
          top: -80px;
          left: -40px;
          opacity: 0.7;
          filter: blur(1px);
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: 1.4rem;
          position: relative;
          z-index: 1;
        }
        .avatar-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
        }
        .avatar-ring {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: conic-gradient(#ffd043, #ff6b6b, #4facfe, #ffd043);
          opacity: 0.95;
          filter: blur(2px);
          animation: rotateRing 12s linear infinite;
        }
        @keyframes rotateRing {
          to {
            transform: rotate(360deg);
          }
        }
        .avatar {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #141e30;
          box-shadow: 0 6px 20px #0008;
          cursor: pointer;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-initials {
          font-size: 1.6rem;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .avatar input {
          display: none;
        }
        .avatar-edit {
          position: absolute;
          bottom: 0;
          width: 100%;
          text-align: center;
          font-size: 0.7rem;
          padding: 0.2rem 0.3rem;
          background: linear-gradient(180deg, transparent, #000000aa);
        }
        .profile-intro h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
        }
        .profile-intro p {
          margin: 0;
          font-size: 0.9rem;
          color: #f1f1f1cc;
        }
        .profile-content {
          margin-top: 1.5rem;
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 1.4rem;
          position: relative;
          z-index: 1;
        }
        .profile-form, .password-form {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.8rem;
          box-shadow: 0 8px 35px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .profile-form h3, .password-form h3 {
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          color: #00eaff;
          font-weight: 700;
        }
        .field {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.8rem;
        }
        .field label {
          font-size: 0.8rem;
          margin-bottom: 0.4rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #e5e7eb;
          font-weight: 600;
        }
        .field input, .field select, .field textarea {
          padding: 0.8rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          outline: none;
          font-size: 0.95rem;
          background: rgba(255, 255, 255, 0.05);
          color: #f7f7f7;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .field input:focus, .field select:focus, .field textarea:focus {
          border-color: #00eaff;
          box-shadow: 0 0 10px rgba(0, 234, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
        }
        .field input:disabled, .field select:disabled, .field textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.2);
        }
        .two-fields-row {
          display: flex;
          gap: 0.8rem;
        }
        .two-fields-row .field {
          flex: 1 1 50%;
        }
        .btn-primary {
          padding: 0.8rem 1.2rem;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          margin-top: 0.4rem;
          transition: transform 0.13s, box-shadow 0.13s, opacity 0.2s;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249,115,22,0.4);
        }
        .btn-primary:active {
          transform: translateY(1px) scale(0.98);
          box-shadow: 0 3px 10px #0008;
        }
        .btn-primary[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .error-msg {
          color: #ff6b6b;
          font-size: 0.8rem;
          margin-top: 0.2rem;
        }
        .success-msg {
          color: #10b981;
          font-size: 0.9rem;
          margin-top: 0.2rem;
          font-weight: 600;
        }
        .success-alert {
          background: #10b981;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 1rem;
          border: 1px solid #059669;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .google-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .google-notice .google-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .password-form input:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 900px) {
          .profile-content {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .profile-card {
            padding: 1.4rem 1.05rem;
          }
          .profile-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .two-fields-row {
            flex-direction: column;
            gap: 0;
          }
          .two-fields-row .field {
            flex: 1 1 100%;
            margin-bottom: 0.8rem;
          }
          .profile-form  {
            padding: 1rem 0.9rem;
          }
        }
      `}</style>
    </>
  );
};

export default SellerProfile; // Uses same CSS as Profile.jsx
