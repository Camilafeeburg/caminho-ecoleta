/* eslint-disable react-hooks/set-state-in-effect */
import Sidebar from '../../sidebar'
import MudarLocal from './MudarLocal'
import ColSeletiva from './ColSeletiva'
import MeuPerfil from './MeuPerfil'
import Configuracoes from './Configuracoes'
import './Mapa.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import caminhaoUrl from '../../assets/caminhao.png'
import folhasUrl from '../../assets/folhas.svg'

const TRUCK_ICON = L.divIcon({
  html: `<img class="truck-marker" src="${caminhaoUrl}" alt="" />`,
  className: 'truck-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 30],
})

const ROUTE_STYLE = { color: '#1a1a1a', weight: 4, opacity: 0.9, dashArray: '6 8', lineCap: 'round' }
// Rua por onde o caminhão está passando agora.
const CURRENT_STREET_STYLE = { color: '#14532d', weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round', interactive: false }
const FOLLOW_TRUCK_ZOOM = 17
// Tempo que o caminhão fica parado na casa do usuário antes de recomeçar o trajeto.
const ARRIVAL_PAUSE_MS = 5000

// Última parada do trajeto: o endereço do usuário logado.
const HOME_STOP = 'casa'
const HOME_PATH = 'M3 11.5 12 4l9 7.5M5.5 9.5V20h5v-5.5h3V20h5V9.5'
// Mesmo estilo dos pontos numerados, com a casa no lugar do número.
const HOME_ICON = L.divIcon({
  html: `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${HOME_PATH}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  className: 'route-point-icon route-point-home-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

function HomeIcon() {
  return (
    <svg className='route-home-icon' viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
      <path d={HOME_PATH} fill='none' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  )
}

function pointIcon(order) {
  return L.divIcon({ html: `<span>${order}</span>`, className: 'route-point-icon', iconSize: [28, 28], iconAnchor: [14, 14] })
}

// Trechos da rota por rua, a partir das instruções do openrouteservice. Passos seguidos na mesma rua
// viram um trecho só; `from`/`to` são índices nas coordenadas da geometria.
function streetRuns(route) {
  const runs = []
  for (const segment of route?.features?.[0]?.properties?.segments || []) {
    for (const step of segment.steps || []) {
      const [from, to] = step.way_points || []
      if (!Number.isInteger(from) || !Number.isInteger(to) || to <= from) continue
      const name = step.name && step.name !== '-' ? step.name : ''
      const last = runs.at(-1)
      if (last && last.name === name && last.to === from) last.to = to
      else runs.push({ name, from, to })
    }
  }
  return runs
}

function fitRoute(map, route) {
  const bounds = L.geoJSON(route).getBounds()
  if (!bounds.isValid()) return
  // Margem menor em telas estreitas; espaço extra embaixo para a bola do painel não cobrir a rota.
  const padding = map.getSize().x < 600 ? 28 : 56
  map.fitBounds(bounds, { paddingTopLeft: [padding, padding], paddingBottomRight: [padding, padding + 56], maxZoom: 17 })
}

function RouteViewport({ route }) {
  const map = useMap()
  useEffect(() => {
    if (route) fitRoute(map, route)
  }, [map, route])
  return null
}

// Durante o acompanhamento, zoom pela roda do mouse ou pinça mantém o caminhão no centro.
function setCenteredZoom(map, centered) {
  map.options.scrollWheelZoom = centered ? 'center' : true
  map.options.touchZoom = centered ? 'center' : true
}

function ControlIcon({ name }) {
  const paths = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    target: 'M12 2v4M12 18v4M2 12h4M18 12h4',
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'target' && <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />}
      {name === 'target' && <circle cx="12" cy="12" r="2.2" fill="currentColor" />}
      <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

function MapControls({ route, truckPositionRef, following, onFollowingChange }) {
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const containerRef = useRef(null)

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    // Arrastar o mapa encerra o acompanhamento para a pessoa explorar à vontade.
    dragstart: () => onFollowingChange(false),
  })

  // Cliques nos botões não devem arrastar nem dar zoom no mapa.
  useEffect(() => {
    if (!containerRef.current) return
    L.DomEvent.disableClickPropagation(containerRef.current)
    L.DomEvent.disableScrollPropagation(containerRef.current)
  }, [])

  useEffect(() => {
    if (!following) return undefined
    let frame
    let ready = false
    let zooming = false
    const onZoomStart = () => { zooming = true }
    const onZoomEnd = () => { zooming = false }
    const onArrived = () => { ready = true }

    setCenteredZoom(map, true)
    map.on('zoomstart', onZoomStart)
    map.on('zoomend', onZoomEnd)
    const start = truckPositionRef.current
    if (start) {
      map.once('moveend', onArrived)
      map.flyTo(start, FOLLOW_TRUCK_ZOOM, { duration: 0.6 })
    } else {
      ready = true
    }

    function step() {
      const position = truckPositionRef.current
      if (ready && !zooming && position) map.setView(position, map.getZoom(), { animate: false })
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frame)
      map.off('zoomstart', onZoomStart)
      map.off('zoomend', onZoomEnd)
      map.off('moveend', onArrived)
      setCenteredZoom(map, false)
    }
  }, [following, map, truckPositionRef])

  function toggleFollowing() {
    if (following) {
      onFollowingChange(false)
      if (route) fitRoute(map, route)
    } else {
      onFollowingChange(true)
    }
  }

  return (
    <div ref={containerRef} className='mapa-controles' role='group' aria-label='Controles do mapa'>
      <button type='button' className='mapa-controle' onClick={() => map.zoomIn()} disabled={zoom >= map.getMaxZoom()} aria-label='Aproximar' title='Aproximar'>
        <ControlIcon name='plus' />
      </button>
      <button type='button' className='mapa-controle' onClick={() => map.zoomOut()} disabled={zoom <= map.getMinZoom()} aria-label='Afastar' title='Afastar'>
        <ControlIcon name='minus' />
      </button>
      <button
        type='button'
        className='mapa-controle mapa-controle-seguir'
        onClick={toggleFollowing}
        disabled={!route}
        aria-pressed={following}
        aria-label={following ? 'Parar de acompanhar o caminhão e ver a rota inteira' : 'Centralizar e acompanhar o caminhão'}
        title={following ? 'Ver rota inteira' : 'Acompanhar o caminhão'}
      >
        <ControlIcon name='target' />
      </button>
    </div>
  )
}

// Caminhão animado do primeiro ponto da rota até o fim do trajeto (a casa do usuário). Lá ele espera
// ARRIVAL_PAUSE_MS e recomeça do primeiro ponto, em loop.
function TruckMarker({ route, latlngs, streets, streetName, arrived, onStreetChange, onArrivedChange, speed, startedAt, positionRef }) {
  const [position, setPosition] = useState(null)
  const frameRef = useRef()
  const streetIndexRef = useRef(-1)
  const arrivedRef = useRef(false)

  const distanceKm = route?.features?.[0]?.properties?.summary?.distance || 0
  const baseDurationMs = Math.max(8_000, distanceKm * 3000)

  useEffect(() => {
    if (latlngs.length < 2) {
      setPosition(null)
      return undefined
    }

    const cumulative = [0]
    for (let i = 1; i < latlngs.length; i += 1) {
      cumulative.push(cumulative[i - 1] + latlngs[i - 1].distanceTo(latlngs[i]))
    }
    const totalDistance = cumulative[cumulative.length - 1]
    if (totalDistance === 0) {
      positionRef.current = latlngs[0]
      setPosition(latlngs[0])
      return undefined
    }
    function step() {
      // Cada volta: percurso até a casa e a pausa lá.
      const travelMs = baseDurationMs / speed
      const elapsed = Math.max(0, Date.now() - startedAt) % (travelMs + ARRIVAL_PAUSE_MS)
      const progress = Math.min(1, elapsed / travelMs)
      const targetDistance = progress * totalDistance

      let index = cumulative.findIndex((value) => value >= targetDistance)
      if (index <= 0) index = 1

      const segmentStart = cumulative[index - 1]
      const segmentEnd = cumulative[index]
      const segmentProgress = segmentEnd > segmentStart ? (targetDistance - segmentStart) / (segmentEnd - segmentStart) : 0

      const from = latlngs[index - 1]
      const to = latlngs[index]
      const current = L.latLng(
        from.lat + (to.lat - from.lat) * segmentProgress,
        from.lng + (to.lng - from.lng) * segmentProgress,
      )
      positionRef.current = current
      setPosition(current)

      // Avisa só quando o caminhão entra em outra rua.
      const streetIndex = streets.findIndex((street) => index - 1 >= street.from && index - 1 < street.to)
      if (streetIndex !== streetIndexRef.current) {
        streetIndexRef.current = streetIndex
        onStreetChange(streetIndex)
      }

      // Avisa quando chega à casa do usuário e quando sai de novo do primeiro ponto.
      const atHome = progress >= 1
      if (atHome !== arrivedRef.current) {
        arrivedRef.current = atHome
        onArrivedChange(atHome)
      }

      frameRef.current = requestAnimationFrame(step)
    }

    frameRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameRef.current)
  }, [latlngs, streets, onStreetChange, onArrivedChange, baseDurationMs, speed, startedAt, positionRef])

  if (!position) return null
  const label = arrived ? 'Chegou ao seu endereço' : streetName
  return (
    // Acima do marcador da casa quando para sobre ele.
    <Marker position={position} icon={TRUCK_ICON} interactive={false} zIndexOffset={1000}>
      {label && <Tooltip permanent direction='top' offset={[0, -30]} className='truck-street-label'>{label}</Tooltip>}
    </Marker>
  )
}

function formatDuration(seconds = 0) {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}min`
}

function formatDistance(km = 0) {
  return `${km.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}

function Chevron({ direction }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Mapa({ onSair, onSessaoExpirada }) {
  const [pagina, setPagina] = useState('mapa')
  const [routeState, setRouteState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [followingTruck, setFollowingTruck] = useState(false)
  // O caminhão está parado na casa do usuário (fim do trajeto), antes de recomeçar.
  const [arrived, setArrived] = useState(false)
  const truckPositionRef = useRef(null)

  const result = routeState?.result
  const rota = result?.rota
  const endereco = result?.endereco
  const summary = result?.route?.features?.[0]?.properties?.summary
  const routeLatLngs = useMemo(() => (result?.route?.features?.[0]?.geometry?.coordinates || []).map(([lng, lat]) => L.latLng(lat, lng)), [result?.route])
  const streets = useMemo(() => streetRuns(result?.route), [result?.route])
  const [streetIndex, setStreetIndex] = useState(-1)
  const currentStreet = streets[streetIndex]
  // Trecho de rua de cada parada (pontos da rota e, por último, o endereço do usuário): o que contém
  // a parada na rota (ou termina nela). Usa o nome do mapa, que pode diferir do cadastro
  // (ex.: "A. J. Renner" = "Antônio Jacob Renner").
  const pointStreets = useMemo(() => {
    const waypoints = result?.route?.features?.[0]?.properties?.way_points || []
    const stops = [...(result?.points || []).map((point) => point.ordem), HOME_STOP]
    return stops.map((ordem, index) => {
      const waypoint = waypoints[index]
      const containing = streets.findIndex((street) => waypoint >= street.from && waypoint < street.to)
      return { ordem, street: containing >= 0 ? containing : streets.findIndex((street) => street.to === waypoint) }
    })
  }, [result, streets])
  // Paradas na rua por onde o caminhão passa agora. A mesma rua pode aparecer em duas paradas
  // (ex.: A. J. Renner); no trecho da parada destaca só ela, fora dele destaca todas com aquele nome.
  const activeOrders = new Set(pointStreets.filter((point) => point.street === streetIndex && streetIndex >= 0).map((point) => point.ordem))
  if (!activeOrders.size && currentStreet?.name) {
    for (const point of pointStreets) if (streets[point.street]?.name === currentStreet.name) activeOrders.add(point.ordem)
  }
  const mapCenter = useMemo(() => [-30.0218, -51.2117], [])
  const statusText = loading ? 'Montando o trajeto até o seu endereço…' : 'Rota indisponível'
  const slides = [
    { label: 'Janela de coleta', value: rota ? `${rota.horarioInicio}–${rota.horarioFim}` : '--' },
    { label: 'Distância até o seu endereço', value: summary ? formatDistance(summary.distance) : '--' },
    { label: 'Tempo estimado até você', value: summary ? formatDuration(summary.duration) : '--' },
  ]
  const currentSlide = slides[slideIndex]
  const changeSlide = (step) => setSlideIndex((index) => (index + step + slides.length) % slides.length)

  // A rota vem sempre do cadastro do usuário logado (CEP e endereço), via API PHP.
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    setLoading(true)
    setFollowingTruck(false)
    setArrived(false)
    fetch('/api/minha-rota', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) { onSessaoExpirada(); return }
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Não foi possível carregar a rota do caminhão.')
        if (!data.route?.features?.[0] || !data.points?.length || !data.itinerary?.length || !data.endereco?.coordinates) {
          throw new Error('A rota retornada está incompleta.')
        }
        if (controller.signal.aborted) return
        setRouteState({ result: data, startedAt: Date.now() })
      })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [onSessaoExpirada, retry])

  // Renderizar páginas diferentes baseado no estado 'pagina'
  if (pagina !== 'mapa') {
    return (
      <div className='app app-pagina'>
        <header className='topo'>
          <a className='marca' href='#home' aria-label='Ecoleta, voltar ao mapa' onClick={(event) => { event.preventDefault(); setPagina('mapa') }}>
            <img className='marca-icone' src={caminhaoUrl} alt='' />
            <span className='marca-nome'>ÉCOLETA</span>
          </a>
          <Sidebar onSair={onSair} onMudarPagina={setPagina} />
        </header>

        {pagina === 'mudarlocal' && <MudarLocal onVoltar={() => setPagina('mapa')} />}
        {pagina === 'meuperfil' && <MeuPerfil onVoltar={() => setPagina('mapa')} />}
        {pagina === 'colseletiva' && <ColSeletiva onVoltar={() => setPagina('mapa')} />}
        {pagina === 'configuracoes' && <Configuracoes onVoltar={() => setPagina('mapa')} />}
      </div>
    )
  }

  // Renderizar página de mapa padrão
  return (
    <div className='app'>
      <header className='topo'>
        <a className='marca' href='#home' aria-label='Ecoleta, página inicial'>
          <img className='marca-icone' src={caminhaoUrl} alt='' />
          <span className='marca-nome'>ÉCOLETA</span>
        </a>
        <Sidebar onSair={onSair} onMudarPagina={setPagina} />
      </header>

      <main className='mapa-area' aria-label='Mapa da rota do caminhão'>
        <MapContainer center={mapCenter} zoom={14} zoomSnap={0.25} zoomControl={false} className='map'>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            maxZoom={19}
          />
          {result?.route && <GeoJSON key={JSON.stringify(result.route.bbox)} data={result.route} style={ROUTE_STYLE} />}
          {result?.route && currentStreet && <Polyline positions={routeLatLngs.slice(currentStreet.from, currentStreet.to + 1)} pathOptions={CURRENT_STREET_STYLE} />}
          {result?.points.map((point) => (
            <Marker key={point.ordem} position={[point.coordinates[1], point.coordinates[0]]} icon={pointIcon(point.ordem)}>
              <Popup>
                <strong>Ponto {point.ordem}: {point.rua}{point.numero ? `, ${point.numero}` : ''}</strong>
                {point.cep && <><br />CEP: {point.cep}</>}
              </Popup>
            </Marker>
          ))}
          {endereco && (
            <Marker position={[endereco.coordinates[1], endereco.coordinates[0]]} icon={HOME_ICON}>
              <Popup>
                <strong>Seu endereço</strong><br />{endereco.logradouro}
                {endereco.cep && <><br />CEP: {endereco.cep}</>}
                {!endereco.precise && <><br /><small>Localização aproximada da sua rua.</small></>}
              </Popup>
            </Marker>
          )}
          {result?.route && <TruckMarker
            key={`truck-${JSON.stringify(result.route.bbox)}`}
            route={result.route}
            latlngs={routeLatLngs}
            streets={streets}
            streetName={currentStreet?.name}
            arrived={arrived}
            onStreetChange={setStreetIndex}
            onArrivedChange={setArrived}
            speed={0.5}
            startedAt={routeState.startedAt}
            positionRef={truckPositionRef}
          />}
          <RouteViewport route={result?.route} />
          <MapControls route={result?.route} truckPositionRef={truckPositionRef} following={followingTruck} onFollowingChange={setFollowingTruck} />
        </MapContainer>

        <section className='truck-route-panel' aria-labelledby='trajeto-titulo'>
          <h2 id='trajeto-titulo'>Trajeto do caminhão</h2>
          {rota && <p className='route-subtitle'>Caminhão {rota.id} · {rota.descricao}</p>}
          {loading && !result && <p role='status'>Carregando o itinerário…</p>}
          {result && <ol className='route-points'>
            {result.itinerary.map((point) => {
              const active = activeOrders.has(point.ordem)
              return (
                <li key={point.ordem} className={!point.localizado ? 'route-point-off' : active ? 'route-point-active' : undefined} aria-current={active ? 'location' : undefined}>
                  {point.rua}{point.numero ? `, ${point.numero}` : ''}{point.cep ? ` · ${point.cep}` : ''}
                  {!point.localizado && <small> (não localizado no mapa)</small>}
                </li>
              )
            })}
            <li
              className={activeOrders.has(HOME_STOP) ? 'route-point-home route-point-active' : 'route-point-home'}
              aria-current={activeOrders.has(HOME_STOP) ? 'location' : undefined}
            >
              <HomeIcon />
              <span><strong>Seu endereço</strong> · {endereco.logradouro}{endereco.cep ? ` · ${endereco.cep}` : ''}</span>
            </li>
          </ol>}
          {error && <div className='route-error' role='alert'>
            <p>{error}</p>
            <button type='button' onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button>
          </div>}
        </section>
      </main>

      <footer className='painel'>
        <img className='painel-folhas painel-folhas-esq' src={folhasUrl} alt='' aria-hidden='true' />
        <img className='painel-folhas painel-folhas-dir' src={folhasUrl} alt='' aria-hidden='true' />

        <div className='painel-bola' aria-hidden='true'>
          <img src={caminhaoUrl} alt='' />
        </div>

        {/* Celular e tablet: um dado por vez, trocado pelas setas */}
        <div className='painel-carrossel'>
          <button className='painel-seta' type='button' onClick={() => changeSlide(-1)} aria-label='Informação anterior'>
            <Chevron direction='left' />
          </button>
          <div className='painel-info' aria-live='polite' key={slideIndex}>
            <span className='painel-rotulo'>{summary ? currentSlide.label : statusText}</span>
            <strong className='painel-valor'>{currentSlide.value}</strong>
          </div>
          <button className='painel-seta' type='button' onClick={() => changeSlide(1)} aria-label='Próxima informação'>
            <Chevron direction='right' />
          </button>
        </div>

        {/* Desktop e monitores largos: os três dados lado a lado */}
        <dl className='painel-estatisticas'>
          {[slides[1], slides[0], slides[2]].map((slide, index) => (
            <div key={slide.label} className={index === 1 ? 'painel-info painel-info-principal' : 'painel-info'}>
              <dt className='painel-rotulo'>{index === 1 && !summary ? statusText : slide.label}</dt>
              <dd className='painel-valor'>{slide.value}</dd>
            </div>
          ))}
        </dl>
      </footer>
    </div>
  )
}

export default Mapa
