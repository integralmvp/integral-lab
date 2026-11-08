import type { OpsData } from '../common'
import { OrderStatusChip, fmtMoney } from '../common'
import { confirmSettlement, PURCHASE_RATIO } from '../../../../layers/ops/opsCommands'
import EventTimeline from './ui/EventTimeline'
import { buildSettlementRows, fmtPct, sumRows } from './utils/settlementRows'

export default function SettlementWindow({ data }: { data: OpsData }) {
  const rows = buildSettlementRows(data.views)
  const totals = sumRows(rows)
  const recent = data.events.slice(-30).reverse()
  return (
    <div className="p-4 space-y-6">
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-2">정산</h3>
        <div className="border border-gray-200 rounded bg-white overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left p-2">주문</th><th className="text-left p-2">거래처</th><th className="text-left p-2">유형</th>
                <th className="text-right p-2">매출</th><th className="text-right p-2">매입</th><th className="text-right p-2">마진</th>
                <th className="text-right p-2">마진율</th><th className="p-2">상태</th><th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-gray-400 text-xs">정산 대상 없음</td></tr>}
              {rows.map(r => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="p-2 font-mono text-xs">{r.id}</td><td className="p-2">{r.거래처}</td><td className="p-2">{r.type}</td>
                  <td className="p-2 text-right">{fmtMoney(r.매출)}</td><td className="p-2 text-right">{fmtMoney(r.매입)}</td>
                  <td className="p-2 text-right">{fmtMoney(r.마진)}</td><td className="p-2 text-right">{fmtPct(r.마진율)}</td>
                  <td className="p-2 text-center"><OrderStatusChip status={r.status} /></td>
                  <td className="p-2 text-right">
                    {r.status === 'COMPLETED' && (
                      <button onClick={() => confirmSettlement(r.id)} className="px-2 py-1 rounded bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700">정산 확정</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-300 font-bold bg-gray-50">
              <tr>
                <td className="p-2" colSpan={3}>합계</td>
                <td className="p-2 text-right">{fmtMoney(totals.매출)}</td><td className="p-2 text-right">{fmtMoney(totals.매입)}</td>
                <td className="p-2 text-right">{fmtMoney(totals.마진)}</td><td className="p-2 text-right">{fmtPct(totals.마진율)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-1">매입 = 매출 × {PURCHASE_RATIO} (시연용 상수)</p>
      </section>
      <EventTimeline events={recent} />
    </div>
  )
}
