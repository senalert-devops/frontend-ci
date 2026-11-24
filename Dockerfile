# Étape 1 : compilation Angular (configuration « docker » => appels vers /api)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration docker

# Étape 2 : nginx sert le site et relaie /api vers le backend.
# L'image officielle remplace les variables d'environnement dans
# /etc/nginx/templates/*.template au démarrage : l'adresse du backend
# se règle donc sans reconstruire l'image (Compose, Kubernetes...).
FROM nginx:1.29-alpine
ENV BACKEND_URL=http://backend-service:8000
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/senalert/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
