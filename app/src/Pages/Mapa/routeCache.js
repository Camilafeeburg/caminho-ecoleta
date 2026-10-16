// A rota salva no navegador é separada por usuário, para ninguém ver a rota de outra pessoa.
const ROUTE_CACHE_PREFIX = 'ecoleta.route.v3.'
export const ROUTE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000

export function clearRouteCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('ecoleta.route.')) localStorage.removeItem(key)
    }
  } catch {
    // Sem armazenamento local não há rota salva para apagar.
  }
}

export function readCachedRoute(userId, truckId) {
  try {
    const cached = JSON.parse(localStorage.getItem(`${ROUTE_CACHE_PREFIX}${userId}.${truckId}`))
    if (!cached?.request || cached.result?.truck?.id !== truckId || !Array.isArray(cached.result?.points) || !cached.result?.route?.features?.[0] || !Number.isFinite(cached.startedAt) || !Number.isFinite(cached.savedAt)) return null
    return cached
  } catch {
    return null
  }
}

export function saveCachedRoute(userId, truckId, cached) {
  try {
    localStorage.setItem(`${ROUTE_CACHE_PREFIX}${userId}.${truckId}`, JSON.stringify(cached))
  } catch {
    // A rota continua disponível nesta página mesmo se o armazenamento estiver cheio.
  }
}
