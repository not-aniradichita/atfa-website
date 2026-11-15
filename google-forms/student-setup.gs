/**
 * Aniradichita Theatre & Films Association: STUDENT workshop applications (Google Forms + Google Sheets).
 *
 * Add this file to the SAME Apps Script project as registration-setup.gs. It does not touch the regular forms or the regular
 * spreadsheet: every name below starts with "student"/"STUDENT" so nothing clashes.
 *
 * No email address and no payment link is written in this file. They are read from Script Properties
 * (Project Settings -> Script properties), which stay inside your Google account:
 *
 *   STUDENT_TEAM_EDITORS     comma-separated Google addresses of the people who may review applications and see the IDs
 *   STUDENT_LINK_ACTING      student-only Razorpay link for the Acting Workshop
 *   STUDENT_LINK_FILMMAKING  student-only Razorpay link for the Filmmaking Workshop
 *   STUDENT_LINK_COMBO       student-only Razorpay link for the Acting + Filmmaking Combo
 *
 * Order of work (see README.md):
 *   1. studentCheckProperties()  checks the four properties
 *   2. studentCreateAll()        creates 3 forms + the spreadsheet, links them, sets confirmation messages
 *   3. (by hand)                 add the "School/college ID card" file-upload question to each form: Apps Script cannot create it
 *   4. studentFinishSetup()      adds the review columns, dropdowns, Summary, automatic defaults, ID-folder protection, retention job
 *   5. (by hand)                 submit one real test per form, then studentAuditAfterTests(), then studentCleanupTests()
 */

const STUDENT_CONFIG = {
  spreadsheetName: 'Aniradichita – Student Workshop Applications',
  timeZone: 'Asia/Kolkata',
  uploadTitle: 'School/college ID card',
  consentTitle: 'Confirmation',
  consentText:
    'I confirm that the information provided is correct and that I am submitting my school/college ID for student eligibility verification by Aniradichita Theatre & Films Association.',
  retentionDaysAfterDecision: 30,
  retentionHardStop: '2026-12-22T00:00:00+05:30',
  statuses: ['Pending Verification', 'Approved', 'Rejected'],
  paymentStatuses: ['Payment Pending', 'Payment Confirmed'],
  workshops: [
    { key: 'acting', formTitle: 'Student – Acting Workshop | Aniradichita', tab: 'Acting Student Applications', workshop: 'Acting Workshop',
      dates: '20–21 November 2026 (Friday and Saturday)', idPrefix: 'SA-ACT-', linkProp: 'STUDENT_LINK_ACTING' },
    { key: 'filmmaking', formTitle: 'Student – Filmmaking Workshop | Aniradichita', tab: 'Filmmaking Student Applications', workshop: 'Filmmaking Workshop',
      dates: '22 November 2026 (Sunday)', idPrefix: 'SA-FILM-', linkProp: 'STUDENT_LINK_FILMMAKING' },
    { key: 'combo', formTitle: 'Student – Acting + Filmmaking Combo | Aniradichita', tab: 'Combo Student Applications', workshop: 'Acting + Filmmaking Combo (both workshops)',
      dates: '20–22 November 2026 (Friday to Sunday)', idPrefix: 'SA-COMBO-', linkProp: 'STUDENT_LINK_COMBO' },
  ],
};
const STUDENT_PROP = 'ATFA_STUDENT_SETUP';
const STUDENT_REVIEW_HEADERS = ['Application ID', 'Workshop', 'ID document link', 'Application Status', 'Payment Status', 'Internal team notes', 'Decision date', 'ID deleted on'];

