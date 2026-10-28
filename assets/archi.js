/* ============================================================
   ARCHI RL — Infrastructure partagée (PlaZma Esport · Rocket League)
   Reprise allégée du cœur de l'ARCHI LoL : config Firebase, garde
   d'accès par rôle, navigation, synchro Firestore, roster, outils UI.

   Inclusion type :
     <script src="assets/archi-config.js"></script>
     <script src=".../firebase-app-compat.js"></script> (+ auth, firestore)
     <script src="assets/archi.js" data-access="member"></script>
   data-access : public | member (défaut) | staff | admin
   ============================================================ */
(function () {
  'use strict';

  const VERSION = '1.1.0';
  const USER_DOMAIN = 'archi-rl.local';   // pseudo → "<pseudo>@archi-rl.local"
  const COL = 'rl';                       // collection des documents uniques

  const script = document.currentScript;
  const access = (script && script.getAttribute('data-access')) || 'member';
  const page = location.pathname.split('/').pop() || 'index.html';
  const NEEDS_AUTH = access !== 'public' && page !== 'login.html';

  // ---- Rôles ----
  // admin     : tout + comptes (manager / CEO)
  // capitaine : voit et modifie tout sauf les comptes
  // joueur    : sa fiche, le planning, ses dispos, la satisfaction
  const ROLES = {
    admin:     { label: 'Admin',     rank: 3 },
    capitaine: { label: 'Capitaine', rank: 2 },
    joueur:    { label: 'Joueur',    rank: 1 }
  };

  // ---- Firebase ----
  const CONFIG = window.ARCHI_FIREBASE_CONFIG || {};
  const configured = CONFIG.apiKey && CONFIG.apiKey !== 'A_REMPLIR';
  let db = null, auth = null;
  try {
    if (configured && window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(CONFIG);
      if (firebase.firestore) db = firebase.firestore();
      if (firebase.auth) auth = firebase.auth();
    }
  } catch (e) { console.error('Firebase indisponible :', e); }

  // ---- Utilitaires ----
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const initials = n => { n = (n || '').trim(); if (!n) return '•'; const w = n.split(/\s+/); return (w.length > 1 ? w[0][0] + w[1][0] : n.slice(0, 2)).toUpperCase(); };

  // ---- Thème (clé distincte de l'Archi LoL) ----
  const THEME_KEY = 'ar-theme';
  function applyTheme(t) { document.documentElement.setAttribute('data-theme', t); }
  (function () {
    let t = null; try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    applyTheme(t || (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
  })();
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme(next);
  }

  // ---- Toast ----
  function toast(msg, type) {
    let box = document.getElementById('pz-toasts');
    if (!box) { box = document.createElement('div'); box.id = 'pz-toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'pz-toast ' + (type || 'ok');
    t.innerHTML = '<span class="pz-toast-dot"></span>' + esc(msg);
    box.appendChild(t);
    const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 400); };
    t.addEventListener('click', kill);
    setTimeout(kill, 2800);
  }

  // ---- Pastille de synchro (#syncDot / #syncText) ----
  function status(state, text) {
    const d = document.getElementById('syncDot'), t = document.getElementById('syncText');
    if (d) d.className = 'sync-dot ' + state;
    if (t) t.textContent = text || '';
  }

  // ---- Modale générique ----
  function modal(html, opts) {
    opts = opts || {};
    const ov = document.createElement('div');
    ov.className = 'ar-ov';
    ov.innerHTML = '<div class="ar-modal" style="max-width:' + (opts.width || 520) + 'px">' + html + '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
    const close = () => { ov.classList.remove('open'); setTimeout(() => ov.remove(), 200); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
    ov.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    return { el: ov.querySelector('.ar-modal'), close };
  }

  // ---- Auth & garde d'accès ----
  let authUser = null, profile = null, resolved = false;
  const listeners = [];
  let _ready; const ready = new Promise(r => (_ready = r));
  const role = () => (profile && !profile.disabled ? profile.role : null);
  const isAdmin = () => role() === 'admin';
  const isStaff = () => role() === 'admin' || role() === 'capitaine';
  const myPlayerId = () => (profile && profile.playerId) || null;
  function onAuth(cb) { listeners.push(cb); if (resolved) cb(authUser, profile); }

  let gateEl = null;
  function gate(html) {
    if (!gateEl) { gateEl = document.createElement('div'); gateEl.className = 'ar-gate'; document.body.appendChild(gateEl); }
    gateEl.innerHTML = html; gateEl.style.display = 'flex';
  }
  const ungate = () => { if (gateEl) gateEl.style.display = 'none'; };
  const spinner = '<div class="ar-spin"></div>';
  const denied = msg => '<div style="max-width:420px"><h2>Accès restreint</h2><p class="dim" style="margin:8px 0 18px">' + msg +
    '</p><div style="display:flex;gap:10px;justify-content:center"><a class="btn" href="index.html">Accueil</a><button class="btn btn-primary" onclick="AR.logout()">Se déconnecter</button></div></div>';

  function handleAccess() {
    renderNav();
    if (!NEEDS_AUTH) return;
    if (!configured) { gate(denied("Firebase n'est pas encore configuré : renseigne <code>assets/archi-config.js</code>.")); return; }
    if (!authUser) { location.replace('login.html'); return; }
    if (!profile || profile.disabled) { gate(denied("Ton compte n'a pas encore d'accès à ARCHI RL. Contacte un administrateur.")); return; }
    if (access === 'admin' && !isAdmin()) { gate(denied('Cet espace est réservé aux administrateurs.')); return; }
    if (access === 'staff' && !isStaff()) { gate(denied('Cet espace est réservé au staff (admin / capitaine).')); return; }
    ungate();
  }

  const CACHE_KEY = 'ar_auth_v1', CACHE_TTL = 30 * 60 * 1000;
  function startAuth() {
    if (!auth) { resolved = true; _ready({ user: null, profile: null }); handleAccess(); return; }
    if (NEEDS_AUTH) {
      let c = null; try { c = JSON.parse(sessionStorage.getItem(CACHE_KEY)); } catch (e) {}
      if (c && Date.now() - c.ts < CACHE_TTL) { authUser = { uid: c.uid }; profile = c.profile; handleAccess(); }
      else gate(spinner);
    }
    auth.onAuthStateChanged(async user => {
      authUser = user ? { uid: user.uid, email: user.email } : null;
      profile = null;
      if (user && db) {
        try { const s = await db.collection('users').doc(user.uid).get(); profile = s.exists ? s.data() : null; }
        catch (e) { console.error(e); }
      }
      try {
        if (authUser && profile && !profile.disabled) sessionStorage.setItem(CACHE_KEY, JSON.stringify({ uid: user.uid, profile, ts: Date.now() }));
        else sessionStorage.removeItem(CACHE_KEY);
      } catch (e) {}
      resolved = true; _ready({ user: authUser, profile });
      handleAccess();
      listeners.forEach(cb => { try { cb(authUser, profile); } catch (e) { console.error(e); } });
    });
  }

  function logout() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
    if (auth) auth.signOut().finally(() => location.replace('login.html'));
    else location.replace('login.html');
  }

  function changePassword() {
    if (!auth || !auth.currentUser) return;
    const m = modal(
      '<h3 class="modal-title">Changer mon mot de passe</h3>' +
      '<label class="ar-lbl">Mot de passe actuel</label><input id="cp_cur" class="ar-in" type="password" autocomplete="current-password">' +
      '<label class="ar-lbl">Nouveau mot de passe (6 caractères min.)</label><input id="cp_new" class="ar-in" type="password" autocomplete="new-password">' +
      '<div id="cp_msg" class="ar-err"></div>' +
      '<div class="modal-actions"><button class="btn btn-ghost" data-close>Annuler</button><button class="btn btn-primary" id="cp_ok">Enregistrer</button></div>', { width: 380 });
    m.el.querySelector('#cp_ok').addEventListener('click', async () => {
      const cur = m.el.querySelector('#cp_cur').value, nw = m.el.querySelector('#cp_new').value, out = m.el.querySelector('#cp_msg');
      if (nw.length < 6) { out.textContent = '6 caractères minimum.'; return; }
      try {
        const u = auth.currentUser;
        await u.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(u.email, cur));
        await u.updatePassword(nw);
        m.close(); toast('Mot de passe modifié.');
      } catch (e) { out.textContent = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' ? 'Mot de passe actuel incorrect.' : 'Erreur : ' + e.message; }
    });
  }

  // ---- Navigation ----
  const NAV = [
    { key: 'home',         href: 'index.html',        label: 'Accueil' },
    { key: 'dashboard',    href: 'dashboard.html',    label: 'Dashboard' },
    { key: 'planning',     href: 'planning.html',     label: 'Planning' },
    { key: 'progression',  href: 'progression.html',  label: 'Progression' },
    { key: 'mercato',      href: 'mercato.html',      label: 'Mercato', staff: true },
    { key: 'satisfaction', href: 'satisfaction.html', label: 'Satisfaction' },
    { key: 'admin',        href: 'admin.html',        label: 'Comptes', admin: true }
  ];
  let navActive = null;
  function mountNav(key) { navActive = key; renderNav(); }
  function renderNav() {
    if (navActive === null) return;
    const items = NAV.filter(n => (!n.staff || isStaff()) && (!n.admin || isAdmin()) && (profile || n.key === 'home'));
    const links = items.map(n => '<a href="' + n.href + '"' + (n.key === navActive ? ' class="active"' : '') + '>' + n.label + '</a>').join('');
    const theme = '<button class="pz-daynight" type="button" onclick="AR.toggleTheme()" title="Thème clair / sombre" aria-label="Thème clair / sombre"><span class="dn-stars"></span><span class="dn-clouds"></span><span class="dn-knob"></span></button>';
    const who = profile
      ? '<button class="pz-nav-user" type="button" onclick="AR.changePassword()" title="Changer mon mot de passe">' + esc(profile.name || profile.username) + '</button>' +
        '<button class="pz-logout" type="button" onclick="AR.logout()" title="Se déconnecter" aria-label="Se déconnecter"><svg class="pz-power" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path class="pz-power-ring" d="M7.8 6.3a7 7 0 1 0 8.4 0"/><line class="pz-power-bar" x1="12" y1="3.2" x2="12" y2="11.5"/></svg></button>'
      : '';
    const html = '<div class="pz-topbar"><div class="pz-topbar-inner">' +
      '<a class="pz-brand" href="index.html"><span class="pz-brand-mark"><img src="assets/logo-plazma.png" alt=""></span>' +
      '<span><span class="pz-brand-name">ARCHI <span class="ar-rl">RL</span></span><span class="pz-ver">v' + VERSION + '</span></span></a>' +
      '<nav class="pz-nav">' + links + '</nav><div class="pz-nav-right">' + theme + who + '</div></div></div>';
    const ex = document.querySelector('.pz-topbar');
    if (ex) ex.outerHTML = html; else document.body.insertAdjacentHTML('afterbegin', html);
  }

  // ---- Synchro d'un document unique (rl/<docId>) en temps réel ----
  function sync(opts) {
    let unsub = null, lastSig = null;
    const ref = () => db.collection(opts.col || COL).doc(typeof opts.docId === 'function' ? opts.docId() : opts.docId);
    function start() {
      if (!db) { status('error', 'Firebase non configuré'); return; }
      if (unsub) unsub();
      status('syncing', 'Connexion…');
      unsub = ref().onSnapshot(doc => {
        if (doc.metadata.hasPendingWrites) return;
        const data = doc.exists ? doc.data() : null;
        const sig = JSON.stringify(data);
        status('connected', 'Synchronisé');
        if (sig === lastSig) return;
        lastSig = sig;
        opts.onData(data);
      }, err => { console.error(err); status('error', 'Accès refusé ou hors ligne'); });
    }
    let timer = 0;
    function save(data, debounce) {
      if (!db) return Promise.resolve();
      clearTimeout(timer);
      const run = () => {
        status('syncing', 'Sauvegarde…');
        data._savedAt = Date.now();
        lastSig = JSON.stringify(data);
        return ref().set(data).then(() => status('connected', 'Synchronisé'))
          .catch(e => { console.error(e); status('error', 'Erreur de sauvegarde'); toast("Sauvegarde refusée (droits ?)", 'err'); });
      };
      if (debounce) { timer = setTimeout(run, debounce); return Promise.resolve(); }
      return run();
    }
    start();
    return { save, restart: start, stop: () => unsub && unsub() };
  }

  // ---- Roster central : rl/roster { players:[{id,name,emoji,status}] } ----
  // Alimenté par la page Mercato (titulaires + remplaçant).
  let roster = [];
  const rosterCbs = [];
  function onRoster(cb) { rosterCbs.push(cb); if (rosterLoaded) cb(roster); }
  let rosterLoaded = false;
  ready.then(({ profile: p }) => {
    if (!db || !p) return;
    db.collection(COL).doc('roster').onSnapshot(d => {
      roster = (d.exists && d.data().players) || [];
      rosterLoaded = true;
      rosterCbs.forEach(cb => cb(roster));
    }, () => { rosterLoaded = true; rosterCbs.forEach(cb => cb(roster)); });
  });
  const statusLabel = { titulaire: 'Titulaire', remplacant: 'Remplaçant' };

  // ---- Semaines ISO ----
  function isoWeek(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const w = Math.ceil(((d - y0) / 86400000 + 1) / 7);
    return d.getUTCFullYear() + '-W' + String(w).padStart(2, '0');
  }
  function weekMonday(week) {
    const [y, w] = week.split('-W').map(Number);
    const jan4 = new Date(y, 0, 4); const dow = jan4.getDay() || 7;
    const mon = new Date(jan4); mon.setDate(jan4.getDate() - dow + 1 + (w - 1) * 7);
    return mon;
  }
  function weekShift(week, delta) { const m = weekMonday(week); m.setDate(m.getDate() + delta * 7); return isoWeek(m); }
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const monthKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const monthLabel = k => { const [y, m] = k.split('-').map(Number); const s = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };

  // ---- Révélation douce des sections ----
  function reveal() {
    const els = document.querySelectorAll('.ar-reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .06 });
    els.forEach(e => io.observe(e));
  }

  window.AR = {
    VERSION, USER_DOMAIN, CONFIG, configured, db, auth, COL, ROLES,
    ready, onAuth, role, isAdmin, isStaff, myPlayerId, profile: () => profile, user: () => authUser,
    logout, changePassword, toggleTheme, mountNav, sync, status, toast, modal, esc, uid, initials,
    onRoster, roster: () => roster, statusLabel,
    isoWeek, weekMonday, weekShift, DAYS, monthKey, monthLabel, reveal
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { startAuth(); reveal(); });
  else { startAuth(); reveal(); }
})();
