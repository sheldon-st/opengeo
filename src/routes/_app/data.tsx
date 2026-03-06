import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { DatabaseIcon, SearchIcon, ServerIcon } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SourceList } from '@/components/data/source-list'
import { DirectoryBrowser } from '@/components/data/directory-browser'
import { CatalogSearch } from '@/components/data/catalog-search'
import { useDataSourceStore } from '@/lib/data-sources'

export const Route = createFileRoute('/_app/data')({
  component: DataPage,
})

function DataPage() {
  const sources = useDataSourceStore((s) => s.sources)
  const hydrate = useDataSourceStore((s) => s.hydrate)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const selectedSource = sources.find((s) => s.id === selectedId) ?? null

  return (
    <Tabs defaultValue="catalog" className="flex-1 min-h-0 p-2">
      <TabsList>
        <TabsTrigger value="catalog">
          <SearchIcon className="size-3" />
          Discover
        </TabsTrigger>
        <TabsTrigger value="sources">
          <ServerIcon className="size-3" />
          Sources
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalog" className="flex min-h-0 flex-1 flex-col">
        <CatalogSearch />
      </TabsContent>

      <TabsContent value="sources" className="flex min-h-0 flex-1 flex-col">
        <ResizablePanelGroup
          orientation="horizontal"
          className="flex-1 min-h-0"
        >
          <ResizablePanel className="h-full flex flex-col">
            <SourceList selectedId={selectedId} onSelect={setSelectedId} />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            className="h-full flex flex-col pl-2"
            defaultSize="75%"
          >
            {selectedSource ? (
              <DirectoryBrowser source={selectedSource} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="flex flex-col items-center gap-3">
                  <DatabaseIcon className="size-10" />
                  <p className="text-sm">
                    Select a data source to browse its services.
                  </p>
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabsContent>
    </Tabs>
  )
}
