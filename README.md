# BLISS online deployment package

Two separate pages: `/companion.html` (client), `/sales-desk.html` (owner only). Original BLISS PDF artwork is included under `assets/`.

## Live signup/login setup on Firebase (required before publishing)
1. In the Firebase Console, open your project. Under **Authentication > Sign-in method**, enable **Email/Password**. Under **Authentication > Settings > Authorized domains**, add your final domain.
2. Create a **Firestore Database** (production mode).
3. Under **Project settings > Your apps**, add a Web app and paste its config into `config.js` (apiKey, authDomain, projectId, appId). These are public by design; never paste a service-account key anywhere in this folder.
4. Deploy: `firebase use --add` (pick your project), then `firebase deploy --only hosting,firestore:rules`.
5. Sign up as the BLISS owner on the Companion page and confirm your email. In **Authentication > Users**, copy your User UID. In **Firestore**, create collection `bliss_admins` with a document whose ID is that UID (any field, e.g. `role: "owner"`).
6. Test: client signup + email confirmation, a non-admin is refused at the Sales Desk, admin save/reload works, password reset.

## Data design
- Companion journal (plan, check-ins, dose logs) stays in each browser's localStorage **even after login**; clients must use the same device/browser. Email login does NOT sync medical notes. Clearing site storage deletes journal.
- Sales Desk holds only order/contact/payment information, stored in Firestore `bliss_sales`. `firestore.rules` enforces owner access; ordinary signups cannot get admin role. Other accounts cannot read admin data.
- Sales Desk currently has a single JSON record for the owner: suitable for single-owner operation, not simultaneous multi-admin editing.
- Order inquiries are copied by the client into their own messaging app, not automatically transmitted.
- Do not enter health or treatment notes in the Sales Desk. Obtain consent for customer contact and follow local data-privacy and pharmaceutical regulations.
- The products in these PDFs have **not** been independently verified as registered/approved with Philippine FDA. Never imply equivalence to licensed Zepbound formulations.

## Local viewing
You can inspect the design by opening `index.html`, but until Firebase is configured, protected content stays locked. For testing, serve via HTTPS or a local dev server; some browser login redirects will not work from `file://`.

`schema.sql` is the old Supabase setup and is no longer used.

## Sales team accounts
- The owner's `bliss_admins` document must have the field `role` = `owner`.
- To add a salesperson: they open `/sales-desk`, create an account, confirm their email, sign in and copy the code shown. The owner pastes the code in **Sales team → Add a salesperson**.
- Everyone on the team works on one shared record (`bliss_sales/shared`). The owner can remove a salesperson at any time.
