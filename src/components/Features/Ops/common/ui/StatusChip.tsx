import type { LegStatus, OrderStatus } from '../../../../../types/domain/ops'
import { LEG_STATUS_LABEL, ORDER_STATUS_LABEL } from '../utils/format'

const COLOR: Record<string, string> = {
  WAITING: 'bg-gray-100 text-gray-700',
  DISPATCHED: 'bg-blue-100 text-blue-700',
  LOADED: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-amber-100 text-amber-800',
  DONE: 'bg-teal-100 text-teal-800',
  RECEIVED: 'bg-gray-100 text-gray-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  IN_OPERATION: 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-teal-100 text-teal-800',
  SETTLED: 'bg-emerald-600 text-white',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function LegStatusChip({ status }: { status: LegStatus }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${COLOR[status]}`}>{LEG_STATUS_LABEL[status]}</span>
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${COLOR[status]}`}>{ORDER_STATUS_LABEL[status]}</span>
}
