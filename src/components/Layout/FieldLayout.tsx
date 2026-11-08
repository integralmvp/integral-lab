// LAB 현장 레이아웃 (?mode=field) — 모바일 폭 1화면
import { useOpsData } from '../Features/Ops/common'
import FieldScreen from '../Features/Ops/Field/FieldScreen'

export default function FieldLayout() {
  const data = useOpsData()
  return (
    <div className="min-h-screen bg-gray-200 flex justify-center">
      <div className="w-full max-w-[420px] min-h-screen bg-white shadow-xl">
        <FieldScreen data={data} />
      </div>
    </div>
  )
}
