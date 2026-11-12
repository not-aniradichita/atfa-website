/**
 * Aniradichita Theatre & Films Association: regular workshop registration setup.
 *
 * Runs inside YOUR Google account (Google Apps Script), so no password, OAuth secret or refresh token
 * ever leaves Google and nothing is stored in this repository. See README.md in this folder.
 *
 * What createAll() makes (in the account that runs it):
 *   - 3 Google Forms: Acting, Filmmaking, Acting + Filmmaking Combo (same fields, workshop fixed in the description,
 *     confirmation message carrying that workshop's regular Razorpay link)
 *   - 1 Google Sheet "Aniradichita – Acting & Filmmaking Workshop Registrations" with tabs
 *     Summary, Acting Registrations, Filmmaking Registrations, Combo Registrations (each form linked to its tab)
 *   - formulas for Workshop / Form Submitted / Payment Pending / Payment Confirmed and the Summary counts
 *   - editor access for the team (if Google accepts those addresses)
 *
 * Then run runTests() (submits one clearly marked response per form and checks the sheet) and cleanupTests().
 * Nothing here marks a payment as received: Google Forms only records form submissions.
 */

const CONFIG = {
  spreadsheetName: 'Aniradichita – Acting & Filmmaking Workshop Registrations',
  timeZone: 'Asia/Kolkata',
  editors: ['team@aniradichita.com', 'medhathakkar27@gmail.com'],
  confirmationText:
    'I confirm that the information provided is correct and understand that my registration will be completed after successful payment.',
  workshops: [
    {
      key: 'acting',
      formTitle: 'Acting Workshop Registration | Aniradichita',
      tab: 'Acting Registrations',
      workshop: 'Acting Workshop',
      dates: '20–21 November 2026 (Friday and Saturday)',
      summaryDates: '20–21 Nov 2026',
      payUrl: 'https://pages.razorpay.com/ACWP',
    },
    {
      key: 'filmmaking',
      formTitle: 'Filmmaking Workshop Registration | Aniradichita',
      tab: 'Filmmaking Registrations',
      workshop: 'Filmmaking Workshop',
      dates: '22 November 2026 (Sunday)',
      summaryDates: '22 Nov 2026',
      payUrl: 'https://pages.razorpay.com/ATFAFMWS',
    },
    {
      key: 'combo',
      formTitle: 'Acting + Filmmaking Combo Registration | Aniradichita',
      tab: 'Combo Registrations',
      workshop: 'Acting + Filmmaking Combo (both workshops)',
      dates: '20–22 November 2026 (Friday to Sunday)',
      summaryDates: '20–22 Nov 2026',
      payUrl: 'https://pages.razorpay.com/Acting&Filmmaking',
    },
  ],
};

const PROP = 'ATFA_REGISTRATION_SETUP';

// ───────────────────────── 1. create everything ─────────────────────────
function createAll() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(PROP)) {
    throw new Error('Setup already ran in this script project. Run showResults() to see the links. To start over, delete the files in Drive first and run resetSetup().');
  }

  const ss = SpreadsheetApp.create(CONFIG.spreadsheetName);
  ss.setSpreadsheetTimeZone(CONFIG.timeZone);
  const result = { spreadsheetId: ss.getId(), spreadsheetUrl: ss.getUrl(), forms: {} };
  const knownSheets = new Set(ss.getSheets().map((s) => s.getSheetId()));

  CONFIG.workshops.forEach((w) => {
    const form = buildForm(w);
    form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
    SpreadsheetApp.flush();
    Utilities.sleep(2000);

    // the sheet Google just created for this form is the one that was not there before
    let linked = null;
    for (let attempt = 0; attempt < 6 && !linked; attempt++) {
      linked = ss.getSheets().filter((s) => !knownSheets.has(s.getSheetId()))[0] || null;
      if (!linked) Utilities.sleep(1500);
    }
    if (!linked) throw new Error('Could not find the response sheet created for ' + w.formTitle);
    knownSheets.add(linked.getSheetId());
    linked.setName(w.tab);
    addTrackingColumns(linked, w);

    result.forms[w.key] = {
      title: w.formTitle,
      id: form.getId(),
      url: form.getPublishedUrl(),
      editUrl: form.getEditUrl(),
      tab: w.tab,
      sheetId: linked.getSheetId(),
    };
  });

  buildSummary(ss, result);
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
  ss.setActiveSheet(ss.getSheetByName('Summary'));
  ss.moveActiveSheet(1);

  result.sharing = shareWithTeam(ss, result);
  props.setProperty(PROP, JSON.stringify(result));
  SpreadsheetApp.flush();

  Logger.log('=== SETUP COMPLETE: copy everything between the markers back to the developer ===');
  showResults();
  verifySetup();
}

