// Trajeto do caminhão até o endereço do usuário logado. A rota e os pontos vêm da API PHP
// (api/rota_usuario.php), que lê as tabelas criadas por db/caminho-estrutura.sql.

function fail(message, status = 422) {
  const error = new Error(message)
  error.status = status
  throw error
}

export function validCoordinates(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
    && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90
}

function sameCoordinates(a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

// Distância em metros entre dois pontos [longitude, latitude] (haversine).
function distance([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a))
}

// Índice do ponto da rota depois do qual o caminhão passa pelo endereço: o encaixe que menos
// aumenta o percurso entre dois pontos seguidos (ou depois do último ponto).
export function homeInsertionIndex(coordinates, home) {
  let best = 0
  let bestCost = Infinity
  coordinates.forEach((point, index) => {
    const next = coordinates[index + 1]
    const cost = next ? distance(point, home) + distance(home, next) - distance(point, next) : distance(point, home)
    if (cost < bestCost) {
      best = index
      bestCost = cost
    }
  })
  return best
}

// Distância do ponto mais próximo da rota.
function distanceToRoute(coordinates, home) {
  return Math.min(...coordinates.map((point) => distance(point, home)))
}

// Mais longe que isso de todos os pontos da rota, o endereço localizado provavelmente é uma rua
// com o mesmo nome em outro bairro (ex.: há mais de uma Rua São Jorge em Porto Alegre).
const MAX_HOME_DISTANCE_M = 3000

// Endereço do usuário fora da lista de pontos: localiza no mapa, conferindo se ficou perto da rota.
async function locateHome(endereco, routeCoordinates, geocodeAddress) {
  let home = await geocodeAddress(endereco)
  if (validCoordinates(home?.coordinates) && distanceToRoute(routeCoordinates, home.coordinates) <= MAX_HOME_DISTANCE_M) return home
  // Rua localizada longe da rota: usa o centro do bairro do cadastro.
  if (endereco.bairro) {
    home = await geocodeAddress({ ...endereco, logradouro: '' })
    if (validCoordinates(home?.coordinates) && distanceToRoute(routeCoordinates, home.coordinates) <= MAX_HOME_DISTANCE_M) {
      return { ...home, precise: false }
    }
  }
  fail('Não foi possível localizar o seu endereço perto da rota do caminhão. Confira o CEP e o endereço do seu cadastro.')
}

export async function buildUserRoute(data, restrictions, { geocodeAddress, directions }) {
  const rota = data?.rota
  const endereco = data?.endereco
  if (!rota || !Array.isArray(rota.pontos) || !endereco) fail('A API de rotas retornou dados inválidos.', 502)

  const located = rota.pontos.filter((point) => validCoordinates(point.coordenadas))
  if (!located.length) fail(`A rota ${rota.id} não tem pontos localizados no mapa.`)
  const toPoint = (point) => ({ ordem: point.ordem, rua: point.rua, numero: point.numero, cep: point.cep, coordinates: point.coordenadas })

  // O trajeto sempre termina no endereço do usuário.
  let home
  let points
  const userPoint = located.find((point) => point.ordem === rota.pontoUsuario)
  if (userPoint) {
    // O endereço é um ponto da rota (mesmo CEP ou mesma rua): o trajeto vai até ele, com as coordenadas da rota.
    home = { label: endereco.logradouro, coordinates: userPoint.coordenadas, precise: true }
    points = located.filter((point) => point.ordem < userPoint.ordem).map(toPoint)
    if (!points.length) fail('O seu endereço é o ponto de partida do caminhão; não há trajeto até ele.')
  } else {
    // Fora da lista: entra depois do ponto da rota em que menos desvia o caminhão.
    home = await locateHome(endereco, located.map((point) => point.coordenadas), geocodeAddress)
    const lastIndex = homeInsertionIndex(located.map((point) => point.coordenadas), home.coordinates)
    points = located.slice(0, lastIndex + 1).map(toPoint)
    // Endereço exatamente sobre o último ponto: esse ponto passa a ser o endereço.
    if (sameCoordinates(points.at(-1).coordinates, home.coordinates)) points.pop()
    if (!points.length) fail('O seu endereço é o ponto de partida do caminhão; não há trajeto até ele.')
  }
  const waypoints = [...points.map((point) => point.coordinates), home.coordinates]

  const route = await directions(waypoints, restrictions)
  if (route?.features?.[0]?.geometry?.type !== 'LineString' || route.features[0].geometry.coordinates.length < 2) {
    fail('O serviço retornou uma geometria de rota inválida.', 502)
  }

  // Itinerário até o endereço (a última parada), incluindo ruas sem localização no mapa que ficam no caminho.
  const lastOrder = userPoint ? userPoint.ordem - 1 : points.at(-1).ordem
  const itinerary = rota.pontos
    .filter((point) => point.ordem <= lastOrder)
    .map((point) => ({ ordem: point.ordem, rua: point.rua, numero: point.numero, cep: point.cep, localizado: validCoordinates(point.coordenadas) }))

  return {
    rota: { id: rota.id, descricao: rota.descricao, tipo: rota.tipo, horarioInicio: rota.horarioInicio, horarioFim: rota.horarioFim, criterio: rota.criterio, pontoUsuario: userPoint?.ordem ?? null },
    endereco: { ...endereco, label: home.label, coordinates: home.coordinates, precise: home.precise },
    points,
    itinerary,
    route,
    restrictions,
  }
}
