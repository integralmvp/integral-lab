import type { OpsEvent } from '../../../../../types/domain/ops'
import { fmtTime } from '../../common'

export default function EventTimeline({ events }: { events: OpsEvent[] }) {
  return (
    <section>
      <h3 className="font-bold text-gray-900 text-sm mb-2">이벤트 기록 (최근 {events.length}건)</h3>
      <div className="border border-gray-200 rounded bg-white max-h-80 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 text-gray-500 sticky top-0">
            <tr><th className="text-left p-2">시각</th><th className="text-left p-2">행위자</th><th className="text-left p-2">이벤트</th><th className="text-left p-2">주문</th><th className="text-left p-2">구간</th></tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="p-2 text-gray-500">{fmtTime(e.at)}</td>
                <td className="p-2">{e.actor}</td>
                <td className="p-2 font-mono">{e.type}</td>
                <td className="p-2">{e.order_id}</td>
                <td className="p-2 text-gray-500">{e.leg_id ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
