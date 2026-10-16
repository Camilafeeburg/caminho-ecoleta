import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { buildUserRoute } from './truckRoutes.js'

// Testes do trajeto até o endereço do usuário, com geocodificador e rotas falsos (sem openrouteservice).

const ENDERECO = { cep: '90240-550', logradouro: 'Rua São Jorge', bairro: 'Humaitá', cidade: 'Porto Alegre', uf: 'RS' }

// Rota 1 do catálogo (São Geraldo / Humaitá), resumida a 5 pontos; o 3 sem localização.
function rota(overrides = {}) {
  return {
    id: 1, descricao: 'São Geraldo / Humaitá', tipo: 'Coleta Seletiva', horarioInicio: '18:00', horarioFim: '21:00', criterio: 'bairro', pontoUsuario: null,
    pontos: [
      { ordem: 1, rua: 'Rua São Pedro', numero: null, cep: '90240-005', coordenadas: [-51.201981, -30.010539] },
      { ordem: 2, rua: 'Avenida Pernambuco', numero: null, cep: '90240-000', coordenadas: [-51.196729, -29.998482] },
      { ordem: 3, rua: 'Rua Sem Mapa', numero: null, cep: null, coordenadas: null },
      { ordem: 4, rua: 'Rua São Jorge', numero: null, cep: '90240-550', coordenadas: [-51.200892, -29.994343] },
      { ordem: 5, rua: 'Avenida Palmira Gobbi', numero: null, cep: '90250-210', coordenadas: [-51.191732, -29.987012] },
    ],
    ...overrides,
  }
}

function fakeDirections(calls) {
  return async (coordinates) => {
    calls.push(coordinates)
    return { features: [{ geometry: { type: 'LineString', coordinates }, properties: { summary: { distance: 1, duration: 60 } } }] }
  }
}

describe('buildUserRoute', () => {
  test('endereço que é um ponto da rota: o trajeto termina nele, sem geocodificar', async () => {
    const calls = []
    const result = await buildUserRoute({ endereco: ENDERECO, rota: rota({ criterio: 'cep', pontoUsuario: 4 }) }, {}, {
      geocodeAddress: () => assert.fail('não deveria geocodificar'),
      directions: fakeDirections(calls),
    })
    assert.deepEqual(calls[0], [[-51.201981, -30.010539], [-51.196729, -29.998482], [-51.200892, -29.994343]])
    assert.deepEqual(result.endereco.coordinates, [-51.200892, -29.994343])
    assert.deepEqual(result.points.map((point) => point.ordem), [1, 2])
    // O ponto 3 (sem localização) fica no itinerário porque está antes do endereço; o 4 é o próprio endereço.
    assert.deepEqual(result.itinerary.map((point) => point.ordem), [1, 2, 3])
    assert.equal(result.rota.pontoUsuario, 4)
  })

  test('endereço fora da lista: entra depois do ponto em que menos desvia e é a última parada', async () => {
    const calls = []
    const casa = [-51.199, -29.996]
    const result = await buildUserRoute({ endereco: ENDERECO, rota: rota() }, {}, {
      geocodeAddress: async () => ({ label: 'Casa', coordinates: casa, precise: true }),
      directions: fakeDirections(calls),
    })
    assert.deepEqual(calls[0].at(-1), casa)
    assert.deepEqual(result.points.map((point) => point.ordem), [1, 2])
    assert.deepEqual(result.itinerary.map((point) => point.ordem), [1, 2])
  })

  test('rua com o mesmo nome em outro bairro: usa o centro do bairro do cadastro', async () => {
    const pedidos = []
    const bairro = [-51.195, -29.99]
    const result = await buildUserRoute({ endereco: ENDERECO, rota: rota() }, {}, {
      geocodeAddress: async (endereco) => {
        pedidos.push(endereco.logradouro)
        // Rua São Jorge do Partenon, a ~10 km da rota
        return endereco.logradouro ? { coordinates: [-51.181285, -30.072483], precise: true } : { coordinates: bairro, precise: false }
      },
      directions: fakeDirections([]),
    })
    assert.deepEqual(pedidos, ['Rua São Jorge', ''])
    assert.deepEqual(result.endereco.coordinates, bairro)
    assert.equal(result.endereco.precise, false)
  })

  test('endereço longe da rota mesmo pelo bairro: erro em vez de trajeto errado', async () => {
    await assert.rejects(
      buildUserRoute({ endereco: ENDERECO, rota: rota() }, {}, {
        geocodeAddress: async () => ({ coordinates: [-51.181285, -30.072483], precise: true }),
        directions: () => assert.fail('não deveria calcular a rota'),
      }),
      { status: 422, message: /perto da rota/ },
    )
  })
})
