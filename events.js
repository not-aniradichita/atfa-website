/* ==========================================================================
   Aniradichita Theatre & Films Association — Events page behaviour
   Used by: events.html only

   Reads window.ATFA_EVENTS (events-data.js) and window.ATFA.ticketing
   (ticketing.js). All content lives in the data file; this script only
   classifies, sorts and renders it. Event "detail pages" are an accessible
   modal on this same page (matching this site's one-file-per-section
   convention) that also updates the URL hash (events.html#e-<slug>) so a
   specific event can still be linked and shared directly.
   ========================================================================== */
(function () {
  'use strict';

  var EVENTS = window.ATFA_EVENTS || [];
  var ticketing = (window.ATFA && window.ATFA.ticketing) || null;

  var ORG_NAME = 'Aniradichita Theatre & Films Association';
  var INSTAGRAM = 'https://www.instagram.com/aniradichita_theatre_films/';
  var PAGE_SIZE = 12;

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function esc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML.replace(/"/g, '&quot;');
  }
  function $(sel, scope) { return (scope || document).querySelector(sel); }
  function $$(sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); }

  function imgUrl(src, width) {
    return /^https:\/\/[^/]+\.wordpress\.com\/wp-content\/uploads\//.test(src) ? src + '?w=' + width : src;
  }
  function imgSrcset(src) {
    if (imgUrl(src, 1) === src) return '';
    return imgUrl(src, 480) + ' 480w, ' + imgUrl(src, 800) + ' 800w, ' + imgUrl(src, 1200) + ' 1200w';
  }

  /* ── dates (Asia/Kolkata, date-only strings 'YYYY-MM-DD') ────────────── */
  function istStart(date) { return new Date(date + 'T00:00:00+05:30'); }
  function istEnd(date) { return new Date(date + 'T23:59:59.999+05:30'); }
  function ymd(date) { var p = date.split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function weekdayName(date) { var p = ymd(date); return DAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()]; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtDate(date) { var p = ymd(date); return p.d + ' ' + MONTHS[p.m - 1] + ' ' + p.y; }
  function fmtShort(date) { var p = ymd(date); return pad(p.d) + '.' + pad(p.m) + '.' + pad(p.y % 100); }
  function fmtRange(a, b) {
    if (!b || b === a) return fmtDate(a);
    var s = ymd(a), e = ymd(b);
    if (s.y === e.y && s.m === e.m) return s.d + ' – ' + e.d + ' ' + MONTHS[s.m - 1] + ' ' + s.y;
    if (s.y === e.y) return s.d + ' ' + MONTHS[s.m - 1] + ' – ' + e.d + ' ' + MONTHS[e.m - 1] + ' ' + s.y;
    return fmtDate(a) + ' – ' + fmtDate(b);
  }

  /* Status is derived from dates whenever an event has one, so nothing has
     to be edited by hand when an event passes. Undated archive entries use
     the `status` written in the data file. */
  function resolveStatus(event, now) {
    now = now || new Date();
    if (event.date) {
      if (now > istEnd(event.endDate || event.date)) return 'past';
      if (now >= istStart(event.date)) return 'live';
      return 'upcoming';
    }
    return event.status === 'upcoming' || event.status === 'live' ? event.status : 'past';
  }

  function sortKey(e) { return e.date || e.datePublished || ''; }
  function sourceOrder(e) { return parseInt(String(e.id).replace(/\D/g, ''), 10) || 0; }
  function byNewest(a, b) { return sortKey(b).localeCompare(sortKey(a)) || sourceOrder(b) - sourceOrder(a); }
  function bySoonest(a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || sortKey(a).localeCompare(sortKey(b)); }

  function dateLabel(e) {
    if (e.date) return fmtRange(e.date, e.endDate);
    if (e.datePublished) return 'Archived ' + e.datePublished.slice(0, 4);
    return '';
  }
  function dateTimeTag(e, cls) {
    var label = dateLabel(e);
    if (!label) return '';
    var attr = e.date ? ' datetime="' + esc(e.date) + '"' : ' title="The event date is not stated in the archive"';
    return '<time class="' + (cls || 'aev-date') + '"' + attr + '>' + esc(label) + '</time>';
  }

  var STATUS = {
    upcoming: { cls: 'is-upcoming', label: function () { return 'Upcoming'; } },
    live: { cls: 'is-live', label: function (e) { return e.endDate && e.endDate !== e.date ? 'Ongoing' : 'Happening today'; } },
    past: { cls: 'is-past', label: function () { return 'Past event'; } }
  };
  function statusPill(e, status) {
    var s = STATUS[status];
    return '<span class="aev-status ' + s.cls + '"><i class="aev-status-dot" aria-hidden="true"></i>' + esc(s.label(e)) + '</span>';
  }

  /* ── ticketing UI (eligibility/URL logic lives in ticketing.js) ───────── */
  function ticketState(e) {
    return ticketing ? ticketing.resolve(e, new Date()) : { state: 'hidden', options: [], info: [] };
  }

  function ticketOptionButton(opt) {
    var cls = 'aev-ticket-btn' + (opt.id ? ' aev-ticket-btn--' + esc(opt.id) : '');
    if (opt.state === 'open') {
      return '<a class="' + cls + '" href="' + esc(opt.href) + '" target="_blank" rel="noopener noreferrer" data-ticket-option="' + esc(opt.id) + '"' +
        (opt.provider ? ' data-provider="' + esc(opt.provider) + '"' : '') + '>' +
        esc(opt.buttonLabel) + ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens Razorpay in a new tab)</span></a>';
    }
    if (opt.state === 'coming-soon') {
      return '<button type="button" class="' + cls + '" aria-disabled="true" data-ticket-state="coming-soon" data-ticket-option="' + esc(opt.id) + '">' +
        esc(opt.pendingLabel || 'Releasing Soon') + '</button>';
    }
    return '';
  }

  /* Renders the whole "Book Your Tickets" panel: one row per ticket type,
     each with its own label, optional note, and its OWN button/link — never
     a single generic button once there is more than one ticket type. */
  function ticketOptionsSection(e, res, headingTag) {
    if (!res || res.state === 'hidden' || !res.options.length) return '';
    var id = 'tix-' + esc(e.slug);
    var rows = res.options.map(function (opt) {
      return '<li class="aev-ticket-row' + (opt.id ? ' aev-ticket-row--' + esc(opt.id) : '') + '">' +
        '<div class="aev-ticket-row-info">' +
          '<span class="aev-ticket-row-label">' + esc(opt.label) + '</span>' +
          (opt.note ? '<span class="aev-ticket-row-note">' + esc(opt.note) + '</span>' : '') +
          (opt.state === 'coming-soon' && opt.opensAt && opt.opensAt > new Date()
            ? '<span class="aev-ticket-row-note">Opens ' + esc(fmtDate(opt.opensAt.toISOString().slice(0, 10))) + '</span>' : '') +
        '</div>' +
        ticketOptionButton(opt) +
      '</li>';
    }).join('');
    return '<div class="aev-tickets" aria-labelledby="' + id + '">' +
      '<' + headingTag + ' id="' + id + '" class="aev-tickets-h">' + esc(res.heading || 'Book Your Tickets') + '</' + headingTag + '>' +
      '<ul class="aev-ticket-options">' + rows + '</ul>' +
      (res.info.length ? '<dl class="aev-dl aev-tickets-info">' + res.info.map(function (r) {
        return '<div class="aev-dl-row"><dt>' + esc(r.label) + '</dt><dd>' + (r.value ? esc(r.value) : '<span class="aev-tba">To be announced</span>') + '</dd></div>';
      }).join('') + '</dl>' : '') +
    '</div>';
  }

  /* ── detail rows (shared by feature card + modal) ─────────────────────── */
  var TBA = '<span class="aev-tba">To be announced</span>';
  function speakersHtml(list) {
    return '<ul class="aev-people">' + list.map(function (s) {
      return '<li><b>' + esc(s.name) + '</b>' + (s.role ? '<span>' + esc(s.role) + '</span>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function detailRows(e, status) {
    var upcoming = status !== 'past';
    var rows = [];
    function add(label, html, tbaWhenMissing) {
      if (html) rows.push([label, html]);
      else if (upcoming && tbaWhenMissing) rows.push([label, TBA]);
    }
    if (e.date) {
      add('Date', esc(fmtRange(e.date, e.endDate)) + (!e.endDate || e.endDate === e.date ? ' <span class="aev-dim">(' + esc(weekdayName(e.date)) + ')</span>' : '') +
        (e.dateNote ? '<span class="aev-fine">' + esc(e.dateNote) + '</span>' : ''));
    } else if (e.datePublished) {
      add('Date', '<span class="aev-dim">Not stated in the archive (entry published ' + esc(fmtDate(e.datePublished)) + ')</span>');
    }
    add('Time', e.time ? esc(e.time) : '', true);
    add('Venue', e.venue ? esc(e.venue) : '', true);
    add('Location', e.location ? esc(e.location) : '', false);
    add('Format', esc(e.type + (e.series ? ' · ' + e.series : '') + (e.session ? ' · Session ' + e.session : '')));
    add('Session theme', e.topic ? esc(e.topic) : '', false);
    add(e.speakers.length > 1 ? 'Guests' : 'Guest', e.speakers.length ? speakersHtml(e.speakers) : '', false);
    add('In association with', e.collaborators.length ? esc(e.collaborators.join(', ')) : '', false);
    add(e.organizerLabel || 'Organised by', esc(e.organizer || (upcoming ? ORG_NAME : '')), false);
    add('Entry', e.entry ? esc(e.entry) : '', false);
    return rows;
  }
  function dl(rows) {
    return '<dl class="aev-dl">' + rows.map(function (r) {
      return '<div class="aev-dl-row"><dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  /* ── cards ───────────────────────────────────────────────────────────── */
  function cover(e) { return e.images && e.images[0] ? e.images[0] : null; }
  function cardImage(e) {
    var c = cover(e);
    if (!c) return '<div class="aev-card-fallback" aria-hidden="true">🎭</div>';
    var set = imgSrcset(c.src);
    return '<img src="' + esc(imgUrl(c.src, 640)) + '"' + (set ? ' srcset="' + esc(set) + '" sizes="(min-width:1100px) 380px, (min-width:640px) 45vw, 92vw"' : '') +
      ' alt="" width="640" height="400" loading="lazy" decoding="async" data-fallback>';
  }
  function renderCard(e, status) {
    var badge = status === 'past' ? '' : '<span class="aev-card-badge">' + statusPill(e, status) + '</span>';
    return '<article class="aev-card' + (status === 'past' ? '' : ' is-live-card') + '">' +
      '<div class="aev-card-media">' + cardImage(e) + badge + '</div>' +
      '<div class="aev-card-body">' +
        '<div class="aev-card-meta"><span class="aev-type">' + esc(e.type) + '</span>' + dateTimeTag(e) + '</div>' +
        '<h3 class="aev-card-title"><button type="button" class="aev-card-link" data-open-event="' + esc(e.slug) + '">' + esc(e.title) + '</button></h3>' +
        '<p class="aev-card-desc">' + esc(e.description) + '</p>' +
        '<button type="button" class="aev-card-more" data-open-event="' + esc(e.slug) + '">View Details <i aria-hidden="true">→</i></button>' +
      '</div></article>';
  }

  /* ── featured (Sunday Decodes) ───────────────────────────────────────── */
  function countdownHtml(e) {
    return '<div class="aev-countdown" role="timer" aria-label="Time until event day" data-countdown="' + esc(istStart(e.date).toISOString()) + '">' +
      ['d:Days', 'h:Hours', 'm:Minutes'].map(function (u) {
        var k = u.split(':');
        return '<div class="aev-cd-unit"><span class="aev-cd-num" data-cd="' + k[0] + '">--</span><span class="aev-cd-lbl">' + k[1] + '</span></div>';
      }).join('') + '<p class="aev-cd-note">until event day</p></div>';
  }
  function shareButton(e) {
    return '<button type="button" class="btn-g aev-share-btn" data-share="' + esc(e.slug) + '">↗ Share</button>';
  }

  function renderFeature(e, status) {
    var c = cover(e);
    var res = ticketState(e);
    var poster = c
      ? '<img src="' + esc(imgUrl(c.src, 900)) + '" alt="' + esc(c.alt || e.title) + '"' + (c.width ? ' width="' + c.width + '" height="' + c.height + '"' : '') +
        ' fetchpriority="high" decoding="async" data-fallback>'
      : '<div class="aev-card-fallback" aria-hidden="true">🎭</div>';

    var dateBlock = '';
    if (e.date) {
      var p = ymd(e.date);
      dateBlock = '<div class="aev-datebox">' +
        '<div class="aev-datebox-cal" aria-hidden="true"><span>' + MONTHS[p.m - 1].slice(0, 3) + '</span><b>' + p.d + '</b><span>' + p.y + '</span></div>' +
        '<div class="aev-datebox-text"><time datetime="' + esc(e.date) + '"><span class="aev-datebox-long">' + esc(weekdayName(e.date) + ', ' + fmtRange(e.date, e.endDate)) + '</span></time>' +
        '<span class="aev-datebox-short" aria-label="Date written as ' + esc(fmtShort(e.date)) + '">' + esc(fmtShort(e.date)) + '</span>' +
        (e.time ? '<span class="aev-datebox-time">' + esc(e.time) + '</span>' : '') + '</div></div>';
    }

    var clues = e.slug === 'sunday-decodes'
      ? '<a class="aev-follow" href="' + INSTAGRAM + '" target="_blank" rel="noopener noreferrer">Clues are coming — follow our posts &amp; reels on Instagram <span class="sr-only">(opens in a new tab)</span></a>'
      : '';

    return '<article class="aev-feature" aria-labelledby="ft-' + esc(e.slug) + '">' +
      '<div class="aev-poster">' + poster + '</div>' +
      '<div class="aev-feature-body">' +
        '<div class="aev-status-row">' + statusPill(e, status) + '<span class="aev-type">' + esc(e.type) + '</span></div>' +
        '<h2 class="aev-feature-title" id="ft-' + esc(e.slug) + '">' + esc(e.title) + '</h2>' +
        (e.tagline ? '<p class="aev-tagline">' + esc(e.tagline) + '</p>' : '') +
        dateBlock +
        (e.date && status === 'upcoming' ? countdownHtml(e) : '') +
        '<p class="aev-feature-desc">' + esc(e.description) + '</p>' +
        ticketOptionsSection(e, res, 'h3') +
        '<div class="aev-cta-row">' + shareButton(e) + '<button type="button" class="btn-g" data-open-event="' + esc(e.slug) + '">Full details</button></div>' +
        '<p class="aev-share-status" role="status" aria-live="polite"></p>' +
        clues +
      '</div></article>';
  }

  function renderEmptyLive() {
    return '<div class="aev-empty" role="status">' +
      '<h3>No upcoming events right now</h3>' +
      '<p>The stage is dark for the moment. Follow us on <a href="' + INSTAGRAM + '" target="_blank" rel="noopener noreferrer">Instagram</a> to hear about the next one first — and explore what we have staged so far below.</p></div>';
  }

  /* ── index rendering ────────────────────────────────────────────────── */
  var pastState = { list: [], type: 'All', shown: PAGE_SIZE };

  function renderLive() {
    var now = new Date();
    var items = EVENTS.map(function (e) { return { e: e, s: resolveStatus(e, now) }; });
    var live = items.filter(function (i) { return i.s !== 'past'; }).sort(function (a, b) { return bySoonest(a.e, b.e); });
    var mount = $('#liveMount');
    if (!mount) return live;
    if (!live.length) {
      mount.innerHTML = renderEmptyLive();
    } else {
      var html = '';
      var cards = '';
      live.forEach(function (i) {
        if (i.e.featured) html += '<div class="aev-feature-wrap">' + renderFeature(i.e, i.s) + '</div>';
        else cards += renderCard(i.e, i.s);
      });
      if (cards) html += '<div class="aev-grid">' + cards + '</div>';
      mount.innerHTML = html;
    }
    var liveCount = $('#liveCount');
    if (liveCount) liveCount.textContent = live.length ? live.length + (live.length === 1 ? ' event' : ' events') : 'None scheduled';
    live.forEach(function (i) { injectJsonLd(i.e); });
    startCountdowns();
    return live;
  }

  function pastFiltered() {
    return pastState.type === 'All' ? pastState.list : pastState.list.filter(function (e) { return e.type === pastState.type; });
  }
  function renderPastControls() {
    var mount = $('#pastFilters');
    if (!mount) return;
    var counts = {};
    pastState.list.forEach(function (e) { counts[e.type] = (counts[e.type] || 0) + 1; });
    var types = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var chips = [['All', pastState.list.length]].concat(types.map(function (t) { return [t, counts[t]]; }));
    mount.innerHTML = chips.map(function (c) {
      return '<button type="button" class="aev-chip" data-type="' + esc(c[0]) + '" aria-pressed="' + (c[0] === pastState.type) + '">' +
        esc(c[0]) + ' <span class="aev-chip-n">' + c[1] + '</span></button>';
    }).join('');
  }
  function renderPastGrid(focusFirstNew) {
    var grid = $('#pastGrid');
    if (!grid) return;
    var list = pastFiltered();
    var visible = list.slice(0, pastState.shown);
    var firstNewIndex = grid.children.length;
    grid.innerHTML = visible.map(function (e) { return renderCard(e, 'past'); }).join('');
    var status = $('#pastStatus');
    if (status) status.textContent = 'Showing ' + visible.length + ' of ' + list.length + ' past events' + (pastState.type === 'All' ? '' : ' — ' + pastState.type);
    var more = $('#pastMore');
    if (more) more.hidden = visible.length >= list.length;
    if (focusFirstNew && grid.children[firstNewIndex]) {
      var link = $('.aev-card-link', grid.children[firstNewIndex]);
      if (link) link.focus();
    }
  }
  function renderPast() {
    var now = new Date();
    pastState.list = EVENTS.filter(function (e) { return resolveStatus(e, now) === 'past'; }).sort(byNewest);
    renderPastControls();
    renderPastGrid(false);
    var pastCount = $('#pastCount');
    if (pastCount) pastCount.textContent = pastState.list.length + ' events';
  }

  function bindIndexEvents() {
    var filters = $('#pastFilters');
    if (filters) {
      filters.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-type]');
        if (!btn) return;
        pastState.type = btn.getAttribute('data-type');
        pastState.shown = PAGE_SIZE;
        renderPastControls();
        renderPastGrid(false);
        var again = $('[data-type="' + pastState.type.replace(/"/g, '\\"') + '"]', filters);
        if (again) again.focus();
      });
    }
    var more = $('#pastMore');
    if (more) more.addEventListener('click', function () { pastState.shown += PAGE_SIZE; renderPastGrid(true); });
  }

  /* ── detail modal ────────────────────────────────────────────────────── */
  var modalOpener = null;
  function related(current, now) {
    var scored = EVENTS.filter(function (e) { return e.slug !== current.slug; }).map(function (e) {
      var score = (current.series && e.series === current.series ? 3 : 0) + (e.type === current.type ? 2 : 0);
      return { e: e, score: score, s: resolveStatus(e, now) };
    });
    scored.sort(function (a, b) { return b.score - a.score || byNewest(a.e, b.e); });
    return scored.slice(0, 3);
  }
  function renderVideos(e) {
    if (!e.videos || !e.videos.length) return '';
    return '<section class="aev-section" aria-labelledby="vid-h"><h3 id="vid-h">Video</h3><div class="aev-videos">' +
      e.videos.map(function (v, i) {
        var thumb = v.provider === 'youtube' ? 'https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/hqdefault.jpg' : '';
        return '<button type="button" class="aev-video" data-video-provider="' + esc(v.provider) + '" data-video-id="' + esc(v.id) + '" aria-label="Play video ' + (i + 1) + ': ' + esc(e.title) + '">' +
          (thumb ? '<img src="' + thumb + '" alt="" loading="lazy" decoding="async">' : '') +
          '<span class="aev-video-play" aria-hidden="true">▶</span></button>';
      }).join('') + '</div></section>';
  }
  function renderGallery(e) {
    var imgs = e.images || [];
    if (imgs.length < 2) return '';
    return '<section class="aev-section" aria-labelledby="gal-h"><h3 id="gal-h">Gallery <span class="aev-dim">· ' + imgs.length + ' photos</span></h3><ul class="aev-gallery">' +
      imgs.map(function (im, i) {
        return '<li><button type="button" class="aev-thumb" data-gallery-index="' + i + '" aria-label="Open photo ' + (i + 1) + ' of ' + imgs.length + '">' +
          '<img src="' + esc(imgUrl(im.src, 480)) + '" alt="' + esc(im.alt || e.title) + '" width="480" height="480" loading="lazy" decoding="async" data-fallback></button></li>';
      }).join('') + '</ul></section>';
  }
  function renderAbout(e) {
    var paras = e.longDescription && e.longDescription.length ? e.longDescription : [e.description];
    return '<section class="aev-section" aria-labelledby="about-h"><h3 id="about-h">About this event</h3>' +
      paras.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</section>';
  }
  function sourceLinks(e) {
    var urls = [e.sourceUrl].concat(e.sourceUrls || []).filter(Boolean);
    if (!urls.length) return '';
    return '<section class="aev-section aev-source" aria-labelledby="src-h"><h3 id="src-h">Archive</h3><p>This entry comes from the Aniradichita archive.</p><ul>' +
      urls.map(function (u, i) {
        return '<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">Original post' + (urls.length > 1 ? ' ' + (i + 1) : '') + ' <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></li>';
      }).join('') + '</ul></section>';
  }

  function eventModalHtml(e, status) {
    var c = cover(e);
    var res = ticketState(e);
    var rel = related(e, new Date());
    return '<figure class="aev-modal-cover">' +
        (c ? '<img src="' + esc(imgUrl(c.src, 1000)) + '" srcset="' + esc(imgSrcset(c.src)) + '" sizes="(min-width:900px) 46vw, 92vw" alt="' + esc(c.alt || e.title) + '" fetchpriority="high" decoding="async" data-fallback>' : '') +
      '</figure>' +
      '<div class="aev-modal-body">' +
        '<div class="aev-status-row">' + statusPill(e, status) + '<span class="aev-type">' + esc(e.type) + '</span></div>' +
        '<h2 id="evModalTitle">' + esc(e.title) + '</h2>' +
        (e.tagline ? '<p class="aev-tagline">' + esc(e.tagline) + '</p>' : '') +
        '<p class="aev-feature-desc">' + esc(e.description) + '</p>' +
        (status !== 'past' ? ticketOptionsSection(e, res, 'h3') : '') +
        '<div class="aev-cta-row">' + shareButton(e) + '</div><p class="aev-share-status" role="status" aria-live="polite"></p>' +
        renderAbout(e) + renderVideos(e) + renderGallery(e) +
        '<section class="aev-section" aria-labelledby="dt-h"><h3 id="dt-h">Event details</h3>' + dl(detailRows(e, status)) + '</section>' +
        sourceLinks(e) +
        (rel.length ? '<section class="aev-section" aria-labelledby="rel-h"><h3 id="rel-h">More events</h3><div class="aev-grid aev-grid--modal">' +
          rel.map(function (r) { return renderCard(r.e, r.s); }).join('') + '</div></section>' : '') +
      '</div>';
  }

  function openEventModal(slug, opener) {
    var e = EVENTS.filter(function (x) { return x.slug === slug; })[0];
    var dlg = $('#eventModal');
    if (!e || !dlg) return;
    modalOpener = opener || document.activeElement;
    var status = resolveStatus(e, new Date());
    $('#eventModalContent', dlg).innerHTML = eventModalHtml(e, status);
    if (typeof dlg.showModal === 'function' && !dlg.open) dlg.showModal();
    else dlg.setAttribute('open', '');
    history.replaceState(null, '', '#e-' + slug);
    startCountdowns();
    var closeBtn = $('.aev-modal-close', dlg);
    if (closeBtn) closeBtn.focus();
  }
  function closeEventModal() {
    var dlg = $('#eventModal');
    if (!dlg) return;
    if (typeof dlg.close === 'function' && dlg.open) dlg.close();
    else dlg.removeAttribute('open');
    if (location.hash.indexOf('#e-') === 0) history.replaceState(null, '', location.pathname + location.search);
    if (modalOpener && document.contains(modalOpener)) modalOpener.focus();
    modalOpener = null;
  }
  function openFromHash() {
    var m = /^#e-(.+)$/.exec(location.hash);
    if (m) openEventModal(decodeURIComponent(m[1]), null);
  }

  /* ── SEO: structured data for the featured upcoming event only (this is
     a single-page listing, not per-event URLs, so page-level JSON-LD is the
     honest scope here) ─────────────────────────────────────────────────── */
  function injectJsonLd(e) {
    if (!e.date || $('#jsonld-' + e.slug)) return;
    var c = cover(e);
    var data = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: e.title,
      description: e.description,
      startDate: e.date,
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: { '@type': 'Organization', name: e.organizer || ORG_NAME }
    };
    if (e.endDate) data.endDate = e.endDate;
    if (c) data.image = [/^https?:/.test(c.src) ? imgUrl(c.src, 1200) : new URL(c.src, location.href).href];
    if (e.venue && /^online/i.test(e.venue)) {
      data.eventAttendanceMode = 'https://schema.org/OnlineEventAttendanceMode';
      data.location = { '@type': 'VirtualLocation', url: location.href };
    } else if (e.venue) {
      data.location = { '@type': 'Place', name: e.venue, address: e.location || e.venue };
    }
    var res = ticketState(e);
    if (res.options && res.options.length) {
      data.offers = res.options.filter(function (o) { return o.state === 'open'; }).map(function (o) {
        return { '@type': 'Offer', name: o.label, url: o.href, availability: 'https://schema.org/InStock' };
      });
      if (!data.offers.length) delete data.offers;
    }
    var tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = 'jsonld-' + e.slug;
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  }

  /* ── countdown ───────────────────────────────────────────────────────── */
  var countdownTimer = null;
  function startCountdowns() {
    var nodes = $$('[data-countdown]');
    if (!nodes.length) { if (countdownTimer) { window.clearInterval(countdownTimer); countdownTimer = null; } return; }
    function tick() {
      var now = Date.now();
      nodes.forEach(function (node) {
        var diff = new Date(node.getAttribute('data-countdown')).getTime() - now;
        if (diff <= 0) { node.hidden = true; return; }
        var mins = Math.floor(diff / 60000);
        var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
        var values = { d: d, h: pad(h), m: pad(m) };
        Object.keys(values).forEach(function (k) { var el = $('[data-cd="' + k + '"]', node); if (el) el.textContent = values[k]; });
        node.setAttribute('aria-label', 'Time until event day: ' + d + ' days, ' + h + ' hours, ' + m + ' minutes');
      });
    }
    tick();
    if (countdownTimer) window.clearInterval(countdownTimer);
    countdownTimer = window.setInterval(tick, 30000);
  }

  /* ── share ───────────────────────────────────────────────────────────── */
  function handleShare(btn) {
    var slug = btn.getAttribute('data-share');
    var e = EVENTS.filter(function (x) { return x.slug === slug; })[0];
    if (!e) return;
    var url = location.origin + location.pathname + '#e-' + slug;
    var text = e.title + (e.date ? ' — ' + fmtRange(e.date, e.endDate) : '') + ' | ' + ORG_NAME;
    var scope = btn.closest('.aev-feature-body, .aev-modal-body') || document;
    var status = $('.aev-share-status', scope);
    function say(msg) { if (status) status.textContent = msg; }
    if (navigator.share) { navigator.share({ title: e.title, text: text, url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { say('Link copied to clipboard.'); }, function () { say('Copy this link: ' + url); });
    } else { say('Copy this link: ' + url); }
  }

  /* ── gallery lightbox + click-to-load video (inside the modal) ───────── */
  var lightbox = null;
  function buildLightbox() {
    lightbox = document.createElement('dialog');
    lightbox.className = 'aev-lightbox';
    lightbox.setAttribute('aria-label', 'Photo gallery');
    lightbox.innerHTML = '<button type="button" class="aev-lb-close" aria-label="Close gallery">✕</button>' +
      '<button type="button" class="aev-lb-nav aev-lb-prev" aria-label="Previous photo">‹</button>' +
      '<figure><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="aev-lb-nav aev-lb-next" aria-label="Next photo">›</button>';
    document.body.appendChild(lightbox);
    $('.aev-lb-close', lightbox).addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (ev) { if (ev.target === lightbox) lightbox.close(); });
  }
  var lbImages = []; var lbIndex = 0; var lbOpener = null;
  function showLightbox(i) {
    lbIndex = (i + lbImages.length) % lbImages.length;
    var im = lbImages[lbIndex];
    var img = $('img', lightbox);
    img.src = imgUrl(im.src, 1400);
    img.alt = im.alt || '';
    $('figcaption', lightbox).textContent = 'Photo ' + (lbIndex + 1) + ' of ' + lbImages.length;
  }

  document.addEventListener('click', function (ev) {
    var openBtn = ev.target.closest('[data-open-event]');
    if (openBtn) { openEventModal(openBtn.getAttribute('data-open-event'), openBtn); return; }
    var shareBtn = ev.target.closest('[data-share]');
    if (shareBtn) { handleShare(shareBtn); return; }
    var closeBtn = ev.target.closest('[data-close-event]');
    if (closeBtn) { closeEventModal(); return; }
    var thumb = ev.target.closest('[data-gallery-index]');
    if (thumb) {
      var modal = $('#eventModal');
      lbImages = $$('img', $('.aev-gallery', modal)).map(function (img) { return { src: img.getAttribute('src').replace(/\?w=\d+$/, ''), alt: img.alt }; });
      if (!lightbox) buildLightbox();
      lbOpener = thumb;
      showLightbox(parseInt(thumb.getAttribute('data-gallery-index'), 10));
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
      return;
    }
    var prev = ev.target.closest('.aev-lb-prev'); if (prev) { showLightbox(lbIndex - 1); return; }
    var next = ev.target.closest('.aev-lb-next'); if (next) { showLightbox(lbIndex + 1); return; }
    var video = ev.target.closest('[data-video-id]');
    if (video) {
      var id = encodeURIComponent(video.getAttribute('data-video-id'));
      var provider = video.getAttribute('data-video-provider');
      var src = provider === 'youtube'
        ? 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0'
        : 'https://video.wordpress.com/embed/' + id + '?autoPlay=1&preloadContent=metadata';
      var frame = document.createElement('iframe');
      frame.src = src; frame.title = 'Video'; frame.allow = 'autoplay; fullscreen; picture-in-picture'; frame.allowFullscreen = true;
      frame.className = 'aev-video-frame';
      video.replaceWith(frame);
      frame.focus();
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (lightbox && lightbox.open) { lightbox.close(); return; }
    var dlg = $('#eventModal');
    if (dlg && dlg.open) closeEventModal();
  });
  window.addEventListener('hashchange', openFromHash);

  /* Broken image? Swap in the on-brand placeholder instead of a broken icon. */
  document.addEventListener('error', function (ev) {
    var img = ev.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-fallback')) return;
    var box = document.createElement('div');
    box.className = 'aev-card-fallback';
    box.setAttribute('aria-hidden', 'true');
    box.textContent = '🎭';
    img.replaceWith(box);
  }, true);

  /* Small public surface so the status/ticketing rules can be checked. */
  window.ATFA = window.ATFA || {};
  window.ATFA.events = { resolveStatus: resolveStatus };

  if (document.body.getAttribute('data-page') === 'events') {
    renderLive();
    renderPast();
    bindIndexEvents();
    var closeEl = $('#eventModal .aev-modal-close');
    if (closeEl) closeEl.addEventListener('click', closeEventModal);
    var modalEl = $('#eventModal');
    if (modalEl) modalEl.addEventListener('click', function (ev) { if (ev.target === modalEl) closeEventModal(); });
    if (modalEl) modalEl.addEventListener('cancel', function (ev) { ev.preventDefault(); closeEventModal(); });
    openFromHash();
  }
})();
