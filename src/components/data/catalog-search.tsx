import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'
import {
  searchServices,
  getServiceTypes,
  getOrganizations,
  getKeywords,
  getServiceTypeInfo,
  type CatalogService,
  type CatalogSearchMeta,
  type CatalogSearchParams,
} from '@/lib/catalog'
import { CatalogServiceCard } from './catalog-service-card'
import { CatalogServiceDetail } from './catalog-service-detail'
import { CatalogAddDialog } from './catalog-add-dialog'

const PAGE_SIZE = 30

const UPDATED_WITHIN_OPTIONS = [
  { label: 'Any time', value: 'any' },
  { label: 'Last 24 hours', value: '1' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'Last year', value: '365' },
]

const SORT_OPTIONS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Title', value: 'title' },
  { label: 'Recently updated', value: 'updated_at' },
  { label: 'Recently created', value: 'created_at' },
]

export function CatalogSearch() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())
  const [availableTypes, setAvailableTypes] = useState<Array<string>>([])
  const [availableOrgs, setAvailableOrgs] = useState<Array<string>>([])
  const [availableKeywords, setAvailableKeywords] = useState<Array<string>>([])
  const [organization, setOrganization] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState<Array<string>>([])
  const [healthFilter, setHealthFilter] = useState('')
  const [updatedWithin, setUpdatedWithin] = useState('')
  const [sort, setSort] = useState('relevance')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [results, setResults] = useState<Array<CatalogService>>([])
  const [meta, setMeta] = useState<CatalogSearchMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedService, setSelectedService] =
    useState<CatalogService | null>(null)
  const [addingService, setAddingService] = useState<CatalogService | null>(
    null,
  )

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null)
  const keywordsAnchor = useComboboxAnchor()

  // Fetch available service types, organizations, and keywords on mount
  useEffect(() => {
    getServiceTypes().then(setAvailableTypes).catch(() => {})
    getOrganizations().then(setAvailableOrgs).catch(() => {})
    getKeywords().then(setAvailableKeywords).catch(() => {})
  }, [])

  // Debounce search query
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query])

  // Search effect
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params: CatalogSearchParams = {
      page,
      limit: PAGE_SIZE,
    }
    if (debouncedQuery) params.q = debouncedQuery
    if (selectedTypes.size > 0) params.type = [...selectedTypes].join(',')
    if (organization) params.organization = organization
    if (selectedKeywords.length > 0) params.keywords = selectedKeywords.join(',')
    if (healthFilter) params.health = healthFilter
    if (sort && sort !== 'relevance') {
      params.sort = sort as CatalogSearchParams['sort']
      params.order = sort === 'title' ? 'asc' : 'desc'
    }
    if (updatedWithin) {
      const days = Number(updatedWithin)
      if (days > 0) {
        const d = new Date()
        d.setDate(d.getDate() - days)
        params.updatedAfter = d.toISOString()
      }
    }

    searchServices(params)
      .then((res) => {
        if (cancelled) return
        setResults(res.data)
        setMeta(res.meta)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Search failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, selectedTypes, organization, selectedKeywords, healthFilter, updatedWithin, sort, page])

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
    setPage(1)
  }

  const clearFilters = () => {
    setQuery('')
    setDebouncedQuery('')
    setSelectedTypes(new Set())
    setOrganization('')
    setSelectedKeywords([])
    setHealthFilter('')
    setUpdatedWithin('')
    setSort('relevance')
    setPage(1)
  }

  const activeFilterCount =
    (selectedTypes.size > 0 ? 1 : 0) +
    (organization ? 1 : 0) +
    (selectedKeywords.length > 0 ? 1 : 0) +
    (healthFilter ? 1 : 0) +
    (updatedWithin ? 1 : 0) +
    (sort !== 'relevance' ? 1 : 0)

  const hasFilters = query || activeFilterCount > 0

  // If a service is selected, show its detail
  if (selectedService) {
    return (
      <CatalogServiceDetail
        service={selectedService}
        onBack={() => setSelectedService(null)}
      />
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            className="pl-8 text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setDebouncedQuery('')
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          )}
        </div>
        <Button
          variant={filtersOpen ? 'secondary' : 'outline'}
          size="sm"
          className="shrink-0 gap-1 text-xs"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <SlidersHorizontalIcon className="size-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Type filter chips */}
      {availableTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {availableTypes.map((type) => {
            const info = getServiceTypeInfo(type)
            const active = selectedTypes.has(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  active
                    ? `${info.bgColor} ${info.borderColor} ${info.color}`
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {info.label}
              </button>
            )
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-0.5 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              <XIcon className="size-2.5" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Advanced filters panel */}
      {filtersOpen && (
        <div className="grid gap-2.5 rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="grid gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Organization
              </label>
              <Combobox
                value={organization}
                onValueChange={(v) => {
                  setOrganization(v ?? '')
                  setPage(1)
                }}
              >
                <ComboboxInput
                  placeholder="Filter by org…"
                  showClear={!!organization}
                  className="h-7 text-[11px]"
                />
                <ComboboxContent>
                  <ComboboxList>
                    {availableOrgs.map((org) => (
                      <ComboboxItem key={org} value={org}>
                        {org}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                  <ComboboxEmpty>No organizations found</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="grid gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Health Status
              </label>
              <Select
                value={healthFilter || 'any'}
                onValueChange={(v) => {
                  setHealthFilter(!v || v === 'any' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Sort by
              </label>
              <Select
                value={sort}
                onValueChange={(v) => {
                  if (v) setSort(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Updated within
              </label>
              <Select
                value={updatedWithin || 'any'}
                onValueChange={(v) => {
                  setUpdatedWithin(!v || v === 'any' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPDATED_WITHIN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 grid gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">
                Keywords
              </label>
              <Combobox
                multiple
                value={selectedKeywords}
                onValueChange={(v) => {
                  setSelectedKeywords(v)
                  setPage(1)
                }}
              >
                <ComboboxChips ref={keywordsAnchor} className="min-h-7 text-[11px]">
                  {selectedKeywords.map((k) => (
                    <ComboboxChip key={k}>{k}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput
                    placeholder={selectedKeywords.length === 0 ? 'Filter by keyword…' : ''}
                  />
                </ComboboxChips>
                <ComboboxContent anchor={keywordsAnchor}>
                  <ComboboxList>
                    {availableKeywords.map((k) => (
                      <ComboboxItem key={k} value={k}>
                        {k}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                  <ComboboxEmpty>No keywords found</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Results header */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {meta
            ? `${meta.total.toLocaleString()} service${meta.total !== 1 ? 's' : ''} found`
            : loading
              ? 'Searching…'
              : ''}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Results list */}
      {!loading && !error && (
        <ScrollArea className="flex-1 overflow-auto">
          <div className="grid gap-1.5 pb-2">
            {results.map((service) => (
              <CatalogServiceCard
                key={service.id}
                service={service}
                onClick={() => setSelectedService(service)}
                onAdd={() => setAddingService(service)}
              />
            ))}
            {results.length === 0 && meta && (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <SearchIcon className="size-8 opacity-40" />
                <p className="text-sm">No services found.</p>
                {hasFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="gap-1 text-xs"
          >
            <ChevronLeftIcon className="size-3" />
            Prev
          </Button>
          <span className="text-[11px] text-muted-foreground">
            Page {page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1 text-xs"
          >
            Next
            <ChevronRightIcon className="size-3" />
          </Button>
        </div>
      )}

      {/* Add dialog */}
      {addingService && (
        <CatalogAddDialog
          service={addingService}
          open
          onOpenChange={(open) => {
            if (!open) setAddingService(null)
          }}
        />
      )}
    </div>
  )
}
