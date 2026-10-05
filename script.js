/* ---------- Nav ---------- */
const nav = document.querySelector('.nav');
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.textContent = open ? 'Close' : 'Menu';
});
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', false);
  menuBtn.textContent = 'Menu';
}));
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
document.getElementById('yr').textContent = new Date().getFullYear();

/* ---------- Prayer day arc ---------- */
const prayers = [
  { name: 'Fajr', deg: -4, when: 'Before sunrise',
    text: 'Start the day with Allah before your feed. The first input of the morning decides the shape of everything after it.' },
  { name: 'Dhuhr', deg: 96, when: 'Midday',
    text: 'Step away from the screen and reset. Return to your work with one clear priority for the afternoon.' },
  { name: 'Asr', deg: 140, when: 'Afternoon',
    text: 'The afternoon slump is real. Asr is your built-in check-in: what did you finish, and what deserves your last focused hour?' },
  { name: 'Maghrib', deg: 168, when: 'Sunset',
    text: 'Close the workday. Be present with family. Rest is part of your design, not a failure of discipline.' },
  { name: 'Isha', deg: 184, when: 'Night',
    text: '"He made the night for rest." Put the phone down, review your day, and protect tomorrow\u2019s Fajr.' }
];
const nodesEl = document.getElementById('nodes');
const arcFill = document.getElementById('arc-fill');
const W = 400, H = 220, CX = 200, CY = 190, R = 180;

prayers.forEach((p, i) => {
  const rad = p.deg * Math.PI / 180;
  const x = CX - R * Math.cos(rad);
  const y = CY - R * Math.sin(rad);
  const b = document.createElement('button');
  b.className = 'node' + (p.deg < 0 || p.deg > 180 ? ' below' : p.deg > 150 ? ' side' : '');
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', 'false');
  b.style.setProperty('--x', (x / W * 100) + '%');
  b.style.setProperty('--y', (y / H * 100) + '%');
  b.innerHTML = '<span>' + p.name + '</span>';
  b.addEventListener('click', () => selectPrayer(i));
  b.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = (i + (e.key === 'ArrowRight' ? 1 : prayers.length - 1)) % prayers.length;
      selectPrayer(n); nodesEl.children[n].focus();
    }
  });
  nodesEl.appendChild(b);
});

function selectPrayer(i) {
  [...nodesEl.children].forEach((b, j) => {
    b.setAttribute('aria-selected', j === i);
    b.tabIndex = j === i ? 0 : -1;
  });
  const p = prayers[i];
  document.getElementById('day-when').textContent = p.name + ', ' + p.when.toLowerCase();
  document.getElementById('day-text').textContent = p.text;
  const pct = Math.max(0, Math.min(100, p.deg / 180 * 100));
  arcFill.style.strokeDashoffset = 100 - pct;
}
selectPrayer(0);
// One orchestrated moment: the day draws itself to Dhuhr shortly after load
setTimeout(() => selectPrayer(1), 700);

/* ---------- Reframe ---------- */
const reframes = [
  { big: 'I want to feel in control of my day.',
    step: 'Start with the first hour. Keep your phone out of reach until after Fajr and your morning adhkar. One protected hour sets the tone for the rest.' },
  { big: 'I want to produce work I\u2019m proud of.',
    step: 'Pick one task and give it 90 minutes with your phone in another room. Make your niyyah before you begin.' },
  { big: 'I want to feel like a disciplined person.',
    step: 'Build the system, not just the willpower. Attach one small habit to a prayer you already pray, and keep it for 30 days.' },
  { big: 'I want my habits to reflect my values.',
    step: 'Look at your screen time next to your dua list. Where they don\u2019t match is where to begin, gently.' },
  { big: 'I want a clear, Islamic framework I can trust.',
    step: 'Start with the Islamic Dopamine Check below. Two minutes, and you\u2019ll know exactly where to focus first.' }
];
const says = document.querySelectorAll('.say');
says.forEach(btn => btn.addEventListener('click', () => {
  says.forEach(b => b.classList.remove('is-active'));
  btn.classList.add('is-active');
  const r = reframes[btn.dataset.k];
  document.getElementById('means-big').textContent = r.big;
  document.getElementById('means-step').textContent = r.step;
}));

