window.MorarAuth = (function () {
  const KEY = 'imovel_seguro_account_v1';

  function get() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  }
  function set(acc) {
    localStorage.setItem(KEY, JSON.stringify(acc));
    return acc;
  }
  function clear() { localStorage.removeItem(KEY); }
  function normalizeUsername(u) {
    return String(u || '')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase().replace(/[^a-z0-9._]/g, '').replace(/^\.+|\.+$/g, '').slice(0, 24);
  }
  function isLogged() { return !!(get() && get().username); }

  async function register({ username, display_name, whatsapp, advertiser_kind }, M) {
    const u = normalizeUsername(username);
    if (u.length < 3) throw new Error('Escolha um usuário com pelo menos 3 letras.');
    const payload = {
      username: u,
      display_name: String(display_name || u).trim(),
      whatsapp: String(whatsapp || '').trim() || null,
      advertiser_kind: advertiser_kind === 'pj' ? 'pj' : 'pf',
      source: 'site'
    };
    try {
      const res = await fetch(M.supabaseUrl + '/rest/v1/imoveis_accounts', {
        method: 'POST',
        headers: {
          apikey: M.supabaseAnon,
          Authorization: 'Bearer ' + M.supabaseAnon,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 409 || res.status === 23505) throw new Error('Esse usuário já existe. Escolha outro.');
      if (!res.ok) {
        // unique violation text
        const t = await res.text();
        if (/duplicate|unique/i.test(t)) throw new Error('Esse usuário já existe. Escolha outro.');
        // still save locally so demo works
        console.warn('account remote fail', t);
      } else {
        const rows = await res.json();
        if (rows && rows[0]) return set(rows[0]);
      }
    } catch (e) {
      if (e.message && e.message.includes('usuário')) throw e;
      console.warn(e);
    }
    return set({ id: 'local-' + Date.now(), ...payload, created_at: new Date().toISOString() });
  }

  function wireHeader() {
    const slot = document.getElementById('auth-slot');
    if (!slot) return;
    const acc = get();
    if (acc && acc.username) {
      slot.innerHTML = '<a class="btn btn-ghost btn-sm" href="conta.html">👤 @' + acc.username + '</a>';
    } else {
      slot.innerHTML = '<a class="btn btn-ghost btn-sm" href="conta.html">Entrar / criar conta</a>';
    }
  }

  return { get, set, clear, register, isLogged, normalizeUsername, wireHeader };
})();
