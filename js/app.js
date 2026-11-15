/* Hak Cipta © 2026 Arraihan Academy. Seluruh hak dilindungi. Lihat LICENSE. */
const $ = s => document.querySelector(s), view = $('#view');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const tgl = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'short', day:'numeric', month:'short', year:'numeric'}) : '';
const me = () => { try { return JSON.parse(sessionStorage.getItem('simas_u')); } catch (e) { return null; } };
const has = (...r) => (me() ? me().peran : []).some(x => r.includes(x));
function toast(m, bad){ const t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' bad' : ''); setTimeout(() => t.className = '', 3500); }
const skel = () => '<div class="grid"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
let pub = null;
async function loadPub(){ if (!pub) { const r = await Api.get('publik.beranda'); if (!r.success) throw new Error(r.message); pub = r.data; } return pub; }

const jadwalRows = l => l.length ? `<div class="wrap"><table class="tbl"><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Petugas</th></tr></thead><tbody>${l.map(j =>
  `<tr><td>${esc(tgl(j.tanggal))}<br><span class="muted">${esc(j.waktu)} WIB</span></td><td><b>${esc(j.jenis)}</b><br><span class="muted">${esc(j.tema)}</span></td>
  <td>${[['Imam',j.imam],['Khatib',j.khatib],['Muadzin',j.muadzin],['Penceramah',j.penceramah]].filter(x => x[1]).map(x => `${x[0]}: ${esc(x[1])}`).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`
  : '<div class="card muted">Belum ada jadwal. Jadwal terbaru akan tampil di sini setelah petugas menerbitkannya.</div>';
const kasCards = k => `<div class="grid"><div class="card key"><div class="muted">Saldo kas terkini</div><div class="num">${rp(k.saldo)}</div></div>
  <div class="card"><div class="muted">Pemasukan bulan ini</div><div class="num in">+ ${rp(k.masukBulanIni)}</div></div>
  <div class="card"><div class="muted">Pengeluaran bulan ini</div><div class="num out">− ${rp(k.keluarBulanIni)}</div></div></div>`;

const routes = {
  async beranda(){ const d = await loadPub(); return `<section class="hero"><h1>Selamat datang di Masjid Nurul Falah</h1><p>Jadwal imam, khatib, muadzin, dan penceramah serta laporan kas masjid, terbuka untuk seluruh jamaah.</p><a class="btn" href="#jadwal">Lihat jadwal ibadah</a></section>
    <div class="grid"><div><h2>Jadwal terdekat</h2>${jadwalRows(d.jadwal.slice(0,5))}</div>
    <div><h2>Pengumuman</h2>${d.pengumuman.length ? d.pengumuman.slice(0,4).map(p => `<div class="card ann ${p.penting === 'ya' ? 'pen' : ''}"><b>${esc(p.judul)}</b><div class="muted">${esc(tgl(p.tanggal))}</div><p>${esc(p.isi)}</p></div>`).join('') : '<div class="card muted">Belum ada pengumuman.</div>'}</div></div>
    <h2 style="margin-top:24px">Transparansi kas</h2>${kasCards(d.kas)}`; },
  async jadwal(){ const d = await loadPub(); return `<h1>Jadwal ibadah &amp; kajian</h1>${jadwalRows(d.jadwal)}`; },
  async kas(){ const d = await loadPub(); return `<h1>Transparansi kas masjid</h1><p class="muted">Ringkasan hanya menampilkan total. Rincian transaksi dan nama donatur dikelola bendahara.</p>${kasCards(d.kas)}`; },
  async panel(){ return me() ? panel() : login(); }
};

function login(){
  let tries = 0;
  const t = setInterval(() => {
    if (!(window.google && google.accounts) && ++tries < 25) return;
    clearInterval(t);
    if (!(window.google && google.accounts)) return toast('Layanan Google belum termuat, muat ulang halaman', true);
    google.accounts.id.initialize({client_id: CONFIG.GOOGLE_CLIENT_ID, callback: async r => {
      sessionStorage.setItem('simas_t', r.credential);
      const j = await Api.post('auth.saya');
      if (j.success) { sessionStorage.setItem('simas_u', JSON.stringify(j.data)); render(); }
      else { sessionStorage.removeItem('simas_t'); $('#loginMsg').textContent = j.message; }
    }});
    google.accounts.id.renderButton($('#gbtn'), {theme:'outline', size:'large', text:'signin_with', locale:'id'});
  }, 200);
  return `<div class="card" style="max-width:440px;margin:40px auto;text-align:center"><h1>Masuk pengurus &amp; petugas</h1>
    <p class="muted">Gunakan akun Google yang sudah didaftarkan oleh sekretariat DKM. Jamaah umum tidak perlu masuk.</p>
    <div id="gbtn" style="display:flex;justify-content:center;margin:16px 0"></div><p id="loginMsg" class="err" role="alert"></p></div>`;
}

async function panel(){
  const u = me(); let h = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div><h1>Assalamu'alaikum, ${esc(u.nama)}</h1>
    <span class="muted">${u.peran.map(esc).join(' · ')}</span></div><button class="btn o" data-act="keluar">Keluar</button></div>`;
  if (has('pengurus','petugas_jadwal','petugas_ibadah')) {
    const j = await Api.post('jadwal.daftar'); if (!j.success) return fail(j);
    h += `<h2 style="margin-top:24px">Jadwal</h2>`;
    if (has('pengurus','petugas_jadwal')) h += `<form class="card" id="fJadwal"><div class="row">
      <label>Tanggal<input type="date" name="tanggal" required></label><label>Waktu<input type="time" name="waktu" required></label>
      <label>Jenis<select name="jenis"><option>Sholat Jumat</option><option>Sholat Fardhu</option><option>Kajian Rutin</option><option>Hari Besar</option></select></label></div>
      <div class="row"><label>Imam<input name="imam" maxlength="80"></label><label>Khatib<input name="khatib" maxlength="80"></label><label>Muadzin<input name="muadzin" maxlength="80"></label><label>Penceramah<input name="penceramah" maxlength="80"></label></div>
      <label>Tema<input name="tema" maxlength="150"></label><button class="btn" type="submit">Simpan jadwal</button></form>`;
    h += j.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Tanggal</th><th>Kegiatan</th><th>Status</th><th>Konfirmasi</th></tr></thead><tbody>${j.data.map(x =>
      `<tr><td>${esc(tgl(x.tanggal))} ${esc(x.waktu)}</td><td>${esc(x.jenis)}<br><span class="muted">${esc([x.imam,x.khatib,x.muadzin,x.penceramah].filter(Boolean).join(', '))}</span></td>
      <td><span class="pill ${esc(x.status)}">${esc(x.status)}</span></td><td><button class="btn s" data-act="konf" data-id="${esc(x.id)}" data-s="Hadir">Hadir</button> <button class="btn s o" data-act="konf" data-id="${esc(x.id)}" data-s="Berhalangan">Berhalangan</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada jadwal mendatang.</div>';
  }
  if (has('pengurus','bendahara')) {
    const k = await Api.post('kas.daftar'); if (!k.success) return fail(k);
    h += `<h2 style="margin-top:24px">Kas</h2>`;
    if (has('bendahara')) h += `<form class="card" id="fKas"><div class="row"><label>Tanggal<input type="date" name="tanggal" required></label>
      <label>Jenis<select name="jenis"><option>Masuk</option><option>Keluar</option></select></label><label>Kategori<input name="kategori" required maxlength="60" placeholder="Infaq Jumat, Listrik, …"></label>
      <label>Nominal (Rp)<input type="number" name="nominal" min="1" required></label></div><label>Keterangan<input name="keterangan" maxlength="200"></label>
      <button class="btn" type="submit">Simpan transaksi</button><span class="muted">Pengeluaran di atas Rp 1.000.000 menunggu persetujuan pengurus.</span></form>`;
    h += k.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Tanggal</th><th>Kategori</th><th class="r">Nominal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${k.data.map(x =>
      `<tr><td>${esc(tgl(x.tanggal))}</td><td><span class="pill ${esc(x.jenis)}">${esc(x.jenis)}</span> ${esc(x.kategori)}<br><span class="muted">${esc(x.keterangan)}</span></td>
      <td class="r">${rp(x.nominal)}</td><td><span class="pill ${esc(x.status)}">${esc(x.status)}</span></td><td>${x.status === 'Menunggu' && has('pengurus') ? `<button class="btn s" data-act="putus" data-id="${esc(x.id)}" data-p="Setujui">Setujui</button> <button class="btn s d" data-act="putus" data-id="${esc(x.id)}" data-p="Tolak">Tolak</button>` : ''}
      ${x.status !== 'Dibatalkan' && x.status !== 'Ditolak' ? `<button class="btn s o" data-act="batal" data-id="${esc(x.id)}">Batalkan</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada transaksi.</div>';
  }
  return h;
}
const fail = r => `<div class="card err">${esc(r.message)}</div>`;

async function aksi(action, data, ok){ const r = await Api.post(action, data); if (r.success) { toast(ok); pub = null; render(); } else { toast(r.message, true); if (r.code === 401) render(); } }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  if (a === 'keluar') { sessionStorage.clear(); render(); }
  if (a === 'konf') aksi('jadwal.konfirmasi', {id:b.dataset.id, status:b.dataset.s}, 'Konfirmasi tersimpan');
  if (a === 'putus') aksi('kas.setujui', {id:b.dataset.id, putusan:b.dataset.p}, 'Keputusan tersimpan');
  if (a === 'batal') { const c = prompt('Alasan pembatalan (wajib diisi):'); if (c) aksi('kas.batalkan', {id:b.dataset.id, catatan:c}, 'Transaksi dibatalkan'); }
});
document.addEventListener('submit', e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)); const btn = f.querySelector('button'); btn.disabled = true;
  (f.id === 'fJadwal' ? aksi('jadwal.simpan', d, 'Jadwal tersimpan') : aksi('kas.simpan', d, 'Transaksi tersimpan')).finally(() => btn.disabled = false);
});

async function render(){
  const name = (location.hash.slice(1) || 'beranda'), fn = routes[name] || routes.beranda;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + name));
  $('#navPanel').textContent = me() ? 'Panel Staf' : 'Masuk Staf';
  view.innerHTML = skel();
  try { view.innerHTML = await fn(); } catch (err) { view.innerHTML = '<div class="card err">Gagal memuat data. Periksa koneksi lalu muat ulang halaman.</div>'; }
}
window.addEventListener('hashchange', render);
const gis = document.createElement('script'); gis.src = 'https://accounts.google.com/gsi/client'; gis.async = true; document.head.appendChild(gis);
render();
