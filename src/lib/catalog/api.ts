import type { CatalogSearchParams, CatalogSearchResponse, CatalogService } from './types'

const API_BASE = import.meta.env.VITE_CATALOG_API_URL ?? 'http://localhost:3007'

export async function searchServices(
  params: CatalogSearchParams,
): Promise<CatalogSearchResponse> {
  const qs = new URLSearchParams()

  if (params.q) qs.set('q', params.q)
  if (params.type) qs.set('type', params.type)
  if (params.bbox) qs.set('bbox', params.bbox)
  if (params.keywords) qs.set('keywords', params.keywords)
  if (params.health) qs.set('health', params.health)
  if (params.source_id) qs.set('source_id', params.source_id)
  if (params.organization) qs.set('organization', params.organization)
  if (params.page != null && params.page > 0) qs.set('page', String(params.page))
  if (params.limit != null && params.limit > 0) qs.set('limit', String(params.limit))
  if (params.sort) qs.set('sort', params.sort)
  if (params.order) qs.set('order', params.order)
  if (params.createdAfter) qs.set('createdAfter', params.createdAfter)
  if (params.createdBefore) qs.set('createdBefore', params.createdBefore)
  if (params.updatedAfter) qs.set('updatedAfter', params.updatedAfter)
  if (params.updatedBefore) qs.set('updatedBefore', params.updatedBefore)

  const res = await fetch(`${API_BASE}/services/?${qs}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return (await res.json()) as CatalogSearchResponse
}

export async function getService(id: string): Promise<CatalogService> {
  const res = await fetch(`${API_BASE}/services/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return (await res.json()) as CatalogService
}

export async function getServiceTypes(): Promise<Array<string>> {
  const res = await fetch(`${API_BASE}/services/types`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return (await res.json()) as Array<string>
}

export async function getOrganizations(): Promise<Array<string>> {
  const res = await fetch(`${API_BASE}/services/organizations`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return (await res.json()) as Array<string>
}

export async function getKeywords(): Promise<Array<string>> {
  const res = await fetch(`${API_BASE}/services/keywords`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return (await res.json()) as Array<string>
}
