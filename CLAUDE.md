# 만신 (manshin) — Claude Code 작업 가이드

한국 무속 호러 덱빌딩 로그라이크. 단일 `index.html`(HTML+CSS+JS ~3,900줄, 외부 의존성 0).

## 필수 규칙

1. **수정 후 반드시 `cd tests && ./run.sh` 실행 — `ALL_GREEN` 아니면 배포·커밋 금지.**
2. 새 기능에는 스모크 테스트 추가 (`node:assert/strict` 사용 — 출력만 하는 테스트 금지).
3. 아티팩트 배포 시 기존 URL 유지: `url: "https://claude.ai/code/artifact/138e2e4e-5c59-4e68-aec6-10c770f8bac4"` 전달.
4. 코드·커밋은 영어, 게임 내 텍스트·주석·문서는 한국어.
5. 저장 스키마 변경 시 `mapVersion` 증가 (구버전 저장 자동 폐기됨).

## index.html 내부 구조 (위→아래 순서)

| 구역 | 내용 |
|------|------|
| `<style>` | 다크 팔레트 + 게임보이 전투창(크림 이중테두리) + 레트로 UI |
| DOM | topbar/relicBar → 전투 정보창 → spiritBar(강신) → handArea → botbar → 오버레이 12종 |
| 데이터 | `CARDS`(카드 90+) `RELICS` `SPIRITS`(28종: 신기 aura·굿거리는 `GUTS`) `BOONS`(막간 강화) `TOKENS`/`TOKEN_OF`(해원 신물) `VARIANTS` `ACTS`(4막) `ACT_SCALE` `FIELDS`(판효과) |
| 상태 | `party`(신단, `active`=출전) `deck` `relics` `tokens` `boons` `sinwi/gongdeok`(업) `mapRows`(노드 그래프 `next[]`) |
| 아트 | `drawShaman` + `ART{}` 28종 — **fillRect 블록 매스만** (arc/ellipse 금지, 헬퍼: blk/shadeR/liteR/eyeSock/saekBand/stepsUp) |
| 픽셀 파이프라인 | `pixelate()` 4단 램프+베이어 디더+외곽선, 12fps 스텝, `PIX=1.35` |
| 전투 엔진 | `playCard` `endTurn` `castGut` `setChannel` — 피해 계산은 **`calcIncomingHit()` 단일 함수** (실행·의도표시 공용, 다단히트는 행동 개시 시 1회 스냅샷) |
| 진행 | `genMap`(그래프 생성+불변식) `chooseNode` `saveRun/loadRun`(mapVersion) `ensureHaewonTarget`(신물→소문 배치) |

## 게임 규칙 불변식 (밸런스 검토로 확정 — 깨면 안 됨)

- 恨 상한: 일반 18 / 정예·보스 24 (`gainHan()` 경유 필수)
- 굿거리 턴당 1회 (`gutCastTurn`)
- 낙인은 공격 **카드당** 1회 발동, 철갑 관통, 상한 8
- X소모 카드 최대 4타 / 방어이월 신기 상한 12 / 동일 신령부 중첩 불가
- 힘 획득은 `gainStr()` 경유 (사기 보정 일원화, 강신 임시 힘 제외)
- 출전: 몸주신 + 귀신 `active` 2위. 전투 덱 = `battleDeck()` 필터
- 다단히트 막 공격 보너스는 타수 분배 (`Math.ceil(atkAdd/h)`)
- 소문(`ensureHaewonTarget`)은 `descendantSet` 기반 — 도달 가능한 후손 노드에만

## 무속 용어 (일관성 유지)

런=진오기굿 · 막=거리(부정/영실/도령/뒷전) · 에너지=신력 · 궁극기 게이지=신명 · 오라=신기 · 저주카드=동티 · 도트=恨 · 해원 열쇠=신물 · 유물=무구 · 덱 카드=부적 · 업 축=신위/공덕 · 상점=당골네 장터 · 난이도=금제

## 이 프로젝트의 전신

`/Users/jin/Projects/CustomGame/`에 폐기된 프로토타입 3종(Ghostyard·퇴마행·덱몬)과 초기 GDD들이 있다. 만신의 설계 논거는 `docs/GDD.md` 버전 로그에 축적돼 있다 — 밸런스를 만지기 전에 해당 버전 항목을 먼저 읽을 것.
