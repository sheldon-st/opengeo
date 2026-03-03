import OlMap from 'ol/Map'
import OlView from 'ol/View'
import { fromLonLat, toLonLat } from 'ol/proj'
import { LayerRegistry } from '../registry/layer-registry'
import { FeatureRegistry } from '../registry/feature-registry'
import { registerBuiltinRenderers } from '../renderers'
import {  createMapStore } from '../store/map-store'
import { generateId } from '../utils/id'
import { EventBus } from './event-bus'
import type {MapStore} from '../store/map-store';
import type {
  MapEngineEventMap,
  MapEngineEventName,
} from '../types/events.types'
import type { MapConfig, MapViewState } from '../types/map.types'
import type { FeatureDefinition, FeatureInput } from '../types/feature.types'
import type { LayerDefinition } from '../types/layer.types'
import type OlBaseLayer from 'ol/layer/Base'

export class MapEngine {
  private olMap: OlMap | null = null
  private config: MapConfig
  private olLayerCache = new Map<string, OlBaseLayer>()
  private olBaseLayer: OlBaseLayer | null = null
  readonly layerRegistry: LayerRegistry
  readonly featureRegistry: FeatureRegistry
  readonly events: EventBus
  readonly store: MapStore
  private unsubscribers: Array<() => void> = []

  constructor(config: MapConfig) {
    this.config = config
    this.layerRegistry = new LayerRegistry()
    this.featureRegistry = new FeatureRegistry()
    this.events = new EventBus()
    this.store = createMapStore(config.initialView)

    registerBuiltinRenderers(this.layerRegistry)
  }

  async initialize(target: HTMLElement): Promise<void> {
    const state = this.store.getState()

    this.olMap = new OlMap({
      target,
      view: new OlView({
        center: fromLonLat(state.view.center),
        zoom: state.view.zoom,
        rotation: state.view.rotation,
        maxZoom: this.config.maxZoom,
        minZoom: this.config.minZoom,
      }),
      controls: this.config.controls === false ? [] : undefined,
    })

    await this.store.getState().hydrate()
    this.syncBaseLayerToOl(this.store.getState().baseLayer)
    this.syncAllLayersToOl()
    this.setupStoreSubscriptions()
    this.setupOlViewSync()
    this.events.emit('engine:ready', {} as Record<string, never>)
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub()
    this.unsubscribers = []
    if (this.olBaseLayer) {
      this.olMap?.removeLayer(this.olBaseLayer)
      this.olBaseLayer = null
    }
    this.olLayerCache.forEach((olLayer) => {
      const domainId = olLayer.get('domainLayerId') as string
      const layerDef = this.store.getState().layers[domainId]
      if (layerDef) {
        try {
          const entry = this.layerRegistry.resolve(layerDef)
          entry.renderer.dispose?.(olLayer)
        } catch {
          // renderer may have been unregistered
        }
      }
    })
    this.olLayerCache.clear()
    this.olMap?.setTarget(undefined)
    this.olMap?.dispose()
    this.olMap = null
    this.events.emit('engine:disposed', {} as Record<string, never>)
    this.events.removeAllListeners()
  }

  getOlMap(): OlMap {
    if (!this.olMap) throw new Error('MapEngine not initialized')
    return this.olMap
  }

  // ========== Layer CRUD ==========

  addLayer(
    layer: Omit<
      LayerDefinition,
      'id' | 'createdAt' | 'updatedAt' | 'sortOrder'
    > & { id?: string; sortOrder?: number },
  ): string {
    const now = Date.now()
    const id = layer.id ?? generateId('lyr')
    const allLayers = Object.values(this.store.getState().layers)
    const siblings = allLayers.filter(
      (l) => l.parentId === (layer.parentId ?? null),
    )
    const fullLayer = {
      ...layer,
      id,
      sortOrder: layer.sortOrder ?? siblings.length,
      createdAt: now,
      updatedAt: now,
    } as LayerDefinition

    this.store.getState().addLayer(fullLayer)
    this.events.emit('layer:added', { layer: fullLayer })
    return id
  }

