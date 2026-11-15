# Student applications: Google Forms + Google Sheets

`student-setup.gs` (same Apps Script project as `registration-setup.gs`, which it does not touch) creates three student forms and one
spreadsheet, **Aniradichita – Student Workshop Applications**, with tabs Summary, Acting / Filmmaking / Combo Student Applications.
The team reviews everything in the sheet. There is no admin dashboard and no email workflow.

No email address and no payment link is stored in the repository. They live in **Script properties** inside your Google account.

## What Google Forms can and cannot do (read first)

| Requirement | What Google Forms allows |
|---|---|
| Mandatory ID upload | Yes, a required **File upload** question. |
| Students need no account | **No.** A file-upload question forces respondents to sign in to a Google account. A student without one cannot apply through these forms. |
| PDF/JPG/JPEG/PNG only | The editor offers file *categories* (PDF, Image, …), not exact extensions. Choose **PDF + Image**. GIF or WebP images would also pass. The old system's check of the real file content is gone. |
| Maximum 5 MB | **Not available.** The size choices are 1 MB, 10 MB, 100 MB, 1 GB, 10 GB. Set **10 MB**. The forms ask for "under 5 MB" in words only; it is not enforced. |
| Create the upload question by script | **No.** Neither Apps Script nor the Forms API can create file-upload questions. You add it by hand to each form (step 4, about 1 minute each). |
| Private ID storage | Yes. Uploaded files go to a Drive folder named `<form title> (File responses)` owned by the form owner and are private by default. The script re-checks that it is private and shares it with your team only. |
| One file per student per form | Google limits a form with an upload to one response per person. |

If a student has no Google account, the regular registration options (or the team directly) remain the fallback.

## Where the IDs are stored, who can open them

- Files sit in the form owner's Drive (folder `Student – … (File responses)`), not in any public folder. Nothing on the website links to them.
- `studentSecureUploadFolders()` sets each folder to **Private** and adds the people in `STUDENT_TEAM_EDITORS` as viewers.
- `studentAuditIdAccess()` lists every ID file and its sharing level and flags anything shared by link or publicly.
- The **ID document link** column in the sheet only opens for people who have access to that Drive folder.

## Retention (matches what the form tells students)

- IDs are deleted **30 days after the team sets Approved or Rejected** (the sheet stamps *Decision date* automatically), and in any case on **22 December 2026**.
- `purgeExpiredStudentIds()` runs daily at about 03:00 (installed by `studentFinishSetup`). It moves expired ID files to the Drive trash; Drive empties the trash after 30 days (you can empty it sooner).
  The sheet shows *ID deleted on*. Preview first with `studentPreviewPurge()` (deletes nothing).
- You can also delete any ID file by hand in Drive at any time.
- Application details (name, phone, ...) stay in the sheet until you delete the rows.

## Setup

1. **Project Settings → Script properties → Add** these four (they stay in your account; none is committed):
   `STUDENT_TEAM_EDITORS` (comma-separated Google addresses of reviewers),
   `STUDENT_LINK_ACTING`, `STUDENT_LINK_FILMMAKING`, `STUDENT_LINK_COMBO` (the three student-only `https://rzp.io/rzp/...` links).
2. In the project, add a new file `Student.gs` with the contents of `student-setup.gs`, and replace `appsscript.json` with the one in this folder.
   It now also asks for **Drive** access (to protect and delete the uploaded ID files) and permission to **create triggers**.
   Run `studentCheckProperties` once. It checks that the four values exist, that the links look right and that the three links differ.
3. Run **`studentCreateAll`**. It creates the forms and spreadsheet, links each form to its tab, writes each form's confirmation message
   (its own student link, a clickable URL, and the "payment does not guarantee eligibility" sentence), shares with your team only, and
   logs the links. Copy the `STUDENT RESULTS` and `STUDENT VERIFY` blocks back to the developer (public form links only).
4. **Add the upload question to each of the three forms** (open the *edit* link from the log):
   *Add question → File upload*. Title exactly `School/college ID card`. Turn **Required** on. Allow only specific file types: **PDF** and **Image**.
   Maximum number of files **1**. Maximum file size **10 MB**. Drag it directly under the heading "Upload your school/college ID card" and above "Confirmation".
   Google will ask you to confirm that respondents must sign in: Continue.
5. Run **`studentFinishSetup`**. It refuses until every form has the upload question. Then it adds the review columns (Application ID, Workshop,
   ID document link, **Application Status**, **Payment Status**, Internal team notes, Decision date, ID deleted on) with dropdowns, builds the
   Summary, installs the triggers (new rows automatically start as *Pending Verification* / *Payment Pending*), and secures the upload folders.
6. **Test by hand** (the upload cannot be scripted): open each form's public link, sign in, fill it in with a name starting with `TEST` and upload a
   small PDF or JPG. Check that the confirmation page shows the right student link, then run **`studentAuditAfterTests`** and look at the sheet.
   Finally run **`studentCleanupTests`** (removes the test rows, responses and ID files).

## Reviewing in the sheet

Each row is one complete application. Change *Application Status* (Pending Verification / Approved / Rejected) and *Payment Status*
(Payment Pending / Payment Confirmed) from the dropdowns, and write private comments in *Internal team notes*.
Payment is never marked automatically: check Razorpay, then set Payment Confirmed. Payment never replaces ID verification.
