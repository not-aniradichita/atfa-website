/* ==========================================================================
   Aniradichita Theatre & Films Association: student registration form
   Used by: events/acting-filmmaking-workshop/student-registration.html

   Sends the application (details + ID card) to the `student-workshop` edge function.
   Nothing here is secret: the endpoint is public, and the function does all the real
   checks again on the server (file type by content, size, duplicates, rate limits).
   No student payment link is on this page or anywhere in this repository. The link
   is emailed only after the team verifies the ID (see supabase/STUDENT_WORKSHOP_SETUP.md).
   ========================================================================== */
(function () {
  'use strict';

  var H = window.ATFA && window.ATFA.events;
  if (!H || document.body.getAttribute('data-events-view') !== 'student-registration') return;

  var ENDPOINT = 'https://qgxgvyoosvbwmnnxggqz.supabase.co/functions/v1/student-workshop';
  var MAX_BYTES = 5 * 1024 * 1024;
  var CONSENT_TEXT = 'I confirm that the information provided is correct and that I am submitting my school/college ID for student eligibility verification by Aniradichita Theatre & Films Association.';

  var esc = H.esc;
  var e = H.findEvent(document.body.getAttribute('data-event-slug'));
  var cfg = e && e.studentRegistration && e.studentRegistration.enabled ? e.studentRegistration : null;
  var mount = document.getElementById('eventMount');
  if (!mount) return;
  if (!e || !cfg) {
    mount.innerHTML = '<div class="aev-lp-wrap"><div class="aev-empty" role="alert"><h1>Student registration is not open</h1><p><a href="/events/acting-filmmaking-workshop">Back to the workshop page</a></p></div></div>';
    return;
  }

  var byId = {};
  e.workshops.forEach(function (w) { byId[w.id] = w; });

  function optionInfo(o) {
    var ids = o.workshops || [];
    var ws = ids.map(function (id) { return byId[id]; }).filter(Boolean);
    var start = ws.map(function (w) { return w.startDate; }).sort()[0];
    var end = ws.map(function (w) { return w.endDate || w.startDate; }).sort().slice(-1)[0];
    var d = H.wsDates({ startDate: start, endDate: end !== start ? end : null });
    return { id: o.id, label: o.label, dates: d.dates, days: d.days };
  }
  var options = (cfg.options || []).map(optionInfo);
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get('workshop');
  var selected = options.some(function (o) { return o.id === wanted; }) ? wanted : '';

  /* ── page ── */
  var radios = options.map(function (o) {
    return '<div class="stu-ws-opt"><input type="radio" name="workshop" id="stu-ws-' + esc(o.id) + '" value="' + esc(o.id) + '"' + (o.id === selected ? ' checked' : '') + ' required>' +
      '<label for="stu-ws-' + esc(o.id) + '"><b>' + esc(o.label) + '</b><span>' + esc(o.dates) + '</span></label></div>';
  }).join('');

  function field(id, label, type, ph, ac, full, hint) {
    return '<div class="stu-field' + (full ? ' stu-field--full' : '') + '" data-field="' + id + '">' +
      '<label for="stu-' + id + '">' + esc(label) + ' <i aria-hidden="true">*</i></label>' +
      '<input id="stu-' + id + '" name="' + id + '" type="' + type + '" placeholder="' + esc(ph) + '" autocomplete="' + ac + '" required aria-describedby="stu-' + id + '-err">' +
      (hint ? '<span class="stu-hint">' + esc(hint) + '</span>' : '') +
      '<span class="stu-err" id="stu-' + id + '-err" role="alert"></span></div>';
  }

  var page =
    H.crumbsHtml([['Home', '/index.html'], ['Events', '/events.html'], [e.title, '/events/acting-filmmaking-workshop'], ['Student Registration']]) +
    '<section class="stu-hero"><div class="stu-wrap">' +
      '<span class="aev-stu-eyebrow"><span aria-hidden="true">🎓</span> For students only · ID verification required</span>' +
      '<h1>Student <span>Registration</span></h1>' +
      '<p>' + esc(cfg.note || '') + '</p>' +
    '</div></section>' +
    '<main class="stu-main"><div class="stu-wrap">' +
      '<a class="stu-back" href="/events/acting-filmmaking-workshop#student-registration">← Back to the workshop page</a>' +
      '<div class="stu-card">' +
        '<form class="stu-form" id="stuForm" novalidate>' +
          '<fieldset><legend>1 · Your workshop</legend>' +
            '<div class="stu-ws-opts" role="radiogroup" aria-label="Workshop">' + radios + '</div>' +
            '<span class="stu-err" id="stu-workshop-err" role="alert"></span>' +
          '</fieldset>' +
          '<fieldset><legend>2 · About you</legend><div class="stu-grid">' +
            field('full_name', 'Full name', 'text', 'As on your ID card', 'name', false) +
            field('email', 'Email address', 'email', 'name@example.com', 'email', false, 'Your student payment link will be sent here if you are approved.') +
            field('phone', 'Phone number', 'tel', '+91 98765 43210', 'tel', false) +
            field('city', 'City', 'text', 'e.g. Vadodara', 'address-level2', false) +
            field('institution', 'School / college name', 'text', 'Full name of your school or college', 'organization', true) +
            field('course_year', 'Course / class and year', 'text', 'e.g. B.Com, 2nd year  or  Class 11', 'off', true) +
          '</div></fieldset>' +
          '<fieldset><legend>3 · Your ID card</legend>' +
            '<div class="stu-drop" id="stuDrop"><span class="stu-drop-ic" aria-hidden="true">🪪</span>' +
              '<div class="stu-drop-text"><b id="stuFileName">Choose your school or college ID card</b><span id="stuFileStatus">PDF, JPG, JPEG or PNG · up to 5 MB · required</span></div>' +
              '<input type="file" id="stuFile" name="id_file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-describedby="stuFileStatus stu-id_file-err" required>' +
              '<button type="button" class="stu-file-clear" id="stuFileClear" hidden>Remove</button>' +
            '</div>' +
            '<span class="stu-err" id="stu-id_file-err" role="alert"></span>' +
            '<div class="stu-privacy"><h3>🔒 Why we ask for your ID, and who sees it</h3>' +
              '<ul>' +
                '<li>We collect it only to check that you are a student, so you can use the student registration option.</li>' +
                '<li>It is stored privately. It is never shown on the website and has no public link.</li>' +
                '<li>Only authorised members of the Aniradichita team can open it, after signing in.</li>' +
                '<li>It is not used for anything else. We delete it within 30 days after we decide on your application, and by 22 December 2026 at the latest.</li>' +
              '</ul></div>' +
          '</fieldset>' +
          '<div class="stu-consent" id="stuConsentBox"><input type="checkbox" id="stuConsent" name="consent" value="true" required aria-describedby="stu-consent-err"><label for="stuConsent">' + esc(CONSENT_TEXT) + '</label></div>' +
          '<span class="stu-err" id="stu-consent-err" role="alert"></span>' +
          '<div class="stu-hp" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>' +
          '<div class="stu-submit"><button type="submit" class="stu-btn" id="stuSubmit"><span class="stu-spin" aria-hidden="true"></span><span id="stuSubmitText">Submit application</span></button></div>' +
          '<div class="stu-banner stu-banner--err" id="stuError" role="alert" tabindex="-1"></div>' +
          '<div class="stu-banner stu-banner--info" id="stuInfo" role="status"></div>' +
          '<p class="stu-note">Submitting this form does not confirm your participation. Your student payment link is sent by email only after your ID is verified.</p>' +
        '</form>' +
        '<div class="stu-done" id="stuDone" role="status" tabindex="-1">' +
          '<div class="stu-done-ic" aria-hidden="true">✓</div>' +
          '<h2>Application received</h2>' +
          '<p>Thank you! Our team will now verify your school or college ID and review your application.</p>' +
          '<div class="stu-code" id="stuCode"></div>' +
          '<p id="stuDoneMail"></p>' +
          '<p>If you are approved, we will email you your student payment link. Submitting this form does not confirm your participation.</p>' +
          '<p><a class="btn-g" href="/events/acting-filmmaking-workshop" style="display:inline-flex;margin-top:12px;">← Back to the workshop page</a></p>' +
        '</div>' +
      '</div>' +
    '</div></main>';

  mount.innerHTML = page;

  var form = document.getElementById('stuForm');
  var fileInput = document.getElementById('stuFile');
  var drop = document.getElementById('stuDrop');
  var fileName = document.getElementById('stuFileName');
  var fileStatus = document.getElementById('stuFileStatus');
  var clearBtn = document.getElementById('stuFileClear');
  var submitBtn = document.getElementById('stuSubmit');
  var submitText = document.getElementById('stuSubmitText');
  var errBox = document.getElementById('stuError');
  var infoBox = document.getElementById('stuInfo');
  var busy = false;
  var fileOk = false;

  /* ── small helpers ── */
  function fmtSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
  function setErr(name, msg) {
    var el = document.getElementById('stu-' + name + '-err');
    if (el) el.textContent = msg || '';
    var wrap = form.querySelector('[data-field="' + name + '"]');
    if (wrap) wrap.classList.toggle('has-error', !!msg);
    if (name === 'consent') document.getElementById('stuConsentBox').classList.toggle('has-error', !!msg);
    if (name === 'id_file') drop.classList.toggle('has-error', !!msg);
    var inp = form.elements[name];
    if (inp && inp.setAttribute && inp.nodeType === 1) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
  }
  function clearAllErrors() {
    ['workshop', 'full_name', 'email', 'phone', 'city', 'institution', 'course_year', 'id_file', 'consent'].forEach(function (n) { setErr(n, ''); });
    errBox.classList.remove('is-on'); errBox.textContent = '';
    infoBox.classList.remove('is-on'); infoBox.textContent = '';
  }

  /* ── ID file: type, size and real content are checked here (and again on the server) ── */
  function sniffClient(file) {
    return new Promise(function (resolve) {
      var r = new FileReader();
      r.onerror = function () { resolve(null); };
      r.onload = function () {
        var b = new Uint8Array(r.result);
        var s5 = String.fromCharCode.apply(null, b.subarray(0, 5));
        if (s5 === '%PDF-') return resolve('pdf');
        if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return resolve('jpg');
        if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return resolve('png');
        resolve(null);
      };
      r.readAsArrayBuffer(file.slice(0, 16));
    });
  }
  function resetFile(keepError) {
    fileOk = false;
    drop.classList.remove('is-ok');
    fileName.textContent = 'Choose your school or college ID card';
    fileStatus.textContent = 'PDF, JPG, JPEG or PNG · up to 5 MB · required';
    clearBtn.hidden = true;
    if (!keepError) setErr('id_file', '');
  }
  function rejectFile(msg) {
    try { fileInput.value = ''; } catch (x) { /* ignore */ }
    resetFile(true);
    setErr('id_file', msg);
    fileStatus.textContent = msg;
  }
  function checkFile() {
    var f = fileInput.files && fileInput.files[0];
    if (!f) { resetFile(false); return Promise.resolve(false); }
    var ext = (/\.([a-z0-9]+)$/i.exec(f.name) || [])[1];
    ext = (ext || '').toLowerCase();
    if (['pdf', 'jpg', 'jpeg', 'png'].indexOf(ext) < 0) { rejectFile('Please upload a PDF, JPG, JPEG or PNG file.'); return Promise.resolve(false); }
    if (f.size <= 0) { rejectFile('That file is empty. Please choose another one.'); return Promise.resolve(false); }
    if (f.size > MAX_BYTES) { rejectFile('That file is over the 5 MB limit. Please choose a smaller file.'); return Promise.resolve(false); }
    fileName.textContent = f.name;
    fileStatus.textContent = 'Checking file…';
    return sniffClient(f).then(function (kind) {
      var okKind = kind && ((kind === 'jpg' && (ext === 'jpg' || ext === 'jpeg')) || kind === ext);
      if (!okKind) { rejectFile('This does not look like a real PDF, JPG or PNG file. Please choose your ID card file.'); return false; }
      fileOk = true;
      setErr('id_file', '');
      drop.classList.add('is-ok');
      fileStatus.textContent = '✓ Ready to upload · ' + fmtSize(f.size);
      clearBtn.hidden = false;
      return true;
    });
  }
  fileInput.addEventListener('change', checkFile);
  clearBtn.addEventListener('click', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    try { fileInput.value = ''; } catch (x) { /* ignore */ }
    resetFile(false);
  });
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });

  /* ── field checks (same rules as the server) ── */
  function validateAll() {
    var ok = true;
    function bad(n, m) { setErr(n, m); ok = false; }
    clearAllErrors();
    var v = function (n) { return (form.elements[n].value || '').replace(/\s+/g, ' ').trim(); };
    if (!form.elements.workshop.value) bad('workshop', 'Please choose a workshop.');
    if (!v('full_name')) bad('full_name', 'Please write your full name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) bad('email', 'Please write an email like name@example.com.');
    var phone = v('phone'), digits = phone.replace(/\D/g, '');
    if (!/^[0-9+()\-\s.]+$/.test(phone) || digits.length < 7 || digits.length > 15) bad('phone', 'Please write a phone number with 7 to 15 numbers. You can use +, spaces and dashes.');
    if (!v('city')) bad('city', 'Please write your city.');
    if (!v('institution')) bad('institution', 'Please write your school or college name.');
    if (!v('course_year')) bad('course_year', 'Please write your course or class and your year of study.');
    if (!fileInput.files || !fileInput.files[0]) bad('id_file', 'Please upload your school or college ID card.');
    else if (!fileOk) bad('id_file', 'Please choose a valid ID card file (PDF, JPG, JPEG or PNG, up to 5 MB).');
    if (!form.elements.consent.checked) bad('consent', 'Please tick this box so we can go ahead.');
    return ok;
  }
  form.addEventListener('input', function (ev) { if (ev.target && ev.target.name && ev.target.name !== 'id_file') setErr(ev.target.name, ''); });
  form.addEventListener('change', function (ev) { if (ev.target && (ev.target.name === 'workshop' || ev.target.name === 'consent')) setErr(ev.target.name, ''); });

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.add('is-on');
    errBox.focus({ preventScroll: false });
    if (errBox.scrollIntoView) errBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-busy', on);
    submitText.textContent = on ? 'Submitting… please wait' : 'Submit application';
    if (on) { infoBox.textContent = 'Uploading your application securely. Please keep this page open.'; infoBox.classList.add('is-on'); }
    else infoBox.classList.remove('is-on');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    checkFile().then(function () {
      if (!validateAll()) {
        var first = form.querySelector('.has-error input, .stu-drop.has-error, .stu-consent.has-error input');
        if (!first && document.getElementById('stu-workshop-err').textContent) first = form.querySelector('.stu-ws-opt input');
        if (first) { (first.focus ? first : form).focus(); if (first.scrollIntoView) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        showError('Please fix the highlighted fields and try again. Your answers have been kept.');
        return;
      }
      send();
    });
  });

  function send() {
    var fd = new FormData(form);
    fd.set('consent', 'true');
    setBusy(true);
    errBox.classList.remove('is-on');
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 90000) : null;
    fetch(ENDPOINT, { method: 'POST', body: fd, signal: ctl ? ctl.signal : undefined })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
      })
      .then(function (r) {
        if (timer) clearTimeout(timer);
        setBusy(false);
        var b = r.body || {};
        if (r.status === 200 && b.ok) return done(b);
        if (b.errors) {
          Object.keys(b.errors).forEach(function (k) { setErr(k, b.errors[k]); });
          showError('We could not accept the application yet. Please fix the highlighted fields. Your answers have been kept.');
          return;
        }
        if (b.error === 'duplicate') return showError('We already have a student application from this email for this workshop. If you need help, please contact us.');
        if (b.error === 'rate_limited') return showError(b.message || 'Too many applications from here just now. Please try again in an hour.');
        showError(b.message || 'Something went wrong and your application was not submitted. Your answers are still here. Please try again.');
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
        setBusy(false);
        showError('We could not reach the server, so your application was not submitted. Please check your internet connection and try again. Your answers are still here.');
      });
  }

  function done(b) {
    form.hidden = true;
    var d = document.getElementById('stuDone');
    document.getElementById('stuCode').textContent = b.applicationCode || '';
    document.getElementById('stuDoneMail').textContent = b.ackEmail === 'sent'
      ? 'We have sent a confirmation to your email. Please keep your application ID.'
      : 'Please keep your application ID. A confirmation email will follow; if you do not see one soon, check your spam folder.';
    d.classList.add('is-on');
    d.focus();
    if (d.scrollIntoView) d.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /* ── small extras ── */
  document.title = 'Student Registration | ' + e.title + ' | Aniradichita Theatre & Films Association';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) document.documentElement.style.scrollBehavior = 'smooth';
})();
