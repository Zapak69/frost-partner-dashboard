(function () {
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }
  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  if (!isMobileDevice() || isStandaloneMode()) return;

  const DISMISSED_KEY = 'frostDashAddHomeScreenDismissed';
  try { if (localStorage.getItem(DISMISSED_KEY)) return; } catch (e) {}

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const steps = isIOS
    ? ['Tap the Share button in Safari\'s toolbar.', 'Scroll down and tap "Add to Home Screen".', 'Tap "Add" in the top-right corner.']
    : isAndroid
      ? ['Tap the ⋮ menu in your browser.', 'Tap "Add to Home screen" (or "Install app").', 'Confirm by tapping "Add" / "Install".']
      : ['Open your browser\'s menu.', 'Look for "Add to Home Screen" or "Install app".', 'Confirm the install.'];

  const style = document.createElement('style');
  style.textContent =
    '.home-screen-steps{list-style:none;counter-reset:hs-step;padding:0;margin:0 0 20px;display:flex;flex-direction:column;gap:10px;}' +
    '.home-screen-steps li{counter-increment:hs-step;display:flex;align-items:flex-start;gap:10px;font-size:13.5px;color:var(--text);line-height:1.5;}' +
    '.home-screen-steps li span{flex:1 1 auto;min-width:0;}' +
    '.home-screen-steps li::before{content:counter(hs-step);flex:none;width:20px;height:20px;border-radius:50%;background:var(--gold);color:#1a0f00;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;}';
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'addHomeScreenOverlay';
  overlay.innerHTML =
    '<div class="modal-box">' +
      '<button type="button" class="modal-close" id="addHomeScreenCloseBtn" aria-label="Close">✕</button>' +
      '<div class="modal-title">Add to your Home Screen</div>' +
      '<p class="withdraw-sub">Install this dashboard as an app for quick access and to enable notifications.</p>' +
      '<ol class="home-screen-steps">' + steps.map(function (s) { return '<li><span>' + escapeHtml(s) + '</span></li>'; }).join('') + '</ol>' +
      '<button type="button" class="withdraw-btn" id="addHomeScreenGotItBtn">Got it</button>' +
    '</div>';
  document.body.appendChild(overlay);

  function dismiss() {
    overlay.classList.remove('open');
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch (e) {}
  }
  document.getElementById('addHomeScreenGotItBtn').addEventListener('click', dismiss);
  document.getElementById('addHomeScreenCloseBtn').addEventListener('click', dismiss);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) dismiss(); });

  window.addEventListener('load', function () {
    setTimeout(function () { overlay.classList.add('open'); }, 500);
  });
})();
