import { useCallback, useEffect, useRef, useState } from 'react'
import { AttributionControl, Map, setWorkerUrl } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import LayoutEditor from '../dev/LayoutEditor'
import background from '../../Art/telescope/t-main/t-background.PNG'
import bar from '../../Art/telescope/t-main/t-bar.PNG'
import button1 from '../../Art/telescope/t-main/t-button1.PNG'
import button2 from '../../Art/telescope/t-main/t-button2.PNG'
import dialog from '../../Art/telescope/t-main/t-dialog.PNG'
import striped from '../../Art/telescope/t-main/t-striped.PNG'
import telescope from '../../Art/telescope/t-main/t-telescope.PNG'
import ribbon from '../../Art/telescope/t-main/t-ribbon.PNG'
import PortalBackButton from './PortalBackButton'
import './GlobePage.css'
import './TelescopePage.css'

const TELESCOPE_ASSETS = [
  { id: 't-bar', src: bar, width: 1358, height: 680 },
  { id: 't-button1', src: button1, width: 463, height: 502 },
  { id: 't-button2', src: button2, width: 467, height: 592 },
  { id: 't-dialog', src: dialog, width: 971, height: 789 },
  { id: 't-striped', src: striped, width: 1401, height: 2028 },
  { id: 't-telescope', src: telescope, width: 2194, height: 2028 },
  { id: 't-ribbon', src: ribbon, width: 1157, height: 369 },
]

// Layout values are percentages of the shared Telescope stage.
const BASELINE_LAYOUT = {
  map: { x: -6.39, y: -3.53, width: 77.43, rotation: 0, zIndex: 0 },
  't-background': { x: -1.09, y: -1.48, width: 101.77, rotation: 0, zIndex: 0 },
  't-bar': { x: 60.36, y: 20.66, width: 40.31, rotation: 0, zIndex: 1 },
  't-button1': { x: 55.53, y: 49.72, width: 13.83, rotation: 0, zIndex: 6 },
  't-button2': { x: 55.43, y: 69.18, width: 13.42, rotation: 0, zIndex: 6 },
  't-dialog': { x: 68.32, y: 54.11, width: 27.67, rotation: 0, zIndex: 4 },
  't-striped': { x: 59.33, y: -3.8, width: 42.26, rotation: 0, zIndex: 5 },
  't-telescope': { x: 1.41, y: -1.11, width: 63.08, rotation: 0, zIndex: 5 },
  't-ribbon': { x: -4.4, y: 73.31, width: 31.68, rotation: -0.76, zIndex: 7 },
}

const TELESCOPE_LAYOUT_DRAFT_KEY = 'telescope-layout-v2'
// Shared design coordinate system for every Telescope layout item.
const TELESCOPE_STAGE = { width: 880, height: 504 }
const MAX_MAP_PIXEL_RATIO = 4
const OBSERVATION_BACKGROUND = '#fff9e9'

setWorkerUrl(workerUrl)

const OCEAN_COLOR = '#8fcbe3'

// Liberty layers behind water: water = ocean and lakes, waterway_* = rivers.
function applyMapPalette(map) {
  const paint = (id, property, value) => map.getLayer(id) && map.setPaintProperty(id, property, value)
  paint('background', 'background-color', OBSERVATION_BACKGROUND)
  paint('water', 'fill-color', OCEAN_COLOR)
  ;['waterway_tunnel', 'waterway_river', 'waterway_other'].forEach(id => paint(id, 'line-color', OCEAN_COLOR))
}

