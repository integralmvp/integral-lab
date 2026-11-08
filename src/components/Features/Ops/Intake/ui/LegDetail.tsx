import type { Leg } from '../../../../../types/domain/ops'
import { LegStatusChip, fmtMoney } from '../../common'
import { dash, fmtLegPrice } from '../utils/stats'

export default function LegDetail({ legs }: { legs: Leg[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            {['단계', '경로_원본', '상태', '청구큐브', 'applied_role', '실단가', '수량', 'amount', '근거(applied_row_id)', '차종'].map(h => (
              <th key={h} className="py-1 pr-3 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {legs.map(l => (
            <tr key={l.id} className="border-t border-gray-200">
              <td className="py-1 pr-3">{l.단계}</td>
              <td className="py-1 pr-3">{l.경로_원본}</td>
              <td className="py-1 pr-3"><LegStatusChip status={l.status} /></td>
              <td className="py-1 pr-3">{dash(l.quote?.청구큐브)}</td>
              <td className="py-1 pr-3">{dash(l.quote?.applied_role)}</td>
              <td className="py-1 pr-3">{fmtLegPrice(l.quote?.실단가 ?? null, l.quote?.실단가_단위 ?? null)}</td>
              <td className="py-1 pr-3">{dash(l.quote?.수량)}</td>
              <td className="py-1 pr-3">{l.quote?.unregistered ? <span className="text-red-600 font-semibold">단가 미등록</span> : fmtMoney(l.quote?.amount)}</td>
              <td className="py-1 pr-3 font-mono">{dash(l.quote?.applied_row_id)}</td>
              <td className="py-1 pr-3">{dash(l.quote?.matched_vehicle)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
