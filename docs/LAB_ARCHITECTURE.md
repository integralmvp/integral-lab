# INTEGRAL LAB — 시스템 뼈대 설계서 (v0, 2026-11-09)

> 목적: 로직(SPL)이 미완이어도, **물류 흐름 하나가 접수→견적→배차→운행→정산→메시지까지 끝까지 흐르는 시스템**을 먼저 세운다.
> 단가테이블은 교체 가능한 부품(`PriceTableSource`)으로 끼운다. 시연 단가는 전부 **임시값(placeholder)**.
> 개념·데이터모델·스키마는 SPL 명세(master_final + 2026-11-05 개정안)를 따른다. 충돌 지점은 §10에 모아 둔다.

---

## 0. 실험장 규칙

- `main` = MVP 원본 보존, `admin-mvp-draft` = 관리자 MVP 원본 보존. **작업은 `lab` 브랜치에서만.**
- 기존 `src/engine/cube/`(250mm, 화주용)는 **건드리지 않는다.** 관리자·운영 쪽은 200mm `src/engine/cubeCoordinate/` 세계. 병합 금지.
- 기존 CLAUDE.md 컨벤션 유지: `engine/` 순수함수, `infra/storage/` repo, `ui/ sections/ hooks/ utils/`, 컴포넌트 300줄 이하.
- 새 저장소 키는 `lab:` 네임스페이스. 기존 `integral_mvp_v1_*`, `admin:quote:*` 키는 읽기만.

---

## 1. 척추: 거래건(Order) + 구간(Leg) + 이벤트(Event)

세 가지만 있으면 모든 창이 같은 데이터를 다른 각도로 본다.

```
Order  (거래건)   접수 단위. 화주/제원/유형/수량. 접수 경로 = SHIPPER_APP | OFFLINE
 └ Leg (구간)     SPL 명세의 '세부행'. 단계 = 내륙 | 선사 | 도내. 구간마다 견적·배차·상태가 따로 있다.
Event  (이벤트)   append-only 로그. 모든 상태 변화는 이벤트로만 일어난다. (기존 eventLog 원칙 계승)
Message(메시지)   이벤트/시간 규칙에서 파생. 저장은 캐시일 뿐 진실은 Event.
```

- **상태는 Leg가 가진다.** Order 상태는 Leg들에서 파생(§4). 이유: 구간마다 운송사·차량이 다르다.
- 화면은 repo를 읽고, 변경은 `emit(event)` 한 곳으로만. 화면이 상태를 직접 바꾸지 않는다.
- 실시간: localStorage + `storage` 이벤트로 **탭 간 동기화**(관리자 탭 ↔ 현장 탭). 백엔드 없이 "실시간 관제"를 보여주는 장치.

---

## 2. 데이터 모델 (SPL 컬럼명 보존)

`src/types/domain/ops.ts`

