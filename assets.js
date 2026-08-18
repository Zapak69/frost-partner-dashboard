const particleCanvas = document.getElementById('particles');
const particleCtx = particleCanvas.getContext('2d');
let particleW, particleH, particles = [];
function resizeParticleCanvas() {
  particleW = particleCanvas.width = window.innerWidth;
  particleH = particleCanvas.height = window.innerHeight;
}
resizeParticleCanvas();
window.addEventListener('resize', resizeParticleCanvas);
for (let i = 0; i < 100; i++) particles.push({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 1.5 + 0.5,
  speed: Math.random() * 0.4 + 0.1,
  drift: (Math.random() - 0.5) * 0.3,
  opacity: Math.random() * 0.4 + 0.1
});
(function animateParticles() {
  particleCtx.clearRect(0, 0, particleW, particleH);
  for (const p of particles) {
    particleCtx.beginPath();
    particleCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    particleCtx.fillStyle = `rgba(168,230,248,${p.opacity})`;
    particleCtx.fill();
    p.y += p.speed; p.x += p.drift;
    if (p.y > particleH + 10) { p.y = -10; p.x = Math.random() * particleW; }
    if (p.x > particleW + 10) p.x = -10;
    if (p.x < -10) p.x = particleW + 10;
  }
  requestAnimationFrame(animateParticles);
})();

