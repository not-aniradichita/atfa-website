/* ==========================================================================
   Aniradichita Theatre & Films Association: student registration landing page
   Used by: events/acting-filmmaking-workshop-student-registration.html

   Three cards, each opening its own Google Form (event.studentRegistration.options[].formUrl).
   Applications, ID uploads and review live in Google Forms / Google Sheets. Nothing is sent
   from this page. No student payment link and no ID document is on the website: the payment
   link is shown only on each form's confirmation page.
   ========================================================================== */
(function () {
  'use strict';

  var H = window.ATFA && window.ATFA.events;
  if (!H || document.body.getAttribute('data-events-view') !== 'student-registration') return;


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

  /* ── Google Forms mode: when every option has a formUrl this page is a landing page with one card per form ── */
  function isGoogleForm(u) {
    try { var x = new URL(u); return x.protocol === 'https:' && x.hostname === 'docs.google.com' && x.pathname.indexOf('/forms/') === 0; } catch (err) { return false; }
  }
  var formsReady = (cfg.options || []).length === 3 && (cfg.options || []).every(function (o) { return isGoogleForm(o.formUrl); });
  if (formsReady) {
    var cards = (cfg.options || []).map(function (o) {
      var info = optionInfo(o), combo = !!o.featured;
      var ids = o.workshops || [];
      var icon = combo ? '🎭 🎬' : ((byId[ids[0]] || {}).icon || '');
      return '<li class="aev-ws-reg aev-ws-reg--student aev-ws-reg--' + esc(o.id) + (combo ? ' aev-ws-reg--combo' : '') + '" id="student-' + esc(o.id) + '">' +
        (combo ? '<span class="aev-ws-reg-badge">★ ' + esc(o.badge || 'Complete Experience') + '</span><div class="aev-ws-reg-strip" aria-hidden="true"></div>' : '') +
        '<span class="aev-stu-tag"><span aria-hidden="true">🎓</span> Student</span>' +
        '<div class="aev-ws-reg-top"><span class="aev-ws-reg-ic" aria-hidden="true">' + esc(icon) + '</span><h3>Student – ' + esc(o.label) + '</h3></div>' +
        '<p class="aev-ws-reg-days">' + esc(info.days) + '</p>' +
        '<p class="aev-ws-reg-dates"><span class="aev-ws-reg-label">' + (ids.length > 1 ? 'Dates' : 'Date') + '</span> ' + esc(info.dates) + '</p>' +
        '<p class="aev-stu-verify"><span aria-hidden="true">🪪</span> Valid school or college ID required</p>' +
        '<a class="aev-ws-reg-btn aev-stu-btn" href="' + esc(o.formUrl) + '" target="_blank" rel="noopener noreferrer" data-student-form="' + esc(o.id) + '">Apply – ' + esc(o.label) + ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens the Google Form in a new tab)</span></a>' +
      '</li>';
    }).join('');
    var know = [
      ['🪪', 'Valid ID needed', 'Student applications need a valid school or college ID card. You upload it inside the form.'],
      ['🔐', 'Google sign-in', 'Google asks you to sign in to a Google account before you can upload your ID. This is a Google Forms rule.'],
      ['📎', 'ID file', 'PDF, JPG, JPEG or PNG. Please keep it under 5 MB. A clear photo or scan works best.'],
      ['👀', 'Reviewed by our team', 'Our team checks every application against the ID you upload.'],
      ['💳', 'Your payment link', 'As soon as you submit the form, the confirmation page shows your student payment link.'],
      ['✅', 'Final participation', 'Paying does not by itself guarantee eligibility or a place. Participation is subject to student eligibility verification and successful payment.']
    ].map(function (k) { return '<li><span class="stu-know-ic" aria-hidden="true">' + k[0] + '</span><span><b>' + esc(k[1]) + '</b>' + esc(k[2]) + '</span></li>'; }).join('');
    mount.innerHTML =
      H.crumbsHtml([['Home', '/index.html'], ['Events', '/events.html'], [e.title, '/events/acting-filmmaking-workshop'], ['Student Registration']]) +
      '<section class="stu-hero"><div class="stu-wrap">' +
        '<span class="aev-stu-eyebrow"><span aria-hidden="true">🎓</span> For students only · ID verification required</span>' +
        '<h1>Student <span>Registration</span></h1>' +
        '<p>' + esc(cfg.formsNote || cfg.note || '') + '</p>' +
      '</div></section>' +
      '<main class="stu-main"><div class="aev-lp-wrap">' +
        '<a class="stu-back" href="/events/acting-filmmaking-workshop#student-registration">← Back to the workshop page</a>' +
        '<h2 class="stu-land-h">Choose your workshop</h2>' +
        '<ul class="aev-ws-reg-grid stu-land-grid">' + cards + '</ul>' +
        '<section class="stu-privacy stu-know-wrap" aria-labelledby="stuKnow"><h3 id="stuKnow">Good to know before you apply</h3><ul class="stu-know">' + know + '</ul></section>' +
        '<section class="stu-privacy" aria-labelledby="stuPriv"><h3 id="stuPriv">🔒 Your ID card and your privacy</h3>' +
          '<ul><li>We collect your ID card only to check that you are a student.</li>' +
          '<li>It is stored privately, is never shown on this website and has no public link. Only authorised team members can open it.</li>' +
          '<li>We delete it within 30 days after we decide on your application, and by 22 December 2026 at the latest.</li></ul></section>' +
        '<p class="stu-note">Not a student? Use the <a href="/events/acting-filmmaking-workshop#register" style="color:#ffd98a">regular registration options</a> instead.</p>' +
      '</div></main>';
    document.title = 'Student Registration | ' + e.title + ' | Aniradichita Theatre & Films Association';
    var hash = (window.location.hash || '').replace('#', '');
    var target = hash && document.getElementById(hash);
    if (target && /^student-/.test(hash)) {
      target.classList.add('is-picked');
      window.requestAnimationFrame(function () { target.scrollIntoView({ block: 'center' }); });
    }
    return;
  }

  /* Fail closed: the legacy on-site form (Supabase `student-workshop`) is retired. If the three Google Form links are missing or invalid,
     show "not open" instead of any form. The old code is in git history (commit 96c2e55). */
  mount.innerHTML = '<div class="aev-lp-wrap"><div class="aev-empty" role="alert"><h1>Student applications are not open right now</h1>' +
    '<p>Please check back soon, or use the <a href="/events/acting-filmmaking-workshop#register">regular registration options</a>.</p>' +
    '<p><a href="/events/acting-filmmaking-workshop">Back to the workshop page</a></p></div></div>';
})();
