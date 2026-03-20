import type { Cell, CellType } from './types'

export function defaultCells(divisions: number): Cell[] {
  return Array.from({ length: divisions }, () => ({ type: 'rest' as CellType, duration: 1 }))
}

export interface LayoutItem {
  cell: Cell
  start: number
}

export function layoutCells(cells: Cell[], divisions: number): LayoutItem[] {
  const result: LayoutItem[] = []
  let pos = 0
  let i = 0
  while (pos < divisions && i < cells.length) {
    result.push({ cell: cells[i], start: pos })
    pos += cells[i].duration
    i++
  }
  return result
}

function cellsIndexAtPosition(cells: Cell[], targetPos: number): number {
  let pos = 0
  for (let i = 0; i < cells.length; i++) {
    if (pos === targetPos) return i
    pos += cells[i].duration
  }
  return -1
}

export function cycleCell(
  cells: Cell[],
  layoutIndex: number,
  direction: 'type' | 'grow' | 'shrink',
  divisions: number
): Cell[] {
  const layout = layoutCells(cells, divisions)
  const item = layout[layoutIndex]
  if (!item) return cells

  const { cell, start } = item
  const newCells = [...cells]

  if (direction === 'type') {
    const idx = cellsIndexAtPosition(cells, start)
    if (idx !== -1) {
      newCells[idx] = { ...newCells[idx], type: cell.type === 'note' ? 'rest' : 'note' }
    }
  } else if (direction === 'grow') {
    // Double the duration by consuming subsequent cells
    const nextDuration = cell.duration * 2
    if (nextDuration > divisions) return cells

    const idx = cellsIndexAtPosition(cells, start)
    if (idx === -1) return cells

    const needed = nextDuration - cell.duration
    let consumed = 0
    let removeCount = 0
    let checkIdx = idx + 1
    while (consumed < needed && checkIdx < newCells.length) {
      consumed += newCells[checkIdx].duration
      removeCount++
      checkIdx++
    }
    if (consumed !== needed) return cells

    newCells.splice(idx, 1 + removeCount, { type: cell.type, duration: nextDuration })
  } else if (direction === 'shrink') {
    if (cell.duration <= 1) return cells
    const halfDuration = Math.floor(cell.duration / 2)
    const remainder = cell.duration - halfDuration

    const idx = cellsIndexAtPosition(cells, start)
    if (idx === -1) return cells

    newCells.splice(idx, 1,
      { type: cell.type, duration: halfDuration },
      { type: 'rest' as CellType, duration: remainder }
    )
  }

  return newCells
}

/** Given a subdivision position, find which layout item contains it */
export function layoutIndexAtStep(layout: LayoutItem[], step: number): number {
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i]
    if (step >= item.start && step < item.start + item.cell.duration) {
      return i
    }
  }
  return -1
}