// ───────────────────────── 0. properties ─────────────────────────
function studentReadProps_() {
  const p = PropertiesService.getScriptProperties();
  const editors = (p.getProperty('STUDENT_TEAM_EDITORS') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const links = {};
  STUDENT_CONFIG.workshops.forEach((w) => { links[w.key] = (p.getProperty(w.linkProp) || '').trim(); });
  return { editors: editors, links: links };
}

function studentCheckProperties() {
  const { editors, links } = studentReadProps_();
  const problems = [];
  if (!editors.length) problems.push('STUDENT_TEAM_EDITORS is empty (comma-separated Google addresses).');
  const seen = {};
  STUDENT_CONFIG.workshops.forEach((w) => {
    const u = links[w.key];
    if (!/^https:\/\/rzp\.io\/rzp\/[A-Za-z0-9_-]+$/.test(u)) problems.push(w.linkProp + ' is missing or is not a https://rzp.io/rzp/... link.');
    if (u && seen[u]) problems.push(w.linkProp + ' is the same link as ' + seen[u] + '. The three links must be different.');
    seen[u] = w.linkProp;
  });
  if (problems.length) throw new Error('Fix these Script properties first:\n- ' + problems.join('\n- '));
  Logger.log('Properties OK: ' + editors.length + ' team editor(s), 3 different student links.');
  return true;
}

// ───────────────────────── 1. create forms + spreadsheet ─────────────────────────
function studentCreateAll() {
  studentCheckProperties();
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(STUDENT_PROP)) {
    throw new Error('The student setup already ran. Run studentShowResults() for the links. To start over, delete the files in Drive first, then run studentResetSetup().');
  }
  const { editors, links } = studentReadProps_();

  const ss = SpreadsheetApp.create(STUDENT_CONFIG.spreadsheetName);
  ss.setSpreadsheetTimeZone(STUDENT_CONFIG.timeZone);
  const result = { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), forms: {} };
  const known = new Set(ss.getSheets().map((s) => s.getSheetId()));

  STUDENT_CONFIG.workshops.forEach((w) => {
    const form = studentBuildForm_(w, links[w.key]);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    SpreadsheetApp.flush();
    Utilities.sleep(2000);
    let linked = null;
    for (let i = 0; i < 6 && !linked; i++) {
      linked = ss.getSheets().filter((s) => !known.has(s.getSheetId()))[0] || null;
      if (!linked) Utilities.sleep(1500);
    }
    if (!linked) throw new Error('Could not find the response sheet created for ' + w.formTitle);
    known.add(linked.getSheetId());
    linked.setName(w.tab);
    result.forms[w.key] = { title: w.formTitle, id: form.getId(), url: form.getPublishedUrl(), editUrl: form.getEditUrl(), tab: w.tab };
  });

  const blank = ss.getSheetByName('Sheet1');
  if (blank && ss.getSheets().length > 1) ss.deleteSheet(blank);

  // spreadsheet and forms: shared with the team only (never "anyone with the link")
  result.sharing = editors.map((email) => {
    const r = { editor: studentMask_(email), spreadsheet: true, forms: {}, error: '' };
    try { ss.addEditor(email); } catch (e) { r.spreadsheet = false; r.error += String(e && e.message || e); }
    STUDENT_CONFIG.workshops.forEach((w) => {
      try { FormApp.openById(result.forms[w.key].id).addEditor(email); r.forms[w.key] = true; } catch (e) { r.forms[w.key] = false; r.error += ' | ' + String(e && e.message || e); }
    });
    return r;
  });

  props.setProperty(STUDENT_PROP, JSON.stringify(result));
  SpreadsheetApp.flush();
  Logger.log('=== STUDENT FORMS CREATED ===');
  studentShowResults();
  studentVerifyForms();
  Logger.log('NEXT: open each form with its "edit" link above and add the file-upload question (STUDENT_README.md, step 4). Then run studentFinishSetup().');
}

