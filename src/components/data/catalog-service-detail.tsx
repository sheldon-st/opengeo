import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LayersIcon,
  PlusIcon,
  ServerIcon,
  TagIcon,
  ZapIcon,
} from 'lucide-react'
import { CatalogAddDialog } from './catalog-add-dialog'
import { BboxPreview } from './bbox-preview'
import type {CatalogService} from '@/lib/catalog';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useMapView } from '@/map-engine'
import {
  
  getHealthColor,
  getServiceTypeInfo,
  isAddableServiceType
} from '@/lib/catalog'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${String(minutes)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${String(hours)}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${String(days)}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${String(months)}mo ago`
  return `${String(Math.floor(months / 12))}y ago`
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface CatalogServiceDetailProps {
  service: CatalogService
  onBack: () => void
}

export function CatalogServiceDetail({
  service,
  onBack,
}: CatalogServiceDetailProps) {
  const { fitExtent } = useMapView()
  const navigate = useNavigate()
  const typeInfo = getServiceTypeInfo(service.serviceType)
  const healthColor = getHealthColor(service.healthStatus)
  const canAdd = isAddableServiceType(service.serviceType)
  const [copied, setCopied] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const handleZoomToBbox = () => {
    if (!service.bbox) return
    fitExtent(service.bbox)
    navigate({ to: '/map' })
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(service.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const layerCount = service.layers?.length ?? 0
  const crsCount = service.crs?.length ?? 0
  const formatCount = service.formats?.length ?? 0

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="grid gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 shrink-0 p-0"
            onClick={onBack}
          >
            <ArrowLeftIcon className="size-3.5" />
          </Button>
          <span className="min-w-0 flex-1 truncate text-xs font-semibold">
            {service.title ?? service.url}
          </span>
        </div>

        {/* Type + health + org badges */}
        <div className="flex flex-wrap items-center gap-1.5 pl-9">
          <Badge
            variant="outline"
            className={cn(
              'text-[9px] font-medium',
              typeInfo.color,
              typeInfo.borderColor,
            )}
          >
            {typeInfo.label}
          </Badge>
          {service.healthStatus && (
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium',
                healthColor.text,
              )}
            >
              <span className={cn('size-1.5 rounded-full', healthColor.dot)} />
              {service.healthStatus}
            </span>
          )}
          {service.organization && (
            <Badge variant="secondary" className="text-[9px]">
              {service.organization}
            </Badge>
          )}
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <ScrollArea className="flex-1">
        <div className="grid gap-3 pb-4 pr-2">
          {/* Map preview */}
          {service.bbox && (
            <div className="grid gap-2">
              <BboxPreview bbox={service.bbox} />
              <div className="flex items-center justify-between">
                <div className="flex gap-3 font-mono text-[9px] text-muted-foreground">
                  <span>
                    {service.bbox[0].toFixed(2)}, {service.bbox[1].toFixed(2)}
                  </span>
                  <span>
                    {service.bbox[2].toFixed(2)}, {service.bbox[3].toFixed(2)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 px-2 text-[10px]"
                  onClick={handleZoomToBbox}
                >
                  <GlobeIcon className="size-3" />
                  Zoom to
                </Button>
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-md bg-muted/50 px-3 py-2">
            {layerCount > 0 && (
              <StatItem icon={LayersIcon} label="Layers" value={layerCount} />
            )}
            {formatCount > 0 && (
              <StatItem
                icon={DatabaseIcon}
                label="Formats"
                value={formatCount}
              />
            )}
            {crsCount > 0 && (
              <StatItem icon={GlobeIcon} label="CRS" value={crsCount} />
            )}
            {service.responseTimeMs != null && (
              <StatItem
                icon={ZapIcon}
                label="Response"
                value={`${String(service.responseTimeMs)}ms`}
              />
            )}
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────── */}
          <Tabs defaultValue="overview">
            <TabsList variant="line" className="w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="layers">
                Layers{layerCount > 0 ? ` (${String(layerCount)})` : ''}
              </TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* ── Overview tab ───────────────────────────────────────── */}
            <TabsContent value="overview">
              <div className="grid gap-3 pt-3">
                {/* URL */}
                <div className="grid gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Service URL
                  </span>
                  <div className="flex items-center gap-1">
                    <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-[10px]">
                      {service.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 shrink-0 p-0"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <CheckIcon className="size-3 text-green-500" />
                      ) : (
                        <CopyIcon className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <div className="grid gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Description
                    </span>
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Keywords */}
                {service.keywords && service.keywords.length > 0 && (
                  <div className="grid gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <TagIcon className="size-3" />
                      Keywords
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {service.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Layers tab ─────────────────────────────────────────── */}
            <TabsContent value="layers">
              <div className="grid gap-2 pt-3">
                {layerCount === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <LayersIcon className="size-8 opacity-20" />
                    <span className="text-xs">No layers reported</span>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border">
                    {service.layers!.map((layer, i) => (
                      <div
                        key={layer.name + String(i)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-2 text-[11px]',
                          i > 0 && 'border-t',
                          i % 2 === 0 && 'bg-muted/30',
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {layer.title ?? layer.name}
                        </span>
                        {layer.title && layer.title !== layer.name && (
                          <span className="max-w-20 shrink-0 truncate text-[9px] text-muted-foreground">
                            {layer.name}
                          </span>
                        )}
                        {layer.id != null && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[8px] font-mono"
                          >
                            #{String(layer.id)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Details tab ────────────────────────────────────────── */}
            <TabsContent value="details">
              <div className="grid gap-3 pt-3">
                {/* CRS */}
                {service.crs && service.crs.length > 0 && (
                  <DetailSection title="Coordinate Reference Systems">
                    <div className="flex flex-wrap gap-1">
                      {service.crs.slice(0, 12).map((crs) => (
                        <Badge
                          key={crs}
                          variant="secondary"
                          className="text-[9px] font-mono"
                        >
                          {crs}
                        </Badge>
                      ))}
                      {service.crs.length > 12 && (
                        <Badge variant="secondary" className="text-[9px]">
                          +{service.crs.length - 12} more
                        </Badge>
                      )}
                    </div>
                  </DetailSection>
                )}

                {/* Formats */}
                {service.formats && service.formats.length > 0 && (
                  <DetailSection title="Supported Formats">
                    <div className="flex flex-wrap gap-1">
                      {service.formats.map((f) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className="text-[9px] font-mono"
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </DetailSection>
                )}

                {/* Source */}
                {service.source.name && (
                  <DetailSection title="Harvested From">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <ServerIcon className="size-3 text-muted-foreground" />
                      {service.source.name}
                    </span>
                  </DetailSection>
                )}

                {/* Extra metadata */}
                {service.extraMeta &&
                  Object.keys(service.extraMeta).length > 0 && (
                    <DetailSection title="Additional Metadata">
                      <div className="grid gap-1 rounded-md bg-muted/50 p-2 font-mono text-[10px]">
                        {Object.entries(service.extraMeta).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="shrink-0 text-muted-foreground">
                              {k}:
                            </span>
                            <span className="min-w-0 truncate">
                              {typeof v === 'string' ? v : JSON.stringify(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </DetailSection>
                  )}

                {/* Timestamps */}
                <DetailSection title="Timestamps">
                  <div className="grid gap-1.5 text-[10px]">
                    {service.lastCheckedAt && (
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="size-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Last checked:
                        </span>
                        <span className="font-medium">
                          {formatRelativeTime(service.lastCheckedAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Updated:</span>
                      <span className="font-medium">
                        {formatRelativeTime(service.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">
                        {formatRelativeTime(service.createdAt)}
                      </span>
                    </div>
                  </div>
                </DetailSection>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* ── Action footer ──────────────────────────────────────────── */}
      <Separator />
      <div className="flex items-center gap-2 pt-3">
        {canAdd ? (
          <Button
            className="flex-1 gap-1.5 text-xs"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusIcon className="size-3.5" />
            Add to Map
          </Button>
        ) : (
          <div className="flex-1 text-center text-[11px] text-muted-foreground">
            This service type cannot be added directly
          </div>
        )}
        <a
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <ExternalLinkIcon className="size-3" />
          Open URL
        </a>
      </div>

      {showAddDialog && (
        <CatalogAddDialog
          service={service}
          open
          onOpenChange={(open) => {
            if (!open) setShowAddDialog(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground">
        {title}
      </span>
      {children}
    </div>
  )
}
