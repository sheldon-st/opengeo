import { wmsLayerPredicate, wmsLayerRenderer } from './wms.renderer'
import { wfsLayerPredicate, wfsLayerRenderer } from './wfs.renderer'
import {
  arcgisMapServerPredicate,
  arcgisMapServerRenderer,
} from './arcgis-mapserver.renderer'
import {
  arcgisFeatureServerPredicate,
  arcgisFeatureServerRenderer,
} from './arcgis-featureserver.renderer'
import { geojsonLayerPredicate, geojsonLayerRenderer } from './geojson.renderer'
import { xyzTilePredicate, xyzTileRenderer } from './xyz-tile.renderer'
import { vectorTilePredicate, vectorTileRenderer } from './vector-tile.renderer'
import { wmtsPredicate, wmtsRenderer } from './wmts.renderer'
import { wcsPredicate, wcsRenderer } from './wcs.renderer'
import { groupPredicate, groupRenderer } from './group.renderer'
import type { LayerRegistry } from '../registry/layer-registry'

export function registerBuiltinRenderers(registry: LayerRegistry): void {
  registry.register('builtin:wms', wmsLayerPredicate, wmsLayerRenderer, 0)
  registry.register('builtin:wfs', wfsLayerPredicate, wfsLayerRenderer, 0)
  registry.register(
    'builtin:arcgis-mapserver',
    arcgisMapServerPredicate,
    arcgisMapServerRenderer,
    0,
  )
  registry.register(
    'builtin:arcgis-featureserver',
    arcgisFeatureServerPredicate,
    arcgisFeatureServerRenderer,
    0,
  )
  registry.register(
    'builtin:geojson',
    geojsonLayerPredicate,
    geojsonLayerRenderer,
    0,
  )
  registry.register('builtin:xyz-tile', xyzTilePredicate, xyzTileRenderer, 0)
  registry.register(
    'builtin:vector-tile',
    vectorTilePredicate,
    vectorTileRenderer,
    0,
  )
  registry.register('builtin:wmts', wmtsPredicate, wmtsRenderer, 0)
  registry.register('builtin:wcs', wcsPredicate, wcsRenderer, 0)
  registry.register('builtin:group', groupPredicate, groupRenderer, 0)
}
