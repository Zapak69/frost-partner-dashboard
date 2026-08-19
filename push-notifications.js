(function () {
  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }
  function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  if (!isMobileDevice() || !isStandaloneMode()) return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

  let token = '';
  try { token = localStorage.getItem('frostPartnerDashToken') || ''; } catch (e) {}
  if (!token) return;

  function callPush(action, extra) {
    return fetch('https://bot.frostclient.eu/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ token: token }, extra || {}))
    }).then(function (r) { return r.json(); }).catch(function () { return null; });
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function subscribeToPush(registration) {
    return registration.pushManager.getSubscription().then(function (existing) {
      if (existing) return existing;
      return callPush('partner-push-publickey').then(function (d) {
        if (!d || !d.ok || !d.publicKey) return null;
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(d.publicKey)
        });
      });
    }).then(function (sub) {
      if (sub) callPush('partner-push-subscribe', { subscription: sub.toJSON() });
    });
  }

  function showEnableModal(onEnable) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-box">' +
        '<button type="button" class="modal-close" aria-label="Close">✕</button>' +
        '<div class="modal-title">Enable notifications?</div>' +
        '<p class="withdraw-sub">Get notified on this device about new orders, withdrawals, and rank-up decisions — even when the dashboard is closed.</p>' +
        '<button type="button" class="withdraw-btn">Enable</button>' +
      '</div>';
    document.body.appendChild(overlay);
    function close() {
      overlay.classList.remove('open');
      setTimeout(function () { overlay.remove(); }, 300);
    }
    overlay.querySelector('.modal-close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.withdraw-btn').addEventListener('click', function () {
      close();
      onEnable();
    });
    setTimeout(function () { overlay.classList.add('open'); }, 50);
  }

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (registration) {
      if (Notification.permission === 'granted') {
        subscribeToPush(registration);
        return;
      }
      if (Notification.permission === 'denied') return;
      setTimeout(function () {
        showEnableModal(function () {
          Notification.requestPermission().then(function (permission) {
            if (permission === 'granted') subscribeToPush(registration);
          });
        });
      }, 800);
    }).catch(function () {});
  });
})();
