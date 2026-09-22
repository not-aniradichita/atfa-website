/* ==========================================================================
   Aniradichita Theatre & Films Association — ticketing (events.html only)

   Turns an event's `ticketing` config (events-data.js) into a plain
   description of what the page should show, per ticket option. It renders
   nothing and knows nothing about markup, so the Events UI never changes
   when the payment links do — and the URLs never sit inside a button
   template, only in the data file.

   TODAY  provider 'razorpay' works in "link" mode: each option's
          `checkoutUrl` is a hosted Razorpay Payment Page URL, and its
          button just opens it in a new tab. There is no payment code on
          this site and no fake checkout: with an empty checkoutUrl (or a
          future `opensAt`) that option's button shows a disabled
          "Releasing Soon" state instead.

   LATER  a future event can use a different provider (or `provider:
          'external'` for a plain booking link that isn't Razorpay at all)
          simply by changing the data — resolveOption() only cares that
          checkoutUrl is a valid https URL, not which provider issued it.
   ========================================================================== */
(function (root) {
  'use strict';

  var ATFA = (root.ATFA = root.ATFA || {});

  var PROVIDER_NAMES = { razorpay: 'Razorpay' };

  function isHttpsUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
      return new URL(value.trim()).protocol === 'https:';
    } catch (err) {
      return false;
    }
  }

  /* Accepts either the array shape (one or more ticket types) or the older
     single-ticket shorthand ({ checkoutUrl, buttonLabel, ... } with no
     `options`), so a simple event doesn't need to write an array of one. */
  function normalizeOptions(t) {
    if (Array.isArray(t.options) && t.options.length) {
      return t.options.map(function (o, i) {
        return {
          id: o.id || 'option-' + i,
          label: o.label || o.buttonLabel || 'Tickets',
          buttonLabel: o.buttonLabel || o.label || 'Book Tickets',
          checkoutUrl: o.checkoutUrl,
          provider: o.provider || t.provider,
          opensAt: o.opensAt || t.opensAt,
          pendingLabel: o.pendingLabel || t.pendingLabel || 'Releasing Soon',
          note: o.note || null
        };
      });
    }
    return [
      {
        id: 'default',
        label: t.label || t.buttonLabel || 'Tickets',
        buttonLabel: t.buttonLabel || 'Book Tickets',
        checkoutUrl: t.checkoutUrl,
        provider: t.provider,
        opensAt: t.opensAt,
        pendingLabel: t.pendingLabel || 'Tickets Releasing Soon',
        note: null
      }
    ];
  }

  function resolveOption(opt, now) {
    var opensAt = opt.opensAt ? new Date(opt.opensAt) : null;
    if (opensAt && isNaN(opensAt.getTime())) opensAt = null;
    var released = !opensAt || now >= opensAt;
    var live = released && isHttpsUrl(opt.checkoutUrl);
    return {
      id: opt.id,
      label: opt.label,
      buttonLabel: opt.buttonLabel,
      note: opt.note,
      state: live ? 'open' : 'coming-soon',
      href: live ? opt.checkoutUrl.trim() : null,
      provider: opt.provider || null,
      providerName: opt.provider ? PROVIDER_NAMES[opt.provider] || opt.provider : null,
      pendingLabel: opt.pendingLabel,
      opensAt: opensAt
    };
  }

  /**
   * @param {object} event  an entry from ATFA_EVENTS
   * @param {Date}   [now]
   * @returns {{state:'hidden'|'coming-soon'|'open', heading:string|null,
   *            options:Array<object>, info:Array<{label,value}>}}
   */
  function resolve(event, now) {
    var t = event && event.ticketing;
    if (!t || !t.enabled) {
      return { state: 'hidden', heading: null, options: [], info: [] };
    }
    now = now || new Date();
    var options = normalizeOptions(t).map(function (o) {
      return resolveOption(o, now);
    });
    var anyOpen = options.some(function (o) {
      return o.state === 'open';
    });
    return {
      state: options.length ? (anyOpen ? 'open' : 'coming-soon') : 'hidden',
      heading: t.heading || null,
      options: options,
      info: Array.isArray(t.info) ? t.info : []
    };
  }

  ATFA.ticketing = { resolve: resolve, isHttpsUrl: isHttpsUrl };
})(window);
