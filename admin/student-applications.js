/* Student applications: admin dashboard.
   Sign-in uses Supabase Auth (the public anon key is meant to be public). Every action goes to the
   `student-workshop` edge function, which checks that the signed-in user is on the admin allow-list
   before doing anything. Nothing secret is in this file; ID documents are only ever shown through a
   60-second signed link that the function creates for an authorised admin. */
(function () {
  'use strict';

  var SB = 'https://qgxgvyoosvbwmnnxggqz.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneGd2eW9vc3Zid21ubnhnZ3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTQyMDMsImV4cCI6MjA5NDU3MDIwM30.BhMlgHFMaBTldzmGSP-DiJdR-2s4v-7TSR2eU4-fDaA';
  var FN = SB + '/functions/v1/student-workshop';
  var SKEY = 'atfa-admin-session';

  var WS = { acting: 'Acting Workshop', filmmaking: 'Filmmaking Workshop', combo: 'Acting + Filmmaking Combo' };
  var MAILKIND = { team_notification: 'Team notification', student_ack: 'Student acknowledgement', approval: 'Approval + payment link', rejection: 'Rejection notice' };
  var MAILTAG = { team_notification: 'team', student_ack: 'student', approval: 'approval', rejection: 'rejection' };

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function fmt(iso) {
    if (!iso) return '—';
    try { return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) + ' IST'; } catch (x) { return iso; }
  }
  function pillClass(s) {
    return { 'Pending Verification': 'pending', 'Approved': 'approved', 'Payment Link Sent': 'sent', 'Payment Completed': 'paid', 'Rejected': 'rejected' }[s] || 'pending';
  }
  function pill(s) { return el('span', 'ad-pill ad-pill--' + pillClass(s), s); }

  var toastTimer;
  function toast(msg, bad) {
    var t = $('adToast');
    t.textContent = msg; t.className = 'ad-toast is-on' + (bad ? ' is-bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.className = 'ad-toast'; }, bad ? 6500 : 3800);
  }

  /* ── session ── */
  var session = null;
  function loadSession() { try { session = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (x) { session = null; } }
  function saveSession(s) { session = s; try { if (s) sessionStorage.setItem(SKEY, JSON.stringify(s)); else sessionStorage.removeItem(SKEY); } catch (x) { /* ignore */ } }

  function authCall(grant, body) {
    return fetch(SB + '/auth/v1/token?grant_type=' + grant, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }
  function adopt(j) { saveSession({ access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000 }); }
  function freshToken() {
    if (!session) return Promise.reject(new Error('signed_out'));
    if (Date.now() < session.exp - 60000) return Promise.resolve(session.access);
    return authCall('refresh_token', { refresh_token: session.refresh }).then(function (r) {
      if (!r.ok || !r.j.access_token) { saveSession(null); throw new Error('signed_out'); }
      adopt(r.j); return session.access;
    });
  }

  function api(body) {
    return freshToken().then(function (tok) {
      return fetch(FN, { method: 'POST', headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401) { signOut('Your session ended or this account is not authorised.'); throw new Error('unauthorized'); }
        j._status = r.status; return j;
      });
    });
  }

  /* ── sign in / out ── */
  function showLogin(msg) {
    $('adApp').hidden = true; $('adLogin').hidden = false; $('adWho').hidden = true;
    $('adLoginMsg').textContent = msg || '';
    closeDetail();
  }
  function signOut(msg) { saveSession(null); showLogin(msg); }

  $('adLoginForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var btn = $('adLoginBtn'); btn.disabled = true; $('adLoginMsg').textContent = '';
    authCall('password', { email: $('adUser').value.trim(), password: $('adPass').value }).then(function (r) {
      if (!r.ok || !r.j.access_token) { $('adLoginMsg').textContent = 'Sign-in failed. Check your email and password.'; btn.disabled = false; return; }
      adopt(r.j); $('adPass').value = '';
      return start().then(function () { btn.disabled = false; });
    }).catch(function () { $('adLoginMsg').textContent = 'Could not reach the server. Please try again.'; btn.disabled = false; });
  });
  $('adSignOut').addEventListener('click', function () { signOut('You have signed out.'); });

  /* ── start: confirm this user is an admin ── */
  function start() {
    return api({ action: 'whoami' }).then(function (j) {
      if (!j.ok) { signOut('This account is not authorised to use the admin area.'); return; }
      $('adLogin').hidden = true; $('adApp').hidden = false; $('adWho').hidden = false;
      $('adEmail').textContent = j.email;
      var w = $('adMailWarn');
      if (!j.emailConfigured) {
        w.hidden = false;
        w.textContent = 'Email sending is not set up yet (Gmail credentials are missing). Applications are saved and emails are queued, but nothing is emailed until setup is finished. Approving still records the decision; use "Retry email" afterwards.';
      } else w.hidden = true;
      return refresh().then(openFromUrl);
    }).catch(function () { if (!session) showLogin(); });
  }

  /* ── list ── */
  var apps = [];
  function filters() { return { action: 'list', workshop: $('fWorkshop').value, status: $('fStatus').value, q: $('fSearch').value.trim() }; }
  function refresh() {
    $('adCount').textContent = 'Loading…';
    return api(filters()).then(function (j) {
      if (!j.ok) { $('adCount').textContent = 'Could not load applications.'; return; }
      apps = j.applications || [];
      renderList();
      var due = $('adDueWarn');
      if (j.idsDueForDeletion > 0) {
        due.hidden = false; due.textContent = '';
        due.appendChild(el('span', '', j.idsDueForDeletion + ' ID document(s) are past their retention date and should be deleted.'));
        var b = el('button', 'ad-btn ad-btn--danger', 'Delete them now');
        b.type = 'button';
        b.addEventListener('click', function () {
          confirmBox('Delete expired ID documents?', 'This permanently deletes ' + j.idsDueForDeletion + ' ID file(s) whose retention period has ended. The application records stay. This cannot be undone.', null, 'Delete files').then(function (r) {
            if (!r) return;
            api({ action: 'purge_expired' }).then(function (x) { toast(x.ok ? x.removed + ' file(s) deleted.' : 'Could not delete the files.', !x.ok); refresh(); });
          });
        });
        due.appendChild(b);
      } else due.hidden = true;
    }).catch(function () { /* handled */ });
  }
  function mailCell(a) {
    var m = a.emails || {}, box = el('span', 'ad-mail');
    var parts = ['team_notification', 'student_ack', 'approval', 'rejection'].filter(function (k) { return m[k]; });
    if (!parts.length) { box.textContent = 'No emails yet'; return box; }
    parts.forEach(function (k, i) {
      var s = m[k], sp = el('span', s === 'sent' ? 'good' : (s === 'failed' ? 'bad' : ''), MAILTAG[k] + ': ' + (s === 'failed' ? 'NOT SENT' : s));
      if (i) box.appendChild(document.createTextNode(' · '));
      box.appendChild(sp);
    });
    return box;
  }
  function renderList() {
    var list = $('adList'); list.textContent = '';
    $('adCount').textContent = apps.length + ' application' + (apps.length === 1 ? '' : 's');
    if (!apps.length) { list.appendChild(el('div', 'ad-empty', 'No applications match these filters.')); return; }
    apps.forEach(function (a) {
      var card = el('button', 'ad-card'); card.type = 'button';
      var c1 = el('span'); c1.appendChild(el('b', '', a.full_name)); c1.appendChild(el('small', '', a.email)); c1.appendChild(el('small', 'ad-code', a.app_code));
      var c2 = el('span'); c2.appendChild(el('b', '', WS[a.workshop] || a.workshop)); c2.appendChild(el('small', '', a.institution)); c2.appendChild(el('small', '', 'Submitted ' + fmt(a.created_at)));
      var c3 = el('span'); c3.appendChild(pill(a.status)); c3.appendChild(mailCell(a));
      var c4 = el('span', 'ad-muted', 'Open ›');
      card.appendChild(c1); card.appendChild(c2); card.appendChild(c3); card.appendChild(c4);
      card.addEventListener('click', function () { openDetail(a.id); });
      list.appendChild(card);
    });
  }
  ['fWorkshop', 'fStatus'].forEach(function (id) { $(id).addEventListener('change', refresh); });
  var st; $('fSearch').addEventListener('input', function () { clearTimeout(st); st = setTimeout(refresh, 350); });
  $('adRefresh').addEventListener('click', refresh);

  /* ── confirm dialog ── */
  function confirmBox(title, text, extraBuilder, yesLabel, danger) {
    return new Promise(function (resolve) {
      var d = $('adConfirm');
      $('adConfirmTitle').textContent = title;
      var body = $('adConfirmBody'); body.textContent = '';
      (Array.isArray(text) ? text : [text]).forEach(function (t) { body.appendChild(el('p', '', t)); });
      var extra = $('adConfirmExtra'); extra.textContent = '';
      var getter = extraBuilder ? extraBuilder(extra) : null;
      var yes = $('adConfirmYes'); yes.textContent = yesLabel || 'Confirm'; yes.className = 'ad-btn' + (danger ? ' ad-btn--danger' : ' ad-btn--ok');
      function done(v) { yes.removeEventListener('click', onYes); $('adConfirmNo').removeEventListener('click', onNo); d.removeEventListener('cancel', onNo); d.close(); resolve(v); }
      function onYes(ev) { ev.preventDefault(); done(getter ? getter() : true); }
      function onNo(ev) { if (ev) ev.preventDefault(); done(false); }
      yes.addEventListener('click', onYes); $('adConfirmNo').addEventListener('click', onNo); d.addEventListener('cancel', onNo);
      d.showModal();
    });
  }
  $('adConfirmForm').addEventListener('submit', function (ev) { ev.preventDefault(); });

  /* ── detail ── */
  var current = null, idTimer = null;
  function closeDetail() { var d = $('adDetail'); if (d.open) d.close(); clearInterval(idTimer); current = null; $('adDetailBody').textContent = ''; }
  $('adDetailClose').addEventListener('click', closeDetail);
  $('adDetail').addEventListener('close', function () { clearInterval(idTimer); });

  function dl(rows) {
    var d = el('dl', 'ad-dl');
    rows.forEach(function (r) { d.appendChild(el('dt', '', r[0])); var dd = el('dd'); if (r[1] instanceof Node) dd.appendChild(r[1]); else dd.textContent = r[1] == null || r[1] === '' ? '—' : r[1]; d.appendChild(dd); });
    return d;
  }
  function panel(title) { var p = el('section', 'ad-panel'); p.appendChild(el('h3', '', title)); return p; }

  function openDetail(id, keepScroll) {
    var body = $('adDetailBody');
    var dlg = $('adDetail');
    if (!dlg.open) dlg.showModal();
    if (!keepScroll) body.textContent = 'Loading…';
    return api({ action: 'get', id: id }).then(function (j) {
      if (!j.ok) { body.textContent = 'Could not load this application.'; return; }
      current = j; renderDetail(j);
    }).catch(function () { /* handled */ });
  }

  function renderDetail(j) {
    var a = j.application, body = $('adDetailBody');
    $('adDetailTitle').textContent = a.full_name + ' · ' + a.app_code;
    body.textContent = '';

    var grid = el('div', 'ad-grid2');
    // left column: details + ID
    var left = el('div'); left.style.display = 'grid'; left.style.gap = '14px';
    var p1 = panel('Applicant');
    p1.appendChild(dl([
      ['Status', pill(a.status)], ['Workshop', WS[a.workshop] || a.workshop], ['Full name', a.full_name], ['Email', a.email], ['Phone', a.phone],
      ['School / college', a.institution], ['Course / year', a.course_year], ['City', a.city], ['Submitted', fmt(a.created_at)],
      ['Consent given', fmt(a.consent_at)], ['Decision', a.decided_at ? fmt(a.decided_at) + ' by ' + a.decided_by : '—'],
      ['Payment link sent', a.payment_link_sent_at ? fmt(a.payment_link_sent_at) + ' by ' + a.payment_link_sent_by : '—'],
      ['ID kept until', a.id_deleted_at ? 'Deleted ' + fmt(a.id_deleted_at) : fmt(a.retention_expires_at)]
    ]));
    left.appendChild(p1);

    var p2 = panel('ID card');
    var idBox = el('div', 'ad-id');
    if (a.id_deleted_at) idBox.appendChild(el('p', 'ad-muted', 'The ID document has been deleted.'));
    else if (!j.idUrl) idBox.appendChild(el('p', 'ad-muted', 'No ID document is available.'));
    else {
      if (a.id_mime === 'application/pdf') {
        var fr = el('iframe'); fr.title = 'ID card (PDF)'; fr.src = j.idUrl; idBox.appendChild(fr);
      } else {
        var im = el('img'); im.alt = 'ID card of ' + a.full_name; im.referrerPolicy = 'no-referrer'; im.src = j.idUrl; idBox.appendChild(im);
      }
      var note = el('p', 'ad-note', 'Secure link, valid for ' + j.idUrlSeconds + ' seconds.'); idBox.appendChild(note);
      var row = el('div', 'ad-row');
      var open = el('a', 'ad-btn ad-btn--ghost', 'Open in new tab'); open.href = j.idUrl; open.target = '_blank'; open.rel = 'noopener noreferrer';
      var dlb = el('a', 'ad-btn ad-btn--ghost', 'Download'); dlb.href = j.idUrl + '&download=' + encodeURIComponent(a.app_code + (a.id_mime === 'application/pdf' ? '.pdf' : (a.id_mime === 'image/png' ? '.png' : '.jpg'))); dlb.rel = 'noopener noreferrer';
      var again = el('button', 'ad-btn ad-btn--ghost', 'Get a fresh link'); again.type = 'button'; again.addEventListener('click', function () { openDetail(a.id, true); });
      var del = el('button', 'ad-btn ad-btn--danger', 'Delete ID file'); del.type = 'button';
      del.addEventListener('click', function () {
        confirmBox('Delete this ID document?', ['This permanently deletes the uploaded ID for ' + a.full_name + ' (' + a.app_code + ').', 'The application stays, but the ID cannot be viewed again. This cannot be undone.'], null, 'Delete ID file', true).then(function (ok) {
          if (!ok) return;
          api({ action: 'delete_id', id: a.id }).then(function (x) { toast(x.ok ? 'ID document deleted.' : 'Could not delete it.', !x.ok); if (x.ok) { openDetail(a.id); refresh(); } });
        });
      });
      row.appendChild(open); row.appendChild(dlb); row.appendChild(again); row.appendChild(del); idBox.appendChild(row);
      // the link stops working after 60 s: say so instead of showing a broken image
      var left_s = j.idUrlSeconds;
      clearInterval(idTimer);
      idTimer = setInterval(function () { left_s--; if (left_s <= 0) { clearInterval(idTimer); note.textContent = 'This secure link has expired. Press "Get a fresh link" to view the ID again.'; } }, 1000);
    }
    p2.appendChild(idBox); left.appendChild(p2);

    // right column: decision, notes, emails, audit
    var right = el('div'); right.style.display = 'grid'; right.style.gap = '14px';
    var p3 = panel('Decision');
    var acts = el('div', 'ad-row');
    var canApprove = a.status === 'Pending Verification' || a.status === 'Approved' || a.status === 'Rejected';
    if (a.status === 'Rejected') canApprove = false;
    if (a.status === 'Pending Verification') {
      acts.appendChild(btn('Approve', 'ad-btn ad-btn--ok', function () { doApprove(a, false); }));
      acts.appendChild(btn('Reject', 'ad-btn ad-btn--danger', function () { doReject(a); }));
    } else if (a.status === 'Approved') {
      acts.appendChild(btn('Send payment link email', 'ad-btn ad-btn--ok', function () { doApprove(a, false); }));
      acts.appendChild(btn('Reject', 'ad-btn ad-btn--danger', function () { doReject(a); }));
    } else if (a.status === 'Payment Link Sent') {
      acts.appendChild(btn('Resend payment link…', 'ad-btn ad-btn--gold', function () { doApprove(a, true); }));
    }
    if (!acts.childNodes.length) acts.appendChild(el('p', 'ad-muted', a.status === 'Rejected' ? 'This application was rejected.' : 'No decision actions are available.'));
    p3.appendChild(acts);
    if (a.status === 'Payment Completed' || a.status === 'Payment Link Sent') p3.appendChild(el('p', 'ad-note ad-muted', 'Payment is not tracked automatically here. Check your Razorpay dashboard to see who has paid.'));
    right.appendChild(p3);

    var p4 = panel('Internal note (never sent to the student)');
    var ta = el('textarea'); ta.value = a.admin_note || ''; ta.maxLength = 2000; ta.setAttribute('aria-label', 'Internal verification note');
    var sv = btn('Save note', 'ad-btn ad-btn--ghost', function () {
      api({ action: 'set_note', id: a.id, note: ta.value }).then(function (x) { toast(x.ok ? 'Note saved.' : 'Could not save the note.', !x.ok); });
    });
    p4.appendChild(ta); var r4 = el('div', 'ad-row'); r4.appendChild(sv); p4.appendChild(r4); right.appendChild(p4);

    var p5 = panel('Emails');
    var ul = el('ul', 'ad-mails');
    if (!j.emails.length) ul.appendChild(el('li', 'ad-muted', 'No emails queued.'));
    j.emails.forEach(function (m) {
      var li = el('li');
      var lab = el('span', '', (MAILKIND[m.kind] || m.kind) + ' → ' + (m.to_emails || []).join(', '));
      var stt = el('span', m.status === 'sent' ? 'ad-mail good' : (m.status === 'failed' ? 'ad-mail bad' : 'ad-mail'), m.status === 'sent' ? 'Sent ' + fmt(m.sent_at) : (m.status === 'failed' ? 'NOT SENT' : m.status));
      li.appendChild(lab); li.appendChild(stt);
      if (m.status !== 'sent') {
        var rb = btn('Retry email', 'ad-btn ad-btn--ghost', function () {
          rb.disabled = true;
          api({ action: 'retry_email', outboxId: m.id }).then(function (x) {
            toast(x.emailSent ? 'Email sent.' : 'Email was not sent: ' + (x.emailError || 'unknown error'), !x.emailSent);
            openDetail(a.id, true); refresh();
          });
        });
        li.appendChild(rb);
        if (m.last_error) li.appendChild(el('span', 'err', 'Last error: ' + m.last_error));
      }
      ul.appendChild(li);
    });
    p5.appendChild(ul); right.appendChild(p5);

    var p6 = panel('History');
    var log = el('ul', 'ad-log');
    (j.events || []).slice().reverse().forEach(function (e) {
      var li = el('li'); li.appendChild(el('time', '', fmt(e.at)));
      li.appendChild(el('span', '', e.actor + ': ' + e.action.replace(/_/g, ' ') + (e.detail ? ' (' + e.detail + ')' : '')));
      log.appendChild(li);
    });
    p6.appendChild(log); right.appendChild(p6);

    grid.appendChild(left); grid.appendChild(right); body.appendChild(grid);
  }
  function btn(label, cls, fn) { var b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', fn); return b; }

  /* ── approve / reject ── */
  function doApprove(a, resend) {
    var wname = WS[a.workshop] || a.workshop;
    var paras = resend
      ? ['A payment link was already emailed to ' + a.email + '.', 'Only continue if the student really needs it again. This sends one more email with the ' + wname + ' student payment link.']
      : ['Approve ' + a.full_name + ' for the ' + wname + '?', 'This emails the ' + wname + ' student payment link to ' + a.email + '. Please confirm you have checked the ID.'];
    confirmBox(resend ? 'Resend the payment link?' : 'Approve and send payment link?', paras, null, resend ? 'Resend link' : 'Approve and email link').then(function (ok) {
      if (!ok) return;
      api({ action: 'approve', id: a.id, resend: !!resend, note: '' }).then(function (x) {
        if (!x.ok) {
          toast(x.error === 'already_sent' ? 'A payment link was already sent to this student.' : (x.message || 'Could not approve (' + (x.error || 'error') + ').'), true);
        } else if (x.emailSent) toast('Approved. Payment link emailed to ' + a.email + '.');
        else toast('Approved, but the email was NOT sent (' + (x.emailError || 'unknown') + '). Status stays "Approved" until it is sent. Use "Send payment link email" to retry.', true);
        openDetail(a.id, true); refresh();
      });
    });
  }
  function doReject(a) {
    confirmBox('Reject this application?', ['Reject ' + a.full_name + '? The student gets a polite email. Your internal note is never included.'], function (box) {
      var f = el('div', 'ad-field'); f.appendChild(el('label', '', 'Optional message to the student (shown in the email)'));
      var t = el('textarea'); t.maxLength = 500; t.placeholder = 'e.g. Please re-apply with a clearer photo of your ID.'; f.appendChild(t);
      var c = el('label', 'ad-check'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = true; c.appendChild(cb); c.appendChild(el('span', '', 'Send the rejection email'));
      box.appendChild(f); box.appendChild(c);
      return function () { return { studentMessage: t.value.trim(), sendEmail: cb.checked }; };
    }, 'Reject', true).then(function (opts) {
      if (!opts) return;
      api({ action: 'reject', id: a.id, studentMessage: opts.studentMessage, sendEmail: opts.sendEmail, note: '' }).then(function (x) {
        if (!x.ok) toast(x.error === 'link_already_issued' ? 'A payment link was already sent, so this cannot be rejected.' : 'Could not reject (' + (x.error || 'error') + ').', true);
        else if (x.emailSent === false) toast('Rejected, but the email was NOT sent (' + (x.emailError || 'unknown') + '). Use Retry email.', true);
        else toast('Application rejected.');
        openDetail(a.id, true); refresh();
      });
    });
  }

  /* ── deep link from the team email: ?app=SW-... ── */
  function openFromUrl() {
    var code = new URLSearchParams(location.search).get('app');
    if (!code || !/^SW-\d{6}-[A-Z0-9]{5}$/.test(code)) return;
    var hit = apps.filter(function (a) { return a.app_code === code; })[0];
    if (hit) return openDetail(hit.id);
    return api({ action: 'list', q: code }).then(function (j) {
      if (j.ok && j.applications && j.applications[0]) openDetail(j.applications[0].id);
      else toast('Application ' + code + ' was not found.', true);
    });
  }

  /* ── boot ── */
  loadSession();
  if (session) start().catch(function () { showLogin(); }); else showLogin();
})();
