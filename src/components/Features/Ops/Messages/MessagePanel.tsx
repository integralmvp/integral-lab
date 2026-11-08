import type { Audience } from '../../../../types/domain/ops'
import type { OpsData } from '../common'
export default function MessagePanel({ data, audience }: { data: OpsData; audience: Audience; expanded?: boolean }) {
  const list = data.messages.filter(m => m.audience === audience)
  return <div className="p-2 text-xs">메시지 {list.length}건 (구현 예정)</div>
}