function studentBuildForm_(w, payUrl) {
  const form = FormApp.create(w.formTitle);
  form.setDescription(
    'Aniradichita Theatre & Films Association presents the Acting & Filmmaking Workshop.\n\n' +
    'STUDENT APPLICATION\n' +
    'Workshop: ' + w.workshop + '\n' +
    'Dates: ' + w.dates + '\n\n' +
    'Who can apply: school and college students with a valid school or college ID card. You do not need to choose the workshop again: this form is only for the ' + w.workshop + '.\n\n' +
    'How it works: 1) fill in this form and upload your ID card, 2) our team reviews your application, 3) after you submit you will see your student payment link. ' +
    'Paying does not by itself guarantee eligibility or a place: your participation is subject to student eligibility verification and successful payment.\n\n' +
    'ID card upload: please upload a clear PDF, JPG, JPEG or PNG, ideally smaller than 5 MB. The upload is required. Google asks you to sign in to a Google account to upload a file.\n\n' +
    'Privacy: we collect your ID card only to check that you are a student. It is stored privately in Google Drive, is never shown on the website, and can be opened only by authorised Aniradichita team members. ' +
    'We delete it within ' + STUDENT_CONFIG.retentionDaysAfterDecision + ' days after we decide on your application, and by 22 December 2026 at the latest.\n\n' +
    'Not a student? Please use the regular registration options on the event page: aniradichita.com/events/acting-filmmaking-workshop'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);
  form.setConfirmationMessage(
    'Thank you for applying for the Aniradichita ' + w.workshop + '!\n\n' +
    'Your application has been received.\n\n' +
    'To proceed with student registration, complete your payment using this link:\n\n' +
    payUrl + '\n\n' +
    'Your participation is subject to student eligibility verification and successful payment. Paying does not by itself guarantee eligibility or a place.'
  );

  form.addTextItem().setTitle('Full name').setRequired(true);
  form.addTextItem().setTitle('Email address').setRequired(true).setValidation(
    FormApp.createTextValidation().setHelpText('Please enter a valid email address, like name@example.com.').requireTextIsEmail().build());
  form.addTextItem().setTitle('Phone number').setRequired(true).setValidation(
    FormApp.createTextValidation().setHelpText('Please enter a valid phone number (digits, spaces, + and - are fine).').requireTextMatchesPattern('^[0-9+()\\-\\s.]{7,20}$').build());
  form.addTextItem().setTitle('City').setRequired(true);
  form.addTextItem().setTitle('School/college name').setRequired(true);
  form.addTextItem().setTitle('Course/class and year of study').setRequired(true);

  // The file-upload question goes right under this heading, added by hand (Apps Script cannot create it).
  form.addSectionHeaderItem()
    .setTitle('Upload your school/college ID card')
    .setHelpText('Required. Accepted: PDF, JPG, JPEG or PNG, ideally under 5 MB. Used only to verify that you are a student. Stored privately and visible only to authorised team members. Deleted after verification.');

  const box = form.addCheckboxItem();
  box.setTitle(STUDENT_CONFIG.consentTitle).setRequired(true);
  box.setChoices([box.createChoice(STUDENT_CONFIG.consentText)]);

  if (typeof form.setPublished === 'function') form.setPublished(true);
  form.setAcceptingResponses(true);
  return form;
}

function studentMask_(email) { // logs never print full addresses
  const [u, d] = String(email).split('@');
  return (u ? u.slice(0, 1) : '') + '***@' + (d || '');
}

function studentVerifyForms() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const { links } = studentReadProps_();
  const report = STUDENT_CONFIG.workshops.map((w) => {
    const f = FormApp.openById(data.forms[w.key].id);
    const msg = f.getConfirmationMessage();
    const others = STUDENT_CONFIG.workshops.filter((o) => o.key !== w.key).map((o) => links[o.key]);
    const items = f.getItems();
    return {
      form: w.formTitle,
      destinationIsSheet: f.getDestinationId() === ss.getId(),
      tabExists: !!ss.getSheetByName(w.tab),
      confirmationHasOwnStudentLink: msg.indexOf(links[w.key]) !== -1,
      confirmationHasAnyOtherStudentLink: others.some((u) => msg.indexOf(u) !== -1),
      confirmationMentionsRegularRazorpay: /pages\.razorpay\.com/.test(msg),
      descriptionNamesWorkshop: f.getDescription().indexOf(w.workshop) !== -1,
      fieldTitles: items.map((i) => i.getTitle()),
      hasFileUploadQuestion: items.some((i) => String(i.getType()) === 'FILE_UPLOAD'),
      acceptingResponses: f.isAcceptingResponses(),
    };
  });
  Logger.log('STUDENT VERIFY ' + JSON.stringify(report, null, 2));
  return report;
}

