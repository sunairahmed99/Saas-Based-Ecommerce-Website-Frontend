import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  selectCartItems,
  selectTotalCartValue,
  getCartProductId,
} from "../Features/Backend/CartSlice";

const getProductPrice = (product) => {
  if (!product) return 0;
  if (product.prodisprice > 0) return product.prodisprice;
  if (product.pactualprice > 0) return product.pactualprice;
  return product.pprice || 0;
};
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaWallet, FaCreditCard, FaExclamationCircle } from "react-icons/fa";
import getStripe from "../utils/stripe";
import StripeCheckoutForm from "../Components/StripeCheckoutForm";
import { Elements } from "../utils/stripe-mock.jsx";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Home/Footer";
import { API_BASE_URL } from '../config';
import { getAuthToken, getAuthHeaders } from '../utils/auth';
import { useQueryClient } from "@tanstack/react-query";
import "./Checkout.css";

const API_BASE = `${API_BASE_URL}`;

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { user } = useSelector((state) => state.users);
  const userData = user?.data || user;
  const cartItems = useSelector(selectCartItems) || [];

  const [addressLoading, setAddressLoading] = useState(false);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    label: "Home"
  });
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const token = getAuthToken();
  const authHeaders = useMemo(
    () => ({
      headers: getAuthHeaders(),
      timeout: 20000,
    }),
    [token]
  );

  // Calculate totals
  const subtotal = useSelector(selectTotalCartValue) || (cartItems || []).reduce(
    (sum, item) => sum + (item.totalPrice || (item.price || 0) * (item.quantity || 0)),
    0
  );
  const totalPayable = Math.max(subtotal - couponDiscount, 0);

  const buildCheckoutItems = () =>
    cartItems.map((item) => {
      const product =
        typeof item.productId === "object" ? item.productId : {};
      const productId = getCartProductId(item);
      const unitPrice = item.price ?? getProductPrice(product);
      return {
        productId,
        name: product.pname || "Product",
        quantity: item.quantity,
        price: unitPrice,
        total: item.totalPrice ?? unitPrice * (item.quantity || 1),
        color: item.color || null,
        size: item.size || null,
        sellerId:
          product.sellerid?._id ||
          product.sellerid ||
          product.sellerId,
      };
    });

  // Load addresses
  useEffect(() => {
    const loadAddresses = async () => {
      if (!userData) return;
      try {
        setAddressLoading(true);
        const res = await axios.get(`${API_BASE}/address`, authHeaders);
        setAddresses(res.data?.data || []);
        if (res.data?.data?.length > 0) {
          setSelectedAddressId(res.data.data[0]._id);
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
      } finally {
        setAddressLoading(false);
      }
    };
    loadAddresses();
  }, [userData, authHeaders]);

  // Handle address creation
  const handleCreateAddress = async () => {
    try {
      setCreatingAddress(true);
      setErrorMsg("");

      // Validate required fields
      const required = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'];
      const missing = required.filter(key => !newAddress[key]?.trim());

      if (missing.length > 0) {
        setErrorMsg(`Please fill in: ${missing.join(', ')}`);
        return;
      }

      const res = await axios.post(`${API_BASE}/address`, newAddress, authHeaders);
      const createdAddress = res.data.data;

      // Add to addresses list and select it
      setAddresses(prev => [...prev, createdAddress]);
      setSelectedAddressId(createdAddress._id);

      // Reset form
      setNewAddress({
        fullName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        label: "Home"
      });
      setShowNewAddressForm(false);

    } catch (error) {
      console.error('Error creating address:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to create address');
    } finally {
      setCreatingAddress(false);
    }
  };

  // Handle address deletion
  const handleDeleteAddress = (addressId, addressLabel) => {
    const isSelected = selectedAddressId === addressId;
    const selectedAddr = addresses.find(addr => addr._id === addressId);

    // Show custom confirmation dialog
    setDeleteConfirm({
      addressId,
      addressLabel,
      isSelected,
      isDefault: selectedAddr?.isDefault || false,
      address: selectedAddr,
      closing: false
    });
  };

  // Close delete confirmation with animation
  const closeDeleteConfirm = () => {
    if (deleteConfirm) {
      setDeleteConfirm(prev => ({ ...prev, closing: true }));
      setTimeout(() => setDeleteConfirm(null), 300); // Match animation duration
    }
  };

  // Confirm and execute address deletion
  const confirmDeleteAddress = async () => {
    if (!deleteConfirm) return;

    try {
      setDeletingAddress(deleteConfirm.addressId);
      setDeleteConfirm(null); // Close modal

      const res = await axios.delete(`${API_BASE}/address/${deleteConfirm.addressId}`, authHeaders);

      // Remove from addresses list
      setAddresses(prev => prev.filter(addr => addr._id !== deleteConfirm.addressId));

      // If deleted address was selected, try to select another address
      if (selectedAddressId === deleteConfirm.addressId) {
        const remainingAddresses = addresses.filter(addr => addr._id !== deleteConfirm.addressId);
        setSelectedAddressId(remainingAddresses.length > 0 ? remainingAddresses[0]._id : "");
      }

      setErrorMsg(""); // Clear any existing errors

    } catch (error) {
      console.error('Error deleting address:', error);
      setErrorMsg(error.response?.data?.message || 'Failed to delete address');
    } finally {
      setDeletingAddress(null);
    }
  };

  // Handle card payment success
  const handleCardPaymentSuccess = async (paymentIntent) => {
    try {
      setOrderPlacing(true);
      setErrorMsg("");

      // Prepare order data for card payment
      const orderData = {
        addressId: selectedAddressId,
        subtotal: subtotal,
        discount: couponDiscount,
        total: totalPayable,
        coupon: couponCode ? {
          code: couponCode,
          discountType: 'fixed',
          discountValue: couponDiscount
        } : null,
        payment: {
          method: paymentMethod,
          status: 'paid'
        },
        paymentIntentId: paymentIntent.id,
        items: buildCheckoutItems(),
      };

      // Process the order with card payment
      const response = await axios.post(`${API_BASE}/api/payment/card-payment`, orderData, authHeaders);

      // Clear cart and coupon, then redirect
      dispatch(clearCart());
      setCouponCode("");
      setCouponDiscount(0);
      setCouponApplied(false);
      setOrderSuccess(response.data.order);
      await queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      navigate("/orders", { state: { orderPlaced: true } });
    } catch (error) {
      console.error("Order placement error:", error);
      setErrorMsg(error.message || "Failed to place order. Please try again.");
    } finally {
      setOrderPlacing(false);
    }
  };

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (couponApplied) {
      setCouponError("Coupon already applied to this order");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError("");

      const res = await axios.post(`${API_BASE}/wallet/user/validate-coupon`, {
        code: couponCode,
        orderAmount: subtotal
      }, authHeaders);

      const discount = res.data.data?.discount || res.data.discount || 0;
      setCouponDiscount(discount);
      setCouponApplied(true);
      setCouponError("");
    } catch (error) {
      setCouponError(error?.response?.data?.message || "Invalid coupon code");
      setCouponDiscount(0);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle COD order
  const handleCodOrder = async () => {

    if (!selectedAddressId) {
      setErrorMsg("Please choose a delivery address before proceeding with Cash on Delivery.");
      // Auto-clear the error message after 1 second
      setTimeout(() => {
        setErrorMsg("");
      }, 1000);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setErrorMsg("Your cart is empty");
      return;
    }

    try {
      setOrderPlacing(true);
      setErrorMsg("");

      // Prepare order data for COD
      const orderData = {
        addressId: selectedAddressId,
        paymentMethod: "cod", // Backend expects paymentMethod as top-level field
        subtotal: subtotal,
        discount: couponDiscount,
        total: totalPayable,
        coupon: couponCode ? {
          code: couponCode,
          discountType: 'fixed',
          discountValue: couponDiscount
        } : null,
        items: buildCheckoutItems(),
      };


      // Process the COD order
      const response = await axios.post(`${API_BASE}/checkout`, orderData, authHeaders);

      // Clear cart and coupon, then redirect
      dispatch(clearCart());
      setCouponCode("");
      setCouponDiscount(0);
      setCouponApplied(false);
      setOrderSuccess(response.data);
      await queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      navigate("/orders", { state: { orderPlaced: true } });
    } catch (error) {
      console.error("COD order error:", error);
      setErrorMsg(error?.response?.data?.message || error.message || "Failed to place order. Please try again.");
    } finally {
      setOrderPlacing(false);
    }
  };

  if (!userData || !token) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Please login to continue checkout</h2>
          <button onClick={() => navigate('/login')} style={{
            padding: '10px 20px',
            background: '#00eaff',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}>
            Login
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="checkout-page">
        <div className="checkout-container">
          {/* Address Section */}
          <div className="section">
            <div className="section-title">
              <span>Shipping Address</span>
              <button
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="add-address-btn-new"
              >
                + Add New Address
              </button>
            </div>

            {addressLoading ? (
              <div>Loading addresses...</div>
            ) : (
              <div className="address-grid">
                {addresses.map((addr) => (
                  <div key={addr._id} className="address-card-container">
                    <label className="address-card">
                      <input
                        type="radio"
                        name="address"
                        value={addr._id}
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                      />
                      <div className="address-body">
                        <div className="address-top">
                          <div className="address-name-line">
                            {addr.fullName}
                          </div>
                          <div className="address-label">{addr.label}</div>
                        </div>
                        <div className="address-single-line">
                          {[addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country || "India"]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      className="delete-address-btn"
                      onClick={() => handleDeleteAddress(addr._id, addr.label)}
                      disabled={deletingAddress === addr._id}
                      title="Delete this address"
                    >
                      {deletingAddress === addr._id ? '...' : '🗑️'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showNewAddressForm && (
              <div className="new-address-form">
                <div className="field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="field">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({...newAddress, line1: e.target.value})}
                    placeholder="Street address"
                  />
                </div>
                <div className="field">
                  <label>Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({...newAddress, line2: e.target.value})}
                    placeholder="Apartment, suite, etc."
                  />
                </div>
                <div className="field">
                  <label>City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                    placeholder="Enter city"
                  />
                </div>
                <div className="field">
                  <label>State</label>
                  <input
                    type="text"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                    placeholder="Enter state"
                  />
                </div>
                <div className="field">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({...newAddress, postalCode: e.target.value})}
                    placeholder="Enter postal code"
                  />
                </div>
                <div className="field">
                  <label>Label</label>
                  <select
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCreateAddress}
                    disabled={creatingAddress}
                    className="create-address-btn"
                  >
                    {creatingAddress ? 'Creating...' : 'Create Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Section */}
          <div className="summary-card">
            <h3>Order Summary</h3>

            {/* Product List */}
            <div className="items-preview">
              {cartItems.map((item) => (
                <div key={item._id} className="item-row">
                  <div className="item-image">
                    <img
                      src={item.productId?.pimage1 || '/placeholder.jpg'}
                      alt={item.productId?.pname || 'Product'}
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </div>
                  <div className="item-details">
                    <div className="item-title">{item.productId?.pname || 'Product'}</div>
                    <div className="item-price">
                      PKR {item.productId?.pprice || 0} × {item.quantity} = PKR {(item.productId?.pprice || 0) * item.quantity}
                    </div>
                    {(item.color || item.size) && (
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                        {item.color && `Color: ${item.color}`}
                        {item.color && item.size && ' | '}
                        {item.size && `Size: ${item.size}`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className="coupon-section" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="coupon-row">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: couponLoading ? '#666' : '#00eaff',
                    color: '#000',
                    cursor: couponLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {couponDiscount > 0 && (
                <div style={{ color: '#10b981', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Coupon applied: -PKR {couponDiscount.toFixed(2)}
                  <button
                    onClick={() => {
                      setCouponCode("");
                      setCouponDiscount(0);
                      setCouponApplied(false);
                      setCouponError("");
                    }}
                    style={{
                      marginLeft: '10px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  {couponError}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div style={{ marginTop: '1rem' }}>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>PKR {subtotal.toFixed(2)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="summary-row">
                  <span>Coupon Discount:</span>
                  <span style={{ color: '#10b981' }}>-PKR {couponDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping:</span>
                <span>Free</span>
              </div>
              <div className="summary-total">
                <span>Total:</span>
                <span>PKR {totalPayable.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaCreditCard />
                  <span>Credit/Debit Card</span>
                </div>
              </label>

              <label className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaWallet />
                  <span>Cash on Delivery</span>
                </div>
              </label>
            </div>

            {/* Payment Forms */}
            {paymentMethod === "card" && (
              <div style={{ marginTop: '20px' }}>
                {!selectedAddressId ? (
                  <div style={{
                    padding: '1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    ⚠️ Please select a delivery address before proceeding with card payment.
                  </div>
                ) : (
                  <Elements stripe={getStripe()}>
                    <StripeCheckoutForm
                      amount={totalPayable}
                      selectedAddressId={selectedAddressId}
                      onPaymentSuccess={(paymentIntent) => {
                        handleCardPaymentSuccess(paymentIntent);
                      }}
                      onPaymentError={(error) => {
                        console.error("Payment error:", error);
                        setErrorMsg(error);
                      }}
                    />
                  </Elements>
                )}
              </div>
            )}

            {paymentMethod === "cod" && (
              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={handleCodOrder}
                  disabled={orderPlacing || cartItems.length === 0}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: orderPlacing ? '#666' : 'linear-gradient(135deg, #f97316, #facc15)',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    cursor: orderPlacing ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {orderPlacing ? 'Placing Order...' : `Place Order - PKR ${totalPayable.toFixed(2)}`}
                </button>
                <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                  Pay cash when your order is delivered to your doorstep
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="toast-error">
                <FaExclamationCircle size={18} />
                <div>
                  <div style={{ fontWeight: 700 }}>Error</div>
                  <div style={{ fontSize: "0.95rem" }}>{errorMsg}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={closeDeleteConfirm}>
          <div
            className={`delete-confirm-modal ${deleteConfirm.closing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>🗑️ Delete Address</h3>
              <button className="modal-close" onClick={closeDeleteConfirm}>×</button>
            </div>

            <div className="modal-body">
              <div className="delete-confirm-content">
                <div className="delete-address-preview">
                  <div className="preview-label">{deleteConfirm.addressLabel}</div>
                  <div className="preview-address">
                    {deleteConfirm.address?.fullName}<br/>
                    {[deleteConfirm.address?.line1, deleteConfirm.address?.city, deleteConfirm.address?.state, deleteConfirm.address?.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>

                <div className="delete-warnings">
                  {deleteConfirm.isSelected && (
                    <div className="warning-item selected">
                      <span className="warning-icon">⚠️</span>
                      <span>This is your currently selected delivery address</span>
                    </div>
                  )}
                  {deleteConfirm.isDefault && (
                    <div className="warning-item default">
                      <span className="warning-icon">🏠</span>
                      <span>This is your default address</span>
                    </div>
                  )}
                  <div className="warning-item permanent">
                    <span className="warning-icon">🚫</span>
                    <span>This action cannot be undone</span>
                  </div>
                </div>

                <div className="delete-confirm-message">
                  <p>Are you sure you want to delete this address?</p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={closeDeleteConfirm}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={confirmDeleteAddress}
                disabled={deletingAddress === deleteConfirm.addressId}
              >
                {deletingAddress === deleteConfirm.addressId ? 'Deleting...' : 'Delete Address'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Checkout;