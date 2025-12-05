import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './ColumnSettings.css'

function SortableItem({ id, column, isVisible, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`column-item ${isDragging ? 'dragging' : ''}`}
    >
      <div className="drag-handle" {...attributes} {...listeners}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/>
          <circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/>
          <circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      
      <label className="column-checkbox">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={() => onToggle(column)}
        />
        <span className="checkbox-custom">
          {isVisible && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </span>
        <span className="column-name">{column}</span>
      </label>
    </div>
  )
}

function ColumnSettings({ 
  columns, 
  visibleColumns, 
  columnOrder,
  onToggleVisibility, 
  onReorder,
  onReset,
  onClose 
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id)
      const newIndex = columnOrder.indexOf(over.id)
      onReorder(arrayMove(columnOrder, oldIndex, newIndex))
    }
  }

  return (
    <>
      <div className="settings-overlay" onClick={onClose} />
      <div className="settings-panel animate-scale-in">
        {/* 毛玻璃效果层 - 核心三层结构 */}
        <div className="liquidGlass-effect"></div>
        <div className="liquidGlass-tint"></div>
        <div className="liquidGlass-shine"></div>
        
        {/* 内容层 */}
        <div className="liquidGlass-content">
          <div className="settings-header">
            <div className="settings-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              列展示
            </div>
            <button className="reset-btn" onClick={onReset}>
              重置
            </button>
          </div>
          
          <div className="settings-content">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                {columnOrder.map((column) => (
                  <SortableItem
                    key={column}
                    id={column}
                    column={column}
                    isVisible={visibleColumns.includes(column)}
                    onToggle={onToggleVisibility}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          
          <div className="settings-footer">
            <span className="visible-count">
              已选 {visibleColumns.length}/{columns.length} 列
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default ColumnSettings

