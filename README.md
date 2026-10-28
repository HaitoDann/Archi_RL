<p align="center"><img src="assets/logo-plazma.png" width="88" alt="ARCHI RL — PlaZma Esport"></p>
<h1 align="center">ARCHI RL</h1>
<p align="center">Plateforme interne de gestion · PlaZma Esport · Rocket League</p>
<p align="center"><a href="https://haitodann.github.io/Archi_RL/"><strong>→ Accéder à ARCHI RL</strong></a></p>

---

Déclinaison Rocket League de l'[ARCHI LoL](https://github.com/HaitoDann/PlaZma) : même identité visuelle, même principe (GitHub Pages + Firebase), modules repensés pour une équipe 3v3.

## Modules

| Page | Rôle |
|---|---|
| **Dashboard** | La semaine, le roster, les objectifs du mois, le cap à 3, 6 et 12 mois |
| **Planning** | Sessions de la semaine (scrim, entraînement, review, tournoi, ranked) et disponibilités |
| **Progression** | Arbre de mécaniques coloré, objectifs mensuels arbitrés, suivi du MMR |
| **Mercato** | Roster titulaires / remplaçant, suivi des candidats et grille d'essai notée |
| **Satisfaction** | Questionnaire mensuel et résultats pour le staff |
| **Comptes** | Création des accès, rôles, lien compte ↔ fiche joueur |

### Niveaux de l'arbre de mécaniques

🔵 Parfaitement intégré · 🟢 Acquis · 🟡 À perfectionner · 🟠 En train d'apprendre · 🔴 Pas appris

L'arbre (branches, mécaniques, paliers) se modifie dans `assets/rl-data.js`.

## Rôles

| Rôle | Accès |
|---|---|
| **Admin** | Tout, y compris les comptes |
| **Capitaine** | Voit et modifie tout, sauf les comptes |
| **Joueur** | Sa propre fiche de progression, le planning, ses disponibilités, le questionnaire |

## Mise en route (une seule fois)

1. **Firebase** : dans le projet `ArchiRL`, ajouter une application Web (`</>`) et coller son `firebaseConfig` dans `assets/archi-config.js`.
2. **Authentication** → Commencer → activer *E-mail/Mot de passe*. Dans *Paramètres → Domaines autorisés*, ajouter `haitodann.github.io`.
3. **Firestore Database** → Créer une base (mode production, région Europe), puis coller le contenu de `firestore.rules` dans l'onglet *Règles* et publier.
4. **Premier compte admin** (le seul créé à la main) :
   - *Authentication → Utilisateurs → Ajouter un utilisateur* : e-mail `haito@archi-rl.local` (pseudo de ton choix + `@archi-rl.local`) et un mot de passe.
   - Copier l'**UID** affiché.
   - *Firestore → Démarrer une collection* `users`, ID du document = l'UID, champs : `name` (string) `Haito`, `username` (string) `haito`, `role` (string) `admin`, `disabled` (boolean) `false`.
5. Se connecter sur ARCHI RL avec le pseudo `haito`. Tous les autres comptes se créent ensuite depuis la page **Comptes**.

### Ordre conseillé ensuite

1. **Mercato** → « Ajouter un joueur » pour chaque membre du roster, puis le placer en titulaire ou remplaçant.
2. **Comptes** → créer un compte par joueur et le lier à sa fiche.
3. Chaque joueur remplit son arbre de mécaniques et propose ses objectifs du mois.

## Stack

- HTML / CSS / JavaScript sans framework ni build
- Firebase Auth + Firestore (SDK v9 compat), plan gratuit Spark
- Hébergement GitHub Pages (branche `main`)

## Données Firestore

| Collection / document | Contenu |
|---|---|
| `users/{uid}` | Compte : nom, pseudo, rôle, fiche liée |
| `rl/roster` | Roster publié par le Mercato |
| `rl/schedule-AAAA-Wss` | Planning d'une semaine |
| `rl-players/{id}` | Fiche de progression : niveaux, objectifs, MMR |
| `rl-mercato/{id}` | Fiches candidats et notes d'essai |
| `rl-availability/{uid}` | Disponibilités par semaine |
| `rl-satisfaction/{id}` | Réponses au questionnaire |

## Changelog

### v1.0.0 — Lancement
- Socle repris de l'ARCHI LoL : thème, connexion par pseudo, navigation, synchro temps réel
- Modules Dashboard, Planning, Progression, Mercato, Satisfaction, Comptes adaptés à Rocket League
