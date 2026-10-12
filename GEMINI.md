# BLISS project context (for Gemini in Firebase)

You are helping maintain **BLISS**, a small web app for a Philippine wellness business. Read this whole brief before answering or changing anything.

## What BLISS is
- Firebase project: `bliss-3f5b2`. Live at https://bliss-3f5b2.web.app. Code on GitHub: `klacadin/bliss`.
- Plain static site: HTML, CSS and vanilla JavaScript. **No framework, no build step, no npm packages in the app.** Firebase Hosting serves the folder root as-is.
- Firebase services used: **Hosting**, **Authentication (Email/Password with email verification)** and **Cloud Firestore**. Firebase JS SDK v10.12.2 *compat* build, loaded from gstatic CDN (`firebase.auth()`, `firebase.firestore()`). Keep using the compat API.
- Users are on phones in the Philippines. Prices are in pesos (₱). Plain, warm, simple English.

## Files
| File | Purpose |
|---|---|
| `index.html` | Animated landing page (CSS animations, petals, scroll reveal). Links to the two apps. Respects `prefers-reduced-motion`. |
| `companion.html` | **Client app.** Tabs: Today, Journal, Safety, Order, plus a first-run Plan setup. Dose logging, daily check-in (tap chips), 30-day grid, doctor summary, kit order message (SMS/email/copy). |
| `sales-desk.html` | **Owner + sales team app.** New-order dialog (paste a Companion message to auto-fill), order cards with status steps, "To do today" follow-up messages, kit prices, sales team management (owner only), CSV/JSON export. |
| `auth.js` | Shared login gate for both apps: sign in, create account, forgot password, resend verification. On the Sales Desk it also checks team access, loads/saves the shared sales record, and exposes `window.blissSaveSales`, `window.blissUser`, `window.blissTeam`. |
| `config.js` | Public Firebase web config (`window.BLISS_FIREBASE_CONFIG`). Safe to be public. |
| `bliss.css` | Shared design tokens and components (green `#3e6657`, pink `#f7e9ee`, rose `#a8607a`, Georgia headings, 48px+ tap targets). |
| `firestore.rules` | Security rules (see below). |
| `firebase.json` | Hosting config: no-cache headers for html/js/css, ignores dev files. |
| `assets/*.webp` | Illustrations cut from the BLISS booklet (white backgrounds). |
| `schema.sql` | Old Supabase setup. **Not used.** Ignore it. |

## Data model and privacy (very important)
1. **Client health data never goes to Firebase.** The Companion stores the plan, doses and check-ins in the browser's `localStorage` under key `bliss-companion-v1`, shape `{plan:{start,doseDay,dose,strength,clinician,contact,reason}, checkins:[{date,appetite,nausea,energy,water,weight,notes}], doses:[{date,mg,site}]}`. Do not add code that uploads, syncs or logs this data. Login on the Companion is only an access gate.
2. **Sales data** lives in Firestore:
   - `bliss_admins/{uid}`: team list. `role: "owner"` (added by hand in the Console) or `role: "sales"` (added by the owner from the Sales Desk, with `name`, `added_by`, `added_at`).
   - `bliss_sales/shared`: one shared document `{payload:{prices:{"10","20","30"}, orders:[...]}, updated_at, updated_by}`. Every team member reads and writes it; changes sync live via `onSnapshot`.
   - `bliss_sales/{uid}`: legacy per-person record, read once to migrate into `shared`.
   - Order fields: `date,status,name,mobile,location,strength,qty,needBy,reorder,total,paid,channel,notes,by`. Status flow: Inquiry → Confirmed → Paid → Dispatched → Delivered (or Cancelled).
3. **Security rules:** only signed-in users **with verified email** who exist in `bliss_admins` can read/write `bliss_sales/shared`. Only the owner can create (`role:"sales"` only) or delete team members, and cannot delete themselves. Everything else is denied. Never loosen these rules, never allow a client to set its own role, and never put a service-account key or admin secret in the site.
4. Sales Desk notes must not contain medical or treatment details.

## Order hand-off format (must stay compatible)
The Companion builds this text and the Sales Desk parses it line by line (`Label: value`). Do not rename the labels:
```
BLISS KIT INQUIRY
Vial strength: 10 mg
Number of kits: 1
Needed by: 2026-10-20
Name: ...
Mobile: ...
City / barangay: ...
Reply via: SMS
Notes: ...
```
Orders go to +63 917 635 8505 (SMS) or clevergritph@gmail.com.

## Health and compliance guardrails
- The app is a **tracking and education tool**, not medical advice. Never add features that recommend, calculate or change a dose. Users enter the dose their clinician prescribed.
- Keep the emergency/safety content and disclaimers. The reference dosing table is labelled as applying to FDA-approved Zepbound only.
- Do not make marketing claims about weight loss results, FDA approval, or equivalence to Zepbound/Mounjaro. The kit products have not been verified as FDA Philippines-registered.
- Treat customer contact data under the Philippine Data Privacy Act: collect only what is needed.

## How to work on this project
- Keep everything dependency-free and mobile-first. Big buttons, few words, tap choices over typing, toasts instead of `alert()`.
- When changing `auth.js`, `config.js` or `bliss.css`, bump the `?v=` number in the `<script>`/`<link>` tags of every HTML page.
- Element IDs used by `auth.js` must exist on both app pages: `authGate, authForm, authTitle, authEmail, authEmailWrap, authPassword, pwWrap, pwToggle, authSubmit, authForgot, authResend, authSwitch, authStatus, userBar, userEmail`.
- Deploy: `firebase deploy --only "hosting,firestore:rules" --project bliss-3f5b2` (quote the list in PowerShell). Then commit and push to GitHub.
- Before suggesting a change, say which file(s) you will edit and why, keep edits small, and show the full changed function or block.

## Owner setup reminders
- Authentication → Email/Password must be enabled. Authorized domains include `bliss-3f5b2.web.app`.
- Owner access: Firestore → `bliss_admins` → document ID = owner's UID → field `role` = `owner`.
- Adding a salesperson: they create an account on `/sales-desk`, confirm email, sign in, copy the code shown, and send it to the owner, who pastes it under **Sales team → Add a salesperson**.
