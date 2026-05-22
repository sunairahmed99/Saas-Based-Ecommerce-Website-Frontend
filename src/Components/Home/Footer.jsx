import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <>
      <footer className="footer">
        <div className="footer-grid">
          <div>
            <h4>Marketplace</h4>
            <p>
              Multi‑vendor eCommerce platform with trusted sellers and secure
              shopping.
            </p>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link to="/contact">Help Center</Link></li>
              <li><Link to="/orders">Orders & Shipping</Link></li>
              <li><Link to="/contact">Returns & Refunds</Link></li>
            </ul>
          </div>
          <div>
            <h4>For Sellers</h4>
            <ul>
              <li><Link to="/register" state={{ accountType: "seller" }}>Start Selling</Link></li>
              <li><Link to="/contact">Seller Policies</Link></li>
              <li><Link to="/shop">Shop Now</Link></li>
            </ul>
          </div>
          <div>
            <h4>Follow Us</h4>
            <div className="social-row">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MyShop. All rights reserved.</span>
          <div className="footer-links">
            <Link to="/">Privacy</Link>
            <Link to="/">Terms</Link>
            <Link to="/">Cookies</Link>
          </div>
        </div>
      </footer>
      <style>{`
        .footer {
          width: 100%;
          background: linear-gradient(128deg, #1e2027 0%, #334466 100%);
          border-top: 2px solid rgba(255, 255, 255, 0.1);
          padding: 2rem;
          margin-top: 1rem;
        }
        .footer-grid {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1fr;
          gap: 1.2rem;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .footer-grid h4 {
          margin: 0 0 0.4rem 0;
          color: #ffffff;
          font-weight: 600;
        }
        .footer-grid p {
          color: rgba(255, 255, 255, 0.7);
        }
        .footer-grid ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .footer-grid li {
          margin-bottom: 0.25rem;
        }
        .footer-grid li a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          transition: color 0.2s;
        }
        .footer-grid li a:hover {
          color: #fbbf24;
        }
        .social-row {
          display: flex;
          gap: 0.5rem;
          font-size: 0.95rem;
        }
        .social-row a {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
        }
        .social-row a:hover {
          background: #fbbf24;
          color: #1e293b;
          border-color: #fbbf24;
        }
        .footer-bottom {
          width: 100%;
          max-width: 1400px;
          margin: 1rem auto 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .footer-links {
          display: flex;
          gap: 0.8rem;
        }
        .footer-links a {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #fbbf24;
        }
        @media (max-width: 700px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.4rem;
          }
        }
        @media (max-width: 480px) {
          .footer {
            padding-inline: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default Footer;

