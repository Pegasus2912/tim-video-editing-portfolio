# Pegasus2912: Setup Guide and Status

## 1. Final checklist (what exists and how it was verified)
"Mock" = tested with in-memory fakes of Supabase/Stripe (logic only). "Postgres" = tested on a real PostgreSQL 16 with Supabase-like stubs (tables, roles, RLS, functions). "jsdom" = simulated browser. **Nothing was tested against real Supabase, Stripe, Resend or Vercel; no real browser was available.**

| Feature | Implemented | Verified |
|---|---|---|
| Hero image, Discord video, portfolio (7 videos) | yes | Files exist; MP4 is H.264/AAC; served correctly by a local server (`npm run verify`); fallback logic in jsdom. **Real playback not tested in a browser.** |
| Registration, email verification, login, logout, password reset | yes (via Supabase Auth); precise error messages, `/api/health` self-check | Mock Supabase Auth server (43 checks: new/existing customer, every failure mode, admin). **Real Supabase untested.** |
| Customer dashboard (orders, status, messages, account) | yes | Mock + jsdom |
| Account deletion (own account only) | yes | Mock (password + typed email, admin protected, other users untouched); erase function on Postgres |
| Customers see only their own data | yes | Mock (two customers) + **Postgres RLS (two customers, anonymous, admin)** |
| Customers cannot change payment/status/roles | yes | Postgres (no write grants; profile only name/language) + Mock |
| Admin panel (orders, status, messages, customers, prices, packages, portfolio, About, contact) | yes | Mock (authz) + jsdom (UI) |
| Admin = only `Info@statelight.de`, one user ID, MFA, server-side | yes | Mock (customer token, other user, no MFA, missing admins row -> 401). **Real MFA login untested.** |
| Uploads of videos/thumbnails to Supabase Storage, preview, replace, delete unused | yes | Mock (type/size/name rules, cleanup) + jsdom (preview, signed URL request, PUT). **Real Storage upload untested.** |
| German/English: whole site, account, ordering, order pages, admin; separate DE/EN package and About texts | yes | jsdom coverage scan of every page. German wording is not reviewed by a native speaker. `legal.html` is NOT translated (see section 9). |
| Stripe Checkout, webhook (signature, amount check, duplicates, expired/failed) | yes | Mock only. **Real Stripe untested.** |
| Emails (order received, paid, status change, new message, account deleted) | yes | Code path only; **no email was sent**. |

## 2. Supabase
1. Create a project. SQL Editor: run in this order `supabase/schema.sql`, `supabase/migration-002-accounts-cms.sql`, `supabase/migration-003-storage-deletion.sql` (creates the public-read `media` bucket: 50 MB limit, only mp4/webm/jpg/png/webp; no write policies).
2. Authentication -> Providers -> Email: enable sign-ups **and "Confirm email"**. URL Configuration: Site URL = your domain; add `https://YOUR-DOMAIN/account.html` as Redirect URL.
3. Authentication -> SMTP: set a custom SMTP (see section 5); the built-in mail sender is heavily rate limited.
4. Authentication -> Multi-Factor: enable TOTP.
5. Storage: check that bucket `media` exists (public). Settings -> API: copy project URL, `anon` key, `service_role` key (secret!).

## 3. Your admin account (do this before announcing the site)
1. Authentication -> Users -> Add user: `Info@statelight.de`, strong password chosen by you, "Auto confirm". The password never goes into code or chat.
2. SQL: `insert into public.admins (user_id) select id from auth.users where email = 'Info@statelight.de';`
3. Open `/admin.html`, sign in, scan the shown secret in an authenticator app, verify.
Security model: every admin call is checked on the server: valid session + exact `ADMIN_EMAIL` + row in `admins` + MFA (aal2). `admins` has no public access. Customer sign-up refuses the admin address. Customers can only change name and language of their profile.

