import type { OpsData } from '../common'
export default function SettlementWindow({ data }: { data: OpsData }) {
  return <div className="p-4 text-sm">정산·기록 창 (Step 2) — 완료 {data.views.filter(v => v.status === 'COMPLETED').length}건</div>
}
