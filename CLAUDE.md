# 만신 (manshin) — Claude Code 전용 보충

**공통 작업 규칙과 게임 규칙 불변식의 기준은 [AGENTS.md](AGENTS.md)다 — 작업 전 반드시 읽는다.** 이 문서는 Claude Code에만 해당하는 보충 지침이다.

## Claude 전용 규칙

1. **공식 플레이 URL은 GitHub Pages**: https://playmanshin.github.io — `main` 푸시가 곧 배포다. 아티팩트는 개발 중 미리보기용 보조 채널로 유지하며, 배포 시 기존 URL을 재사용한다: `url: "https://claude.ai/code/artifact/138e2e4e-5c59-4e68-aec6-10c770f8bac4"` (누락 시 새 URL 발급됨). 어느 쪽이든 배포 전 `tests/run.sh` ALL_GREEN 필수.
2. 배포 라벨·커밋의 빌드 버전(v10.x)과 설계 버전(v0.x)은 별개 — 체계는 `docs/CHANGELOG.md` 첫머리 참조.

## index.html 내부 구조 (코드 탐색 지도, 위→아래 순서)

| 구역 | 내용 |
|------|------|
| `<style>` | 다크 팔레트 + 게임보이 전투창(크림 이중테두리) + 레트로 UI |
| DOM | topbar/relicBar → 전투 정보창 → spiritBar(강신) → handArea → botbar → 오버레이(`titleOv` `starterOv` `mapOv` `rewardOv` `pickOv` `altarOv` 신단 · `restOv` 당산목 · `eventOv` `draftOv` `gearOv` 무구 · `deckOv` `burnOv` `interOv` 막간 · `endOv`) |
| 데이터 | `CARDS`(카드 110+) `RELICS` `SPIRITS`(28종: 신기 aura·굿거리는 `GUTS`) `BOONS`(막간 강화) `TOKENS`/`TOKEN_OF`(해원 신물) `VARIANTS` `ACTS`(4막) `ACT_SCALE` `FIELDS`(판효과) |
| 상태 | `party`(신단, `active`=출전) `deck` `relics` `tokens` `boons` `sinwi/gongdeok`(업) `mapRows`(노드 그래프 `next[]`) |
| 아트 | `drawShaman` + `ART{}` 28종 — fillRect 블록 규칙은 AGENTS.md 참조 |
| 픽셀 파이프라인 | `pixelate()` 4단 램프+베이어 디더+외곽선, 12fps 스텝, `PIX=1.35` |
| 전투 엔진 | `playCard` `endTurn` `castGut` `setChannel` — 피해 계산 단일 함수 `calcIncomingHit()` (규칙은 AGENTS.md) |
| 진행 | `genMap`(그래프 생성+불변식) `chooseNode` `saveRun/loadRun`(mapVersion) `ensureHaewonTarget`(신물→소문 배치) |

주의: 파일은 `</script>`로 끝나며 닫는 `</html>` 태그가 없다 — 스크립트 주입 등으로 끝부분을 다룰 때 참고.

## 전신 프로젝트 (선택 참고)

`/Users/jin/Projects/CustomGame/`에 폐기된 프로토타입 3종(Ghostyard·퇴마행·덱몬)과 초기 GDD들이 있다. **로컬에만 존재할 수 있는 참고 자료로, 없어도 작업에 지장 없다.** 만신 자체의 설계 논거는 이 저장소의 `docs/CHANGELOG.md`에 전부 있다.
