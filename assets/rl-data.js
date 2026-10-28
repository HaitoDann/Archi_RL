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

  // Paliers de l'arbre, de la base au haut niveau.
  const TIERS = [
    { t: 1, label: 'Bases' },
    { t: 2, label: 'Intermédiaire' },
    { t: 3, label: 'Avancé' },
    { t: 4, label: 'Expert' }
  ];

  // Noms des mécaniques en anglais (vocabulaire de la communauté),
  // explications en français. `req` = mécanique(s) conseillée(s) avant.
  // Ne jamais changer un id existant : les fiches y sont indexées.
  const TREE = [
    { id: 'move', label: 'Movement', icon: 'M5 12h14M13 6l6 6-6 6', mechs: [
      { id: 'landing',     t: 1, label: 'Landing',            tip: 'Retomber sur les 4 roues pour repartir sans perdre de temps.' },
      { id: 'powerslide',  t: 1, label: 'Powerslide',         tip: 'Virer serré et se retourner vite en gardant la vitesse.' },
      { id: 'halfflip',    t: 1, label: 'Half-flip',          tip: 'Faire demi-tour en marche arrière en un seul mouvement.' },
      { id: 'boostpads',   t: 1, label: 'Small pads pathing', tip: 'Enchaîner les petits pads sans y penser.' },
      { id: 'walldrive',   t: 1, label: 'Wall driving',       tip: 'Monter, rouler et redescendre des murs proprement.' },
      { id: 'wavedash',    t: 2, label: 'Wavedash',           tip: "Dasher à l'atterrissage pour gagner de la vitesse.", req: ['landing'] },
      { id: 'speedflip',   t: 2, label: 'Speedflip',          tip: 'Flip diagonal annulé : kickoffs et courses au ballon.', req: ['halfflip'] },
      { id: 'recovery',    t: 2, label: 'Fast recovery',      tip: 'Récupérer vitesse et position juste après une touche.', req: ['wavedash'] },
      { id: 'zapdash',     t: 3, label: 'Zap dash',           tip: 'Wavedash sur le nez sans quitter le sol.', req: ['wavedash'] },
      { id: 'chaindash',   t: 3, label: 'Chain dash',         tip: 'Enchaîner les wavedashs pour rester supersonique sans boost.', req: ['wavedash'] },
      { id: 'walldash',    t: 3, label: 'Wall dash',          tip: 'Dasher le long du mur pour accélérer.', req: ['walldrive'] },
      { id: 'stall',       t: 4, label: 'Stall',              tip: 'Annuler un dodge en l’air pour se maintenir sans perdre son flip.', req: ['recovery'] }
    ]},
    { id: 'shot', label: 'Shooting', icon: 'M4 20L20 4M20 4h-7M20 4v7', mechs: [
      { id: 'powershot',   t: 1, label: 'Powershot',          tip: 'Frapper fort avec le nez de la voiture au bon timing.' },
      { id: 'placement',   t: 1, label: 'Shot placement',     tip: 'Viser les coins, pas le gardien.' },
      { id: 'diagflip',    t: 1, label: 'Diagonal flip shot', tip: 'Frapper avec un flip diagonal pour plus de puissance et d’angle.' },
      { id: 'bounce',      t: 2, label: 'Half volley',        tip: 'Frapper la balle au rebond, au sommet ou à la descente.', req: ['powershot'] },
      { id: 'wallshot',    t: 2, label: 'Wall shot',          tip: 'Tirer depuis le mur, souvent en angle.', req: ['walldrive'] },
      { id: 'flipcancel',  t: 2, label: 'Flip cancel',        tip: "Annuler le flip pour ajuster l'angle de frappe.", req: ['placement'] },
      { id: 'pinch',       t: 3, label: 'Pinch',              tip: 'Coincer la balle contre le sol ou le mur pour une frappe éclair.', req: ['bounce'] },
      { id: 'wallpinch',   t: 3, label: 'Wall pinch',         tip: 'Pinch la balle contre le mur latéral vers le but.', req: ['pinch'] },
      { id: 'kuxir',       t: 4, label: 'Kuxir pinch',        tip: 'Pinch en coin avec le powerslide, frappe très puissante.', req: ['wallpinch'] }
    ]},
    { id: 'air', label: 'Aerial', icon: 'M12 3l3 7h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z', mechs: [
      { id: 'aerial',      t: 1, label: 'Aerial',             tip: 'Décoller et toucher la balle en l’air.' },
      { id: 'djaerial',    t: 1, label: 'Double jump aerial', tip: 'Utiliser le second saut pour monter plus haut.', req: ['aerial'] },
      { id: 'fastaerial',  t: 2, label: 'Fast aerial',        tip: 'Double saut + boost pour arriver avant tout le monde.', req: ['djaerial'] },
      { id: 'airroll',     t: 2, label: 'Air roll',           tip: 'Orienter la voiture en vol pour frapper juste.', req: ['aerial'] },
      { id: 'dar',         t: 2, label: 'Directional air roll', tip: 'Air roll gauche/droite dédié pour le contrôle fin.', req: ['airroll'] },
      { id: 'redirect',    t: 2, label: 'Redirect',           tip: 'Dévier un centre vers le but.', req: ['airroll'] },
      { id: 'doubletouch', t: 3, label: 'Double tap',         tip: 'Toucher sur le backboard puis reprendre.', req: ['fastaerial'] },
      { id: 'airdribble',  t: 3, label: 'Air dribble',        tip: 'Porter la balle dans les airs.', req: ['dar'] },
      { id: 'wallairdribble', t: 3, label: 'Wall air dribble', tip: 'Lancer un air dribble depuis le mur.', req: ['airdribble'] },
      { id: 'g2a',         t: 3, label: 'Ground to air dribble', tip: 'Soulever la balle depuis le sol pour l’air dribble.', req: ['airdribble'] },
      { id: 'flipreset',   t: 4, label: 'Flip reset',         tip: 'Récupérer son flip en touchant la balle avec les 4 roues.', req: ['airdribble'] },
      { id: 'ceiling',     t: 4, label: 'Ceiling shot',       tip: 'Utiliser le plafond pour récupérer un flip.', req: ['walldrive'] },
      { id: 'chainreset',  t: 4, label: 'Chain flip reset',   tip: 'Enchaîner plusieurs flip resets sur la même action.', req: ['flipreset'] },
      { id: 'psycho',      t: 4, label: 'Psycho',             tip: 'Rebond sur le backboard en marche arrière, reprise aérienne.', req: ['doubletouch'] }
    ]},
    { id: 'dribble', label: 'Dribbling & flicks', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18', mechs: [
      { id: 'carry',       t: 1, label: 'Ground dribble',     tip: 'Garder la balle sur le toit en avançant.' },
      { id: 'catch',       t: 1, label: 'Ball catch',         tip: 'Amortir une balle aérienne pour la poser sur le toit.' },
      { id: 'frontflick',  t: 2, label: 'Front flick',        tip: 'Le flick le plus simple : flip avant depuis le toit.', req: ['carry'] },
      { id: 'flick',       t: 2, label: '45° flick',          tip: 'Flick diagonal, rapide et puissant.', req: ['carry'] },
      { id: 'hood',        t: 2, label: 'Hood dribble',       tip: 'Dribble sur le capot, en contrôle fin.', req: ['carry'] },
      { id: 'bouncedribble', t: 2, label: 'Bounce dribble',   tip: 'Faire rebondir la balle devant soi en avançant.', req: ['catch'] },
      { id: 'flick90',     t: 3, label: '90° flick',          tip: 'Flick latéral pour surprendre le défenseur.', req: ['flick'] },
      { id: 'delayed',     t: 3, label: 'Delayed flick',      tip: 'Retarder le flick pour lire et tromper l’adversaire.', req: ['flick'] },
      { id: 'musty',       t: 3, label: 'Musty flick',        tip: 'Flick arrière en saut renversé.', req: ['flick'] },
      { id: 'breezi',      t: 4, label: 'Breezi flick',       tip: 'Flick avec rotation air roll, très puissant.', req: ['musty'] },
      { id: 'flick180',    t: 4, label: '180 flick',          tip: 'Demi-tour complet avant de flicker.', req: ['flick90'] }
    ]},
    { id: 'defense', label: 'Defense', icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', mechs: [
      { id: 'save',        t: 1, label: 'Back post save',     tip: 'Revenir par le poteau lointain et se placer entre balle et but.' },
      { id: 'challenge',   t: 1, label: '50/50',              tip: 'Contester au bon moment, avec un flip de face.' },
      { id: 'clear',       t: 1, label: 'Clear',              tip: 'Dégager loin et vers les côtés, jamais au centre.' },
      { id: 'shadow',      t: 2, label: 'Shadow defense',     tip: "Reculer face à l'attaquant au lieu de foncer.", req: ['save'] },
      { id: 'backboard',   t: 2, label: 'Backboard defense',  tip: 'Lire et couper les balles sur le backboard.', req: ['save'] },
      { id: 'wallclear',   t: 2, label: 'Corner & wall clear', tip: 'Sortir la balle du coin et du mur proprement.', req: ['clear'] },
      { id: 'airsave',     t: 3, label: 'Aerial save',        tip: 'Arrêter les redirects et air dribbles.', req: ['backboard'] },
      { id: 'fakechal',    t: 3, label: 'Fake challenge',     tip: 'Feinter le challenge pour pousser l’attaquant à l’erreur.', req: ['shadow'] },
      { id: 'squishy',     t: 4, label: 'Squishy save',       tip: 'Arrêt en déformant la hitbox contre la balle.', req: ['airsave'] }
    ]},
    { id: 'team', label: 'Game sense', icon: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 21c0-3 3-5 6-5s6 2 6 5M14 16c3 0 8 1 8 5', mechs: [
      { id: 'rotation',    t: 1, label: 'Rotation',           tip: 'Le cycle 1er / 2e / 3e homme, retour par le poteau lointain.' },
      { id: 'boostmgmt',   t: 1, label: 'Boost management',   tip: 'Ne jamais rester à 0, voler le boost adverse.' },
      { id: 'comms',       t: 1, label: 'Comms',              tip: 'Annonces courtes et utiles : « je prends », « à toi », « boost ».' },
      { id: 'kickoff',     t: 1, label: 'Kickoff',            tip: 'Rôles clairs : qui va, qui récupère, qui couvre.' },
      { id: 'passing',     t: 2, label: 'Passing',            tip: 'Centrer et jouer pour le coéquipier.', req: ['rotation'] },
      { id: 'demo',        t: 2, label: 'Demos & bumps',      tip: 'Démolir ou bousculer au bon moment pour créer le surnombre.', req: ['rotation'] },
      { id: 'lowboost',    t: 2, label: 'Low boost defense',  tip: 'Défendre sans boost : position et timing avant tout.', req: ['boostmgmt'] },
      { id: 'pressure',    t: 3, label: 'Pressure',           tip: 'Maintenir la pression offensive sans se faire contrer.', req: ['passing'] },
      { id: 'readgame',    t: 3, label: 'Game reading',       tip: 'Anticiper la touche suivante, gérer le tempo du match.', req: ['passing'] }
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