  upsertLayer(
    layer: Omit<LayerDefinition, 'createdAt' | 'updatedAt' | 'sortOrder'> & {
      sortOrder?: number
    },
  ): string {
    const existing = this.store.getState().layers[layer.id]
    if (existing) {
      const { id, ...rest } = layer
      this.updateLayer(id, rest as Partial<LayerDefinition>)
      return id
    }
    return this.addLayer(layer)
  }

  updateLayer(id: string, patch: Partial<LayerDefinition>): void {
    const prev = this.store.getState().layers[id]
    if (!prev) throw new Error(`Layer not found: ${id}`)
    this.store.getState().updateLayer(id, patch)
    const next = this.store.getState().layers[id]
    this.events.emit('layer:updated', { layer: next, prev })
  }

  removeLayer(id: string): void {
    this.store.getState().removeLayer(id)
    this.events.emit('layer:removed', { layerId: id })
  }

  duplicateLayer(id: string): string {
    const layer = this.store.getState().layers[id]
    if (!layer) throw new Error(`Layer not found: ${id}`)
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = layer
    return this.addLayer({
      ...rest,
      name: `${layer.name} (copy)`,
    } as Omit<LayerDefinition, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>)
  }

  getLayer(id: string): LayerDefinition | undefined {
    return this.store.getState().layers[id]
  }

  getLayers(): Array<LayerDefinition> {
    return Object.values(this.store.getState().layers)
  }

  // ========== Base Layer ==========

  setBaseLayer(layer: LayerDefinition | null): void {
    this.store.getState().setBaseLayer(layer)
  }

  clearBaseLayer(): void {
    this.store.getState().setBaseLayer(null)
  }

  getBaseLayer(): LayerDefinition | null {
    return this.store.getState().baseLayer
  }

  // ========== Feature CRUD ==========

  addFeature(input: FeatureInput): string {
    const now = Date.now()
    const id = input.id ?? generateId('feat')
    const feature: FeatureDefinition = {
      ...input,
      id,
      selected: false,
      createdAt: now,
      updatedAt: now,
    }
    this.store.getState().addFeature(feature)
    this.events.emit('feature:added', { feature })
    return id
  }

  upsertFeature(input: FeatureInput & { id: string }): string {
    const existing = this.store.getState().features[input.id]
    if (existing) {
      this.updateFeature(input.id, input)
      return input.id
    }
    return this.addFeature(input)
  }

  updateFeature(id: string, patch: Partial<FeatureDefinition>): void {
    const prev = this.store.getState().features[id]
    if (!prev) throw new Error(`Feature not found: ${id}`)
    this.store.getState().updateFeature(id, patch)
    const next = this.store.getState().features[id]
    this.events.emit('feature:updated', { feature: next, prev })
  }

  removeFeature(id: string): void {
    const feature = this.store.getState().features[id]
    if (!feature) return
    this.store.getState().removeFeature(id)
    this.events.emit('feature:removed', {
      featureId: id,
      layerId: feature.layerId,
    })
  }

  getFeature(id: string): FeatureDefinition | undefined {
    return this.store.getState().features[id]
  }

  getFeaturesByLayer(layerId: string): Array<FeatureDefinition> {
    return Object.values(this.store.getState().features).filter(
      (f) => f.layerId === layerId,
    )
  }

  // ========== View ==========

  setView(view: Partial<MapViewState>): void {
    this.store.getState().setView(view)
  }

  getView(): MapViewState {
    return this.store.getState().view
  }

  zoomTo(zoom: number): void {
    this.olMap?.getView().animate({ zoom, duration: 300 })
  }

  panTo(center: [number, number]): void {
    this.olMap?.getView().animate({ center: fromLonLat(center), duration: 300 })
  }

  fitExtent(
    extent: [number, number, number, number],
    padding?: Array<number>,
  ): void {
    this.olMap?.getView().fit(extent, {
      padding: padding ?? [50, 50, 50, 50],
      duration: 300,
    })
  }

  // ========== Events ==========

  on<E extends MapEngineEventName>(
    event: E,
    handler: (payload: MapEngineEventMap[E]) => void,
  ): () => void {
    return this.events.on(event, handler)
  }

  // ========== Internal: Store → OL Sync ==========

