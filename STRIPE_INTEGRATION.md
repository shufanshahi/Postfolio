# Stripe Payment Integration for Mentorship Platform

## Overview
This implementation integrates Stripe payment processing into the mentorship platform. When a user clicks "Buy with Stripe" on a mentorship program, they go through a secure payment flow before the mentorship enrollment APIs are executed.

## Architecture

### Backend Services
1. **Stripe Service** (Port 9991): Handles payment intent creation and Stripe communication
2. **Main Backend** (Port 8080): Handles mentorship enrollment and user management

### Frontend Integration
- **StripePayment Component**: Handles the complete payment flow
- **Mentorship Page**: Integrates the payment modal

## Payment Flow

1. **User clicks "Buy with Stripe"**
   - Selected mentorship data is passed to StripePayment component
   - Payment modal opens

2. **Payment Intent Creation**
   - Frontend calls `POST http://localhost:9991/api/charge`
   - Stripe service creates a PaymentIntent and returns client secret
   - Amount is automatically converted to cents (price * 100)

3. **Payment Processing**
   - User enters card details using Stripe Elements
   - Payment is processed securely through Stripe
   - Client receives payment confirmation

4. **Success Actions** (Only if payment succeeds)
   - Fetch user profile
   - Enroll in mentorship program
   - Create enrollment record
   - Refresh mentorship list
   - Show success message

## Key Features

### Security
- No sensitive card data touches your servers
- Stripe handles PCI compliance
- Secure tokenization of payment methods

### User Experience
- Clean, responsive payment modal
- Real-time payment status updates
- Error handling and user feedback
- Consistent styling with the main application

### Error Handling
- Payment failures are gracefully handled
- Network errors are caught and displayed
- User can retry failed payments
- Clear error messages

## Test Cards (Stripe Test Mode)

### Successful Payments
- **4242424242424242** - Visa
- **4000056655665556** - Visa (debit)
- **5555555555554444** - Mastercard

### Failed Payments
- **4000000000000002** - Card declined
- **4000000000009995** - Insufficient funds

### 3D Secure (Authentication Required)
- **4000002500003155** - Requires authentication

## Configuration

### Stripe Keys
The application uses Stripe test keys configured in:
- **Frontend**: Public key in `StripePayment.jsx`
- **Backend**: Secret key in `application.properties`

### CORS Configuration
The Stripe backend includes CORS configuration to allow requests from the Next.js frontend.

## API Endpoints

### Stripe Service (Port 9991)
```
POST /api/charge
Content-Type: application/json
Body: { "amount": 5000 } // Amount in cents
Response: { "clientSecret": "pi_xxx_secret_xxx" }
```

### Main Backend (Port 8080)
```
GET /api/profile/me
POST /api/mentorships/enroll?mentorshipId={id}&profileId={profileId}
POST /api/mentorship-enrollments
```

## Development Setup

1. **Start Stripe Service**:
   ```bash
   cd stripe && ./gradlew bootRun
   ```

2. **Start Main Backend**:
   ```bash
   cd server && ./mvnw spring-boot:run
   ```

3. **Start Frontend**:
   ```bash
   cd client && npm run dev
   ```

## Implementation Details

### Frontend Components
- `StripePayment.jsx`: Main payment component with Stripe Elements
- `page.js`: Updated mentorship page with payment integration

### State Management
- Payment modal state (`showPayment`, `selectedMentorship`)
- Loading states for payment processing
- Error handling for payment failures

### Payment Success Flow
```javascript
onPaymentSuccess(mentorshipId) {
  1. Get user profile
  2. Enroll in mentorship
  3. Create enrollment record
  4. Close payment modal
  5. Refresh data
  6. Show success message
}
```

## Production Considerations

1. **Replace Test Keys**: Use live Stripe keys for production
2. **Environment Variables**: Store keys in environment variables
3. **Error Logging**: Implement proper error logging
4. **Webhook Handling**: Add webhook handlers for payment confirmations
5. **Currency Support**: Add multi-currency support if needed

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure Stripe backend CORS is configured correctly
2. **Payment Failures**: Check Stripe dashboard for detailed error logs
3. **Network Issues**: Verify both backend services are running
4. **Authentication**: Ensure user is logged in with valid token

### Debug Mode
Enable debug logging in the browser console to see detailed payment flow information.
