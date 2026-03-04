import type {
  ArcGisDataSource,
  DirectoryFolder,
  DirectoryListing,
  DirectoryService,
} from './types'

interface ArcGisDirectoryResponse {
  currentVersion?: number
  folders?: string[]
  services?: Array<{ name: string; type: string }>
}

const ADDABLE_TYPES = new Set(['MapServer', 'FeatureServer'])

export async function fetchArcGisDirectory(
  source: ArcGisDataSource,
  folderPath: string[],
): Promise<DirectoryListing> {
  const base = source.url.replace(/\/+$/, '')
  const pathSegment = folderPath.length > 0 ? `/${folderPath.join('/')}` : ''
  const params = new URLSearchParams({ f: 'json' })
  if (source.token) params.set('token', source.token)

  const res = await fetch(`${base}${pathSegment}?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  const data = (await res.json()) as ArcGisDirectoryResponse

  const folders: DirectoryFolder[] = (data.folders ?? []).map((name) => ({
    kind: 'folder',
    name,
    path: [...folderPath, name],
  }))

  const services: DirectoryService[] = (data.services ?? []).map((svc) => {
    const displayName = svc.name.includes('/')
      ? svc.name.split('/').pop()!
      : svc.name
    return {
      kind: 'service',
      name: displayName,
      serviceType: svc.type,
      url: `${base}/${svc.name}/${svc.type}`,
      addable: ADDABLE_TYPES.has(svc.type),
    }
  })

  return { folders, services }
}