  private setupStoreSubscriptions(): void {
    const unsub = this.store.subscribe(
      (s) => s.layers,
      (layers, prevLayers) => {
        this.reconcileOlLayers(layers, prevLayers)
      },
    )
    this.unsubscribers.push(unsub)

    const unsubBase = this.store.subscribe(
      (s) => s.baseLayer,
      (baseLayer) => {
        this.syncBaseLayerToOl(baseLayer)
      },
    )
    this.unsubscribers.push(unsubBase)
  }

  private reconcileOlLayers(
    layers: Record<string, LayerDefinition>,
    prevLayers: Record<string, LayerDefinition>,
  ): void {
    const currentIds = new Set(Object.keys(layers))
    const prevIds = new Set(Object.keys(prevLayers))

    // Added
    for (const id of currentIds) {
      if (!prevIds.has(id)) {
        this.createOlLayer(layers[id])
      }
    }

    // Removed
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        this.removeOlLayer(id)
      }
    }

    // Updated
    for (const id of currentIds) {
      if (prevIds.has(id) && layers[id] !== prevLayers[id]) {
        this.updateOlLayer(prevLayers[id], layers[id])
      }
    }
  }

  private createOlLayer(layer: LayerDefinition): void {
    if (!this.layerRegistry.canHandle(layer)) return
    const entry = this.layerRegistry.resolve(layer)
    const olLayer = entry.renderer.create(layer, this)
    olLayer.set('domainLayerId', layer.id)
    this.olLayerCache.set(layer.id, olLayer)
    this.olMap?.addLayer(olLayer)
  }

  private updateOlLayer(prev: LayerDefinition, next: LayerDefinition): void {
    const olLayer = this.olLayerCache.get(next.id)
    if (!olLayer) {
      this.createOlLayer(next)
      return
    }
    if (!this.layerRegistry.canHandle(next)) return
    const entry = this.layerRegistry.resolve(next)
    const handled = entry.renderer.update(olLayer, prev, next, this)
    if (!handled) {
      this.removeOlLayer(next.id)
      this.createOlLayer(next)
    }
  }

  private removeOlLayer(id: string): void {
    const olLayer = this.olLayerCache.get(id)
    if (!olLayer) return
    this.olMap?.removeLayer(olLayer)
    this.olLayerCache.delete(id)
  }

  private syncBaseLayerToOl(layer: LayerDefinition | null): void {
    if (this.olBaseLayer) {
      this.olMap?.removeLayer(this.olBaseLayer)
      this.olBaseLayer = null
    }
    if (!layer || !this.layerRegistry.canHandle(layer)) return
    const entry = this.layerRegistry.resolve(layer)
    const olLayer = entry.renderer.create(layer, this)
    olLayer.set('domainLayerId', '__base__')
    olLayer.setZIndex(-1)
    this.olBaseLayer = olLayer
    this.olMap?.addLayer(olLayer)
  }

  private syncAllLayersToOl(): void {
    const layers = this.store.getState().layers
    for (const layer of Object.values(layers)) {
      this.createOlLayer(layer)
    }
  }

  private setupOlViewSync(): void {
    const view = this.olMap?.getView()
    if (!view) return

    view.on('change', () => {
      const center = view.getCenter()
      const zoom = view.getZoom()
      const rotation = view.getRotation()
      if (center && zoom !== undefined) {
        const lonLat = toLonLat(center) as [number, number]
        this.store.getState().setView({
          center: lonLat,
          zoom,
          rotation: rotation ?? 0,
        })
      }
    })

    this.olMap?.on('click', (evt) => {
      const coord = toLonLat(evt.coordinate) as [number, number]
      this.events.emit('map:click', {
        coordinate: coord,
        pixel: evt.pixel as [number, number],
      })
    })

    this.olMap?.on('dblclick', (evt) => {
      const coord = toLonLat(evt.coordinate) as [number, number]
      this.events.emit('map:dblclick', {
        coordinate: coord,
        pixel: evt.pixel as [number, number],
      })
    })

    this.olMap?.on('pointermove', (evt) => {
      const coord = toLonLat(evt.coordinate) as [number, number]
      this.events.emit('map:pointermove', {
        coordinate: coord,
        pixel: evt.pixel as [number, number],
      })
    })

    this.olMap?.on('moveend', () => {
      this.events.emit('map:moveend', { view: this.store.getState().view })
    })
  }
}