## 4. Stripe (test mode)
Test secret key (`sk_test_...`). Webhook `https://YOUR-DOMAIN/api/stripe-webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `checkout.session.async_payment_failed`; copy `whsec_...`. Test cards: success `4242 4242 4242 4242`, declined `4000 0000 0000 0002`; close the Stripe page to test cancel (the order stays "Awaiting Payment" until the session expires, then becomes "Cancelled"). Live keys only after all tests pass.

## 5. Email
Two senders: (a) **Supabase** sends verification and password-reset mails; (b) **this site** sends order, payment, status, message and deletion mails through Resend. Steps: create a Resend account -> add and verify your sending domain (DNS records) -> create an API key -> set `RESEND_API_KEY` and `MAIL_FROM` (e.g. `Pegasus2912 <orders@your-domain>`) in Vercel. For (a): Resend -> SMTP credentials -> Supabase Authentication -> SMTP. Without Resend the site works but sends no order/status/message emails.

## 6. Vercel
Environment variables: `SITE_URL` (https://your-domain, no trailing slash), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL=Info@statelight.de`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; optional `RESEND_API_KEY`, `MAIL_FROM`. Push the whole folder to GitHub (keep `api/`, `img/`, `videos/`, `supabase/`, `scripts/`, `package.json`, `package-lock.json`), import in Vercel (Framework: Other, no build command), redeploy after changing variables. Placeholders only in `.env.example`.

## 7. Verify before and after deploying
`npm install`, then `npm run check` (all referenced files exist) and, after deploy, `npm run verify -- https://YOUR-DOMAIN` (hero, poster, video incl. MP4 header, favicon, content script). Then open the site: hero image visible, Discord video plays. If not, the file is missing on GitHub (lowercase, case-sensitive names) or an old `vercel.json` is deployed.

## 8. Your test plan with real services
1. Register two customers (verify both emails) and order a package with each (test card). 2. Confirm each sees only their own order, status and messages. 3. Admin: change status (customer sees it), reply to a message. 4. Admin Prices: change a price, order again: Stripe shows the new price. 5. Admin Portfolio: upload a video and a thumbnail (preview first), save, check the public site, remove the entry, save, "Delete unused files". 6. Edit About/contact in DE and EN; switch the site language. 7. Delete a customer account from "Account details". 8. Failed and cancelled payments. 9. Confirm in a private window that `/api/admin` answers 401. 10. Check the browser console on every page.

## 9. Known limits, risks, to do
- **Legal:** `legal.html` (Impressum, privacy) is English only, a template and not legal advice. German law requires German texts with your address, VAT/trade details etc.; have them written/checked. Paid orders survive account deletion only anonymised (amount, package, dates, payment ids); ask your tax advisor what must be kept and for how long. Orders placed as a guest (not logged in) are not linked to an account; deleting an account does not touch them (handle such requests by email).
- **CSP:** `vercel.json` allows `https://*.supabase.co` for images, video and connections (uploads/playback). Tighten it to your exact project host (`https://xxxx.supabase.co`) once known.
- **Uploads:** only the admin can upload, with server-chosen random names and Storage-enforced size/type limits. The browser declares the content type; files are served as static media from the Supabase domain, never executed. The upload request format (multipart PUT to the signed URL) follows Supabase's client library but is untested against the real service.
- Rate limiting is per serverless instance (add Vercel Firewall/Upstash for strict limits). YouTube thumbnails load from Google when a page opens. German wording and the admin translations need your review. Package names stored inside old orders stay in the language they were bought in.
- Use 2FA on GitHub, Vercel, Supabase, Stripe, Resend. Run `npm audit` after dependency changes.

