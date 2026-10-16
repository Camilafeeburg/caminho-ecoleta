// Mapa da página do caminhão: os pontos da rota numerados, ligados na ordem de passagem.
(function () {
  const elemento = document.getElementById('mapa-rota')
  const dados = document.getElementById('pontos-rota')
  if (!elemento || !dados) return

  const pontos = JSON.parse(dados.textContent)
  const mapa = L.map(elemento).setView([-30.0346, -51.2177], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)
  if (!pontos.length) return

  const posicoes = pontos.map((ponto) => [ponto.lat, ponto.lng])
  // Linha reta entre os pontos, só para conferir a ordem (o app calcula o trajeto pelas ruas).
  L.polyline(posicoes, { color: '#1c2541', weight: 3, opacity: 0.7, dashArray: '6 8' }).addTo(mapa)
  for (const ponto of pontos) {
    const icone = L.divIcon({ html: '<span>' + ponto.ordem + '</span>', className: 'marcador-ponto', iconSize: [26, 26], iconAnchor: [13, 13] })
    L.marker([ponto.lat, ponto.lng], { icon: icone, title: ponto.ordem + '. ' + ponto.rua }).addTo(mapa)
      .bindPopup(document.createTextNode(ponto.ordem + '. ' + ponto.rua))
  }
  mapa.fitBounds(L.latLngBounds(posicoes), { padding: [30, 30], maxZoom: 17 })
})()
