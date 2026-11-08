import type { OpsData } from '../common'
export default function DispatchWindow({ data }: { data: OpsData }) {
  return <div className="p-4 text-sm">배차·운송 창 (구현 예정) — 구간 {data.legs.length}개</div>
}
