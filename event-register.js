/* ==========================================================================
   Aniradichita Theatre & Films Association — event sign-up form (performers)
   Used by: events/saanjh/register/performer.html

   Renders the SAANJH performer form from events-data.js
   (event.performerRegistration), validates it in the browser, and sends it to
   the endpoint configured there. Nothing is kept in the browser: no local
   storage, no cookies. A success message is shown ONLY after the server says
   the form was saved.

   Server side: supabase/migrations/20261024_saanjh_performer_applications.sql
   (a Supabase function that re-checks every field; the public key can only
   submit, never read). To use another service instead, change `endpoint` in
   events-data.js and the send() function below.
   ========================================================================== */
(function () {
  'use strict';

  var H = window.ATFA && window.ATFA.events;
  if (!H || document.body.getAttribute('data-events-view') !== 'register-performer') return;

  var esc = H.esc;
  var e = H.findEvent(document.body.getAttribute('data-event-slug'));
  var mount = document.getElementById('eventMount');
  if (!mount) return;
  if (!e || !e.performerRegistration || !e.performerRegistration.enabled) {
    mount.innerHTML = '<div class="aev-lp-wrap"><div class="aev-empty" role="alert"><h1>We could not find that page</h1><p><a href="/events.html">See all events</a></p></div></div>';
    return;
  }

  var cfg = e.performerRegistration;
  var ep = cfg.endpoint || {};
  var endpointReady = !!(ep.url && ep.rpc && ep.anonKey);
  var isOpen = cfg.open !== false;
  var submitting = false;
  var sent = false;

  /* ── field helpers ───────────────────────────────────────────────────── */
  function field(id, label, control, o) {
    o = o || {};
    var desc = [o.hint ? id + '-hint' : '', id + '-err'].filter(Boolean).join(' ');
    return '<div class="aev-field" data-field="' + id + '"' + (o.hidden ? ' hidden' : '') + '>' +
      '<label for="' + id + '">' + label +
        (o.optional ? ' <span class="aev-opt">(optional)</span>' : ' <span class="aev-req" aria-hidden="true">*</span><span class="sr-only"> (needed)</span>') + '</label>' +
      (o.hint ? '<p class="aev-hint" id="' + id + '-hint">' + o.hint + '</p>' : '') +
      control.replace('<<DESC>>', desc) +
      '<p class="aev-error" id="' + id + '-err" hidden></p></div>';
  }
  function input(id, type, o) {
    o = o || {};
    return '<input class="aev-input" id="' + id + '" name="' + id + '" type="' + type + '"' +
      (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') +
      (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') +
      (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') +
      (o.max ? ' maxlength="' + o.max + '"' : '') +
      (o.min ? ' min="' + o.min + '"' : '') + (o.maxn ? ' max="' + o.maxn + '"' : '') +
      ' aria-describedby="<<DESC>>"' + (o.required ? ' required' : '') + '>';
  }
  function select(id, options, placeholder) {
    return '<select class="aev-input" id="' + id + '" name="' + id + '" aria-describedby="<<DESC>>" required>' +
      '<option value="">' + esc(placeholder) + '</option>' +
      options.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('') + '</select>';
  }
  function textarea(id, max, rows, placeholder) {
    return '<textarea class="aev-input" id="' + id + '" name="' + id + '" rows="' + rows + '" maxlength="' + max + '"' +
      (placeholder ? ' placeholder="' + esc(placeholder) + '"' : '') + ' aria-describedby="<<DESC>>"></textarea>';
  }

  function formHtml() {
    var hasEndpoint = endpointReady;
    return '<form id="performerForm" class="aev-form" novalidate>' +
      '<div class="aev-error-summary" id="errSummary" role="alert" tabindex="-1" hidden></div>' +

      '<fieldset class="aev-fieldset"><legend>About you</legend>' +
        field('f_name', 'Your full name', input('f_name', 'text', { autocomplete: 'name', max: 120, required: true })) +
        field('f_phone', 'Your phone number', input('f_phone', 'tel', { autocomplete: 'tel', inputmode: 'tel', max: 30, required: true, placeholder: '+91 98765 43210' }),
          { hint: 'We may call or message you on this number.' }) +
        field('f_email', 'Your email address', input('f_email', 'email', { autocomplete: 'email', max: 254, required: true, placeholder: 'name@example.com' })) +
        field('f_age', 'Your age group', select('f_age', cfg.ageGroups || [], 'Pick one')) +
        field('f_city', 'Your city', input('f_city', 'text', { autocomplete: 'address-level2', max: 80, required: true })) +
      '</fieldset>' +

      '<fieldset class="aev-fieldset"><legend>About your performance</legend>' +
        field('f_art', 'What will you perform?', select('f_art', cfg.artForms || [], 'Pick one')) +
        field('f_art_other', 'Please tell us what it is', input('f_art_other', 'text', { max: 80, required: true }), { hidden: true }) +
        field('f_title', 'Name of your performance', input('f_title', 'text', { max: 150, required: true }),
          { hint: 'For example: the name of your song, dance, poem or story.' }) +
        field('f_desc', 'Tell us about your performance', textarea('f_desc', 2000, 5, 'What will you do on stage?')) +
        field('f_lang', 'Language of your performance', input('f_lang', 'text', { max: 60, required: true, placeholder: 'For example: Hindi, Gujarati, English' })) +

        '<div class="aev-field" data-field="f_type"><fieldset class="aev-radio-group" aria-describedby="f_type-err">' +
          '<legend>Will you perform alone or with a group? <span class="aev-req" aria-hidden="true">*</span><span class="sr-only"> (needed)</span></legend>' +
          '<label class="aev-radio"><input type="radio" name="f_type" value="solo"> <span>Alone (solo)</span></label>' +
          '<label class="aev-radio"><input type="radio" name="f_type" value="group"> <span>With a group</span></label>' +
        '</fieldset><p class="aev-error" id="f_type-err" hidden></p></div>' +

        field('f_size', 'How many performers in total?', input('f_size', 'number', { min: 2, maxn: 200, inputmode: 'numeric', required: true }),
          { hidden: true, hint: 'Count everyone who will be on stage, including you.' }) +
        field('f_duration', 'How long will it be?', input('f_duration', 'text', { max: 60, placeholder: 'For example: 5 minutes' }),
          { optional: true, hint: 'Tell us how long you think it will take. This helps us plan.' }) +
        field('f_link', 'Link to your work', input('f_link', 'url', { max: 500, placeholder: 'https://' }),
          { optional: true, hint: 'A video, website or social media page where we can see your work.' }) +
        field('f_special', 'Anything special you need?', textarea('f_special', 1000, 3, 'For example: a mic, a speaker, or space to move'),
          { optional: true }) +
      '</fieldset>' +

      '<div class="aev-hp" aria-hidden="true"><label>Leave this empty<input type="text" name="website" id="f_website" tabindex="-1" autocomplete="off"></label></div>' +

      '<div class="aev-privacy"><h2>Your privacy</h2>' +
        '<p>We ask for your name, phone number and email so the SAANJH team can contact you about your performance. ' +
        'Your details are kept private. They are not shown on this website.</p>' +
        '<p>Sending this form does not mean you are in the show. The team will read it and get in touch.</p></div>' +

      '<div class="aev-field aev-field--check" data-field="f_consent">' +
        '<label class="aev-check"><input type="checkbox" id="f_consent" name="f_consent" aria-describedby="f_consent-err"> ' +
        '<span>What I wrote is true. The SAANJH team may contact me about SAANJH. <span class="aev-req" aria-hidden="true">*</span><span class="sr-only">(needed)</span></span></label>' +
        '<p class="aev-error" id="f_consent-err" hidden></p></div>' +

      '<div class="aev-form-actions">' +
        '<button type="submit" class="btn-r aev-submit" id="submitBtn"' + (hasEndpoint ? '' : ' disabled aria-disabled="true"') + '>' +
          (hasEndpoint ? 'Send my form' : 'Sending is not available yet') + '</button>' +
        '<p class="aev-form-status" id="formStatus" role="status" aria-live="polite" tabindex="-1"></p>' +
      '</div>' +
    '</form>';
  }

  /* ── validation ──────────────────────────────────────────────────────── */
  var MSG = {
    f_name: 'Please write your full name.',
    f_phone: 'Please write a phone number with 7 to 15 numbers. You can use +, spaces and dashes.',
    f_email: 'Please write an email like name@example.com.',
    f_age: 'Please pick your age group.',
    f_city: 'Please write your city.',
    f_art: 'Please pick what you will perform.',
    f_art_other: 'Please tell us what you will perform.',
    f_title: 'Please give your performance a name.',
    f_desc: 'Please tell us about your performance.',
    f_lang: 'Please write the language of your performance.',
    f_type: 'Please pick alone (solo) or with a group.',
    f_size: 'Please write how many performers. Use a number from 2 to 200.',
    f_link: 'Please write a full web link that starts with http:// or https://',
    f_consent: 'Please tick this box so we can go ahead.',
    f_duration: 'That is too long. Please write a shorter answer.'
  };
  var SERVER_FIELD = {
    full_name: 'f_name', phone: 'f_phone', email: 'f_email', age_group: 'f_age', city: 'f_city', art_form: 'f_art',
    art_form_other: 'f_art_other', performance_title: 'f_title', performance_description: 'f_desc', language: 'f_lang',
    performance_type: 'f_type', group_size: 'f_size', duration: 'f_duration', link: 'f_link', consent: 'f_consent'
  };
  var ORDER = ['f_name', 'f_phone', 'f_email', 'f_age', 'f_city', 'f_art', 'f_art_other', 'f_title', 'f_desc', 'f_lang', 'f_type', 'f_size', 'f_duration', 'f_link', 'f_consent'];

  function $(id) { return document.getElementById(id); }
  function val(id) { var n = $(id); return n ? String(n.value || '').trim() : ''; }
  function perfType() { var r = document.querySelector('input[name="f_type"]:checked'); return r ? r.value : ''; }

  function collect() {
    return {
      name: val('f_name'), phone: val('f_phone'), email: val('f_email'), age: val('f_age'), city: val('f_city'),
      art: val('f_art'), artOther: val('f_art_other'), title: val('f_title'), desc: val('f_desc'), lang: val('f_lang'),
      type: perfType(), size: val('f_size'), duration: val('f_duration'), link: val('f_link'), special: val('f_special'),
      consent: $('f_consent').checked, website: val('f_website')
    };
  }
  function validate(v) {
    var err = {};
    if (!v.name || v.name.length > 120) err.f_name = MSG.f_name;
    var digits = v.phone.replace(/\D/g, '');
    if (!/^[0-9+()\-\s.]+$/.test(v.phone) || digits.length < 7 || digits.length > 15) err.f_phone = MSG.f_phone;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email) || v.email.length > 254) err.f_email = MSG.f_email;
    if (!v.age) err.f_age = MSG.f_age;
    if (!v.city) err.f_city = MSG.f_city;
    if (!v.art) err.f_art = MSG.f_art;
    if (v.art === 'Other' && !v.artOther) err.f_art_other = MSG.f_art_other;
    if (!v.title) err.f_title = MSG.f_title;
    if (!v.desc) err.f_desc = MSG.f_desc;
    if (!v.lang) err.f_lang = MSG.f_lang;
    if (!v.type) err.f_type = MSG.f_type;
    if (v.type === 'group') {
      var n = Number(v.size);
      if (!/^\d+$/.test(v.size) || n < 2 || n > 200) err.f_size = MSG.f_size;
    }
    if (v.link && !/^https?:\/\/\S+$/i.test(v.link)) err.f_link = MSG.f_link;
    if (!v.consent) err.f_consent = MSG.f_consent;
    return err;
  }

  function showError(id, msg) {
    var p = $(id + '-err');
    if (!p) return;
    var ctl = $(id);
    p.textContent = msg;
    p.hidden = false;
    if (ctl) ctl.setAttribute('aria-invalid', 'true');
    var wrap = document.querySelector('[data-field="' + id + '"]');
    if (wrap) wrap.classList.add('has-error');
  }
  function clearError(id) {
    var p = $(id + '-err');
    if (p) { p.hidden = true; p.textContent = ''; }
    var ctl = $(id);
    if (ctl) ctl.removeAttribute('aria-invalid');
    var wrap = document.querySelector('[data-field="' + id + '"]');
    if (wrap) wrap.classList.remove('has-error');
  }
  function clearAllErrors() {
    ORDER.forEach(clearError);
    var sum = $('errSummary');
    sum.hidden = true; sum.innerHTML = '';
  }
  function focusField(id) {
    var ctl = id === 'f_type' ? document.querySelector('input[name="f_type"]') : $(id);
    if (ctl) ctl.focus();
  }
  function showErrors(err) {
    var ids = ORDER.filter(function (id) { return err[id]; });
    ids.forEach(function (id) { showError(id, err[id]); });
    var sum = $('errSummary');
    sum.innerHTML = '<strong>Please fix ' + (ids.length === 1 ? 'this' : 'these') + ':</strong><ul>' +
      ids.map(function (id) { return '<li><a href="#' + (id === 'f_type' ? 'f_type-err' : id) + '" data-focus="' + id + '">' + esc(err[id]) + '</a></li>'; }).join('') + '</ul>';
    sum.hidden = false;
    if (ids.length) focusField(ids[0]);
  }

  /* ── sending ─────────────────────────────────────────────────────────── */
  function send(v) {
    var url = String(ep.url).replace(/\/+$/, '') + '/rest/v1/rpc/' + ep.rpc;
    var body = {
      p_full_name: v.name, p_phone: v.phone, p_email: v.email, p_age_group: v.age, p_city: v.city,
      p_art_form: v.art, p_art_form_other: v.art === 'Other' ? v.artOther : null,
      p_performance_title: v.title, p_performance_description: v.desc, p_language: v.lang,
      p_performance_type: v.type, p_group_size: v.type === 'group' ? Number(v.size) : null,
      p_duration: v.duration || null, p_link: v.link || null, p_special_requirements: v.special || null,
      p_consent: v.consent, p_website: v.website
    };
    return fetch(url, {
      method: 'POST',
      headers: { apikey: ep.anonKey, Authorization: 'Bearer ' + ep.anonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json();
    });
  }

  function setStatus(msg, kind) {
    var s = $('formStatus');
    s.textContent = msg;
    s.className = 'aev-form-status' + (kind ? ' is-' + kind : '');
  }
  function setBusy(busy) {
    submitting = busy;
    var b = $('submitBtn');
    b.disabled = busy || !endpointReady;
    b.setAttribute('aria-disabled', String(b.disabled));
    b.textContent = busy ? 'Sending…' : (endpointReady ? 'Send my form' : 'Sending is not available yet');
    $('performerForm').setAttribute('aria-busy', String(busy));
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if (submitting || sent) return;
    if (!endpointReady) {
      setStatus('Sending forms is not switched on yet, so nothing was sent. Please check back soon.', 'error');
      return;
    }
    clearAllErrors();
    setStatus('');
    var v = collect();
    var err = validate(v);
    if (Object.keys(err).length) { showErrors(err); return; }

    setBusy(true);
    setStatus('Sending your form…');
    send(v).then(function (data) {
      if (data && data.ok === true) {
        sent = true;
        var first = v.name.split(/\s+/)[0];
        $('performerForm').outerHTML = '<div class="aev-success" role="status" tabindex="-1" id="successBox">' +
          '<h2>Thank you, ' + esc(first) + '!</h2>' +
          '<p>We got your form for <strong>' + esc(v.title) + '</strong>.</p>' +
          '<p>The SAANJH team will read it and get in touch with you on the phone number or email you gave us.</p>' +
          '<p class="aev-success-note">Sending the form does not mean you are in the show yet.</p>' +
          '<p><a class="btn-g" href="' + esc(e.pageUrl || '/events.html') + '">← Back to SAANJH</a></p></div>';
        var box = $('successBox');
        if (box) box.focus();
        return;
      }
      setBusy(false);
      if (data && data.error === 'duplicate') {
        setStatus('We already have this performance from this email, so we did not add it again. Thank you!', 'error');
      } else if (data && data.field && SERVER_FIELD[data.field]) {
        var id = SERVER_FIELD[data.field];
        var one = {}; one[id] = MSG[id] || 'Please check this answer.';
        showErrors(one);
      } else {
        setStatus('Sorry, something went wrong and your form was not saved. Please try again in a little while.', 'error');
      }
    }).catch(function () {
      setBusy(false);
      setStatus('Sorry, we could not send your form. It was not saved. Please check your internet and try again.', 'error');
    });
  }

  /* ── page ────────────────────────────────────────────────────────────── */
  var c = H.cover(e);
  var notice = '';
  if (!isOpen) {
    notice = '<div class="aev-notice aev-notice--warn" role="status"><strong>' + esc(cfg.closedMessage || 'Registration is not open right now.') + '</strong></div>';
  } else if (!endpointReady) {
    notice = '<div class="aev-notice aev-notice--warn" role="status"><strong>Sending forms is not switched on yet.</strong> ' +
      'You can look at the form, but it cannot be sent until the organiser sets it up. Nothing you type is saved.</div>';
  }

  mount.innerHTML = H.crumbsHtml([['Home', '/index.html'], ['Events', '/events.html'], [e.title, e.pageUrl || '/events.html'], ['Performer Registration']]) +
    '<section class="aev-lp-hero aev-lp-hero--form" aria-labelledby="lp-title"><div class="aev-lp-wrap aev-lp-hero-grid aev-lp-hero-grid--form">' +
      '<div class="aev-poster aev-lp-poster aev-lp-poster--small">' + (c ? '<img src="' + esc(H.posterSrcOf(c)) + '" alt="' + esc(c.alt || e.title) + '" decoding="async" data-fallback>' : '') + '</div>' +
      '<div class="aev-lp-hero-body">' +
        '<div class="aev-status-row">' + H.statusPill(e, H.resolveStatus(e, new Date())) + '<span class="aev-type">Performers</span></div>' +
        '<h1 class="aev-lp-page-title" id="lp-title">Performer Registration — SAANJH</h1>' +
        '<p class="aev-lp-lead">We are excited that you want to perform at SAANJH! Tell us a little about yourself and your performance.</p>' +
        H.factsHtml(e) +
        '<p class="aev-lp-switch">Coming to watch instead? ' + (e.audienceTicketing && e.audienceTicketing.enabled ? '<a href="' + esc(e.audienceTicketing.route) + '">Get audience tickets</a>' : '') + '</p>' +
      '</div></div></section>' +
    '<section class="aev-lp-section"><div class="aev-lp-wrap aev-form-wrap">' + notice + (isOpen ? formHtml() : '') + '</div></section>';

  if (isOpen) {
    var form = $('performerForm');
    form.addEventListener('submit', onSubmit);
    // clear a field's error as soon as the person fixes it
    form.addEventListener('input', function (ev) {
      var t = ev.target;
      var id = t.name === 'f_type' ? 'f_type' : t.id;
      if (id && $(id + '-err') && !$(id + '-err').hidden) clearError(id);
    });
    // "Other" art form and "Group" size show only when needed
    function syncConditional() {
      var other = $('f_art').value === 'Other';
      var wrapO = document.querySelector('[data-field="f_art_other"]');
      wrapO.hidden = !other;
      if (!other) { $('f_art_other').value = ''; clearError('f_art_other'); }
      var group = perfType() === 'group';
      var wrapS = document.querySelector('[data-field="f_size"]');
      wrapS.hidden = !group;
      if (!group) { $('f_size').value = ''; clearError('f_size'); }
    }
    form.addEventListener('change', syncConditional);
    syncConditional();
    $('errSummary').addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-focus]');
      if (!a) return;
      ev.preventDefault();
      focusField(a.getAttribute('data-focus'));
    });
  }
})();
