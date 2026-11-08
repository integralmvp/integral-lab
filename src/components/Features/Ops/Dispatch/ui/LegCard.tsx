import { useState } from 'react'
import { advanceLeg } from '../../../../../layers/ops/opsCommands'
import { fmtMoney, LEG_NEXT_ACTION } from '../../common'
import type { LegCardModel } from '../utils/grouping'

export default function LegCard({ model }: { model: LegCardModel }) {
  const { leg, 거래처, prevPending } = model
  const [label, setLabel] = useState('')
  const next = LEG_NEXT_ACTION[leg.status]
  const unreg = leg.quote?.unregistered
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2.5 text-xs space-y-1.5 shadow-sm">
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold">{leg.order_id}</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{leg.단계}</span>
      </div>
      <div className="text-gray-600">{거래처}</div>
      <div className="font-medium text-gray-900">{leg.경로_원본}</div>
      {leg.수단_세부 && <div className="text-gray-500">{leg.수단_세부}</div>}
      <div className={unreg ? 'text-red-600 font-semibold' : 'text-gray-800'}>
        {unreg ? '단가 미등록' : fmtMoney(leg.quote?.amount)}
      </div>
      {prevPending && <div className="text-gray-400">이전 구간 대기</div>}
      {leg.status === 'WAITING' ? (
        <div className="flex gap-1">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={leg.quote?.matched_vehicle ?? '차량'}
            className="min-w-0 flex-1 border border-gray-300 rounded px-1.5 py-1"
          />
          <button
            onClick={() => advanceLeg(leg.id, '관리자', label.trim() || leg.quote?.matched_vehicle || undefined)}
            className="px-2 py-1 rounded bg-blue-600 text-white font-semibold"
          >
            {next}
          </button>
        </div>
      ) : (
        next && (
          <button onClick={() => advanceLeg(leg.id, '관리자')} className="w-full py-1 rounded bg-gray-800 text-white font-semibold">
            {next}
          </button>
        )
      )}
    </div>
  )
}
