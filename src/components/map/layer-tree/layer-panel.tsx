import { useCallback, useState } from 'react'
import { FolderPlus, Plus } from 'lucide-react'
import { LayerDetailSheet } from '../layer-detail/layer-detail-sheet'
import { AddLayerDialog } from '../add-layer/add-layer-dialog'
import { LayerTree } from './layer-tree'
import { BaseLayerSelector } from './base-layer-selector'
import type { GroupLayer } from '@/map-engine/types/layer.types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMapEngine } from '@/map-engine'

export function LayerPanel() {
  const engine = useMapEngine()
  const [detailLayerId, setDetailLayerId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const handleShowProperties = useCallback((layerId: string) => {
    setDetailLayerId(layerId)
  }, [])

  const handleAddGroup = () => {
    engine.addLayer({
      name: 'New Group',
      kind: 'group',
      visible: true,
      opacity: 1,
      zIndex: 0,
      parentId: null,
      metadata: {},
      expanded: true,
    } as Omit<GroupLayer, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>)
  }

  return (
    <div className="flex h-full flex-col border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5">
        <span className="text-xs font-medium flex-1">Layers</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleAddGroup}
          title="Add group"
        >
          <FolderPlus />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setAddDialogOpen(true)}
          title="Add layer"
        >
          <Plus />
        </Button>
      </div>
      <Separator />

      {/* Tree */}
      <div className="flex-1 overflow-hidden p-1">
        <LayerTree onShowProperties={handleShowProperties} />
      </div>

      {/* Detail Sheet */}
      <LayerDetailSheet
        layerId={detailLayerId}
        open={detailLayerId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailLayerId(null)
        }}
      />

      {/* Add Layer Dialog */}
      <AddLayerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Base Layer */}
      <Separator />
      <BaseLayerSelector />
    </div>
  )
}