function studentShowResults() {
  const raw = PropertiesService.getScriptProperties().getProperty(STUDENT_PROP);
  if (!raw) { Logger.log('Student setup has not run yet. Run studentCreateAll() first.'); return; }
  const d = JSON.parse(raw);
  Logger.log('STUDENT RESULTS ' + JSON.stringify({
    spreadsheetUrl: d.spreadsheetUrl,
    forms: Object.keys(d.forms).reduce((o, k) => { o[k] = { public: d.forms[k].url, edit: d.forms[k].editUrl }; return o; }, {}),
    sharing: d.sharing,
  }, null, 2));
}

// ───────────────────────── 2. finish: review columns, dropdowns, summary, triggers, ID protection ─────────────────────────
function studentFinishSetup() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP) || 'null');
  if (!data) throw new Error('Run studentCreateAll() first.');
  const ss = SpreadsheetApp.openById(data.spreadsheetId);

  // every form must now have the upload question, and its answer column must exist in the sheet
  const missing = [];
  STUDENT_CONFIG.workshops.forEach((w) => {
    const f = FormApp.openById(data.forms[w.key].id);
    const up = f.getItems().filter((i) => String(i.getType()) === 'FILE_UPLOAD');
    if (up.length !== 1) missing.push(w.formTitle + ': add exactly one file-upload question');
    else if (up[0].getTitle() !== STUDENT_CONFIG.uploadTitle) missing.push(w.formTitle + ': rename the upload question to exactly "' + STUDENT_CONFIG.uploadTitle + '"');
    const sh = ss.getSheetByName(w.tab);
    if (!studentCol_(sh, STUDENT_CONFIG.uploadTitle)) missing.push(w.tab + ': the upload column is not in the sheet yet (open the form once, or submit it once)');
  });
  if (missing.length) throw new Error('Not ready yet:\n- ' + missing.join('\n- '));

  const cols = {};
  STUDENT_CONFIG.workshops.forEach((w) => { cols[w.key] = studentAddReviewColumns_(ss.getSheetByName(w.tab), w); });
  studentBuildSummary_(ss, cols);
  ss.setActiveSheet(ss.getSheetByName('Summary'));
  ss.moveActiveSheet(1);

  studentInstallTriggers_(ss);
  STUDENT_CONFIG.workshops.forEach((w) => studentEnsureDefaults_(ss.getSheetByName(w.tab)));
  const folders = studentSecureUploadFolders();

  const state = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP));
  state.finished = true; state.columns = cols;
  PropertiesService.getScriptProperties().setProperty(STUDENT_PROP, JSON.stringify(state));
  SpreadsheetApp.flush();
  Logger.log('STUDENT FINISH ' + JSON.stringify({ reviewColumns: cols, uploadFolders: folders }, null, 2));
  studentVerifyForms();
}

function studentCol_(sheet, header) {
  if (!sheet || sheet.getLastColumn() < 1) return 0;
  const row = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let i = 0; i < row.length; i++) if (String(row[i]).trim() === header) return i + 1;
  return 0;
}
function studentLetter_(sheet, col) { return sheet.getRange(1, col).getA1Notation().replace(/\d+/g, ''); }

