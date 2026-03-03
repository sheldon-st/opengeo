import {
  Copy,
  Eye,
  EyeOff,
  FolderInput,
  Pencil,
  Settings,
  Trash2,
} from 'lucide-react'
import type { NodeApi } from 'react-arborist'
import type { ArboristNode } from './layer-tree'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useMapEngine, useMapStore } from '@/map-engine'

interface LayerContextMenuProps {
  node: NodeApi<ArboristNode>
  children: React.ReactNode
  onShowProperties: (layerId: string) => void
}

export function LayerContextMenu({
  node,
  children,
  onShowProperties,
}: LayerContextMenuProps) {
  const engine = useMapEngine()
  const layersRecord = useMapStore((s) => s.layers)
  const layers = Object.values(layersRecord)
  const layer = node.data.layer
  const groups = layers.filter((l) => l.kind === 'group' && l.id !== layer.id)

  const handleToggleVisibility = () => {
    engine.updateLayer(layer.id, { visible: !layer.visible })
  }

  const handleRename = () => {
    // Delay to allow context menu to close before entering edit mode
    requestAnimationFrame(() => {
      node.edit()
    })
  }

  const handleDuplicate = () => {
    const { id, createdAt, updatedAt, ...rest } = layer
    engine.addLayer({
      ...rest,
      name: `${layer.name} (copy)`,
    } as Parameters<typeof engine.addLayer>[0])
  }

  const handleMoveToGroup = (groupId: string | null) => {
    const siblings = layers.filter((l) => l.parentId === groupId)
    engine.updateLayer(layer.id, {
      parentId: groupId,
      sortOrder: siblings.length,
    })
  }

  const handleRemove = () => {
    engine.removeLayer(layer.id)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="block w-full">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuCheckboxItem
          checked={layer.visible}
          onCheckedChange={handleToggleVisibility}
        >
          {layer.visible ? (
            <Eye className="mr-1 h-3.5 w-3.5" />
          ) : (
            <EyeOff className="mr-1 h-3.5 w-3.5" />
          )}
          Visible
        </ContextMenuCheckboxItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleRename}>
          <Pencil />
          Rename
        </ContextMenuItem>

        <ContextMenuItem onClick={handleDuplicate}>
          <Copy />
          Duplicate
        </ContextMenuItem>

        {groups.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderInput className="mr-1 h-3.5 w-3.5" />
              Move to Group
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={() => handleMoveToGroup(null)}>
                Root (no group)
              </ContextMenuItem>
              <ContextMenuSeparator />
              {groups.map((g) => (
                <ContextMenuItem
                  key={g.id}
                  onClick={() => handleMoveToGroup(g.id)}
                >
                  {g.name}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => onShowProperties(layer.id)}>
          <Settings />
          Properties
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem variant="destructive" onClick={handleRemove}>
          <Trash2 />
          Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
