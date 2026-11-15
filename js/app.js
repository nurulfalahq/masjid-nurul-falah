/* Hak Cipta © 2026 Arraihan Academy. Seluruh hak dilindungi. Lihat LICENSE. */
const $ = s => document.querySelector(s), view = $('#view');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const tgl = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', {weekday:'short', day:'numeric', month:'short', year:'numeric'}) : '';
const me = () => { try { return JSON.parse(sessionStorage.getItem('simas_u')); } catch (e) { return null; } };
const has = (...r) => (me() ? me().peran : []).some(x => r.includes(x));
function toast(m, bad){ const t = $('#toast'); t.textContent = m; t.className = 'show' + (bad ? ' bad' : ''); setTimeout(() => t.className = '', 3500); }
const skel = () => '<div class="grid"><div class="skel"></div><div class="skel"></div><div class="skel"></div></div>';
const img = id => /^[\w-]{10,}$/.test(id || '') ? 'https://lh3.googleusercontent.com/d/' + id : '';
let tab = sessionStorage.getItem('tab');
function tabs(){ const t = [];
  if (has('pengurus','petugas_jadwal','petugas_ibadah')) t.push(['jadwal','Jadwal']);
  if (has('pengurus','bendahara')) t.push(['kas','Kas']);
  if (has('pengurus','petugas_jadwal')) t.push(['petugas','Petugas'], ['agenda','Agenda'], ['pengumuman','Pengumuman']);
  if (has('pengurus')) t.push(['pengguna','Pengguna'], ['pengaturan','Pengaturan']);
  return t; }
