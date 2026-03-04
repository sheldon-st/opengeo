import { useEffect, useState } from 'react'
import {
  FolderIcon,
  ServerIcon,
  AlertCircleIcon,
  PlusIcon,
} from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  fetchDirectory,
  type DataSource,
  type DirectoryFolder,
  type DirectoryListing,
  type DirectoryService,
} from '@/lib/data-sources'
import { AddServiceDialog } from './add-service-dialog'

interface DirectoryBrowserProps {
  source: DataSource
}

export function DirectoryBrowser({ source }: DirectoryBrowserProps) {
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [listing, setListing] = useState<DirectoryListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingService, setAddingService] = useState<DirectoryService | null>(
    null,
  )

  useEffect(() => {
    setFolderPath([])
    setListing(null)
  }, [source.id])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchDirectory(source, folderPath)
      .then((result) => {
        if (!cancelled) setListing(result)
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Failed to load directory')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [source.id, source.url, folderPath])

  const navigateTo = (index: number) => {
    setFolderPath((p) => p.slice(0, index))
  }

  const enterFolder = (folder: DirectoryFolder) => {
    setFolderPath(folder.path)
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {folderPath.length > 0 ? (
              <BreadcrumbLink
                render={<button type="button" onClick={() => navigateTo(0)} />}
              >
                {source.label}
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>{source.label}</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {folderPath.map((segment, i) => (
            <BreadcrumbItem key={segment}>
              <BreadcrumbSeparator />
              {i < folderPath.length - 1 ? (
                <BreadcrumbLink
                  render={
                    <button
                      type="button"
                      onClick={() => navigateTo(i + 1)}
                    />
                  }
                >
                  {segment}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{segment}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Content */}
      {loading && (
        <div className="grid gap-1 p-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-md" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && listing && (
        <ScrollArea className="flex-1 overflow-auto">
          <div className="grid gap-0.5">
            {listing.folders.map((folder) => (
              <button
                key={folder.name}
                type="button"
                onClick={() => enterFolder(folder)}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {folder.name}
                </span>
              </button>
            ))}
            {listing.services.map((service) => (
              <div
                key={`${service.name}-${service.serviceType}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs',
                  service.addable
                    ? 'hover:bg-muted'
                    : 'text-muted-foreground opacity-60',
                )}
              >
                <ServerIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {service.name}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-[9px]',
                    service.serviceType === 'FeatureServer' &&
                      'border-blue-300 text-blue-600 dark:border-blue-700 dark:text-blue-400',
                    service.serviceType === 'MapServer' &&
                      'border-green-300 text-green-600 dark:border-green-700 dark:text-green-400',
                  )}
                >
                  {service.serviceType}
                </Badge>
                {service.addable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 shrink-0 p-0"
                    onClick={() => setAddingService(service)}
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
            {listing.folders.length === 0 &&
              listing.services.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  This folder is empty.
                </div>
              )}
          </div>
        </ScrollArea>
      )}

      {addingService && (
        <AddServiceDialog
          source={source}
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