/* ---------- Islamic Dopamine Check ---------- */
const questions = [
  { area: 'Mornings', q: 'I reach for my phone within a few minutes of waking up.',
    tip: 'Charge your phone outside the bedroom and give your first 30 minutes to Fajr and adhkar.' },
  { area: 'Salah', q: 'My mind drifts to notifications or content while I pray.',
    tip: 'Put your phone on silent before wudu, and slow down your first two rak\u2019ahs. Khushu\u2019 is trained, not found.' },
  { area: 'The scroll', q: 'I open an app "for a minute" and lose much longer.',
    tip: 'Move distracting apps off your home screen and set a daily limit. Make the scroll take effort.' },
  { area: 'Deep work', q: 'I switch tasks before finishing a focused stretch of work.',
    tip: 'Work in one 90-minute block with a single task and a written niyyah. Let the next prayer be your break.' },
  { area: 'Stillness', q: 'Quiet moments feel uncomfortable unless something is playing.',
    tip: 'Take five minutes of silent dhikr after one prayer each day. Let your mind get used to stillness again.' },
  { area: 'Intention', q: 'My daily habits don\u2019t match the goals I make dua for.',
    tip: 'Write down one dua you make often, then one small action this week that moves you toward it.' },
  { area: 'Nights', q: 'I sleep later than I planned because I kept scrolling.',
    tip: 'Set a phone curfew after Isha. Protect tonight\u2019s sleep to protect tomorrow\u2019s Fajr.' },
  { area: 'Reading', q: 'It\u2019s hard to read a book or the Qur\u2019an for more than a few minutes.',
    tip: 'Read one page of Qur\u2019an after Fajr with no device nearby. Grow it slowly; consistency beats length.' }
];
const scale = ['Rarely', 'Sometimes', 'Often', 'Almost always'];
let qi = 0;
const answers = new Array(questions.length).fill(null);

const qText = document.getElementById('q-text');
const qOpts = document.getElementById('q-opts');
const qCount = document.getElementById('q-count');
const qBar = document.getElementById('q-bar');
const qBack = document.getElementById('q-back');
const quiz = document.getElementById('quiz');
const result = document.getElementById('result');

function renderQ() {
  const item = questions[qi];
  qCount.textContent = 'Question ' + (qi + 1) + ' of ' + questions.length;
  qBar.style.width = (qi / questions.length * 100) + '%';
  qText.textContent = item.q;
  qOpts.innerHTML = '';
  scale.forEach((label, v) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', answers[qi] === v);
    b.textContent = label;
    b.addEventListener('click', () => choose(v, b));
    qOpts.appendChild(b);
  });
  qBack.disabled = qi === 0;
}

function choose(v, btn) {
  answers[qi] = v;
  qOpts.querySelectorAll('.opt').forEach(o => o.setAttribute('aria-checked', o === btn));
  setTimeout(() => {
    if (qi < questions.length - 1) { qi++; renderQ(); qOpts.firstChild.focus(); }
    else showResult();
  }, 220);
}

qBack.addEventListener('click', () => { if (qi > 0) { qi--; renderQ(); } });

function showResult() {
  const total = answers.reduce((a, b) => a + b, 0);
  const max = questions.length * 3;
  let title, text;
  if (total <= max * 0.3) {
    title = 'Well calibrated';
    text = 'Your focus is largely yours, alhamdulillah. Now protect it. Keep your strongest habits steady and sharpen the one area below.';
  } else if (total <= max * 0.6) {
    title = 'Drifting, and ready to recalibrate';
    text = 'Your intentions are strong, but your attention is leaking in a few clear places. Small, specific changes here will make a big difference within weeks.';
  } else {
    title = 'Your focus needs recalibration';
    text = 'You\u2019re not lazy and you\u2019re not broken. Your attention has been pulled by systems designed to pull it. The good news: the fix starts with just two areas.';
  }
  const ranked = questions
    .map((q, i) => ({ ...q, v: answers[i] }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2);
  document.getElementById('r-title').textContent = title;
  document.getElementById('r-text').textContent = text;
  document.getElementById('r-leaks').innerHTML = ranked
    .map(l => '<div class="leak"><b>' + l.area + '</b><p>' + l.tip + '</p></div>')
    .join('');
  qBar.style.width = '100%';
  quiz.hidden = true;
  result.hidden = false;
  result.focus();
}

document.getElementById('q-restart').addEventListener('click', () => {
  answers.fill(null); qi = 0;
  result.hidden = true; quiz.hidden = false;
  renderQ(); qOpts.firstChild.focus();
});
renderQ();

/* ---------- Newsletter (front-end only) ---------- */
document.getElementById('sub-form').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('email');
  const msg = document.getElementById('sub-msg');
  if (!/^\S+@\S+\.\S+$/.test(input.value.trim())) {
    msg.textContent = 'Enter a valid email address, like name@example.com.';
    input.focus();
    return;
  }
  // Connect your email provider here (Mailchimp, ConvertKit, Beehiiv, Formspree...)
  msg.textContent = 'You\u2019re in. Your first letter arrives this Friday, in sha Allah.';
  input.value = '';
});

