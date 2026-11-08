// INTEGRAL MVP - PR2-2: 관제 센터 UI + Mapbox
// PR4: SearchResultProvider 추가 (검색 결과 공유)
// LAB: ?mode=admin → 운영 OpsLayout, ?mode=field → 현장 FieldLayout, ?mode=quote → 기존 관리자 견적 (화주 화면 미변경)
import CommandLayout from './components/Layout/CommandLayout'
import AdminLayout from './components/Layout/AdminLayout'
import OpsLayout from './components/Layout/OpsLayout'
import FieldLayout from './components/Layout/FieldLayout'
import { SearchResultProvider } from './contexts/SearchResultContext'

const mode = new URLSearchParams(window.location.search).get('mode')

function App() {
  if (mode === 'admin') return <OpsLayout />
  if (mode === 'field') return <FieldLayout />
  return (
    <SearchResultProvider>
      {mode === 'quote' ? <AdminLayout /> : <CommandLayout />}
    </SearchResultProvider>
  )
}

export default App
