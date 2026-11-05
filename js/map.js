window.MorarMap = (function () {
  const maps = new Map();

  function resolveLatLng(item, cityCoords) {
    if (item && item.lat != null && item.lng != null && !Number.isNaN(Number(item.lat)) && !Number.isNaN(Number(item.lng))) {
      return [Number(item.lat), Number(item.lng)];
    }
    const city = item && item.city;
    if (city && cityCoords && cityCoords[city]) return cityCoords[city].slice();
    return [-14.235, -51.9253]; // Brazil centroid fallback
  }

  function ensureLeaflet(cb) {
    if (window.L) return cb();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    s.crossOrigin = '';
    s.onload = cb;
    document.head.appendChild(s);
  }

  function render(elId, items, opts) {
    opts = opts || {};
    ensureLeaflet(function () {
      const el = document.getElementById(elId);
      if (!el || !window.L) return;
      if (maps.has(elId)) {
        maps.get(elId).remove();
        maps.delete(elId);
      }
      const list = Array.isArray(items) ? items : [items];
      const coords = list.map((it) => ({
        it,
        ll: resolveLatLng(it, (window.MORAR && window.MORAR.cityCoords) || {})
      }));
      const start = coords[0] ? coords[0].ll : [-14.235, -51.9253];
      const map = L.map(elId, { scrollWheelZoom: false }).setView(start, opts.zoom || (coords.length > 1 ? 4 : 13));
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const bounds = [];
      coords.forEach(({ it, ll }) => {
        bounds.push(ll);
        const verified = it.advertiser_verified || it.verification_status === 'verificado';
        const label = (it.title || it.city || 'Imóvel') + (verified ? ' ✓' : '');
        const marker = L.marker(ll).addTo(map);
        marker.bindPopup(
          '<strong>' + escape(label) + '</strong><br>' +
          escape(it.address_text || [it.neighborhood, it.city].filter(Boolean).join(' · ') || '') +
          '<br><em>Local aproximado</em>' +
          (it.id ? '<br><a href="imovel.html?id=' + encodeURIComponent(it.id) + '">Ver anúncio</a>' : '')
        );
      });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28] });
      setTimeout(() => map.invalidateSize(), 80);
      maps.set(elId, map);
    });
  }

  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { render, resolveLatLng };
})();