```ts
export type OrderType = '중량형' | '컨테이너형' | '차량형' | '자동화물형'   // 선가공 유형_메타와 동일
export type Stage     = '내륙' | '선사' | '도내'                           // 세부행 '단계'
export type Intake    = 'SHIPPER_APP' | 'OFFLINE'

export interface Order {
  id: string
  intake: Intake
  sourceRef?: string            // SHIPPER_APP이면 Deal.id
  거래처: string                // SPL 주체 부조건
  품목: string
  상차: string; 하차: string    // 자유 텍스트 (경로매핑 입력)
  선사명?: string
  운송구분?: '시내' | '시외'
  type: OrderType
  // 제원은 '원본'을 저장한다. 큐브는 항상 200mm 엔진으로 재계산 (화주앱 250mm 큐브를 가져오지 않는다)
  cargo: { length_mm: number; width_mm: number; height_mm: number; weight_kg: number }
  차량대수: number              // 중량형은 운송중량(ton)을 별도로
  운송중량_ton?: number
  created_at: string
}

export interface Leg {                       // = SPL 세부행
  id: string; order_id: string
  단계: Stage; seq: number                   // 내륙(0) → 선사(1) → 도내(2)
  경로_원본: string                          // 경로매핑 §2 루트 공식 결과. 예 '수도권-부산항'
  수단_세부?: string                         // 배정 차량/선박 (배차 시 확정)
  status: LegStatus
  quote: LegQuote | null
}

export interface LegQuote {
  청구큐브: number; 큐브당: number | null; 차량당: number | null
  amount: number | null                      // 실단가 × 수량 (큐브당×큐브 아님 — 반올림 손실 방지)
  applied_row_id: string | null              // 어떤 단가행이 적용됐는지 (대표에게 보여줄 근거)
  applied_role: PriceRole | null
  price_version: string                      // 'placeholder-v0' 등
  unregistered: boolean                      // 룩업 실패 → 0원 표시 금지
}

export interface PriceRow {                  // 단가테이블 1행 = SPL 산출 1행
  id: string
  유형: OrderType; 단계: Stage
  역할: PriceRole; 위계: number              // 표준0 세부1 조건2 협상3 전속4 기타5 (명세 역할_위계)
  conditions: { 거래처?: string; 품목?: string; 경로_세부?: string; 수단_세부?: string }  // 생략 = 와일드카드
  큐브당: number                             // 정수(round half up)
  실단가: number; 실단가_단위: '차량' | '톤'   // 후가공 역산값. 견적은 이 값으로 계산
  source: 'placeholder' | 'manual_v0' | `spl_v${number}`
  version: string
  meta?: Record<string, unknown>             // 거래건수, 대표Q, RDS 등 SPL 근거(미사용 가능)
}
export type PriceRole = '표준'|'세부'|'조건'|'협상'|'전속'|'전속_단일'|'전속_외부변수'|'미분류'|'기타'
                      | '단가군_세부'|'단가군_조건'|'단가군_협상'|'참고'

export type LegStatus = 'WAITING' | 'DISPATCHED' | 'LOADED' | 'IN_TRANSIT' | 'DONE'
export type OrderStatus = 'RECEIVED' | 'QUOTED' | 'IN_OPERATION' | 'COMPLETED' | 'SETTLED' | 'CANCELLED'

export interface Dispatch { id; leg_id; vehicle_label: string; driver_label?: string; dispatched_at: string }
export interface OpsEvent  { id; at: string; actor: '관리자'|'현장'|'시스템'; type: EventType; order_id: string; leg_id?: string; payload?: unknown }
export interface Settlement{ order_id; 매출: number; 매입: number; 마진: number; status: 'PENDING'|'CONFIRMED'; settled_at?: string }
export interface OpsMessage { id; rule_id: string; audience: '실무자'|'대표'; severity: 'info'|'warn'|'alert'; order_id?: string; text: string; event_id?: string; at: string }
```

---

## 3. 파이프라인 (SPL 5단계 → 런타임 4함수, 전부 `src/engine/ops/` 순수함수)

| 런타임 함수 | 대응 SPL 단계 | 입력 → 출력 |
|---|---|---|
| `deriveLegs(order)` | 경로매핑 §1~2 (사전 + 루트 공식) | 상차/하차/선사명 → Leg[] (경로_원본 채움) |
| `convertCubes(order, 유형_메타)` | 큐브환산 §6 | 제원 → 청구큐브 (**유형_메타 주도, 유형 분기는 데이터로**) |
| `lookupPrice(rows, order, leg)` | 단가테이블 산출물 적용 | 조건 일치 행 중 최적 1행 |
| `quoteLeg(...)` | 후가공 | 실단가 × 수량 → LegQuote |

