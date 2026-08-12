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
  const LITE_API_URL = 'https://script.google.com/macros/s/AKfycbxF57u1UNBsonktp5_2EseJtFkBZR0-CCxyazOGVUmEBrcwjU1-t6Us41gcrRqCsGcR/exec';
  const TOKEN_KEY = 'frostPartnerDashToken';
  const CACHE_KEY = 'frostPartnerDashCache';

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
    document.getElementById('navLogoText').textContent = isPartner ? 'PARTNER DASHBOARD' : 'Frost';
    document.getElementById('navLogoIcon').src = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';
    document.getElementById('favicon').href = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';
    document.getElementById('notifBellBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('withdrawOpenBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('navLogoutBtn').style.display = isPartner ? 'inline-block' : 'none';
  }

  function loadToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function saveToken(t) {
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {}
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(CACHE_KEY); } catch (e) {}
  }
  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
  }
  function loadCache() {
    try { const raw = localStorage.getItem(CACHE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function showError(msg) {
    document.getElementById('errorText').textContent = msg || 'Please try again.';
    show('stateError');
  }

  function fmtMoney(w) {
    return w ? w.amount.toFixed(2) + ' ' + w.currency.toUpperCase() : '0';
  }

  const DEFAULT_MIN_WITHDRAW = 4;
  let lastData = null;
  function walletAvailable() {
    return (lastData && lastData.walletSummary && lastData.walletSummary.available) || { amount: 0, currency: 'eur' };
  }
  function walletMinWithdraw() {
    return (lastData && lastData.minWithdraw) || DEFAULT_MIN_WITHDRAW;
  }

  const HISTORY_PAGE_SIZE = 6;
  let withdrawHistoryExpanded = false;
  function renderWithdrawHistory(data) {
    const listEl = document.getElementById('withdrawHistoryList');
    const emptyEl = document.getElementById('withdrawHistoryEmpty');
    const viewAllBtn = document.getElementById('withdrawHistoryViewAll');
    const allItems = data.withdrawHistory || [];
    listEl.innerHTML = '';
    if (!allItems.length) {
      emptyEl.style.display = '';
      viewAllBtn.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    const items = withdrawHistoryExpanded ? allItems : allItems.slice(0, HISTORY_PAGE_SIZE);
    if (allItems.length > HISTORY_PAGE_SIZE) {
      viewAllBtn.style.display = '';
      viewAllBtn.textContent = withdrawHistoryExpanded ? 'Show less' : 'View all (' + allItems.length + ')';
    } else {
      viewAllBtn.style.display = 'none';
    }
    items.forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'history-row';

      const icon = document.createElement('div');
      const main = document.createElement('div');
      main.className = 'history-row-main';
      const descEl = document.createElement('div');
      descEl.className = 'history-row-desc';
      const dateEl = document.createElement('div');
      dateEl.className = 'history-row-date';
      dateEl.textContent = item.timestamp
        ? new Date(item.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : '';

      const amountStr = item.amount.toFixed(2) + ' ' + item.currency.toUpperCase();
      if (item.status === 'paid') {
        icon.className = 'history-row-icon paid';
        icon.textContent = '✓';
        const paidStr = (item.paidAmount > 0 ? item.paidAmount : item.amount).toFixed(2) + ' ' + item.currency.toUpperCase();
        descEl.textContent = 'You were sent ' + paidStr;
      } else if (item.status === 'denied') {
        icon.className = 'history-row-icon denied';
        icon.textContent = '✕';
        descEl.textContent = 'Request ' + amountStr + ' denied. Contact us on Discord for more information.'
          + (item.requestId ? ' Request ID: ' + item.requestId : '');
      } else {
        icon.className = 'history-row-icon pending';
        icon.textContent = '⏳';
        descEl.textContent = 'You requested to withdraw ' + amountStr + ' to ' + item.paypalEmail;
      }

      main.appendChild(descEl);
      main.appendChild(dateEl);
      row.appendChild(icon);
      row.appendChild(main);
      listEl.appendChild(row);
    });
  }

  const CURRENT_REQUEST_SEEN_KEY = 'frostPartnerCurrentRequestSeen';
  function loadCurrentRequestSeen() {
    try { return JSON.parse(localStorage.getItem(CURRENT_REQUEST_SEEN_KEY) || '{}'); } catch (e) { return {}; }
  }
  function saveCurrentRequestSeen(map) {
    try { localStorage.setItem(CURRENT_REQUEST_SEEN_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function renderCurrentRequestBanner(data) {
    const banner = document.getElementById('currentRequestBanner');
    if (!banner) return;
    const history = (data.withdrawHistory || []).slice().sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });
    const latest = history[0];
    if (!latest || !latest.requestId || (latest.status !== 'pending' && latest.status !== 'paid' && latest.status !== 'denied')) {
      banner.style.display = 'none';
      return;
    }
    const status = latest.status;
    const seenMap = loadCurrentRequestSeen();
    if (status !== 'pending' && seenMap[latest.requestId] === status) {
      banner.style.display = 'none';
      return;
    }
    banner.className = 'current-request-banner status-' + status;
    banner.style.display = 'flex';
    const icon = document.getElementById('currentRequestIcon');
    const title = document.getElementById('currentRequestTitle');
    const desc = document.getElementById('currentRequestDesc');
    const amountStr = latest.amount.toFixed(2) + ' ' + latest.currency.toUpperCase();
    if (status === 'pending') {
      icon.textContent = '⏳';
      title.textContent = 'Current request: Pending';
      desc.textContent = amountStr + ' requested — we will process it soon.';
    } else if (status === 'paid') {
      icon.textContent = '✅';
      title.textContent = 'Current request: Paid';
      const paidStr = (latest.paidAmount > 0 ? latest.paidAmount : latest.amount).toFixed(2) + ' ' + latest.currency.toUpperCase();
      desc.textContent = 'You were sent ' + paidStr + '.';
    } else {
      icon.textContent = '❌';
      title.textContent = 'Current request: Denied';
      desc.textContent = amountStr + ' — check Discord for details. Request ' + latest.requestId + '.';
    }
    if (status !== 'pending') {
      seenMap[latest.requestId] = status;
      saveCurrentRequestSeen(seenMap);
    }
  }
  function renderWallet(data) {
    lastData = data;
    renderCurrentRequestBanner(data);
    const isPartnerPlus = data.percentage >= 30;
    const tierBadge = document.getElementById('partnerTierBadge');
    tierBadge.textContent = isPartnerPlus ? 'Partner+' : 'Partner';
    tierBadge.className = 'tier-badge' + (isPartnerPlus ? ' plus' : '');
    const wallet = data.walletSummary || {};
    document.getElementById('statEarnings').textContent = fmtMoney(wallet.earnings);
    document.getElementById('statAvailable').textContent = fmtMoney(wallet.available);
    const pendingEl = document.getElementById('statPending');
    pendingEl.textContent = fmtMoney(wallet.pending);
    pendingEl.classList.toggle('has-pending', !!(wallet.pending && wallet.pending.amount > 0));
    const cooldownStat = document.getElementById('cooldownStat');
    if (wallet.balance && wallet.available && wallet.pending) {
      const cooldownAmount = Math.max(0, Math.round((wallet.balance.amount - wallet.available.amount - wallet.pending.amount) * 100) / 100);
      if (cooldownAmount > 0.001) {
        document.getElementById('statCooldown').textContent = cooldownAmount.toFixed(2) + ' ' + wallet.balance.currency.toUpperCase();
        cooldownStat.style.display = '';
      } else {
        cooldownStat.style.display = 'none';
      }
    } else {
      cooldownStat.style.display = 'none';
    }
    document.getElementById('withdrawAvailableText').textContent = fmtMoney(wallet.available);
    renderWithdrawHistory(data);
    updateContinueEnabled();
    updateWithdrawSubmitEnabled();
    lastUpdatedAt = Date.now();
    updateLastUpdatedText();
  }
  let lastUpdatedAt = null;
  function updateLastUpdatedText() {
    const el = document.getElementById('lastUpdatedText');
    if (!el) return;
    if (!lastUpdatedAt) { el.textContent = ''; return; }
    const secs = Math.round((Date.now() - lastUpdatedAt) / 1000);
    if (secs < 10) el.textContent = 'Updated just now';
    else if (secs < 60) el.textContent = 'Updated ' + secs + 's ago';
    else el.textContent = 'Updated ' + Math.round(secs / 60) + 'm ago';
  }
  setInterval(updateLastUpdatedText, 5000);
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

  const LAST_ORDER_TS_KEY = 'frostPartnerLastOrderTs';
  const WITHDRAW_STATUS_KEY = 'frostPartnerWithdrawStatus';
  function checkNotifications(data) {
    try {
      const orders = data.orderHistory || [];
      if (orders.length) {
        const newestTs = orders[0].timestamp;
        const lastSeenRaw = localStorage.getItem(LAST_ORDER_TS_KEY);
        const lastSeen = lastSeenRaw ? parseInt(lastSeenRaw, 10) : null;
        if (lastSeen != null) {
          const newOnes = orders.filter(function (o) { return o.timestamp > lastSeen; });
          if (newOnes.length === 1) {
            showToast('🎉', 'New order!', '+' + newOnes[0].commission.toFixed(2) + ' ' + newOnes[0].currency.toUpperCase() + ' commission earned.', null, 'View Dashboard', 'index');
          } else if (newOnes.length > 1) {
            showToast('🎉', newOnes.length + ' new orders', 'Since your last visit.', null, 'View Dashboard', 'index');
          }
        }
        if (lastSeen == null || newestTs > lastSeen) localStorage.setItem(LAST_ORDER_TS_KEY, String(newestTs));
      }
      const history = data.withdrawHistory || [];
      const dedupedByRequestId = {};
      history.forEach(function (item) {
        if (!item.requestId) return;
        const existing = dedupedByRequestId[item.requestId];
        if (!existing || (existing.status === 'pending' && item.status !== 'pending')) {
          dedupedByRequestId[item.requestId] = item;
        }
      });
      let statusMap = {};
      try { statusMap = JSON.parse(localStorage.getItem(WITHDRAW_STATUS_KEY) || '{}'); } catch (e2) {}
      Object.keys(dedupedByRequestId).forEach(function (requestId) {
        const item = dedupedByRequestId[requestId];
        const prev = statusMap[requestId];
        if (prev && prev !== item.status && item.status !== 'pending') {
          if (item.status === 'paid') {
            const paidStr = (item.paidAmount > 0 ? item.paidAmount : item.amount).toFixed(2) + ' ' + item.currency.toUpperCase();
            showToast('✅', 'Withdrawal paid!', 'You were sent ' + paidStr + '.', null, 'View Balance', 'balance');
          } else if (item.status === 'denied') {
            showToast('❌', 'Withdrawal denied', 'Request ' + requestId + ' — check Discord for details.', null, 'View Balance', 'balance');
          }
        }
        statusMap[requestId] = item.status;
      });
      localStorage.setItem(WITHDRAW_STATUS_KEY, JSON.stringify(statusMap));
    } catch (e) {}
  }

  function handleResponse(data, isBackground, token, retriesLeft, showProgress) {
    const failed = !data || !data.ok;
    if (failed && !isBackground && retriesLeft > 0 && token) {
      recheckToken(token, false, retriesLeft - 1, showProgress);
      return;
    }
    if (!data || !data.ok || data.status !== 'eligible') {
      if (isBackground) return;
      if (data && data.error === 'token_expired') clearToken();
      window.location.href = 'index';
      return;
    }
    if (data.partnerDashToken) saveToken(data.partnerDashToken);
    saveCache(data);
    checkNotifications(data);
    show('stateData');
    renderWallet(data);
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
  function recheckToken(token, isBackground, retriesLeft, showProgress) {
    if (showProgress) showRefreshProgress();
    return fetch(LITE_API_URL + '?action=partnerDashCheck&token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (showProgress) hideRefreshProgress(); handleResponse(data, isBackground, token, retriesLeft, showProgress); })
      .catch(() => {
        if (showProgress) hideRefreshProgress();
        if (!isBackground && retriesLeft > 0) { recheckToken(token, false, retriesLeft - 1, showProgress); return; }
        if (!isBackground) showError('Network error while contacting the server. Please try again.');
      });
  }
  let refreshTimer = null;
  function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (document.hidden) return;
      const token = loadToken();
      if (token) recheckToken(token, true);
    }, 30000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !document.getElementById('stateData').classList.contains('active')) return;
    const token = loadToken();
    if (token) recheckToken(token, true);
  });

  document.getElementById('retryBtn').addEventListener('click', () => {
    const token = loadToken();
    if (!token) { window.location.href = 'index'; return; }
    show('stateLoading');
    recheckToken(token, false, 1, true);
  });
  document.getElementById('refreshBtn').addEventListener('click', function () {
    const token = loadToken();
    if (!token) return;
    const btn = this;
    btn.classList.add('spinning');
    recheckToken(token, true, 0, true).finally(() => btn.classList.remove('spinning'));
  });
  const withdrawStates = ['withdrawStateForm', 'withdrawStateSubmitting', 'withdrawStateDone'];
  function showWithdrawState(id) {
    withdrawStates.forEach(s => document.getElementById(s).classList.toggle('active', s === id));
  }
  const withdrawSteps = ['withdrawStepAmount', 'withdrawStepDetails'];
  function showWithdrawStep(id) {
    withdrawSteps.forEach(s => document.getElementById(s).classList.toggle('active', s === id));
  }
  function resetWithdrawForm() {
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawEmail1').value = '';
    document.getElementById('withdrawEmail2').value = '';
    document.getElementById('withdrawConfirmAmount').checked = false;
    document.getElementById('withdrawConfirmEmail').checked = false;
    document.getElementById('withdrawAmountError').style.display = 'none';
    document.getElementById('withdrawFormError').style.display = 'none';
    showWithdrawState('withdrawStateForm');
    showWithdrawStep('withdrawStepAmount');
    updateContinueEnabled();
    updateWithdrawSubmitEnabled();
  }
  function updateContinueEnabled() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const bal = walletAvailable();
    const min = walletMinWithdraw();
    const errEl = document.getElementById('withdrawAmountError');
    let error = '';
    if (amount && amount > bal.amount + 0.001) error = 'Amount exceeds what you have available.';
    else if (amount && amount < min) error = 'Minimum withdrawal is ' + min.toFixed(2) + ' ' + bal.currency.toUpperCase() + '.';
    errEl.textContent = error;
    errEl.style.display = error ? 'block' : 'none';

    const valid = amount >= min && amount <= bal.amount + 0.001;
    document.getElementById('withdrawContinueBtn').disabled = !valid;
  }
  function updateWithdrawSubmitEnabled() {
    const email1 = document.getElementById('withdrawEmail1').value.trim();
    const email2 = document.getElementById('withdrawEmail2').value.trim();
    const errEl = document.getElementById('withdrawFormError');
    let error = '';
    if (email1 && email2 && email1.toLowerCase() !== email2.toLowerCase()) error = 'Emails do not match.';
    errEl.textContent = error;
    errEl.style.display = error ? 'block' : 'none';

    const emailOk = !!email1 && email1.toLowerCase() === email2.toLowerCase() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email1);
    const valid = emailOk &&
      document.getElementById('withdrawConfirmAmount').checked &&
      document.getElementById('withdrawConfirmEmail').checked;
    document.getElementById('withdrawSubmitBtn').disabled = !valid;
  }
  document.getElementById('withdrawAmount').addEventListener('input', updateContinueEnabled);
  ['withdrawEmail1', 'withdrawEmail2'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateWithdrawSubmitEnabled);
  });
  ['withdrawConfirmAmount', 'withdrawConfirmEmail'].forEach(id => {
    document.getElementById(id).addEventListener('change', updateWithdrawSubmitEnabled);
  });
  document.getElementById('withdrawMaxBtn').addEventListener('click', () => {
    document.getElementById('withdrawAmount').value = walletAvailable().amount.toFixed(2);
    updateContinueEnabled();
  });
  function stepWithdrawAmount(delta) {
    const input = document.getElementById('withdrawAmount');
    const current = parseFloat(input.value) || 0;
    const max = walletAvailable().amount;
    const next = Math.min(max, Math.max(0, Math.round((current + delta) * 100) / 100));
    input.value = next.toFixed(2);
    updateContinueEnabled();
  }
  document.getElementById('withdrawStepUp').addEventListener('click', () => stepWithdrawAmount(0.01));
  document.getElementById('withdrawStepDown').addEventListener('click', () => stepWithdrawAmount(-0.01));
  document.getElementById('withdrawContinueBtn').addEventListener('click', function () {
    if (this.disabled) return;
    showWithdrawStep('withdrawStepDetails');
  });
  document.getElementById('withdrawBackBtn').addEventListener('click', () => {
    showWithdrawStep('withdrawStepAmount');
  });
  document.getElementById('withdrawAnotherBtn').addEventListener('click', resetWithdrawForm);
  document.getElementById('withdrawHistoryViewAll').addEventListener('click', function () {
    withdrawHistoryExpanded = !withdrawHistoryExpanded;
    if (lastData) renderWithdrawHistory(lastData);
  });

  document.getElementById('withdrawSubmitBtn').addEventListener('click', function () {
    if (this.disabled) return;
    const token = loadToken();
    if (!token) { window.location.href = 'index'; return; }
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const email = document.getElementById('withdrawEmail1').value.trim();
    showWithdrawState('withdrawStateSubmitting');
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
          showWithdrawState('withdrawStateDone');
          if (lastData && lastData.walletSummary) {
            const w = lastData.walletSummary;
            if (w.available) w.available.amount = Math.max(0, Math.round((w.available.amount - amount) * 100) / 100);
            if (w.pending) w.pending.amount = Math.round((w.pending.amount + amount) * 100) / 100;
            renderWallet(lastData);
          }
          recheckToken(token, true);
          return;
        }
        showWithdrawState('withdrawStateForm');
        showWithdrawStep('withdrawStepDetails');
        const errEl = document.getElementById('withdrawFormError');
        errEl.style.display = 'block';
        if (data && data.error === 'exceeds_available') {
          errEl.textContent = 'That exceeds what you have available (' + Number(data.available || 0).toFixed(2) + ' ' + String(data.currency || '').toUpperCase() + ').';
        } else if (data && data.error === 'below_minimum') {
          errEl.textContent = 'Minimum withdrawal is ' + Number(data.minimum || DEFAULT_MIN_WITHDRAW).toFixed(2) + '.';
        } else if (data && data.error === 'token_expired') {
          clearToken();
          window.location.href = 'index';
        } else {
          errEl.textContent = "Couldn't submit your request. Please try again.";
        }
      })
      .catch(() => {
        showWithdrawState('withdrawStateForm');
        showWithdrawStep('withdrawStepDetails');
        const errEl = document.getElementById('withdrawFormError');
        errEl.style.display = 'block';
        errEl.textContent = 'Network error. Please try again.';
      });
  });

  document.getElementById('navLogoutBtn').addEventListener('click', () => {
    clearToken();
    clearInterval(refreshTimer);
    window.location.href = 'index';
  });
  function qwShowState(id) {
    ['qwStateForm', 'qwStateSubmitting', 'qwStateDone'].forEach(function (s) { document.getElementById(s).classList.toggle('active', s === id); });
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
    qwShowState('qwStateForm');
    qwShowStep('qwStepAmount');
    qwUpdateContinueEnabled();
    qwUpdateSubmitEnabled();
  }
  function qwUpdateContinueEnabled() {
    const amount = parseFloat(document.getElementById('qwAmount').value);
    const bal = walletAvailable();
    const min = walletMinWithdraw();
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
    document.getElementById('qwAmount').value = walletAvailable().amount.toFixed(2);
    qwUpdateContinueEnabled();
  });
  function qwStep(delta) {
    const input = document.getElementById('qwAmount');
    const current = parseFloat(input.value) || 0;
    const max = walletAvailable().amount;
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
    const avail = walletAvailable();
    document.getElementById('qwAvailableText').textContent = avail.amount.toFixed(2) + ' ' + avail.currency.toUpperCase();
    qwResetForm();
    document.getElementById('qwOverlay').classList.add('open');
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
          if (lastData && lastData.walletSummary) {
            const w = lastData.walletSummary;
            if (w.available) w.available.amount = Math.max(0, Math.round((w.available.amount - amount) * 100) / 100);
            if (w.pending) w.pending.amount = Math.round((w.pending.amount + amount) * 100) / 100;
            renderWallet(lastData);
          }
          recheckToken(token, true);
          return;
        }
        qwShowState('qwStateForm');
        qwShowStep('qwStepDetails');
        const errEl = document.getElementById('qwFormError');
        errEl.style.display = 'block';
        if (data && data.error === 'exceeds_available') {
          errEl.textContent = 'That exceeds what you have available (' + Number(data.available || 0).toFixed(2) + ' ' + String(data.currency || '').toUpperCase() + ').';
        } else if (data && data.error === 'below_minimum') {
          errEl.textContent = 'Minimum withdrawal is ' + Number(data.minimum || DEFAULT_MIN_WITHDRAW).toFixed(2) + '.';
        } else if (data && data.error === 'token_expired') {
          clearToken();
          closeQwModal();
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
    const cached = loadCache();
    if (cached && cached.status === 'eligible' && cached.walletSummary) {
      show('stateData');
      renderWallet(cached);
      recheckToken(token, true, 0, true);
    } else {
      show('stateLoading');
      recheckToken(token, false, 1, true);
    }
    startAutoRefresh();
  })();
})();
