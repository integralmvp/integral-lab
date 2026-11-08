import type { Audience } from '../../../../types/domain/ops'
import type { OpsData } from '../common'
import MessageItem from './ui/MessageItem'
import { countBySeverity, filterByAudience, groupByRule } from './utils/groupMessages'
import { SEVERITY_STYLE, ruleLabel } from './utils/ruleLabels'

export default function MessagePanel({ data, audience, expanded }: { data: OpsData; audience: Audience; expanded?: boolean }) {
  const list = filterByAudience(data.messages, audience)
  const counts = countBySeverity(list)
  const groups = groupByRule(list)
  return (
    <div className={expanded ? 'p-4' : 'p-2'}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <h3 className={`font-bold text-gray-900 ${expanded ? 'text-base' : 'text-sm'}`}>메시지 · {audience}</h3>
        {(['alert', 'warn', 'info'] as const).map(sv => (
          <span key={sv} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${SEVERITY_STYLE[sv].badge}`}>
            {SEVERITY_STYLE[sv].label} {counts[sv]}
          </span>
        ))}
      </div>
      {list.length === 0 && <div className="text-xs text-gray-400 py-6 text-center">새 메시지 없음</div>}
      {expanded ? (
        <div className="space-y-4">
          {groups.map(([rule, msgs]) => (
            <section key={rule}>
              <h4 className="text-sm font-semibold text-gray-700 mb-1.5">
                {rule} · {ruleLabel(rule)} <span className="text-gray-400">({msgs.length})</span>
              </h4>
              <ul className="space-y-2">
                {msgs.map(m => <MessageItem key={m.id} msg={m} big />)}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {list.map(m => <MessageItem key={m.id} msg={m} />)}
        </ul>
      )}
    </div>
  )
}
