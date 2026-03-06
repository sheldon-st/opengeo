// ─── API response types ──────────────────────────────────────────────────────

export interface CatalogServiceLayer {
  name: string
  title?: string
  id?: string | number
}

export interface CatalogServiceSource {
  id: string
  name: string | null
  key: string | null
}

export interface CatalogService {
  id: string
  url: string
  serviceType: string
  organization: string | null
  title: string | null
  description: string | null
  bbox: [number, number, number, number] | null
  layers: Array<CatalogServiceLayer> | null
  crs: Array<string> | null
  keywords: Array<string> | null
  formats: Array<string> | null
  extraMeta: Record<string, unknown> | null
  healthStatus: 'healthy' | 'degraded' | 'offline' | 'unknown' | null
  lastCheckedAt: string | null
  responseTimeMs: number | null
  source: CatalogServiceSource
  createdAt: string
  updatedAt: string
}

export interface CatalogSearchMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CatalogSearchResponse {
  data: Array<CatalogService>
  meta: CatalogSearchMeta
}

// ─── Search parameters ───────────────────────────────────────────────────────

export interface CatalogSearchParams {
  q?: string
  type?: string
  bbox?: string
  keywords?: string
  health?: string
  source_id?: string
  organization?: string
  page?: number
  limit?: number
  sort?: 'relevance' | 'title' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
  createdAfter?: string
  createdBefore?: string
  updatedAfter?: string
  updatedBefore?: string
}

// ─── Service type display info ───────────────────────────────────────────────

export type ServiceTypeCategory = 'arcgis' | 'ogc' | 'tile' | 'data' | 'other'

export interface ServiceTypeInfo {
  label: string
  category: ServiceTypeCategory
  color: string
  bgColor: string
  borderColor: string
}
