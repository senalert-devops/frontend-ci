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
  environments/               environment.ts (démo) · environment.docker.ts (/api)
  app/
    app.ts                    barre de navigation
    signalement.service.ts    données, appels à l'API, mode démonstration
    pages/                    accueil, signaler, suivre, admin
    ui/                       carte, detail, logo, icônes
Dockerfile · nginx.conf       image de production
```

## Deux modes

- **Démonstration** (`environment.ts`) : données en mémoire, aucun backend. Utilisé par `ng serve` et les tests.
- **Docker** (`environment.docker.ts`) : l'application appelle `/api`, et nginx relaie vers le backend FastAPI.

## Développement

```bash
npm ci
npm start          # http://localhost:4200 (mode démonstration)
npm test           # tests Vitest
npm run build      # build de production
```

Connexion administrateur de démonstration : `admin` / `demo123` (compte fictif).

## Image Docker

```bash
docker build -t senalert-frontend ./frontend
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

Exemple de variable dans un Deployment Kubernetes :

```yaml
env:
  - name: BACKEND_URL
    value: http://backend-service:8000
readinessProbe:
  httpGet: { path: /healthz, port: 80 }
```

## Pipeline

Le workflow `frontend-ci` lance les tests, construit l'image et la pousse sur Docker Hub (identifiants dans les secrets GitHub Actions), puis déclenche `deployment-cd`.
