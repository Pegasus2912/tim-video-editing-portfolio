# Setup (Pegasus2912)

**Status.** Working: branding, design, portfolio, pricing, order wizard, Stripe Checkout (test mode), verified webhook, order confirmation page, DB schema with RLS.
**Phase 2 (built, untested against real accounts):** customer messaging (`order.html`), admin dashboard (`admin.html`) with server-side MFA enforcement.
**NOT built yet:** admin settings editor (prices, packages, portfolio videos, contact info). Edit these in `app.js` and `api/_packages.js` for now.

## 1. Supabase
1. Create a project. SQL Editor -> paste `supabase/schema.sql` -> Run.
2. Settings -> API: copy the project URL and the **service_role** key (secret, server only).
3. Your admin account later: Authentication -> add user Info@statelight.de (invite only, signups disabled under Auth -> Providers -> Email), enable MFA, then insert its id into `admins` via SQL. There is no default admin.

## 2. Stripe (test mode first)
1. Stripe Dashboard in **Test mode**: copy the secret key (`sk_test_...`).
2. Developers -> Webhooks -> add endpoint `https://YOUR-DOMAIN/api/stripe-webhook`, events `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy the signing secret (`whsec_...`).
3. Live mode only after your Stripe account is verified and the tests below pass.

## 3. Vercel environment variables
`SITE_URL` (https://your-domain, no trailing slash), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; optional `RESEND_API_KEY`, `MAIL_FROM` (confirmation emails). Redeploy after saving.

## 4. Deploy
Copy all files into your GitHub repo root (keep `api/`, `package.json`), commit, push. Vercel builds automatically.

## 5. Test
Order a package, pay with card `4242 4242 4242 4242` (any future date, any CVC). The success page should show "Payment confirmed" and the order row `status = paid`. Cancel at Stripe: stays `pending_payment`. Without env vars the wizard shows "not configured" (expected).

## 6. Before real money
Complete `legal.html`, add terms/withdrawal info, run `npm audit`, switch Stripe to live keys and a live webhook.

## 7. Admin and messaging (Phase 2)
New env vars: `SUPABASE_ANON_KEY` (public anon key, used server-side for sign-in), `ADMIN_EMAIL=Info@statelight.de`. Optional: `ADMIN_EMAIL` also receives new-message notifications if `RESEND_API_KEY`/`MAIL_FROM` are set.
1. Supabase -> Authentication -> Providers -> Email: **disable "Allow new users to sign up"** (no public registration). Enable MFA (TOTP) under Authentication -> Multi-Factor.
2. Authentication -> Users -> "Add user" -> Info@statelight.de with a strong unique password (stored hashed by Supabase, never by this site).
3. SQL Editor: `insert into public.admins (user_id) select id from auth.users where email = 'Info@statelight.de';`
4. Open `/admin.html`, sign in, and **immediately** scan the shown secret into an authenticator app and verify. Until MFA is verified, no admin data is reachable. Do this before sharing the site.
5. Every admin API call checks on the server: valid session token + exact `ADMIN_EMAIL` + row in `admins` + MFA level aal2. The admin session cookie is HttpOnly, Secure, SameSite=Strict and lasts 1 hour.
6. Customers open `order.html?o=...&t=...` (the link shown after payment). They can only read/write the conversation of the order whose secret token matches. Messaging unlocks only after Stripe confirmed payment. Lost links cannot be recovered yet (planned: email re-send).
7. Test: sign in -> MFA -> dashboard; reply to a test order; check the customer page shows the reply; try `/api/admin` without cookie (must return 401).
