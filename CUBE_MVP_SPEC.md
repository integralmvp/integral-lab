# CUBE 관리자 MVP — 빌드 스펙 (1시간 확정판)

> 이 문서 하나를 Claude Code에 넣고 시작한다. 로직은 이미 확정됨 — 추측 금지, 이 스펙이 그라운드 트루스.
> 원칙: **도출(파이프라인)과 적용(MVP) 분리.** MVP는 냉동 단가테이블을 정적으로 룩업만 한다. SPL 재구동 없음.

---

## 0. 확정 스코프

**히어로 유형: 차량형** (매칭이 청구큐브=견적가 분모를 결정)

**히어로 플로우 (한 화면, 한 화물):**
```
화물 제원 입력 → 큐브 좌표계 환산(선/면/공간/중량큐브)
  → 최소 적합 차종 추천(+초과 사유, 특히 선큐브 길이 초과)
  → 청구큐브 산출 → 냉동 단가테이블 룩업 → 견적가 → 견적 저장/목록
```

| 구분 | 항목 |
|---|---|
| **IN (코어)** | 큐브 좌표계 환산 · 차량 매칭(선큐브 시드로 길이서사) · 청구큐브 · 냉동테이블 견적가 · 견적 저장/목록 · 화주 프로그램 껍데기 이식 |
| **STRETCH (코어 끝나고 시간 남으면)** | 혼적 장바구니(누적 부피·중량 체크) · 예상 마진 배지 |
| **OUT (오늘 안 함)** | SPL 실시간 재구동 · 형태지수/공간창출률/조합 혼적 · 마진 심층분석 · 나머지 3유형(중량/컨테이너/자동화물) |

---

## 1. 큐브 엔진 (결정론적 — TS로 포팅, 순수함수)

상수: `const CUBE_MM = 200;` (1큐브 = 200mm)

**MVP 반올림 규약 (문서에 없어 여기서 고정):**
- 화물 큐브 = 축별 **올림(ceil)** — 부분 큐브도 점유로 카운트
- 차량 큐브(선/면) = **내림(floor)** — 보수적 수용량

```ts
// 화물 큐브 좌표 (큐브좌표계 §9)
function cargoCubes(L_mm, W_mm, H_mm, weight_kg) {
  const ax = [Math.ceil(L_mm/200), Math.ceil(W_mm/200), Math.ceil(H_mm/200)]
             .sort((a,b)=>b-a);            // A ≥ B ≥ C
  const [A,B,C] = ax;
  return {
    line_cube:   A,          // 선큐브 = 최장축
    area_cube:   A*B,        // 면큐브 = 최장 2축
    volume_cube: A*B*C,      // 공간큐브
    weight_cube: Math.round(weight_kg/1000 * 200),  // 중량큐브 = ton×200
  };
}

// 차량 매칭 (큐브좌표계 §11) — 네 좌표 모두 만족하는 최소 차종
function matchVehicle(cargo, vehicles /* sort_order 오름차순 */) {
  for (const v of vehicles) {
    const reasons = [];
    if (cargo.line_cube   > v.line_cube)   reasons.push("LINE");
    if (cargo.area_cube   > v.area_cube)   reasons.push("AREA");
    if (cargo.volume_cube > v.volume_cube) reasons.push("VOLUME");
    if (cargo.weight_cube > v.weight_cube) reasons.push("WEIGHT");
    if (reasons.length === 0)
      return { matched:true, vehicle:v, reasons:[] };
  }
  return { matched:false, vehicle:null, reasons:["NO_AVAILABLE_VEHICLE"] };
}

// 청구큐브 (차량형 = 실질큐브: 청구차종 부피큐브 × 대수)  — 큐브좌표계 §7.2
function billingCube(matchedVehicle, count=1) {
  return matchedVehicle.volume_cube * count;
}

// 견적가 = 냉동 단가테이블 룩업 (아래 §3). SPL 재계산 없음.
function quote(rateTable, 권역 /* "시내"|"시외" */, matchedVehicle, count=1) {
  const 차량당 = rateTable["차량형"]["도내비"][권역];  // 냉동 표준값
  const 청구큐브 = billingCube(matchedVehicle, count);
  const 큐브당 = Math.round(차량당 / matchedVehicle.volume_cube); // 병행 표시(그룹핑 축)
  return { 청구큐브, 큐브당, 차량당, 견적가: 차량당 * count };
}
```

> 매칭 시 초과사유 배열을 UI에 그대로 노출한다("선초과" 등). 이게 길이서사의 증거.

---

## 2. 차량 DB (검증 완료 — 그대로 사용)

`volume_cube`/`weight_cube` = 큐브좌표계 §4.1·§4.2 **문서 확정값**.
`line_cube`/`area_cube` + 중간차종(1.4/2.5/3.5/11t) = **시드값**(실제 적재함 내부규격 기반, 데모용 — 추후 실측 등록). UI 어딘가에 "차량 규격 일부 시드값" 각주 한 줄 권장.

