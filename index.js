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
  const BOT_API_URL = 'https://bot.frostclient.eu';
  const RANKUP_NEXT_TIER = { media: 'partner', partner: 'partner_plus' };
  const RANKUP_MIN_ORDERS = 5;
  const TIER_FAVICONS = { media: 'favicons/media.ico', partner: 'favicons/partner.ico', partner_plus: 'favicons/partner+.ico' };
  function applyTierFavicon(tier) {
    const src = TIER_FAVICONS[tier] || 'favicon.ico';
    document.getElementById('navLogoIcon').src = src;
    document.getElementById('favicon').href = src;
  }
  const RANKUP_PENDING_KEY = 'frostPartnerRankupPending';
  const LAST_TIER_KEY = 'frostPartnerLastTier';
  const TOKEN_KEY = 'frostPartnerDashToken';
  const OAUTH_STATE_KEY = 'frostPartnerDashOauthState';
  const CACHE_KEY = 'frostPartnerDashCache';
  const DISCORD_CLIENT_ID = '1512834635640475898';
  const DISCORD_REDIRECT_URI = 'https://partner.frostclient.eu';

  const states = ['stateLoading', 'stateLogin', 'stateWorking', 'stateNotMember', 'stateNotPartner', 'stateNotSetUp', 'stateError', 'stateData'];
  let workingHintTimer = null;
  function hidePageTransition() {
    const el = document.getElementById('pageTransition');
    if (el) el.classList.add('hide');
  }
  function show(id) {
    hidePageTransition();
    states.forEach(s => document.getElementById(s).classList.toggle('active', s === id));
    const loggedIn = id === 'stateData' || id === 'stateNotSetUp';
    const isPartner = id === 'stateData';
    document.getElementById('navLogoutBtn').style.display = loggedIn ? 'inline-block' : 'none';
    document.getElementById('withdrawOpenBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('notifBellBtn').style.display = isPartner ? 'inline-flex' : 'none';
    document.getElementById('navLinks').style.display = isPartner ? 'flex' : 'none';
    document.getElementById('navLogoText').textContent = isPartner ? 'CREATOR DASHBOARD' : 'FROST';
    document.getElementById('navLogoIcon').src = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';
    document.getElementById('favicon').href = isPartner ? 'favicon.ico' : 'https://frostclient.eu/favicon.ico';

    clearTimeout(workingHintTimer);
    const hint = document.getElementById('workingHint');
    hint.classList.remove('show');
    if (id === 'stateWorking') {
      workingHintTimer = setTimeout(() => hint.classList.add('show'), 5000);
    }
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

  function avatarUrl(user) {
    if (user && user.avatar) return 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png?size=96';
    return 'https://cdn.discordapp.com/embed/avatars/0.png';
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function formatMonthLabel(key) {
    const parts = key.split('-');
    const idx = parseInt(parts[1], 10) - 1;
    return (MONTH_NAMES[idx] || key) + " '" + parts[0].slice(2);
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function formatNumber(n) {
    const rounded = Math.round(n * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    const parts = text.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
  }
  const CHART_ACCENT = '#4fc8f8';
  const CHART_MUTED = '#6b8fa8';
  const CHART_BORDER = 'rgba(79,200,248,0.15)';

  function niceCeil(value) {
    if (value <= 0) return 1;
    const exp = Math.floor(Math.log10(value));
    const base = Math.pow(10, exp);
    const steps = [1, 2, 5, 10];
    for (const s of steps) {
      if (value <= s * base) return s * base;
    }
    return 10 * base;
  }
  function formatClock(t) {
    return new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  function formatDateShort(t) {
    return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  let lastData = null;
  let currentRange = '24h';
  function seriesForRange(range) {
    const timestamps = (lastData && lastData.orderTimestamps) || [];
    const now = Date.now();
    const HOUR = 60 * 60 * 1000, DAY = 24 * HOUR;
    let bucketMs, startTime, tooltipFn;

    if (range === '1h') { bucketMs = 5 * 60 * 1000; startTime = now - HOUR; tooltipFn = formatClock; }
    else if (range === '12h') { bucketMs = 30 * 60 * 1000; startTime = now - 12 * HOUR; tooltipFn = formatClock; }
    else if (range === '24h') { bucketMs = HOUR; startTime = now - 24 * HOUR; tooltipFn = formatClock; }
    else if (range === 'week') { bucketMs = DAY; startTime = now - 7 * DAY; tooltipFn = formatDateShort; }
    else if (range === 'month') { bucketMs = DAY; startTime = now - 30 * DAY; tooltipFn = formatDateShort; }
    else if (range === 'year') { bucketMs = 30 * DAY; startTime = now - 365 * DAY; tooltipFn = formatDateShort; }
    else {
      const earliest = timestamps.length ? timestamps[0] : now - DAY;
      bucketMs = Math.max(DAY, (now - earliest) / 24);
      startTime = earliest;
      tooltipFn = formatDateShort;
    }

    const bucketCount = Math.max(1, Math.ceil((now - startTime) / bucketMs));
    const buckets = new Array(bucketCount).fill(0);
    timestamps.forEach(t => {
      if (t < startTime) return;
      const idx = Math.min(bucketCount - 1, Math.floor((t - startTime) / bucketMs));
      buckets[idx]++;
    });
    return buckets.map((count, i) => {
      const t = startTime + i * bucketMs + bucketMs / 2;
      return { t, value: count, tooltip: tooltipFn(t) };
    });
  }

  function renderTimeChart() {
    const svg = document.getElementById('timeChart');
    const emptyEl = document.getElementById('timeChartEmpty');
    const tooltip = document.getElementById('timeChartTooltip');
    const sublineEl = document.getElementById('timeChartSubline');
    svg.innerHTML = '';
    tooltip.style.display = 'none';

    if (!lastData || !lastData.totalOrders) {
      emptyEl.style.display = '';
      sublineEl.textContent = '';
      return;
    }
    const points = seriesForRange(currentRange);
    emptyEl.style.display = 'none';

    const rect0 = svg.getBoundingClientRect();
    const W = Math.max(1, Math.round(rect0.width)), H = Math.max(1, Math.round(rect0.height));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const PAD_L = 30, PAD_R = 12, PAD_T = 16, PAD_B = 30;
    const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
    const xs = points.map(p => p.t);
    const xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
    const yMax = niceCeil(Math.max.apply(null, points.map(p => p.value)) || 1);

    function xPix(t) { return PAD_L + (xMax === xMin ? plotW / 2 : (t - xMin) / (xMax - xMin) * plotW); }
    function yPix(v) { return PAD_T + plotH - (v / yMax) * plotH; }

    const GRID_STEPS = 4;
    for (let i = 0; i <= GRID_STEPS; i++) {
      const v = yMax * i / GRID_STEPS;
      const y = yPix(v);
      svg.appendChild(svgEl('line', { x1: PAD_L, x2: W - PAD_R, y1: y, y2: y, stroke: CHART_BORDER, 'stroke-width': 1 }));
      const label = svgEl('text', { x: PAD_L - 8, y: y + 4, 'text-anchor': 'end', class: 'chart-axis-label' });
      label.textContent = formatNumber(Math.round(v));
      svg.appendChild(label);
    }

    const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + xPix(p.t).toFixed(1) + ',' + yPix(p.value).toFixed(1)).join(' ');
    const baseline = yPix(0);
    const areaPath = linePath +
      ' L' + xPix(points[points.length - 1].t).toFixed(1) + ',' + baseline +
      ' L' + xPix(points[0].t).toFixed(1) + ',' + baseline + ' Z';
    const clipRect = svgEl('rect', { x: PAD_L, y: 0, width: plotW, height: H });
    const clipPath = svgEl('clipPath', { id: 'partner-curve-clip' });
    clipPath.appendChild(clipRect);
    const defs = svgEl('defs', {});
    defs.appendChild(clipPath);
    svg.appendChild(defs);
    const curveWindow = svgEl('g', { 'clip-path': 'url(#partner-curve-clip)' });
    const curveGroup = svgEl('g', { class: 'chart-curve' });
    curveGroup.appendChild(svgEl('path', { d: areaPath, fill: CHART_ACCENT, opacity: '0.1', stroke: 'none' }));
    curveGroup.appendChild(svgEl('path', { d: linePath, fill: 'none', stroke: CHART_ACCENT, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));

    const first = points[0], last = points[points.length - 1];
    const firstLabel = svgEl('text', { x: xPix(first.t), y: H - 8, 'text-anchor': 'start', class: 'chart-axis-label' });
    firstLabel.textContent = first.tooltip;
    svg.appendChild(firstLabel);
    const lastLabel = svgEl('text', { x: xPix(last.t), y: H - 8, 'text-anchor': 'end', class: 'chart-axis-label' });
    lastLabel.textContent = last.tooltip;
    svg.appendChild(lastLabel);

    curveWindow.appendChild(curveGroup);
    svg.appendChild(curveWindow);

    const crosshair = svgEl('line', { x1: 0, x2: 0, y1: PAD_T, y2: H - PAD_B, stroke: CHART_MUTED, 'stroke-width': 1, opacity: 0 });
    svg.appendChild(crosshair);
    const hoverDot = svgEl('circle', { r: 5, fill: CHART_ACCENT, stroke: '#0d141c', 'stroke-width': 2, opacity: 0 });
    svg.appendChild(hoverDot);
    const hitRect = svgEl('rect', { x: PAD_L, y: 0, width: plotW, height: H, fill: 'transparent' });
    svg.appendChild(hitRect);

    const totalInRange = points.reduce((sum, p) => sum + p.value, 0);
    const peak = Math.max.apply(null, points.map(p => p.value));
    sublineEl.innerHTML = 'Total in range: <strong>' + formatNumber(totalInRange) + '</strong> &nbsp;·&nbsp; Peak: <strong>' + formatNumber(peak) + '</strong>';

    function handleMove(evt) {
      const rect = svg.getBoundingClientRect();
      const mouseX = (evt.clientX - rect.left) * (W / rect.width);
      let nearest = points[0], nearestDist = Infinity;
      for (const p of points) {
        const dist = Math.abs(xPix(p.t) - mouseX);
        if (dist < nearestDist) { nearest = p; nearestDist = dist; }
      }
      const px = xPix(nearest.t), py = yPix(nearest.value);
      crosshair.setAttribute('x1', px); crosshair.setAttribute('x2', px); crosshair.setAttribute('opacity', 1);
      hoverDot.setAttribute('cx', px); hoverDot.setAttribute('cy', py); hoverDot.setAttribute('opacity', 1);
      const containerRect = tooltip.closest('.chart-card').getBoundingClientRect();
      const left = (px / W) * rect.width + (rect.left - containerRect.left);
      const top = (py / H) * rect.height + (rect.top - containerRect.top);
      tooltip.style.display = 'block';
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      tooltip.textContent = '';
      const valueEl = document.createElement('div');
      valueEl.className = 'chart-tooltip-value';
      valueEl.textContent = formatNumber(nearest.value) + ' order' + (nearest.value === 1 ? '' : 's');
      const labelEl = document.createElement('div');
      labelEl.className = 'chart-tooltip-label';
      labelEl.textContent = nearest.tooltip;
      tooltip.appendChild(valueEl);
      tooltip.appendChild(labelEl);
    }
    function handleLeave() {
      crosshair.setAttribute('opacity', 0);
      hoverDot.setAttribute('opacity', 0);
      tooltip.style.display = 'none';
    }
    hitRect.addEventListener('mousemove', handleMove);
    hitRect.addEventListener('mouseleave', handleLeave);
  }

  document.getElementById('rangeSwitch').addEventListener('click', function (e) {
    const btn = e.target.closest('.range-btn');
    if (!btn || btn.classList.contains('active')) return;
    document.querySelectorAll('#rangeSwitch .range-btn').forEach(b => b.classList.toggle('active', b === btn));
    currentRange = btn.dataset.range;
    renderTimeChart();
  });

  let currentChartType = 'time';
  let lastMonthlyItems = [];
  document.getElementById('chartTypeSwitch').addEventListener('click', function (e) {
    const btn = e.target.closest('.range-btn');
    if (!btn || btn.classList.contains('active')) return;
    document.querySelectorAll('#chartTypeSwitch .range-btn').forEach(b => b.classList.toggle('active', b === btn));
    currentChartType = btn.dataset.chart;
    document.getElementById('rangeSwitch').style.display = currentChartType === 'time' ? 'flex' : 'none';
    document.getElementById('chartViewTime').classList.toggle('active', currentChartType === 'time');
    document.getElementById('chartViewMonthly').classList.toggle('active', currentChartType === 'monthly');
    if (currentChartType === 'time') renderTimeChart();
    else renderBarChart('monthlyChart', 'monthlyChartEmpty', lastMonthlyItems);
  });

  function renderBarChart(svgId, emptyId, items) {
    const svg = document.getElementById(svgId);
    const emptyEl = document.getElementById(emptyId);
    svg.innerHTML = '';
    const W = Math.max(1, Math.round(svg.getBoundingClientRect().width));

    if (!items || !items.length) {
      emptyEl.style.display = '';
      svg.setAttribute('viewBox', '0 0 ' + W + ' 40');
      return;
    }
    emptyEl.style.display = 'none';

    const LABEL_W = 70, VALUE_W = 90, BAR_H = 22, GAP = 10, PAD_TOP = 8;
    const H = items.length * (BAR_H + GAP) + PAD_TOP;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    const total = items.reduce((sum, v) => sum + v.count, 0) || 1;
    const maxCount = Math.max.apply(null, items.map(v => v.count)) || 1;
    const barMaxW = W - LABEL_W - VALUE_W;

    items.forEach((v, i) => {
      const y = PAD_TOP + i * (BAR_H + GAP);
      const barW = Math.max(3, (v.count / maxCount) * barMaxW);
      const pct = Math.round((v.count / total) * 100);

      const label = svgEl('text', { x: LABEL_W - 10, y: y + BAR_H / 2 + 4, 'text-anchor': 'end', class: 'chart-version-label' });
      label.textContent = v.label;
      svg.appendChild(label);

      svg.appendChild(svgEl('rect', { x: LABEL_W, y, width: barW, height: BAR_H, rx: 4, fill: CHART_ACCENT }));

      const valueLabel = svgEl('text', { x: LABEL_W + barW + 10, y: y + BAR_H / 2 + 4, class: 'chart-axis-label' });
      valueLabel.textContent = formatNumber(v.count) + ' (' + pct + '%)';
      svg.appendChild(valueLabel);
    });
  }

  function renderRankupBanner(data) {
    const banner = document.getElementById('rankupBanner');
    if (!banner) return;
    const nextTier = RANKUP_NEXT_TIER[data.tier];
    const totalOrders = data.totalOrders || 0;
    let pending = false;
    try { pending = localStorage.getItem(RANKUP_PENDING_KEY) === data.tier + '->' + nextTier; } catch (e) {}
    if (!nextTier || totalOrders < RANKUP_MIN_ORDERS || pending) {
      banner.style.display = 'none';
      return;
    }
    const TIER_LABELS = { media: 'Media', partner: 'Partner', partner_plus: 'Partner+' };
    banner.style.display = '';
    banner.dataset.currentTier = data.tier;
    banner.dataset.requestedTier = nextTier;
    banner.dataset.totalOrders = String(totalOrders);
    const textEl = document.getElementById('rankupBannerText');
    if (textEl) textEl.textContent = "You've placed " + totalOrders + ' orders — you qualify to request a rank-up to ' + TIER_LABELS[nextTier] + '.';
  }

  function renderDashboard(data) {
    lastData = data;
    document.getElementById('timeChartLoading').style.display = 'none';
    document.getElementById('monthlyChartLoading').style.display = 'none';
    document.getElementById('partnerAvatar').src = avatarUrl(data.user);
    document.getElementById('partnerName').textContent = (data.user && (data.user.name || data.user.username)) || 'Creator';
    document.getElementById('partnerRate').textContent = data.percentage + '% commission on referred orders';
    const TIER_LABELS = { media: 'Media', partner: 'Partner', partner_plus: 'Partner+' };
    const TIER_CLASSES = { partner: ' partner', partner_plus: ' plus' };
    const tierBadge = document.getElementById('partnerTierBadge');
    tierBadge.textContent = TIER_LABELS[data.tier] || 'Partner';
    tierBadge.className = 'tier-badge' + (TIER_CLASSES[data.tier] || '');
    applyTierFavicon(data.tier);
    renderRankupBanner(data);
    document.getElementById('partnerCode').textContent = data.code || '—';
    document.getElementById('statTotalOrders').textContent = data.totalOrders != null ? data.totalOrders : '—';
    document.getElementById('statMonthOrders').textContent = data.currentMonthOrders != null ? data.currentMonthOrders : '—';
    document.getElementById('statRate').textContent = data.percentage + '%';
    const earnings = (data.earnings || []);
    document.getElementById('statEarnings').textContent = earnings.length
      ? earnings.map(e => e.amount.toFixed(2) + ' ' + e.currency.toUpperCase()).join(' + ')
      : '0';
    const available = data.walletSummary && data.walletSummary.available;
    document.getElementById('quickAvailable').textContent = available ? available.amount.toFixed(2) + ' ' + available.currency.toUpperCase() : '0';
    lastMonthlyItems = (data.monthlyBreakdown || []).map(m => ({ label: formatMonthLabel(m.month), count: m.count }));
    if (currentChartType === 'monthly') renderBarChart('monthlyChart', 'monthlyChartEmpty', lastMonthlyItems);
    else renderTimeChart();
    renderPaymentHistory(data);

    lastUpdatedAt = Date.now();
    updateLastUpdatedText();
  }

  const HISTORY_PAGE_SIZE = 6;
  let paymentHistoryExpanded = false;
  function renderPaymentHistory(data) {
    const listEl = document.getElementById('paymentHistoryList');
    const emptyEl = document.getElementById('paymentHistoryEmpty');
    const viewAllBtn = document.getElementById('paymentHistoryViewAll');
    const allItems = data.orderHistory || [];
    listEl.innerHTML = '';
    if (!allItems.length) {
      emptyEl.style.display = '';
      viewAllBtn.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    const items = paymentHistoryExpanded ? allItems : allItems.slice(0, HISTORY_PAGE_SIZE);
    if (allItems.length > HISTORY_PAGE_SIZE) {
      viewAllBtn.style.display = '';
      viewAllBtn.textContent = paymentHistoryExpanded ? 'Show less' : 'View all (' + allItems.length + ')';
    } else {
      viewAllBtn.style.display = 'none';
    }
    items.forEach(function (item) {
      const row = document.createElement('div');
      row.className = 'history-row';

      const main = document.createElement('div');
      const dateEl = document.createElement('div');
      dateEl.className = 'history-row-date';
      dateEl.textContent = new Date(item.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const descEl = document.createElement('div');
      descEl.className = 'history-row-desc';
      descEl.textContent = 'Order under your discount code';
      main.appendChild(dateEl);
      main.appendChild(descEl);

      const amountEl = document.createElement('div');
      amountEl.className = 'history-row-amount';
      amountEl.textContent = '+' + item.commission.toFixed(2) + ' ' + item.currency.toUpperCase();

      row.appendChild(main);
      row.appendChild(amountEl);
      listEl.appendChild(row);
    });
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

      const TIER_LABELS = { media: 'Media', partner: 'Partner', partner_plus: 'Partner+' };
      const TIER_RANK = { media: 0, partner: 1, partner_plus: 2 };
      const prevTier = localStorage.getItem(LAST_TIER_KEY);
      if (prevTier && data.tier && data.tier !== prevTier && (TIER_RANK[data.tier] || 0) > (TIER_RANK[prevTier] || 0)) {
        showToast('🎉', 'Rank-up approved!', "You're now a " + (TIER_LABELS[data.tier] || data.tier) + ' partner.', null, 'View Dashboard', 'index');
        try { localStorage.removeItem(RANKUP_PENDING_KEY); } catch (e3) {}
      }
      if (data.tier) localStorage.setItem(LAST_TIER_KEY, data.tier);
    } catch (e) {}
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

  function handleResponse(data) {
    if (!data || !data.ok) {
      if (data && data.error === 'token_expired') { clearToken(); show('stateLogin'); return; }
      showError((data && data.detail) || "Couldn't verify your account. Please try again.");
      return;
    }
    if (data.status === 'not_member') { clearToken(); show('stateNotMember'); return; }
    if (data.status === 'not_partner') { clearToken(); show('stateNotPartner'); return; }
    if (data.status === 'not_set_up') {
      if (data.partnerDashToken) saveToken(data.partnerDashToken);
      show('stateNotSetUp');
      return;
    }
    if (data.status === 'eligible') {
      if (data.partnerDashToken) saveToken(data.partnerDashToken);
      saveCache(data);
      checkNotifications(data);
      show('stateData');
      renderDashboard(data);
      startAutoRefresh();
      return;
    }
    showError('Unexpected response. Please try again.');
  }

  function exchangeCode(code) {
    show('stateWorking');
    fetch(LITE_API_URL + '?action=partnerDashAuth&code=' + encodeURIComponent(code), { cache: 'no-store' })
      .then(r => r.json())
      .then(handleResponse)
      .catch(() => showError('Network error while contacting the server. Please try again.'));
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
  function recheckToken(token, isBackground, showProgress) {
    if (showProgress) showRefreshProgress();
    return fetch(LITE_API_URL + '?action=partnerDashCheck&token=' + encodeURIComponent(token), { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (showProgress) hideRefreshProgress(); if (!isBackground || (data && data.ok)) handleResponse(data); return data; })
      .catch(() => { if (showProgress) hideRefreshProgress(); if (!isBackground) showError('Network error while contacting the server. Please try again.'); });
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
  function stopAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !document.getElementById('stateData').classList.contains('active')) return;
    const token = loadToken();
    if (token) recheckToken(token, true);
  });

  document.getElementById('refreshBtn').addEventListener('click', function () {
    const token = loadToken();
    if (!token) return;
    const btn = this;
    btn.classList.add('spinning');
    recheckToken(token, true, true).finally(() => btn.classList.remove('spinning'));
  });

  const loginBtn = document.getElementById('loginBtn');
  function startLogin() {
    try { fetch(LITE_API_URL + '?action=partnerDashConfig', { cache: 'no-store', keepalive: true }); } catch (e) {}
    let csrfState = '';
    try {
      const buf = new Uint8Array(16);
      crypto.getRandomValues(buf);
      csrfState = Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(OAUTH_STATE_KEY, csrfState);
    } catch (e) {}
    const url = 'https://discord.com/oauth2/authorize'
      + '?client_id=' + encodeURIComponent(DISCORD_CLIENT_ID)
      + '&response_type=code'
      + '&redirect_uri=' + encodeURIComponent(DISCORD_REDIRECT_URI)
      + '&scope=' + encodeURIComponent('identify guilds.members.read')
      + '&state=' + csrfState;
    window.location.href = url;
  }
  loginBtn.addEventListener('click', startLogin);
  document.getElementById('retryNotMemberBtn').addEventListener('click', startLogin);
  document.getElementById('retryBtn').addEventListener('click', () => show('stateLogin'));

  document.getElementById('navLogoutBtn').addEventListener('click', () => {
    clearToken();
    stopAutoRefresh();
    lastUpdatedAt = null;
    updateLastUpdatedText();
    show('stateLogin');
  });

  document.getElementById('paymentHistoryViewAll').addEventListener('click', function () {
    paymentHistoryExpanded = !paymentHistoryExpanded;
    if (lastData) renderPaymentHistory(lastData);
  });
  document.getElementById('copyCodeBtn').addEventListener('click', function () {
    const code = document.getElementById('partnerCode').textContent;
    if (!code || code === '—') return;
    const btn = this;
    const done = () => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done).catch(() => {});
    }
  });
  const QW_DEFAULT_MIN = 4;
  function qwAvailable() {
    return (lastData && lastData.walletSummary && lastData.walletSummary.available) || { amount: 0, currency: 'eur' };
  }
  function qwMinWithdraw() {
    return (lastData && lastData.minWithdraw) || QW_DEFAULT_MIN;
  }
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
    const avail = qwAvailable();
    document.getElementById('qwAvailableText').textContent = avail.amount.toFixed(2) + ' ' + avail.currency.toUpperCase();
    qwResetForm();
    document.getElementById('qwOverlay').classList.add('open');
  }
  function closeQwModal() {
    document.getElementById('qwOverlay').classList.remove('open');
  }
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
          if (lastData && lastData.walletSummary && lastData.walletSummary.available) {
            lastData.walletSummary.available.amount = Math.max(0, Math.round((lastData.walletSummary.available.amount - amount) * 100) / 100);
            const quickAvailEl = document.getElementById('quickAvailable');
            if (quickAvailEl) quickAvailEl.textContent = lastData.walletSummary.available.amount.toFixed(2) + ' ' + lastData.walletSummary.available.currency.toUpperCase();
          }
          const t = loadToken();
          if (t) recheckToken(t, true);
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
          closeQwModal();
          show('stateLogin');
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

  document.getElementById('withdrawOpenBtn').addEventListener('click', () => {
    openQwModal();
  });

  function openRankupModal() {
    const banner = document.getElementById('rankupBanner');
    if (!banner) return;
    const TIER_LABELS = { media: 'Media', partner: 'Partner', partner_plus: 'Partner+' };
    document.getElementById('rankupCurrentTier').textContent = TIER_LABELS[banner.dataset.currentTier] || '—';
    document.getElementById('rankupRequestedTier').textContent = TIER_LABELS[banner.dataset.requestedTier] || '—';
    document.getElementById('rankupTotalOrders').textContent = banner.dataset.totalOrders || '0';
    document.getElementById('rankupFollowers').value = '';
    document.getElementById('rankupProfileLink').value = '';
    document.getElementById('rankupFormError').style.display = 'none';
    document.getElementById('rankupOverlay').classList.add('open');
  }
  function closeRankupModal() {
    document.getElementById('rankupOverlay').classList.remove('open');
  }
  const rankupOpenBtn = document.getElementById('rankupBannerBtn');
  if (rankupOpenBtn) rankupOpenBtn.addEventListener('click', openRankupModal);
  const rankupCloseBtn = document.getElementById('rankupCloseBtn');
  if (rankupCloseBtn) rankupCloseBtn.addEventListener('click', closeRankupModal);
  const rankupOverlay = document.getElementById('rankupOverlay');
  if (rankupOverlay) {
    rankupOverlay.addEventListener('click', function (e) { if (e.target === this) closeRankupModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rankupOverlay.classList.contains('open')) closeRankupModal();
    });
  }
  const rankupSubmitBtn = document.getElementById('rankupSubmitBtn');
  if (rankupSubmitBtn) {
    rankupSubmitBtn.addEventListener('click', function () {
      if (this.disabled) return;
      const token = loadToken();
      if (!token) { closeRankupModal(); return; }
      const banner = document.getElementById('rankupBanner');
      const currentTier = banner.dataset.currentTier;
      const requestedTier = banner.dataset.requestedTier;
      const followers = parseInt(document.getElementById('rankupFollowers').value, 10) || 0;
      const profileLink = document.getElementById('rankupProfileLink').value.trim();
      const errEl = document.getElementById('rankupFormError');
      if (followers <= 0 || !profileLink) {
        errEl.style.display = 'block';
        errEl.textContent = 'Please fill in your follower count and profile link.';
        return;
      }
      this.disabled = true;
      fetch(BOT_API_URL + '/partner-rankup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token, currentTier: currentTier, requestedTier: requestedTier,
          followers: followers, profileLink: profileLink,
          totalOrders: parseInt(banner.dataset.totalOrders, 10) || 0
        })
      })
        .then(r => r.json())
        .then(data => {
          rankupSubmitBtn.disabled = false;
          if (data && data.ok) {
            try { localStorage.setItem(RANKUP_PENDING_KEY, currentTier + '->' + requestedTier); } catch (e) {}
            closeRankupModal();
            showToast('📨', 'Rank-up request sent', "We'll review it and get back to you on Discord.", null, 'View Dashboard', 'index');
            renderRankupBanner(lastData);
            return;
          }
          errEl.style.display = 'block';
          if (data && data.error === 'already_pending') {
            errEl.textContent = 'You already have a pending rank-up request.';
          } else if (data && data.error === 'not_member') {
            errEl.textContent = "We couldn't find you on the Frost Discord server.";
          } else if (data && data.error === 'token_expired') {
            clearToken();
            closeRankupModal();
            show('stateLogin');
          } else {
            errEl.textContent = "Couldn't submit your request. Please try again.";
          }
        })
        .catch(() => {
          rankupSubmitBtn.disabled = false;
          errEl.style.display = 'block';
          errEl.textContent = 'Network error. Please try again.';
        });
    });
  }

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
    const params = new URLSearchParams(window.location.search);

    if (params.has('code')) {
      const code = params.get('code');
      const returnedState = params.get('state') || '';
      let storedState = '';
      try { storedState = sessionStorage.getItem(OAUTH_STATE_KEY) || ''; } catch (e) {}
      try { sessionStorage.removeItem(OAUTH_STATE_KEY); } catch (e) {}

      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('code');
      cleanUrl.searchParams.delete('state');
      window.history.replaceState(null, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

      if (storedState && returnedState !== storedState) {
        showError('Sign-in session mismatch. Please try again.');
        return;
      }
      exchangeCode(code);
      return;
    }

    if (params.has('error')) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('error');
      cleanUrl.searchParams.delete('error_description');
      cleanUrl.searchParams.delete('state');
      window.history.replaceState(null, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
      show('stateLogin');
      return;
    }

    const token = loadToken();
    if (!token) { show('stateLogin'); return; }
    const cached = loadCache();
    if (cached) {
      show('stateData');
      renderDashboard(cached);
    } else {
      show('stateWorking');
    }
    startAutoRefresh();
    recheckToken(token, false, true);
  })();
})();
