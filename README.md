# SenAlert – Frontend

Interface web de SenAlert : signaler une rue, un canal ou un caniveau bouché, suivre son traitement avec un code (ex. `SIG-000123`) et, pour l'agent, gérer les signalements.

Angular 22 (composants autonomes, signaux), servi par nginx. Interface en français, pensée pour le téléphone, au design vert SenAlert (police Inter).

## Pages

| Route | Rôle |
|---|---|
| `/` | Accueil : présentation, chiffres clés, suivi rapide par code |
| `/carte` | Carte des signalements, filtres par type, statut et commune, liste et détail |
| `/signaler` | Formulaire : type, description, photo, position sur la carte. Renvoie le code de suivi |
| `/suivre` | Statut et historique d'un signalement à partir de son code |
| `/admin` | Connexion de l'agent, tableau de bord (statut, commune), gestion et changement de statut avec note |

Statuts : Signalé → Vérifié → En traitement → Résolu. Un signalement peut être Rejeté depuis Signalé ou Vérifié. La note est obligatoire pour passer à Résolu.

## Structure

```
src/
  styles.scss                 styles globaux (couleurs, typographie, composants)
  environments/               environment.ts · environment.docker.ts (apiUrl : /api)
  app/
    app.ts                    barre de navigation
    signalement.service.ts    appels à l'API, connexion administrateur
    geo.ts                    plan de la carte <-> coordonnées GPS
    pages/                    accueil, signaler, suivre, admin
    ui/                       carte, detail, logo, icônes
proxy.conf.json               relais de /api vers le backend pour `ng serve`
Dockerfile · nginx.conf       image de production
```

## Données réelles, pas de simulation

L'application ne contient ni données de démonstration ni identifiants. Elle appelle toujours l'API (`/api`) :

- les signalements viennent de la base PostgreSQL du backend ;
- la connexion administrateur est vérifiée par le backend : identifiant `ADMIN_USER` et mot de passe `ADMIN_PASSWORD` du Secret Kubernetes (créé par `deployment-cd` à partir des secrets GitHub) ;
- le jeton renvoyé par le backend est gardé en mémoire et envoyé à chaque changement de statut. Il expire au bout de 8 heures : l'application revient alors à l'écran de connexion.

### Position

Le plan de la carte est schématique (banlieue de Dakar, `x` de 0 à 600 et `y` de 0 à 380). `geo.ts` le convertit en `latitude` et `longitude` (degrés WGS84) avant d'envoyer le signalement, car l'API enregistre une position GPS et refuse tout ce qui est hors du Sénégal. À la lecture, la conversion inverse replace le point sur le plan. Avec une carte réelle (Leaflet, OpenStreetMap), on enverrait directement les coordonnées GPS.

## Développement

```bash
npm ci
npm test           # tests Vitest (faux serveur : aucune base ni identifiant nécessaire)
npm run build      # build de production
```

Lancer l'application avec le vrai backend : démarrer l'API sur `http://localhost:8000` (voir le README de `backend-ci` : elle exige `DATABASE_URL`, `ADMIN_USER`, `ADMIN_PASSWORD` et `CORS_ORIGINS`), puis :

```bash
npm start          # http://localhost:4200, /api est relayé vers localhost:8000 (proxy.conf.json)
```

Se connecter à `/admin` avec l'identifiant et le mot de passe donnés au backend.

## Image Docker

```bash
docker build -t senalert-frontend .
docker run --rm -p 3000:80 -e BACKEND_URL=http://host.docker.internal:8000 senalert-frontend
```

Le Dockerfile compile Angular en configuration `docker`, puis copie le résultat dans `nginx:1.29-alpine`.

| Élément | Détail |
|---|---|
| Port | 80 |
| `BACKEND_URL` | Adresse du backend, par défaut `http://backend-service:8000`. Dans Kubernetes, mettre le nom du Service du backend |
| `GET /healthz` | Répond `ok` : sonde liveness / readiness du pod frontend |
| `/api/` | Relayé vers `BACKEND_URL` (photos jusqu'à 15 Mo par requête) |
| Autres routes | Renvoient `index.html` (routage Angular) |

## Pipeline

Le workflow `.github/workflows/ci.yml` lance les tests et le build, puis, sur `main` seulement, construit l'image, la pousse sur Docker Hub (variable `DOCKERHUB_USER`, secret `DOCKERHUB_TOKEN`) et déclenche `deployment-cd` (secret `CD_TRIGGER_TOKEN`).
