import { useMemo } from 'react'
import type { OpsData } from '../common'
import { LEG_STATUS_LABEL } from '../common'
import LegCard from './ui/LegCard'
import { buildColumns } from './utils/grouping'

export default function DispatchWindow({ data }: { data: OpsData }) {
  const columns = useMemo(() => buildColumns(data.legs, data.orders), [data.legs, data.orders])
  return (
    <div className="p-3 overflow-x-auto">
      <div className="grid grid-cols-5 gap-3 min-w-[900px]">
        {columns.map((col) => (
          <section key={col.status} className="bg-gray-50 rounded-lg p-2 space-y-2">
            <h3 className="text-sm font-bold flex justify-between px-1">
              <span>{LEG_STATUS_LABEL[col.status]}</span>
              <span className="text-gray-500">{col.cards.length}</span>
            </h3>
            {col.cards.map((m) => (
              <LegCard key={m.leg.id} model={m} />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
