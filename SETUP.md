# Pegasus2912: Setup Guide

## 1. What is implemented, and how far it was tested
**Tested in this project (simulated browser + mocked/unit tests):** website, portfolio (7 videos), German/English switch, order wizard up to the Stripe redirect, account/dashboard screens, admin screens and editors, input validators, and that every protected API route rejects requests without a valid session (401/403/404).
**Implemented but NOT tested against real services (you must test after configuring):** Supabase sign-up/login/email verification/password reset, database policies, MFA login, Stripe Checkout + webhook, all emails, the real data flow of every dashboard.
**Not built:** direct thumbnail/video file upload in the admin (you give a path or URL), account deletion, German translation of the service/"why me"/process card texts, the admin panel UI (English only), the guest order pages `order.html`/`order-success.html` (English only), separate languages for package names (one text for both languages).

## 2. Supabase
1. Create a project. SQL Editor: run `supabase/schema.sql`, then `supabase/migration-002-accounts-cms.sql`.
2. Authentication -> Providers -> Email: enable email sign-ups **and "Confirm email"** (customers must verify). Authentication -> URL Configuration: Site URL = your domain; add `https://YOUR-DOMAIN/account.html` to Redirect URLs.
3. Authentication -> SMTP: Supabase's built-in mail is heavily rate-limited; set your own SMTP (e.g. Resend SMTP) so verification and reset mails arrive.
4. Authentication -> Multi-Factor: enable TOTP.
5. Settings -> API: copy the project URL, the `anon` key and the `service_role` key (secret!).

## 3. Create YOUR admin account (do this BEFORE announcing the site)
1. Supabase -> Authentication -> Users -> Add user: email `Info@statelight.de`, choose a strong password yourself, tick "Auto confirm". The password never goes into code or chat.
2. SQL Editor: `insert into public.admins (user_id) select id from auth.users where email = 'Info@statelight.de';`
3. Open `/admin.html`, sign in, scan the shown secret with an authenticator app and verify. Do this immediately.
How it is secured: admin access requires, on the server for every call, a valid session + exact `ADMIN_EMAIL` + a row in `admins` (your user ID) + MFA. `admins` has no public access; nobody can write to it except via your SQL editor. Customers cannot change roles (profiles allow updating only name/language). The sign-up API refuses the admin email, and Supabase emails are unique.

## 4. Stripe (test mode first)
Test-mode secret key (`sk_test_...`). Webhook endpoint `https://YOUR-DOMAIN/api/stripe-webhook` with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`; copy the signing secret (`whsec_...`). Live keys only after everything is verified.

## 5. Vercel environment variables (Project -> Settings -> Environment Variables)
`SITE_URL` (https://your-domain, no trailing slash), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` (Info@statelight.de), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Optional emails (order received, paid, status change, new message): `RESEND_API_KEY`, `MAIL_FROM` (a sender on a domain verified in Resend). Redeploy after changes. See `.env.example` (placeholders only).

## 6. Deploy
Push the whole folder to GitHub (keep `api/`, `img/`, `videos/`, `supabase/`, `scripts/`, `package.json`, `package-lock.json`), import in Vercel (Framework: Other, no build command).

## 7. Verify assets after deploy (hero image + Discord video)
Locally before pushing: `npm install` then `npm run check` (all referenced files exist).
After deploy: `npm run verify -- https://YOUR-DOMAIN` (checks status, content type, size and the MP4 header of the hero image, poster, video, favicon, content script). Then open the site: the hero image must show and the Discord video must play. If one fails, the folder/file is missing in GitHub (names are lowercase and case-sensitive) or an old `vercel.json` is deployed.

## 8. Test checklist
Register -> verification mail -> login -> order a package with card `4242 4242 4242 4242` -> order appears in dashboard as paid -> send a message -> admin: reply, change status (customer sees it) -> create a second customer account and confirm it cannot see the first one's orders -> admin: edit a price, a video, About, contact and see the public site change within ~10 s -> in a private window request `/api/admin` (must be 401).

## 9. Content management notes
Prices charged are read server-side from the database (never from the browser). Defaults apply until you save content. Portfolio sources: YouTube link/ID or a file path in your repo's `videos/` folder.

## 10. Remaining risks / to do before real money
Rate limiting is per server instance (add Vercel Firewall or Upstash for strict limits). Complete `legal.html` (address, terms, withdrawal information, providers) with qualified advice. Use 2FA on GitHub, Vercel, Supabase, Stripe. Run `npm audit` after dependency updates. YouTube thumbnails load from Google when a page opens (use your own thumbnails to avoid that).
