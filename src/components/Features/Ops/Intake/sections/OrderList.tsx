import { Fragment, useState } from 'react'
import { OrderStatusChip, fmtMoney } from '../../common'
import type { OrderView } from '../../common'
import IntakeBadge from '../ui/IntakeBadge'
import LegDetail from '../ui/LegDetail'

function TotalCell({ view }: { view: OrderView }) {
  if (view.hasUnregistered) return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">단가 미등록</span>
  if (!view.quoted) return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">미견적</span>
  return <span className="font-medium">{fmtMoney(view.total)}</span>
}

export default function OrderList({ views }: { views: OrderView[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500">
          <tr className="text-left">
            {['ID', '유입', '거래처', '품목', 'type', '상차 → 하차', '상태', '견적 합계'].map(h => (
              <th key={h} className="px-3 py-2 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {views.map(v => (
            <Fragment key={v.order.id}>
              <tr
                className="border-t border-gray-200 hover:bg-teal-50/40 cursor-pointer"
                onClick={() => setOpenId(openId === v.order.id ? null : v.order.id)}
              >
                <td className="px-3 py-2 font-mono text-xs">{v.order.id}</td>
                <td className="px-3 py-2"><IntakeBadge intake={v.order.intake} /></td>
                <td className="px-3 py-2">{v.order.거래처}</td>
                <td className="px-3 py-2">{v.order.품목}</td>
                <td className="px-3 py-2">{v.order.type}</td>
                <td className="px-3 py-2 whitespace-nowrap">{v.order.상차} → {v.order.하차}</td>
                <td className="px-3 py-2"><OrderStatusChip status={v.status} /></td>
                <td className="px-3 py-2"><TotalCell view={v} /></td>
              </tr>
              {openId === v.order.id && (
                <tr className="bg-gray-50">
                  <td colSpan={8} className="px-4 py-3"><LegDetail legs={v.legs} /></td>
                </tr>
              )}
            </Fragment>
          ))}
          {views.length === 0 && (
            <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">접수된 주문이 없습니다</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
