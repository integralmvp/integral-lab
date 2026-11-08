import type { Leg, LegStatus, Order } from '../../../../../types/domain/ops'
import { LEG_FLOW, canDispatchLeg } from '../../../../../engine/ops/status'

export interface LegCardModel {
  leg: Leg
  거래처: string
  /** 배차 불가 사유 (WAITING이고 배차 가능하면 null) — engine/ops canDispatchLeg 결과 */
  dispatchBlockedReason: string | null
}

function bySeq(a: Leg, b: Leg) {
  return a.order_id === b.order_id ? a.seq - b.seq : a.order_id.localeCompare(b.order_id)
}

export function buildColumns(legs: Leg[], orders: Order[]): { status: LegStatus; cards: LegCardModel[] }[] {
  const name = new Map(orders.map((o) => [o.id, o.거래처]))
  const sorted = [...legs].sort(bySeq)
  return LEG_FLOW.map((status) => ({
    status,
    cards: sorted
      .filter((l) => l.status === status)
      .map((leg) => ({
        leg,
        거래처: name.get(leg.order_id) ?? '-',
        dispatchBlockedReason: status === 'WAITING' ? canDispatchLeg(leg, legs).reason : null,
      })),
  }))
}
