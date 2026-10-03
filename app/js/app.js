// App logic: state, booklet pages, check-in and stamps. Depends on data.js.
const KEY = 'qld-parks-passport-v1';
const SAMPLES = {
  lamington:{date:'2026-03-14', acts:[0,1], photo:null, with:'Two classmates', note:'Mist on the Border Track all morning. We heard whipbirds the whole way.', sample:true},
  noosa:{date:'2026-05-02', acts:[0], photo:null, sample:true},
  girraween:{date:'2026-09-06', acts:[0], photo:null, sample:true}
};
let visits = load();
// ---- Accounts (demo only: stored in this browser, no password, no server) ----
const ACC_KEY = KEY + '-accounts-v1';
const DEMO_USERS = {
  mali:{email:'mali@example.com', demo:true, visits:{
    daintree:{date:'2026-07-18', acts:[0,1], photo:null, with:'@tomq', note:'Mossman Gorge water was freezing. Worth it.', public:true},
    noosa:{date:'2026-08-30', acts:[0,1], photo:null, with:'', note:'Counted four koalas near Tea Tree Bay.', public:true}}},
  tomq:{email:'tomq@example.com', demo:true, visits:{
    kgari:{date:'2026-08-09', acts:[0,2], photo:null, with:'', note:'Lake McKenzie before the tour buses arrived.', public:true},
    daintree:{date:'2026-07-18', acts:[], photo:null, with:'@mali', note:'', public:false, taggedBy:'mali'}}}
};
let accounts = {users:{}, current:null};
try { const raw = localStorage.getItem(ACC_KEY); if (raw) accounts = JSON.parse(raw); } catch(e){}
for (const u in DEMO_USERS) if (!accounts.users[u]) accounts.users[u] = JSON.parse(JSON.stringify(DEMO_USERS[u]));
if (accounts.current && accounts.users[accounts.current]) visits = accounts.users[accounts.current].visits; else accounts.current = null;
let feedUser = null;
const TAG_RE = /@([a-z0-9_]{3,20})/gi;
function saveAccounts(){ try { localStorage.setItem(ACC_KEY, JSON.stringify(accounts)); } catch(e){} }
function signIn(u){ accounts.current = u; visits = accounts.users[u].visits; saveAccounts(); render(); if ($('#dlg').open) $('#dlg').close(); toast('Signed in as @' + u); }
function signOut(){ accounts.current = null; saveAccounts(); visits = load(); render(); toast('Signed out'); }
// Give every tagged friend the same park stamp. Returns the usernames that received a new stamp.
function applyTags(id, withStr, date, photo){
  const gave = [], me = accounts.current;
  if (!me) return gave;
  for (const m of withStr.matchAll(TAG_RE)){
    const u = m[1].toLowerCase(), usr = accounts.users[u];
    if (!usr || u === me || usr.visits[id]) continue;
    usr.visits[id] = {date, acts:[], photo, with:'@' + me, note:'', public:false, taggedBy:me};
    gave.push(u);
  }
  return gave;
}
function tagHTML(str){ return esc(str).replace(TAG_RE, (m, u) => accounts.users[u.toLowerCase()] ? '<button type="button" class="ulink" data-user="' + u.toLowerCase() + '">@' + u.toLowerCase() + '</button>' : m); }
function renderAcct(){
  $('#acct').innerHTML = accounts.current
    ? '<span>Signed in as <b>@' + esc(accounts.current) + '</b></span><button class="btn ghost small" id="signOut">Sign out</button>'
    : '<button class="btn ghost small" id="signIn">Sign in or create account</button><span class="muted">Sign in to tag friends and post publicly.</span>';
}
function openAuth(){
  $('#dlgBody').innerHTML = '<div class="dlg-head"><div><span class="eyebrow">Account</span><h2 id="dlgTitle">Sign in or sign up</h2></div><button class="x" id="dlgClose" aria-label="Close">✕</button></div>' +
    '<form id="auth" class="sec" novalidate><div class="form">' +
    '<label class="field"><span>Email</span><input type="email" id="authEmail" autocomplete="email" placeholder="you@example.com"></label>' +
    '<label class="field"><span>Username (new accounts only)</span><input type="text" id="authUser" maxlength="20" placeholder="for example ploy_hikes"></label>' +
    '</div><p class="err" id="authErr" hidden></p><div class="actions" style="margin-top:12px"><button class="btn" type="submit">Continue</button></div></form>' +
    '<p class="muted">An email that already has an account signs you in. A new email creates an account with the username, and the stamps already in this passport move into it.</p>' +
    '<div class="sec"><h3>Demo accounts to try</h3><div class="actions">' + Object.keys(accounts.users).filter(u => accounts.users[u].demo).map(u => '<button type="button" class="btn ghost small" data-demo="' + u + '">@' + u + '</button>').join('') + '</div></div>' +
    '<p class="muted">Demo sign-in. There is no password and nothing leaves this browser. A real app needs a server, email verification and sign-in with Google or Apple.</p>';
  const dlg = $('#dlg'); if (!dlg.open) dlg.showModal();
  $('#dlgClose').onclick = () => dlg.close();
  $('#auth').onsubmit = ev => {
    ev.preventDefault();
    const err = $('#authErr'), fail = m => { err.textContent = m; err.hidden = false; };
    const email = $('#authEmail').value.trim().toLowerCase(), name = $('#authUser').value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Enter a valid email address, like you@example.com.');
    const existing = Object.keys(accounts.users).find(u => accounts.users[u].email === email);
    if (existing) return signIn(existing);
    if (!/^[a-z0-9_]{3,20}$/.test(name)) return fail('Choose a username of 3 to 20 characters. Use letters, numbers or underscores.');
    if (accounts.users[name]) return fail('@' + name + ' is taken. Try another username.');
    accounts.users[name] = {email, visits};
    signIn(name);
  };
}
function renderFeed(){
  const posts = [];
  for (const u in accounts.users) for (const id in accounts.users[u].visits){
    const v = accounts.users[u].visits[id];
    if (v.public && parkById[id] && (!feedUser || feedUser === u)) posts.push({u, p:parkById[id], v});
  }
  posts.sort((a, b) => a.v.date < b.v.date ? 1 : -1);
  return '<div class="pages"><div class="feed-head"><div><h2 class="feed-title">' + (feedUser ? 'Posts by @' + esc(feedUser) : 'Community posts') + '</h2>' +
    '<span class="muted">Visits that travellers chose to share. Private visits never appear here.</span></div>' +
    (feedUser ? '<button class="btn ghost small" id="feedAll">Show everyone</button>' : '') + '</div>' +
    (posts.length ? '' : '<div class="none">No public posts yet. Tick "Share this visit on the public feed" when you check in.</div>') +
    '<div class="feed">' + posts.map(({u, p, v}) =>
      '<article class="post"><header class="post-head"><span class="avatar" style="background:var(--ink-' + regionById[p.region].ink + ')">' + esc(u[0]) + '</span>' +
      '<div><button type="button" class="ulink" data-user="' + u + '">@' + esc(u) + '</button><br><span class="muted">' + niceDate(v.date) + ' at <button type="button" class="ulink" data-park="' + p.id + '">' + esc(p.name) + '</button></span></div>' +
      '<div class="post-stamp">' + stampSVG(p, v) + '</div></header>' +
      (v.photo ? '<img class="snap" src="' + v.photo + '" alt="Photo by @' + esc(u) + ' at ' + esc(p.name) + '">' : parkArt(p)) +
      (v.note ? '<p class="post-note">' + esc(v.note) + '</p>' : '') +
      (v.with ? '<p class="muted">With ' + tagHTML(v.with) + '</p>' : '') +
      (accounts.users[u].demo ? '<div><span class="pill">Demo post</span></div>' : '') + '</article>').join('') +
    '</div></div>';
}

