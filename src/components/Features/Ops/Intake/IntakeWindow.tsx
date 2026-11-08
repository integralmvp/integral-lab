import type { OpsData } from '../common'
export default function IntakeWindow({ data }: { data: OpsData }) {
  return <div className="p-4 text-sm">접수 창 (구현 예정) — {data.views.length}건</div>
}
