(function () {
  const M = window.MORAR;
  const LS_KEY = 'morar_brasil_submissions_v1';

  function money(v, purpose) {
    const n = Number(v) || 0;
    const formatted = n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    return purpose === 'alugar' ? formatted + '<small>/mês</small>' : formatted;
  }

  function typeMeta(id) {
    return M.types.find((t) => t.id === id) || { id, label: id, emoji: '📍' };
  }

  function purposeLabel(p) {
    return p === 'alugar' ? 'Aluguel' : 'Venda';
  }

  function waLink(phone, text) {
    const digits = String(phone || '').replace(/\D/g, '');
    const withCountry = digits.startsWith('55') ? digits : '55' + digits;
    return 'https://wa.me/' + withCountry + '?text=' + encodeURIComponent(text || '');
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

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

  function localSubs() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
  }

  function saveLocal(item) {
    const all = localSubs();
    all.unshift(item);
    localStorage.setItem(LS_KEY, JSON.stringify(all.slice(0, 50)));
  }

  async function fetchListings() {
    try {
      const url = M.supabaseUrl + '/rest/v1/imoveis_listings?select=*&order=created_at.desc';
      const res = await fetch(url, {
        headers: {
          apikey: M.supabaseAnon,
          Authorization: 'Bearer ' + M.supabaseAnon
        }
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
      return M.fallbackExamples.find((x) => x.id === id) || null;
    }
    try {
      const url = M.supabaseUrl + '/rest/v1/imoveis_listings?id=eq.' + encodeURIComponent(id) + '&select=*';
      const res = await fetch(url, {
        headers: {
          apikey: M.supabaseAnon,
          Authorization: 'Bearer ' + M.supabaseAnon
        }
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
    const place = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const extra = [
      item.bedrooms != null ? item.bedrooms + ' quartos' : null,
      item.area_m2 != null ? Number(item.area_m2).toLocaleString('pt-BR') + ' m²' : null
    ].filter(Boolean).join(' · ');
    return `
      <a class="card listing" href="imovel.html?id=${encodeURIComponent(item.id)}">
        <div class="listing-photo ${item.property_type || ''}">
          ${isEx ? '<span class="tag-exemplo">EXEMPLO</span>' : ''}
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

  function cityList() {
    return Array.isArray(window.MORAR_CITIES) ? window.MORAR_CITIES : [];
  }

  function wireCityAutocomplete() {
    document.querySelectorAll('[data-city-input]').forEach((input) => {
      const listId = input.getAttribute('list') || (input.id + '-list');
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
        const cities = cityList();
        let matches;
        if (!q) {
          // Show spotlight + featured first when empty
          const spot = (M.spotlight || []).slice(0, 12);
          matches = spot.map((label) => {
            const p = parseCityInput(label);
            return { label, city: p.city, uf: p.uf };
          });
        } else {
          matches = cities.filter((c) => norm(c.label).includes(q) || norm(c.city).includes(q)).slice(0, 40);
        }
        datalist.innerHTML = matches.map((c) => `<option value="${escapeHtml(c.label)}"></option>`).join('');
      };

      input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 80);
      });
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
      if (filters.q) {
        const blob = norm(item.title + ' ' + (item.description || '') + ' ' + (item.neighborhood || '') + ' ' + item.city);
        if (!blob.includes(norm(filters.q))) return false;
      }
      return true;
    });
  }

  async function renderHome() {
    const grid = document.getElementById('listings');
    const countEl = document.getElementById('listings-count');
    if (!grid) return;

    const cityRaw = document.getElementById('f-city')?.value || '';
    const parsed = parseCityInput(cityRaw);
    const purpose = document.getElementById('f-purpose')?.value || '';
    const type = document.getElementById('f-type')?.value || '';
    const q = document.getElementById('f-q')?.value || '';

    grid.innerHTML = '<div class="empty">Carregando imóveis…</div>';
    const all = await fetchListings();
    const filtered = filterList(all, { city: parsed.city, purpose, type, q });
    if (countEl) {
      const where = parsed.city ? (' em ' + parsed.city) : ' no Brasil';
      countEl.textContent = filtered.length + (filtered.length === 1 ? ' imóvel' : ' imóveis') + where;
    }
    if (!filtered.length) {
      grid.innerHTML = '<div class="empty">Nenhum imóvel com esses filtros.<br>Que tal <a href="anunciar.html"><strong>anunciar o seu grátis</strong></a>?</div>';
      return;
    }
    grid.innerHTML = filtered.map(cardHTML).join('');
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
    const place = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const msg = `Olá! Vi o anúncio "${item.title}" no Morar Brasil e tenho interesse.`;
    document.title = item.title + ' — Morar Brasil';

    root.innerHTML = `
      ${isEx ? '<div class="banner">⚠️ Este é um <strong>anúncio de exemplo</strong> para demonstrar o site. Não é um imóvel real à venda ou para alugar.</div>' : ''}
      <div class="detail">
        <div>
          <div class="detail-photo listing-photo ${item.property_type || ''} card">
            ${isEx ? '<span class="tag-exemplo">EXEMPLO</span>' : ''}
            <span class="emoji" style="font-size:64px;position:absolute;right:18px;top:18px">${t.emoji}</span>
            <span class="tag">${purposeLabel(item.purpose)} · ${t.label}</span>
          </div>
          <div class="card panel" style="margin-top:14px;padding:18px">
            <h2 style="margin:0 0 8px;font-size:1.1rem">Descrição</h2>
            <p style="margin:0;color:var(--muted)">${escapeHtml(item.description)}</p>
          </div>
        </div>
        <aside class="card detail-side">
          <div class="note-pill">${escapeHtml(place || item.city)}</div>
          <h1>${escapeHtml(item.title)}</h1>
          <div class="price" style="font-size:1.6rem">${money(item.price, item.purpose)}</div>
          <div class="kv">
            <div><span>Finalidade</span><strong>${purposeLabel(item.purpose)}</strong></div>
            <div><span>Tipo</span><strong>${t.emoji} ${t.label}</strong></div>
            ${item.bedrooms != null ? `<div><span>Quartos</span><strong>${item.bedrooms}</strong></div>` : ''}
            ${item.area_m2 != null ? `<div><span>Área</span><strong>${Number(item.area_m2).toLocaleString('pt-BR')} m²</strong></div>` : ''}
            <div><span>Cidade</span><strong>${escapeHtml(item.city)}</strong></div>
          </div>
          ${isEx
            ? '<button class="btn btn-ghost btn-block" disabled>Contato desativado (exemplo)</button><p class="help" style="margin-top:10px;text-align:center">Anúncios reais terão botão de WhatsApp do anunciante.</p>'
            : `<a class="btn btn-wa" target="_blank" rel="noopener" href="${waLink(item.whatsapp, msg)}">💬 Falar no WhatsApp</a>
               <p class="help" style="margin-top:10px;text-align:center">Anunciante: ${escapeHtml(item.owner_name)}</p>`}
          <a class="btn btn-ghost btn-block" style="margin-top:10px" href="index.html">← Voltar aos imóveis</a>
        </aside>
      </div>`;
  }

  async function wireAnnounceForm() {
    const form = document.getElementById('announce-form');
    if (!form) return;
    const ok = document.getElementById('ok-box');
    const err = document.getElementById('err-box');
    const btn = document.getElementById('announce-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      ok.style.display = 'none';
      btn.disabled = true;
      btn.textContent = 'Enviando…';

      const fd = new FormData(form);
      const photosRaw = String(fd.get('photo_urls') || '').trim();
      const photo_urls = photosRaw
        ? photosRaw.split(/\n|,/).map((s) => s.trim()).filter(Boolean).slice(0, 8)
        : [];
      const cityParsed = parseCityInput(fd.get('city'));

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
        status: 'pendente',
        is_example: false,
        source: 'site'
      };

      const localCopy = { ...payload, id: 'local-pending-' + Date.now(), created_at: new Date().toISOString() };
      saveLocal(localCopy);

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
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || ('HTTP ' + res.status));
        }
        form.reset();
        fillTypeSelects();
        wireCityAutocomplete();
        ok.style.display = 'block';
        ok.innerHTML = '✅ Anúncio recebido! Ele fica em <strong>análise</strong> e só aparece no site depois de aprovado. Guardamos também uma cópia neste aparelho.';
      } catch (ex) {
        console.warn(ex);
        ok.style.display = 'block';
        ok.innerHTML = '✅ Salvamos seu anúncio neste aparelho. A sincronização com o servidor falhou agora — tente de novo mais tarde.';
        err.style.display = 'block';
        err.textContent = 'Detalhe: não foi possível gravar no servidor neste momento.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Publicar anúncio grátis';
      }
    });
  }

  function wireHomeFilters() {
    const form = document.getElementById('search-form');
    if (!form) return;
    form.addEventListener('submit', (e) => { e.preventDefault(); renderHome(); });

    document.querySelectorAll('[data-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const purpose = chip.getAttribute('data-purpose') || '';
        const type = chip.getAttribute('data-type') || '';
        const city = chip.getAttribute('data-city') || '';
        const purposeEl = document.getElementById('f-purpose');
        const typeEl = document.getElementById('f-type');
        const cityEl = document.getElementById('f-city');
        if (purposeEl && chip.hasAttribute('data-purpose')) purposeEl.value = purpose;
        if (typeEl && chip.hasAttribute('data-type')) typeEl.value = type;
        if (cityEl && city) cityEl.value = city;
        document.querySelectorAll('[data-chip]').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        renderHome();
      });
    });

    document.getElementById('f-clear')?.addEventListener('click', () => {
      const cityEl = document.getElementById('f-city');
      const purposeEl = document.getElementById('f-purpose');
      const typeEl = document.getElementById('f-type');
      const qEl = document.getElementById('f-q');
      if (cityEl) cityEl.value = '';
      if (purposeEl) purposeEl.value = '';
      if (typeEl) typeEl.value = '';
      if (qEl) qEl.value = '';
      document.querySelectorAll('[data-chip]').forEach((c) => c.classList.remove('active'));
      renderHome();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillTypeSelects();
    setActiveNav();
    wireCityAutocomplete();
    wireHomeFilters();
    wireAnnounceForm();
    if (document.getElementById('listings')) renderHome();
    if (document.getElementById('detail')) renderDetail();
  });

  window.MorarApp = { renderHome, fetchListings, money, waLink, parseCityInput };
})();