// Public raster and DEM endpoints from MapLibre's hybrid-terrain example.
function createSatelliteStyle() {
  return {
    version: 8,
    projection: { type: 'globe' },
    sources: {
      satelliteSource: {
        type: 'raster',
        tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg'],
        tileSize: 256,
        attribution: '<a href="https://cloudless.eox.at">EOxCloudless</a> by <a href="https://eox.at">EOX IT Services GmbH</a> (Contains modified Copernicus Sentinel data 2020) · <a href="https://maps.eox.at">EOX::Maps</a>',
      },
      terrainSource: {
        type: 'raster-dem',
        // TileJSON supplies Terrarium encoding, 512px tiles and Mapterhorn credit.
        url: 'https://tiles.mapterhorn.com/tilejson.json',
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': OBSERVATION_BACKGROUND } },
      { id: 'satellite', type: 'raster', source: 'satelliteSource' },
    ],
    terrain: { source: 'terrainSource', exaggeration: 1 },
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 2, 0] },
  }
}

export function TelescopeMap({ mode, attributionHostRef, onReady, onStatus, onObservation }) {
  const callbacks = useRef({ onReady, onStatus, onObservation })
  callbacks.current = { onReady, onStatus, onObservation }
  const containerRef = useRef(null)
  const requestedModeRef = useRef(mode)
  const switchModeRef = useRef(null)

  useEffect(() => {
    requestedModeRef.current = mode
    switchModeRef.current?.()
  }, [mode])

  useEffect(() => {
    const map = new Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [121, 23.5],
      zoom: 1,
      attributionControl: false,
    })
    map.addControl(new AttributionControl({ compact: false }), 'bottom-left')
    // Keep MapLibre's native corner positioning in the existing unmasked host.
    // Moving this corner once makes both modes visible above the Telescope PNGs.
    const attributionPosition = containerRef.current.querySelector('.maplibregl-ctrl-bottom-left')
    attributionHostRef.current.appendChild(attributionPosition)
    const globeMaxPitch = map.getMaxPitch()
    const pitches = { globe: map.getPitch(), satellite: 70 }
    let activeMode = 'globe'
    let loadingStyle = true
    let pendingLocation = null
    const flyToPendingLocation = () => {
      if (!pendingLocation || loadingStyle || activeMode !== requestedModeRef.current) return
      const location = pendingLocation
      pendingLocation = null
      map.flyTo({ center: [location.longitude, location.latitude], zoom: location.zoom ?? 12, bearing: location.bearing ?? 0, pitch: location.pitch ?? pitches[activeMode], roll: location.roll ?? 0, essential: false })
    }

    const switchMode = () => {
      const nextMode = requestedModeRef.current
      // Serialize style changes; rapid clicks keep only the latest request.
      if (loadingStyle || nextMode === activeMode) return
      pitches[activeMode] = map.getPitch()
      map.stop()
      if (map.getTerrain()) map.setTerrain(null)
      activeMode = nextMode
      loadingStyle = true
      callbacks.current.onStatus?.("loading")
      map.setMaxPitch(nextMode === 'satellite' ? 95 : globeMaxPitch)
      map.setPitch(pitches[nextMode])
      // Replace style resources, retaining the instance, canvas and camera location.
      map.setStyle(nextMode === 'satellite' ? createSatelliteStyle() : 'https://tiles.openfreemap.org/styles/liberty', { diff: false })
    }
    switchModeRef.current = switchMode
    map.on('style.load', () => {
      if (activeMode === 'globe') {
        map.setProjection({ type: 'globe' })
        applyMapPalette(map)
      }
      loadingStyle = false
      switchMode()
      flyToPendingLocation()
    })

    const capture = () => ({ longitude: map.getCenter().wrap().lng, latitude: map.getCenter().lat, bearing: map.getBearing(), pitch: map.getPitch(), roll: map.getRoll(), zoom: map.getZoom(), mode: activeMode })
    const report = () => callbacks.current.onObservation?.(capture())
    map.on('moveend', report)
    map.on('rotate', report)
    map.on('idle', () => { flyToPendingLocation(); if (!loadingStyle && requestedModeRef.current === activeMode) callbacks.current.onStatus?.('ready'); report() })
    map.on('error', () => callbacks.current.onStatus?.('error'))
    callbacks.current.onStatus?.('loading')
    callbacks.current.onReady?.({ goTo: location => { pendingLocation = location; requestedModeRef.current = location.mode === 'satellite' ? 'satellite' : 'globe'; switchMode(); flyToPendingLocation() }, getLocation: () => loadingStyle || map.isMoving() || activeMode !== requestedModeRef.current ? null : capture() })
    const stageElement = containerRef.current.closest('.layout-editor-stage-box')
    let resolutionFrame = null
    const syncRenderingResolution = () => {
      resolutionFrame = null
      // Read the existing stage transform; do not duplicate its responsive logic.
      const transform = stageElement ? getComputedStyle(stageElement).transform : 'none'
      const matrix = transform === 'none' ? null : new DOMMatrixReadOnly(transform)
      const stageScale = matrix ? Math.hypot(matrix.a, matrix.b) : 1
      const pixelRatio = Math.min(MAX_MAP_PIXEL_RATIO, window.devicePixelRatio * stageScale)
      // The supported API resizes MapLibre's drawing buffer and keeps CSS/input coordinates intact.
      if (Math.abs(map.getPixelRatio() - pixelRatio) > 0.001) map.setPixelRatio(pixelRatio)
      else map.resize()
    }
    const scheduleResolutionSync = () => {
      if (resolutionFrame === null) resolutionFrame = requestAnimationFrame(syncRenderingResolution)
    }
    const observer = new ResizeObserver(scheduleResolutionSync)
    observer.observe(containerRef.current)
    const stageObserver = new MutationObserver(scheduleResolutionSync)
    if (stageElement) stageObserver.observe(stageElement, { attributes: true, attributeFilter: ['style'] })
    window.addEventListener('resize', scheduleResolutionSync)
    syncRenderingResolution()

    return () => {
      callbacks.current.onReady?.(null)
      switchModeRef.current = null
      observer.disconnect()
      stageObserver.disconnect()
      window.removeEventListener('resize', scheduleResolutionSync)
      if (resolutionFrame !== null) cancelAnimationFrame(resolutionFrame)
      map.remove()
      attributionPosition.remove()
    }
  }, [])

  return <div ref={containerRef} className="telescope-map" role="region" aria-label={mode === 'satellite' ? 'Telescope VIEW terrain map' : 'Telescope MAP map'} />
}

