(function () {
  const API = 'https://bot.frostclient.eu/site/partners';
  const SHOW_COUNT = 6;
  const PRIMARY_LINK = { creator: ['youtube', 'tiktok', 'twitch', 'kick', 'x', 'instagram', 'website', 'discord'], server: ['website', 'discord', 'store'] };
  const row = document.getElementById('plPartnersRow');
  if (!row) return;
  const section = document.getElementById('plPartners');

  function primaryLink(p) {
    for (const k of PRIMARY_LINK[p.type] || PRIMARY_LINK.creator) {
      if (p.links && typeof p.links[k] === 'string' && /^https:\/\//.test(p.links[k])) return p.links[k];
    }
    return 'https://frostclient.eu/partners' + (p.type === 'server' ? '?type=server' : '');
  }

  function buildPill(p) {
    const a = document.createElement('a');
    a.className = 'pl-pill';
    a.dataset.type = p.type;
    a.href = primaryLink(p);
    a.target = '_blank';
    a.rel = 'noopener nofollow';
    const fallback = document.createElement('span');
    fallback.className = 'pl-pill-avatar';
    fallback.textContent = (p.name || '?').charAt(0).toUpperCase();
    if (p.image) {
      const img = document.createElement('img');
      img.className = 'pl-pill-avatar';
      img.src = p.image;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => img.replaceWith(fallback), { once: true });
      a.appendChild(img);
    } else a.appendChild(fallback);
    const name = document.createElement('span');
    name.className = 'pl-pill-name';
    name.textContent = p.name;
    const type = document.createElement('span');
    type.className = 'pl-pill-type';
    type.textContent = p.type === 'server' ? 'Server' : 'Creator';
    a.append(name, type);
    return a;
  }

  fetch(API).then(r => r.json()).then(data => {
    const list = (data && Array.isArray(data.partners) ? data.partners : []).filter(p => p && p.name);
    const picked = list.filter(p => p.featured).concat(list.filter(p => !p.featured)).slice(0, SHOW_COUNT);
    if (!picked.length) return;
    picked.forEach(p => row.appendChild(buildPill(p)));
    section.hidden = false;
  }).catch(() => {});
})();
