import type { OpsData } from '../common'
import { LEG_NEXT_ACTION, LEG_STATUS_LABEL } from '../common'
import { advanceLeg } from '../../../../layers/ops/opsCommands'
import { useSelectedLeg } from './hooks/useSelectedLeg'
import { stepStates } from './utils/progress'

export default function FieldScreen({ data }: { data: OpsData }) {
  const { assigned, selected, setPickedId } = useSelectedLeg(data.legs)
  if (!selected) {
    return <div className="p-6 text-center text-gray-500">배정된 구간이 없습니다 — 관리자 화면에서 배차하세요</div>
  }
  const order = data.orders.find((o) => o.id === selected.order_id)
  const next = LEG_NEXT_ACTION[selected.status]
  const options = assigned.some((l) => l.id === selected.id) ? assigned : [selected, ...assigned]
  return (
    <div className="p-4 space-y-4">
      <select
        value={selected.id}
        onChange={(e) => setPickedId(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-2 text-sm"
      >
        {options.map((l) => (
          <option key={l.id} value={l.id}>
            {l.order_id} · {l.경로_원본}
          </option>
        ))}
      </select>
      <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="text-xs font-semibold text-gray-500">{selected.단계}</div>
        <div className="text-2xl font-bold leading-snug">{selected.경로_원본}</div>
        <div className="text-sm text-gray-700">
          {order?.거래처 ?? '-'} / {order?.품목 ?? '-'}
        </div>
        {selected.수단_세부 && <div className="text-sm text-gray-500">차량: {selected.수단_세부}</div>}
        <div className="text-base font-semibold">{LEG_STATUS_LABEL[selected.status]}</div>
        <ol className="flex gap-1">
          {stepStates(selected.status).map((s) => (
            <li key={s.label} className="flex-1 text-center">
              <div className={`h-2 rounded ${s.done ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className={`text-xs mt-1 ${s.current ? 'font-bold text-blue-700' : 'text-gray-500'}`}>{s.label}</div>
            </li>
          ))}
        </ol>
      </div>
      {next ? (
        <button
          onClick={() => advanceLeg(selected.id, '현장')}
          className="w-full py-6 rounded-2xl bg-blue-600 text-white text-2xl font-bold active:bg-blue-700"
        >
          {next}
        </button>
      ) : (
        <div className="w-full py-6 rounded-2xl bg-teal-100 text-teal-800 text-2xl font-bold text-center">완료</div>
      )}
    </div>
  )
}
