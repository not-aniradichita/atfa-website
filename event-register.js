/* ==========================================================================
   Aniradichita Theatre & Films Association — SAANJH performer sign-up page
   Used by: events/saanjh/register/performer.html

   Performers apply on a Google Form. This page explains what to expect and
   sends them there (same tab). The form address, and whether sign-up is open,
   live in events-data.js (event.performerRegistration), so changing the form
   later is a one-line edit. There is no form, storage or tracking on this site.
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

  /* Only a real https link on an allowed Google Forms address counts. */
  function formLink() {
    try {
      var u = new URL(String(cfg.formUrl || '').trim());
      var hosts = cfg.formHosts && cfg.formHosts.length ? cfg.formHosts : null;
      var okHost = !hosts || hosts.some(function (d) { return u.hostname === d || u.hostname.slice(-(d.length + 1)) === '.' + d; });
      return u.protocol === 'https:' && okHost ? u.href : '';
    } catch (err) {
      return '';
    }
  }

  var link = cfg.open !== false ? formLink() : '';
  var label = cfg.buttonLabel || 'Register as a Performer';
  var c = H.cover(e);

  var apply;
  if (link) {
    apply = '<div class="aev-apply">' +
      '<h2>Ready to perform?</h2>' +
      '<p>Tell us about yourself and what you would like to perform. You will fill in a short form on Google Forms.</p>' +
      '<ul class="aev-apply-steps">' +
        '<li>Press the button below to open the form.</li>' +
        '<li>Answer the questions and send it.</li>' +
        '<li>The SAANJH team will read your form and contact you with the next steps.</li>' +
      '</ul>' +
      '<a class="btn-r aev-apply-btn" href="' + esc(link) + '">' + esc(label) + '</a>' +
      '<p class="aev-apply-note">Sending the form does not guarantee a place on stage.</p>' +
    '</div>';
  } else {
    apply = '<div class="aev-apply">' +
      '<h2>Performer registration</h2>' +
      '<p>' + esc(cfg.open === false ? (cfg.closedMessage || 'Performer registration is not open right now. Please check back soon.') : 'Performer registration is not available right now. Please check back soon.') + '</p>' +
      '<span class="btn-g aev-apply-btn" role="link" aria-disabled="true">Registration Coming Soon</span>' +
    '</div>';
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
    '<section class="aev-lp-section"><div class="aev-lp-wrap aev-apply-wrap">' + apply + '</div></section>';
})();
