# Old Glory Flag Service LLC

Static marketing site with secure Vercel API endpoints for Stripe-hosted checkout and portal.

## Current Website Stack

- Frontend: plain `HTML/CSS/JavaScript` (no framework lock-in)
- Backend: Vercel Serverless Functions in `api/`
- Payments: Stripe Checkout + Stripe Billing Portal
- Authentication: Stripe-managed billing links from Stripe emails/receipts

## Packages

1. **Standard**: `$400/year` (6 holidays)
2. **Pioneer**: `$500/year` (9 holidays)

Promo codes are enabled in Stripe Checkout.

## Security Model

- Card data is handled by Stripe-hosted Checkout only.
- Backend never stores card details and only passes non-sensitive customer profile data to Stripe.
- Service ZIP validation is enforced server-side for Utah County.

## API Endpoints

- `POST /api/create-checkout-session`
- `POST /api/create-customer-portal`
- `POST /api/stripe-webhook`

Note: direct portal session creation endpoint is intentionally disabled to prevent unauthorized access by email enumeration.

## Required Environment Variables

Copy `.env.example` values into Vercel project settings:

- `APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STANDARD`
- `STRIPE_PRICE_PIONEER`

## Stripe Webhook Events to Enable

- `checkout.session.completed`
- `invoice.payment_failed`
- `invoice.paid`
- `customer.subscription.updated`

## Business Rules Implemented

- Service area: all Utah County ZIP codes
- Failed payment: 7-day grace period, then service suspended until payment update
- Refund: full refund before first flag install, committed after first install