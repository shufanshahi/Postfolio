"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Stripe public key from the backend config
const stripePromise = loadStripe('pk_test_51S1igdHPpcxZT7Hb3oX2pD081tkKg3Ewt7k1QFNdYu5tY1azAq08jQcH5cVb1I5NL6aP6RV74nj3iTgVPiZuuyUy00byrxWFTc');

const accentColor = '#6366f1';
const secondaryColor = '#f1f5f9';

const CardForm = ({ clientSecret, onPaymentSuccess, onPaymentError, mentorship, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setPaymentError(error.message);
        onPaymentError(error);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment successful, execute the purchase APIs
        onPaymentSuccess(mentorship.id);
      }
    } catch (err) {
      setPaymentError('Payment failed. Please try again.');
      onPaymentError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(30,41,59,0.18)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 18,
        boxShadow: '0 8px 32px 0 rgba(99,102,241,0.13)',
        padding: 36,
        minWidth: 400,
        maxWidth: 500,
        width: '90%',
        position: 'relative',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: '#64748b',
            cursor: 'pointer',
            fontWeight: 700
          }}
          aria-label="Close"
        >×</button>

        <h2 style={{ color: accentColor, fontWeight: 800, fontSize: 24, marginBottom: 18 }}>
          Complete Payment
        </h2>

        <div style={{ 
          background: '#f8fafc', 
          padding: 20, 
          borderRadius: 12, 
          marginBottom: 24,
          border: `1px solid ${secondaryColor}`
        }}>
          <h3 style={{ margin: 0, marginBottom: 8, color: '#334155', fontWeight: 600 }}>
            {mentorship.name}
          </h3>
          <p style={{ margin: 0, marginBottom: 8, color: '#64748b' }}>
            {mentorship.specialization}
          </p>
          <div style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            color: accentColor 
          }}>
            ${mentorship.price}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              fontWeight: 600, 
              color: '#334155', 
              display: 'block', 
              marginBottom: 8 
            }}>
              Card Details
            </label>
            <div style={{
              padding: '12px 16px',
              border: `1.5px solid ${secondaryColor}`,
              borderRadius: 8,
              background: 'white'
            }}>
              <CardElement options={cardStyle} />
            </div>
          </div>

          {paymentError && (
            <div style={{ 
              color: '#dc2626', 
              marginBottom: 16, 
              padding: 12, 
              background: '#fef2f2', 
              borderRadius: 8,
              border: '1px solid #fecaca'
            }}>
              {paymentError}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || isProcessing}
            style={{
              width: '100%',
              background: isProcessing ? '#94a3b8' : accentColor,
              color: 'white',
              fontWeight: 700,
              fontSize: 17,
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isProcessing ? 'Processing...' : `Pay $${mentorship.price}`}
          </button>
        </form>

        <div style={{ 
          marginTop: 16, 
          fontSize: 14, 
          color: '#64748b', 
          textAlign: 'center' 
        }}>
          Powered by Stripe. Your payment information is secure.
        </div>
      </div>
    </div>
  );
};

const StripePayment = ({ mentorship, onPaymentSuccess, onPaymentError, onClose }) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('http://localhost:9991/api/charge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(mentorship.price * 100) // Convert to cents
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [mentorship.price]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,41,59,0.18)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 18,
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.13)',
          padding: 36,
          textAlign: 'center'
        }}>
          <div style={{ color: accentColor, fontSize: 18, fontWeight: 600 }}>
            Setting up payment...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(30,41,59,0.18)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          background: 'white',
          borderRadius: 18,
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.13)',
          padding: 36,
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#64748b',
              cursor: 'pointer',
              fontWeight: 700
            }}
            aria-label="Close"
          >×</button>
          <div style={{ color: '#dc2626', fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Payment Setup Failed
          </div>
          <div style={{ color: '#64748b', marginBottom: 20 }}>
            {error}
          </div>
          <button
            onClick={onClose}
            style={{
              background: accentColor,
              color: 'white',
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardForm
        clientSecret={clientSecret}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        mentorship={mentorship}
        onClose={onClose}
      />
    </Elements>
  );
};

export default StripePayment;
