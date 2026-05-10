import React from "react";
import "./LoaderOverlay.css";

/**
 * Full-screen blocking loader overlay for waiting states (API/redirect).
 */
const LoaderOverlay = ({ show, message = "Please wait..." }) => {
  if (!show) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="loader-spinner" />
        <div className="loader-text">{message}</div>
      </div>
    </div>
  );
};

export default LoaderOverlay;

