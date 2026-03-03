import { ChevronRight, MoreVertical } from 'lucide-react'
import { LayerIcon, getKindLabel } from './layer-icon'
import { LayerContextMenu } from './layer-context-menu'
import type { NodeRendererProps } from 'react-arborist'
import type { ArboristNode } from './layer-tree'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { useMapEngine } from '@/map-engine'

interface LayerNodeProps extends NodeRendererProps<ArboristNode> {
  onShowProperties: (layerId: string) => void
}

export function LayerNode({
  node,
  style,
  dragHandle,
  onShowProperties,
}: LayerNodeProps) {
  const engine = useMapEngine()
  const layer = node.data.layer
  const isGroup = layer.kind === 'group'

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    engine.updateLayer(layer.id, { visible: !layer.visible })
  }

  const handleClick = () => {
    node.select()
    if (isGroup) {
      node.toggle()
    }
  }

  return (
    <LayerContextMenu node={node} onShowProperties={onShowProperties}>
      <div
        ref={dragHandle}
        style={style}
        className={cn(
          'group flex items-center gap-1 pr-1 pl-1 py-0.5 cursor-pointer rounded-sm text-sm',
          'hover:bg-accent/50',
          node.isSelected && 'bg-accent text-accent-foreground',
          !layer.visible && 'opacity-60',
        )}
        onClick={handleClick}
      >
        {/* Expand/collapse chevron for groups, spacer for leaves */}
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">
          {isGroup && (
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                node.isOpen && 'rotate-90',
              )}
            />
          )}
        </span>

        {/* Layer icon */}
        <LayerIcon
          kind={layer.kind}
          isOpen={node.isOpen}
          className={cn(
            'text-muted-foreground',
            node.isSelected && 'text-accent-foreground',
          )}
        />

        {/* Layer name (editable) */}
        {node.isEditing ? (
          <input
            type="text"
            defaultValue={layer.name}
            autoFocus
            className="flex-1 min-w-0 bg-background border border-input rounded px-1 py-0 text-sm outline-none"
            onBlur={(e) => node.submit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') node.submit(e.currentTarget.value)
              if (e.key === 'Escape') node.reset()
            }}
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs">{layer.name}</span>
        )}

        {/* Kind badge (subtle) */}
        <span className="hidden group-hover:inline-flex shrink-0 text-[10px] text-muted-foreground/60 mr-1">
          {getKindLabel(layer.kind)}
        </span>

        {/* Visibility toggle */}
        <span
          className="shrink-0"
          onClick={handleToggleVisibility}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Switch checked={layer.visible} size="sm" />
        </span>

        {/* More menu button */}
        <button
          className="shrink-0 h-5 w-5 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation()
            onShowProperties(layer.id)
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </LayerContextMenu>
  )
}