- **큐브환산**: `유형_메타`(선가공 파일의 dict)를 TS로 이식. 중량형=`운송중량×200`(실존), 컨테이너/차량/자동화물=`규격큐브×수량`(실질). 차량형 규격은 기존 `cargoCubes`+`matchVehicle`+`VEHICLE_DB` 재사용.
- **deriveLegs**: 입도(본토→제주) = 내륙→선사→도내 3구간. 도내 단독·자동화물형 = 1구간(raw 경로). 사전은 경로매핑 명세 §1.1~1.3 표를 `src/data/lab/routeDict.ts`로 그대로 이식. 사전 미매핑 시 raw `상차→하차` fallback.
- **lookupPrice 규칙** (명세에 정의가 없어 여기서 고정, §10-①):
  1. 유형·단계 일치, conditions의 non-null 축이 전부 주문과 일치하는 행만 후보
  2. `기타·참고·전속_외부변수·미분류` 제외. `전속`은 거래처 일치 시에만
  3. 정렬: non-null 축 개수(구체성) 내림차순 → 위계 숫자 내림차순
  4. 후보 없음 → `unregistered: true` (0원 금지, 크래시 금지)
- 반올림: 큐브당 = `floor(x+0.5)`, 중량형은 2단계(총액/톤→/200). **견적 금액은 실단가로 계산.**
- 기존 `lookupRate/quote`(3계층 고정)는 이 일반형이 **대체**한다. 골든 테스트(6m 파이프 → 5t, 청구큐브 2,500)는 유지·통과해야 한다.

### PriceTableSource (교체 접점 — 이 인터페이스가 병행 개발의 계약)

```ts
export interface PriceTableSource { id: string; version: string; source: PriceRow['source']; getRows(): PriceRow[] }
```
오늘: `placeholderSource`(seed). 나중: SPL 산출 JSON을 읽는 `splSource`. 엔진·UI는 Source만 안다.

---

## 4. 상태 기계

```
Leg:    WAITING ─배차→ DISPATCHED ─상차→ LOADED ─출발→ IN_TRANSIT ─하차→ DONE
Order:  RECEIVED ─견적완료→ QUOTED ─첫 배차→ IN_OPERATION ─모든 Leg DONE→ COMPLETED ─정산확정→ SETTLED
        (어느 단계에서든 → CANCELLED)
```
- `deriveOrderStatus(legs, settlement)` 순수함수. Order 상태를 따로 저장하지 않는다(캐시만).
- 전이 허용표를 `engine/ops/status.ts`에 선언. 허용되지 않는 전이는 거부 + 이벤트 미발행.
- 이벤트 타입: `ORDER_RECEIVED, QUOTE_DONE, QUOTE_UNREGISTERED, LEG_DISPATCHED, LEG_LOADED, LEG_IN_TRANSIT, LEG_DONE, ORDER_COMPLETED, SETTLEMENT_CONFIRMED, ORDER_CANCELLED`.

---

## 5. 창 구성 (라우팅: `?mode=admin` = OpsLayout 탭, `?mode=field` = 현장 모바일 프레임)

| 창 | 내용 | 읽는 것 / 쓰는 것 |
|---|---|---|
| **① 접수** | 상단: 총 접수 대시보드(접수경로별·상태별 카운트). 탭 A "화주앱 유입", 탭 B "수기 등록". 수기 등록 폼 = 기존 `CargoInputForm`+`QuoteResultCard` 재사용(견적 시뮬레이터 겸용). 접수 확정 시 Order+Leg 생성 + 견적. | 쓰기: `ORDER_RECEIVED`, `QUOTE_DONE` |
| **② 배차·운송** | 구간(Leg) 단위 칸반(대기/배차/상차/운송중/완료) + 표. 배차 시 차량 라벨 배정. 상태는 **현장 UI의 이벤트로 실시간 변경**. | 쓰기: `LEG_DISPATCHED` / 읽기: 전 이벤트 |
| **③ 현장(`?mode=field`)** | 모바일 폭 한 화면. 배정된 구간 카드 + 큰 버튼 하나(다음 단계: 상차→출발→하차). | 쓰기: `LEG_LOADED/IN_TRANSIT/DONE` |
| **④ 정산·기록** | COMPLETED 건 목록 → 정산 확정. 매출/매입/마진, 기간·거래처·유형 집계(표 + 간단 차트 1개). 전체 이벤트 타임라인 조회. | 쓰기: `SETTLEMENT_CONFIRMED` |
| **메시지 패널** | 상단 고정. 뷰 토글 `실무자 | 대표`. 이벤트에서 파생된 메시지 목록. | 읽기 전용 |

