import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  updateProfile,
  changePassword,
  fetchCurrentUser,
  selectUpdateLoading,
  selectUpdateError,
  selectPasswordLoading,
  selectPasswordError,
  selectUserInitializing,
} from "../Features/Backend/UserSlice";
import { useNavigate } from "react-router-dom";
import LoaderOverlay from "../Components/LoaderOverlay";
import "./Profile.css";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const updateLoading = useSelector(selectUpdateLoading);
  const updateError = useSelector(selectUpdateError);
  const passwordLoading = useSelector(selectPasswordLoading);
  const passwordError = useSelector(selectPasswordError);
  const initializing = useSelector(selectUserInitializing);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
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

  const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const userData = user?.data;
  const isGoogleUser = userData?.authProvider === 'google';

  useEffect(() => {
    if (initializing) {
      return;
    }
    // If token exists and loginType is user but userData not yet loaded, try fetching and show loader instead of redirecting
    if (!userData && token && loginType === "user") {
      dispatch(fetchCurrentUser());
      return;
    }
    // If after initialization and no valid user, redirect to login
    if (!userData || userData.verifiedstatus !== true || userData.active === false) {
      navigate("/login");
      return;
    }
    if (userData?.name) setValue("name", userData.name);
    if (userData?.email) setValue("email", userData.email);
    if (userData?.phone) setValue("phone", userData.phone);
    if (userData?.role) setValue("role", userData.role);
  }, [userData, navigate, setValue, initializing, dispatch, token, loginType]);

  // Show loader while initializing or while we are refetching user due to token + loginType mismatch
  if (initializing || (!userData && token && loginType === "user")) {
    return <LoaderOverlay show={true} message="Loading..." />;
  }
  if (!userData || userData.verifiedstatus !== true || userData.active === false) {
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
    dispatch(updateProfile(data)).then((action) => {
      if (updateProfile.fulfilled.match(action)) {
        setProfileUpdateSuccess(true);
      }
    });
  };

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
    if (profileUpdateSuccess) {
      const timer = setTimeout(() => setProfileUpdateSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [profileUpdateSuccess]);

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
                  ) : userData?.Image ? (
                    <img src={userData.Image} alt="avatar" />
                  ) : (
                    <span className="avatar-initials">
                      {userData?.name ? userData.name.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  <span className="avatar-edit">Change</span>
                </label>
              </div>
              <div className="profile-intro">
                <h2>My Profile</h2>
                <p>Update your personal info and change your password.</p>
              </div>
            </div>

            <div className="profile-content">
              <form className="profile-form" onSubmit={handleSubmit(onSubmitProfile)}>
                <h3>Personal Details</h3>
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
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    {...register("email")}
                    disabled
                  />
                </div>
                {profileUpdateSuccess && (
                  <div className="success-msg">
                    ✅ Profile updated successfully!
                  </div>
                )}
                {updateError && <span className="error-msg">{updateError}</span>}
                <button className="btn-secondary" type="submit" disabled={updateLoading}>
                  {updateLoading ? "Saving..." : "Save Changes"}
                </button>
              </form>

              <form className="password-form" onSubmit={handleSubmitPassword(onSubmitPassword)}>
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
                    {...registerPassword("currentPassword", {
                      required: isGoogleUser ? false : "Current password is required",
                    })}
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
                        minLength: { value: 6, message: "Min 6 characters" },
                      })}
                    />
                    {passwordErrors.newPassword && (
                      <span className="error-msg">{passwordErrors.newPassword.message}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      disabled={isGoogleUser}
                      {...registerPassword("confirmPassword", {
                        required: isGoogleUser ? false : "Confirm your password",
                        validate: (value) =>
                          value === newPassword || "Passwords do not match",
                      })}
                    />
                    {passwordErrors.confirmPassword && (
                      <span className="error-msg">
                        {passwordErrors.confirmPassword.message}
                      </span>
                    )}
                  </div>
                </div>
                {passwordChangeSuccess && (
                  <div className="success-msg">
                    ✅ Password changed successfully!
                  </div>
                )}
                {passwordError && <span className="error-msg">{passwordError}</span>}
                <button className="btn-secondary" type="submit" disabled={passwordLoading || isGoogleUser}>
                  {isGoogleUser ? "Not Available for Google Accounts" : (passwordLoading ? "Updating..." : "Update Password")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Profile;


