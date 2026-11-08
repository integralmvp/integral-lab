/**
 * 경로매핑 사전 (placeholder 축약판) — 설계서 §3 deriveLegs 입력
 * 상차/하차 자유텍스트 → 권역 라벨. 미매핑 시 raw 텍스트 fallback.
 * TODO(§10): 경로매핑 명세 §1.1~1.3 전체 표 이식
 */
export interface RouteDict {
  /** 키워드 → 권역 */
  regions: Array<{ keyword: string; region: string }>
  /** 선사명 → 출발항 */
  carriers: Record<string, string>
  defaultPort: string
  jejuPort: string
  jejuKeywords: string[]
}

export const ROUTE_DICT: RouteDict = {
  regions: [
    { keyword: '서울', region: '수도권' },
    { keyword: '경기', region: '수도권' },
    { keyword: '인천', region: '수도권' },
    { keyword: '부산', region: '부산권' },
    { keyword: '경남', region: '부산권' },
    { keyword: '광주', region: '호남권' },
    { keyword: '전남', region: '호남권' },
    { keyword: '목포', region: '호남권' },
    { keyword: '대구', region: '영남권' },
    { keyword: '대전', region: '충청권' },
    { keyword: '제주시', region: '제주시' },
    { keyword: '서귀포', region: '서귀포' },
  ],
  carriers: {
    '선사A': '부산항',
    '선사B': '목포항',
    '선사C': '완도항',
  },
  defaultPort: '부산항',
  jejuPort: '제주항',
  jejuKeywords: ['제주', '서귀포'],
}
