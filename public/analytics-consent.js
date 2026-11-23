/* Consent adapters for the existing public sites. No page/route tracking here. */
(function (w, d) {
  'use strict';
  if (!w || !d || w.__EIC_CONSENT_BRIDGE_V1__) return;
  var cfg = w.EIC_CONSENT_CONFIG || {};
  var google = w.EIC_ANALYTICS_CONFIG || {};
  var api = w.EICAnalytics;
  var meta = cfg.legacyMeta || null;
  var metaStarted = false;
  var metaFn = null;
  var choice = null;
  var panel = null;
  var reopenButton = null;
  var details = false;
  var memoryDenied = false;
  var fallback = cfg.kind === 'banner';
  var key = typeof cfg.storageKey === 'string' ? cfg.storageKey : '';
  var changeEvents = Array.isArray(cfg.changeEvents) ? cfg.changeEvents : [];
  var openEvent = typeof cfg.openEvent === 'string' ? cfg.openEvent : 'eic:open-cookie-preferences';
  var isRo = /^\/ro(?:\/|$)/.test(w.location.pathname || '');
  var isEn = /^\/en(?:\/|$)/.test(w.location.pathname || '');
  var isPt = /^\/pt(?:\/|$)/.test(w.location.pathname || '');
  var labels = isEn ? {
    title: 'Cookie preferences', analytics: 'Statistics', marketing: 'Marketing',
    text: 'With your consent, we use Google Analytics to understand how this website is used. You can refuse or change your choice at any time.',
    marketingText: 'The existing Meta Pixel is enabled only with marketing consent.',
    policy: 'Privacy and cookies', accept: 'Accept', reject: 'Refuse', customize: 'Customize', save: 'Save preferences',
    settings: 'Cookie preferences', error: 'Preferences could not be saved. Optional cookies remain disabled.'
  } : isPt ? {
    title: 'Preferências de cookies', analytics: 'Estatísticas', marketing: 'Marketing',
    text: 'Com seu consentimento, usamos o Google Analytics para entender como este site é utilizado. Você pode recusar ou alterar sua escolha a qualquer momento.',
    marketingText: 'O Pixel Meta já existente é ativado somente com o consentimento para marketing.',
    policy: 'Privacidade e cookies', accept: 'Aceitar', reject: 'Recusar', customize: 'Personalizar', save: 'Salvar preferências',
    settings: 'Preferências de cookies', error: 'Não foi possível salvar as preferências. Os cookies opcionais permanecem desativados.'
  } : isRo ? {
    title: 'Preferințe cookie',
    analytics: 'Statistici',
    marketing: 'Marketing',
    text: 'Cu acordul tău folosim Google Analytics pentru a înțelege utilizarea site-ului. Poți refuza sau modifica alegerea oricând.',
    marketingText: 'Pixelul Meta existent este activat numai cu acordul pentru marketing.',
    policy: 'Confidențialitate și cookie',
    accept: 'Acceptă', reject: 'Refuză', customize: 'Personalizează', save: 'Salvează preferințele',
    settings: 'Preferințe cookie', error: 'Preferințele nu au putut fi salvate. Cookie-urile opționale rămân dezactivate.'
  } : {
    title: 'Preferenze cookie',
    analytics: 'Statistiche',
    marketing: 'Marketing',
    text: 'Con il tuo consenso usiamo Google Analytics per capire come viene utilizzato il sito. Puoi rifiutare o cambiare scelta in qualsiasi momento.',
    marketingText: 'Il Pixel Meta già presente viene attivato solo con il consenso al marketing.',
    policy: 'Privacy e cookie',
    accept: 'Accetta', reject: 'Rifiuta', customize: 'Personalizza', save: 'Salva preferenze',
    settings: 'Preferenze cookie', error: 'Non è stato possibile salvare le preferenze. I cookie facoltativi restano disattivati.'
  };

  function blockedFbq() { /* Existing site helpers remain harmless before marketing consent. */ }
  blockedFbq.__eicConsentStub = true;
  if (meta && typeof w.fbq !== 'function') w.fbq = blockedFbq;
  if (!api || !key || cfg.enabled !== true) return;
  w.__EIC_CONSENT_BRIDGE_V1__ = true;

  function normalize(value) {
    if (!value || typeof value !== 'object') return null;
    var decidedAt = Date.parse(value.decidedAt);
    if (!isFinite(decidedAt) || decidedAt > Date.now() || Date.now() - decidedAt >= 182 * 86400000) return null;
    if (cfg.versionProperty && value[cfg.versionProperty] !== cfg.versionValue) return null;
    if (typeof value[cfg.analyticsProperty] !== 'boolean') return null;
    return { analytics: value[cfg.analyticsProperty] === true, marketing: value[cfg.marketingProperty] === true };
  }

  function persistedChoice() {
    try { return normalize(JSON.parse(w.localStorage.getItem(key) || 'null')); }
    catch (_) { return null; }
  }
  function read() {
    return memoryDenied ? { analytics: false, marketing: false } : persistedChoice();
  }

  function safePublicScope() {
    var host = String(w.location.hostname || '').toLowerCase();
    if (w.location.protocol !== 'https:' || !Array.isArray(google.allowedHosts) || google.allowedHosts.indexOf(host) < 0) return false;
    var path;
    var search;
    try { path = decodeURIComponent(w.location.pathname || '/'); search = decodeURIComponent(w.location.search || ''); }
    catch (_) { return false; }
    var excluded = ['/api', '/auth', '/app', '/account', '/admin', '/dashboard'].concat(google.excludedPathPrefixes || []);
    if (excluded.some(function (p) { return path === p || path.indexOf(p.replace(/\/$/, '') + '/') === 0; })) return false;
    if (google.allowedPathPrefixes && google.allowedPathPrefixes.length && !google.allowedPathPrefixes.some(function (p) { return p === '/' ? path === '/' : path === p || path.indexOf(p.replace(/\/$/, '') + '/') === 0; })) return false;
    if (/@|[\r\n]/.test(path + search) || /(?:^|[?&])(?:email|e-mail|mail|phone|telephone|telefono|nome|name|firstname|lastname|address|indirizzo|token|access_token|code|password)=/i.test(search)) return false;
    return true;
  }

  function clearMetaCookies() {
    var hostParts = String(w.location.hostname || '').split('.');
    var domains = [''];
    for (var i = 0; i < hostParts.length - 1; i++) domains.push(hostParts.slice(i).join('.'), '.' + hostParts.slice(i).join('.'));
    ['_fbp', '_fbc'].forEach(function (name) {
      domains.forEach(function (domain) { d.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax; Secure' + (domain ? '; Domain=' + domain : ''); });
    });
  }

  function applyMarketing(next) {
    if (!meta || meta.enabled !== true || !/^\d{5,30}$/.test(String(meta.pixelId || ''))) return;
    if (meta.requireAedixGuard === true && w.__aedixTrack !== true) return;
    if (!next.marketing || !safePublicScope()) {
      if (metaStarted && metaFn) {
        metaFn('consent', 'revoke');
        clearMetaCookies();
        // The CMP has already persisted the choice before this callback.
        if (!memoryDenied && !api.getState().reloadRequired && typeof w.location.reload === 'function') w.location.reload();
      }
      return;
    }
    if (metaStarted) return;
    // Refuse to add another instance if something outside this integration
    // has already loaded the legacy marketing SDK.
    if (d.querySelector('script[src*="connect.facebook.net"][src*="fbevents.js"]')) return;
    if (w.fbq && !w.fbq.__eicConsentStub) return;
    metaFn = function () {
      var withdrawing = arguments[0] === 'consent' && arguments[1] === 'revoke';
      if (!withdrawing && (!choice || !choice.marketing || !safePublicScope())) return;
      if (metaFn.callMethod) metaFn.callMethod.apply(metaFn, arguments);
      else metaFn.queue.push(arguments);
    };
    metaFn.push = metaFn;
    metaFn.loaded = true;
    metaFn.version = '2.0';
    metaFn.queue = [];
    w.fbq = metaFn;
    w._fbq = metaFn;
    metaStarted = true;
    // Keep the public ID already present on this site. No advanced matching
    // or form/customer data is passed to Meta.
    metaFn('set', 'autoConfig', false, String(meta.pixelId));
    metaFn('consent', 'grant');
    metaFn('init', String(meta.pixelId));
    var fixed = meta.fixedParameters || {};
    metaFn('track', 'PageView', fixed);
    if (typeof meta.initialEvent === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,60}$/.test(meta.initialEvent)) metaFn('trackCustom', meta.initialEvent, fixed);
    var script = d.createElement('script');
    script.id = 'eic-existing-meta-consented';
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    (d.head || d.documentElement).appendChild(script);
  }

  function apply(value) {
    choice = value || { analytics: false, marketing: false };
    api.updateConsent(choice);
    applyMarketing(choice);
  }

  function make(tag, text, className) {
    var node = d.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function save(analytics, marketing) {
    var stored = { necessary: true, decidedAt: new Date().toISOString() };
    stored[cfg.analyticsProperty] = analytics === true;
    stored[cfg.marketingProperty] = !!meta && marketing === true;
    if (cfg.versionProperty) stored[cfg.versionProperty] = cfg.versionValue;
    try { w.localStorage.setItem(key, JSON.stringify(stored)); }
    catch (_) {
      memoryDenied = true;
      // Do not reload into an older stored grant if storage is unavailable.
      api.configure(Object.assign({}, google, { reloadOnRevoke: false }));
      apply({ analytics: false, marketing: false });
      var message = panel && panel.querySelector('[data-consent-error]');
      if (message) message.textContent = labels.error;
      return;
    }
    memoryDenied = false;
    apply(normalize(stored));
    if (panel) panel.hidden = true;
    if (reopenButton) reopenButton.hidden = false;
    // This event contains consent enums only. It is not a tracking event.
    w.dispatchEvent(new CustomEvent('eic:cookie-preferences-saved', { detail: normalize(stored) }));
  }

  function render() {
    if (!fallback || !safePublicScope() || panel) return;
    var style = make('style');
    style.textContent = '.eic-cookie-panel{position:fixed;inset:auto 16px 16px;z-index:2147483000;max-width:980px;margin:auto;padding:20px;background:#fff;color:#172331;border:1px solid #cbd3db;border-radius:14px;box-shadow:0 12px 40px #0003;font:15px/1.5 system-ui,sans-serif}.eic-cookie-panel[hidden],.eic-cookie-open[hidden]{display:none!important}.eic-cookie-title{margin:0 0 8px;font-size:18px;font-weight:700}.eic-cookie-copy{margin:0 0 12px}.eic-cookie-actions{display:flex;flex-wrap:wrap;gap:10px}.eic-cookie-panel button,.eic-cookie-open{font:600 14px/1.3 system-ui,sans-serif;padding:11px 16px;border:1px solid #172331;border-radius:8px;background:#fff;color:#172331;cursor:pointer}.eic-cookie-panel button:focus-visible,.eic-cookie-open:focus-visible,.eic-cookie-panel a:focus-visible{outline:3px solid #1768a6;outline-offset:3px}.eic-cookie-panel a{color:#174d76;text-decoration:underline}.eic-cookie-details{display:grid;gap:10px;margin:12px 0}.eic-cookie-details[hidden]{display:none}.eic-cookie-details label{display:flex;gap:10px;align-items:center}.eic-cookie-open{position:fixed;bottom:12px;left:12px;z-index:2147482000;box-shadow:0 2px 10px #0002}.eic-cookie-error{color:#9d2020;margin:8px 0 0}@media(max-width:600px){.eic-cookie-panel{inset:auto 8px 8px;padding:16px}.eic-cookie-actions button{flex:1 1 120px}}';
    (d.head || d.documentElement).appendChild(style);
    panel = make('section', '', 'eic-cookie-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', labels.title);
    panel.appendChild(make('h2', labels.title, 'eic-cookie-title'));
    panel.appendChild(make('p', labels.text + (meta ? ' ' + labels.marketingText : ''), 'eic-cookie-copy'));
    var policy = make('a', labels.policy);
    policy.href = isRo && cfg.policyUrlRo ? cfg.policyUrlRo : isEn && cfg.policyUrlEn ? cfg.policyUrlEn : isPt && cfg.policyUrlPt ? cfg.policyUrlPt : cfg.policyUrl || '/privacy';
    panel.appendChild(policy);
    var detailBox = make('div', '', 'eic-cookie-details');
    detailBox.hidden = true;
    var analyticsInput = make('input');
    analyticsInput.type = 'checkbox';
    var analyticsLabel = make('label');
    analyticsLabel.appendChild(analyticsInput); analyticsLabel.appendChild(make('span', labels.analytics)); detailBox.appendChild(analyticsLabel);
    var marketingInput = null;
    if (meta) {
      marketingInput = make('input'); marketingInput.type = 'checkbox';
      var marketingLabel = make('label'); marketingLabel.appendChild(marketingInput); marketingLabel.appendChild(make('span', labels.marketing)); detailBox.appendChild(marketingLabel);
    }
    panel.appendChild(detailBox);
    var actions = make('div', '', 'eic-cookie-actions');
    var accept = make('button', labels.accept); accept.type = 'button'; accept.addEventListener('click', function () { save(true, !!meta); });
    var reject = make('button', labels.reject); reject.type = 'button'; reject.addEventListener('click', function () { save(false, false); });
    var customize = make('button', labels.customize); customize.type = 'button'; customize.addEventListener('click', function () {
      if (!details) { details = true; detailBox.hidden = false; customize.textContent = labels.save; analyticsInput.focus(); }
      else save(analyticsInput.checked, marketingInput && marketingInput.checked);
    });
    actions.appendChild(accept); actions.appendChild(reject); actions.appendChild(customize); panel.appendChild(actions);
    var error = make('p', '', 'eic-cookie-error'); error.setAttribute('data-consent-error', ''); error.setAttribute('role', 'status'); panel.appendChild(error);
    reopenButton = make('button', labels.settings, 'eic-cookie-open'); reopenButton.type = 'button'; reopenButton.addEventListener('click', openPreferences);
    d.body.appendChild(panel); d.body.appendChild(reopenButton);
    panel.hidden = !!read(); reopenButton.hidden = !panel.hidden;
    panel.__setInputs = function () { var current = read(); analyticsInput.checked = !!current && current.analytics; if (marketingInput) marketingInput.checked = !!current && current.marketing; };
  }

  function openPreferences() {
    if (!fallback) return;
    render();
    if (!panel) return;
    panel.__setInputs(); panel.hidden = false; reopenButton.hidden = true;
  }

  changeEvents.forEach(function (name) {
    w.addEventListener(name, function (event) {
      var selected = normalize(event && event.detail);
      var saved = persistedChoice();
      if (selected && (!selected.analytics && (!saved || saved.analytics) || meta && !selected.marketing && (!saved || saved.marketing))) {
        // Existing CMPs still emit their explicit choice if storage fails.
        // Do not reload into an older grant that the denial could not replace.
        memoryDenied = true;
        api.configure(Object.assign({}, google, { reloadOnRevoke: false }));
      }
      apply(memoryDenied ? { analytics: false, marketing: false } : selected || read());
    });
  });
  w.addEventListener('storage', function (event) { if (event.key === key) apply(read()); });
  w.addEventListener(openEvent, function () {
    if (fallback) openPreferences();
    else apply(read());
  });
  w.EICConsentBridge = Object.freeze({ getConsent: read, openPreferences: openPreferences });
  apply(read());
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', render, { once: true });
  else render();
})(typeof window !== 'undefined' ? window : null, typeof document !== 'undefined' ? document : null);
