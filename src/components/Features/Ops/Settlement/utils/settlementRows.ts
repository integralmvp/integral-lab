import type { OrderStatus } from '../../../../../types/domain/ops'
import type { OrderView } from '../../common'
import { PURCHASE_RATIO } from '../../../../../layers/ops/opsCommands'

export interface SettlementRow {
  id: string
  거래처: string
  type: string
  status: OrderStatus
  매출: number
  매입: number
  마진: number
  마진율: number
}

export interface SettlementTotals { 매출: number; 매입: number; 마진: number; 마진율: number }

export function buildSettlementRows(views: OrderView[]): SettlementRow[] {
  return views
    .filter(v => v.status === 'COMPLETED' || v.status === 'SETTLED')
    .map(v => {
      const 매출 = v.total ?? 0
      const 매입 = Math.round(매출 * PURCHASE_RATIO)
      const 마진 = 매출 - 매입
      return { id: v.order.id, 거래처: v.order.거래처, type: v.order.type, status: v.status, 매출, 매입, 마진, 마진율: 매출 > 0 ? 마진 / 매출 : 0 }
    })
}

export function sumRows(rows: SettlementRow[]): SettlementTotals {
  const 매출 = rows.reduce((s, r) => s + r.매출, 0)
  const 매입 = rows.reduce((s, r) => s + r.매입, 0)
  return { 매출, 매입, 마진: 매출 - 매입, 마진율: 매출 > 0 ? (매출 - 매입) / 매출 : 0 }
}

export function fmtPct(r: number): string {
  return `${(r * 100).toFixed(1)}%`
}
