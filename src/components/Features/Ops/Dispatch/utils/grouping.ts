import type { Leg, LegStatus, Order } from '../../../../../types/domain/ops'
import { LEG_FLOW } from '../../../../../engine/ops/status'

export interface LegCardModel {
  leg: Leg
  거래처: string
  prevPending: boolean
}

function bySeq(a: Leg, b: Leg) {
  return a.order_id === b.order_id ? a.seq - b.seq : a.order_id.localeCompare(b.order_id)
}

export function buildColumns(legs: Leg[], orders: Order[]): { status: LegStatus; cards: LegCardModel[] }[] {
  const name = new Map(orders.map((o) => [o.id, o.거래처]))
  const key = (l: Leg) => `${l.order_id}#${l.seq}`
  const byKey = new Map(legs.map((l) => [key(l), l]))
  const sorted = [...legs].sort(bySeq)
  return LEG_FLOW.map((status) => ({
    status,
    cards: sorted
      .filter((l) => l.status === status)
      .map((leg) => {
        const prev = byKey.get(`${leg.order_id}#${leg.seq - 1}`)
        return { leg, 거래처: name.get(leg.order_id) ?? '-', prevPending: status === 'WAITING' && !!prev && prev.status !== 'DONE' }
      }),
  }))
}
