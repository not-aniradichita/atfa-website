/* ==========================================================================
   Aniradichita Theatre & Films Association — workshop event page
   Used by: events/acting-filmmaking-workshop.html

   Renders the "Acting & Filmmaking Workshop" landing page from events-data.js
   (event.workshops + event.workshopPage). Dates, copy and the registration
   switch all live there; nothing is hard-coded here.

   Registration stays OFF (a disabled "Registrations Coming Soon" button, no
   form, no link) until workshopPage.registration.open is true AND
   workshopPage.registration.url is an https link.
   ========================================================================== */
(function () {
  'use strict';

  var H = window.ATFA && window.ATFA.events;
  if (!H || document.body.getAttribute('data-events-view') !== 'workshop') return;

  var esc = H.esc;
  var e = H.findEvent(document.body.getAttribute('data-event-slug'));
  var mount = document.getElementById('eventMount');
  if (!mount) return;
  if (!e || !e.workshops || !e.workshopPage) {
    mount.innerHTML = '<div class="aev-lp-wrap"><div class="aev-empty" role="alert"><h1>We could not find that event</h1><p><a href="/events.html">See all events</a></p></div></div>';
    return;
  }

  var P = e.workshopPage;
  var status = H.resolveStatus(e, new Date());
  var c = H.cover(e);
  var reg = P.registration || {};
  var regOpen = reg.open === true && H.isHttps(reg.url);
  var byId = {};
  e.workshops.forEach(function (w) { byId[w.id] = w; });

  function wsDatesLine(w) {
    var d = H.wsDates(w);
    return '<time datetime="' + esc(w.startDate) + (w.endDate ? '/' + esc(w.endDate) : '') + '">' + esc(d.days + ', ' + d.dates) + '</time>';
  }

  /* ── hero ── */
  var chips = e.workshops.map(function (w) {
    var d = H.wsDates(w);
    return '<li class="aev-ws-chip aev-ws-chip--' + esc(w.id) + '"><span class="aev-ws-chip-ic" aria-hidden="true">' + esc(w.icon || '') + '</span>' +
      '<span><b>' + esc(w.title) + '</b>' + wsDatesLine(w) + '</span></li>';
  }).join('');

  var hero = '<section class="aev-ws-hero" aria-labelledby="ws-title">' +
    '<div class="aev-ws-beam" aria-hidden="true"></div>' +
    '<div class="aev-lp-wrap aev-ws-hero-grid">' +
      '<div class="aev-ws-poster aev-reveal"><img src="' + esc(H.posterSrcOf(c)) + '" alt="' + esc(c.alt || e.title) + '" width="' + c.width + '" height="' + c.height + '" fetchpriority="high" decoding="async" data-fallback></div>' +
      '<div class="aev-ws-hero-body">' +
        '<p class="aev-ws-eyebrow aev-reveal">' + esc(P.eyebrow || '') + '</p>' +
        '<h1 class="aev-ws-title aev-reveal" id="ws-title">Acting <span class="aev-ws-amp">&amp;</span> <em>Filmmaking</em> Workshop</h1>' +
        '<p class="aev-ws-tagline aev-reveal">' + esc(e.tagline || '') + '</p>' +
        '<ul class="aev-ws-chips aev-reveal" aria-label="Workshop dates">' + chips + '</ul>' +
        '<p class="aev-ws-regpill aev-reveal" role="status"><span aria-hidden="true">🔒</span> Registrations Coming Soon</p>' +
        (status === 'upcoming' ? '<div class="aev-reveal">' + H.countdownHtml(e, 'until the first workshop') + '</div>' : '') +
        '<div class="aev-cta-row aev-reveal"><a class="btn-r" href="#workshops">Choose your workshop ↓</a>' + H.shareButton(e) + '</div>' +
        '<p class="aev-share-status" role="status" aria-live="polite"></p>' +
      '</div>' +
    '</div>' +
    '<div class="aev-ws-film" aria-hidden="true"></div>' +
  '</section>';

  /* ── intro ── */
  var intro = '<section class="aev-lp-section" aria-labelledby="ws-intro"><div class="aev-lp-wrap aev-lp-narrow aev-reveal">' +
    '<h2 id="ws-intro">' + esc(P.introHeading || 'About this workshop') + '</h2>' +
    (P.intro || []).map(function (t, i) { return '<p' + (i < 2 ? ' class="aev-lp-big"' : '') + '>' + esc(t) + '</p>'; }).join('') +
    (P.introCallout ? '<p class="aev-ws-callout">' + esc(P.introCallout) + '</p>' : '') +
  '</div></section>';

  /* ── choose your workshop: two cards, each expands for "what to expect" ── */
  var cards = (P.cards || []).map(function (card) {
    var w = byId[card.id];
    if (!w) return '';
    var d = H.wsDates(w);
    var detailsId = 'ws-more-' + esc(card.id);
    return '<li class="aev-ws-card aev-ws-card--' + esc(card.id) + ' aev-reveal">' +
      '<div class="aev-ws-card-date" aria-hidden="true"><span class="aev-ws-card-month">' + esc(d.month.slice(0, 3)) + '</span><b>' + esc(d.big) + '</b><span class="aev-ws-card-year">' + d.year + '</span></div>' +
      '<div class="aev-ws-card-body">' +
        '<p class="aev-ws-card-kicker"><span aria-hidden="true">' + esc(w.icon || '') + '</span> ' + esc(card.tagline || '') + '</p>' +
        '<h3>' + esc(w.title) + '</h3>' +
        '<p class="aev-ws-card-when">' + wsDatesLine(w) + '</p>' +
        '<p class="aev-ws-card-text">' + esc(card.text) + '</p>' +
        '<details class="aev-ws-more"><summary>What to expect</summary>' +
          '<ul>' + (card.expect || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') +
          '<li>Time and venue: To be announced</li></ul></details>' +
      '</div></li>';
  }).join('');

  var choose = '<section class="aev-lp-section aev-ws-choose" id="workshops" aria-labelledby="ws-choose"><div class="aev-lp-wrap">' +
    '<h2 id="ws-choose" class="aev-reveal">' + esc(P.chooseHeading || 'Choose your workshop') + '</h2>' +
    '<p class="aev-ws-lead aev-reveal">' + esc(P.chooseText || '') + '</p>' +
    '<ul class="aev-ws-cards">' + cards + '</ul></div></section>';

  /* ── why join ── */
  var why = '<section class="aev-lp-section aev-lp-alt" aria-labelledby="ws-why"><div class="aev-lp-wrap">' +
    '<h2 id="ws-why" class="aev-reveal">' + esc(P.whyHeading || 'Why join?') + '</h2>' +
    '<ul class="aev-ws-why">' + (P.why || []).map(function (x) {
      return '<li class="aev-ws-why-card aev-reveal"><span class="aev-lp-icon" aria-hidden="true">' + esc(x.icon || '') + '</span><h3>' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p></li>';
    }).join('') + '</ul></div></section>';

  /* ── registration: clearly OFF until configured ── */
  var regBtn = regOpen
    ? '<a class="btn-r aev-ws-reg-btn" href="' + esc(reg.url) + '" target="_blank" rel="noopener noreferrer">' + esc(reg.openLabel || 'Register Now') + ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a>'
    : '<button type="button" class="aev-ws-reg-btn is-off" disabled aria-disabled="true" aria-describedby="ws-reg-note"><span aria-hidden="true">🔒</span> ' + esc(reg.label || 'Registrations Coming Soon') + '</button>';
  var register = '<section class="aev-lp-section aev-ws-register" id="register" aria-labelledby="ws-reg"><div class="aev-lp-wrap aev-reveal"><div class="aev-ws-reg-box' + (regOpen ? '' : ' is-off') + '">' +
    '<h2 id="ws-reg">' + esc(reg.heading || 'Registration') + '</h2>' +
    '<p id="ws-reg-note">' + esc(reg.text || '') + '</p>' + regBtn +
  '</div></div></section>';

  /* ── closing ── */
  var closeCards = e.workshops.map(function (w) {
    return '<li><b>' + esc(w.icon || '') + ' ' + esc(w.title) + '</b>' + wsDatesLine(w) + '</li>';
  }).join('');
  var closing = '<section class="aev-lp-section aev-ws-closing" aria-labelledby="ws-close"><div class="aev-lp-wrap aev-lp-share aev-reveal">' +
    '<h2 id="ws-close">' + esc(P.closingHeading || '') + '</h2>' +
    '<p>' + esc(P.closingText || '') + '</p>' +
    '<ul class="aev-ws-closing-dates">' + closeCards + '</ul>' +
    '<p class="aev-ws-regpill aev-ws-regpill--center" role="status"><span aria-hidden="true">🔒</span> Registrations Coming Soon</p>' +
    '<div class="aev-cta-row">' + H.shareButton(e) + '<a class="btn-g" href="/events.html">← All events</a></div>' +
    '<p class="aev-share-status" role="status" aria-live="polite"></p></div></section>';

  mount.innerHTML = H.crumbsHtml([['Home', '/index.html'], ['Events', '/events.html'], [e.title]]) +
    hero + intro + choose + why + register + closing;

  H.injectJsonLd(e);
  H.startCountdowns();

  /* ── entrance animations: gentle, once, and off for people who ask for less motion ── */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = document.querySelectorAll('.aev-reveal');
  if (!reduce && 'IntersectionObserver' in window && items.length) {
    document.documentElement.classList.add('aev-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(items, function (n, i) {
      n.style.transitionDelay = Math.min((i % 4) * 70, 210) + 'ms';
      n.addEventListener('transitionend', function done(ev) {
        if (ev.target !== n || ev.propertyName !== 'opacity') return;
        n.removeEventListener('transitionend', done);
        n.classList.remove('aev-reveal', 'is-in');   /* back to plain styles, so hover effects are not delayed */
        n.style.transitionDelay = '';
      });
      io.observe(n);
    });
    /* what is already on screen fades in right away instead of waiting for the observer */
    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(items, function (n) {
        if (n.getBoundingClientRect().top < window.innerHeight * 0.92) n.classList.add('is-in');
      });
    });
  }
})();