## 10. Troubleshooting registration and login
**Step 1: open `https://YOUR-DOMAIN/api/health`.** It checks the configuration and lists problem codes (never keys or URLs):
| Code | Meaning / fix |
|---|---|
| (404 page) | The `api/` folder is not deployed. Push the whole project and redeploy. |
| `SUPABASE_URL_MISSING/INVALID` | Must look like `https://xxxx.supabase.co` (Project Settings -> API -> Project URL). |
| `SUPABASE_ANON_KEY_*` | Use the public key: legacy `anon` (starts `eyJ`) or the `sb_publishable_...` key. `..._IS_SERVICE_KEY` = you pasted the secret key here. |
| `SUPABASE_SERVICE_ROLE_KEY_*`, `SERVICE_KEY_EQUALS_ANON_KEY` | Needs the secret server key (`service_role` JWT or `sb_secret_...`), a different value than the public key. |
| `SUPABASE_ANON_KEY_REJECTED` | Supabase refuses the public key (wrong project or old/rotated key). |
| `SITE_URL_*` | `https://your-domain` without trailing slash. `SITE_URL_DIFFERS_FROM_THIS_DOMAIN`: SITE_URL must equal the domain you are visiting (www vs. no www, preview URLs), otherwise requests are blocked. |
| `SIGNUP_DISABLED_IN_SUPABASE` | Authentication -> Sign In / Providers -> turn on "Allow new users to sign up". |
| `MIGRATION_00x_MISSING` | Run the SQL files in `supabase/` in order (schema, 002, 003). |
Environment values are trimmed automatically (spaces, quotes, newlines, trailing `/`, `/rest/v1`).
**Step 2: Supabase Authentication settings.** "Confirm email" on is recommended. **Email delivery:** Supabase's built-in mail service only delivers to your own team members and is heavily rate limited. For real customers you must set a custom SMTP (Authentication -> SMTP, e.g. Resend); otherwise sign-up fails with "We could not send the verification email". Add `https://YOUR-DOMAIN/account.html` to Redirect URLs. Password rules in Supabase (Authentication -> Password) must not be stricter than the 10 characters the site asks for, or customers see "Password does not meet the requirements".
**Step 3: Vercel logs** (Project -> Logs) show one line per failure, e.g. `[api:account] signup failed: http=500 code=unexpected_failure msg=Error sending confirmation email`. Customers only see a safe message.
**Existing addresses:** the customer is told "already registered" (as requested). To hide that (prevents probing which emails have accounts), set `HIDE_EXISTING_EMAIL=1`.

## 11. Deploying the API to Vercel (fixes "404 NOT_FOUND" on /api/health)
**What the 404 means.** If `https://YOUR-DOMAIN/api/health` shows the site's own page "This page doesn't exist.", Vercel found no function for that address: the `api` folder is not part of the deployment. Registration, login, Stripe and the admin all live in that folder, so they fail the same way (the browser then shows only a generic error).
**Checked in this project:** a real `vercel build` (Vercel CLI 66.6, Node 24) creates 9 functions: `/api/account`, `/api/admin-auth`, `/api/admin`, `/api/checkout`, `/api/content`, `/api/health`, `/api/messages`, `/api/order-status`, `/api/stripe-webhook`. Files starting with `_` in `api/` are helpers (not public routes) and are bundled automatically. Dependencies (`stripe`, `@supabase/supabase-js`) are installed from `package.json`. No special `vercel.json` is needed for the API.
**What you must upload / set up**
1. The GitHub repository root must directly contain (not inside another folder): `index.html`, `vercel.json`, `package.json`, `package-lock.json`, and the folders `api/` (14 files), `img/`, `videos/`, `supabase/`, `scripts/`. If the ZIP extracted into a folder named `pegasus2912-site`, upload the CONTENTS of that folder, or set Vercel -> Project -> Settings -> General -> **Root Directory** to that folder.
2. Upload folders with Git (`git add -A`, `git commit`, `git push`) or GitHub Desktop. The GitHub web uploader often skips folders: open the repo on github.com and check that `api/` shows 14 files including `health.js`.
3. Vercel -> Project -> Settings -> General: **Framework Preset = Other**; Build Command, Output Directory and Install Command empty; Root Directory as in step 1; Node.js Version 24.x (also set in `package.json`).
4. Settings -> Environment Variables: add the variables from section 6 for **Production** (and Preview if you test there), then **Redeploy** (variables apply only to new deployments).
5. Check the deployment: Vercel -> Deployments -> latest -> **Functions** (or Source) tab must list `api/health`, `api/account`, ... If it does not, the folder is missing from the repository.
6. Run `npm run check` locally before pushing (reports missing `api/` files), and after deploying `npm run verify -- https://YOUR-DOMAIN`: it calls every API route and prints "api/ folder is NOT deployed" if any answers with the 404 page. `npm run dev` starts a local test server with the same routes.
7. Open `https://YOUR-DOMAIN/api/health`: it must show JSON like `{"ok":false,"problems":[...]}`. Fix the listed codes (section 10) until it shows `"ok":true`.
Also note: `/SETUP.md`, `/supabase/*` and `/scripts/*` are redirected to the home page so internal files are not publicly readable.