// Review columns go after the last answer column. The first header cell of each formula column holds one ARRAYFORMULA so new rows fill themselves.
function studentAddReviewColumns_(sheet, w) {
  const existing = {};
  STUDENT_REVIEW_HEADERS.forEach((h) => { existing[h] = studentCol_(sheet, h); });
  let start = sheet.getLastColumn() + 1;
  if (Object.keys(existing).some((h) => existing[h])) throw new Error(w.tab + ' already has review columns. Nothing was changed.');

  const upCol = studentLetter_(sheet, studentCol_(sheet, STUDENT_CONFIG.uploadTitle));
  const q = (s) => '"' + s.replace(/"/g, '""') + '"';
  const pos = {};
  STUDENT_REVIEW_HEADERS.forEach((h, i) => { pos[h] = start + i; });

  sheet.getRange(1, pos['Application ID']).setFormula('={"Application ID"; ARRAYFORMULA(IF($A$2:$A="","",' + q(w.idPrefix) + '&TEXT($A$2:$A,"yymmdd-hhmmss")))}');
  sheet.getRange(1, pos['Workshop']).setFormula('={"Workshop"; ARRAYFORMULA(IF($A$2:$A="","",' + q(w.workshop) + '))}');
  sheet.getRange(1, pos['ID document link']).setFormula('={"ID document link"; ARRAYFORMULA(IF($A$2:$A="","",' + upCol + '$2:' + upCol + '))}');
  ['Application Status', 'Payment Status', 'Internal team notes', 'Decision date', 'ID deleted on'].forEach((h) => sheet.getRange(1, pos[h]).setValue(h));
  sheet.getRange(1, start, 1, STUDENT_REVIEW_HEADERS.length).setFontWeight('bold').setBackground('#fde9d0');

  const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(STUDENT_CONFIG.statuses, true).setAllowInvalid(false).build();
  const payRule = SpreadsheetApp.newDataValidation().requireValueInList(STUDENT_CONFIG.paymentStatuses, true).setAllowInvalid(false).build();
  sheet.getRange(2, pos['Application Status'], 2000, 1).setDataValidation(statusRule);
  sheet.getRange(2, pos['Payment Status'], 2000, 1).setDataValidation(payRule);
  sheet.getRange(2, pos['Decision date'], 2000, 1).setNumberFormat('dd mmm yyyy, hh:mm');
  sheet.getRange(2, pos['ID deleted on'], 2000, 1).setNumberFormat('dd mmm yyyy, hh:mm');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(pos['ID document link'], 260);
  sheet.setColumnWidth(pos['Internal team notes'], 280);
  return pos;
}

function studentBuildSummary_(ss, cols) {
  const old = ss.getSheetByName('Summary'); if (old) ss.deleteSheet(old);
  const sh = ss.insertSheet('Summary');
  const ref = (w, header) => {
    const s = ss.getSheetByName(w.tab);
    const L = studentLetter_(s, cols[w.key][header]);
    return "'" + w.tab + "'!" + L + '2:' + L;
  };
  const times = (w) => "'" + w.tab + "'!A2:A";
  const sum = (fn) => '=' + STUDENT_CONFIG.workshops.map(fn).join('+');
  const W = STUDENT_CONFIG.workshops;

  // strings that start with "=" are stored as formulas; every number below is computed from the response rows
  sh.getRange(1, 1, 7, 2).setValues([
    ['Headline numbers', 'Value'],
    ['Total student applications', sum((w) => 'COUNTA(' + times(w) + ')')],
    ['Acting applications', '=COUNTA(' + times(W[0]) + ')'],
    ['Filmmaking applications', '=COUNTA(' + times(W[1]) + ')'],
    ['Combo applications', '=COUNTA(' + times(W[2]) + ')'],
    ['Payment pending', '=B2-B7'], // everything not confirmed; a blank payment cell counts as pending
    ['Payment confirmed', sum((w) => 'COUNTIF(' + ref(w, 'Payment Status') + ',"Payment Confirmed")')],
  ]);

  sh.getRange('A10:G10').setValues([['By workshop', 'Applications', 'Pending Verification', 'Approved', 'Rejected', 'Payment Pending', 'Payment Confirmed']]);
  const rows = W.map((w, i) => {
    const r = 11 + i;
    return [
      w.workshop,
      '=COUNTA(' + times(w) + ')',
      '=B' + r + '-D' + r + '-E' + r,
      '=COUNTIF(' + ref(w, 'Application Status') + ',"Approved")',
      '=COUNTIF(' + ref(w, 'Application Status') + ',"Rejected")',
      '=B' + r + '-G' + r,
      '=COUNTIF(' + ref(w, 'Payment Status') + ',"Payment Confirmed")',
    ];
  });
  sh.getRange(11, 1, rows.length, 7).setValues(rows);
  sh.getRange('A14:G14').setValues([['Total', '=SUM(B11:B13)', '=SUM(C11:C13)', '=SUM(D11:D13)', '=SUM(E11:E13)', '=SUM(F11:F13)', '=SUM(G11:G13)']]);
  sh.getRange('A1:B1').setFontWeight('bold').setBackground('#1b0c0d').setFontColor('#ffffff');
  sh.getRange('A10:G10').setFontWeight('bold').setBackground('#1b0c0d').setFontColor('#ffffff');
  sh.getRange('A14:G14').setFontWeight('bold');
  sh.setColumnWidth(1, 300); sh.setColumnWidths(2, 6, 150);

  sh.getRange('A17:A21').setValues([
    ['How to review'],
    ['Open the workshop tab. Each row is one complete application. Click the link in "ID document link" to open the ID (only team members with access can open it).'],
    ['New rows start as Pending Verification and Payment Pending. Change them from the dropdowns. Write private comments in Internal team notes.'],
    ['Payment is never marked automatically. After checking Razorpay, set Payment Status to Payment Confirmed. Payment never replaces ID verification.'],
    ['IDs are deleted automatically 30 days after you set Approved or Rejected, and in any case on 22 December 2026. "ID deleted on" shows when.'],
  ]);
  sh.getRange('A17').setFontWeight('bold');
}

// ───────────────────────── 3. automatic behaviour (triggers) ─────────────────────────
function studentInstallTriggers_(ss) {
  const handlers = ['onStudentFormSubmit', 'onStudentEdit', 'purgeExpiredStudentIds'];
  ScriptApp.getProjectTriggers().forEach((t) => { if (handlers.indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onStudentFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  ScriptApp.newTrigger('onStudentEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('purgeExpiredStudentIds').timeBased().everyDays(1).atHour(3).create();
}

function studentTabNames_() { return STUDENT_CONFIG.workshops.map((w) => w.tab); }

function studentEnsureDefaults_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return;
  const cS = studentCol_(sheet, 'Application Status'); const cP = studentCol_(sheet, 'Payment Status');
  if (!cS || !cP) return;
  const ts = sheet.getRange(2, 1, last - 1, 1).getValues();
  const st = sheet.getRange(2, cS, last - 1, 1).getValues();
  const pay = sheet.getRange(2, cP, last - 1, 1).getValues();
  for (let i = 0; i < ts.length; i++) {
    if (ts[i][0] === '') continue;
    if (st[i][0] === '') sheet.getRange(i + 2, cS).setValue('Pending Verification');
    if (pay[i][0] === '') sheet.getRange(i + 2, cP).setValue('Payment Pending');
  }
}

// every new application starts as Pending Verification + Payment Pending
function onStudentFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = e && e.range ? e.range.getSheet() : null;
    if (sheet && studentTabNames_().indexOf(sheet.getName()) !== -1) studentEnsureDefaults_(sheet);
  } finally { lock.releaseLock(); }
}

// stamp the decision date when the team sets Approved / Rejected (starts the 30-day ID retention clock)
function onStudentEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (studentTabNames_().indexOf(sheet.getName()) === -1 || e.range.getRow() < 2 || e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  const cS = studentCol_(sheet, 'Application Status'); const cD = studentCol_(sheet, 'Decision date');
  if (!cS || !cD || e.range.getColumn() !== cS) return;
  const v = String(e.range.getValue());
  const cell = sheet.getRange(e.range.getRow(), cD);
  if ((v === 'Approved' || v === 'Rejected') && cell.getValue() === '') cell.setValue(new Date());
  if (v === 'Pending Verification') cell.clearContent();
}

// ───────────────────────── 4. ID documents: private folders, access audit, retention ─────────────────────────
function studentSecureUploadFolders() {
  const { editors } = studentReadProps_();
  const report = [];
  STUDENT_CONFIG.workshops.forEach((w) => {
    const name = w.formTitle + ' (File responses)';
    const it = DriveApp.getFoldersByName(name);
    if (!it.hasNext()) { report.push({ folder: name, found: false, action: 'Not found. Share it manually (see README) after the first upload.' }); return; }
    const folder = it.next();
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW); // never public, never "anyone with the link"
    const added = [];
    editors.forEach((email) => { try { folder.addViewer(email); added.push(studentMask_(email)); } catch (err) { added.push(studentMask_(email) + ' FAILED'); } });
    report.push({ folder: name, found: true, access: String(folder.getSharingAccess()), viewers: added });
  });
  Logger.log('UPLOAD FOLDERS ' + JSON.stringify(report, null, 2));
  return report;
}

function studentIdsInCell_(value) {
  const ids = []; const re = /id=([-\w]{20,})/g; let m;
  while ((m = re.exec(String(value))) !== null) ids.push(m[1]);
  return ids;
}

// Lists every stored ID file and its sharing level. Anything public or link-shared is reported as a problem.
function studentAuditIdAccess() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const out = []; let problems = 0;
  STUDENT_CONFIG.workshops.forEach((w) => {
    const sh = ss.getSheetByName(w.tab); const c = studentCol_(sh, STUDENT_CONFIG.uploadTitle);
    if (!c || sh.getLastRow() < 2) return;
    sh.getRange(2, c, sh.getLastRow() - 1, 1).getValues().forEach((r, i) => {
      studentIdsInCell_(r[0]).forEach((id) => {
        try {
          const f = DriveApp.getFileById(id); const access = String(f.getSharingAccess());
          const bad = access === 'ANYONE' || access === 'ANYONE_WITH_LINK' || access === 'DOMAIN' || access === 'DOMAIN_WITH_LINK';
          if (bad) problems++;
          out.push({ tab: w.tab, row: i + 2, mime: f.getMimeType(), sizeKB: Math.round(f.getSize() / 1024), access: access, viewers: f.getViewers().length, editors: f.getEditors().length, problem: bad });
        } catch (err) { out.push({ tab: w.tab, row: i + 2, error: 'cannot open (deleted?)' }); }
      });
    });
  });
  Logger.log('ID ACCESS AUDIT ' + JSON.stringify({ files: out, publicOrLinkSharedCount: problems }, null, 2));
  return problems;
}

