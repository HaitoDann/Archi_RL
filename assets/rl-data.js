/* ============================================================
   ARCHI RL — Référentiels Rocket League
   Arbre de mécaniques, niveaux de maîtrise, rangs, grille d'essai.
   Modifier ici pour faire évoluer l'arbre : les fiches existantes
   gardent leurs niveaux (indexés par id de mécanique).
   ============================================================ */
(function () {
  'use strict';

  // Niveaux de maîtrise (0 → 4). Couleurs sémantiques de l'arbre.
  const LEVELS = [
    { v: 0, key: 'none',     label: 'Pas appris',             short: 'Pas appris',   color: '#ef4444' },
    { v: 1, key: 'learning', label: "En train d'apprendre",   short: 'Apprend',      color: '#f97316' },
    { v: 2, key: 'polish',   label: 'À perfectionner',        short: 'À perfect.',   color: '#eab308' },
    { v: 3, key: 'acquired', label: 'Acquis',                 short: 'Acquis',       color: '#22c55e' },
    { v: 4, key: 'mastered', label: 'Parfaitement intégré',   short: 'Intégré',      color: '#3b82f6' }
  ];

  // Paliers de l'arbre : la base d'abord, puis l'intermédiaire, puis l'avancé.
  const TIERS = [
    { t: 1, label: 'Bases' },
    { t: 2, label: 'Intermédiaire' },
    { t: 3, label: 'Avancé' }
  ];

  // Branches et mécaniques. `req` = mécanique(s) recommandée(s) avant.
  const TREE = [
    { id: 'move', label: 'Déplacement', icon: 'M5 12h14M13 6l6 6-6 6', mechs: [
      { id: 'powerslide',  t: 1, label: 'Powerslide',          tip: 'Virer serré et se retourner vite en gardant la vitesse.' },
      { id: 'halfflip',    t: 1, label: 'Demi-flip',           tip: 'Faire demi-tour en marche arrière sans perdre de temps.' },
      { id: 'boostpads',   t: 1, label: 'Trajectoire des pads', tip: 'Passer sur les petits pads sans y penser.' },
      { id: 'wavedash',    t: 2, label: 'Wave dash',           tip: "Gagner de la vitesse à l'atterrissage.", req: ['powerslide'] },
      { id: 'speedflip',   t: 2, label: 'Speed flip',          tip: 'Le flip diagonal annulé : kickoff et courses au ballon.', req: ['halfflip'] },
      { id: 'walldrive',   t: 2, label: 'Conduite sur les murs', tip: 'Monter, descendre et sortir du mur proprement.' },
      { id: 'zapdash',     t: 3, label: 'Zap / chain dash',    tip: 'Enchaîner les dashs pour garder la vitesse supersonique.', req: ['wavedash'] }
    ]},
    { id: 'shot', label: 'Tir', icon: 'M4 20L20 4M20 4h-7M20 4v7', mechs: [
      { id: 'powershot',   t: 1, label: 'Tir puissant',        tip: 'Frapper fort avec le nez de la voiture au bon moment.' },
      { id: 'placement',   t: 1, label: 'Tir placé',           tip: 'Viser les coins, pas le gardien.' },
      { id: 'bounce',      t: 2, label: 'Tir sur rebond',      tip: 'Lire le rebond et frapper au sommet ou à la descente.', req: ['powershot'] },
      { id: 'flipcancel', t: 2, label: 'Tir en flip cancel', tip: "Ajuster l'angle de frappe avec un flip annulé.", req: ['placement'] },
      { id: 'pinch',       t: 3, label: 'Pinch',               tip: 'Coincer la balle contre le mur ou le sol pour une frappe éclair.', req: ['bounce'] }
    ]},
    { id: 'air', label: 'Aérien', icon: 'M12 3l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z', mechs: [
      { id: 'aerial',      t: 1, label: 'Aérien de base',      tip: 'Décoller et toucher la balle en l’air.' },
      { id: 'fastaerial',  t: 1, label: 'Fast aerial',         tip: 'Double saut + boost pour arriver avant tout le monde.', req: ['aerial'] },
      { id: 'airroll',     t: 2, label: 'Air roll / contrôle', tip: 'Orienter la voiture en vol pour frapper juste.', req: ['aerial'] },
      { id: 'redirect',    t: 2, label: 'Redirect',            tip: 'Dévier un centre vers le but.', req: ['airroll'] },
      { id: 'doubletouch', t: 2, label: 'Double touch',        tip: 'Toucher sur le backboard puis reprendre.', req: ['fastaerial'] },
      { id: 'airdribble',  t: 3, label: 'Air dribble',         tip: 'Porter la balle dans les airs.', req: ['airroll'] },
      { id: 'flipreset',   t: 3, label: 'Flip reset',          tip: 'Récupérer son flip en touchant la balle avec les quatre roues.', req: ['airdribble'] },
      { id: 'ceiling',     t: 3, label: 'Ceiling shot',        tip: 'Utiliser le plafond pour récupérer un flip.', req: ['walldrive'] }
    ]},
    { id: 'dribble', label: 'Dribble', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18', mechs: [
      { id: 'carry',       t: 1, label: 'Conduite de balle',   tip: 'Garder la balle sur le toit en avançant.' },
      { id: 'catch',       t: 1, label: 'Contrôle / amorti',   tip: 'Amortir une balle aérienne pour la poser.' },
      { id: 'flick',       t: 2, label: 'Flick 45°',           tip: 'Projeter la balle depuis le toit.', req: ['carry'] },
      { id: 'hood',        t: 2, label: 'Hood dribble',        tip: 'Dribble sur le capot, en contrôle fin.', req: ['carry'] },
      { id: 'musty',       t: 3, label: 'Musty flick',         tip: 'Flick arrière en saut renversé.', req: ['flick'] },
      { id: 'breezi',      t: 3, label: 'Breezi / 180 flick',  tip: 'Flicks avancés avec rotation.', req: ['flick'] }
    ]},
    { id: 'defense', label: 'Défense', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', mechs: [
      { id: 'shadow',      t: 1, label: 'Shadow défense',      tip: "Reculer face à l'attaquant au lieu de foncer." },
      { id: 'save',        t: 1, label: 'Arrêts de base',      tip: 'Se placer entre la balle et le but.' },
      { id: 'challenge',   t: 1, label: 'Challenge / 50-50',   tip: 'Bien choisir le moment pour contester.' },
      { id: 'wallclear',   t: 2, label: 'Dégagement mural',    tip: 'Sortir la balle du coin et du mur proprement.', req: ['save'] },
      { id: 'backboard',   t: 2, label: 'Défense backboard',   tip: 'Lire et couper les balles sur le backboard.', req: ['shadow'] },
      { id: 'airsave',     t: 3, label: 'Arrêts aériens',      tip: 'Arrêter les redirects et air dribbles.', req: ['backboard'] }
    ]},
    { id: 'team', label: 'Jeu collectif', icon: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 21c0-3 3-5 6-5s6 2 6 5M14 16c3 0 8 1 8 5', mechs: [
      { id: 'rotation',    t: 1, label: 'Rotations',           tip: 'Le cycle 1er / 2e / 3e homme, toujours vers le poteau lointain.' },
      { id: 'boostmgmt',   t: 1, label: 'Gestion du boost',    tip: 'Ne jamais rester à 0, voler le boost adverse.' },
      { id: 'comms',       t: 1, label: 'Communication',       tip: 'Annonces courtes et utiles : “je prends”, “à toi”, “boost”.' },
      { id: 'kickoff',     t: 2, label: 'Kickoffs en équipe',  tip: 'Rôles clairs : qui va, qui récupère, qui couvre.', req: ['rotation'] },
      { id: 'passing',     t: 2, label: 'Passes et centres',   tip: 'Jouer pour le coéquipier, pas seulement pour le but.', req: ['rotation'] },
      { id: 'readgame',    t: 3, label: 'Lecture du jeu',      tip: 'Anticiper la touche suivante, gérer le tempo du match.', req: ['passing'] }
    ]}
  ];

  const ALL = TREE.flatMap(b => b.mechs.map(m => Object.assign({ branch: b.id }, m)));
  const byId = Object.fromEntries(ALL.map(m => [m.id, m]));

  // Score de maîtrise 0–100 d'une liste de niveaux.
  function score(levels, mechs) {
    mechs = mechs || ALL;
    if (!mechs.length) return 0;
    const sum = mechs.reduce((s, m) => s + (Number((levels || {})[m.id]) || 0), 0);
    return Math.round(sum / (mechs.length * 4) * 100);
  }

  // Rangs Rocket League (compétitif).
  const RANKS = [
    'Bronze I', 'Bronze II', 'Bronze III', 'Argent I', 'Argent II', 'Argent III',
    'Or I', 'Or II', 'Or III', 'Platine I', 'Platine II', 'Platine III',
    'Diamant I', 'Diamant II', 'Diamant III', 'Champion I', 'Champion II', 'Champion III',
    'Grand Champion I', 'Grand Champion II', 'Grand Champion III', 'Supersonic Legend'
  ];
  const RANK_COLORS = { Bronze: '#b0743c', Argent: '#a7b1bd', Or: '#e3b341', Platine: '#5fd1d6', Diamant: '#4a7cf0', Champion: '#a46ef0', 'Grand Champion': '#e5484d', 'Supersonic Legend': '#f5f5f5' };
  const rankColor = r => { if (!r) return 'var(--muted)'; const k = Object.keys(RANK_COLORS).sort((a, b) => b.length - a.length).find(k => r.indexOf(k) === 0); return k ? RANK_COLORS[k] : 'var(--muted)'; };

  // Grille d'essai mercato (pondérée, total 100).
  const TRIAL = [
    { id: 'rotations', label: 'Rotations et placement', w: 25 },
    { id: 'comms',     label: 'Communication en jeu',   w: 20 },
    { id: 'mental',    label: 'Mental (buts encaissés)', w: 20 },
    { id: 'mechs',     label: 'Mécaniques',             w: 20 },
    { id: 'synergy',   label: 'Synergie avec le groupe', w: 15 }
  ];
  function trialScore(notes) {
    if (!notes) return null;
    let any = false, s = 0;
    TRIAL.forEach(c => { const n = Number(notes[c.id]); if (n) { any = true; s += n / 5 * c.w; } });
    return any ? Math.round(s) : null;
  }

  // Étapes du mercato.
  const STAGES = [
    { id: 'repere',    label: 'Repéré',    color: '#64748b' },
    { id: 'contacte',  label: 'Contacté',  color: '#22d3ee' },
    { id: 'entretien', label: 'Entretien', color: '#a46ef0' },
    { id: 'essai',     label: 'Essai',     color: '#f59e0b' },
    { id: 'retenu',    label: 'Retenu',    color: '#22c55e' },
    { id: 'refuse',    label: 'Refusé',    color: '#ef4444' }
  ];

  // Types de sessions du planning.
  const SESSION_TYPES = [
    { id: 'scrim',    label: 'Scrim',        color: '#22d3ee' },
    { id: 'training', label: 'Entraînement', color: '#22c55e' },
    { id: 'review',   label: 'Review replay', color: '#a46ef0' },
    { id: 'tournoi',  label: 'Tournoi',      color: '#ef4444' },
    { id: 'ranked',   label: 'Ranked 3v3',   color: '#f59e0b' },
    { id: 'autre',    label: 'Autre',        color: '#64748b' }
  ];

  window.RL = { LEVELS, TIERS, TREE, ALL, byId, score, RANKS, rankColor, TRIAL, trialScore, STAGES, SESSION_TYPES };
})();
