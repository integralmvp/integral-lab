import { useMemo, useState } from 'react'
import type { Leg } from '../../../../../types/domain/ops'
import { assignedLegs } from '../utils/progress'

export function useSelectedLeg(legs: Leg[]) {
  const [pickedId, setPickedId] = useState<string | null>(null)
  const assigned = useMemo(() => assignedLegs(legs), [legs])
  // 선택한 구간이 DONE이 되어도 완료 상태를 보여주기 위해 전체 legs에서 찾는다
  const selected = useMemo(
    () => legs.find((l) => l.id === pickedId) ?? assigned[0] ?? null,
    [legs, pickedId, assigned],
  )
  return { assigned, selected, setPickedId }
}
