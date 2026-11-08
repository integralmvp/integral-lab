import type { OpsData } from '../common'
export default function FieldScreen({ data }: { data: OpsData }) {
  return <div className="p-4 text-sm">현장 화면 (구현 예정) — 구간 {data.legs.length}개</div>
}
