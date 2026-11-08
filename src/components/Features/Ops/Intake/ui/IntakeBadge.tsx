import type { Intake } from '../../../../../types/domain/ops'

export default function IntakeBadge({ intake }: { intake: Intake }) {
  const app = intake === 'SHIPPER_APP'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${app ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-700'}`}>
      {app ? '화주앱' : '오프라인'}
    </span>
  )
}
