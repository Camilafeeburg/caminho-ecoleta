// Versões anteriores do app guardavam a rota (com o endereço do usuário) no navegador.
// A rota agora vem sempre do servidor; no logout apagamos o que tiver ficado salvo.
export function clearRouteCache() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('ecoleta.route.')) localStorage.removeItem(key)
    }
  } catch {
    // Sem armazenamento local não há rota salva para apagar.
  }
}
