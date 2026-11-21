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
  if (has('pengurus','bendahara')) t.push(['dasbor','Ringkasan']);
  if (has('pengurus','petugas_jadwal','petugas_ibadah')) t.push(['jadwal','Jadwal']);
  if (has('pengurus','bendahara')) t.push(['kas','Kas'], ['zakat','Zakat'], ['qurban','Qurban']);
  if (has('pengurus','bendahara','petugas_jadwal')) t.push(['inventaris','Inventaris']);
  if (has('pengurus','bendahara')) t.push(['jamaah','Jamaah']);
  if (has('pengurus','petugas_jadwal')) t.push(['petugas','Petugas'], ['agenda','Agenda'], ['pengumuman','Pengumuman']);
  if (has('pengurus')) t.push(['pengguna','Pengguna'], ['pengaturan','Pengaturan']);
  return t; }
function compress(file){ return new Promise((ok,no) => { const im = new Image(); im.onload = () => {
  const sc = Math.min(1, 1200 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * sc; c.height = im.height * sc;
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', .8).split(',')[1]); }; im.onerror = no; im.src = URL.createObjectURL(file); }); }
function brand(d){ const s = d.pengaturan || {};
  $('#footCols').innerHTML = `<div class="fc"><b>${esc(s.nama || 'Masjid Nurul Falah')}</b><p>${esc(s.alamat)}</p></div><div class="fc"><b>Kontak</b><p>${esc(s.telepon) || '—'}</p></div><div class="fc"><b>Navigasi</b><p><a href="#jadwal">Jadwal</a> · <a href="#khutbah">Khutbah Jumat</a> · <a href="#agenda">Agenda</a> · <a href="#kas">Kas</a></p></div>`; if (img(s.logo_id)) $('.logo').innerHTML = `<img src="${img(s.logo_id)}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`; }
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
function bars(d){ const W = 520, H = 190, m = Math.max(1, ...d.flatMap(x => [x.masuk, x.keluar])), gap = (W - 40) / Math.max(1, d.length);
  return `<svg viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="Kas masuk dan keluar per bulan" style="width:100%;max-width:640px">${d.map((x,i) => { const a = x.masuk/m*H, b = x.keluar/m*H, c = 20 + i*gap + gap/2;
    return `<rect x="${c-24}" y="${H-a}" width="22" height="${a}" rx="4" fill="#0B5D3B"><title>Masuk ${rp(x.masuk)}</title></rect><rect x="${c+2}" y="${H-b}" width="22" height="${b}" rx="4" fill="#C9A227"><title>Keluar ${rp(x.keluar)}</title></rect><text x="${c}" y="${H+16}" font-size="11" text-anchor="middle" fill="#6B7280">${esc(x.b.slice(5))}/${esc(x.b.slice(2,4))}</text>`; }).join('')}</svg><div class="muted"><span style="color:#0B5D3B">■</span> Masuk &nbsp;<span style="color:#C9A227">■</span> Keluar</div>`; }
function jumatCard(d){ const f = d.jadwal.filter(j => j.jenis === 'Sholat Jumat')[0]; if (!f) return '';
  const ft = d.foto && d.foto[f.khatib] ? img(d.foto[f.khatib]) : '';
  return `<section class="card" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;border-left:4px solid var(--au);margin-bottom:20px">${ft ? `<img class="av" src="${ft}" alt="Foto khatib">` : ''}<div style="flex:1;min-width:220px"><span class="pill Menunggu">Khutbah Jumat · ${esc(tgl(f.tanggal))} · ${esc(f.waktu)} WIB</span><h2 style="margin-top:8px">${esc(f.tema || 'Tema akan diumumkan')}</h2><p class="muted">Khatib: ${esc(f.khatib)} · Imam: ${esc(f.imam)} · Muadzin: ${esc(f.muadzin)}</p><a class="btn o s" href="#khutbah">Lihat jadwal Jumat</a></div></section>`; }
function cardify(){ document.querySelectorAll('.tbl').forEach(t => { if (!t.tHead) return; const h = [...t.tHead.rows[0].cells].map(c => c.textContent.trim());
  t.querySelectorAll('tbody tr').forEach(r => [...r.cells].forEach((c,i) => c.setAttribute('data-l', h[i] || ''))); }); }
function kajianSec(d){ const k = d.jadwal.filter(j => j.jenis === 'Kajian Rutin').slice(0,6);
  return (k.length ? `<h2 style="margin-top:20px">Kajian rutin</h2><div class="grid">${k.map(j => `<div class="card"><span class="pill Menunggu">${esc(tgl(j.tanggal))} · ${esc(j.waktu)} WIB</span><h2 style="margin-top:8px">${esc(j.tema || j.jenis)}</h2><p class="muted">${esc(j.penceramah || j.imam)}</p></div>`).join('')}</div>` : '')
  + `<div class="card" style="margin-top:16px;background:var(--gs)"><b>Ketentuan kehadiran jamaah</b><p style="margin:.4rem 0 0">Seluruh jadwal terbuka untuk umum. Mohon hadir lebih awal, membawa mushaf pribadi, dan memarkir kendaraan dengan tertib.</p></div>`; }
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
  async beranda(){ const d = await loadPub(); return `<section class="hero" ${img((d.pengaturan||{}).foto_masjid_id) ? `style="background:linear-gradient(135deg,#063d27ee,#0b5d3bcc),url(${img(d.pengaturan.foto_masjid_id)}) center/cover"` : ''}><h1>Selamat datang di ${esc((d.pengaturan||{}).nama || 'Masjid Nurul Falah')}</h1><p>Jadwal imam, khatib, muadzin, dan penceramah serta laporan kas masjid, terbuka untuk seluruh jamaah.</p><a class="btn" href="#jadwal">Lihat jadwal ibadah</a></section><h2>Waktu sholat hari ini</h2>${papan(d.pengaturan)}<div style="height:20px"></div>${jumatCard(d)}
    <div class="grid"><div><h2>Jadwal terdekat</h2>${jadwalRows(d.jadwal.slice(0,5))}</div>
    <div><h2>Pengumuman</h2>${d.pengumuman.length ? d.pengumuman.slice(0,4).map(p => `<div class="card ann ${p.penting === 'ya' ? 'pen' : ''}"><b>${esc(p.judul)}</b><div class="muted">${esc(tgl(p.tanggal))}</div><p>${esc(p.isi)}</p></div>`).join('') : '<div class="card muted">Belum ada pengumuman.</div>'}</div></div>
    <h2 style="margin-top:24px">Transparansi kas</h2>${kasCards(d.kas)}`; },
  async jadwal(){ const d = await loadPub(); return `<h1>Jadwal ibadah &amp; kajian</h1>${papan(d.pengaturan)}<h2 style="margin-top:20px">Jadwal petugas</h2>${jadwalRows(d.jadwal)}${kajianSec(d)}`; },
  async kas(){ const d = await loadPub(); return `<h1>Transparansi kas masjid</h1><p class="muted">Ringkasan hanya menampilkan total. Rincian transaksi dan nama donatur dikelola bendahara.</p>${kasCards(d.kas)}<div class="card" style="margin-top:16px"><b>Kas 6 bulan terakhir</b>${bars(d.kas.bulanan || [])}</div>`; },
  async khutbah(){ const d = await loadPub(), l = d.jadwal.filter(j => j.jenis === 'Sholat Jumat'), f = l[0], ft = n => (d.foto && d.foto[n]) ? img(d.foto[n]) : '';
    return `<h1>Khutbah Jumat</h1>` + (f ? `<section class="hero" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">${ft(f.khatib) ? `<img class="av" src="${ft(f.khatib)}" alt="Foto khatib">` : ''}<div><span class="pill Menunggu">${esc(tgl(f.tanggal))} · ${esc(f.waktu)} WIB</span><h2 style="margin-top:8px">${esc(f.tema || 'Tema akan diumumkan')}</h2><p>Khatib: ${esc(f.khatib)}<br>Imam: ${esc(f.imam)}<br>Muadzin: ${esc(f.muadzin)}</p></div></section><h2>Jadwal berikutnya</h2>${jadwalRows(l.slice(1))}` : '<div class="card muted">Belum ada jadwal sholat Jumat.</div>'); },
  async agenda(){ const d = await loadPub();
    return `<h1>Agenda kegiatan</h1>` + (d.agenda && d.agenda.length ? `<div class="grid">${d.agenda.map(a => `<div class="card">${img(a.poster_id) ? `<img src="${img(a.poster_id)}" alt="Poster" style="width:100%;border-radius:10px;margin-bottom:8px">` : ''}<span class="pill Menunggu">${esc(tgl(a.tanggal))}${a.tanggal_selesai && a.tanggal_selesai !== a.tanggal ? ' – ' + esc(tgl(a.tanggal_selesai)) : ''}</span><h2 style="margin-top:8px">${esc(a.judul)}</h2><p class="muted">${esc(a.lokasi)}${a.pic ? ' · PIC: ' + esc(a.pic) : ''}</p><p>${esc(a.deskripsi)}</p></div>`).join('')}</div>` : '<div class="card muted">Belum ada agenda mendatang.</div>'); },
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
    h += `<h2 style="margin-top:24px">Kas</h2><div class="card" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin-bottom:12px"><label>Laporan bulan<input type="month" id="lapBulan" value="${new Date().toISOString().slice(0,7)}"></label><button class="btn o" type="button" data-act="lap">Unduh laporan PDF</button></div>`;
    if (has('bendahara')) h += `<form class="card" id="fKas"><div class="row"><label>Tanggal<input type="date" name="tanggal" required></label>
      <label>Jenis<select name="jenis"><option>Masuk</option><option>Keluar</option></select></label><label>Kategori<input name="kategori" required maxlength="60" placeholder="Infaq Jumat, Listrik, …"></label>
      <label>Nominal (Rp)<input type="number" name="nominal" min="1" required></label></div><label>Keterangan<input name="keterangan" maxlength="200"></label><label>Email donatur (opsional, untuk tanda terima)<input type="email" name="email_donatur" maxlength="100"></label><label>Foto bukti / nota (wajib untuk pengeluaran)<input type="file" name="bukti" accept="image/*"></label>
      <button class="btn" type="submit">Simpan transaksi</button><span class="muted">Pengeluaran di atas Rp 1.000.000 menunggu persetujuan pengurus.</span></form>`;
    h += k.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Tanggal</th><th>Kategori</th><th class="r">Nominal</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${k.data.map(x =>
      `<tr><td>${esc(tgl(x.tanggal))}</td><td><span class="pill ${esc(x.jenis)}">${esc(x.jenis)}</span> ${esc(x.kategori)}<br><span class="muted">${esc(x.keterangan)}</span></td>
      <td class="r">${rp(x.nominal)}</td><td><span class="pill ${esc(x.status)}">${esc(x.status)}</span></td><td>${x.bukti_id ? `<button class="btn s o" data-act="bukti" data-id="${esc(x.id)}">Bukti</button> ` : ''}${x.status === 'Menunggu' && has('pengurus') ? `<button class="btn s" data-act="putus" data-id="${esc(x.id)}" data-p="Setujui">Setujui</button> <button class="btn s d" data-act="putus" data-id="${esc(x.id)}" data-p="Tolak">Tolak</button>` : ''}
      ${x.status !== 'Dibatalkan' && x.status !== 'Ditolak' ? `<button class="btn s o" data-act="batal" data-id="${esc(x.id)}">Batalkan</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada transaksi.</div>';
  }
  const H = t => `<h2 style="margin-top:24px">${t}</h2>`;
  const sc = x => ['Tersalurkan','Lunas','Terdistribusi'].includes(x) ? 'Disetujui' : 'Menunggu';
  if (tab === 'zakat') { const r = await Api.post('zakat.daftar'); if (!r.success) return fail(r);
    const th = String(new Date().getFullYear()), z = r.data.filter(x => x.tahun === th), sum = f => z.filter(f).reduce((a,x) => a + Number(x.jumlah), 0);
    h += H('Zakat ' + th) + `<div class="grid"><div class="card"><div class="muted">Zakat fitrah (jiwa)</div><div class="num">${z.filter(x => x.jenis === 'Fitrah').reduce((a,x) => a + Number(x.jiwa), 0)}</div></div><div class="card"><div class="muted">Total uang</div><div class="num">${rp(sum(x => x.bentuk === 'Uang'))}</div></div><div class="card"><div class="muted">Total beras</div><div class="num">${sum(x => x.bentuk === 'Beras')} kg</div></div><div class="card"><div class="muted">Sudah disalurkan</div><div class="num">${z.length ? Math.round(z.filter(x => x.status === 'Tersalurkan').length / z.length * 100) : 0}%</div></div></div>`
    + (has('bendahara') ? `<form class="card" id="fZakat" style="margin-top:12px"><div class="row"><label>Tanggal<input type="date" name="tanggal" required></label><label>Jenis<select name="jenis"><option>Fitrah</option><option>Mal</option></select></label><label>Nama muzakki<input name="muzakki" required maxlength="80"></label><label>Jumlah jiwa (fitrah)<input type="number" name="jiwa" min="0"></label><label>Bentuk<select name="bentuk"><option>Uang</option><option>Beras</option></select></label><label>Jumlah (Rp atau kg)<input type="number" step="0.1" name="jumlah" min="0.1" required></label></div><button class="btn" type="submit">Catat penerimaan</button></form>` : '')
    + (r.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Tanggal</th><th>Muzakki</th><th>Jenis</th><th class="r">Jumlah</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${r.data.map(x => `<tr><td>${esc(tgl(x.tanggal))}</td><td>${esc(x.muzakki)}${Number(x.jiwa) ? `<br><span class="muted">${esc(x.jiwa)} jiwa</span>` : ''}</td><td>${esc(x.jenis)}</td><td class="r">${x.bentuk === 'Uang' ? rp(x.jumlah) : esc(x.jumlah) + ' kg'}</td><td><span class="pill ${sc(x.status)}">${esc(x.status)}</span>${x.mustahik ? `<br><span class="muted">${esc(x.mustahik)}</span>` : ''}</td><td>${x.status === 'Diterima' && has('bendahara') ? `<button class="btn s" data-act="zsalur" data-id="${esc(x.id)}">Salurkan</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada catatan zakat.</div>'); }
  if (tab === 'qurban') { const r = await Api.post('qurban.daftar'); if (!r.success) return fail(r);
    const th = String(new Date().getFullYear()), q = r.data.filter(x => x.tahun === th);
    h += H('Qurban ' + th) + `<div class="grid"><div class="card"><div class="muted">Shohibul terdaftar</div><div class="num">${q.length}</div></div><div class="card"><div class="muted">Iuran terkumpul</div><div class="num">${rp(q.reduce((a,x) => a + Number(x.terbayar), 0))}</div></div><div class="card"><div class="muted">Belum lunas</div><div class="num">${q.filter(x => x.status_bayar !== 'Lunas').length}</div></div></div>`
    + (has('bendahara') ? `<form class="card" id="fQurban" style="margin-top:12px"><div class="row"><label>Nama shohibul<input name="shohibul" required maxlength="80"></label><label>Hewan<select name="hewan"><option>Sapi (1/7 bagian)</option><option>Kambing</option><option>Domba</option></select></label><label>Iuran total (Rp)<input type="number" name="iuran_total" min="1" required></label><label>Sudah dibayar (Rp)<input type="number" name="terbayar" min="0" value="0"></label></div><button class="btn" type="submit">Daftarkan shohibul</button></form>` : '')
    + (r.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Shohibul</th><th>Hewan</th><th class="r">Iuran</th><th class="r">Terbayar</th><th>Pembayaran</th><th>Distribusi</th><th>Aksi</th></tr></thead><tbody>${r.data.map(x => `<tr><td>${esc(x.shohibul)}<br><span class="muted">${esc(x.tahun)}</span></td><td>${esc(x.hewan)}</td><td class="r">${rp(x.iuran_total)}</td><td class="r">${rp(x.terbayar)}</td><td><span class="pill ${sc(x.status_bayar)}">${esc(x.status_bayar)}</span></td><td><span class="pill ${sc(x.status_distribusi)}">${esc(x.status_distribusi)}</span></td><td>${has('bendahara') ? (x.status_bayar !== 'Lunas' ? `<button class="btn s" data-act="qbayar" data-id="${esc(x.id)}">Catat bayar</button>` : (x.status_distribusi !== 'Terdistribusi' ? `<button class="btn s o" data-act="qdist" data-id="${esc(x.id)}">Terdistribusi</button>` : '')) : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada shohibul qurban.</div>'); }
  if (tab === 'inventaris') { const r = await Api.post('inventaris.daftar'); if (!r.success) return fail(r); const KOND = ['Baik','Perlu Servis','Rusak','Dalam Perbaikan'], L = r.data;
    const tot = L.reduce((a,x) => a + Number(x.jumlah), 0), baik = L.filter(x => x.kondisi === 'Baik').reduce((a,x) => a + Number(x.jumlah), 0), kc = {Baik:'Disetujui', Rusak:'Dibatalkan'};
    h += H('Inventaris &amp; sarana prasarana') + `<div class="grid"><div class="card"><div class="muted">Total unit</div><div class="num">${tot}</div></div><div class="card"><div class="muted">Kondisi baik</div><div class="num">${tot ? Math.round(baik/tot*100) : 0}%</div></div><div class="card"><div class="muted">Perlu perhatian</div><div class="num ${L.some(x => x.kondisi === 'Rusak') ? 'out' : ''}">${L.filter(x => x.kondisi !== 'Baik').length} item</div></div></div>`
    + (has('pengurus') ? `<form class="card" id="fInv" style="margin-top:12px"><div class="row"><label>Nama barang<input name="nama" required maxlength="100"></label><label>Kategori<input name="kategori" maxlength="40"></label><label>Jumlah<input type="number" name="jumlah" min="1" value="1" required></label><label>Kondisi<select name="kondisi">${KOND.map(k => `<option>${k}</option>`).join('')}</select></label><label>Lokasi<input name="lokasi" maxlength="60"></label><label>Tgl perolehan<input type="date" name="tanggal_perolehan"></label></div><label>Foto (opsional)<input type="file" name="foto" accept="image/*"></label><button class="btn" type="submit">Simpan barang</button></form>` : '')
    + (L.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Kode</th><th>Barang</th><th>Jumlah</th><th>Kondisi</th><th>Lokasi</th></tr></thead><tbody>${L.map(x => `<tr><td class="r">${esc(x.kode)}</td><td>${img(x.foto_id) ? `<img class="th" src="${img(x.foto_id)}" alt=""> ` : ''}<b>${esc(x.nama)}</b><br><span class="muted">${esc(x.kategori)}</span></td><td>${esc(x.jumlah)}</td><td>${has('pengurus') ? `<select data-kond="${esc(x.id)}">${KOND.map(k => `<option ${k === x.kondisi ? 'selected' : ''}>${k}</option>`).join('')}</select>` : `<span class="pill ${kc[x.kondisi] || 'Menunggu'}">${esc(x.kondisi)}</span>`}</td><td>${esc(x.lokasi)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada data inventaris.</div>'); }
  if (tab === 'jamaah') { const r = await Api.post('jamaah.daftar'); if (!r.success) return fail(r);
    h += H('Data jamaah') + `<p class="muted">🔒 Hanya terlihat oleh pengurus dan bendahara. Nomor HP disamarkan; membukanya tercatat di log aktivitas.</p><div class="grid"><div class="card"><div class="muted">Total jamaah</div><div class="num">${r.data.length}</div></div><div class="card"><div class="muted">Jamaah tetap</div><div class="num">${r.data.filter(x => x.status === 'Tetap').length}</div></div></div>`
    + (has('pengurus') ? `<form class="card" id="fJamaah" style="margin-top:12px"><input type="hidden" name="id"><div class="row"><label>Nama<input name="nama" required maxlength="80"></label><label>Status<select name="status"><option>Tetap</option><option>Simpatisan</option></select></label><label>No. HP/WA (kosongkan bila tidak diubah)<input name="hp" inputmode="tel" maxlength="20"></label></div><label>Alamat<input name="alamat" maxlength="200"></label><label>Catatan<input name="catatan" maxlength="150"></label><button class="btn" type="submit">Simpan jamaah</button></form>` : '')
    + (r.data.length ? `<div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Nama</th><th>Alamat</th><th>No. HP</th><th>Status</th><th></th></tr></thead><tbody>${r.data.map(x => `<tr><td>${esc(x.nama)}<br><span class="muted">${esc(x.catatan)}</span></td><td>${esc(x.alamat)}</td><td><span class="r">${esc(x.hp) || '—'}</span> ${x.hp ? `<button class="btn s o" data-act="jhp" data-id="${esc(x.id)}">Buka</button>` : ''}</td><td><span class="pill ${x.status === 'Tetap' ? 'Disetujui' : ''}">${esc(x.status)}</span></td><td>${has('pengurus') ? `<button class="btn s o" data-act="jedit" data-id="${esc(x.id)}" data-n="${esc(x.nama)}" data-a="${esc(x.alamat)}" data-s="${esc(x.status)}" data-c="${esc(x.catatan)}">Ubah</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<div class="card muted" style="margin-top:12px">Belum ada data jamaah.</div>'); }
  if (tab === 'dasbor') { const r = await Api.post('dashboard'); if (!r.success) return fail(r); const c = r.data, kt = Object.entries(c.kategori).sort((a,b) => b[1] - a[1]), tot = kt.reduce((a,x) => a + x[1], 0) || 1;
    h += H('Ringkasan') + kasCards(c.kas) + `<div class="grid" style="margin-top:16px"><div class="card"><div class="muted">Menunggu persetujuan</div><div class="num">${c.menunggu}</div>${c.menunggu && has('pengurus') ? '<button class="btn s" data-act="tab" data-t="kas">Tinjau</button>' : ''}</div><div class="card"><div class="muted">Jadwal perlu pengganti</div><div class="num ${c.perluPengganti ? 'out' : ''}">${c.perluPengganti}</div></div></div>
      <div class="grid" style="margin-top:16px"><div class="card"><b>Kas 6 bulan terakhir</b>${bars(c.bulanan)}</div><div class="card"><b>Pengeluaran bulan ini per kategori</b>${kt.length ? kt.map(x => `<div style="margin:10px 0"><div style="display:flex;justify-content:space-between"><span>${esc(x[0])}</span><span class="r">${rp(x[1])}</span></div><div style="height:8px;background:var(--gs);border-radius:99px"><div style="height:8px;width:${Math.round(x[1]/tot*100)}%;background:var(--g);border-radius:99px"></div></div></div>`).join('') : '<p class="muted">Belum ada pengeluaran bulan ini.</p>'}</div></div>`; }
  if (tab === 'petugas') { const r = await Api.post('petugas.daftar'); if (!r.success) return fail(r);
    h += H('Petugas &amp; foto') + `<form class="card" id="fPetugas"><div class="row"><label>Nama (sama persis dengan di jadwal)<input name="nama" required maxlength="80"></label><label>Kategori<select name="kategori"><option>Imam</option><option>Khatib</option><option>Muadzin</option><option>Penceramah</option></select></label></div><button class="btn" type="submit">Tambah petugas</button></form>
      <div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Foto</th><th>Nama</th><th>Kategori</th><th>Ganti foto</th></tr></thead><tbody>${r.data.map(x => `<tr><td>${img(x.foto_id) ? `<img class="th" src="${img(x.foto_id)}" alt="">` : '<span class="muted">—</span>'}</td><td>${esc(x.nama)}</td><td>${esc(x.kategori)}</td><td><input type="file" accept="image/jpeg,image/png,image/webp" data-pf="${esc(x.nama)}"></td></tr>`).join('')}</tbody></table></div>`; }
  if (tab === 'agenda') { const d = await loadPub();
    h += H('Agenda kegiatan') + `<form class="card" id="fAgenda"><label>Judul<input name="judul" required maxlength="120"></label><div class="row"><label>Mulai<input type="date" name="tanggal" required></label><label>Selesai<input type="date" name="tanggal_selesai"></label><label>Lokasi<input name="lokasi" maxlength="100"></label><label>PIC<input name="pic" maxlength="80"></label></div><label>Deskripsi<textarea name="deskripsi" rows="3" maxlength="290"></textarea></label><button class="btn" type="submit">Simpan agenda</button></form>
      <div class="grid" style="margin-top:12px">${(d.agenda || []).map(a => `<div class="card">${img(a.poster_id) ? `<img src="${img(a.poster_id)}" alt="Poster" style="width:100%;border-radius:10px">` : ''}<b>${esc(a.judul)}</b><div class="muted">${esc(tgl(a.tanggal))} · ${esc(a.lokasi)}</div><label>Poster<input type="file" accept="image/*" data-ap="${esc(a.id)}"></label></div>`).join('') || '<div class="card muted">Belum ada agenda.</div>'}</div>`; }
  if (tab === 'pengumuman') h += H('Pengumuman') + `<form class="card" id="fPeng"><label>Judul<input name="judul" required maxlength="120"></label><label>Isi<textarea name="isi" rows="4" required maxlength="290"></textarea></label><label><span><input type="checkbox" name="penting" style="width:auto"> Tandai sebagai penting</span></label><button class="btn" type="submit">Terbitkan</button></form>`;
  if (tab === 'pengguna') { const r = await Api.post('pengguna.daftar'); if (!r.success) return fail(r);
    h += H('Pengguna &amp; peran') + `<form class="card" id="fUser"><div class="row"><label>Email Google<input type="email" name="email" required></label><label>Nama (sama persis dengan di jadwal)<input name="nama" required maxlength="80"></label><label>Status<select name="aktif"><option value="ya">Aktif</option><option value="tidak">Nonaktif</option></select></label></div>
      <div class="row">${[['pengurus','Pengurus/DKM'],['bendahara','Bendahara'],['petugas_jadwal','Petugas Jadwal'],['petugas_ibadah','Imam/Khatib/Muadzin/Penceramah']].map(x => `<label><span><input type="checkbox" name="peran" value="${x[0]}" style="width:auto"> ${x[1]}</span></label>`).join('')}</div><button class="btn" type="submit">Simpan pengguna</button></form>
      <div class="wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>${r.data.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.email)}</td><td>${esc(x.peran)}</td><td><span class="pill ${x.aktif === 'ya' ? 'Disetujui' : 'Dibatalkan'}">${x.aktif === 'ya' ? 'Aktif' : 'Nonaktif'}</span></td><td><button class="btn s o" data-act="edit" data-e="${esc(x.email)}" data-n="${esc(x.nama)}" data-p="${esc(x.peran)}" data-a="${esc(x.aktif)}">Ubah</button></td></tr>`).join('')}</tbody></table></div>`; }
  if (tab === 'pengaturan') { const r = await Api.post('pengaturan.daftar'); if (!r.success) return fail(r); const c = r.data;
    const up = (k,t) => `<div class="card"><b>${t}</b>${img(c[k + '_id']) ? `<p><img src="${img(c[k + '_id'])}" alt="${t}" style="max-width:100%;max-height:140px;border-radius:10px"></p>` : '<p class="muted">Belum ada gambar.</p>'}<input type="file" accept="image/jpeg,image/png,image/webp" data-up="${k}"><div class="muted">JPG/PNG/WebP, otomatis dikecilkan.</div></div>`;
    h += H('Pengaturan masjid') + `<form class="card" id="fSet"><div class="row"><label>Nama masjid<input name="nama" value="${esc(c.nama)}" maxlength="80"></label><label>Telepon<input name="telepon" value="${esc(c.telepon)}" maxlength="30"></label><label>Batas persetujuan (Rp)<input type="number" name="ambang" value="${esc(c.ambang)}" min="1"></label></div><div class="row"><label>Lintang (lat) masjid<input name="lat" value="${esc(c.lat)}" placeholder="-6.2088"></label><label>Bujur (lon) masjid<input name="lon" value="${esc(c.lon)}" placeholder="106.8456"></label><label>Zona waktu<select name="zona"><option value="7" ${c.zona !== '8' && c.zona !== '9' ? 'selected' : ''}>WIB (7)</option><option value="8" ${c.zona === '8' ? 'selected' : ''}>WITA (8)</option><option value="9" ${c.zona === '9' ? 'selected' : ''}>WIT (9)</option></select></label></div><label>Alamat<input name="alamat" value="${esc(c.alamat)}" maxlength="200"></label><button class="btn" type="submit">Simpan pengaturan</button></form>
      <div class="grid" style="margin-top:12px">${up('logo','Logo masjid')}${up('foto_masjid','Foto masjid (latar beranda)')}</div><div class="card" style="margin-top:12px"><b>Pencadangan data</b><p class="muted">Cadangan otomatis tiap Minggu dini hari (8 salinan terakhir disimpan di Drive). Terakhir: ${c.cadangan ? esc(new Date(c.cadangan).toLocaleString('id-ID')) : 'belum ada'}</p><button class="btn o" type="button" data-act="backup">Cadangkan sekarang</button></div>`; }
  return `<div class="shell"><aside class="side">${has('bendahara') ? '<button type="button" data-act="tab" data-t="kas" style="background:var(--au);color:var(--gd);font-weight:600;text-align:center">+ Entri transaksi</button>' : ''}${T.map(x => `<button class="${x[0] === tab ? 'on' : ''}" data-act="tab" data-t="${x[0]}">${x[1]}</button>`).join('')}<input type="search" data-filter placeholder="Cari di tabel…" aria-label="Cari di tabel" style="margin-top:8px;min-width:140px"><button type="button" data-act="csv">Ekspor CSV</button></aside><div>${h}</div></div>`;
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
document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, fd = new FormData(f), d = Object.fromEntries(fd); const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
  delete d.bukti; delete d.foto; const fi = f.querySelector('input[type=file]');
  if (fi && fi.files[0]) { try { d.b64 = await compress(fi.files[0]); d.mime = 'image/jpeg'; } catch (x) { toast('Gambar tidak dapat dibaca', true); btn.disabled = false; return; } }
  d.peran = fd.getAll('peran'); d.penting = fd.get('penting') ? 'ya' : '';
  const m = {fJadwal:['jadwal.simpan','Jadwal tersimpan'], fKas:['kas.simpan','Transaksi tersimpan'], fPeng:['pengumuman.simpan','Pengumuman terbit'], fUser:['pengguna.simpan','Pengguna tersimpan'], fSet:['pengaturan.simpan','Pengaturan tersimpan'], fPetugas:['petugas.simpan','Petugas ditambahkan'], fAgenda:['agenda.simpan','Agenda tersimpan'], fZakat:['zakat.simpan','Penerimaan zakat dicatat'], fQurban:['qurban.simpan','Shohibul didaftarkan'], fInv:['inventaris.simpan','Barang tersimpan'], fJamaah:['jamaah.simpan','Data jamaah tersimpan']}[f.id];
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
  try { view.innerHTML = await fn(); cardify(); } catch (err) { view.innerHTML = '<div class="card err">Gagal memuat data. Periksa koneksi lalu muat ulang halaman.</div>'; }
}
window.addEventListener('hashchange', render);
const gis = document.createElement('script'); gis.src = 'https://accounts.google.com/gsi/client'; gis.async = true; document.head.appendChild(gis);
render();

document.addEventListener('change', async e => { const i = e.target.closest('[data-pf]'); if (!i || !i.files[0]) return;
  try { toast('Mengunggah…'); await aksi('petugas.foto', {nama:i.dataset.pf, mime:'image/jpeg', b64:await compress(i.files[0])}, 'Foto tersimpan'); } catch (x) { toast('Gambar tidak dapat dibaca', true); } });

document.addEventListener('change', async e => { const i = e.target.closest('[data-ap]'); if (!i || !i.files[0]) return;
  try { toast('Mengunggah…'); await aksi('agenda.poster', {id:i.dataset.ap, mime:'image/jpeg', b64:await compress(i.files[0])}, 'Poster tersimpan'); } catch (x) { toast('Gambar tidak dapat dibaca', true); } });
document.addEventListener('click', async e => { const b = e.target.closest('[data-act=bukti]'); if (!b) return;
  const r = await Api.post('kas.bukti', {id:b.dataset.id}); if (!r.success || !/^image\//.test(r.data.mime)) return toast(r.message || 'Bukti tidak dapat ditampilkan', true);
  const v = document.createElement('div'); v.style.cssText = 'position:fixed;inset:0;background:#000b;display:grid;place-items:center;z-index:20;padding:16px;cursor:pointer';
  v.innerHTML = `<img alt="Bukti transaksi" style="max-width:100%;max-height:90vh;border-radius:12px" src="data:${esc(r.data.mime)};base64,${r.data.b64}">`; v.onclick = () => v.remove(); document.body.appendChild(v); });

document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, id = b.dataset.id;
  if (a === 'zsalur') { const m = prompt('Disalurkan kepada (nama atau kelompok mustahik):'); if (m) aksi('zakat.salur', {id, mustahik:m}, 'Penyaluran dicatat'); }
  if (a === 'qbayar') { const n = prompt('Nominal pembayaran iuran (Rp):'); if (n) aksi('qurban.bayar', {id, nominal:n}, 'Pembayaran dicatat'); }
  if (a === 'qdist') aksi('qurban.distribusi', {id}, 'Distribusi dicatat'); });

document.addEventListener('click', async e => { const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  if (a === 'jhp') { const r = await Api.post('jamaah.hp', {id:b.dataset.id}); if (!r.success) return toast(r.message, true); b.previousElementSibling.textContent = r.data.hp || '—'; b.remove(); }
  if (a === 'jedit') { const f = $('#fJamaah'); f.querySelector('[name=id]').value = b.dataset.id; f.nama.value = b.dataset.n; f.alamat.value = b.dataset.a; f.status.value = b.dataset.s; f.catatan.value = b.dataset.c; f.hp.value = ''; f.scrollIntoView({behavior:'smooth'}); } });
document.addEventListener('change', e => { const s = e.target.closest('[data-kond]'); if (s) aksi('inventaris.kondisi', {id:s.dataset.kond, kondisi:s.value}, 'Kondisi diperbarui'); });

document.addEventListener('click', async e => { const b = e.target.closest('[data-act=lap]'); if (!b) return; const bl = $('#lapBulan').value; if (!bl) return toast('Pilih bulan terlebih dahulu', true);
  b.disabled = true; toast('Menyusun laporan…'); const r = await Api.post('laporan.pdf', {bulan:bl}); b.disabled = false; if (!r.success) return toast(r.message, true);
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Uint8Array.from(atob(r.data.b64), c => c.charCodeAt(0))], {type:'application/pdf'})); a.download = r.data.nama; a.click(); toast('Laporan diunduh'); });

document.addEventListener('input', e => { if (!e.target.matches('[data-filter]')) return; const q = e.target.value.toLowerCase();
  document.querySelectorAll('.tbl tbody tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'); });
document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'backup') aksi('cadangan.sekarang', {}, 'Cadangan dibuat di Drive');
  if (b.dataset.act === 'csv') { const t = document.querySelector('.tbl'); if (!t) return toast('Tidak ada tabel untuk diekspor', true);
    const cell = c => '"' + c.textContent.trim().replace(/\s+/g, ' ').replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"';
    const csv = [...t.rows].filter(r => r.style.display !== 'none').map(r => [...r.cells].map(cell).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], {type:'text/csv'})); a.download = 'simas-' + (tab || 'data') + '.csv'; a.click(); } });

const tema = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
try { const t = localStorage.getItem('simas_tema'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
$('#theme').addEventListener('click', () => { const t = tema() === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('simas_tema', t); } catch (e) {} });
