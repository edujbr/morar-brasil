(function () {
  const M = window.MORAR;
  const LS_KEY = 'imovel_seguro_submissions_v1';
  const FAV_KEY = 'imovel_seguro_favs_v1';
  const photoState = {}; // key -> dataUrl

  function money(v, purpose) {
    const n = Number(v) || 0;
    const formatted = n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    return purpose === 'alugar' ? formatted + '<small>/mês</small>' : formatted;
  }
  function typeMeta(id) {
    return M.types.find((t) => t.id === id) || { id, label: id, emoji: '📍' };
  }
  function purposeLabel(p) { return p === 'alugar' ? 'Aluguel' : 'Venda'; }
  function waLink(phone, text) {
    const digits = String(phone || '').replace(/\D/g, '');
    const withCountry = digits.startsWith('55') ? digits : '55' + digits;
    return 'https://wa.me/' + withCountry + '?text=' + encodeURIComponent(text || '');
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function parseCityInput(raw) {
    const s = String(raw || '').trim();
    if (!s) return { city: '', uf: '', label: '' };
    const m = s.match(/^(.*?)\s*[-–—,]\s*([A-Za-z]{2})\s*$/);
    if (m) return { city: m[1].trim(), uf: m[2].toUpperCase(), label: m[1].trim() + ' - ' + m[2].toUpperCase() };
    return { city: s, uf: '', label: s };
  }
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  }
  function isVerified(item) {
    return !!(item && (item.advertiser_verified || item.verification_status === 'verificado'));
  }
  function saveLocal(item) {
    try {
      const all = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      const slim = Object.assign({}, item);
      if (Array.isArray(slim.photo_slots)) {
        slim.photo_slots = slim.photo_slots.map((p) => ({
          key: p.key, label: p.label,
          url: (p.url && p.url.length < 180000) ? p.url : null
        }));
      }
      all.unshift(slim);
      localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 20)));
    } catch (_) {}
  }

  function getFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
  }
  function isFav(id) { return getFavs().includes(String(id)); }
  function toggleFav(id, btn) {
    id = String(id);
    let favs = getFavs();
    if (favs.includes(id)) favs = favs.filter((x) => x !== id);
    else favs.unshift(id);
    localStorage.setItem(FAV_KEY, JSON.stringify(favs.slice(0, 100)));
    if (btn) {
      const on = favs.includes(id);
      btn.textContent = on ? '♥' : '♡';
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.setAttribute('aria-label', on ? 'Remover dos favoritos' : 'Salvar nos favoritos');
    }
    const count = document.getElementById('fav-count');
    if (count) count.textContent = String(favs.length);
  }

  function coverUrl(item) {
    if (item.photo_slots && item.photo_slots.length) {
      const first = item.photo_slots.find((p) => p.url) || item.photo_slots[0];
      if (first && first.url) return first.url;
    }
    if (item.photo_urls && item.photo_urls.length) return item.photo_urls[0];
    return null;
  }

  async function fetchListings() {
    try {
      const url = M.supabaseUrl + '/rest/v1/imoveis_listings?select=*&order=created_at.desc';
      const res = await fetch(url, {
        headers: { apikey: M.supabaseAnon, Authorization: 'Bearer ' + M.supabaseAnon }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) return M.fallbackExamples;
      return rows;
    } catch (e) {
      console.warn('Supabase fallback', e);
      return M.fallbackExamples;
    }
  }

  async function fetchOne(id) {
    if (!id) return null;
    if (String(id).startsWith('local-')) {
      try {
        const local = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
        const hit = local.find((x) => x.id === id);
        if (hit) return hit;
      } catch (_) {}
      return M.fallbackExamples.find((x) => x.id === id) || null;
    }
    try {
      const url = M.supabaseUrl + '/rest/v1/imoveis_listings?id=eq.' + encodeURIComponent(id) + '&select=*';
      const res = await fetch(url, {
        headers: { apikey: M.supabaseAnon, Authorization: 'Bearer ' + M.supabaseAnon }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      return rows[0] || null;
    } catch {
      return M.fallbackExamples.find((x) => x.id === id) || null;
    }
  }

  function placeholderFor(type) {
    const known = ['casa', 'terreno', 'sitio', 'chacara', 'apartamento', 'comercial', 'barracao'];
    const key = known.indexOf(type) >= 0 ? type : 'casa';
    return 'img/ph-' + key + '.svg';
  }

  function cardHTML(item) {
    const t = typeMeta(item.property_type);
    const isEx = item.is_example || item.status === 'exemplo';
    const verified = isVerified(item);
    const place = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const extra = [
      item.bedrooms != null ? item.bedrooms + ' quartos' : null,
      item.area_m2 != null ? Number(item.area_m2).toLocaleString('pt-BR') + ' m²' : null
    ].filter(Boolean).join(' · ');
    const cover = coverUrl(item);
    const photo = cover || placeholderFor(item.property_type);
    const user = item.username ? ('@' + String(item.username).replace(/^@/, '')) : '';
    const fav = isFav(item.id);
    const meta = [place, extra, purposeLabel(item.purpose)].filter(Boolean).join(' · ');
    const marks = [
      verified ? '<span class="verified-mark" title="Anunciante verificado">✓<span class="sr-only"> Anunciante verificado</span></span>' : '',
      item.featured ? '<span class="feat-mark">Destaque</span>' : ''
    ].join('');
    return `
      <article class="card listing">
        <a class="listing-link" href="imovel.html?id=${encodeURIComponent(item.id)}">
          <div class="listing-photo ${escapeHtml(item.property_type || '')}">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(item.title || 'Foto do imóvel')}">
            ${isEx ? '<div class="listing-badges"><span class="tag-exemplo">Exemplo</span></div>' : ''}
            ${user ? `<span class="photo-wm">${escapeHtml(user)}</span>` : (window.MorarPhotos ? window.MorarPhotos.overlayHTML(item.username) : '')}
          </div>
          <div class="listing-body">
            <div class="price">${money(item.price, item.purpose)}${marks}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p class="meta">${escapeHtml(meta)}</p>
          </div>
        </a>
        <button type="button" class="fav-btn${fav ? ' is-on' : ''}" data-fav="${escapeHtml(item.id)}" aria-pressed="${fav ? 'true' : 'false'}" aria-label="${fav ? 'Remover dos favoritos' : 'Salvar nos favoritos'}">${fav ? '♥' : '♡'}</button>
      </article>`;
  }

  function fillTypeSelects() {
    document.querySelectorAll('[data-types]').forEach((el) => {
      const withAll = el.getAttribute('data-types') === 'all';
      el.innerHTML = (withAll ? '<option value="">Todos os tipos</option>' : '') +
        M.types.map((t) => `<option value="${t.id}">${t.emoji} ${t.label}</option>`).join('');
    });
  }

  function setActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a[data-nav]').forEach((a) => {
      if (a.getAttribute('data-nav') === path) a.classList.add('active');
    });
  }

  function cityList() { return Array.isArray(window.MORAR_CITIES) ? window.MORAR_CITIES : []; }

  function wireCityAutocomplete() {
    document.querySelectorAll('[data-city-input]').forEach((input) => {
      const listId = input.getAttribute('list') || (input.id ? input.id + '-list' : 'city-list-' + Math.random().toString(36).slice(2));
      let datalist = document.getElementById(listId);
      if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = listId;
        input.setAttribute('list', listId);
        input.parentNode.appendChild(datalist);
      }
      let timer = null;
      const refresh = () => {
        const q = norm(input.value);
        let matches;
        if (!q) {
          matches = (M.spotlight || []).slice(0, 12).map((label) => {
            const p = parseCityInput(label);
            return { label, city: p.city, uf: p.uf };
          });
        } else {
          matches = cityList().filter((c) => norm(c.label).includes(q) || norm(c.city).includes(q)).slice(0, 40);
        }
        datalist.innerHTML = matches.map((c) => `<option value="${escapeHtml(c.label)}"></option>`).join('');
      };
      input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(refresh, 80); });
      input.addEventListener('focus', refresh);
      refresh();
    });
  }

  function filterList(list, filters) {
    const cityQ = norm(filters.city);
    return list.filter((item) => {
      if (cityQ) {
        const blob = norm(item.city + ' ' + (item.neighborhood || '') + ' ' + (item.title || ''));
        if (!blob.includes(cityQ) && norm(item.city) !== cityQ) return false;
      }
      if (filters.purpose && item.purpose !== filters.purpose) return false;
      if (filters.type && item.property_type !== filters.type) return false;
      if (filters.verified === '1' && !isVerified(item)) return false;
      if (filters.favs === '1' && !isFav(item.id)) return false;
      if (filters.q) {
        const blob = norm(item.title + ' ' + (item.description || '') + ' ' + (item.neighborhood || '') + ' ' + item.city);
        if (!blob.includes(norm(filters.q))) return false;
      }
      return true;
    });
  }

  let cachedListings = null;
  async function getListings() {
    if (!cachedListings) cachedListings = await fetchListings();
    return cachedListings;
  }

  async function renderHome() {
    const grid = document.getElementById('listings');
    const countEl = document.getElementById('listings-count');
    const mapWrap = document.getElementById('map-view');
    if (!grid && !mapWrap) return;

    const cityRaw = document.getElementById('f-city')?.value || '';
    const parsed = parseCityInput(cityRaw);
    const purpose = document.getElementById('f-purpose')?.value || '';
    const type = document.getElementById('f-type')?.value || '';
    const q = document.getElementById('f-q')?.value || '';
    const verifiedOnly = document.getElementById('f-verified')?.checked ? '1' : '';
    const favsOnly = document.getElementById('f-favs')?.checked ? '1' : '';
    const view = document.querySelector('[data-view].active')?.getAttribute('data-view') || 'grid';

    if (grid) grid.innerHTML = '<div class="empty">Carregando imóveis…</div>';
    const all = await getListings();
    const filtered = filterList(all, { city: parsed.city, purpose, type, q, verified: verifiedOnly, favs: favsOnly });
    if (countEl) {
      const where = parsed.city ? (' em ' + parsed.city) : ' no Brasil';
      countEl.textContent = filtered.length + (filtered.length === 1 ? ' imóvel' : ' imóveis') + where;
    }

    if (view === 'map') {
      if (grid) grid.style.display = 'none';
      if (mapWrap) {
        mapWrap.style.display = 'block';
        if (!filtered.length) {
          mapWrap.innerHTML = '<div class="empty">Nenhum imóvel no mapa.</div>';
        } else {
          mapWrap.innerHTML = '<div id="listings-map" class="map map-lg"></div><p class="help" style="margin-top:8px">📍 Local aproximado. Confirme o endereço na visita.</p>';
          window.MorarMap.render('listings-map', filtered, { zoom: 4 });
        }
      }
      return;
    }

    if (mapWrap) mapWrap.style.display = 'none';
    if (grid) {
      grid.style.display = '';
      if (!filtered.length) {
        grid.innerHTML = '<div class="empty">Nenhum imóvel com esses filtros.<br><a href="anunciar.html"><strong>Anunciar o seu — é grátis</strong></a></div>';
      } else {
        grid.innerHTML = filtered.map(cardHTML).join('');
        wireFavButtons(grid);
      }
    }
  }

  function wireFavButtons(root) {
    (root || document).querySelectorAll('[data-fav]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFav(btn.getAttribute('data-fav'), btn);
      });
    });
  }

  function openReportModal(listing) {
    const bg = document.getElementById('report-modal');
    if (!bg) return;
    bg.classList.add('open');
    bg.dataset.listingId = listing.id || '';
    const title = document.getElementById('report-listing-title');
    if (title) title.textContent = listing.title || 'Anúncio';
  }

  function wireReportModal() {
    const bg = document.getElementById('report-modal');
    if (!bg) return;
    bg.addEventListener('click', (e) => { if (e.target === bg) bg.classList.remove('open'); });
    document.getElementById('report-cancel')?.addEventListener('click', () => bg.classList.remove('open'));
    document.getElementById('report-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const payload = {
        listing_id: bg.dataset.listingId || null,
        reason: String(fd.get('reason') || '').trim(),
        details: String(fd.get('details') || '').trim() || null,
        reporter_contact: String(fd.get('contact') || '').trim() || null,
        source: 'site'
      };
      const ok = document.getElementById('report-ok');
      const btn = document.getElementById('report-submit');
      if (ok) ok.style.display = 'none';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
      try {
        const res = await fetch(M.supabaseUrl + '/rest/v1/imoveis_reports', {
          method: 'POST',
          headers: {
            apikey: M.supabaseAnon,
            Authorization: 'Bearer ' + M.supabaseAnon,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        if (ok) { ok.style.display = 'block'; ok.textContent = '✅ Denúncia registrada. Vamos analisar.'; }
        e.target.reset();
        setTimeout(() => bg.classList.remove('open'), 1200);
      } catch (ex) {
        try {
          const local = JSON.parse(localStorage.getItem('imovel_seguro_reports') || '[]');
          local.unshift({ ...payload, at: new Date().toISOString() });
          localStorage.setItem('imovel_seguro_reports', JSON.stringify(local.slice(0, 30)));
        } catch (_) {}
        if (ok) { ok.style.display = 'block'; ok.textContent = '✅ Denúncia salva neste aparelho.'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar denúncia'; }
      }
    });
  }

  function galleryHTML(item) {
    const slots = Array.isArray(item.photo_slots) ? item.photo_slots.filter((p) => p && p.url) : [];
    if (!slots.length && item.photo_urls && item.photo_urls.length) {
      return `<div class="gallery">${item.photo_urls.slice(0, 8).map((u, i) =>
        `<figure><img src="${escapeHtml(u)}" alt=""><figcaption>Foto ${i + 1}${item.username ? ' · @' + escapeHtml(item.username) : ''}</figcaption></figure>`
      ).join('')}</div>`;
    }
    if (!slots.length) return '<p class="help">Ainda sem fotos padronizadas neste anúncio.</p>';
    return `<div class="gallery">${slots.map((p) =>
      `<figure><img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.label || '')}"><figcaption>${escapeHtml(p.label || p.key)}${item.username ? ' · @' + escapeHtml(item.username) : ''}</figcaption></figure>`
    ).join('')}</div>`;
  }

  async function renderDetail() {
    const root = document.getElementById('detail');
    if (!root) return;
    const id = qs('id');
    root.innerHTML = '<div class="empty">Carregando…</div>';
    const item = await fetchOne(id);
    if (!item) {
      root.innerHTML = '<div class="empty">Imóvel não encontrado. <a href="index.html">Voltar</a></div>';
      return;
    }
    const t = typeMeta(item.property_type);
    const isEx = item.is_example || item.status === 'exemplo';
    const verified = isVerified(item);
    const place = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const msg = `Olá! Vi o anúncio "${item.title}" no Imóvel Seguro e tenho interesse.`;
    const visitMsg = `Olá! Quero agendar uma VISITA ao imóvel "${item.title}" (${item.city}). Pode me passar dias/horários?`;
    document.title = item.title + ' — Imóvel Seguro';
    const cover = coverUrl(item);
    const user = item.username ? '@' + String(item.username).replace(/^@/, '') : '';

    root.innerHTML = `
      ${isEx ? '<div class="banner">⚠️ Este é um <strong>anúncio de exemplo</strong>. Não é um imóvel real.</div>' : ''}
      <div class="banner banner-danger">🛡️ <strong>Cuidado com golpes:</strong> não faça Pix sem visita e contrato.
        <a href="anti-golpe.html"><u>Ver lista de proteção</u></a></div>
      <div class="detail">
        <div>
          <div class="detail-photo listing-photo ${item.property_type || ''} card">
            ${cover ? `<img src="${escapeHtml(cover)}" alt="">` : ''}
            ${isEx ? '<span class="tag-exemplo">EXEMPLO</span>' : ''}
            ${verified ? '<span class="tag-verificado">✓ Anunciante verificado</span>' : ''}
            ${!cover ? `<span class="emoji" style="font-size:64px;position:absolute;right:18px;top:18px">${t.emoji}</span>` : ''}
            <span class="tag">${purposeLabel(item.purpose)} · ${t.label}</span>
            ${user ? `<span class="photo-wm">${escapeHtml(user)}</span>` : ''}
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <h2 style="margin:0 0 8px;font-size:1.15rem">Fotos do imóvel (padrão por cômodo)</h2>
            ${galleryHTML(item)}
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <h2 style="margin:0 0 8px;font-size:1.15rem">Descrição</h2>
            <p style="margin:0;color:var(--muted)">${escapeHtml(item.description)}</p>
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
              <h2 style="margin:0;font-size:1.15rem">Onde fica</h2>
              <span class="help">Ponto aproximado</span>
            </div>
            <div id="detail-map" class="map"></div>
            <p class="meta" style="margin:10px 0 0">${escapeHtml(item.address_text || place || item.city)}</p>
          </div>
        </div>
        <aside class="card detail-side">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div class="note-pill">${escapeHtml(place || item.city)}</div>
            ${verified ? '<span class="verified-pill">✓ Verificado</span>' : '<span class="unverified-pill">⚠ Ainda não verificado</span>'}
            ${user ? `<span class="note-pill">${escapeHtml(user)}</span>` : ''}
          </div>
          <h1>${escapeHtml(item.title)}</h1>
          <div class="price" style="font-size:1.7rem">${money(item.price, item.purpose)}</div>
          <div class="kv">
            <div><span>Finalidade</span><strong>${purposeLabel(item.purpose)}</strong></div>
            <div><span>Tipo</span><strong>${t.emoji} ${t.label}</strong></div>
            ${item.bedrooms != null ? `<div><span>Quartos</span><strong>${item.bedrooms}</strong></div>` : ''}
            ${item.bathrooms != null ? `<div><span>Banheiros</span><strong>${item.bathrooms}</strong></div>` : ''}
            ${item.area_m2 != null ? `<div><span>Área</span><strong>${Number(item.area_m2).toLocaleString('pt-BR')} m²</strong></div>` : ''}
            <div><span>Cidade</span><strong>${escapeHtml(item.city)}</strong></div>
          </div>
          ${item.advertiser_kind === 'pj' && item.agency_slug
            ? `<a class="btn btn-ghost btn-block" href="imobiliaria.html?slug=${encodeURIComponent(item.agency_slug)}">🏢 Ver imobiliária</a>`
            : ''}
          ${isEx
            ? '<button class="btn btn-ghost btn-block" disabled>Contato desativado (exemplo)</button>'
            : `<a class="btn btn-wa btn-xl" target="_blank" rel="noopener" href="${waLink(item.whatsapp, msg)}">💬 Falar no WhatsApp</a>
               <a class="btn btn-primary btn-block" style="margin-top:10px" target="_blank" rel="noopener" href="${waLink(item.whatsapp, visitMsg)}">📅 Pedir visita</a>
               <p class="help" style="margin-top:10px;text-align:center">${item.advertiser_kind === 'pj' ? 'Imobiliária' : 'Anunciante'}: ${escapeHtml(item.agency_name || item.owner_name)}</p>`}
          ${item.purpose === 'alugar' ? `<a class="btn btn-ghost btn-block" style="margin-top:10px" href="contrato.html?id=${encodeURIComponent(item.id)}">📄 Gerar contrato de aluguel</a>` : ''}
          <button type="button" class="btn btn-ghost btn-block" style="margin-top:10px" data-fav-detail="${escapeHtml(item.id)}">${isFav(item.id) ? '♥ Nos favoritos' : '♡ Salvar nos favoritos'}</button>
          <a class="btn btn-ghost btn-block" style="margin-top:10px" href="verificar.html">🔐 Como verificar CPF/CNPJ</a>
          <button type="button" class="btn btn-ghost btn-block" style="margin-top:10px;border-color:var(--danger);color:var(--danger)" id="btn-report">🚩 Denunciar anúncio</button>
          <a class="btn btn-ghost btn-block" style="margin-top:10px" href="index.html">← Voltar</a>
        </aside>
      </div>`;

    window.MorarMap?.render('detail-map', item, { zoom: 13 });
    document.getElementById('btn-report')?.addEventListener('click', () => openReportModal(item));
    document.querySelector('[data-fav-detail]')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      toggleFav(item.id);
      btn.textContent = isFav(item.id) ? '♥ Nos favoritos' : '♡ Salvar nos favoritos';
    });
  }

  function renderPhotoSlots() {
    const box = document.getElementById('photo-slots');
    if (!box || !window.MorarPhotos) return;
    const bedrooms = Number(document.getElementById('f-bedrooms')?.value || document.querySelector('[name=bedrooms]')?.value || 0);
    const bathrooms = Number(document.querySelector('[name=bathrooms]')?.value || 1);
    const hasSuite = document.getElementById('f-suite')?.checked;
    const propertyType = document.querySelector('[name=property_type]')?.value || 'casa';
    const acc = window.MorarAuth?.get();
    const username = acc?.username || document.querySelector('[name=username_preview]')?.value || 'anunciante';
    const slots = window.MorarPhotos.buildSlots({ bedrooms, hasSuite, bathrooms, propertyType });
    box.innerHTML = slots.map((s) => `
      <div class="photo-slot ${s.required ? 'required' : ''}" data-slot="${s.key}">
        <div class="slot-label">${escapeHtml(s.label)}${s.required ? ' *' : ''}</div>
        <p class="help">Uma foto deste cômodo. Seu usuário @${escapeHtml(username)} será marcado na imagem.</p>
        <input type="file" accept="image/*" data-photo-key="${s.key}" ${s.required ? 'required' : ''}>
        <div class="preview" id="prev-${s.key}" style="display:none"></div>
      </div>`).join('');

    box.querySelectorAll('input[type=file]').forEach((input) => {
      input.addEventListener('change', async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const key = input.getAttribute('data-photo-key');
        const prev = document.getElementById('prev-' + key);
        prev.style.display = 'block';
        prev.innerHTML = '<p class="help">Preparando foto com marca d\'água…</p>';
        try {
          const dataUrl = await window.MorarPhotos.watermarkDataUrl(file, username);
          photoState[key] = { key, label: slots.find((x) => x.key === key)?.label || key, url: dataUrl };
          prev.innerHTML = `<img src="${dataUrl}" alt=""><span class="photo-wm">@${escapeHtml(username)}</span>`;
        } catch (err) {
          console.warn(err);
          prev.innerHTML = '<p class="help" style="color:var(--danger)">Não deu para ler esta foto. Tente outra.</p>';
        }
      });
    });
  }

  function wireAnnounceWizard() {
    const form = document.getElementById('announce-form');
    if (!form) return;
    const panes = [...form.querySelectorAll('.wizard-pane')];
    const steps = [...form.querySelectorAll('.wizard-steps .wstep')];
    let idx = 0;
    const show = (i) => {
      idx = Math.max(0, Math.min(panes.length - 1, i));
      panes.forEach((p, n) => p.classList.toggle('on', n === idx));
      steps.forEach((s, n) => s.classList.toggle('on', n === idx));
      window.scrollTo({ top: form.offsetTop - 80, behavior: 'smooth' });
      if (idx === 2) renderPhotoSlots();
    };
    form.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => {
      const pane = panes[idx];
      const required = [...pane.querySelectorAll('[required]')].filter((el) => el.offsetParent !== null);
      for (const el of required) {
        if (!el.value) { el.reportValidity(); return; }
      }
      show(idx + 1);
    }));
    form.querySelectorAll('[data-prev]').forEach((b) => b.addEventListener('click', () => show(idx - 1)));
    ['f-bedrooms', 'f-suite'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => { if (idx === 2) renderPhotoSlots(); });
    });
    form.querySelector('[name=bathrooms]')?.addEventListener('change', () => { if (idx === 2) renderPhotoSlots(); });
    form.querySelector('[name=property_type]')?.addEventListener('change', () => { if (idx === 2) renderPhotoSlots(); });
    show(0);
  }

  async function wireAnnounceForm() {
    const form = document.getElementById('announce-form');
    if (!form) return;
    const ok = document.getElementById('ok-box');
    const err = document.getElementById('err-box');
    const btn = document.getElementById('announce-btn');
    const acc = window.MorarAuth?.get();
    if (acc) {
      if (form.owner_name && !form.owner_name.value) form.owner_name.value = acc.display_name || '';
      if (form.whatsapp && !form.whatsapp.value) form.whatsapp.value = acc.whatsapp || '';
      const kind = document.getElementById('advertiser-kind');
      if (kind && acc.advertiser_kind) kind.value = acc.advertiser_kind;
      const uPrev = document.getElementById('username-display');
      if (uPrev) uPrev.textContent = '@' + acc.username;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!window.MorarAuth?.isLogged()) {
        err.style.display = 'block';
        err.innerHTML = 'Crie uma conta com usuário antes de anunciar. <a href="conta.html"><strong>Criar conta</strong></a>';
        return;
      }
      err.style.display = 'none'; ok.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Enviando…';
      const fd = new FormData(form);
      const cityParsed = parseCityInput(fd.get('city'));
      const lat = fd.get('lat') ? Number(fd.get('lat')) : null;
      const lng = fd.get('lng') ? Number(fd.get('lng')) : null;
      const wantVerify = fd.get('want_verify') === 'on';
      const advertiserKind = String(fd.get('advertiser_kind') || 'pf');
      const agencyName = String(fd.get('agency_name') || '').trim();
      const agencySlug = advertiserKind === 'pj'
        ? (String(fd.get('agency_slug') || '').trim() || (window.MorarAuth.normalizeUsername(agencyName) || 'imobiliaria'))
        : null;
      const account = window.MorarAuth.get();
      const slots = Object.values(photoState);
      // Required slots check for residential
      const needed = window.MorarPhotos.buildSlots({
        bedrooms: Number(fd.get('bedrooms') || 0),
        hasSuite: fd.get('has_suite') === 'on',
        bathrooms: Number(fd.get('bathrooms') || 1),
        propertyType: String(fd.get('property_type') || 'casa')
      }).filter((s) => s.required);
      const missing = needed.filter((s) => !photoState[s.key]);
      if (missing.length) {
        err.style.display = 'block';
        err.textContent = 'Faltam fotos obrigatórias: ' + missing.map((m) => m.label).join(', ');
        btn.disabled = false; btn.textContent = 'Publicar anúncio grátis';
        return;
      }

      // For Supabase: store slot metadata without huge dataURLs (keep first tiny refs locally)
      const remoteSlots = slots.map((p) => ({ key: p.key, label: p.label, has_image: true }));
      const payload = {
        owner_name: String(fd.get('owner_name') || '').trim(),
        whatsapp: String(fd.get('whatsapp') || '').trim(),
        city: cityParsed.city,
        neighborhood: String(fd.get('neighborhood') || '').trim() || null,
        purpose: String(fd.get('purpose') || 'comprar'),
        property_type: String(fd.get('property_type') || 'casa'),
        price: Number(String(fd.get('price') || '0').replace(/\./g, '').replace(',', '.')),
        title: String(fd.get('title') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        photo_urls: [],
        photo_slots: remoteSlots,
        area_m2: fd.get('area_m2') ? Number(fd.get('area_m2')) : null,
        bedrooms: fd.get('bedrooms') ? Number(fd.get('bedrooms')) : null,
        bathrooms: fd.get('bathrooms') ? Number(fd.get('bathrooms')) : null,
        rooms_count: needed.length,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        address_text: String(fd.get('address_text') || '').trim() || null,
        advertiser_verified: false,
        verification_status: wantVerify ? 'pendente' : 'nao_verificado',
        advertiser_kind: advertiserKind,
        agency_slug: agencySlug,
        agency_name: advertiserKind === 'pj' ? (agencyName || null) : null,
        agency_plan: advertiserKind === 'pj' ? 'pj_free' : 'pf_free',
        featured: false,
        username: account.username,
        status: 'pendente',
        is_example: false,
        source: 'site'
      };

      const localId = 'local-' + Date.now();
      saveLocal({ ...payload, id: localId, photo_slots: slots, created_at: new Date().toISOString() });

      if (advertiserKind === 'pj' && agencySlug) {
        try {
          await fetch(M.supabaseUrl + '/rest/v1/imoveis_agencies', {
            method: 'POST',
            headers: {
              apikey: M.supabaseAnon,
              Authorization: 'Bearer ' + M.supabaseAnon,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=minimal'
            },
            body: JSON.stringify({
              name: agencyName || payload.owner_name,
              slug: agencySlug,
              cnpj: String(fd.get('doc_number') || '').trim() || null,
              whatsapp: payload.whatsapp,
              city: cityParsed.city,
              description: String(fd.get('agency_description') || '').trim() || null,
              plan: 'pj_free',
              listing_limit: 5,
              verified: false,
              verification_status: wantVerify ? 'pendente' : 'nao_verificado',
              is_example: false,
              source: 'site'
            })
          });
        } catch (_) {}
      }

      try {
        const res = await fetch(M.supabaseUrl + '/rest/v1/imoveis_listings', {
          method: 'POST',
          headers: {
            apikey: M.supabaseAnon,
            Authorization: 'Bearer ' + M.supabaseAnon,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        form.reset();
        Object.keys(photoState).forEach((k) => delete photoState[k]);
        fillTypeSelects();
        wireCityAutocomplete();
        ok.style.display = 'block';
        ok.innerHTML = '✅ Anúncio recebido! Fotos com marca <strong>@' + escapeHtml(account.username) + '</strong> ficam neste aparelho (upload em nuvem de imagem ainda é demo). Status: pendente.';
      } catch (ex) {
        console.warn(ex);
        ok.style.display = 'block';
        ok.innerHTML = '✅ Salvamos neste aparelho com suas fotos marcadas. A sync do servidor falhou agora.';
        err.style.display = 'block';
        err.textContent = 'Servidor indisponível no momento.';
      } finally {
        btn.disabled = false; btn.textContent = 'Publicar anúncio grátis';
      }
    });
  }

  function wireHomeFilters() {
    const form = document.getElementById('search-form');
    if (!form) return;
    form.addEventListener('submit', (e) => { e.preventDefault(); renderHome(); });
    document.getElementById('f-verified')?.addEventListener('change', () => renderHome());
    document.getElementById('f-favs')?.addEventListener('change', () => renderHome());
    document.querySelectorAll('[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderHome();
      });
    });
    document.querySelectorAll('[data-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const purpose = chip.getAttribute('data-purpose') || '';
        const type = chip.getAttribute('data-type') || '';
        const city = chip.getAttribute('data-city') || '';
        if (chip.hasAttribute('data-purpose')) document.getElementById('f-purpose').value = purpose;
        if (chip.hasAttribute('data-type')) document.getElementById('f-type').value = type;
        if (city) document.getElementById('f-city').value = city;
        document.querySelectorAll('[data-chip]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderHome();
      });
    });
    document.getElementById('f-clear')?.addEventListener('click', () => {
      ['f-city', 'f-purpose', 'f-type', 'f-q'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
      const v = document.getElementById('f-verified'); if (v) v.checked = false;
      const f = document.getElementById('f-favs'); if (f) f.checked = false;
      document.querySelectorAll('[data-chip]').forEach((c) => c.classList.remove('active'));
      renderHome();
    });
  }

  function wireAdvertiserKindToggle() {
    const kind = document.getElementById('advertiser-kind');
    const pjBox = document.getElementById('pj-fields');
    if (!kind || !pjBox) return;
    const sync = () => {
      const isPj = kind.value === 'pj';
      pjBox.style.display = isPj ? 'grid' : 'none';
      pjBox.querySelectorAll('[data-pj-required]').forEach((el) => {
        if (isPj) el.setAttribute('required', 'required');
        else el.removeAttribute('required');
      });
      const docType = document.getElementById('doc-type');
      if (docType) docType.value = isPj ? 'cnpj' : 'cpf';
    };
    kind.addEventListener('change', sync);
    sync();
  }

  async function fetchAgencies() {
    try {
      const url = M.supabaseUrl + '/rest/v1/imoveis_agencies?select=*&order=created_at.desc';
      const res = await fetch(url, {
        headers: { apikey: M.supabaseAnon, Authorization: 'Bearer ' + M.supabaseAnon }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) return M.exampleAgencies || [];
      return rows;
    } catch (e) {
      return M.exampleAgencies || [];
    }
  }

  async function renderAgencyPage() {
    const root = document.getElementById('agency');
    if (!root) return;
    const slug = qs('slug') || qs('id');
    root.innerHTML = '<div class="empty">Carregando imobiliária…</div>';
    const allAg = await fetchAgencies();
    const agency = allAg.find((a) => a.slug === slug);
    if (!agency) {
      root.innerHTML = '<div class="empty">Imobiliária não encontrada. <a href="index.html">Voltar</a></div>';
      return;
    }
    const all = await getListings();
    const listings = all.filter((l) => l.agency_slug === agency.slug);
    const verified = agency.verified || agency.verification_status === 'verificado';
    const plan = (M.plans && M.plans[agency.plan]) || { label: agency.plan || 'PJ', limit: agency.listing_limit || 5 };
    document.title = agency.name + ' — Imóvel Seguro';
    root.innerHTML = `
      ${agency.is_example ? '<div class="banner">⚠️ Página de <strong>exemplo</strong> de imobiliária (PJ).</div>' : ''}
      <section class="page-hero">
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          ${verified ? '<span class="verified-pill">✓ Imobiliária verificada</span>' : '<span class="unverified-pill">⚠ Ainda não verificada</span>'}
          <span class="note-pill">PJ · ${escapeHtml(agency.city || 'Brasil')}</span>
        </div>
        <h1>${escapeHtml(agency.name)}</h1>
        <p>${escapeHtml(agency.description || '')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          ${agency.whatsapp ? `<a class="btn btn-wa" style="width:auto" target="_blank" rel="noopener" href="${waLink(agency.whatsapp, 'Olá! Vi a página da ' + agency.name + ' no Imóvel Seguro.')}">💬 WhatsApp</a>` : ''}
          <a class="btn btn-ghost" href="precos.html">Planos PJ</a>
        </div>
      </section>
      <section class="section">
        <div class="section-head"><div><h2>Anúncios</h2><p>${listings.length} de até ${plan.limit || 5}</p></div></div>
        <div class="grid">${listings.length ? listings.map(cardHTML).join('') : '<div class="empty">Nenhum anúncio ainda.</div>'}</div>
      </section>`;
    wireFavButtons(root);
  }

  async function wireContractPage() {
    const form = document.getElementById('contract-form');
    const out = document.getElementById('contract-out');
    if (!form || !out) return;
    const id = qs('id');
    let listing = id ? await fetchOne(id) : null;
    if (listing) {
      const info = document.getElementById('contract-listing-info');
      if (info) info.innerHTML = `Baseado no anúncio: <strong>${escapeHtml(listing.title)}</strong> · ${escapeHtml(listing.city)}`;
      if (listing.purpose === 'alugar' && form.rent && !form.rent.value) form.rent.value = listing.price;
      if (form.address && !form.address.value) form.address.value = listing.address_text || [listing.neighborhood, listing.city].filter(Boolean).join(', ');
      if (form.city && !form.city.value) form.city.value = listing.city;
    }
    const paint = () => {
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      const unlocked = sessionStorage.getItem('imovel_seguro_contract_unlock') === '1';
      window.MorarContract.renderPreview('contract-out', data, listing, unlocked);
    };
    form.addEventListener('input', paint);
    form.addEventListener('submit', (e) => { e.preventDefault(); paint(); });
    paint();
  }

  function wireAccountPage() {
    const form = document.getElementById('account-form');
    const box = document.getElementById('account-status');
    if (!form) return;
    const acc = window.MorarAuth.get();
    if (acc && box) {
      box.style.display = 'block';
      box.innerHTML = `Você está como <strong>@${escapeHtml(acc.username)}</strong> (${escapeHtml(acc.display_name || '')}). Esse usuário aparece nas fotos dos seus anúncios.`;
      form.username.value = acc.username;
      form.display_name.value = acc.display_name || '';
      if (acc.whatsapp) form.whatsapp.value = acc.whatsapp;
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const err = document.getElementById('account-err');
      const ok = document.getElementById('account-ok');
      err.style.display = 'none'; ok.style.display = 'none';
      try {
        const saved = await window.MorarAuth.register({
          username: fd.get('username'),
          display_name: fd.get('display_name'),
          whatsapp: fd.get('whatsapp'),
          advertiser_kind: fd.get('advertiser_kind')
        }, M);
        ok.style.display = 'block';
        ok.textContent = '✅ Conta pronta: @' + saved.username + '. Agora você pode anunciar.';
        window.MorarAuth.wireHeader();
        if (box) {
          box.style.display = 'block';
          box.innerHTML = `Logado como <strong>@${escapeHtml(saved.username)}</strong>`;
        }
      } catch (ex) {
        err.style.display = 'block';
        err.textContent = ex.message || 'Não foi possível criar a conta.';
      }
    });
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      window.MorarAuth.clear();
      location.reload();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillTypeSelects();
    setActiveNav();
    wireCityAutocomplete();
    wireHomeFilters();
    wireAnnounceForm();
    wireAnnounceWizard();
    wireReportModal();
    wireContractPage();
    wireAdvertiserKindToggle();
    wireAccountPage();
    window.MorarAuth?.wireHeader();
    const favCount = document.getElementById('fav-count');
    if (favCount) favCount.textContent = String(getFavs().length);
    if (document.getElementById('listings') || document.getElementById('map-view')) renderHome();
    if (document.getElementById('detail')) renderDetail();
    if (document.getElementById('agency')) renderAgencyPage();
  });

  window.MorarApp = { renderHome, fetchListings, money, openReportModal, toggleFav, getFavs };
})();