// Which IDs would be deleted right now? Nothing is deleted.
function studentPreviewPurge() { return studentPurge_(true); }
// Runs daily at about 03:00 (installed by studentFinishSetup). Moves expired ID files to the Drive trash (Drive empties the trash after 30 days).
function purgeExpiredStudentIds() { return studentPurge_(false); }

function studentPurge_(dry) {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP) || 'null');
  if (!data || !data.finished) { Logger.log('Student setup is not finished; nothing to purge.'); return 0; }
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const now = new Date();
  const hard = new Date(STUDENT_CONFIG.retentionHardStop);
  const keepMs = STUDENT_CONFIG.retentionDaysAfterDecision * 24 * 3600 * 1000;
  let deleted = 0; const log = [];
  STUDENT_CONFIG.workshops.forEach((w) => {
    const sh = ss.getSheetByName(w.tab); if (!sh || sh.getLastRow() < 2) return;
    const cU = studentCol_(sh, STUDENT_CONFIG.uploadTitle), cD = studentCol_(sh, 'Decision date'), cX = studentCol_(sh, 'ID deleted on');
    if (!cU || !cD || !cX) return;
    const n = sh.getLastRow() - 1;
    const up = sh.getRange(2, cU, n, 1).getValues(); const dec = sh.getRange(2, cD, n, 1).getValues(); const done = sh.getRange(2, cX, n, 1).getValues();
    for (let i = 0; i < n; i++) {
      if (!up[i][0] || done[i][0] !== '') continue;
      const decided = dec[i][0] instanceof Date ? dec[i][0] : null;
      const expired = now >= hard || (decided && now.getTime() - decided.getTime() >= keepMs);
      if (!expired) continue;
      const ids = studentIdsInCell_(up[i][0]);
      let ok = true;
      ids.forEach((id) => { try { if (!dry) DriveApp.getFileById(id).setTrashed(true); } catch (err) { ok = false; log.push(w.tab + ' row ' + (i + 2) + ': could not delete (' + err + ')'); } });
      if (ok) { deleted += ids.length; log.push(w.tab + ' row ' + (i + 2) + ': ' + ids.length + ' file(s) ' + (dry ? 'WOULD be deleted' : 'moved to trash')); if (!dry) sh.getRange(i + 2, cX).setValue(now); }
    }
  });
  Logger.log((dry ? 'PURGE PREVIEW' : 'PURGE') + ' ' + JSON.stringify({ files: deleted, notes: log }, null, 2));
  return deleted;
}

