// ─── Persisted data source entries ────────────────────────────────────────────

export type DataSourceType = 'arcgis' // future: | 'wfs' | 'geoserver'

interface DataSourceBase {
  id: string
  type: DataSourceType
  label: string
  url: string
  createdAt: number
}

export interface ArcGisDataSource extends DataSourceBase {
  type: 'arcgis'
  token?: string
}

/** Discriminated union — extend with new variants for future directory types */
export type DataSource = ArcGisDataSource

// ─── Directory browsing types ────────────────────────────────────────────────

export interface DirectoryFolder {
  kind: 'folder'
  name: string
  /** Path segments from root, e.g. ['Utilities', 'Geometry'] */
  path: string[]
}

export interface DirectoryService {
  kind: 'service'
  name: string
  /** e.g. 'MapServer', 'FeatureServer', 'GPServer' */
  serviceType: string
  /** Fully-qualified URL to the service endpoint */
  url: string
  /** Whether this service type can be added to the map */
  addable: boolean
}

export type DirectoryEntry = DirectoryFolder | DirectoryService

export interface DirectoryListing {
  folders: DirectoryFolder[]
  services: DirectoryService[]
}
