import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { useForm } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUser,
  fetchCurrentUser,
  selectUserInitializing,
} from "../Features/Backend/UserSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { useNavigate } from "react-router-dom";
import LoaderOverlay from "../Components/LoaderOverlay";
import "./Profile.css";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const initializing = useSelector(selectUserInitializing);
  const queryClient = useQueryClient();

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const loginType = typeof window !== "undefined" ? localStorage.getItem("loginType") : null;
  const token = typeof window !== "undefined" ? localStorage.getItem("token")?.replace(/^Bearer\s+/i, "") : null;

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', token],
    queryFn: async () => {
      const res = await axios.get(`${API_BASE_URL}/user/userverify`, {
        headers: { auth_token: token }
      });
      return res.data?.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (formData) => {
      const form = new FormData();
      if (formData.name) form.append('name', formData.name);
      if (formData.phone) form.append('phone', formData.phone);
      if (formData.gender) form.append('gender', formData.gender);
      if (formData.image) form.append('image', formData.image);

      const res = await axios.patch(`${API_BASE_URL}/user/editprofile`, form, {
        headers: {
          auth_token: token,
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data?.data;
    },
    onSuccess: () => {
      setProfileUpdateSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['user-profile', token] });
      dispatch(fetchCurrentUser());
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }) => {
      const res = await axios.post(`${API_BASE_URL}/user/changepassword`, { currentPassword, newPassword }, {
        headers: { auth_token: token }
      });
      return res.data;
    },
    onSuccess: () => {
      resetPasswordForm();
      setPasswordChangeSuccess(true);
    }
  });

  const updateLoading = updateProfileMutation.isPending;
  const updateError = updateProfileMutation.error?.response?.data?.message || updateProfileMutation.error?.message || null;
  const passwordLoading = changePasswordMutation.isPending;
  const passwordError = changePasswordMutation.error?.response?.data?.message || changePasswordMutation.error?.message || null;

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

  const userData = user?.data;
  const isGoogleUser = userData?.authProvider === 'google';

  useEffect(() => {
    if (initializing) {
      return;
    }
    // If token exists and loginType is user but userData not yet loaded, try fetching and show loader instead of redirecting
    if (!userData && token && (loginType === "user" || loginType === "google")) {
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
  if (initializing || (!userData && token && (loginType === "user" || loginType === "google"))) {
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
    // If a new avatar file was selected, we need to pass it to the mutation
    const avatarInput = document.querySelector('input[type="file"]');
    const imageFile = avatarInput?.files?.[0];
    updateProfileMutation.mutate({
      name: data.name,
      phone: data.phone,
      image: imageFile
    });
  };

  const onSubmitPassword = (data) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
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


