import { useState } from 'react'
import type { OpsData } from '../common'
import DashboardRow from './sections/DashboardRow'
import OrderList from './sections/OrderList'
import ManualForm from './sections/ManualForm'

type Tab = 'list' | 'form'

export default function IntakeWindow({ data }: { data: OpsData }) {
  const [tab, setTab] = useState<Tab>('list')
  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-semibold border-b-2 ${tab === t ? 'border-teal-700 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`
  return (
    <div className="p-4 space-y-4">
      <DashboardRow views={data.views} />
      <div className="flex gap-1 border-b border-gray-200">
        <button type="button" className={tabCls('list')} onClick={() => setTab('list')}>접수 목록</button>
        <button type="button" className={tabCls('form')} onClick={() => setTab('form')}>수기 등록</button>
      </div>
      {tab === 'list' ? <OrderList views={data.views} /> : <ManualForm views={data.views} />}
    </div>
  )
}
