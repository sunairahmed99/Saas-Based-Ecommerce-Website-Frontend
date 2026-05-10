import React from "react";

const SellerCTA = () => {
  return (
    <>
      <section className="cta-grid">
        <div className="cta-card seller-cta">
          <h3>Become a Seller</h3>
          <p>Start selling in 5 minutes with powerful tools & low commission.</p>
          <ul>
            <li>Low commission, on‑time payouts</li>
            <li>Analytics dashboard</li>
            <li>Dedicated seller support</li>
          </ul>
          <button className="btn-primary-hero">Start Selling</button>
        </div>
        <div className="cta-card app-cta">
          <h3>Download Our App</h3>
          <p>Shop faster with exclusive app‑only offers.</p>
          <div className="store-buttons">
            <div className="store-btn">Play Store</div>
            <div className="store-btn">App Store</div>
          </div>
          <div className="qr-box">
            <div className="qr-placeholder" />
            <span>Scan to download</span>
          </div>
        </div>
        <div className="cta-card why-us">
          <h3>Why Choose Us</h3>
          <div className="usp-grid">
            {[
              "Free Delivery",
              "Secure Payments",
              "24/7 Support",
              "Easy Returns",
              "Verified Sellers",
              "Fast Delivery Network",
            ].map((u) => (
              <span key={u}>{u}</span>
            ))}
          </div>
        </div>
      </section>
      <style>{`
        .cta-grid {
          width: 100%;
          padding: 2rem;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1.1fr;
          gap: 1rem;
          background: rgba(30, 32, 39, 0.5);
        }
        .cta-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          padding: 1.2rem 1.1rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .cta-card h3 {
          margin: 0 0 0.5rem 0;
          color: #ffffff;
        }
        .cta-card p {
          margin: 0 0 0.6rem 0;
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.9);
        }
        .seller-cta ul {
          list-style: none;
          padding: 0;
          margin: 0 0 0.8rem 0;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .seller-cta ul li::before {
          content: "• ";
          color: #f59e0b;
          font-weight: bold;
        }
        .btn-primary-hero {
          padding: 0.7rem 1.5rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, #f97316, #facc15);
          color: #1e293b;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
          transition: all 0.2s;
        }
        .btn-primary-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
        }
        .store-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.7rem;
        }
        .store-btn {
          flex: 1;
          padding: 0.5rem 0.6rem;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.15);
          text-align: center;
          font-size: 0.8rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          font-weight: 600;
        }
        .qr-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .qr-placeholder {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          background: repeating-linear-gradient(
              45deg,
              rgba(255, 255, 255, 0.2),
              rgba(255, 255, 255, 0.2) 4px,
              rgba(255, 255, 255, 0.1) 4px,
              rgba(255, 255, 255, 0.1) 8px
            );
        }
        .why-us .usp-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-top: 0.6rem;
          font-size: 0.85rem;
          row-gap: 1rem;
        }
        .why-us .usp-grid span {
          padding: 0.5rem 0.8rem;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          font-weight: 500;
          text-align: center;
          transition: all 0.2s ease;
          cursor: default;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .why-us .usp-grid span:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
        }
        @media (max-width: 900px) {
          .cta-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 700px) {
          .cta-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 480px) {
          .cta-grid {
            padding-inline: 1rem;
          }
        }
      `}</style>
    </>
  );
};

export default SellerCTA;

