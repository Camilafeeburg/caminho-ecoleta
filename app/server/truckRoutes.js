import fs from 'node:fs/promises'
import crypto from 'node:crypto'

function fail(message, status = 422) {
  const error = new Error(message)
  error.status = status
  throw error
}

export function validCoordinates(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite)
    && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90
}

export async function readTruckCatalog(file) {
  let text
  try { text = await fs.readFile(file, 'utf8') } catch {
    fail('Arquivo caminhao.json não encontrado ou não pode ser lido.', 503)
  }
  let data
  try { data = JSON.parse(text) } catch { fail('O arquivo caminhao.json contém JSON inválido.') }
  if (!Array.isArray(data?.caminhoes) || !data.caminhoes.length) fail('Informe a lista de caminhões em caminhao.json.')
  const ids = new Set()
  const caminhoes = data.caminhoes.map((truck) => {
    if (!truck || !Number.isSafeInteger(truck.id) || truck.id <= 0 || ids.has(truck.id)) fail('Cada caminhão deve ter um ID inteiro positivo e único.')
    ids.add(truck.id)
    if (!Array.isArray(truck.enderecos) || truck.enderecos.length < 2 || truck.enderecos.length > 50) {
      fail(`Caminhão ${truck.id}: informe entre 2 e 50 pontos.`)
    }
    const enderecos = truck.enderecos.map((point, index) => {
      if (!point || typeof point.rua !== 'string' || !point.rua.trim() || point.rua.length > 200) fail(`Caminhão ${truck.id}, ponto ${index + 1}: rua inválida.`)
      if (point.coordenadas !== undefined && !validCoordinates(point.coordenadas)) fail(`Caminhão ${truck.id}, ponto ${index + 1}: use coordenadas [longitude, latitude] válidas.`)
      if (point.cep != null && (typeof point.cep !== 'string' || !/^\d{5}-?\d{3}$/.test(point.cep))) fail(`Caminhão ${truck.id}, ponto ${index + 1}: CEP inválido.`)
      return { rua: point.rua.trim(), cep: point.cep || null, ...(point.coordenadas ? { coordenadas: point.coordenadas } : {}) }
    })
    // O catálogo fornecido pertence a Porto Alegre. Cidade e UF podem ser explicitadas por caminhão.
    return { id: truck.id, bairro: String(truck.bairro || ''), tipo: String(truck.tipo || ''),
      horarioInicio: String(truck.horarioInicio || ''), horarioFim: String(truck.horarioFim || ''),
      cidade: String(truck.cidade || 'Porto Alegre'), uf: String(truck.uf || 'RS'), enderecos }
  })
  return { version: crypto.createHash('sha256').update(text).digest('hex'), caminhoes }
}

export async function buildCatalogRoute(catalog, truckId, restrictions, { geocodePoint, directions }) {
  if (!Number.isSafeInteger(truckId) || truckId <= 0) fail('Informe um truckId inteiro positivo.', 400)
  const truck = catalog.caminhoes.find((item) => item.id === truckId)
  if (!truck) fail('Caminhão não encontrado no catálogo.', 404)
  const points = []
  // Consultas sequenciais limitam rajadas ao geocodificador e mantêm o diagnóstico por ponto.
  for (const [index, point] of truck.enderecos.entries()) {
    let resolved
    try {
      resolved = point.coordenadas
        ? { coordinates: point.coordenadas, label: point.rua, precise: true, source: 'catalogo' }
        : await geocodePoint({ address: point.rua, postalcode: point.cep || '', locality: truck.cidade, region: truck.uf })
      if (!validCoordinates(resolved?.coordinates)) fail('Coordenadas retornadas são inválidas.')
      if (points.length && points.at(-1).coordinates.every((n, i) => n === resolved.coordinates[i])) {
        fail('Dois pontos consecutivos foram localizados no mesmo lugar. Informe coordenadas distintas para definir o trecho.')
      }
    } catch (error) {
      fail(`Caminhão ${truck.id}, ponto ${index + 1} (${point.rua}): ${error.message}`, error.status || 502)
    }
    points.push({ ...resolved, ordem: index + 1, rua: point.rua, cep: point.cep })
  }
  const route = await directions(points.map((point) => point.coordinates), restrictions)
  if (route?.features?.[0]?.geometry?.type !== 'LineString' || route.features[0].geometry.coordinates.length < 2) {
    fail('O serviço retornou uma geometria de rota inválida.', 502)
  }
  return { truck, catalogVersion: catalog.version, points, start: points[0], end: points.at(-1), route, restrictions,
    warnings: points.filter((point) => !point.precise).map((point) => `Ponto ${point.ordem}: localização aproximada de ${point.rua}.`) }
}
