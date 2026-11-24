// Mode normal : l'application appelle l'API sur /api.
// En production (nginx) et avec `ng serve` (proxy.conf.json), /api est relayé vers le backend FastAPI.
export const environment = {
  apiUrl: '/api',
};
