import Dexie from 'dexie'
import type {Table} from 'dexie';
import type { LayerDefinition } from '../types/layer.types'
import type { FeatureDefinition } from '../types/feature.types'
import type { MapViewState } from '../types/map.types'

export interface PersistedMapState {
  id: string
  view: MapViewState
  selectedFeatureIds: Array<string>
  baseLayer?: LayerDefinition | null
}

export class MapDatabase extends Dexie {
  layers!: Table<LayerDefinition, string>
  features!: Table<FeatureDefinition, string>
  mapState!: Table<PersistedMapState, string>

  constructor(dbName = 'opengeo-map') {
    super(dbName)

    this.version(1).stores({
      layers: 'id, kind, parentId, sortOrder, createdAt',
      features: 'id, layerId, [layerId+id], createdAt',
      mapState: 'id',
    })
  }
}

export const db = new MapDatabase()

export async function hydrate(): Promise<{
  layers: Array<LayerDefinition>
  features: Array<FeatureDefinition>
  mapState: PersistedMapState | undefined
}> {
  const [layers, features, mapState] = await Promise.all([
    db.layers.toArray(),
    db.features.toArray(),
    db.mapState.get('current'),
  ])
  return { layers, features, mapState }
}

export async function persistLayer(layer: LayerDefinition): Promise<void> {
  await db.layers.put(layer)
}

export async function removePersistedLayer(id: string): Promise<void> {
  await db.layers.delete(id)
  await db.features.where('layerId').equals(id).delete()
}

export async function persistFeature(
  feature: FeatureDefinition,
): Promise<void> {
  await db.features.put(feature)
}

export async function removePersistedFeature(id: string): Promise<void> {
  await db.features.delete(id)
}

export async function persistMapState(state: PersistedMapState): Promise<void> {
  await db.mapState.put(state)
}

export async function persistBaseLayer(
  layer: LayerDefinition | null,
): Promise<void> {
  const current = await db.mapState.get('current')
  await db.mapState.put({
    id: 'current',
    view: { center: [0, 0], zoom: 2, rotation: 0, projection: 'EPSG:3857' },
    selectedFeatureIds: [],
    ...current,
    baseLayer: layer,
  })
}

export async function exportAll(): Promise<{
  layers: Array<LayerDefinition>
  features: Array<FeatureDefinition>
  mapState: PersistedMapState | undefined
}> {
  return hydrate()
}

export async function importAll(data: {
  layers: Array<LayerDefinition>
  features: Array<FeatureDefinition>
  mapState?: PersistedMapState
}): Promise<void> {
  await db.transaction('rw', db.layers, db.features, db.mapState, async () => {
    await db.layers.clear()
    await db.features.clear()
    await db.layers.bulkPut(data.layers)
    await db.features.bulkPut(data.features)
    if (data.mapState) {
      await db.mapState.put({ ...data.mapState, id: 'current' })
    }
  })
}