```json
[
  {"id":"1t",   "name":"1t",   "line_cube":14,"area_cube":112,"volume_cube":400, "weight_cube":300, "sort_order":0},
  {"id":"1.4t", "name":"1.4t", "line_cube":15,"area_cube":131,"volume_cube":480, "weight_cube":400, "sort_order":1},
  {"id":"2.5t", "name":"2.5t", "line_cube":21,"area_cube":198,"volume_cube":900, "weight_cube":700, "sort_order":2},
  {"id":"3.5t", "name":"3.5t", "line_cube":23,"area_cube":230,"volume_cube":1200,"weight_cube":900, "sort_order":3},
  {"id":"5t",   "name":"5t",   "line_cube":31,"area_cube":356,"volume_cube":2500,"weight_cube":1600,"sort_order":4},
  {"id":"5t축", "name":"5t축", "line_cube":36,"area_cube":419,"volume_cube":3000,"weight_cube":2400,"sort_order":5},
  {"id":"11t",  "name":"11t",  "line_cube":45,"area_cube":528,"volume_cube":3800,"weight_cube":2200,"sort_order":6},
  {"id":"25t",  "name":"25t",  "line_cube":50,"area_cube":587,"volume_cube":4500,"weight_cube":5400,"sort_order":7},
  {"id":"추레라","name":"추레라","line_cube":60,"area_cube":705,"volume_cube":5000,"weight_cube":5400,"sort_order":8},
  {"id":"로베드","name":"로베드","line_cube":60,"area_cube":900,"volume_cube":4500,"weight_cube":5400,"sort_order":9}
]
```

---

## 3. 냉동 단가테이블 (lab: 시연용 placeholder 값)

> ⚠ lab 브랜치: 실단가·실거래처명은 제거하고 시연용 임시값으로 교체했다 (docs/LAB_ARCHITECTURE.md §7, §10-⑪·⑰). 실값은 SPL 산출물(`splSource`)로만 재유입한다.
권역은 MVP에서 사용자가 입력(시내/시외). 선사비/내륙비는 섬간 운송 확장분 → 데모 OUT.

```json
{
  "차량형": {
    "도내비": { "시내": 90000, "시외": 130000 }
  }
}
```
- 견적가 = 도내비(권역) × 차량대수
- 큐브당 단가(병행 표시) = 도내비 / 청구차종 부피큐브  (예: 5t 시외 = 130000/2500 = 52원/큐브, 임시값)

---

## 4. 골든 데모 화물 (리허설은 이것만 — happy path 보장)

**입력:** 길이 6000 · 폭 600 · 높이 600 (mm) · 중량 300 (kg) · 권역 "시외" · 대수 1
(장척 파이프 시나리오)

**기대 출력 (엔진이 이 표를 정확히 재현해야 함 = Fable 검증 기준):**

| 항목 | 값 |
|---|---|
| 큐브 좌표 | 선 30 · 면 90 · 공간 270 · 중량 60 |
| 1t~3.5t | ❌ **선초과**(선 30 > 14/15/21/23) — 공간·중량은 여유 |
| 추천 차종 | **5t** (선 31 ≥ 30, 첫 적합) |
| 청구큐브 | 2,500 (5t 부피큐브 × 1대) |
| 큐브당 단가 | 52 원/큐브 (시외, 임시값) |
| **견적가** | **130,000 원** (임시값) |

데모 멘트: "공간도 무게도 1톤이면 충분한데, 길이 하나 때문에 5톤. 큐브가 이걸 자동으로 잡아냅니다."

---

## 5. 데이터 모델 (큐브좌표계 §16, 그대로)

```ts
type Cargo   = { id; width_mm; length_mm; height_mm; weight_kg; cbm?;
                 line_cube; area_cube; volume_cube; weight_cube;
                 거래처?; 품목?; 권역? };
type Vehicle = { id; name; line_cube; area_cube; volume_cube; weight_cube; sort_order };
type Quote   = { id; cargo; matched_vehicle; 권역; 대수;
                 청구큐브; 큐브당; 견적가; created_at };
```
견적 저장/목록: `window.storage`(아티팩트) 또는 로컬 상태. 로그인·서버 없음.

---

## 6. 모델 배분 (Fable는 정확도 한 방에만)

| 구간 | 모델 | 이유 |
|---|---|---|
| 폴더 포크 · UI 이식 · 폼/목록/스타일 · 글루코드 | **Sonnet** | 양 많고 저리스크. 여기서 토큰 아낌 |
| 큐브 엔진 모듈(§1) 작성 | **Opus** (여유 없으면 Sonnet — 스펙이 정밀해 저리스크) | 여기 틀리면 견적 전체가 틀림 |
| 골든 데모(§4) 재현 검증 1패스 | **Fable** | correctness 최종 확인 딱 한 번 |
| Fable가 잡은 불일치 수정 | **Opus** (소방수로 예비) | 막판 정확도 firefighting |

> Fable는 §4 표를 기준으로 "엔진 출력이 정확히 일치하나?"만 물어라. 그 이상 쓰지 말 것.

---

## 7. 60분 타임라인 (남은 시간 기준으로 압축)

```
0–8    화주 폴더 → integral-admin 복제, 부팅, 껍데기 렌더 확인       (Sonnet)
8–15   vehicle_db.json · rate_table.json · cube_engine.ts 투입       (Opus/Sonnet)
15–35  히어로 화면: 화물폼 → 큐브좌표 → 차종추천 → 청구큐브 → 견적가 (Sonnet UI)
35–45  견적 저장/목록                                                (Sonnet)
45–52  Fable 검증(골든 §4) + 수정
52–58  골든 데모로 리허설 1회 (밟아본 경로만)
58–60  버퍼
```

---

## 8. 화주 프로그램 포크 원칙 (리팩터링 금지 — 복사가 이긴다)

1. 화주 폴더 통째 복제 → `integral-admin`
2. 2분할 껍데기 · 타일윈드 토큰 · 공통 컴포넌트는 **손대지 않는다**
3. 왼쪽 콘솔(35%)만 "견적 생성 뷰"로 교체. 오른쪽 지도(65%)는 유지 또는 견적 결과 패널
4. 위 §1~3 파일을 정적 모듈로 투입, 큐브 엔진은 브라우저에서 순수 계산
5. 공유 패키지로 빼는 리팩터링은 오늘 금지 (시간 함정)

> 킥오프 프롬프트는 화주 폴더 경로 받는 즉시 이 스펙 기준으로 완성해 전달.