let tab = 'passport', regionFilter = 'all', query = '', justStamped = null;
let bookPos = 1;
let holder = '';
try { holder = localStorage.getItem(KEY + '-name') || ''; } catch(e){}
const twoUp = window.matchMedia('(min-width: 760px)');
const MILESTONES = ['g-ten','g-25','g-all'];

function load(){
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch(e){}
  return JSON.parse(JSON.stringify(SAMPLES));
}
function save(){ if (accounts.current) return saveAccounts(); try { localStorage.setItem(KEY, JSON.stringify(visits)); } catch(e){} }

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function parts(iso){ const [y,m,d] = iso.split('-').map(Number); return {y,m,d}; }
function niceDate(iso){ const {y,m,d} = parts(iso); return d + ' ' + MON[m-1][0] + MON[m-1].slice(1).toLowerCase() + ' ' + y; }
function todayISO(){ const t = new Date(); return t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0'); }
function hash(s){ let h = 0; for (const c of s) h = (h*31 + c.charCodeAt(0)) | 0; return h; }

function visitedParks(){ return PARKS.filter(p => visits[p.id]); }
function parkSecretEarned(p){
  const v = visits[p.id]; if (!v || !p.secret) return false;
  if (p.secret.m) return p.secret.m.includes(parts(v.date).m);
  return (v.acts || []).includes(p.secret.a);
}
function allSecrets(){
  const vp = visitedParks();
  const park = PARKS.filter(p => p.secret).map(p => ({id:'s-'+p.id, n:p.secret.n, h:p.secret.h, where:p.name, got:parkSecretEarned(p)}));
  const glob = GLOBAL_SECRETS.map(s => ({id:s.id, n:s.n, h:s.h, where:'Any park', got:s.test(vp)}));
  return glob.concat(park);
}
function earnedIds(){ return allSecrets().filter(s => s.got).map(s => s.id); }

function stampSVG(p, v, cls){
  const ink = 'var(--ink-' + regionById[p.region].ink + ')';
  const rot = (Math.abs(hash(p.id)) % 17) - 8;
  const d = parts(v.date);
  return '<svg viewBox="0 0 100 100" role="img" aria-label="Stamp for ' + esc(p.name) + ', ' + niceDate(v.date) + '">' +
    '<g class="stamp ' + (cls||'') + '"><g transform="rotate(' + rot + ' 50 50)" fill="none" stroke="' + ink + '">' +
    '<circle cx="50" cy="50" r="47.5" stroke-width="2.2"/><circle cx="50" cy="50" r="30" stroke-width="1"/>' +
    '<circle cx="9.5" cy="52" r="1.4" fill="' + ink + '" stroke="none"/><circle cx="90.5" cy="52" r="1.4" fill="' + ink + '" stroke="none"/>' +
    '<text fill="' + ink + '" stroke="none" font-size="' + (p.label.length > 17 ? 7 : 8.4) + '" text-anchor="middle"><textPath href="#arcT" startOffset="50%">' + esc(p.label) + '</textPath></text>' +
    '<text fill="' + ink + '" stroke="none" font-size="6.2" text-anchor="middle"><textPath href="#arcB" startOffset="50%">QUEENSLAND NATIONAL PARK</textPath></text>' +
    '<text class="date" x="50" y="48" fill="' + ink + '" stroke="none" font-size="11" text-anchor="middle">' + String(d.d).padStart(2,'0') + ' ' + MON[d.m-1] + '</text>' +
    '<text class="date" x="50" y="60" fill="' + ink + '" stroke="none" font-size="9" text-anchor="middle">' + d.y + '</text>' +
    '</g></g></svg>';
}
function emptySVG(){
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="empty-ring" cx="50" cy="50" r="46"/></svg>';
}
function secretSVG(s){
  if (!s.got) return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle class="empty-ring" cx="50" cy="50" r="46"/><text class="empty-q" x="50" y="59" text-anchor="middle">?</text></svg>';
  const ink = 'var(--secret)';
  const rot = (Math.abs(hash(s.id)) % 15) - 7;
  let star = '';
  for (let i = 0; i < 10; i++){ const r = i % 2 ? 6 : 14, a = Math.PI * i / 5 - Math.PI / 2; star += (50 + r*Math.cos(a)).toFixed(1) + ',' + (50 + r*Math.sin(a)).toFixed(1) + ' '; }
  return '<svg viewBox="0 0 100 100" role="img" aria-label="Secret stamp: ' + esc(s.n) + '"><g class="stamp"><g transform="rotate(' + rot + ' 50 50)" fill="none" stroke="' + ink + '">' +
    '<circle cx="50" cy="50" r="47.5" stroke-width="2.2" stroke-dasharray="5 2.5"/><circle cx="50" cy="50" r="30" stroke-width="1"/>' +
    '<text fill="' + ink + '" stroke="none" font-size="' + (s.n.length > 15 ? 7.4 : 8.4) + '" text-anchor="middle"><textPath href="#arcT" startOffset="50%">' + esc(s.n.toUpperCase()) + '</textPath></text>' +
    '<text fill="' + ink + '" stroke="none" font-size="6.2" text-anchor="middle"><textPath href="#arcB" startOffset="50%">SECRET STAMP</textPath></text>' +
    '<polygon points="' + star + '" fill="' + ink + '" stroke="none"/></g></g></svg>';
}

function renderStats(){
  const vp = visitedParks(), sec = allSecrets();
  $('#stats').innerHTML =
    '<div class="stat"><b>' + vp.length + ' / ' + PARKS.length + '</b><span>Park stamps</span></div>' +
    '<div class="stat"><b>' + sec.filter(s => s.got).length + ' / ' + sec.length + '</b><span>Secret stamps</span></div>' +
    '<div class="stat"><b>' + new Set(vp.map(p => p.region)).size + ' / ' + REGIONS.length + '</b><span>Regions</span></div>';
  $('#sampleNotice').hidden = !Object.values(visits).some(v => v.sample);
}

// ---- Park photos from Wikipedia (lead image of each park article) ----
const WIKI_API = 'https://en.wikipedia.org/w/api.php?format=json&origin=*&action=query&redirects=1';
const PHOTO_KEY = KEY + '-photos-v1';
let wikiPhotos = {};
try { wikiPhotos = JSON.parse(localStorage.getItem(PHOTO_KEY) || '{}'); } catch(e){}
function wikiTitle(p){ return WIKI[p.id] || p.name.replace(/ \(.*\)$/, '') + ' National Park'; }
async function wikiQuery(params){ const r = await fetch(WIKI_API + '&' + params); if (!r.ok) throw new Error('Wikipedia ' + r.status); return r.json(); }
const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };
const isPhoto = name => name && !/\.svg$|map|locator|logo|icon/i.test(name);
const plain = html => String(html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const IMG = 'prop=pageimages&piprop=thumbnail%7Cname&pithumbsize=800&pilimit=50';
function takeImage(p, page){
  if (!page || !page.thumbnail || !isPhoto(page.pageimage)) return false;
  wikiPhotos[p.id] = {src:page.thumbnail.source, file:page.pageimage, credit:'', link:'https://en.wikipedia.org/wiki/' + encodeURIComponent(page.title.replace(/ /g, '_'))};
  return true;
}
async function loadWikiPhotos(){
  if (!USE_WIKIPEDIA_PHOTOS) return;
  const need = PARKS.filter(p => !PHOTOS[p.id] && !wikiPhotos[p.id]);
  if (!need.length) return;
  const missed = [];
  for (const group of chunk(need, 20)){
    const data = await wikiQuery(IMG + '&titles=' + encodeURIComponent(group.map(wikiTitle).join('|')));
    const q = data.query || {}, pages = Object.values(q.pages || {});
    for (const p of group){
      let t = wikiTitle(p);
      const n = (q.normalized || []).find(x => x.from === t); if (n) t = n.to;
      const rd = (q.redirects || []).find(x => x.from === t); if (rd) t = rd.to;
      if (!takeImage(p, pages.find(pg => pg.title === t))) missed.push(p);
    }
  }
  for (const p of missed){   // fall back to a search for the park name
    try {
      const data = await wikiQuery(IMG + '&generator=search&gsrlimit=3&gsrsearch=' + encodeURIComponent(wikiTitle(p) + ' Queensland'));
      const pages = Object.values((data.query || {}).pages || {}).sort((a, b) => a.index - b.index);
      pages.some(pg => takeImage(p, pg));
    } catch(e){}
  }
  const got = need.filter(p => wikiPhotos[p.id]);
  for (const group of chunk(got, 20)){   // author and licence for the credit line
    try {
      const data = await wikiQuery('prop=imageinfo&iiprop=extmetadata%7Curl&titles=' + encodeURIComponent(group.map(p => 'File:' + wikiPhotos[p.id].file).join('|')));
      const pages = Object.values((data.query || {}).pages || {});
      for (const p of group){
        const want = ('File:' + wikiPhotos[p.id].file).replace(/_/g, ' ');
        const pg = pages.find(x => x.title === want), ii = pg && pg.imageinfo && pg.imageinfo[0];
        if (!ii) continue;
        const m = ii.extmetadata || {};
        const artist = plain(m.Artist && m.Artist.value).slice(0, 60), lic = plain(m.LicenseShortName && m.LicenseShortName.value);
        wikiPhotos[p.id].credit = [artist, lic].filter(Boolean).join(', ');
        if (ii.descriptionurl) wikiPhotos[p.id].link = ii.descriptionurl;
      }
    } catch(e){}
  }
  try { localStorage.setItem(PHOTO_KEY, JSON.stringify(wikiPhotos)); } catch(e){}
  if (got.length && document.activeElement && document.activeElement.id !== 'holderName') render();
}

function buildPages(){
  const pages = [{type:'holder', key:'holder'}];
  REGIONS.forEach(r => {
    const ps = PARKS.filter(p => p.region === r.id);
    for (let i = 0; i < ps.length; i += 6) pages.push({type:'parks', region:r, all:ps, parks:ps.slice(i, i+6), key:i === 0 ? r.id : null});
  });
  pages.push({type:'rewards', key:'rewards'});
  const sec = allSecrets().filter(x => !MILESTONES.includes(x.id));
  for (let i = 0; i < sec.length; i += 6) pages.push({type:'secrets', items:sec.slice(i, i+6), key:i === 0 ? 'secrets' : null});
  if (pages.length % 2) pages.push({type:'blank'});
  PARKS.forEach((p, i) => pages.push({type:'parkL', park:p, key:i === 0 ? 'parkpages' : null}, {type:'parkR', park:p}));
  return pages;
}
function pageOfPark(id){ return buildPages().findIndex(pg => pg.type === 'parkL' && pg.park.id === id); }
function goPark(id){ tab = 'passport'; bookPos = pageOfPark(id); render(); $('#view').scrollIntoView({block:'start'}); }

function parkArt(p){
  if (PHOTOS[p.id]) return '<img class="art" src="' + esc(PHOTOS[p.id]) + '" alt="' + esc(p.name) + '">';
  const w = wikiPhotos[p.id];
  if (w) return '<figure class="artfig"><img class="art" src="' + esc(w.src) + '" alt="' + esc(p.name) + '" loading="lazy">' +
    '<figcaption class="credit">Photo: <a href="' + esc(w.link) + '" target="_blank" rel="noopener">' + esc(w.credit || 'see source') + '</a>, via Wikimedia Commons</figcaption></figure>';
  const h = Math.abs(hash(p.id)), ink = 'var(--ink-' + regionById[p.region].ink + ')';
  const ridge = (base, amp, seed) => { let d = 'M0 90 L0 ' + base; for (let k = 0; k <= 8; k++) d += ' L' + (k*15) + ' ' + (base - ((seed >> k) & 7) / 7 * amp).toFixed(1); return d + ' L120 90 Z'; };
  return '<svg class="art" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Placeholder illustration for ' + esc(p.name) + '">' +
    '<rect width="120" height="90" fill="' + ink + '" opacity=".12"/><circle cx="' + (25 + h % 70) + '" cy="' + (16 + h % 12) + '" r="8" fill="' + ink + '" opacity=".35"/>' +
    '<path d="' + ridge(52, 22, h) + '" fill="' + ink + '" opacity=".25"/><path d="' + ridge(66, 18, h >> 3) + '" fill="' + ink + '" opacity=".45"/><path d="' + ridge(80, 12, h >> 6) + '" fill="' + ink + '" opacity=".75"/></svg>';
}
function parkLeftHTML(p){
  const r = regionById[p.region], v = visits[p.id], no = String(PARKS.indexOf(p) + 1).padStart(2, '0');
  return parkArt(p) +
    '<div><span class="no">No. ' + no + ' · ' + esc(r.name) + '</span><h2 class="pname" style="color:var(--ink-' + r.ink + ')">' + esc(p.name) + '</h2><span class="muted">National Park, near ' + esc(p.town) + '</span></div>' +
    '<div class="sec"><h3>Things to do</h3><ul class="steps plain">' + p.acts.map((a, i) => '<li>' + (v && (v.acts || []).includes(i) ? '✓ ' : '○ ') + esc(a) + '</li>').join('') + '</ul></div>' +
    '<div class="actions"><button class="btn ghost small" data-details="' + p.id + '">Road map and events</button><button class="btn ghost small" data-jump="' + p.region + '">Stamp index</button></div>';
}
function parkRightHTML(p){
  const r = regionById[p.region], v = visits[p.id];
  return '<div class="leaf-head"><h2>Visit record</h2><span class="count">' + esc(p.label) + '</span></div>' +
    '<div class="rec"><div>' + (v ? stampSVG(p, v, justStamped === p.id ? 'thump' : '') : emptySVG()) + '</div><div class="rec-meta">' +
    '<span class="lab">Date visited</span><span class="hand">' + (v ? niceDate(v.date) : '') + '</span>' +
    '<span class="lab">Went with</span><span class="hand">' + (v && v.with ? tagHTML(v.with) : '') + '</span></div></div>' +
    (v && v.photo ? '<img class="snap" src="' + v.photo + '" alt="Your photo from ' + esc(p.name) + '">' : '<div class="snap none">' + (v ? (v.sample ? 'Sample visit, no photo' : 'No photo') : 'Your photo goes here') + '</div>') +
    '<div class="sec"><h3>Memories of this place</h3><div class="lines">' + (v && v.note ? esc(v.note) : '') + '</div></div>' +
    (v && parkSecretEarned(p) ? '<span class="hint"><b>Secret stamp found:</b> ' + esc(p.secret.n) + '</span>' : '') +
    '<div class="actions"><button class="btn small" data-checkin="' + p.id + '">' + (v ? 'Edit this visit' : 'Check in to collect the stamp') + '</button>' +
    (v ? '<span class="pill' + (v.public ? ' on' : '') + '">' + (v.public ? 'Public post' : 'Private') + '</span>' : '') +
    (v && v.taggedBy ? '<span class="muted">Stamp shared by @' + esc(v.taggedBy) + '</span>' : '') + '</div>';
}

function slotHTML(p){
  const v = visits[p.id], no = String(PARKS.indexOf(p) + 1).padStart(2, '0');
  return '<button class="slot' + (v ? ' got' : '') + '" data-park="' + p.id + '"><span class="no">No. ' + no + '</span>' +
    (v ? stampSVG(p, v, justStamped === p.id ? 'thump' : '') : emptySVG()) +
    '<span class="name">' + esc(p.name) + '</span>' + (v ? '<span class="when">' + niceDate(v.date) + '</span>' : '') + '</button>';
}
function secretHTML(x){
  return '<div class="secret">' + secretSVG(x) + '<span class="t">' + (x.got ? esc(x.n) : 'Locked') + '</span><span class="h">' + esc(x.got ? x.where : x.h) + '</span></div>';
}
function leafHTML(pg, n){
  if (!pg || pg.type === 'blank') return '<div class="leaf"></div>';
  let h = '';
  if (pg.type === 'parkL') h = parkLeftHTML(pg.park);
  else if (pg.type === 'parkR') h = parkRightHTML(pg.park);
  else if (pg.type === 'holder'){
    h = '<div class="leaf-head"><h2>This passport</h2></div>' +
      '<label class="field"><span>Belongs to</span><input type="text" id="holderName" maxlength="40" placeholder="Your name" value="' + esc(holder) + '"></label>' +
      '<div class="sec"><h3>How it works</h3><ol class="steps"><li>Visit a national park.</li><li>Tap a park in the stamp index to open its own two pages.</li><li>Check in with the date, a photo, who you went with and your memories.</li><li>The stamp is inked on the park page and in the index. Some visits also unlock a secret stamp.</li></ol></div>' +
      '<div class="sec"><h3>Care for the parks</h3><ul class="steps"><li>Stay on marked tracks.</li><li>Take all rubbish home.</li><li>Never feed wildlife.</li><li>Camp only in designated areas.</li></ul></div>';
  } else if (pg.type === 'parks'){
    h = '<div class="leaf-head"><h2 style="color:var(--ink-' + pg.region.ink + ')">' + esc(pg.region.name) + '</h2><span class="count">' + pg.all.filter(p => visits[p.id]).length + ' of ' + pg.all.length + ' stamped</span></div>' +
      '<div class="slots six">' + pg.parks.map(slotHTML).join('') + '</div>';
  } else if (pg.type === 'rewards'){
    const all = allSecrets();
    h = '<div class="leaf-head"><h2>Milestones</h2><span class="count">' + visitedParks().length + ' of ' + PARKS.length + ' parks</span></div>' +
      '<div class="slots six">' + MILESTONES.map(id => secretHTML(all.find(x => x.id === id))).join('') + '</div>' +
      '<p class="idea">Reward idea: a finished passport could earn a real perk, such as free camping nights. That would need an agreement with Queensland Parks.</p>';
  } else {
    h = '<div class="leaf-head"><h2>Secret stamps</h2><span class="count">' + earnedIds().filter(id => !MILESTONES.includes(id)).length + ' found</span></div>' +
      '<div class="slots six">' + pg.items.map(secretHTML).join('') + '</div>';
  }
  return '<div class="leaf">' + h + '<span class="folio">' + n + '</span></div>';
}
function coverHTML(){
  const star = (cx, cy, R) => { let p = ''; for (let i = 0; i < 10; i++){ const r = i % 2 ? R * .42 : R, a = Math.PI * i / 5 - Math.PI / 2; p += (cx + r*Math.cos(a)).toFixed(1) + ',' + (cy + r*Math.sin(a)).toFixed(1) + ' '; } return '<polygon points="' + p + '"/>'; };
  return '<div class="spread"><div class="leaf cover"><span class="sub">Queensland<br>Australia</span>' +
    '<svg viewBox="0 0 100 100" aria-hidden="true" fill="var(--foil)"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--foil)" stroke-width="2"/>' +
    star(50,22,7) + star(28,46,7) + star(72,42,7) + star(50,78,8) + star(62,58,4) + '</svg>' +
    '<span class="big">PASSPORT</span><span class="sub">National Parks</span>' +
    '<button class="btn" id="openBook">Open passport</button></div></div>';
}
function renderPassport(){
  const pages = buildPages(), per = twoUp.matches ? 2 : 1;
  let inner, label, last = false;
  if (bookPos < 0){ inner = coverHTML(); label = 'Cover'; }
  else {
    bookPos = Math.min(bookPos, pages.length - 1);
    const start = Math.floor(bookPos / per) * per;
    last = start + per >= pages.length;
    inner = '<div class="spread' + (per === 2 ? ' two' : '') + '">' + leafHTML(pages[start], start + 1) + (per === 2 ? leafHTML(pages[start + 1], start + 2) : '') + '</div>';
    label = per === 2 && pages[start + 1] ? 'Pages ' + (start + 1) + ' and ' + (start + 2) + ' of ' + pages.length : 'Page ' + (start + 1) + ' of ' + pages.length;
  }
  const opts = [['cover','Cover'],['holder','About this passport']].concat(REGIONS.map(r => [r.id, r.name]), [['rewards','Milestones'],['secrets','Secret stamps'],['parkpages','Park pages']]);
  return '<div class="book"><div class="booknav">' +
    '<button class="btn ghost small" id="prevPg"' + (bookPos < 0 ? ' disabled' : '') + '>Previous</button>' +
    '<span class="pageno">' + label + '</span>' +
    '<button class="btn ghost small" id="nextPg"' + (last ? ' disabled' : '') + '>Next</button>' +
    '<select id="jump" aria-label="Jump to a section"><option value="">Jump to a section</option>' + opts.map(o => '<option value="' + o[0] + '">' + esc(o[1]) + '</option>').join('') + '</select>' +
    '</div>' + inner + '</div>';
}
function turn(dir){
  const pages = buildPages(), per = twoUp.matches ? 2 : 1;
  if (bookPos < 0){ if (dir > 0) bookPos = 0; }
  else {
    const start = Math.floor(bookPos / per) * per + dir * per;
    if (start < 0) bookPos = -1; else if (start < pages.length) bookPos = start;
  }
  render();
}

function renderParks(){
  const q = query.trim().toLowerCase();
  const rows = PARKS.filter(p => (regionFilter === 'all' || p.region === regionFilter) && (!q || (p.name + ' ' + p.town).toLowerCase().includes(q)));
  return '<div class="pages"><div class="filters">' +
    '<input class="search" id="search" type="search" placeholder="Search parks or towns" aria-label="Search parks or towns" value="' + esc(query) + '">' +
    '<div class="chips"><button class="chip" data-region="all" aria-pressed="' + (regionFilter === 'all') + '">All regions</button>' +
    REGIONS.map(r => '<button class="chip" data-region="' + r.id + '" aria-pressed="' + (regionFilter === r.id) + '">' + esc(r.name) + '</button>').join('') +
    '</div></div><div class="list" id="list">' + rowsHTML(rows) + '</div></div>';
}
function rowsHTML(rows){
  if (!rows.length) return '<div class="none">No parks match that search. Try a shorter name or another region.</div>';
  return rows.map(p => {
    const v = visits[p.id], r = regionById[p.region];
    return '<button class="row" data-park="' + p.id + '"><span class="dot" style="background:var(--ink-' + r.ink + ')"></span>' +
      '<span><span class="t">' + esc(p.name) + '</span><br><span class="s">' + esc(r.name) + ' · near ' + esc(p.town) + '</span></span>' +
      '<span class="pill' + (v ? ' on' : '') + '">' + (v ? 'Stamped ' + niceDate(v.date) : 'Not visited') + '</span></button>';
  }).join('');
}

function render(){
  renderStats();
  document.querySelectorAll('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === tab));
  $('#view').innerHTML = tab === 'passport' ? renderPassport() : tab === 'community' ? renderFeed() : renderParks();
  renderAcct();
  $('#foot').textContent = 'Inspired by the stamp booklet idea of the Thai national park passport. Starter set of ' + PARKS.length + ' parks. Queensland has more than 300 national parks, so this list will grow. Park photos load from Wikipedia when the app runs on your own computer with internet. Otherwise a drawn placeholder is shown. Nearby events are sample listings, not real bookings. Accounts are a demo: stamps, photos and posts are saved in this browser only. A real app would also confirm the visit with GPS.';
  justStamped = null;
}

function openPark(id, editing){
  const p = parkById[id], r = regionById[p.region], v = visits[id];
  const showForm = !v || editing;
  let h = '<div class="dlg-head"><div><span class="eyebrow">' + esc(r.name) + ' · near ' + esc(p.town) + '</span><h2 id="dlgTitle">' + esc(p.name) + '</h2></div>' +
    '<button class="x" id="dlgClose" aria-label="Close">✕</button></div>';

  if (v && !editing){
    h += '<div class="visit">' + stampSVG(p, v, justStamped === id ? 'thump' : '') + '<div class="meta">' +
      (v.photo ? '<img src="' + v.photo + '" alt="Your photo from ' + esc(p.name) + '">' : '<span class="s">' + (v.sample ? 'Sample visit. No photo attached.' : 'No photo attached.') + '</span>') +
      '<span>Visited <b>' + niceDate(v.date) + '</b></span>' +
      (v.with ? '<span>Went with ' + esc(v.with) + '</span>' : '') +
      (v.note ? '<span class="quote">' + esc(v.note) + '</span>' : '') +
      (parkSecretEarned(p) ? '<span class="hint"><b>Secret stamp found:</b> ' + esc(p.secret.n) + '</span>' : '') +
      '<div class="actions"><button class="btn ghost small" id="editVisit">Update visit</button><button class="btn ghost small" id="removeVisit">Remove stamp</button></div>' +
      '</div></div>';
  }

  h += '<div class="sec"><h3>Road map: things to do here</h3>' +
    (showForm
      ? '<ul class="acts">' + p.acts.map((a,i) => '<li><label><input type="checkbox" id="act' + i + '" value="' + i + '"' + (v && (v.acts||[]).includes(i) ? ' checked' : '') + '><span>' + esc(a) + '</span></label></li>').join('') + '</ul>'
      : '<ul class="acts">' + p.acts.map((a,i) => '<li>' + ((v.acts||[]).includes(i) ? '✓ ' : '○ ') + esc(a) + '</li>').join('') + '</ul>') +
    '</div>';

  if (p.secret && !parkSecretEarned(p)) h += '<div class="hint"><b>A secret stamp hides here.</b> ' + esc(p.secret.h) + '</div>';

  h += '<div class="sec"><h3>Events nearby <span class="pill">Sample</span></h3><ul class="ev">' +
    r.events.map(e => '<li><span class="when">' + esc(e[0]) + '</span><span>' + esc(e[1]) + ' near ' + esc(p.town) + '</span></li>').join('') + '</ul></div>';

  if (showForm){
    h += '<form id="checkin" class="sec" novalidate><h3>' + (v ? 'Update your visit' : 'Check in to collect the stamp') + '</h3><div class="form">' +
      '<label class="field"><span>Date of visit</span><input type="date" id="visitDate" max="' + todayISO() + '" value="' + (v ? v.date : todayISO()) + '"></label>' +
      '<label class="field"><span>Photo from the park</span><input type="file" id="visitPhoto" accept="image/*"></label>' +
      '<label class="field" style="grid-column:1/-1"><span>Who did you go with? Type names, or @username to tag a friend (optional)</span><input type="text" id="visitWith" maxlength="80" value="' + esc(v && v.with ? v.with : '') + '"></label>' +
      (accounts.current
        ? '<div class="chips sm" style="grid-column:1/-1">' + Object.keys(accounts.users).filter(u => u !== accounts.current).map(u => '<button type="button" class="chip" data-tag="' + u + '">@' + esc(u) + '</button>').join('') + '</div><p class="muted" style="grid-column:1/-1;margin:0">A tagged friend gets this park stamp in their own passport.</p>'
        : '<p class="muted" style="grid-column:1/-1;margin:0">Sign in to tag friends by @username and to post publicly.</p>') +
      '<label class="field" style="grid-column:1/-1"><span>Memories of this place (optional)</span><textarea id="visitNote" maxlength="400" rows="4">' + esc(v && v.note ? v.note : '') + '</textarea></label>' +
      '<label class="check"><input type="checkbox" id="visitPublic"' + (v && v.public ? ' checked' : '') + (accounts.current ? '' : ' disabled') + '><span>Share this visit on the public feed. Leave it unticked to keep the visit private.</span></label>' +
      '</div><p class="err" id="formErr" hidden></p><div class="actions" style="margin-top:12px">' +
      '<button class="btn" type="submit">Stamp my passport</button></div></form>';
  }
  $('#dlgBody').innerHTML = h;
  const dlg = $('#dlg'); if (!dlg.open) dlg.showModal();
  justStamped = null;

  $('#dlgClose').onclick = () => dlg.close();
  if ($('#editVisit')) $('#editVisit').onclick = () => openPark(id, true);
  if ($('#removeVisit')) $('#removeVisit').onclick = () => { delete visits[id]; save(); render(); dlg.close(); toast('Removed the ' + p.name + ' stamp'); };
  if ($('#checkin')) $('#checkin').onsubmit = async ev => {
    ev.preventDefault();
    const err = $('#formErr'), date = $('#visitDate').value, file = $('#visitPhoto').files[0];
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!date) return fail('Choose the date you visited.');
    if (date > todayISO()) return fail('That date is in the future. Choose today or an earlier date.');
    let photo = v && !v.sample ? v.photo : null;
    if (file){
      try { photo = await readPhoto(file); } catch(e){ return fail('That file could not be read as a photo. Choose a JPG or PNG image.'); }
    }
    if (!photo) return fail('Add a photo from the park to collect the stamp.');
    const before = earnedIds();
    const acts = p.acts.map((_,i) => i).filter(i => $('#act' + i).checked);
    const withStr = $('#visitWith').value.trim();
    visits[id] = {date, acts, photo, with: withStr, note: $('#visitNote').value.trim(), public: !!accounts.current && $('#visitPublic').checked};
    const gave = applyTags(id, withStr, date, photo);
    tab = 'passport'; bookPos = pageOfPark(id) + (twoUp.matches ? 0 : 1);
    save();
    const fresh = allSecrets().filter(s => s.got && !before.includes(s.id));
    justStamped = id; render(); dlg.close();
    toast('Stamped: ' + p.name + (fresh.length ? '. Secret stamp unlocked: ' + fresh.map(s => s.n).join(', ') : '') + (gave.length ? '. Also stamped for ' + gave.map(u => '@' + u).join(', ') : '') + (visits[id].public ? '. Posted to the public feed' : ''));
  };
}

function readPhoto(file){
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = rej;
    fr.onload = () => {
      const img = new Image();
      img.onerror = rej;
      img.onload = () => {
        const s = Math.min(1, 640 / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', .72));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

let toastTimer;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}

document.querySelector('.tabs').addEventListener('click', e => {
  const b = e.target.closest('.tab'); if (!b) return; tab = b.dataset.tab; render();
});
$('#view').addEventListener('click', e => {
  const ul = e.target.closest('[data-user]');
  if (ul){ feedUser = ul.dataset.user; tab = 'community'; return render(); }
  if (e.target.id === 'feedAll'){ feedUser = null; return render(); }
  if (e.target.id === 'prevPg') return turn(-1);
  if (e.target.id === 'nextPg' || e.target.id === 'openBook') return turn(1);
  const chip = e.target.closest('.chip');
  if (chip){ regionFilter = chip.dataset.region; render(); return; }
  const b = e.target.closest('[data-checkin],[data-details],[data-jump]');
  if (b){
    if (b.dataset.checkin) return openPark(b.dataset.checkin, true);
    if (b.dataset.details) return openPark(b.dataset.details);
    bookPos = buildPages().findIndex(pg => pg.key === b.dataset.jump); return render();
  }
  const park = e.target.closest('[data-park]');
  if (park) goPark(park.dataset.park);
});
$('#view').addEventListener('change', e => {
  if (e.target.id !== 'jump' || !e.target.value) return;
  const k = e.target.value;
  bookPos = k === 'cover' ? -1 : buildPages().findIndex(pg => pg.key === k);
  render();
});
twoUp.addEventListener('change', render);
$('#view').addEventListener('input', e => {
  if (e.target.id === 'holderName'){ holder = e.target.value; try { localStorage.setItem(KEY + '-name', holder); } catch(err){} return; }
  if (e.target.id !== 'search') return;
  query = e.target.value;
  const q = query.trim().toLowerCase();
  $('#list').innerHTML = rowsHTML(PARKS.filter(p => (regionFilter === 'all' || p.region === regionFilter) && (!q || (p.name + ' ' + p.town).toLowerCase().includes(q))));
});
$('#clearSamples').onclick = () => {
  for (const k of Object.keys(visits)) if (visits[k].sample) delete visits[k];
  save(); render(); toast('Sample stamps cleared');
};
$('#dlg').addEventListener('click', e => {
  if (e.target === $('#dlg')) return $('#dlg').close();
  const t = e.target.closest('[data-tag]');
  if (t){ const i = $('#visitWith'), tag = '@' + t.dataset.tag; if (!i.value.includes(tag)) i.value = (i.value.trim() + ' ' + tag).trim(); return; }
  const d = e.target.closest('[data-demo]'); if (d) return signIn(d.dataset.demo);
  const ul = e.target.closest('[data-user]'); if (ul){ feedUser = ul.dataset.user; tab = 'community'; $('#dlg').close(); render(); }
});
$('#acct').addEventListener('click', e => { if (e.target.id === 'signIn') openAuth(); if (e.target.id === 'signOut') signOut(); });

render();
loadWikiPhotos().catch(() => {});
