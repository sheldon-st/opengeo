import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LayersIcon,
  PlusIcon,
  ServerIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useMapView } from '@/map-engine'
import {
  getServiceTypeInfo,
  getHealthColor,
  isAddableServiceType,
  type CatalogService,
} from '@/lib/catalog'
import { CatalogAddDialog } from './catalog-add-dialog'

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

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3">
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

      <ScrollArea className="flex-1">
        <div className="grid gap-4 pb-4 pr-2">
          {/* Type + health status */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-medium',
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
                <span
                  className={cn('size-1.5 rounded-full', healthColor.dot)}
                />
                {service.healthStatus}
              </span>
            )}
            {service.responseTimeMs != null && (
              <span className="text-[10px] text-muted-foreground">
                {service.responseTimeMs}ms
              </span>
            )}
            {service.organization && (
              <Badge variant="secondary" className="text-[9px]">
                {service.organization}
              </Badge>
            )}
          </div>

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

          <Separator />

          {/* Bounding Box */}
          {service.bbox && (
            <div className="grid gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                Bounding Box
              </span>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className="text-muted-foreground">West:</span>
                <span className="font-mono">
                  {service.bbox[0].toFixed(4)}
                </span>
                <span className="text-muted-foreground">South:</span>
                <span className="font-mono">
                  {service.bbox[1].toFixed(4)}
                </span>
                <span className="text-muted-foreground">East:</span>
                <span className="font-mono">
                  {service.bbox[2].toFixed(4)}
                </span>
                <span className="text-muted-foreground">North:</span>
                <span className="font-mono">
                  {service.bbox[3].toFixed(4)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-1 gap-1 text-[10px]"
                onClick={handleZoomToBbox}
              >
                <GlobeIcon className="size-3" />
                Zoom to extent
              </Button>
            </div>
          )}

          {/* Layers */}
          {service.layers && service.layers.length > 0 && (
            <div className="grid gap-1.5">
              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                <LayersIcon className="size-3" />
                Layers ({service.layers.length})
              </span>
              <div className="max-h-48 overflow-auto rounded-md border">
                {service.layers.map((layer, i) => (
                  <div
                    key={layer.name + String(i)}
                    className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 text-[11px]',
                      i > 0 && 'border-t',
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {layer.title ?? layer.name}
                    </span>
                    {layer.id != null && (
                      <span className="shrink-0 text-[9px] text-muted-foreground">
                        #{String(layer.id)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRS */}
          {service.crs && service.crs.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                Coordinate Reference Systems
              </span>
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
            </div>
          )}

          {/* Formats */}
          {service.formats && service.formats.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                Supported Formats
              </span>
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
            </div>
          )}

          {/* Keywords */}
          {service.keywords && service.keywords.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">
                Keywords
              </span>
              <div className="flex flex-wrap gap-1">
                {service.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source info */}
          {service.source.name && (
            <div className="grid gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">
                Harvested From
              </span>
              <span className="flex items-center gap-1.5 text-[11px]">
                <ServerIcon className="size-3 text-muted-foreground" />
                {service.source.name}
              </span>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid gap-1 text-[10px] text-muted-foreground">
            {service.lastCheckedAt && (
              <span>
                Last checked:{' '}
                {new Date(service.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
            <span>
              Updated: {new Date(service.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </ScrollArea>

      {/* Action footer */}
      <Separator />
      <div className="flex items-center gap-2 pt-3">
        {canAdd && (
          <Button
            className="flex-1 gap-1.5 text-xs"
            onClick={() => setShowAddDialog(true)}
          >
            <PlusIcon className="size-3.5" />
            Add to Map
          </Button>
        )}
        {!canAdd && (
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
