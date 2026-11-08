// LAB 운영 레이아웃 (?mode=admin) — 상단 창 전환 + 메시지 패널 + 실무자/대표 토글
import { useState } from 'react'
import type { Audience } from '../../types/domain/ops'
import { useOpsData, DemoBadge } from '../Features/Ops/common'
import IntakeWindow from '../Features/Ops/Intake/IntakeWindow'
import DispatchWindow from '../Features/Ops/Dispatch/DispatchWindow'
import SettlementWindow from '../Features/Ops/Settlement/SettlementWindow'
import MessagePanel from '../Features/Ops/Messages/MessagePanel'
import { resetDemo } from '../../layers/ops/opsCommands'

type Tab = 'intake' | 'dispatch' | 'settlement' | 'messages'
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'intake', label: '접수' },
  { id: 'dispatch', label: '배차·운송' },
  { id: 'settlement', label: '정산·기록' },
  { id: 'messages', label: '메시지' },
]

export default function OpsLayout() {
  const data = useOpsData()
  const [tab, setTab] = useState<Tab>('intake')
  const [audience, setAudience] = useState<Audience>('실무자')

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-gray-900">
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b">
        <span className="text-teal-700 text-2xl font-black">CUBE</span>
        <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-xs font-bold">운영 LAB</span>
        <DemoBadge />
        <nav className="flex gap-1 ml-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold ${tab === t.id ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {(['실무자', '대표'] as Audience[]).map(a => (
            <button
              key={a}
              onClick={() => setAudience(a)}
              className={`px-3 py-1 rounded text-xs font-semibold border ${audience === a ? 'bg-gray-900 text-white' : 'bg-white text-gray-600'}`}
            >
              {a}
            </button>
          ))}
          <a href="?mode=field" target="_blank" rel="noreferrer" className="px-3 py-1 rounded text-xs border bg-white">현장 화면 열기</a>
          <button onClick={resetDemo} className="px-3 py-1 rounded text-xs border bg-white text-red-600">데모 초기화</button>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-[1fr_340px] overflow-hidden">
        <main className="overflow-auto">
          {tab === 'intake' && <IntakeWindow data={data} />}
          {tab === 'dispatch' && <DispatchWindow data={data} />}
          {tab === 'settlement' && <SettlementWindow data={data} />}
          {tab === 'messages' && <MessagePanel data={data} audience={audience} expanded />}
        </main>
        <aside className="border-l bg-white overflow-auto">
          <MessagePanel data={data} audience={audience} />
        </aside>
      </div>
    </div>
  )
}
