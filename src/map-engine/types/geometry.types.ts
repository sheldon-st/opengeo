export type Position = [number, number] | [number, number, number]

export interface PointGeometry {
  type: 'Point'
  coordinates: Position
}

export interface MultiPointGeometry {
  type: 'MultiPoint'
  coordinates: Array<Position>
}

export interface LineStringGeometry {
  type: 'LineString'
  coordinates: Array<Position>
}

export interface MultiLineStringGeometry {
  type: 'MultiLineString'
  coordinates: Array<Array<Position>>
}

export interface PolygonGeometry {
  type: 'Polygon'
  coordinates: Array<Array<Position>>
}

export interface MultiPolygonGeometry {
  type: 'MultiPolygon'
  coordinates: Array<Array<Array<Position>>>
}

export interface GeometryCollectionGeometry {
  type: 'GeometryCollection'
  geometries: Array<Geometry>
}

export type Geometry =
  | PointGeometry
  | MultiPointGeometry
  | LineStringGeometry
  | MultiLineStringGeometry
  | PolygonGeometry
  | MultiPolygonGeometry
  | GeometryCollectionGeometry

export type GeometryType = Geometry['type']
