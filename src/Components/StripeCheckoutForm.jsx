import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

// Import mock Stripe hooks for custom form layout
import { useStripe, useElements, CardElement } from "../utils/stripe-mock.jsx";
import {
  createPaymentIntent,
  confirmPayment,
  selectClientSecret,
  selectPaymentLoading,
  selectPaymentError,
  selectCardType,
  setCardType,
} from "../Features/Backend/PaymentSlice";
import { FaCreditCard } from "react-icons/fa";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      "::placeholder": {
        color: "#aab7c4",
      },
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontWeight: "400",
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a",
    },
  },
};

const StripeCheckoutForm = ({ amount, selectedAddressId, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const clientSecret = useSelector(selectClientSecret);
  const loading = useSelector(selectPaymentLoading);
  const error = useSelector(selectPaymentError);
  const cardType = useSelector(selectCardType);

  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardValidation, setCardValidation] = useState({
    isEmpty: true,
    isComplete: false,
    error: null
  });

  useEffect(() => {
    // Create payment intent when component mounts
    if (amount > 0 && !clientSecret) {
      dispatch(createPaymentIntent({
        amount: amount, // Amount in rupees, backend will convert to cents
        currency: "pkr",
        cardType: "card" // Generic card type
      }));
    }
  }, [amount, clientSecret, dispatch]);

  // Initialize validation state for mock implementation
  useEffect(() => {
    setCardValidation({
      isEmpty: true,
      isComplete: false,
      error: null
    });
  }, []);

  // Monitor card element validation changes for mock implementation
  useEffect(() => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement('card');
    if (!cardElement) return;

    // For mock implementation, check validation periodically
    const checkValidation = () => {
      if (cardElement && typeof cardElement.isEmpty !== 'undefined') {
        const newValidation = {
          isEmpty: cardElement.isEmpty,
          isComplete: cardElement.isComplete,
          error: null
        };

        // Only update if validation state actually changed
        setCardValidation(prev => {
          if (prev.isEmpty !== newValidation.isEmpty ||
              prev.isComplete !== newValidation.isComplete) {

            return newValidation;
          }
          return prev;
        });

        // Clear card error when validation state changes to complete
        if (cardError && cardElement.isComplete) {
          setCardError(null);
        }
      }
    };

    // Check validation initially and set up periodic checks
    checkValidation();
    const interval = setInterval(checkValidation, 300); // Faster polling

    return () => clearInterval(interval);
  }, [stripe, elements, cardError]);

  // Debug: Log validation state changes
  useEffect(() => {

  }, [cardValidation]);

  const handleSubmit = async (event) => {
    event.preventDefault();


    if (!stripe || !elements) {

      return;
    }

    const cardElement = elements.getElement('card');

    if (!cardElement) {
      setCardError("Card payment system is not available. Please try again.");
      return;
    }

    // Enhanced validation for mock implementation
    // Check card validation state before processing payment
    

    if (cardElement.isEmpty) {

      setCardError("Please fill in all card details. All fields are required.");
      return;
    }

    if (!cardElement.isComplete) {

      setCardError("Please complete all card fields (card number, expiry date, CVC, and cardholder name).");
      return;
    }


    setProcessing(true);
    setCardError(null);

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Customer", // You can get this from user data
          },
        },
      });

      if (error) {
        setCardError(error.message);
        setProcessing(false);
        onPaymentError && onPaymentError(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setSucceeded(true);
        setProcessing(false);
        onPaymentSuccess && onPaymentSuccess(paymentIntent);
      }
    } catch (err) {
      setCardError("Payment failed. Please try again.");
      setProcessing(false);
      onPaymentError && onPaymentError("Payment failed. Please try again.");
    }
  };

  return (
    <div className="stripe-checkout-form">
      {/* Card Payment Header */}
      <div style={{
        textAlign: "center",
        marginBottom: "1.5rem",
        padding: "1rem",
        background: "rgba(0, 234, 255, 0.05)",
        borderRadius: "12px",
        border: "1px solid rgba(0, 234, 255, 0.2)"
      }}>
        <h4 style={{
          color: "#00eaff",
          margin: "0 0 0.5rem 0",
          fontSize: "1.2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem"
        }}>
          <FaCreditCard />
          Secure Card Payment
        </h4>
        <p style={{
          color: "#cbd5e1",
          fontSize: "0.9rem",
          margin: 0
        }}>
          Pay securely with your credit or debit card
        </p>
      </div>

            {/* Card Details Form */}
      <form onSubmit={(e) => {  handleSubmit(e); }} style={{ marginTop: "1rem" }}>
          <div className="card-element-container" style={{ marginBottom: "1rem" }}>
            <label style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "#fff",
              fontWeight: "500",
              fontSize: "0.95rem"
            }}>
              Card Details
            </label>
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${
                cardValidation.isComplete ? 'rgba(16, 185, 129, 0.5)' :
                'rgba(255, 255, 255, 0.15)'
              }`,
              transition: 'border-color 0.3s ease',
              minHeight: '220px', // Adjusted height for side-by-side expiry/CVC layout
            }}>
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            {/* Validation Status Indicator */}
            <div style={{
              marginTop: '8px',
              fontSize: '0.8rem',
              color: cardValidation.isComplete ? '#10b981' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {cardValidation.isComplete ? (
                <>✓ Card details complete</>
              ) : (
                <>🔒 Mock payment form - Fill all fields to proceed</>
              )}
            </div>
          </div>

        {/* Error Display */}
        {(cardError || error) && (
          <div style={{
            color: "#fa755a",
            fontSize: "0.9rem",
            marginBottom: "1rem",
            padding: "0.5rem",
            background: "rgba(250, 117, 90, 0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(250, 117, 90, 0.2)",
          }}>
            {cardError || error}
          </div>
        )}

          {/* Payment Button */}
          <button
            type="submit"
            disabled={!stripe || !clientSecret || processing || succeeded}
            onClick={() => {}}
            style={{
              width: "100%",
              padding: "0.875rem 1.5rem",
              background: succeeded ? "#10b981" : "linear-gradient(135deg, #00eaff, #21d67b)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: processing || succeeded ? "not-allowed" : "pointer",
              opacity: processing || succeeded ? 0.7 : 1,
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {processing ? (
              <>
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}></div>
                Processing...
              </>
            ) : succeeded ? (
              <>Payment Successful! ✓</>
            ) : (
              <>Pay PKR {amount?.toFixed(2)} with Card</>
            )}
          </button>
        </form>

      {/* Loading State */}
      {loading && !clientSecret && (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          color: "#cbd5e1",
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(255,255,255,0.3)",
            borderTop: "2px solid #00eaff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 1rem",
          }}></div>
          Setting up secure payment...
        </div>
      )}

      {/* Inject keyframe animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
};

export default StripeCheckoutForm;