화주앱 유입(어댑터): 화주앱 `Deal`(SUBMITTED/CONFIRMED)은 마켓플레이스 상품 기준이라 구간 견적에 필요한 정보가 부족하다. 계약 = **원본 제원만 가져온다**: `deal.demandId → demand session`의 박스(width/depth/height/count/weightKg)와 출발/도착. 큐브·금액은 가져오지 않고 200mm 엔진으로 재계산. 연동이 어려우면 `SHIPPER_APP` 라벨의 시드 3건으로 대체(시연용), 어댑터 파일만 남겨둔다(`adapters/dealToOrder.ts`).

---

## 6. 메시지 엔진 (규칙 = 순수함수 배열, 이벤트·시각을 받아 메시지를 반환)

`src/engine/ops/rules.ts` — `type Rule = (ctx: { events; orders; legs; now }) => OpsMessage[]`

| id | 조건 | 대상 | 심각도 |
|---|---|---|---|
| R1 | 접수 후 미견적 건 존재 | 실무자 | warn |
| R2 | 단가 미등록 견적 발생 (`QUOTE_UNREGISTERED`) | 실무자 | alert |
| R3 | 배차대기가 `DEMO_SLA_MIN`분 초과 | 실무자 | warn |
| R4 | 구간 DONE 직후 다음 구간이 WAITING (예: 내륙 완료 → 선사 배차 필요) | 실무자 | info |
| R5 | 주문 COMPLETED, 정산 미확정 | 실무자 | info |
| R6 | 오늘 요약: 접수/운행중/완료 건수 | 대표 | info |
| R7 | 마진율이 임계 미만인 건 (§10-③) | 대표 | warn |

규칙은 `RULES` 배열에 추가만 하면 확장된다. UI는 규칙을 모른다. `DEMO_SLA_MIN`은 시연용으로 1~2분.

---

## 7. 시연 단가(블라인드) 원칙

- 모든 PriceRow는 `source: 'placeholder'`, `version: 'placeholder-v0'`. 화면 상단에 상시 배지 **"시연용 예시 단가"**.
- 시드의 거래처·품목·금액은 **가상 값**. 아래 형태만 지킨다: 유형 4종 × 단계 3종에 `표준` 행, 일부에 `세부`·`조건`·`협상` 행(조건 축 조합이 다양하게 보이도록), 그리고 **일부러 비워둔 조합 1개**(R2 미등록 시연용).
- 금액 표시 유틸 `fmtMoney(n)`에 `DEMO_MASK` 토글(켜면 `₩ ●●●,000`). 표시는 항상 이 유틸 경유.
- ⚠ **기존 `src/engine/cubeCoordinate/rateTable.ts`는 거성 도출 실값(품목명·단가)이 들어 있다.** lab에서는 `placeholderSource`로 교체하고, 실값 파일은 lab 브랜치에서 제거한다.

---

## 8. 폴더 (신규만)

```
src/
├─ types/domain/ops.ts
├─ engine/ops/            deriveLegs.ts convertCubes.ts lookupPrice.ts quoteLeg.ts status.ts rules.ts meta.ts(유형_메타) index.ts + tests/
├─ data/lab/              routeDict.ts  placeholderPriceTable.ts  seedOrders.ts
├─ infra/storage/ops/     order.repo.ts leg.repo.ts dispatch.repo.ts event.repo.ts settlement.repo.ts  bus.ts(emit+storage 동기화)
├─ adapters/              dealToOrder.ts
└─ components/
   ├─ Layout/OpsLayout.tsx  FieldLayout.tsx
   └─ Features/Ops/ { Intake/ Dispatch/ Field/ Settlement/ Messages/ common/(MoneyText, DemoBadge, StatusChip) }
```
`App.tsx` 토글: `mode=admin` → OpsLayout, `mode=field` → FieldLayout, 그 외 → 기존 화주 화면(무변경).

---