function compress(file){ return new Promise((ok,no) => { const im = new Image(); im.onload = () => {
  const sc = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * sc; c.height = im.height * sc;
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .8).split(',')[1]); }; im.onerror = no; im.src = URL.createObjectURL(file); }); }
function brand(d){ const s = d.pengaturan || {}; if (img(s.logo_id)) $('.logo').innerHTML = `<img src="${img(s.logo_id)}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`; }
const fmt = n => [Math.floor(n/3600), Math.floor(n%3600/60), n%60].map(x => String(x).padStart(2,'0')).join(':');
const hh = h => { const m = Math.round(h*60); return String(Math.floor(m/60)%24).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'); };
function sholat(dt, lat, lon, tz){ // metode Kemenag RI: Subuh 20°, Isya 18°, Ashar mazhab Syafi'i, ihtiyat +2 menit
  const r = Math.PI/180, S = x => Math.sin(x*r), C = x => Math.cos(x*r), T = x => Math.tan(x*r);
  const aS = x => Math.asin(x)/r, aC = x => Math.acos(x)/r, a2 = (y,x) => Math.atan2(y,x)/r, cot = x => Math.atan(1/x)/r, fx = (a,b) => a - b*Math.floor(a/b);
  const D = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())/864e5 + 2440587.5 - lon/360 - 2451545;
  const g = fx(357.529 + 0.98560028*D, 360), q = fx(280.459 + 0.98564736*D, 360), L = fx(q + 1.915*S(g) + 0.020*S(2*g), 360), e = 23.439 - 3.6e-7*D;
  const eqt = q/15 - fx(a2(C(e)*S(L), C(L))/15, 24), dec = aS(S(e)*S(L)), dz = 12 + tz - lon/15 - eqt, ih = 2/60;
  const t = a => aC((-S(a) - S(dec)*S(lat)) / (C(dec)*C(lat))) / 15, as = -cot(1 + T(Math.abs(lat - dec)));
  return {subuh:dz - t(20) + ih, terbit:dz - t(0.833), dzuhur:dz + ih, ashar:dz + t(as) + ih, maghrib:dz + t(0.833) + ih, isya:dz + t(18) + ih};
}
let timer;
function papan(c){
  const lat = parseFloat((c||{}).lat) || -6.2088, lon = parseFloat((c||{}).lon) || 106.8456, tz = parseFloat((c||{}).zona) || 7;
  const nd = new Date(Date.now() + tz*36e5), tt = sholat(nd, lat, lon, tz), now = nd.getUTCHours() + nd.getUTCMinutes()/60 + nd.getUTCSeconds()/3600;
  const list = [['Subuh',tt.subuh],['Terbit',tt.terbit],['Dzuhur',tt.dzuhur],['Ashar',tt.ashar],['Maghrib',tt.maghrib],['Isya',tt.isya]];
  const ix = list.findIndex(x => x[1] > now), nx = ix < 0 ? 0 : ix; let left = Math.round((list[nx][1] - now + (ix < 0 ? 24 : 0))*3600);
  clearInterval(timer);
  timer = setInterval(() => { const el = $('#cd'); if (!el) return clearInterval(timer); if (--left < 0) return render(); el.textContent = fmt(left); }, 1000);
  return `<div class="sh">${list.map((x,i) => `<div class="sc ${i === nx ? 'nx' : ''}"><b>${x[0]}</b><div class="num">${hh(x[1])}</div>${i === nx ? `<span class="pill Menunggu">Berikutnya</span><div class="num" id="cd">${fmt(left)}</div>` : ''}</div>`).join('')}</div><p class="muted">Perhitungan metode Kemenag RI sesuai koordinat masjid.</p>`;
}
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
  async beranda(){ const d = await loadPub(); return `<section class="hero" ${img((d.pengaturan||{}).foto_masjid_id) ? `style="background:linear-gradient(135deg,#063d27ee,#0b5d3bcc),url(${img(d.pengaturan.foto_masjid_id)}) center/cover"` : ''}><h1>Selamat datang di ${esc((d.pengaturan||{}).nama || 'Masjid Nurul Falah')}</h1><p>Jadwal imam, khatib, muadzin, dan penceramah serta laporan kas masjid, terbuka untuk seluruh jamaah.</p><a class="btn" href="#jadwal">Lihat jadwal ibadah</a></section><h2>Waktu sholat hari ini</h2>${papan(d.pengaturan)}<div style="height:20px"></div>
    <div class="grid"><div><h2>Jadwal terdekat</h2>${jadwalRows(d.jadwal.slice(0,5))}</div>
    <div><h2>Pengumuman</h2>${d.pengumuman.length ? d.pengumuman.slice(0,4).map(p => `<div class="card ann ${p.penting === 'ya' ? 'pen' : ''}"><b>${esc(p.judul)}</b><div class="muted">${esc(tgl(p.tanggal))}</div><p>${esc(p.isi)}</p></div>`).join('') : '<div class="card muted">Belum ada pengumuman.</div>'}</div></div>
    <h2 style="margin-top:24px">Transparansi kas</h2>${kasCards(d.kas)}`; },
  async jadwal(){ const d = await loadPub(); return `<h1>Jadwal ibadah &amp; kajian</h1>${papan(d.pengaturan)}<h2 style="margin-top:20px">Jadwal petugas</h2>${jadwalRows(d.jadwal)}`; },
  async kas(){ const d = await loadPub(); return `<h1>Transparansi kas masjid</h1><p class="muted">Ringkasan hanya menampilkan total. Rincian transaksi dan nama donatur dikelola bendahara.</p>${kasCards(d.kas)}`; },
  async khutbah(){ const d = await loadPub(), l = d.jadwal.filter(j => j.jenis === 'Sholat Jumat'), f = l[0], ft = n => (d.foto && d.foto[n]) ? img(d.foto[n]) : '';
    return `<h1>Khutbah Jumat</h1>` + (f ? `<section class="hero" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">${ft(f.khatib) ? `<img class="av" src="${ft(f.khatib)}" alt="Foto khatib">` : ''}<div><span class="pill Menunggu">${esc(tgl(f.tanggal))} · ${esc(f.waktu)} WIB</span><h2 style="margin-top:8px">${esc(f.tema || 'Tema akan diumumkan')}</h2><p>Khatib: ${esc(f.khatib)}<br>Imam: ${esc(f.imam)}<br>Muadzin: ${esc(f.muadzin)}</p></div></section><h2>Jadwal berikutnya</h2>${jadwalRows(l.slice(1))}` : '<div class="card muted">Belum ada jadwal sholat Jumat.</div>'); },
  async agenda(){ const d = await loadPub();
    return `<h1>Agenda kegiatan</h1>` + (d.agenda && d.agenda.length ? `<div class="grid">${d.agenda.map(a => `<div class="card"><span class="pill Menunggu">${esc(tgl(a.tanggal))}${a.tanggal_selesai && a.tanggal_selesai !== a.tanggal ? ' – ' + esc(tgl(a.tanggal_selesai)) : ''}</span><h2 style="margin-top:8px">${esc(a.judul)}</h2><p class="muted">${esc(a.lokasi)}${a.pic ? ' · PIC: ' + esc(a.pic) : ''}</p><p>${esc(a.deskripsi)}</p></div>`).join('')}</div>` : '<div class="card muted">Belum ada agenda mendatang.</div>'); },
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
  const T = tabs(); if (!T.some(x => x[0] === tab)) tab = T.length ? T[0][0] : '';
  if (tab === 'jadwal' && has('pengurus','petugas_jadwal','petugas_ibadah')) {
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
  if (tab === 'kas' && has('pengurus','bendahara')) {
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
  const H = t => `<h2 style="margin-top:24px">${t}</h2>`;
  if (tab === 'petugas') { const r = await Api.post('petugas.daftar'); if (!r.success) return fail(r);
    h += H('Petugas &amp; foto') + `<form class="card" id="fPetugas"><div class="row"><label>Nama (sama persis dengan di jadwal)<input name="nama" required maxlength="80"></label><label>Kategori<select name="kategori"><option>Imam</option><option>Khatib</option><option>Muadzin</option><option>Penceramah</option></select></label></div><button class="btn" type="submit">Tambah petugas</button></form>
      <div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Foto</th><th>Nama</th><th>Kategori</th><th>Ganti foto</th></tr></thead><tbody>${r.data.map(x => `<tr><td>${img(x.foto_id) ? `<img class="th" src="${img(x.foto_id)}" alt="">` : '<span class="muted">—</span>'}</td><td>${esc(x.nama)}</td><td>${esc(x.kategori)}</td><td><input type="file" accept="image/jpeg,image/png,image/webp" data-pf="${esc(x.nama)}"></td></tr>`).join('')}</tbody></table></div>`; }
  if (tab === 'agenda') { const d = await loadPub();
    h += H('Agenda kegiatan') + `<form class="card" id="fAgenda"><label>Judul<input name="judul" required maxlength="120"></label><div class="row"><label>Mulai<input type="date" name="tanggal" required></label><label>Selesai<input type="date" name="tanggal_selesai"></label><label>Lokasi<input name="lokasi" maxlength="100"></label><label>PIC<input name="pic" maxlength="80"></label></div><label>Deskripsi<textarea name="deskripsi" rows="3" maxlength="290"></textarea></label><button class="btn" type="submit">Simpan agenda</button></form>
      <div class="grid" style="margin-top:12px">${(d.agenda || []).map(a => `<div class="card"><b>${esc(a.judul)}</b><div class="muted">${esc(tgl(a.tanggal))} · ${esc(a.lokasi)}</div></div>`).join('') || '<div class="card muted">Belum ada agenda.</div>'}</div>`; }
  if (tab === 'pengumuman') h += H('Pengumuman') + `<form class="card" id="fPeng"><label>Judul<input name="judul" required maxlength="120"></label><label>Isi<textarea name="isi" rows="4" required maxlength="290"></textarea></label><label><span><input type="checkbox" name="penting" style="width:auto"> Tandai sebagai penting</span></label><button class="btn" type="submit">Terbitkan</button></form>`;
  if (tab === 'pengguna') { const r = await Api.post('pengguna.daftar'); if (!r.success) return fail(r);
    h += H('Pengguna &amp; peran') + `<form class="card" id="fUser"><div class="row"><label>Email Google<input type="email" name="email" required></label><label>Nama (sama persis dengan di jadwal)<input name="nama" required maxlength="80"></label><label>Status<select name="aktif"><option value="ya">Aktif</option><option value="tidak">Nonaktif</option></select></label></div>
      <div class="row">${[['pengurus','Pengurus/DKM'],['bendahara','Bendahara'],['petugas_jadwal','Petugas Jadwal'],['petugas_ibadah','Imam/Khatib/Muadzin/Penceramah']].map(x => `<label><span><input type="checkbox" name="peran" value="${x[0]}" style="width:auto"> ${x[1]}</span></label>`).join('')}</div><button class="btn" type="submit">Simpan pengguna</button></form>
      <div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>${r.data.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.email)}</td><td>${esc(x.peran)}</td><td><span class="pill ${x.aktif === 'ya' ? 'Disetujui' : 'Dibatalkan'}">${x.aktif === 'ya' ? 'Aktif' : 'Nonaktif'}</span></td><td><button class="btn s o" data-act="edit" data-e="${esc(x.email)}" data-n="${esc(x.nama)}" data-p="${esc(x.peran)}" data-a="${esc(x.aktif)}">Ubah</button></td></tr>`).join('')}</tbody></table></div>`; }
  if (tab === 'pengaturan') { const r = await Api.post('pengaturan.daftar'); if (!r.success) return fail(r); const c = r.data;
    const up = (k,t) => `<div class="card"><b>${t}</b>${img(c[k + '_id']) ? `<p><img src="${img(c[k + '_id'])}" alt="${t}" style="max-width:100%;max-height:140px;border-radius:10px"></p>` : '<p class="muted">Belum ada gambar.</p>'}<input type="file" accept="image/jpeg,image/png,image/webp" data-up="${k}"><div class="muted">JPG/PNG/WebP, otomatis dikecilkan.</div></div>`;
    h += H('Pengaturan masjid') + `<form class="card" id="fSet"><div class="row"><label>Nama masjid<input name="nama" value="${esc(c.nama)}" maxlength="80"></label><label>Telepon<input name="telepon" value="${esc(c.telepon)}" maxlength="30"></label><label>Batas persetujuan (Rp)<input type="number" name="ambang" value="${esc(c.ambang)}" min="1"></label></div><div class="row"><label>Lintang (lat) masjid<input name="lat" value="${esc(c.lat)}" placeholder="-6.2088"></label><label>Bujur (lon) masjid<input name="lon" value="${esc(c.lon)}" placeholder="106.8456"></label><label>Zona waktu<select name="zona"><option value="7" ${c.zona !== '8' && c.zona !== '9' ? 'selected' : ''}>WIB (7)</option><option value="8" ${c.zona === '8' ? 'selected' : ''}>WITA (8)</option><option value="9" ${c.zona === '9' ? 'selected' : ''}>WIT (9)</option></select></label></div><label>Alamat<input name="alamat" value="${esc(c.alamat)}" maxlength="200"></label><button class="btn" type="submit">Simpan pengaturan</button></form>
      <div class="grid" style="margin-top:12px">${up('logo','Logo masjid')}${up('foto_masjid','Foto masjid (latar beranda)')}</div>`; }
  return `<div class="shell"><aside class="side">${T.map(x => `<button class="${x[0] === tab ? 'on' : ''}" data-act="tab" data-t="${x[0]}">${x[1]}</button>`).join('')}</aside><div>${h}</div></div>`;
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
  e.preventDefault(); const f = e.target, fd = new FormData(f), d = Object.fromEntries(fd); const btn = f.querySelector('button'); btn.disabled = true;
  d.peran = fd.getAll('peran'); d.penting = fd.get('penting') ? 'ya' : '';
  const m = {fJadwal:['jadwal.simpan','Jadwal tersimpan'], fKas:['kas.simpan','Transaksi tersimpan'], fPeng:['pengumuman.simpan','Pengumuman terbit'], fUser:['pengguna.simpan','Pengguna tersimpan'], fSet:['pengaturan.simpan','Pengaturan tersimpan'], fPetugas:['petugas.simpan','Petugas ditambahkan'], fAgenda:['agenda.simpan','Agenda tersimpan']}[f.id];
  aksi(m[0], d, m[1]).finally(() => btn.disabled = false);
});
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'tab') { tab = b.dataset.t; sessionStorage.setItem('tab', tab); render(); }
  if (b.dataset.act === 'edit') { const f = $('#fUser'); f.email.value = b.dataset.e; f.nama.value = b.dataset.n; f.aktif.value = b.dataset.a;
    f.querySelectorAll('[name=peran]').forEach(c => c.checked = b.dataset.p.split(',').includes(c.value)); f.scrollIntoView({behavior:'smooth'}); } });
document.addEventListener('change', async e => { const i = e.target.closest('[data-up]'); if (!i || !i.files[0]) return;
  try { toast('Mengunggah…'); await aksi('gambar.unggah', {jenis:i.dataset.up, mime:'image/jpeg', b64:await compress(i.files[0])}, 'Gambar tersimpan'); } catch (x) { toast('Gambar tidak dapat dibaca', true); } });

async function render(){
  const name = (location.hash.slice(1) || 'beranda'), fn = routes[name] || routes.beranda;
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + name));
  $('#navPanel').textContent = me() ? 'Panel Staf' : 'Masuk Staf';
  view.innerHTML = skel();
  loadPub().then(brand).catch(() => {});
  try { view.innerHTML = await fn(); } catch (err) { view.innerHTML = '<div class="card err">Gagal memuat data. Periksa koneksi lalu muat ulang halaman.</div>'; }
}
window.addEventListener('hashchange', render);
const gis = document.createElement('script'); gis.src = 'https://accounts.google.com/gsi/client'; gis.async = true; document.head.appendChild(gis);
render();

document.addEventListener('change', async e => { const i = e.target.closest('[data-pf]'); if (!i || !i.files[0]) return;
  try { toast('Mengunggah…'); await aksi('petugas.foto', {nama:i.dataset.pf, mime:'image/jpeg', b64:await compress(i.files[0])}, 'Foto tersimpan'); } catch (x) { toast('Gambar tidak dapat dibaca', true); } });
