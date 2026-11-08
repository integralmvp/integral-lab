import { ORDER_STATUS_LABEL } from '../../common'
import type { OrderView } from '../../common'
import type { OrderStatus } from '../../../../../types/domain/ops'
import StatCard from '../ui/StatCard'
import { computeIntakeStats } from '../utils/stats'

export default function DashboardRow({ views }: { views: OrderView[] }) {
  const s = computeIntakeStats(views)
  const statuses = Object.keys(s.byStatus) as OrderStatus[]
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="총 접수" value={s.total} accent />
      <StatCard label="화주앱 유입" value={s.shipperApp} />
      <StatCard label="오프라인" value={s.offline} />
      {statuses.map(st => (
        <StatCard key={st} label={ORDER_STATUS_LABEL[st]} value={s.byStatus[st] ?? 0} />
      ))}
    </div>
  )
}