function buildForm(w) {
  const form = FormApp.create(w.formTitle);
  form.setDescription(
    'Aniradichita Theatre & Films Association presents the Acting & Filmmaking Workshop.\n\n' +
    'Workshop: ' + w.workshop + '\n' +
    'Dates: ' + w.dates + '\n\n' +
    'Please fill in your details below. You do not need to choose the workshop again: this form is only for the ' + w.workshop + '.\n\n' +
    'After you submit, you will see a payment link. Your participation is confirmed only after successful payment.\n\n' +
    'Are you a school or college student? Please use the Student Registration option on the event page instead: aniradichita.com/events/acting-filmmaking-workshop'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setProgressBar(false);
  form.setConfirmationMessage(
    'Thank you for registering with Aniradichita!\n\n' +
    'Your registration details have been recorded.\n\n' +
    'To proceed, complete your payment for the ' + w.workshop + ' using the link below:\n\n' +
    w.payUrl + '\n\n' +
    'Your participation is confirmed only after successful payment.'
  );

  form.addTextItem().setTitle('Full name').setRequired(true);

  const email = form.addTextItem().setTitle('Email address').setRequired(true);
  email.setValidation(
    FormApp.createTextValidation().setHelpText('Please enter a valid email address, like name@example.com.').requireTextIsEmail().build()
  );

  const phone = form.addTextItem().setTitle('Phone number').setRequired(true);
  phone.setValidation(
    FormApp.createTextValidation().setHelpText('Please enter a valid phone number (digits, spaces, + and - are fine).').requireTextMatchesPattern('^[0-9+()\\-\\s.]{7,20}$').build()
  );

  form.addTextItem().setTitle('City').setRequired(true);
  form.addTextItem().setTitle('School / College / Organisation (optional)').setRequired(false);

  const box = form.addCheckboxItem();
  box.setTitle('Confirmation').setRequired(true);
  box.setChoices([box.createChoice(CONFIG.confirmationText)]);

  if (typeof form.setPublished === 'function') form.setPublished(true);
  form.setAcceptingResponses(true);
  return form;
}

// Extra columns to the right of the answers. Header cell holds one array formula, so every new response row is filled automatically.
function addTrackingColumns(sheet, w) {
  const q = (s) => '"' + s.replace(/"/g, '""') + '"';
  sheet.getRange('H1').setFormula('={"Workshop"; ARRAYFORMULA(IF($A$2:$A="","",' + q(w.workshop) + '))}');
  sheet.getRange('I1').setFormula('={"Submission"; ARRAYFORMULA(IF($A$2:$A="","","Form Submitted"))}');
  sheet.getRange('J1').setValue('Payment received? (team: type Yes after checking Razorpay)');
  sheet.getRange('K1').setFormula('={"Payment status"; ARRAYFORMULA(IF($A$2:$A="","",IF(LOWER(TRIM($J$2:$J))="yes","Payment Confirmed","Payment Pending")))}');
  sheet.getRange('H1:K1').setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(10, 260);
}

function buildSummary(ss, result) {
  const sh = ss.insertSheet('Summary');
  const rows = [['Workshop', 'Dates', 'Form submissions', 'Payment Pending', 'Payment Confirmed', 'Unique email addresses']];
  CONFIG.workshops.forEach((w, i) => {
    const t = "'" + w.tab + "'!";
    rows.push([
      w.workshop,
      w.summaryDates,
      '=COUNTA(' + t + 'A2:A)',
      '=COUNTIF(' + t + 'K2:K,"Payment Pending")',
      '=COUNTIF(' + t + 'K2:K,"Payment Confirmed")',
      '=IFERROR(ROWS(UNIQUE(FILTER(LOWER(TRIM(' + t + 'C2:C)),' + t + 'C2:C<>""))),0)',
    ]);
  });
  rows.push(['Total', '', '=SUM(C2:C4)', '=SUM(D2:D4)', '=SUM(E2:E4)', '']);
  sh.getRange(1, 1, rows.length, 6).setValues(rows); // strings starting with = are stored as formulas
  sh.getRange('A1:F1').setFontWeight('bold').setBackground('#1b0c0d').setFontColor('#ffffff');
  sh.getRange('A5:F5').setFontWeight('bold').setBorder(true, null, null, null, null, null);
  sh.setColumnWidths(1, 1, 300);
  sh.setColumnWidths(2, 5, 150);

  const notes = [
    ['How to read this sheet'],
    ['Google Forms records FORM SUBMISSIONS only. It cannot tell whether a Razorpay payment succeeded.'],
    ['Every submission starts as "Form Submitted" and "Payment Pending". Nothing here is marked as paid automatically.'],
    ['After checking the payment in your Razorpay dashboard, type Yes in column J of that person\'s row. Their status then becomes "Payment Confirmed".'],
    ['Form submissions = one per submitted form. Unique email addresses counts each email once per workshop, so repeat submissions are visible.'],
    ['Students: student applications are handled separately in the admin dashboard (aniradichita.com/admin/student-applications), not in this sheet.'],
  ];
  sh.getRange(8, 1, notes.length, 1).setValues(notes);
  sh.getRange('A8').setFontWeight('bold');

  const links = [['Form', 'Public link (share this)', 'Edit link (team only)']];
  CONFIG.workshops.forEach((w) => links.push([w.workshop, result.forms[w.key].url, result.forms[w.key].editUrl]));
  sh.getRange(16, 1, links.length, 3).setValues(links);
  sh.getRange('A16:C16').setFontWeight('bold');
  sh.setFrozenRows(1);
}

function shareWithTeam(ss, result) {
  const report = [];
  CONFIG.editors.forEach((email) => {
    let sheetOk = true; let err = '';
    try { ss.addEditor(email); } catch (e) { sheetOk = false; err = String(e && e.message || e); }
    const formsOk = {};
    CONFIG.workshops.forEach((w) => {
      try { FormApp.openById(result.forms[w.key].id).addEditor(email); formsOk[w.key] = true; } catch (e) { formsOk[w.key] = false; err += ' | ' + String(e && e.message || e); }
    });
    report.push({ email: email, spreadsheet: sheetOk, forms: formsOk, error: err.trim() });
  });
  return report;
}

// ───────────────────────── 2. checks ─────────────────────────
function verifySetup() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const report = [];
  CONFIG.workshops.forEach((w) => {
    const f = FormApp.openById(data.forms[w.key].id);
    const items = f.getItems();
    const titles = items.map((i) => i.getTitle());
    const required = items.map((i) => (i.getType() === FormApp.ItemType.TEXT ? i.asTextItem().isRequired() : i.asCheckboxItem().isRequired()));
    report.push({
      form: w.formTitle,
      exists: true,
      fields: titles,
      requiredFlags: required,
      destinationIsSheet: f.getDestinationId() === ss.getId(),
      tabExists: !!ss.getSheetByName(w.tab),
      confirmationHasCorrectLink: f.getConfirmationMessage().indexOf(w.payUrl) !== -1,
      confirmationHasOtherLinks: CONFIG.workshops.filter((o) => o.key !== w.key).some((o) => f.getConfirmationMessage().indexOf(o.payUrl) !== -1),
      acceptingResponses: f.isAcceptingResponses(),
      descriptionNamesWorkshop: f.getDescription().indexOf(w.workshop) !== -1,
    });
  });
  Logger.log('VERIFY ' + JSON.stringify(report, null, 2));
  return report;
}

function showResults() {
  const raw = PropertiesService.getScriptProperties().getProperty(PROP);
  if (!raw) { Logger.log('Setup has not run yet. Run createAll() first.'); return; }
  const d = JSON.parse(raw);
  const out = {
    spreadsheetUrl: d.spreadsheetUrl,
    forms: Object.keys(d.forms).reduce((o, k) => { o[k] = d.forms[k].url; return o; }, {}),
    sharing: d.sharing,
  };
  Logger.log('RESULTS ' + JSON.stringify(out, null, 2));
}

// ───────────────────────── 3. end-to-end test (submits 3 clearly marked responses, then you run cleanupTests) ─────────────────────────
function runTests() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  const summary = ss.getSheetByName('Summary');
  const before = summary.getRange('C2:E5').getValues();

  CONFIG.workshops.forEach((w) => {
    const f = FormApp.openById(data.forms[w.key].id);
    const items = f.getItems();
    f.createResponse()
      .withItemResponse(items[0].asTextItem().createResponse('TEST – delete me (' + w.key + ')'))
      .withItemResponse(items[1].asTextItem().createResponse('test+' + w.key + '@example.com'))
      .withItemResponse(items[2].asTextItem().createResponse('+91 90000 00000'))
      .withItemResponse(items[3].asTextItem().createResponse('Vadodara'))
      .withItemResponse(items[4].asTextItem().createResponse('Test organisation'))
      .withItemResponse(items[5].asCheckboxItem().createResponse([CONFIG.confirmationText]))
      .submit();
  });

  // responses reach the sheet within moments; wait for all three
  let landed = {};
  for (let i = 0; i < 20; i++) {
    SpreadsheetApp.flush();
    CONFIG.workshops.forEach((w) => { landed[w.key] = findTestRows(ss.getSheetByName(w.tab)).length; });
    if (CONFIG.workshops.every((w) => landed[w.key] >= 1)) break;
    Utilities.sleep(2000);
  }
  SpreadsheetApp.flush();
  const after = summary.getRange('C2:E5').getValues();
  Logger.log('TEST rows landed per tab: ' + JSON.stringify(landed));
  Logger.log('Summary BEFORE (submissions, pending, confirmed): ' + JSON.stringify(before));
  Logger.log('Summary AFTER : ' + JSON.stringify(after));
  Logger.log('Expect each workshop row to rise by 1 submission and 1 pending, total by 3. Now run cleanupTests().');
}

