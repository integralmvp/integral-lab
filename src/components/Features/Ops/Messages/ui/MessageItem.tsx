import type { OpsMessage } from '../../../../../types/domain/ops'
import { fmtTime } from '../../common'
import { SEVERITY_STYLE, ruleLabel } from '../utils/ruleLabels'

export default function MessageItem({ msg, big }: { msg: OpsMessage; big?: boolean }) {
  const s = SEVERITY_STYLE[msg.severity]
  return (
    <li className={`border rounded ${s.box} ${big ? 'p-3 text-sm' : 'p-2 text-xs'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${s.badge}`}>{msg.rule_id}</span>
        {big && <span className="text-gray-600">{ruleLabel(msg.rule_id)}</span>}
        <span className="ml-auto text-gray-500">{fmtTime(msg.at)}</span>
      </div>
      <div className="text-gray-900 leading-snug">{msg.text}</div>
    </li>
  )
}