// ───────────────────────── 5. tests (the upload step is manual) ─────────────────────────
// After you submit one real test application per form in a browser (use a name starting with TEST), run this to inspect the result.
function studentAuditAfterTests() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const out = {};
  STUDENT_CONFIG.workshops.forEach((w) => {
    const sh = ss.getSheetByName(w.tab);
    const last = sh.getLastRow();
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
    const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, sh.getLastColumn()).getDisplayValues();
    out[w.key] = { tab: w.tab, headers: headers, rowCount: rows.length, testRows: rows.filter((r) => /^TEST/i.test(r[headers.indexOf('Full name')] || '')) };
  });
  Logger.log('AFTER TESTS ' + JSON.stringify(out, null, 2));
  Logger.log('SUMMARY ' + JSON.stringify(ss.getSheetByName('Summary').getRange('A1:G14').getDisplayValues()));
  studentAuditIdAccess();
}

// Removes the test applications: rows whose name starts with TEST, their form responses and their ID files.
function studentCleanupTests() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(STUDENT_PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  let rows = 0, responses = 0, files = 0;
  STUDENT_CONFIG.workshops.forEach((w) => {
    const sh = ss.getSheetByName(w.tab); const cN = studentCol_(sh, 'Full name'); const cU = studentCol_(sh, STUDENT_CONFIG.uploadTitle);
    if (sh.getLastRow() >= 2) {
      const names = sh.getRange(2, cN, sh.getLastRow() - 1, 1).getValues(); const ups = sh.getRange(2, cU, sh.getLastRow() - 1, 1).getValues();
      for (let i = names.length - 1; i >= 0; i--) {
        if (/^TEST/i.test(String(names[i][0]))) {
          studentIdsInCell_(ups[i][0]).forEach((id) => { try { DriveApp.getFileById(id).setTrashed(true); files++; } catch (err) { /* already gone */ } });
          sh.deleteRow(i + 2); rows++;
        }
      }
    }
    const f = FormApp.openById(data.forms[w.key].id);
    f.getResponses().forEach((r) => {
      const first = r.getItemResponses().filter((x) => x.getItem().getTitle() === 'Full name')[0];
      if (first && /^TEST/i.test(String(first.getResponse()))) { f.deleteResponse(r.getId()); responses++; }
    });
  });
  SpreadsheetApp.flush();
  Logger.log('Removed ' + rows + ' test row(s), ' + responses + ' form response(s) and ' + files + ' ID file(s) (moved to Drive trash).');
}

// Only if you deleted the student files in Drive and want to run studentCreateAll() again.
function studentResetSetup() {
  PropertiesService.getScriptProperties().deleteProperty(STUDENT_PROP);
}
