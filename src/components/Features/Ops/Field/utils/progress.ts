import type { Leg, LegStatus } from '../../../../../types/domain/ops'

export const FIELD_STEPS: { status: LegStatus; label: string }[] = [
  { status: 'DISPATCHED', label: '배차' },
  { status: 'LOADED', label: '상차' },
  { status: 'IN_TRANSIT', label: '운송중' },
  { status: 'DONE', label: '하차' },
]

export function stepStates(status: LegStatus): { label: string; done: boolean; current: boolean }[] {
  const idx = FIELD_STEPS.findIndex((s) => s.status === status)
  return FIELD_STEPS.map((s, i) => ({ label: s.label, done: i <= idx, current: i === idx }))
}

const ACTIVE: LegStatus[] = ['DISPATCHED', 'LOADED', 'IN_TRANSIT']

export function assignedLegs(legs: Leg[]): Leg[] {
  return legs
    .filter((l) => ACTIVE.includes(l.status))
    .sort((a, b) => (a.order_id === b.order_id ? a.seq - b.seq : a.order_id.localeCompare(b.order_id)))
}
