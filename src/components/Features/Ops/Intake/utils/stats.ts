import type { OrderStatus } from '../../../../../types/domain/ops'
import type { OrderView } from '../../common'

export interface IntakeStats {
  total: number
  shipperApp: number
  offline: number
  byStatus: Partial<Record<OrderStatus, number>>
}

export function computeIntakeStats(views: OrderView[]): IntakeStats {
  const byStatus: Partial<Record<OrderStatus, number>> = {}
  let shipperApp = 0
  for (const v of views) {
    byStatus[v.status] = (byStatus[v.status] ?? 0) + 1
    if (v.order.intake === 'SHIPPER_APP') shipperApp++
  }
  return { total: views.length, shipperApp, offline: views.length - shipperApp, byStatus }
}

export function fmtLegPrice(price: number | null, unit: string | null): string {
  if (price === null) return '-'
  return `${price.toLocaleString('ko-KR')}${unit ? ` ${unit}` : ''}`
}

export function dash(v: unknown): string {
  return v === null || v === undefined || v === '' ? '-' : String(v)
}