/* ---------- Hero widget: live ticking focus timer ---------- */
(function () {
  const el = document.getElementById('hero-time');
  const ring = document.getElementById('hero-ring');
  if (!el) return;
  let left = 47 * 60 + 12;
  const total = 90 * 60;
  const draw = () => {
    const m = Math.floor(left / 60), s = left % 60;
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    ring.style.strokeDashoffset = 100 - (left / total * 100);
  };
  draw();
  setInterval(() => { left = left > 0 ? left - 1 : total; draw(); }, 1000);
})();

/* ---------- Toolkit: deep work timer ---------- */
(function () {
  const timeEl = document.getElementById('t-time');
  if (!timeEl) return;
  const ring = document.getElementById('t-ring');
  const startBtn = document.getElementById('t-start');
  const msg = document.getElementById('t-msg');
  const chips = document.querySelectorAll('.chip');
  let length = 25 * 60, left = length, timer = null, endAt = 0;
  const fmt = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const draw = () => {
    timeEl.textContent = fmt(left);
    ring.style.strokeDashoffset = 100 - (left / length * 100);
    document.title = timer ? fmt(left) + ' focus | Adah' : 'Adah | Focus is a form of worship';
  };
  const stop = () => { clearInterval(timer); timer = null; startBtn.textContent = left < length ? 'Resume' : 'Start focus'; draw(); };
  const tick = () => {
    left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
    if (left === 0) {
      stop();
      startBtn.textContent = 'Start again';
      left = length;
      msg.textContent = 'Session complete, alhamdulillah. Stand up, stretch, or make wudu before the next block.';
      draw();
      return;
    }
    draw();
  };
  startBtn.addEventListener('click', () => {
    if (timer) { stop(); msg.textContent = 'Paused. Come back when you are ready.'; return; }
    endAt = Date.now() + left * 1000;
    timer = setInterval(tick, 500);
    startBtn.textContent = 'Pause';
    msg.textContent = 'You are in a focus block. Notifications can wait.';
    draw();
  });
  document.getElementById('t-reset').addEventListener('click', () => {
    clearInterval(timer); timer = null; left = length;
    startBtn.textContent = 'Start focus';
    msg.textContent = 'Phone in another room. One task. Begin with Bismillah.';
    draw();
  });
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('is-on'));
    c.classList.add('is-on');
    clearInterval(timer); timer = null;
    length = left = Number(c.dataset.min) * 60;
    startBtn.textContent = 'Start focus';
    draw();
  }));
  draw();
})();

/* ---------- Toolkit: niyyah and daily anchors (saved on this device) ---------- */
(function () {
  const today = new Date().toISOString().slice(0, 10);
  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  const dateEl = document.getElementById('n-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const nText = document.getElementById('n-text');
  const nMsg = document.getElementById('n-msg');
  const savedN = load('adah-niyyah');
  if (savedN && savedN.date === today) nText.value = savedN.text;
  document.getElementById('n-save').addEventListener('click', () => {
    if (!nText.value.trim()) { nMsg.textContent = 'Write one intention first, even a short one.'; nText.focus(); return; }
    nMsg.textContent = save('adah-niyyah', { date: today, text: nText.value.trim() })
      ? 'Saved. May Allah put barakah in it.'
      : 'Could not save on this browser, but keep it in mind today.';
  });

  const boxes = document.querySelectorAll('#habits input');
  const bar = document.getElementById('h-bar');
  const count = document.getElementById('h-count');
  const savedH = load('adah-habits');
  const done = savedH && savedH.date === today ? savedH.done : [];
  boxes.forEach(b => { b.checked = done.includes(b.value); });
  const update = () => {
    const on = [...boxes].filter(b => b.checked).map(b => b.value);
    bar.style.width = (on.length / boxes.length * 100) + '%';
    count.textContent = on.length === boxes.length
      ? 'All 5 done today. Keep the streak going tomorrow.'
      : on.length + ' of ' + boxes.length + ' done today';
    save('adah-habits', { date: today, done: on });
  };
  boxes.forEach(b => b.addEventListener('change', update));
  update();
})();
