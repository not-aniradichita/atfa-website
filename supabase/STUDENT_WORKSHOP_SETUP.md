# Student registration: setup and operations

Everything for the Acting & Filmmaking Workshop **student registration** lives in the Supabase project
`thespians-tribe` (ref `qgxgvyoosvbwmnnxggqz`). No secret and no student payment link is stored in this repository.

| Piece | Where |
|---|---|
| Event page "Student Registration" section | `event-workshop.js`, `events-data.js` (`studentRegistration`, no payment links) |
| Application form | `events/acting-filmmaking-workshop-student-registration.html` + `student-registration.js` |
| Admin dashboard | `/admin/student-applications` (`admin/student-applications.*`) |
| Backend | edge function `student-workshop` (`supabase/functions/student-workshop/`) |
| Database | `migrations/20261110_student_workshop_registration.sql`, `migrations/20261110_student_workshop_retention_cron.sql` |
| ID documents | private Storage bucket `student-ids` (no public URL, no storage policies) |

## 1. Turn on email (required, not done yet)

Emails are sent through the **Gmail API** as `aniket.pandya.3991@gmail.com`. Until the three secrets below exist,
applications are saved and emails wait in a queue (`student_workshop_outbox`); the dashboard shows them as
**NOT SENT** with a **Retry email** button. Nothing is lost, and nothing pretends to be sent.

One-time setup, signed in as **aniket.pandya.3991@gmail.com**:

1. Google Cloud Console: create a project, then **APIs & Services → Library → Gmail API → Enable**.
2. **OAuth consent screen**: User type *External*, add the app name and your email. Add `aniket.pandya.3991@gmail.com`
   as a test user, then press **Publish app** (a refresh token issued while the app is in "Testing" stops working after
   7 days; an unverified published app is fine for sending from your own account).
3. **Credentials → Create credentials → OAuth client ID → Web application**. Add the redirect URI
   `https://developers.google.com/oauthplayground`. Note the **Client ID** and **Client secret**.
4. Open <https://developers.google.com/oauthplayground>. Gear icon → tick **Use your own OAuth credentials** → paste the
   client ID and secret. In Step 1 enter the scope `https://www.googleapis.com/auth/gmail.send`
   (optionally also `https://www.googleapis.com/auth/gmail.readonly`, which lets the function double-check the account;
   without it Gmail still sends only as the account you authorise). Authorise **as aniket.pandya.3991@gmail.com**.
5. Step 2: **Exchange authorization code for tokens** and copy the **Refresh token**.
6. Supabase dashboard → **Edge Functions → Secrets** (or `supabase secrets set`) and add:

| Secret | Value |
|---|---|
| `GMAIL_CLIENT_ID` | OAuth client ID |
| `GMAIL_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | refresh token from step 5 |

No redeploy is needed. Sign in to the dashboard: the yellow "Email sending is not set up" notice disappears, and
**Retry email** on each queued message sends it. (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to the
function automatically. They are never in the browser.)

Recipients and sender are rows in the private table `student_workshop_settings`
(`team_emails`, `sender_email`, `sender_name`, `admin_url`). Change them with SQL, for example:

```sql
update student_workshop_settings set value = 'team@aniradichita.com,medhathakkar27@gmail.com' where key = 'team_emails';
```

## 2. Give someone admin access

Access is by **account id**, not by email text, so a look-alike sign-up can never match. This project has open
sign-ups, so create the account yourself:

1. Supabase dashboard → **Authentication → Users → Add user** (tick *Auto Confirm User*), with a strong password.
2. Allow-list that user:

```sql
insert into student_workshop_admins (user_id, email)
select id, email from auth.users where email = 'person@example.com';
```

3. They sign in at `https://aniradichita.com/admin/student-applications`. A signed-in account that is not on the list gets
   "not authorised" and sees no data. Remove access with `delete from student_workshop_admins where email = '...';`.

## 3. How a student is handled

1. Student submits the form → row in `student_workshop_applications` (status **Pending Verification**, unique ID like
   `SW-261110-7KQ2M`), ID file in the private bucket, team notification email (to `team@aniradichita.com` and
   `medhathakkar27@gmail.com`) and student acknowledgement email queued and sent. The team email carries a sign-in link to the
   application; the ID itself is **not** attached.
2. An admin opens the application, views the ID (signed link valid 60 s, each view is logged), and approves or rejects.
3. **Approve** → the fixed link for that workshop (table `student_workshop_links`) is emailed to the student and the status
   becomes **Payment Link Sent** *only once that email has really been sent*. If sending fails the status stays **Approved**
   and the dashboard offers a retry. A second approve cannot send a second link unless an admin explicitly chooses **Resend**.
4. **Reject** → polite email (internal notes are never included). Not possible once a payment link has been issued.

"Payment Completed" exists as a status but is **not set automatically**: this site has no Razorpay webhook, so payments are
checked in the Razorpay dashboard.

Change a student payment link:

```sql
update student_workshop_links set url = 'https://rzp.io/...', updated_at = now() where workshop = 'acting'; -- acting | filmmaking | combo
```

## 4. Privacy and retention

- Only the edge function (service role) can read the tables or the bucket. RLS is on, with no public policies and no grants
  to `anon`/`authenticated`.
- ID documents: PDF/JPG/PNG, max 5 MB, type checked by file content, PDFs with scripts or embedded files and images with
  hidden markup are refused.
- Retention: each ID is deleted **30 days after the application is approved or rejected**, and in any case on
  **22 December 2026** (`retention_expires_at`). A daily job (pg_cron `student-workshop-id-retention`, 03:00 IST) deletes
  expired files. Admins can also delete one file at any time ("Delete ID file"). The text details of an application stay until
  you delete the row.
- The form page tells students all of this before they upload.

## 5. Quick checks after setup

1. Submit a test application with a throw-away email on the live form. Confirm the team email arrives at both addresses and the
   student email arrives.
2. Approve it in the dashboard and confirm the student email contains the right link for the chosen workshop.
3. Delete the test application (`delete from student_workshop_applications where email = '...'`) and delete its ID file first
   from the dashboard.
