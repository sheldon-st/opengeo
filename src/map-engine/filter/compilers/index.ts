import { compileToArcGisWhere } from './arcgis'
import { compileToCql } from './cql'
import type { LayerDefinition } from '../../types/layer.types'

/**
 * Compile layer.filter to the appropriate query string for the layer's service.
 * Returns undefined if the layer has no filter or the kind is unsupported.
 */
export function compileFilter(layer: LayerDefinition): string | undefined {
  if (!layer.filter) return undefined

  switch (layer.kind) {
    case 'arcgis-featureserver':
      return compileToArcGisWhere(layer.filter)
    case 'wfs':
      return compileToCql(layer.filter)
    default:
      return undefined
  }
}

export { compileToArcGisWhere } from './arcgis'
export { compileToCql } from './cql'