function createInitialItems() {
  return [
    { id: 'map', isNode: true, ...BASELINE_LAYOUT.map, ratio: 490 / 400 },
    { id: 't-background', src: background, ...BASELINE_LAYOUT['t-background'], ratio: TELESCOPE_STAGE.width / TELESCOPE_STAGE.height },
    ...TELESCOPE_ASSETS.map(asset => ({
      id: asset.id,
      src: asset.src,
      ...BASELINE_LAYOUT[asset.id],
      ratio: asset.width / asset.height,
    })),
  ]
}

function TelescopePage({ onBack }) {
  const [initialItems] = useState(createInitialItems)
  const [items, setItems] = useState(initialItems)
  const updateItems = useCallback(nextItems => setItems(nextItems), [])
  const [mode, setMode] = useState('globe')
  const attributionHostRef = useRef(null)
  const activateMode = useCallback(id => {
    if (id === 't-button1') setMode('globe')
    if (id === 't-button2') setMode('satellite')
  }, [])

  return (
    <main className="telescope-page" aria-label="Telescope">
      <LayoutEditor
        items={items}
        initialItems={initialItems}
        onChange={updateItems}
        layoutId="telescope"
        stage={TELESCOPE_STAGE}
        draftKey={TELESCOPE_LAYOUT_DRAFT_KEY}
        onItemActivate={activateMode}
        renderItemOverlay={item => item.id === 't-button1' ? <span className="telescope-mode-label telescope-mode-label--map">MAP</span> : item.id === 't-button2' ? <span className="telescope-mode-label telescope-mode-label--view">VIEW</span> : null}
        renderNode={() => <TelescopeMap mode={mode} attributionHostRef={attributionHostRef} />}
      />
      <div ref={attributionHostRef} className="telescope-attribution" />
      <PortalBackButton onBack={onBack} />
    </main>
  )
}

export default TelescopePage
