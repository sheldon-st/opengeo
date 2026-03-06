import { fetchArcGisDirectory } from './arcgis-adapter'
import type { DataSource, DirectoryListing } from './types'

export type {
  DataSource,
  DataSourceType,
  ArcGisDataSource,
  DirectoryFolder,
  DirectoryService,
  DirectoryEntry,
  DirectoryListing,
} from './types'

export { useDataSourceStore } from './data-source-store'
export { fetchArcGisDirectory } from './arcgis-adapter'

export function fetchDirectory(
  source: DataSource,
  path: Array<string>,
): Promise<DirectoryListing> {
  switch (source.type) {
    case 'arcgis':
      return fetchArcGisDirectory(source, path)
  }
}
