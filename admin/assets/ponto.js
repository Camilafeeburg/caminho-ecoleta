// Formulário do ponto: busca do CEP (cep.php) e mapa para conferir ou ajustar a localização.
(function () {
  const form = document.getElementById('form-ponto')
  if (!form) return

  const campos = {
    cep: document.getElementById('cep'),
    numero: document.getElementById('numero'),
    rua: document.getElementById('rua'),
    bairro: document.getElementById('bairro'),
    latitude: document.getElementById('latitude'),
    longitude: document.getElementById('longitude'),
  }
  const botao = document.getElementById('buscar-cep')
  const status = document.getElementById('status-busca')
  const PORTO_ALEGRE = [-30.0346, -51.2177]

  function mostrarStatus(texto, tipo) {
    status.textContent = texto
    status.className = 'status-busca largura-total' + (tipo ? ' status-' + tipo : '')
  }

  // Máscara 00000-000
  campos.cep.addEventListener('input', () => {
    const digitos = campos.cep.value.replace(/\D/g, '').slice(0, 8)
    campos.cep.value = digitos.length > 5 ? digitos.slice(0, 5) + '-' + digitos.slice(5) : digitos
  })
  // Enter no CEP busca, em vez de enviar o formulário.
  campos.cep.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
      evento.preventDefault()
      buscar()
    }
  })
  botao.addEventListener('click', buscar)

  // Mapa com marcador arrastável
  const lat = parseFloat(campos.latitude.value)
  const lng = parseFloat(campos.longitude.value)
  const temPosicao = Number.isFinite(lat) && Number.isFinite(lng)
  const mapa = L.map('mapa-ponto').setView(temPosicao ? [lat, lng] : PORTO_ALEGRE, temPosicao ? 17 : 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa)
  let marcador = null

  function posicionar(latitude, longitude, centralizar) {
    campos.latitude.value = latitude.toFixed(7)
    campos.longitude.value = longitude.toFixed(7)
    if (!marcador) {
      marcador = L.marker([latitude, longitude], { draggable: true }).addTo(mapa)
      marcador.on('dragend', () => {
        const posicao = marcador.getLatLng()
        posicionar(posicao.lat, posicao.lng, false)
      })
    } else {
      marcador.setLatLng([latitude, longitude])
    }
    if (centralizar) mapa.setView([latitude, longitude], 17)
  }

  if (temPosicao) posicionar(lat, lng, false)
  mapa.on('click', (evento) => posicionar(evento.latlng.lat, evento.latlng.lng, false))

  // Coordenadas digitadas à mão movem o marcador.
  for (const campo of [campos.latitude, campos.longitude]) {
    campo.addEventListener('change', () => {
      const latitude = parseFloat(campos.latitude.value.replace(',', '.'))
      const longitude = parseFloat(campos.longitude.value.replace(',', '.'))
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) posicionar(latitude, longitude, true)
    })
  }

  async function buscar() {
    const cep = campos.cep.value.replace(/\D/g, '')
    if (cep.length !== 8) {
      mostrarStatus('Informe um CEP com 8 dígitos.', 'erro')
      campos.cep.focus()
      return
    }

    botao.disabled = true
    mostrarStatus('Buscando o CEP…')
    try {
      const parametros = new URLSearchParams({ cep, numero: campos.numero.value.trim() })
      const resposta = await fetch('cep.php?' + parametros, { headers: { Accept: 'application/json' } })
      const dados = await resposta.json().catch(() => ({}))
      if (resposta.status === 401) {
        window.location.href = 'login.php'
        return
      }
      if (!resposta.ok || !dados.sucesso) {
        mostrarStatus(dados.mensagem || 'Não foi possível buscar o CEP.', 'erro')
        return
      }

      const endereco = dados.endereco
      campos.cep.value = endereco.cep
      // CEP geral da cidade não tem rua: mantém o que já estava digitado.
      if (endereco.logradouro) campos.rua.value = endereco.logradouro
      campos.bairro.value = [endereco.bairro, endereco.cidade + '/' + endereco.uf].filter(Boolean).join(' · ')

      if (dados.localizacao) posicionar(dados.localizacao.latitude, dados.localizacao.longitude, true)

      const encontrado = [endereco.logradouro, endereco.bairro, endereco.cidade + '/' + endereco.uf].filter(Boolean).join(', ')
      mostrarStatus(dados.aviso ? encontrado + '. ' + dados.aviso : encontrado + '. Localização encontrada; confira o marcador no mapa.', dados.aviso ? 'alerta' : 'sucesso')
    } catch {
      mostrarStatus('Não foi possível conectar ao servidor.', 'erro')
    } finally {
      botao.disabled = false
    }
  }
})()
