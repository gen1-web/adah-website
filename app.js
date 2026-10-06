/* Adah space: widgets, calendar and progress, saved in this browser */
(function () {
  'use strict';
  const KEY = 'adah-data-v1';
  const $ = id => document.getElementById(id);
  if (!$('space')) return;
  const pad = n => String(n).padStart(2, '0');
  const dkey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parseK = k => { const p = k.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
  const todayK = () => dkey(new Date());
  const ANCHORS = [
    ['fajr', 'Fajr on time'],
    ['adhkar', 'Morning adhkar'],
    ['quran', 'One page of Qur\u2019an'],
    ['deep', 'One deep work block'],
    ['curfew', 'Phone away after Isha']
  ];

  /* ---------- Store ---------- */
  let data = null;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) { data = null; }
  if (!data || typeof data !== 'object') data = { v: 1 };
  ['profile', 'days', 'weeks', 'settings'].forEach(k => { if (!data[k] || typeof data[k] !== 'object') data[k] = {}; });
  function day(k) {
    if (!data.days[k]) data.days[k] = { anchors: [], focusSec: 0, sessions: 0, pages: 0, niyyah: '' };
    return data.days[k];
  }
  const peek = k => data.days[k] || null;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { return false; } }
  const listeners = [];
  function changed() { save(); listeners.forEach(f => f()); }

  // Bring over anything saved by the earlier version of the toolkit
  try {
    const n = JSON.parse(localStorage.getItem('adah-niyyah'));
    const h = JSON.parse(localStorage.getItem('adah-habits'));
    if (n && n.date && n.text && !day(n.date).niyyah) day(n.date).niyyah = n.text;
    if (h && h.date && Array.isArray(h.done) && !day(h.date).anchors.length) day(h.date).anchors = h.done;
    localStorage.removeItem('adah-niyyah');
    localStorage.removeItem('adah-habits');
    save();
  } catch (e) { /* nothing to migrate */ }

  /* ---------- Hijri dates ---------- */
  let hijriFmt = null;
  try { hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { hijriFmt = null; }
  function hijri(d) {
    if (!hijriFmt) return null;
    const p = {};
    hijriFmt.formatToParts(d).forEach(x => { p[x.type] = x.value; });
    const year = String(p.year || p.relatedYear || '').replace(/\D/g, '');
    return { day: Number(p.day), month: p.month || '', year: year, text: p.day + ' ' + p.month + ' ' + year + ' AH' };
  }
  function dayNotes(d) {
    const h = hijri(d);
    const notes = [];
    const wd = d.getDay();
    if (wd === 5) notes.push(['jumuah', 'Jumu\u2019ah: read Surah al-Kahf and send salawat']);
    if (wd === 1 || wd === 4) notes.push(['fast', 'Sunnah fast: Mondays and Thursdays']);
    if (h && h.day >= 13 && h.day <= 15) notes.push(['white', 'Ayyam al-Bidh: the white days, recommended for fasting']);
    if (h && /rama/i.test(h.month)) notes.push(['ramadan', 'Ramadan']);
    return notes;
  }

  /* ---------- Today bar and greeting ---------- */
  function renderTodayBar() {
    const now = new Date();
    $('tb-greg').textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const h = hijri(now);
    if (h) $('tb-hijri').textContent = h.text; else $('tb-hijri').hidden = true;
    $('sp-date').textContent = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (h ? ', ' + h.text : '');
  }
  function renderGreeting() {
    const name = String(data.profile.name || '').trim();
    $('greet').textContent = name ? 'Assalamu alaikum, ' + name : 'Your daily Adah space';
    $('p-name').value = name;
    $('p-save').textContent = name ? 'Update name' : 'Save name';
  }
  $('p-save').addEventListener('click', () => {
    data.profile.name = $('p-name').value.trim().slice(0, 30);
    changed();
    renderGreeting();
  });

  /* ---------- Backup and restore ---------- */
  $('d-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'adah-progress-' + todayK() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    $('d-msg').textContent = 'Backup downloaded. Restore it on any device to continue.';
  });
  $('d-import').addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) return;
    f.text().then(t => {
      const d = JSON.parse(t);
      if (!d || typeof d.days !== 'object') throw new Error('bad file');
      data = d;
      save();
      location.reload();
    }).catch(() => { $('d-msg').textContent = 'That file could not be read. Choose an Adah backup file.'; });
  });

  /* ---------- Prayer times ---------- */
  const st = data.settings;
  const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const METHODS = [[3, 'Muslim World League'], [1, 'Karachi'], [2, 'ISNA, North America'], [4, 'Umm al-Qura, Makkah'], [5, 'Egyptian Authority'], [8, 'Gulf Region'], [13, 'Diyanet, Turkey'], [15, 'Moonsighting Committee']];
  const methodSel = $('pt-method');
  METHODS.forEach(m => { const o = document.createElement('option'); o.value = m[0]; o.textContent = m[1]; methodSel.appendChild(o); });
  methodSel.value = st.method != null ? st.method : 3;
  $('pt-school').value = st.school || 0;
  if (st.city) $('pt-city').value = st.city;
  if (st.country) $('pt-country').value = st.country;

  async function fetchTimes(q) {
    $('pt-msg').textContent = 'Loading prayer times\u2026';
    const d = new Date();
    const ds = pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear();
    const opts = 'method=' + methodSel.value + '&school=' + $('pt-school').value;
    const url = q.city
      ? 'https://api.aladhan.com/v1/timingsByCity/' + ds + '?city=' + encodeURIComponent(q.city) + '&country=' + encodeURIComponent(q.country) + '&' + opts
      : 'https://api.aladhan.com/v1/timings/' + ds + '?latitude=' + q.lat + '&longitude=' + q.lng + '&' + opts;
    try {
      const r = await fetch(url);
      const j = await r.json();
      if (j.code !== 200 || !j.data || !j.data.timings) throw new Error('no data');
      const t = {};
      PRAYERS.forEach(p => { t[p] = String(j.data.timings[p]).slice(0, 5); });
      st.times = { date: dkey(d), t: t, place: q.city ? q.city + ', ' + q.country : 'Your location' };
      st.method = Number(methodSel.value);
      st.school = Number($('pt-school').value);
      if (q.city) { st.city = q.city; st.country = q.country; delete st.lat; delete st.lng; }
      else { st.lat = q.lat; st.lng = q.lng; st.city = ''; st.country = ''; }
      changed();
      $('pt-msg').textContent = '';
      $('pt-form').classList.add('is-set');
      renderPrayer();
    } catch (e) {
      $('pt-msg').textContent = 'Could not load times for that place. Check the spelling, or use your location.';
    }
  }
  const savedPlace = () => st.city ? { city: st.city, country: st.country } : (st.lat != null ? { lat: st.lat, lng: st.lng } : null);
  $('pt-form').addEventListener('submit', e => {
    e.preventDefault();
    const c = $('pt-city').value.trim(), k = $('pt-country').value.trim();
    if (!c || !k) { $('pt-msg').textContent = 'Enter both a city and a country.'; return; }
    fetchTimes({ city: c, country: k });
  });
  $('pt-geo').addEventListener('click', () => {
    if (!navigator.geolocation) { $('pt-msg').textContent = 'Location is not available here. Enter your city instead.'; return; }
    $('pt-msg').textContent = 'Finding your location\u2026';
    navigator.geolocation.getCurrentPosition(
      p => fetchTimes({ lat: p.coords.latitude.toFixed(2), lng: p.coords.longitude.toFixed(2) }),
      () => { $('pt-msg').textContent = 'Location was not shared. Enter your city instead.'; }
    );
  });
  $('pt-change').addEventListener('click', () => { $('pt-form').classList.remove('is-set'); $('pt-city').focus(); });
  [methodSel, $('pt-school')].forEach(x => x.addEventListener('change', () => { const q = savedPlace(); if (q) fetchTimes(q); }));

  function nextPrayer() {
    if (!st.times) return null;
    const now = new Date();
    const at = (p, plus) => { const hm = st.times.t[p].split(':').map(Number); return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (plus || 0), hm[0], hm[1]); };
    for (const p of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) { if (at(p) > now) return { name: p, at: at(p) }; }
    return { name: 'Fajr', at: at('Fajr', 1), tomorrow: true };
  }
  function renderPrayer() {
    const list = $('pt-list');
    list.innerHTML = '';
    if (!st.times) {
      $('pt-next').hidden = true;
      $('pt-place').textContent = 'Add your city below';
      $('tb-next').textContent = 'Add your city for prayer times';
      $('pt-form').classList.remove('is-set');
      return;
    }
    $('pt-form').classList.add('is-set');
    $('pt-place').textContent = st.times.place;
    const nx = nextPrayer();
    PRAYERS.forEach(p => {
      const li = document.createElement('li');
      if (nx && !nx.tomorrow && nx.name === p) li.className = 'is-next';
      if (p === 'Sunrise') li.classList.add('is-sunrise');
      const a = document.createElement('span'); a.textContent = p;
      const b = document.createElement('b'); b.textContent = st.times.t[p];
      li.append(a, b);
      list.appendChild(li);
    });
    tickPrayer();
  }
  function tickPrayer() {
    const nx = nextPrayer();
    if (!nx) return;
    const s = Math.max(0, Math.round((nx.at - new Date()) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60);
    const left = (hh ? hh + 'h ' : '') + mm + 'm';
    const changedName = $('pt-next-name').textContent && $('pt-next-name').textContent !== nx.name;
    $('pt-next').hidden = false;
    $('pt-next-name').textContent = nx.name;
    $('pt-next-count').textContent = 'in ' + left;
    $('tb-next').textContent = nx.name + ' in ' + left;
    if (changedName) renderPrayer();
  }
  setInterval(() => { if (st.times) tickPrayer(); }, 20000);

  /* ---------- Deep work timer (logs focused time) ---------- */
  (function () {
    const timeEl = $('t-time'), ring = $('t-ring'), startBtn = $('t-start'), msg = $('t-msg');
    const chips = document.querySelectorAll('.t-chip');
    let length = 25 * 60, left = length, timer = null, endAt = 0, segStart = 0;
    const fmt = n => pad(Math.floor(n / 60)) + ':' + pad(n % 60);
    const draw = () => {
      timeEl.textContent = fmt(left);
      ring.style.strokeDashoffset = 100 - (left / length * 100);
      document.title = timer ? fmt(left) + ' focus | Adah' : 'Adah | Focus is a form of worship';
    };
    const logSegment = () => {
      if (!segStart) return;
      const secs = Math.round((Date.now() - segStart) / 1000);
      segStart = 0;
      if (secs > 0) { day(todayK()).focusSec += secs; changed(); }
    };
    const stop = () => { clearInterval(timer); timer = null; logSegment(); };
    const tick = () => {
      left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      if (left === 0) {
        stop();
        const rec = day(todayK());
        rec.sessions += 1;
        if (length >= 25 * 60 && rec.anchors.indexOf('deep') < 0) rec.anchors.push('deep');
        changed();
        left = length;
        startBtn.textContent = 'Start again';
        msg.textContent = 'Session complete, alhamdulillah. Stand up, stretch, or make wudu before the next block.';
      }
      draw();
    };
    startBtn.addEventListener('click', () => {
      if (timer) { stop(); startBtn.textContent = 'Resume'; msg.textContent = 'Paused. Your focused minutes are saved.'; draw(); return; }
      endAt = Date.now() + left * 1000;
      segStart = Date.now();
      timer = setInterval(tick, 500);
      startBtn.textContent = 'Pause';
      msg.textContent = 'You are in a focus block. Notifications can wait.';
      draw();
    });
    $('t-reset').addEventListener('click', () => {
      stop();
      left = length;
      startBtn.textContent = 'Start focus';
      msg.textContent = 'Phone in another room. One task. Begin with Bismillah.';
      draw();
    });
    chips.forEach(c => c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('is-on'));
      c.classList.add('is-on');
      stop();
      length = left = Number(c.dataset.min) * 60;
      startBtn.textContent = 'Start focus';
      draw();
    }));
    window.addEventListener('beforeunload', () => { if (timer) logSegment(); });
    draw();
  })();
  const fmtMins = secs => { const m = Math.round(secs / 60); return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min'; };
  function renderTimerToday() {
    const r = peek(todayK());
    $('t-today').textContent = r && r.focusSec ? fmtMins(r.focusSec) + ' focused today' : 'No focus time logged yet today';
  }

  /* ---------- Niyyah ---------- */
  function renderNiyyah() { const r = peek(todayK()); $('n-text').value = r ? r.niyyah || '' : ''; }
  $('n-save').addEventListener('click', () => {
    const v = $('n-text').value.trim();
    if (!v) { $('n-msg').textContent = 'Write one intention first, even a short one.'; $('n-text').focus(); return; }
    day(todayK()).niyyah = v;
    changed();
    $('n-msg').textContent = save() ? 'Saved. May Allah put barakah in it.' : 'Could not save in this browser.';
  });

  /* ---------- Daily anchors ---------- */
  const habitsEl = $('habits');
  ANCHORS.forEach(a => {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = a[0];
    const span = document.createElement('span');
    span.textContent = a[1];
    label.append(input, span);
    li.appendChild(label);
    habitsEl.appendChild(li);
  });
  const boxes = habitsEl.querySelectorAll('input');
  boxes.forEach(b => b.addEventListener('change', () => {
    day(todayK()).anchors = [...boxes].filter(x => x.checked).map(x => x.value);
    changed();
  }));
  function renderAnchors() {
    const r = peek(todayK());
    const done = r ? r.anchors : [];
    boxes.forEach(b => { b.checked = done.indexOf(b.value) >= 0; });
    $('h-bar').style.width = (done.length / ANCHORS.length * 100) + '%';
    $('h-count').textContent = done.length === ANCHORS.length
      ? 'All 5 done today, masha\u2019Allah'
      : done.length + ' of ' + ANCHORS.length + ' done today';
  }

  /* ---------- Qur'an reading ---------- */
  const goalSel = $('qr-goal');
  if (st.quranGoal) goalSel.value = st.quranGoal;
  goalSel.addEventListener('change', () => { st.quranGoal = Number(goalSel.value); changed(); });
  const weekSum = (start, field) => { let s = 0; for (let i = 0; i < 7; i++) { const r = peek(dkey(addDays(start, i))); if (r) s += field === 'anchors' ? r.anchors.length : (r[field] || 0); } return s; };
  $('qr-plus').addEventListener('click', () => { const r = day(todayK()); r.pages += 1; if (r.anchors.indexOf('quran') < 0) r.anchors.push('quran'); changed(); });
  $('qr-minus').addEventListener('click', () => { const r = day(todayK()); if (r.pages > 0) r.pages -= 1; changed(); });
  function renderQuran() {
    const goal = Number(goalSel.value);
    const wk = weekSum(mondayOf(new Date()), 'pages');
    const r = peek(todayK());
    const tp = r ? r.pages : 0;
    $('qr-today').textContent = tp;
    $('qr-today').nextSibling.textContent = tp === 1 ? ' page' : ' pages';
    $('qr-week').textContent = wk;
    $('qr-of').textContent = 'of ' + goal + ' pages this week';
    $('qr-ring').style.strokeDashoffset = 100 - Math.min(100, wk / goal * 100);
  }

  /* ---------- This week ---------- */
  let weekStart = mondayOf(new Date());
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function renderWeek() {
    const bars = $('wk-bars');
    bars.innerHTML = '';
    const end = addDays(weekStart, 6);
    const thisWeek = dkey(weekStart) === dkey(mondayOf(new Date()));
    $('wk-range').textContent = thisWeek ? 'This week' : weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' to ' + end.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    $('wk-title').textContent = thisWeek ? 'Your week' : 'That week';
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i), k = dkey(d), r = peek(k);
      const n = r ? r.anchors.length : 0;
      const col = document.createElement('button');
      col.className = 'wk-col' + (k === todayK() ? ' is-today' : '') + (i === 4 ? ' is-fri' : '');
      col.setAttribute('aria-label', d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ': ' + n + ' of 5 anchors' + (r && r.focusSec ? ', ' + fmtMins(r.focusSec) + ' focused' : ''));
      const track = document.createElement('span'); track.className = 'wk-track';
      const fill = document.createElement('span'); fill.className = 'wk-fill'; fill.style.height = (n / 5 * 100) + '%';
      track.appendChild(fill);
      const lab = document.createElement('span'); lab.className = 'wk-day'; lab.textContent = i === 4 ? 'Jumu\u2019ah' : DOW[i];
      const num = document.createElement('span'); num.className = 'wk-num'; num.textContent = d.getDate();
      col.append(track, lab, num);
      col.addEventListener('click', () => { selectDay(k, true); });
      bars.appendChild(col);
    }
    const focus = weekSum(weekStart, 'focusSec');
    $('wk-focus').textContent = focus ? fmtMins(focus) : '0 min';
    $('wk-anch').textContent = Math.round(weekSum(weekStart, 'anchors') / 35 * 100) + '%';
    $('wk-pages').textContent = weekSum(weekStart, 'pages');
    $('wk-next').disabled = thisWeek;
    renderReflection();
  }
  $('wk-prev').addEventListener('click', () => { weekStart = addDays(weekStart, -7); renderWeek(); });
  $('wk-next').addEventListener('click', () => { weekStart = addDays(weekStart, 7); renderWeek(); });

  /* ---------- Weekly muhasabah ---------- */
  function renderReflection() {
    const w = data.weeks[dkey(weekStart)] || {};
    $('rf-good').value = w.good || '';
    $('rf-next').value = w.next || '';
    $('rf-week').textContent = 'Week of ' + weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
    $('rf-msg').textContent = '';
  }
  $('rf-save').addEventListener('click', () => {
    data.weeks[dkey(weekStart)] = { good: $('rf-good').value.trim(), next: $('rf-next').value.trim() };
    changed();
    $('rf-msg').textContent = 'Reflection saved for this week.';
  });

  /* ---------- Hero widgets reflect real progress ---------- */
  function renderHero() {
    const dots = document.querySelectorAll('.w-habit .dots i');
    const today = new Date();
    let any = false;
    for (let i = 0; i < 7; i++) { const r = peek(dkey(addDays(today, i - 6))); if (r && r.anchors.length) any = true; }
    if (any && dots.length === 7) {
      dots.forEach((dot, i) => {
        const r = peek(dkey(addDays(today, i - 6)));
        const on = r && r.anchors.indexOf('fajr') >= 0;
        dot.className = on ? 'on' : (i === 6 ? 'today' : '');
      });
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const r = peek(dkey(addDays(today, -i)));
        if (r && r.anchors.indexOf('fajr') >= 0) streak++;
        else if (i > 0) break;
      }
      $('hero-streak').textContent = streak === 1 ? '1-day streak' : streak + '-day streak';
    }
    const r = peek(todayK());
    if (r && r.niyyah) $('hero-niyyah').textContent = r.niyyah.length > 60 ? r.niyyah.slice(0, 57) + '\u2026' : r.niyyah;
  }

  /* ---------- Month calendar ---------- */
  let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selected = todayK();
  function renderCalendar() {
    const grid = $('cal-days');
    grid.innerHTML = '';
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    $('cal-title').textContent = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const h1 = hijri(first), h2 = hijri(last);
    $('cal-hijri').textContent = h1 && h2 ? (h1.month === h2.month ? h1.month + ' ' + h1.year + ' AH' : h1.month + (h1.year !== h2.year ? ' ' + h1.year : '') + ' to ' + h2.month + ' ' + h2.year + ' AH') : '';
    const lead = (first.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) { const e = document.createElement('span'); e.className = 'cal-empty'; grid.appendChild(e); }
    for (let dnum = 1; dnum <= last.getDate(); dnum++) {
      const d = new Date(y, m, dnum), k = dkey(d), r = peek(k), h = hijri(d);
      const n = r ? r.anchors.length : 0;
      const b = document.createElement('button');
      b.className = 'cal-day lv' + n + (k === todayK() ? ' is-today' : '') + (k === selected ? ' is-sel' : '');
      b.setAttribute('aria-label', d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + n + ' of 5 anchors');
      const g = document.createElement('span'); g.className = 'cd-g'; g.textContent = dnum;
      b.appendChild(g);
      if (h) { const hs = document.createElement('span'); hs.className = 'cd-h'; hs.textContent = h.day; b.appendChild(hs); }
      const marks = document.createElement('span'); marks.className = 'cd-marks';
      dayNotes(d).forEach(nt => { if (nt[0] !== 'jumuah') { const i = document.createElement('i'); i.className = 'mk-' + nt[0]; marks.appendChild(i); } });
      b.appendChild(marks);
      b.addEventListener('click', () => selectDay(k, false));
      grid.appendChild(b);
    }
  }
  function selectDay(k, scroll) {
    selected = k;
    const d = parseK(k);
    if (d.getMonth() !== calMonth.getMonth() || d.getFullYear() !== calMonth.getFullYear()) calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    renderCalendar();
    renderDetail();
    if (scroll) $('calendar').scrollIntoView({ behavior: 'smooth' });
  }
  function renderDetail() {
    const d = parseK(selected), r = peek(selected), h = hijri(d);
    $('cd-date').textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('cd-hijri').textContent = h ? h.text : '';
    const notes = $('cd-notes');
    notes.innerHTML = '';
    dayNotes(d).forEach(nt => { const li = document.createElement('li'); li.className = 'nt-' + nt[0]; li.textContent = nt[1]; notes.appendChild(li); });
    const list = $('cd-anchors');
    list.innerHTML = '';
    ANCHORS.forEach(a => {
      const li = document.createElement('li');
      const done = r && r.anchors.indexOf(a[0]) >= 0;
      li.className = done ? 'is-done' : '';
      li.textContent = a[1];
      list.appendChild(li);
    });
    $('cd-focus').textContent = r && r.focusSec ? fmtMins(r.focusSec) : '0 min';
    const pg = r ? r.pages : 0;
    $('cd-pages').textContent = pg + (pg === 1 ? ' page' : ' pages');
    $('cd-niyyah').textContent = r && r.niyyah ? '\u201C' + r.niyyah + '\u201D' : (selected > todayK() ? 'This day is still ahead of you.' : 'No niyyah saved for this day.');
  }
  $('cal-prev').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCalendar(); });
  $('cal-next').addEventListener('click', () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCalendar(); });
  $('cal-today').addEventListener('click', () => selectDay(todayK(), false));

  /* ---------- Wire up ---------- */
  listeners.push(renderTimerToday, renderAnchors, renderQuran, renderWeekBarsOnly, renderCalendar, renderDetail, renderHero);
  function renderWeekBarsOnly() {
    const keep = [$('rf-good').value, $('rf-next').value];
    renderWeek();
    $('rf-good').value = keep[0];
    $('rf-next').value = keep[1];
  }
  renderTodayBar();
  renderGreeting();
  renderPrayer();
  renderTimerToday();
  renderNiyyah();
  renderAnchors();
  renderQuran();
  renderWeek();
  renderCalendar();
  renderDetail();
  renderHero();
  if (st.times && st.times.date !== todayK()) { const q = savedPlace(); if (q) fetchTimes(q); }
  // Roll over to a new day if the page stays open past midnight
  let lastDay = todayK();
  setInterval(() => {
    if (todayK() !== lastDay) {
      lastDay = todayK();
      renderTodayBar(); renderNiyyah(); listeners.forEach(f => f());
      const q = savedPlace(); if (q) fetchTimes(q);
    }
  }, 60000);
})();
