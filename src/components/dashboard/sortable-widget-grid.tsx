"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripHorizontalIcon } from "lucide-react"
import type { ReactNode } from "react"

import { useWidgetOrder } from "@/hooks/use-widget-order"
import { cn } from "@/lib/utils"

export type SortableGridItem = {
  id: string
  title: string
  /** Grid span classes for the tile. */
  className: string
  /** The rendered widget (built on the server, so it can't be a component reference here). */
  content: ReactNode
}

/** Saved order first (ignoring ids that no longer exist); widgets added since go at the end. */
function applyOrder(items: SortableGridItem[], saved: string[] | null) {
  if (!saved) return items
  const byId = new Map(items.map((item) => [item.id, item]))
  const ordered = saved.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []))
  return [...ordered, ...items.filter((item) => !saved.includes(item.id))]
}

function SortableTile({ item }: { item: SortableGridItem }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/tile relative min-w-0", item.className, isDragging && "z-50 opacity-80")}
    >
      {/* Only the handle starts a drag, so buttons, dialogs and scrolling lists inside widgets keep working. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Move ${item.title}`}
        className={cn(
          "absolute top-1 left-1/2 z-10 -translate-x-1/2 cursor-grab touch-none rounded-md p-1 text-muted-foreground",
          "opacity-0 transition-opacity hover:bg-muted focus-visible:opacity-100 group-hover/tile:opacity-100",
          "[@media(pointer:coarse)]:opacity-100",
          isDragging && "cursor-grabbing opacity-100"
        )}
        {...attributes}
        {...listeners}
      >
        <GripHorizontalIcon className="size-4" />
      </button>
      {item.content}
    </div>
  )
}

/** The dashboard grid, with tiles that can be dragged into a new order (saved per `storageKey`). */
export function SortableWidgetGrid({ storageKey, items }: { storageKey: string; items: SortableGridItem[] }) {
  const [saved, save] = useWidgetOrder(storageKey)
  const ordered = applyOrder(items, saved)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const ids = ordered.map((item) => item.id)
    save(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))))
  }

  return (
    // A fixed id keeps dnd-kit's generated aria ids identical on server and client.
    <DndContext id={`dashboard-${storageKey}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ordered.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6 xl:grid-cols-4">
          {ordered.map((item) => (
            <SortableTile key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
