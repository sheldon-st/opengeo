import OlFeature from 'ol/Feature'
import OlPoint from 'ol/geom/Point'
import OlMultiPoint from 'ol/geom/MultiPoint'
import OlLineString from 'ol/geom/LineString'
import OlMultiLineString from 'ol/geom/MultiLineString'
import OlPolygon from 'ol/geom/Polygon'
import OlMultiPolygon from 'ol/geom/MultiPolygon'
import OlGeometryCollection from 'ol/geom/GeometryCollection'
import { fromLonLat } from 'ol/proj'
import { convertFeatureStyle } from './style-utils'
import type { FeatureDefinition } from '../types/feature.types'
import type { Geometry, Position } from '../types/geometry.types'
import type OlGeometry from 'ol/geom/Geometry'

function transformCoord(pos: Position): Array<number> {
  return fromLonLat([pos[0], pos[1]]) as Array<number>
}

function transformCoords(coords: Array<Position>): Array<Array<number>> {
  return coords.map(transformCoord)
}

function convertGeometry(geom: Geometry): OlGeometry {
  switch (geom.type) {
    case 'Point':
      return new OlPoint(transformCoord(geom.coordinates))
    case 'MultiPoint':
      return new OlMultiPoint(transformCoords(geom.coordinates))
    case 'LineString':
      return new OlLineString(transformCoords(geom.coordinates))
    case 'MultiLineString':
      return new OlMultiLineString(geom.coordinates.map(transformCoords))
    case 'Polygon':
      return new OlPolygon(geom.coordinates.map(transformCoords))
    case 'MultiPolygon':
      return new OlMultiPolygon(
        geom.coordinates.map((poly) => poly.map(transformCoords)),
      )
    case 'GeometryCollection':
      return new OlGeometryCollection(geom.geometries.map(convertGeometry))
  }
}

export function createOlFeature(
  feature: FeatureDefinition,
): OlFeature<OlGeometry> {
  const olFeature = new OlFeature({
    geometry: convertGeometry(feature.geometry),
    ...feature.properties,
  })
  olFeature.setId(feature.id)

  if (feature.style) {
    olFeature.setStyle(convertFeatureStyle(feature.style))
  }

  return olFeature
}

export function updateOlFeature(
  olFeature: OlFeature<OlGeometry>,
  prev: FeatureDefinition,
  next: FeatureDefinition,
): boolean {
  if (prev.geometry !== next.geometry) {
    olFeature.setGeometry(convertGeometry(next.geometry))
  }

  if (prev.style !== next.style) {
    if (next.style) {
      olFeature.setStyle(convertFeatureStyle(next.style))
    } else {
      olFeature.setStyle(undefined)
    }
  }

  if (prev.properties !== next.properties) {
    olFeature.setProperties(next.properties)
  }

  return true
}