## 9. 구현 순서와 컷라인 (남은 시간 기준, Claude Code 인수용)

**P0 — 이것만 돼도 시연 성립 (먼저 끝까지 관통)**
1. `types/ops.ts` + `engine/ops/*` + 테스트 (골든: 6m 파이프 → 5t·청구큐브 2,500 유지, 입도 주문 → 3구간 분해, 미등록 룩업 null)
2. `placeholderPriceTable` + `routeDict` + `seedOrders`
3. repo + `bus.emit` + 탭 간 동기화
4. ① 접수(수기 등록 → 구간·견적 생성) → ② 배차 칸반(배정) → ③ 현장 한 화면(상태 버튼)
5. 메시지 패널 (R1~R5) + 실무자/대표 토글

**P1** ④ 정산 확정 + 집계 1개, R6·R7, 화주앱 유입 어댑터(또는 시드)
**P2** 이벤트 타임라인, 필터, 차트, 마진 분석 — 여력 있을 때만

규칙: **P0가 끝까지 관통하기 전에 어떤 창도 다듬지 않는다.** UI는 기존 타일윈드 토큰·2분할 껍데기 재사용(`AdminLayout` 확장).

---

## 10. 논의가 필요한 충돌·미결 (GPT 논의 후 이 표만 갱신)

| # | 지점 | 현재 처리 | 비고 |
|---|---|---|---|
| ① | 단가 룩업 우선순위가 명세에 없음 | 구체성 → 위계 내림차순(§3) | 협상/전속과 조건의 우선순위 확정 필요 |
| ② | 출도(제주→본토) 구간 순서·경로 표기 | 입도의 거울상(도내→선사→내륙)으로 가정 | 경로매핑 명세는 입도만 정의 |
| ③ | 매입(원가)·마진 개념이 명세에 없음 | 시연용 상수 `PURCHASE_RATIO`로 매입=견적×비율 | 실제 원가 모델 필요 |
| ④ | 차량 DB 일부 시드값(1.4t/2.5t/3.5t/11t, 선·면큐브) | 관리자 MVP 값 그대로 + 각주 | 11t 중량큐브(2,200) < 5t축(2,400) 이상 여부 확인 |
| ⑤ | 중량형은 차종 매칭 없이 실존큐브 | 배차 시 차량 라벨만 수동 입력 | 중량형 차종 개념 정리 필요 |
| ⑥ | 선사 구간의 항로 = 선사명 사전 | 주문에 `선사명` 선택 필드, 없으면 '미정' | 견적 시점에 선사 미정인 경우 |
| ⑦ | 화주앱 Deal ↔ Order 매핑이 손실적 | 제원만 이식, 재계산 | 화주앱 쪽 필드 보강 여부 |
| ⑧ | 단가행 거래처 축(협상/전속) | 지원(conditions.거래처) | 개정안 §E(c) 미결과 연동 |
| ⑨ | 개정안 §E (a)~(h) | **이 시스템은 `PriceTableSource` 계약에만 의존** — 로직 확정 후 어댑터만 교체 | |

---

## 11. Claude Code 킥오프 프롬프트

```
너는 integral-lab 레포의 `lab` 브랜치에서 작업한다. 먼저 docs/LAB_ARCHITECTURE.md와
CLAUDE.md를 끝까지 읽어라. 이 설계서가 이 작업의 그라운드 트루스다.

규칙:
- main/admin-mvp-draft 브랜치는 건드리지 않는다. src/engine/cube/(250mm)는 수정 금지.
- §9 P0를 위에서부터 순서대로 끝까지 관통시킨다. P0 전에 UI를 다듬지 않는다.
- 단가는 전부 placeholder. 실값(src/engine/cubeCoordinate/rateTable.ts)은 placeholderSource로 교체 후 제거.
- 설계서와 충돌하거나 정의가 없는 지점은 임의로 정하지 말고 §10 표에 행을 추가하고 가장 단순한 처리로 진행.
- 단계마다 vitest(골든 포함)와 tsc를 통과시키고 작은 커밋으로 나눠라.
```