function findTestRows(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const names = sheet.getRange(2, 2, last - 1, 1).getValues();
  const rows = [];
  names.forEach((r, i) => { if (String(r[0]).indexOf('TEST – delete me') === 0) rows.push(i + 2); });
  return rows;
}

function cleanupTests() {
  const data = JSON.parse(PropertiesService.getScriptProperties().getProperty(PROP));
  const ss = SpreadsheetApp.openById(data.spreadsheetId);
  let removedResponses = 0; let removedRows = 0;
  CONFIG.workshops.forEach((w) => {
    const f = FormApp.openById(data.forms[w.key].id);
    f.getResponses().forEach((r) => {
      const first = r.getItemResponses()[0];
      if (first && String(first.getResponse()).indexOf('TEST – delete me') === 0) { f.deleteResponse(r.getId()); removedResponses++; }
    });
    const sheet = ss.getSheetByName(w.tab);
    findTestRows(sheet).reverse().forEach((row) => { sheet.deleteRow(row); removedRows++; });
  });
  SpreadsheetApp.flush();
  Logger.log('Removed ' + removedResponses + ' test responses from the forms and ' + removedRows + ' test rows from the sheet.');
  Logger.log('Summary now: ' + JSON.stringify(ss.getSheetByName('Summary').getRange('C2:E5').getValues()));
}

// Only if you deleted the files in Drive and want to run createAll() again.
function resetSetup() {
  PropertiesService.getScriptProperties().deleteProperty(PROP);
}