(function () {
  const BRIDGE_URL = 'https://bot.frostclient.eu/partner-assets';
  const LITE_API_URL = 'https://script.google.com/macros/s/AKfycbxF57u1UNBsonktp5_2EseJtFkBZR0-CCxyazOGVUmEBrcwjU1-t6Us41gcrRqCsGcR/exec';
  const TOKEN_KEY = 'frostPartnerDashToken';
  const LAST_VISIT_KEY = 'frostPartnerAssetsLastVisit';
  function loadLastVisit() {
    try {
      const v = localStorage.getItem(LAST_VISIT_KEY);
      return v ? parseInt(v, 10) : null;
    } catch (e) { return null; }
  }
  function saveLastVisitNow() {
    try { localStorage.setItem(LAST_VISIT_KEY, String(Date.now())); } catch (e) {}
  }

  const states = ['stateLoading', 'stateError', 'stateData'];
  function hidePageTransition() {
    const el = document.getElementById('pageTransition');
    if (el) el.classList.add('hide');
  }
  function show(id) {
    hidePageTransition();
    states.forEach(s => document.getElementById(s).classList.toggle('active', s === id));
    const isPartner = id === 'stateData';
    document.getElementById('navLinks').style.display = isPartner ? 'flex' : 'none';
    document.getElementById('navLogoText').textContent = isPartner ? 'CREATOR DASHBOARD' : 'Frost';
    document.getElementById('navLogoIcon').src = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';
    document.getElementById('favicon').href = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';
    document.getElementById('notifBellBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('withdrawOpenBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('navLogoutBtn').style.display = isPartner ? 'inline-block' : 'none';
  }

  function loadToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  function showError(msg) {
    document.getElementById('errorText').textContent = msg || 'Please try again.';
    show('stateError');
  }
  const TIER_FAVICONS = { media: 'favicons/media.ico', partner: 'favicons/partner.ico', partner_plus: 'favicons/partner+.ico' };
  function applyTierFavicon(tier) {
    const src = TIER_FAVICONS[tier] || 'favicon.ico';
    document.getElementById('navLogoIcon').src = src;
    document.getElementById('favicon').href = src;
  }
  const NOTIFICATIONS_KEY = 'frostPartnerNotifications';
  const MAX_NOTIFICATIONS = 40;
  function loadNotifications() {
    try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveNotifications(list) {
    try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function addNotification(icon, title, desc, actionLabel, actionHref) {
    const list = loadNotifications();
    list.unshift({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      icon: icon, title: title, desc: desc || '',
      actionLabel: actionLabel || '', actionHref: actionHref || '',
      ts: Date.now(), read: false
    });
    if (list.length > MAX_NOTIFICATIONS) list.length = MAX_NOTIFICATIONS;
    saveNotifications(list);
    updateNotifBadge();
    if (notifPanelOpen) renderNotifPanel();
  }
  function removeNotification(id) {
    saveNotifications(loadNotifications().filter(function (n) { return n.id !== id; }));
    updateNotifBadge();
  }
  function updateNotifBadge() {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    const unread = loadNotifications().filter(function (n) { return !n.read; }).length;
    if (unread > 0) { badge.textContent = unread > 99 ? '99+' : String(unread); badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }
  function formatNotifTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const timeStr = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return timeStr;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday, ' + timeStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + timeStr;
  }
  let notifPanelOpen = false;
  let notifDrag = null;
  function notifDragMove(clientX) {
    if (!notifDrag) return;
    notifDrag.currentX = clientX;
    const dx = Math.min(0, clientX - notifDrag.startX);
    notifDrag.el.style.transform = 'translateX(' + dx + 'px)';
    const ratio = Math.min(1, Math.abs(dx) / 120);
    notifDrag.el.style.background = 'rgba(255,92,92,' + (ratio * 0.35) + ')';
  }
  function notifDragEnd() {
    if (!notifDrag) return;
    const state = notifDrag;
    notifDrag = null;
    state.el.classList.remove('dragging');
    const dx = Math.min(0, state.currentX - state.startX);
    if (Math.abs(dx) > 90) {
      state.el.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
      state.el.style.transform = 'translateX(-100%)';
      state.el.style.opacity = '0';
      setTimeout(function () { removeNotification(state.id); renderNotifPanel(); }, 200);
    } else {
      state.el.style.transition = 'transform 0.2s ease, background 0.2s ease';
      state.el.style.transform = 'translateX(0)';
      state.el.style.background = '';
    }
  }
  document.addEventListener('mousemove', function (e) { notifDragMove(e.clientX); });
  document.addEventListener('touchmove', function (e) { if (notifDrag) notifDragMove(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('mouseup', notifDragEnd);
  document.addEventListener('touchend', notifDragEnd);
  function renderNotifPanel() {
    const list = loadNotifications();
    const listEl = document.getElementById('notifPanelList');
    if (!listEl) return;
    listEl.innerHTML = '';
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'notif-empty';
      empty.textContent = 'No notifications yet.';
      listEl.appendChild(empty);
      return;
    }
    list.forEach(function (n) {
      const item = document.createElement('div');
      item.className = 'notif-item' + (n.read ? '' : ' unread');
      const icon = document.createElement('div');
      icon.className = 'notif-item-icon';
      icon.textContent = n.icon;
      const body = document.createElement('div');
      body.className = 'notif-item-body';
      const title = document.createElement('div');
      title.className = 'notif-item-title';
      title.textContent = n.title;
      const desc = document.createElement('div');
      desc.className = 'notif-item-desc';
      desc.textContent = n.desc;
      const footer = document.createElement('div');
      footer.className = 'notif-item-footer';
      const time = document.createElement('span');
      time.className = 'notif-item-time';
      time.textContent = formatNotifTime(n.ts);
      footer.appendChild(time);
      if (n.actionLabel && n.actionHref) {
        const action = document.createElement('a');
        action.className = 'notif-item-action';
        action.href = n.actionHref;
        action.textContent = n.actionLabel + ' →';
        footer.appendChild(action);
      }
      body.appendChild(title); body.appendChild(desc); body.appendChild(footer);
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'notif-item-delete';
      deleteBtn.setAttribute('aria-label', 'Delete notification');
      deleteBtn.textContent = '✕';
      deleteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        removeNotification(n.id);
        renderNotifPanel();
      });
      item.appendChild(icon); item.appendChild(body); item.appendChild(deleteBtn);
      const startDrag = function (e) {
        if (e.target === deleteBtn) return;
        notifDrag = { id: n.id, el: item, startX: (e.touches ? e.touches[0].clientX : e.clientX), currentX: 0 };
        item.classList.add('dragging');
        item.style.transition = 'none';
      };
      item.addEventListener('mousedown', startDrag);
      item.addEventListener('touchstart', startDrag, { passive: true });
      listEl.appendChild(item);
    });
  }
  function positionNotifPanel() {
    const bell = document.getElementById('notifBellBtn');
    const panel = document.getElementById('notifPanel');
    if (!bell || !panel) return;
    const rect = bell.getBoundingClientRect();
    panel.style.top = (rect.bottom + 10) + 'px';
    panel.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
    panel.style.left = 'auto';
  }
  function toggleNotifPanel() {
    notifPanelOpen = !notifPanelOpen;
    if (notifPanelOpen) positionNotifPanel();
    document.getElementById('notifPanel').classList.toggle('open', notifPanelOpen);
    document.getElementById('notifBellBtn').classList.toggle('active', notifPanelOpen);
    if (notifPanelOpen) renderNotifPanel();
  }
  const notifBellBtn = document.getElementById('notifBellBtn');
  if (notifBellBtn) {
    notifBellBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleNotifPanel(); });
    document.getElementById('notifMarkReadBtn').addEventListener('click', function () {
      const list = loadNotifications();
      list.forEach(function (n) { n.read = true; });
      saveNotifications(list);
      updateNotifBadge();
      renderNotifPanel();
    });
    document.getElementById('notifClearBtn').addEventListener('click', function () {
      saveNotifications([]);
      updateNotifBadge();
      renderNotifPanel();
    });
    window.addEventListener('resize', function () { if (notifPanelOpen) positionNotifPanel(); });
    document.addEventListener('click', function (e) {
      const panel = document.getElementById('notifPanel');
      if (notifPanelOpen && !panel.contains(e.target) && e.target !== notifBellBtn && !notifBellBtn.contains(e.target)) {
        notifPanelOpen = false;
        panel.classList.remove('open');
        notifBellBtn.classList.remove('active');
      }
    });
    updateNotifBadge();
  }

  function showToast(icon, title, desc, ms, actionLabel, actionHref) {
    addNotification(icon, title, desc, actionLabel, actionHref);
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const duration = ms || 8000;
    const el = document.createElement('div');
    el.className = 'toast';
    const iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.textContent = icon;
    const body = document.createElement('div');
    body.className = 'toast-body';
    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    const descEl = document.createElement('div');
    descEl.className = 'toast-desc';
    descEl.textContent = desc || '';
    body.appendChild(titleEl);
    body.appendChild(descEl);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '✕';
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.animationDuration = duration + 'ms';
    el.appendChild(iconEl);
    el.appendChild(body);
    el.appendChild(closeBtn);
    el.appendChild(progress);
    const remove = function () { el.classList.add('hide'); setTimeout(function () { el.remove(); }, 250); };
    closeBtn.addEventListener('click', remove);
    stack.appendChild(el);
    setTimeout(remove, duration);
  }
  let knownFilenames = null;

  function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return Math.round(bytes / 1024) + ' KB';
    return bytes + ' B';
  }

  function isPreviewable(filename) {
    return /\.(gif|png|jpe?g|webp)$/i.test(filename);
  }

  function renderSkeletons(count) {
    const grid = document.getElementById('assetGrid');
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'asset-card';
      card.innerHTML =
        '<div class="skeleton-preview"></div>' +
        '<div class="asset-body">' +
          '<div class="skeleton-line"></div>' +
          '<div class="skeleton-line short"></div>' +
          '<div class="skeleton-line tall"></div>' +
        '</div>';
      grid.appendChild(card);
    }
  }

  // Media partners don't unlock the banner asset until they've landed a few orders (see
  // MEDIA_BANNER_UNLOCK_ORDERS below) - every other tier sees it immediately, same as today.
  // There's no real asset-type field anywhere in the system (assets are just files in a
  // per-partner folder - see BANNERS_DIR in bot.js), so "is this the banner asset" is a simple
  // filename convention instead of new backend infrastructure.
  const MEDIA_BANNER_UNLOCK_ORDERS = 5;
  let tierInfo = { tier: null, totalOrders: 0, loaded: false };
  let lastRenderedAssets = null, lastRenderedToken = null, lastRenderedVisit = null;

  function isBannerAsset(filename) {
    return /banner/i.test(filename);
  }

  function renderAssets(assets, token, lastVisit) {
    lastRenderedAssets = assets; lastRenderedToken = token; lastRenderedVisit = lastVisit;
    const grid = document.getElementById('assetGrid');
    const empty = document.getElementById('assetEmpty');
    grid.innerHTML = '';
    if (!assets.length) {
      empty.style.display = '';
      renderSkeletons(3);
      return;
    }
    empty.style.display = 'none';
    const bannerLocked = tierInfo.tier === 'media' && tierInfo.totalOrders < MEDIA_BANNER_UNLOCK_ORDERS;
    assets.forEach(a => {
      const downloadUrl = BRIDGE_URL + '/download?token=' + encodeURIComponent(token) + '&file=' + encodeURIComponent(a.filename);
      const isNew = lastVisit != null && Date.parse(a.mtime) > lastVisit;
      const locked = bannerLocked && isBannerAsset(a.filename);
      const card = document.createElement('div');
      card.className = 'asset-card' + (isNew ? ' is-new' : '') + (locked ? ' is-locked' : '');

      if (isNew && !locked) {
        const badge = document.createElement('span');
        badge.className = 'asset-new-badge';
        badge.textContent = 'NEW';
        card.appendChild(badge);
      }

      if (locked) {
        const lockBadge = document.createElement('span');
        lockBadge.className = 'asset-locked-badge';
        lockBadge.textContent = '🔒 Locked';
        card.appendChild(lockBadge);
      }

      if (isPreviewable(a.filename)) {
        const img = document.createElement('img');
        img.className = 'asset-preview';
        img.src = downloadUrl;
        img.alt = a.filename;
        img.loading = 'lazy';
        card.appendChild(img);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'asset-preview-generic';
        placeholder.textContent = '📄';
        card.appendChild(placeholder);
      }

      const body = document.createElement('div');
      body.className = 'asset-body';
      const name = document.createElement('div');
      name.className = 'asset-name';
      name.textContent = a.filename;
      const meta = document.createElement('div');
      meta.className = 'asset-meta';
      if (locked) {
        meta.textContent = Math.min(tierInfo.totalOrders, MEDIA_BANNER_UNLOCK_ORDERS) + '/' + MEDIA_BANNER_UNLOCK_ORDERS + ' orders to unlock';
      } else {
        meta.textContent = formatSize(a.size);
      }
      body.appendChild(name);
      body.appendChild(meta);
      if (locked) {
        const dl = document.createElement('span');
        dl.className = 'asset-download is-disabled';
        dl.textContent = '🔒 Locked';
        body.appendChild(dl);
      } else {
        const dl = document.createElement('a');
        dl.className = 'asset-download';
        dl.href = downloadUrl;
        dl.textContent = '⬇ Download';
        body.appendChild(dl);
      }
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function loadTierInfo(token) {
    fetch(LITE_API_URL + '?action=partnerDashCheck&token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (!data || !data.ok || data.status !== 'eligible') return;
        tierInfo = { tier: data.tier || null, totalOrders: data.totalOrders || 0, loaded: true };
        applyTierFavicon(tierInfo.tier);
        if (lastRenderedAssets) renderAssets(lastRenderedAssets, lastRenderedToken, lastRenderedVisit);
      })
      .catch(() => {});
  }
  let refreshProgressInterval = null;
  let refreshProgressResetTimer = null;
  function showRefreshProgress() {
    const bar = document.getElementById('refreshProgressBar');
    if (!bar) return;
    clearInterval(refreshProgressInterval);
    clearTimeout(refreshProgressResetTimer);
    bar.style.transition = 'none';
    bar.style.opacity = '1';
    bar.style.width = '0%';
    void bar.offsetWidth;
    bar.style.transition = 'width 0.2s ease';
    let pct = 0;
    refreshProgressInterval = setInterval(function () {
      pct += (90 - pct) * 0.15;
      bar.style.width = Math.min(pct, 90).toFixed(1) + '%';
    }, 150);
  }
  function hideRefreshProgress() {
    const bar = document.getElementById('refreshProgressBar');
    if (!bar) return;
    clearInterval(refreshProgressInterval);
    bar.style.transition = 'width 0.25s ease';
    bar.style.width = '100%';
    refreshProgressResetTimer = setTimeout(function () {
      bar.style.transition = 'opacity 0.3s ease';
      bar.style.opacity = '0';
      refreshProgressResetTimer = setTimeout(function () {
        bar.style.transition = 'none';
        bar.style.width = '0%';
        bar.style.opacity = '1';
      }, 300);
    }, 250);
  }
  function loadAssets(token, retriesLeft, lastVisit, isBackground, showProgress) {
    if (showProgress) showRefreshProgress();
    fetch(BRIDGE_URL + '?token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (showProgress) hideRefreshProgress();
        if (!data || !data.ok) {
          if (retriesLeft > 0) { loadAssets(token, retriesLeft - 1, lastVisit, isBackground, showProgress); return; }
          if (data && data.error === 'forbidden') { clearToken(); window.location.href = 'index'; return; }
          if (!isBackground) showError('Could not load your assets. Please try again.');
          return;
        }
        const assets = data.assets || [];
        if (knownFilenames === null) {
          const newSinceVisit = lastVisit != null ? assets.filter(a => Date.parse(a.mtime) > lastVisit) : [];
          if (newSinceVisit.length === 1) {
            showToast('📄', 'New asset', newSinceVisit[0].filename + ' was added since your last visit.', null, 'View Assets', 'assets');
          } else if (newSinceVisit.length > 1) {
            showToast('📄', newSinceVisit.length + ' new assets', 'Added since your last visit.', null, 'View Assets', 'assets');
          }
        } else {
          const freshlyArrived = assets.filter(a => !knownFilenames.has(a.filename));
          if (freshlyArrived.length === 1) {
            showToast('📄', 'New asset', freshlyArrived[0].filename + ' just got uploaded.', null, 'View Assets', 'assets');
          } else if (freshlyArrived.length > 1) {
            showToast('📄', freshlyArrived.length + ' new assets', 'Just got uploaded.', null, 'View Assets', 'assets');
          }
        }
        knownFilenames = new Set(assets.map(a => a.filename));
        show('stateData');
        renderAssets(assets, token, lastVisit);
        saveLastVisitNow();
      })
      .catch(() => {
        if (showProgress) hideRefreshProgress();
        if (retriesLeft > 0) { loadAssets(token, retriesLeft - 1, lastVisit, isBackground, showProgress); return; }
        if (!isBackground) showError('Network error while contacting the server. Please try again.');
      });
  }

  document.getElementById('retryBtn').addEventListener('click', () => {
    const token = loadToken();
    if (!token) { window.location.href = 'index'; return; }
    show('stateLoading');
    loadAssets(token, 1, loadLastVisit(), false, true);
  });
  let sessionLastVisit = null;
  let refreshTimer = null;
  function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (document.hidden) return;
      const t = loadToken();
      if (t) { loadAssets(t, 0, sessionLastVisit, true); loadTierInfo(t); }
    }, 30000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !document.getElementById('stateData').classList.contains('active')) return;
    const token = loadToken();
    if (token) loadAssets(token, 0, sessionLastVisit, true);
  });

  document.getElementById('navLogoutBtn').addEventListener('click', () => {
    clearToken();
    clearInterval(refreshTimer);
    window.location.href = 'index';
  });
  let qwData = null;
  const QW_DEFAULT_MIN = 4;
  function qwAvailable() {
    return (qwData && qwData.walletSummary && qwData.walletSummary.available) || { amount: 0, currency: 'eur' };
  }
  function qwMinWithdraw() {
    return (qwData && qwData.minWithdraw) || QW_DEFAULT_MIN;
  }
  function qwShowState(id) {
    ['qwStateLoading', 'qwStateForm', 'qwStateSubmitting', 'qwStateDone'].forEach(function (s) { document.getElementById(s).classList.toggle('active', s === id); });
  }
  function qwShowStep(id) {
    ['qwStepAmount', 'qwStepDetails'].forEach(function (s) { document.getElementById(s).classList.toggle('active', s === id); });
  }
  function qwResetForm() {
    document.getElementById('qwAmount').value = '';
    document.getElementById('qwEmail1').value = '';
    document.getElementById('qwEmail2').value = '';
    document.getElementById('qwConfirmAmount').checked = false;
    document.getElementById('qwConfirmEmail').checked = false;
    document.getElementById('qwAmountError').style.display = 'none';
    document.getElementById('qwFormError').style.display = 'none';
    qwShowStep('qwStepAmount');
    qwUpdateContinueEnabled();
    qwUpdateSubmitEnabled();
  }
  function qwUpdateContinueEnabled() {
    const amount = parseFloat(document.getElementById('qwAmount').value);
    const bal = qwAvailable();
    const min = qwMinWithdraw();
    const errEl = document.getElementById('qwAmountError');
    let error = '';
    if (amount && amount > bal.amount + 0.001) error = 'Amount exceeds what you have available.';
    else if (amount && amount < min) error = 'Minimum withdrawal is ' + min.toFixed(2) + ' ' + bal.currency.toUpperCase() + '.';
    errEl.textContent = error;
    errEl.style.display = error ? 'block' : 'none';
    const valid = amount >= min && amount <= bal.amount + 0.001;
    document.getElementById('qwContinueBtn').disabled = !valid;
  }
  function qwUpdateSubmitEnabled() {
    const email1 = document.getElementById('qwEmail1').value.trim();
    const email2 = document.getElementById('qwEmail2').value.trim();
    const errEl = document.getElementById('qwFormError');
    let error = '';
    if (email1 && email2 && email1.toLowerCase() !== email2.toLowerCase()) error = 'Emails do not match.';
    errEl.textContent = error;
    errEl.style.display = error ? 'block' : 'none';
    const emailOk = !!email1 && email1.toLowerCase() === email2.toLowerCase() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email1);
    const valid = emailOk && document.getElementById('qwConfirmAmount').checked && document.getElementById('qwConfirmEmail').checked;
    document.getElementById('qwSubmitBtn').disabled = !valid;
  }
  document.getElementById('qwAmount').addEventListener('input', qwUpdateContinueEnabled);
  ['qwEmail1', 'qwEmail2'].forEach(function (id) { document.getElementById(id).addEventListener('input', qwUpdateSubmitEnabled); });
  ['qwConfirmAmount', 'qwConfirmEmail'].forEach(function (id) { document.getElementById(id).addEventListener('change', qwUpdateSubmitEnabled); });
  document.getElementById('qwMaxBtn').addEventListener('click', function () {
    document.getElementById('qwAmount').value = qwAvailable().amount.toFixed(2);
    qwUpdateContinueEnabled();
  });
  function qwStep(delta) {
    const input = document.getElementById('qwAmount');
    const current = parseFloat(input.value) || 0;
    const max = qwAvailable().amount;
    const next = Math.min(max, Math.max(0, Math.round((current + delta) * 100) / 100));
    input.value = next.toFixed(2);
    qwUpdateContinueEnabled();
  }
  document.getElementById('qwStepUp').addEventListener('click', function () { qwStep(0.01); });
  document.getElementById('qwStepDown').addEventListener('click', function () { qwStep(-0.01); });
  document.getElementById('qwContinueBtn').addEventListener('click', function () {
    if (this.disabled) return;
    qwShowStep('qwStepDetails');
  });
  document.getElementById('qwBackBtn').addEventListener('click', function () { qwShowStep('qwStepAmount'); });

  function openQwModal() {
    document.getElementById('qwOverlay').classList.add('open');
    qwShowState('qwStateLoading');
    const token = loadToken();
    if (!token) { closeQwModal(); return; }
    fetch(LITE_API_URL + '?action=partnerDashCheck&token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data && data.ok && data.status === 'eligible' && data.walletSummary) {
          qwData = data;
          document.getElementById('qwAvailableText').textContent = qwAvailable().amount.toFixed(2) + ' ' + qwAvailable().currency.toUpperCase();
          qwResetForm();
          qwShowState('qwStateForm');
        } else {
          closeQwModal();
        }
      })
      .catch(function () { closeQwModal(); });
  }
  function closeQwModal() {
    document.getElementById('qwOverlay').classList.remove('open');
  }
  document.getElementById('withdrawOpenBtn').addEventListener('click', openQwModal);
  document.getElementById('qwDoneBtn').addEventListener('click', closeQwModal);
  document.getElementById('qwCloseBtn').addEventListener('click', closeQwModal);
  document.getElementById('qwOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeQwModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.getElementById('qwOverlay').classList.contains('open')) closeQwModal();
  });

  document.getElementById('qwSubmitBtn').addEventListener('click', function () {
    if (this.disabled) return;
    const token = loadToken();
    if (!token) { closeQwModal(); return; }
    const amount = parseFloat(document.getElementById('qwAmount').value);
    const email = document.getElementById('qwEmail1').value.trim();
    qwShowState('qwStateSubmitting');
    fetch(LITE_API_URL + '?action=partnerWithdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        partnerDashToken: token, amount: amount, paypalEmail: email,
        confirmedAmount: true, confirmedEmail: true
      })
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.ok) {
          qwShowState('qwStateDone');
          return;
        }
        qwShowState('qwStateForm');
        qwShowStep('qwStepDetails');
        const errEl = document.getElementById('qwFormError');
        errEl.style.display = 'block';
        if (data && data.error === 'exceeds_available') {
          errEl.textContent = 'That exceeds what you have available (' + Number(data.available || 0).toFixed(2) + ' ' + String(data.currency || '').toUpperCase() + ').';
        } else if (data && data.error === 'below_minimum') {
          errEl.textContent = 'Minimum withdrawal is ' + Number(data.minimum || QW_DEFAULT_MIN).toFixed(2) + '.';
        } else if (data && data.error === 'token_expired') {
          clearToken();
          window.location.href = 'index';
        } else {
          errEl.textContent = "Couldn't submit your request. Please try again.";
        }
      })
      .catch(() => {
        qwShowState('qwStateForm');
        qwShowStep('qwStepDetails');
        const errEl = document.getElementById('qwFormError');
        errEl.style.display = 'block';
        errEl.textContent = 'Network error. Please try again.';
      });
  });

  function isInternalDashboardLink(href) {
    if (!href) return false;
    if (/^(index|balance|assets)(\?.*)?(#.*)?$/.test(href)) return true;
    if (/^https:\/\/partner\.frostclient\.eu\/?(balance|assets)?(\?.*)?(#.*)?$/i.test(href)) return true;
    return false;
  }
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a');
    if (!a || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!isInternalDashboardLink(href)) return;
    e.preventDefault();
    const el = document.getElementById('pageTransition');
    if (el) el.classList.remove('hide');
    setTimeout(function () { window.location.href = a.href; }, 120);
  });

  (function init() {
    const token = loadToken();
    if (!token) { window.location.href = 'index'; return; }
    show('stateLoading');
    sessionLastVisit = loadLastVisit();
    loadAssets(token, 1, sessionLastVisit, false, true);
    loadTierInfo(token);
    startAutoRefresh();
  })();
})();
