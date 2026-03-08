import { LayersIcon, PlusIcon } from 'lucide-react'
import { PlainDescription } from './html-description'
import type {CatalogService} from '@/lib/catalog';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {

  getHealthColor,
  getServiceTypeInfo,
  isAddableServiceType
} from '@/lib/catalog'

interface CatalogServiceCardProps {
  service: CatalogService
  onClick: () => void
  onAdd: () => void
}

export function CatalogServiceCard({
  service,
  onClick,
  onAdd,
}: CatalogServiceCardProps) {
  const typeInfo = getServiceTypeInfo(service.serviceType)
  const healthColor = getHealthColor(service.healthStatus)
  const canAdd = isAddableServiceType(service.serviceType)

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAdd()
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50"
    >
      <div className="flex items-start gap-2.5">
        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Top row: title + badges */}
          <div className="flex items-start gap-2">
            <h4 className="min-w-0 flex-1 truncate text-xs font-semibold leading-tight">
              {service.title ?? service.url}
            </h4>
            <div className="flex shrink-0 items-center gap-1.5">
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
                  className={cn('size-1.5 rounded-full', healthColor.dot)}
                  title={service.healthStatus}
                />
              )}
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <PlainDescription
              html={service.description}
              className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground"
            />
          )}

          {/* Meta row */}
          <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
            {service.organization && (
              <span className="truncate">{service.organization}</span>
            )}
            {service.layers && service.layers.length > 0 && (
              <span className="flex items-center gap-0.5">
                <LayersIcon className="size-2.5" />
                {service.layers.length} layer
                {service.layers.length !== 1 ? 's' : ''}
              </span>
            )}
            {service.source.name && (
              <span className="truncate opacity-60">
                via {service.source.name}
              </span>
            )}
          </div>

          {/* Keywords */}
          {service.keywords && service.keywords.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {service.keywords.slice(0, 5).map((kw) => (
                <span
                  key={kw}
                  className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground"
                >
                  {kw}
                </span>
              ))}
              {service.keywords.length > 5 && (
                <span className="px-1 py-0.5 text-[9px] text-muted-foreground">
                  +{service.keywords.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Add button */}
        {canAdd && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleAdd}
          >
            <PlusIcon className="size-3" />
            Add
          </Button>
        )}
      </div>
    </button>
  )
}
