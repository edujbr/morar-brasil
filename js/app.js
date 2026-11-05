(function () {
  const M = window.MORAR;
  const LS_KEY = 'imovel_seguro_submissions_v1';

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
      all.unshift(item);
      localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 50)));
    } catch (_) {}
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
    if (String(id).startsWith('local-')) return M.fallbackExamples.find((x) => x.id === id) || null;
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

  function cardHTML(item) {
    const t = typeMeta(item.property_type);
    const isEx = item.is_example || item.status === 'exemplo';
    const verified = isVerified(item);
    const place = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const extra = [
      item.bedrooms != null ? item.bedrooms + ' quartos' : null,
      item.area_m2 != null ? Number(item.area_m2).toLocaleString('pt-BR') + ' m²' : null
    ].filter(Boolean).join(' · ');
    return `
      <a class="card listing" href="imovel.html?id=${encodeURIComponent(item.id)}">
        <div class="listing-photo ${item.property_type || ''}">
          ${isEx ? '<span class="tag-exemplo">EXEMPLO</span>' : ''}
          ${verified ? '<span class="tag-verificado">✓ Verificado</span>' : ''}
          ${item.featured ? '<span class="tag-verificado" style="top:68px;background:#eff4ff;color:#175cd3">★ Destaque</span>' : ''}
          ${item.advertiser_kind === 'pj' ? '<span class="tag" style="position:absolute;right:12px;bottom:44px;background:rgba(0,0,0,.35)">PJ</span>' : ''}
          <span class="emoji">${t.emoji}</span>
          <span class="tag">${purposeLabel(item.purpose)} · ${t.label}</span>
        </div>
        <div class="listing-body">
          <h3>${escapeHtml(item.title)}</h3>
          <div class="meta">${escapeHtml(place)}${extra ? ' · ' + escapeHtml(extra) : ''}</div>
          <div class="price">${money(item.price, item.purpose)}</div>
        </div>
      </a>`;
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
    const view = document.querySelector('[data-view].active')?.getAttribute('data-view') || 'grid';

    if (grid) grid.innerHTML = '<div class="empty">Carregando imóveis…</div>';
    const all = await getListings();
    const filtered = filterList(all, { city: parsed.city, purpose, type, q, verified: verifiedOnly });
    if (countEl) {
      const where = parsed.city ? (' em ' + parsed.city) : ' no Brasil';
      countEl.textContent = filtered.length + (filtered.length === 1 ? ' imóvel' : ' imóveis') + where;
    }

    if (view === 'map') {
      if (grid) grid.style.display = 'none';
      if (mapWrap) {
        mapWrap.style.display = 'block';
        if (!filtered.length) {
          mapWrap.innerHTML = '<div class="empty">Nenhum imóvel para mostrar no mapa.</div>';
        } else {
          mapWrap.innerHTML = '<div id="listings-map" class="map map-lg"></div><p class="help" style="margin-top:8px">📍 Pin aproximado (centro da cidade ou coordenada do anúncio). Confirme o endereço presencialmente.</p>';
          window.MorarMap.render('listings-map', filtered, { zoom: 4 });
        }
      }
      return;
    }

    if (mapWrap) mapWrap.style.display = 'none';
    if (grid) {
      grid.style.display = '';
      if (!filtered.length) {
        grid.innerHTML = '<div class="empty">Nenhum imóvel com esses filtros.<br>Que tal <a href="anunciar.html"><strong>anunciar o seu grátis</strong></a>?</div>';
      } else {
        grid.innerHTML = filtered.map(cardHTML).join('');
      }
    }
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
      const err = document.getElementById('report-err');
      const btn = document.getElementById('report-submit');
      if (ok) ok.style.display = 'none';
      if (err) err.style.display = 'none';
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
        console.warn(ex);
        try {
          const local = JSON.parse(localStorage.getItem('imovel_seguro_reports') || '[]');
          local.unshift({ ...payload, at: new Date().toISOString() });
          localStorage.setItem('imovel_seguro_reports', JSON.stringify(local.slice(0, 30)));
        } catch (_) {}
        if (ok) { ok.style.display = 'block'; ok.textContent = '✅ Denúncia salva neste aparelho. Tente de novo depois se quiser enviar ao servidor.'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar denúncia'; }
      }
    });
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
    document.title = item.title + ' — Imóvel Seguro';

    root.innerHTML = `
      ${isEx ? '<div class="banner">⚠️ Este é um <strong>anúncio de exemplo</strong> para demonstrar o site. Não é um imóvel real.</div>' : ''}
      <div class="banner banner-danger">🛡️ <strong>Anti-golpe:</strong> nunca faça Pix/TED de sinal sem visita e contrato. Desconfie de urgência e de preços muito abaixo do mercado. <a href="anti-golpe.html"><u>Ver checklist</u></a></div>
      <div class="detail">
        <div>
          <div class="detail-photo listing-photo ${item.property_type || ''} card">
            ${isEx ? '<span class="tag-exemplo">EXEMPLO</span>' : ''}
            ${verified ? '<span class="tag-verificado">✓ Anunciante verificado</span>' : ''}
            <span class="emoji" style="font-size:64px;position:absolute;right:18px;top:18px">${t.emoji}</span>
            <span class="tag">${purposeLabel(item.purpose)} · ${t.label}</span>
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <h2 style="margin:0 0 8px;font-size:1.1rem">Descrição</h2>
            <p style="margin:0;color:var(--muted)">${escapeHtml(item.description)}</p>
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px">
              <h2 style="margin:0;font-size:1.1rem">Localização</h2>
              <span class="help">Pin aproximado · confirme no local</span>
            </div>
            <div id="detail-map" class="map"></div>
            <p class="meta" style="margin:10px 0 0">${escapeHtml(item.address_text || place || item.city)}</p>
          </div>
        </div>
        <aside class="card detail-side">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
            <div class="note-pill">${escapeHtml(place || item.city)}</div>
            ${verified
              ? '<span class="verified-pill">✓ Anunciante verificado</span>'
              : '<span class="unverified-pill">⚠ Ainda não verificado</span>'}
          </div>
          <h1>${escapeHtml(item.title)}</h1>
          <div class="price" style="font-size:1.6rem">${money(item.price, item.purpose)}</div>
          <div class="kv">
            <div><span>Finalidade</span><strong>${purposeLabel(item.purpose)}</strong></div>
            <div><span>Tipo</span><strong>${t.emoji} ${t.label}</strong></div>
            ${item.bedrooms != null ? `<div><span>Quartos</span><strong>${item.bedrooms}</strong></div>` : ''}
            ${item.area_m2 != null ? `<div><span>Área</span><strong>${Number(item.area_m2).toLocaleString('pt-BR')} m²</strong></div>` : ''}
            <div><span>Cidade</span><strong>${escapeHtml(item.city)}</strong></div>
          </div>
          ${item.advertiser_kind === 'pj' && item.agency_slug
            ? `<a class="btn btn-ghost btn-block" href="imobiliaria.html?slug=${encodeURIComponent(item.agency_slug)}">🏢 Ver página da imobiliária</a>`
            : ''}
          ${isEx
            ? '<button class="btn btn-ghost btn-block" disabled>Contato desativado (exemplo)</button>'
            : `<a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(item.whatsapp, msg)}">💬 Falar no WhatsApp</a>
               <p class="help" style="margin-top:10px;text-align:center">${item.advertiser_kind === 'pj' ? 'Imobiliária' : 'Anunciante'}: ${escapeHtml(item.agency_name || item.owner_name)}</p>`}
          ${item.purpose === 'alugar' ? `<a class="btn btn-primary btn-block" style="margin-top:10px" href="contrato.html?id=${encodeURIComponent(item.id)}">📄 Gerar contrato de aluguel</a>` : ''}
          <a class="btn btn-ghost btn-block" style="margin-top:10px" href="verificar.html">🔐 Como verificar CPF/CNPJ</a>
          <button type="button" class="btn btn-ghost btn-block" style="margin-top:10px;border-color:var(--danger);color:var(--danger)" id="btn-report">🚩 Denunciar anúncio</button>
          <a class="btn btn-ghost btn-block" style="margin-top:10px" href="index.html">← Voltar</a>
        </aside>
      </div>`;

    window.MorarMap.render('detail-map', item, { zoom: 13 });
    document.getElementById('btn-report')?.addEventListener('click', () => openReportModal(item));
  }

  async function wireAnnounceForm() {
    const form = document.getElementById('announce-form');
    if (!form) return;
    const ok = document.getElementById('ok-box');
    const err = document.getElementById('err-box');
    const btn = document.getElementById('announce-btn');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none'; ok.style.display = 'none';
      btn.disabled = true; btn.textContent = 'Enviando…';
      const fd = new FormData(form);
      const photosRaw = String(fd.get('photo_urls') || '').trim();
      const photo_urls = photosRaw ? photosRaw.split(/\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 8) : [];
      const cityParsed = parseCityInput(fd.get('city'));
      const lat = fd.get('lat') ? Number(fd.get('lat')) : null;
      const lng = fd.get('lng') ? Number(fd.get('lng')) : null;
      const wantVerify = fd.get('want_verify') === 'on';
      const advertiserKind = String(fd.get('advertiser_kind') || 'pf');
      const agencyName = String(fd.get('agency_name') || '').trim();
      const agencySlug = advertiserKind === 'pj'
        ? (String(fd.get('agency_slug') || '').trim() || slugify(agencyName))
        : null;

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
        photo_urls,
        area_m2: fd.get('area_m2') ? Number(fd.get('area_m2')) : null,
        bedrooms: fd.get('bedrooms') ? Number(fd.get('bedrooms')) : null,
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
        status: 'pendente',
        is_example: false,
        source: 'site'
      };

      // Best-effort: create / upsert agency row for PJ (limit enforced later by ops)
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
        } catch (agencyErr) { console.warn('agency upsert', agencyErr); }
      }

      saveLocal({ ...payload, id: 'local-pending-' + Date.now(), created_at: new Date().toISOString(),
        _doc_stub: String(fd.get('doc_number') || ''), _doc_type: String(fd.get('doc_type') || '') });

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
        fillTypeSelects();
        wireCityAutocomplete();
        ok.style.display = 'block';
        ok.innerHTML = wantVerify
          ? '✅ Anúncio recebido (pendente) e <strong>verificação de documento</strong> solicitada (fluxo em construção — não validamos CPF/CNPJ de verdade ainda).'
          : '✅ Anúncio recebido! Fica em análise e só aparece depois de aprovado.';
      } catch (ex) {
        console.warn(ex);
        ok.style.display = 'block';
        ok.innerHTML = '✅ Salvamos neste aparelho. A sync com o servidor falhou agora.';
        err.style.display = 'block';
        err.textContent = 'Não foi possível gravar no servidor neste momento.';
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
      document.querySelectorAll('[data-chip]').forEach((c) => c.classList.remove('active'));
      renderHome();
    });
  }

  async function wireContractPage() {
    const form = document.getElementById('contract-form');
    const out = document.getElementById('contract-out');
    if (!form || !out) return;
    const id = qs('id');
    let listing = id ? await fetchOne(id) : null;
    if (listing) {
      const info = document.getElementById('contract-listing-info');
      if (info) info.innerHTML = `Baseado no anúncio: <strong>${escapeHtml(listing.title)}</strong> · ${escapeHtml(listing.city)} · ${money(listing.price, listing.purpose)}`;
      if (listing.purpose === 'alugar' && form.rent && !form.rent.value) form.rent.value = listing.price;
      if (form.address && !form.address.value) form.address.value = listing.address_text || [listing.neighborhood, listing.city].filter(Boolean).join(', ');
      if (form.city && !form.city.value) form.city.value = listing.city;
    }
    const unlocked = sessionStorage.getItem('imovel_seguro_contract_unlock') === '1';
    const paint = () => {
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      window.MorarContract.renderPreview('contract-out', data, listing, unlocked || sessionStorage.getItem('imovel_seguro_contract_unlock') === '1');
    };
    form.addEventListener('input', paint);
    form.addEventListener('submit', (e) => { e.preventDefault(); paint(); });
    paint();
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
      console.warn('agencies fallback', e);
      return M.exampleAgencies || [];
    }
  }

  async function fetchAgencyBySlug(slug) {
    if (!slug) return null;
    const all = await fetchAgencies();
    return all.find((a) => a.slug === slug) || null;
  }

  function slugify(s) {
    return String(s || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'imobiliaria';
  }

  async function renderAgencyPage() {
    const root = document.getElementById('agency');
    if (!root) return;
    const slug = qs('slug') || qs('id');
    root.innerHTML = '<div class="empty">Carregando imobiliária…</div>';
    const agency = await fetchAgencyBySlug(slug);
    if (!agency) {
      root.innerHTML = '<div class="empty">Imobiliária não encontrada. <a href="index.html">Voltar</a></div>';
      return;
    }
    const all = await getListings();
    const listings = all.filter((l) => l.agency_slug === agency.slug || (l.advertiser_kind === 'pj' && norm(l.agency_name) === norm(agency.name)));
    const verified = agency.verified || agency.verification_status === 'verificado';
    const plan = (M.plans && M.plans[agency.plan]) || { label: agency.plan || 'PJ', limit: agency.listing_limit || 5 };
    const isEx = agency.is_example;
    document.title = agency.name + ' — Imóvel Seguro';
    root.innerHTML = `
      ${isEx ? '<div class="banner">⚠️ Página de <strong>exemplo</strong> de imobiliária (PJ).</div>' : ''}
      <div class="banner banner-safe">🏢 Página pública da imobiliária · plano <strong>${escapeHtml(plan.label || agency.plan)}</strong> (até ${plan.limit || agency.listing_limit || 5} anúncios no grátis)</div>
      <section class="page-hero" style="padding-bottom:8px">
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          ${verified ? '<span class="verified-pill">✓ Imobiliária verificada</span>' : '<span class="unverified-pill">⚠ Ainda não verificada</span>'}
          <span class="note-pill">PJ · ${escapeHtml(agency.city || 'Brasil')}</span>
        </div>
        <h1>${escapeHtml(agency.name)}</h1>
        <p>${escapeHtml(agency.description || 'Imobiliária no Imóvel Seguro.')}</p>
        <p class="help" style="margin-top:8px">CNPJ: ${escapeHtml(agency.cnpj || '—')} · WhatsApp: ${escapeHtml(agency.whatsapp || '—')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
          ${agency.whatsapp ? `<a class="btn btn-wa" style="width:auto" target="_blank" rel="noopener" href="${waLink(agency.whatsapp, 'Olá! Vi a página da ' + agency.name + ' no Imóvel Seguro.')}">💬 WhatsApp</a>` : ''}
          <a class="btn btn-ghost" href="verificar.html">Como verificar CNPJ</a>
          <a class="btn btn-ghost" href="precos.html">Planos PJ</a>
        </div>
      </section>
      <section class="section">
        <div class="section-head">
          <div>
            <h2>Anúncios da imobiliária</h2>
            <p>${listings.length} de até ${plan.limit || agency.listing_limit || 5} no plano atual</p>
          </div>
        </div>
        <div class="grid" id="agency-listings">${listings.length ? listings.map(cardHTML).join('') : '<div class="empty">Nenhum anúncio publicado ainda.</div>'}</div>
      </section>`;
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

  document.addEventListener('DOMContentLoaded', () => {
    fillTypeSelects();
    setActiveNav();
    wireCityAutocomplete();
    wireHomeFilters();
    wireAnnounceForm();
    wireReportModal();
    wireContractPage();
    wireAdvertiserKindToggle();
    if (document.getElementById('listings') || document.getElementById('map-view')) renderHome();
    if (document.getElementById('detail')) renderDetail();
    if (document.getElementById('agency')) renderAgencyPage();
  });

  window.MorarApp = { renderHome, fetchListings, money, openReportModal, renderAgencyPage, fetchAgencies };
})();
