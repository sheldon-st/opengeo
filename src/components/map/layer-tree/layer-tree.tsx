import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Tree } from 'react-arborist'
import { LayerNode } from './layer-node'
import type { TreeApi } from 'react-arborist'
import type { LayerDefinition, LayerKind, LayerTreeNode } from '@/map-engine'
import { useMapEngine, useMapStore } from '@/map-engine'

export type ArboristNode = {
  id: string
  name: string
  kind: LayerKind
  layer: LayerDefinition
  children: Array<ArboristNode> | null
}

function toArboristData(nodes: Array<LayerTreeNode>): Array<ArboristNode> {
  return nodes.map((n) => ({
    id: n.layer.id,
    name: n.layer.name,
    kind: n.layer.kind,
    layer: n.layer,
    children: n.layer.kind === 'group' ? toArboristData(n.children) : null,
  }))
}

function buildTree(
  layers: Record<string, LayerDefinition>,
): Array<LayerTreeNode> {
  const all = Object.values(layers).sort((a, b) => a.sortOrder - b.sortOrder)
  const byParent = new Map<string | null, Array<LayerDefinition>>()
  for (const layer of all) {
    const key = layer.parentId ?? null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(layer)
  }

  function buildChildren(parentId: string | null): Array<LayerTreeNode> {
    const children = byParent.get(parentId) ?? []
    return children.map((layer) => ({
      layer,
      children: layer.kind === 'group' ? buildChildren(layer.id) : [],
    }))
  }

  return buildChildren(null)
}

interface LayerTreeProps {
  onSelect?: (layerId: string | null) => void
  onShowProperties: (layerId: string) => void
}

export function LayerTree({ onSelect, onShowProperties }: LayerTreeProps) {
  const treeRef = useRef<TreeApi<ArboristNode>>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(300)
  const engine = useMapEngine()
  const layers = useMapStore((s) => s.layers)

  const arboristData = useMemo(() => {
    const treeData = buildTree(layers)
    return toArboristData(treeData)
  }, [layers])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(el)
    setContainerHeight(el.clientHeight)
    return () => observer.disconnect()
  }, [])

  const handleMove = useCallback(
    ({
      dragIds,
      parentId,
      index,
    }: {
      dragIds: Array<string>
      parentId: string | null
      index: number
    }) => {
      for (const id of dragIds) {
        engine.updateLayer(id, {
          parentId: parentId ?? null,
          sortOrder: index,
        })
      }
    },
    [engine],
  )

  const handleRename = useCallback(
    ({ id, name }: { id: string; name: string }) => {
      engine.updateLayer(id, { name })
    },
    [engine],
  )

  const handleSelect = useCallback(
    (nodes: Array<{ data: ArboristNode }>) => {
      const selected = nodes[0] as { data: ArboristNode } | undefined
      onSelect?.(selected ? selected.data.id : null)
    },
    [onSelect],
  )

  return (
    <div ref={containerRef} className="flex-1 h-full">
      <Tree<ArboristNode>
        ref={treeRef}
        data={arboristData}
        onMove={handleMove}
        onRename={handleRename}
        onSelect={handleSelect}
        openByDefault={true}
        width="100%"
        height={containerHeight}
        rowHeight={28}
        indent={16}
        padding={4}
      >
        {(props) => (
          <LayerNode {...props} onShowProperties={onShowProperties} />
        )}
      </Tree>
    </div>
  )
}
