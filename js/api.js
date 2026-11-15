/* Hak Cipta © 2026 Arraihan Academy. Seluruh hak dilindungi. Lihat LICENSE. */
// Komunikasi ke Google Apps Script. POST wajib text/plain agar tidak memicu preflight CORS.
const Api = {
  async get(action){
    const r = await fetch(CONFIG.GAS_URL + '?action=' + encodeURIComponent(action));
    return r.json();
  },
  async post(action, data){
    const r = await fetch(CONFIG.GAS_URL, {
      method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
      body: JSON.stringify({action, token: sessionStorage.getItem('simas_t'), data: data || {}})
    });
    const j = await r.json();
    if (j.code === 401) { sessionStorage.removeItem('simas_t'); sessionStorage.removeItem('simas_u'); }
    return j;
  }
};
