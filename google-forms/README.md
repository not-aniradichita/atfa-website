# Regular workshop registration: Google Forms + Sheets

`registration-setup.gs` creates, in the Google account that runs it:

- three Google Forms (Acting, Filmmaking, Acting + Filmmaking Combo) with identical fields: full name, email (validated),
  phone, city (all required), school/college/organisation (optional) and the required confirmation checkbox. The workshop and
  dates are stated in each form description, so nobody picks the workshop again;
- each form's confirmation message carries **its own** regular Razorpay link (Acting `ACWP`, Filmmaking `ATFAFMWS`,
  Combo `Acting&Filmmaking`). No student link appears anywhere here;
- one spreadsheet, "Aniradichita – Acting & Filmmaking Workshop Registrations", with tabs **Summary**, **Acting Registrations**,
  **Filmmaking Registrations**, **Combo Registrations**, each form linked to its tab;
- per-row columns: Workshop, Submission = "Form Submitted", "Payment received?" (typed by the team) and Payment status
  (**Payment Pending** until the team types Yes, then **Payment Confirmed**);
- Summary counts per workshop (submissions, pending, confirmed, unique emails) and totals, all formulas;
- editor access for `team@aniradichita.com` and `medhathakkar27@gmail.com` (if Google accepts those addresses; the script reports each result).

It runs as **Google Apps Script inside your own account**, so no password, OAuth secret or refresh token is ever shared or stored.
It asks for two permissions only: Google Forms and Google Sheets.

## Run it (about 5 minutes, signed in as aniket.pandya.3991@gmail.com)

1. Open <https://script.google.com> → **New project**. Name it "Aniradichita registration setup".
2. Replace the code in `Code.gs` with the contents of `registration-setup.gs`.
3. **Project Settings (gear) → tick "Show appsscript.json manifest file"**, open `appsscript.json` and paste the contents of
   `appsscript.json` from this folder (it limits the permissions to Forms + Sheets).
4. Choose the function **createAll** and press **Run**. Google asks you to authorise: *Review permissions* → your account →
   (if you see "Google hasn't verified this app", that is normal for your own script: **Advanced → Go to … (unsafe)**) → Allow.
5. When it finishes, open **Execution log**. Copy the block that starts with `RESULTS` and the `VERIFY` block and send them
   back. They contain only the public form links and sheet link, no secrets.
6. Run **runTests**. It submits one clearly marked test response to each form and logs the Summary counts before and after
   (each workshop should rise by 1). Look at the spreadsheet to see the three rows.
7. Run **cleanupTests** to delete the three test responses and their sheet rows.

The script refuses to run `createAll` twice, so you cannot create duplicate forms by accident.

## Checks only a human can do

- Open each form's public link, submit a real-looking answer, and confirm the confirmation page shows a **clickable** Razorpay
  link for the right workshop (Google may show the link as plain text in some views; it is still copy/pasteable).
- Google Forms **cannot redirect** a respondent to another website after submit. The payment link is shown on the confirmation page.
- If sharing with a team address reports an error (for example it is not a Google account), share the spreadsheet and forms
  manually: *Share → add the address as Editor*.

## What this does not do

Google Forms records **form submissions**, not Razorpay payments. Everything starts as "Payment Pending". Marking someone as paid
is a manual step (type `Yes` in column J after checking the Razorpay dashboard). Automatic confirmation would need a Razorpay
webhook; that is a separate change to payment infrastructure and is not done here.
