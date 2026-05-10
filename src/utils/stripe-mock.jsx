// Mock Stripe React components for development
// Replace with actual @stripe/react-stripe-js imports once packages are installed

import React, { useState, useContext, createContext, useMemo } from 'react';

// Create a mock elements context
const MockElementsContext = createContext(null);

// Create a context for card element state sharing
const CardElementStateContext = createContext(null);

// Mock Elements component
export const Elements = ({ children, stripe }) => {
  const [cardElementState, setCardElementState] = useState({
    // Mock card element with proper methods that Stripe expects
    mount: () => {},
    unmount: () => {},
    destroy: () => {},
    update: () => {},
    clear: () => {},
    // Add mock validation state
    isEmpty: true,
    isComplete: false,
  });

  const elements = useMemo(() => ({
    getElement: (type) => {
      if (type === 'card') {
        return cardElementState;
      }
      return null;
    }
  }), [cardElementState]);

  return (
    <MockElementsContext.Provider value={elements}>
      <CardElementStateContext.Provider value={{ cardElementState, setCardElementState }}>
        <div className="stripe-elements-mock">{children}</div>
      </CardElementStateContext.Provider>
    </MockElementsContext.Provider>
  );
};

// Mock useStripe hook
export const useStripe = () => {
  return {
    confirmCardPayment: async (clientSecret, options) => {
      // Simulate payment processing
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            error: null,
            paymentIntent: {
              id: `pi_mock_${Date.now()}`,
              status: 'succeeded',
              amount: 1000, // Mock amount in cents
            }
          });
        }, 2000);
      });
    }
  };
};

// Mock useElements hook
export const useElements = () => {
  const elements = useContext(MockElementsContext);
  return elements || {
    getElement: () => null // Fallback if not in Elements context
  };
};

// Mock CardElement component with interactive form inputs and validation
export const CardElement = ({ options }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState({});

  // Get shared card element state context
  const { setCardElementState } = useContext(CardElementStateContext);

  // Validation functions - proper validation for mock testing
  const validateCardNumber = (number) => {
    const cleanNumber = number.replace(/\s+/g, '');
    // Must be exactly 16 digits for test cards
    return cleanNumber.length === 16 && /^\d+$/.test(cleanNumber);
  };

  const validateExpiry = (expiry) => {
    // Proper MM/YY validation
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [month, year] = expiry.split('/');
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    return expMonth >= 1 && expMonth <= 12 && expYear >= 24 && expYear <= 99;
  };

  const validateCVC = (cvc) => {
    // Require exactly 3 digits for CVC
    return /^\d{3}$/.test(cvc);
  };

  // Format card number with spaces
  const formatCardNumber = (value) => {
    const cleanValue = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const match = cleanValue.match(/\d{1,4}/g);
    return match ? match.join(' ') : '';
  };

  // Format expiry date
  const formatExpiry = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.substring(0, 2) + '/' + cleanValue.substring(2, 4);
    }
    return cleanValue;
  };

  // Handle card number change with validation
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  // Handle expiry change
  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value);
    setExpiry(formatted);
  };

  // Handle CVC change
  const handleCVCChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setCvc(value);
  };

  // Update validation state in parent elements context
  // Validate cardholder name
  const validateCardholderName = (name) => {
    return name && name.trim().length >= 2;
  };

  const updateValidationState = () => {
    // Check individual field validations
    const cardNumberValid = validateCardNumber(cardNumber);
    const expiryValid = validateExpiry(expiry);
    const cvcValid = validateCVC(cvc);
    const nameValid = validateCardholderName(cardholderName);

    // Update errors
    const newErrors = {
      cardNumber: cardNumber && !cardNumberValid ? 'Invalid card number' : '',
      expiry: expiry && !expiryValid ? 'Invalid expiry date' : '',
      cvc: cvc && !cvcValid ? 'Invalid CVC' : '',
      cardholderName: cardholderName && !nameValid ? 'Name required' : ''
    };

    // Only update if errors changed
    if (JSON.stringify(newErrors) !== JSON.stringify(errors)) {
      setErrors(newErrors);
    }

    const hasErrors = Object.values(newErrors).some(error => error !== '');
    const isEmpty = !cardNumber && !expiry && !cvc && !cardholderName;
    const isComplete = cardNumberValid && expiryValid && cvcValid && nameValid && !hasErrors;

    

    // Update the shared card element state
    if (setCardElementState) {
      setCardElementState(prev => ({
        ...prev,
        isEmpty,
        isComplete
      }));
    }
  };

  // Update validation state whenever errors change
  React.useEffect(() => {
    updateValidationState();
  }, [errors, cardNumber, expiry, cvc, cardholderName]);

  return (
    <div className="mock-card-element" style={{
      padding: '16px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    }}>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Cardholder Name"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${errors.cardholderName ? '#fa755a' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            WebkitTextFillColor: '#ffffff',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            fontSize: '16px',
            fontWeight: '600',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#00eaff';
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 234, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.cardholderName ? '#fa755a' : 'rgba(255,255,255,0.3)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {errors.cardholderName && (
          <div style={{ color: '#fa755a', fontSize: '12px', marginTop: '4px' }}>
            {errors.cardholderName}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Card Number (4242 4242 4242 4242 for testing)"
          value={cardNumber}
          onChange={handleCardNumberChange}
          maxLength="23" // Allow spaces in formatted number
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${errors.cardNumber ? '#fa755a' : 'rgba(255,255,255,0.3)'}`,
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
            WebkitTextFillColor: '#ffffff',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
            fontSize: '16px',
            fontWeight: '600',
            outline: 'none',
            transition: 'all 0.2s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#00eaff';
            e.target.style.boxShadow = '0 0 0 2px rgba(0, 234, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = errors.cardNumber ? '#fa755a' : 'rgba(255,255,255,0.3)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {errors.cardNumber && (
          <div style={{ color: '#fa755a', fontSize: '12px', marginTop: '4px' }}>
            {errors.cardNumber}
          </div>
        )}
      </div>

      {/* Expiry and CVC side by side */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="MM/YY"
            value={expiry}
            onChange={handleExpiryChange}
            maxLength="5"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${errors.expiry ? '#fa755a' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#00eaff';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 234, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.expiry ? '#fa755a' : 'rgba(255,255,255,0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.expiry && (
            <div style={{ color: '#fa755a', fontSize: '12px', marginTop: '4px' }}>
              {errors.expiry}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="CVC"
            value={cvc}
            onChange={handleCVCChange}
            maxLength="4"
            style={{
              width: '100%',
              padding: '12px',
              border: `1px solid ${errors.cvc ? '#fa755a' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              WebkitTextFillColor: '#ffffff',
              textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              fontSize: '16px',
              fontWeight: '600',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#00eaff';
              e.target.style.boxShadow = '0 0 0 2px rgba(0, 234, 255, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.cvc ? '#fa755a' : 'rgba(255,255,255,0.3)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.cvc && (
            <div style={{ color: '#fa755a', fontSize: '12px', marginTop: '4px' }}>
              {errors.cvc}
            </div>
          )}
        </div>
      </div>
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#aab7c4',
        fontStyle: 'italic'
      }}>
        🔒 Mock payment form - No real payment processing
      </div>

      <style jsx>{`
        .mock-card-element input::placeholder {
          color: #cccccc !important;
          font-weight: 400 !important;
          opacity: 0.8 !important;
        }

        .mock-card-element input:focus::placeholder {
          color: #aaaaaa !important;
        }
      `}</style>
    </div>
  );
};
