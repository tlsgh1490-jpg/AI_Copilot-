# Copilot / MCP 구현 상태

## 현재 동작

- Node 내장 SQLite에 운영 데이터, 날짜별 관리기준, 변수 관계 설정, Copilot 설명 캐시를 저장한다.
- 새 운영 데이터·관리기준·관계 가중치가 바뀌면 버전이 바뀌어 이전 Copilot 설명 캐시를 재사용하지 않는다.
- Copilot은 조회 기간의 기준 이탈, 변화량, 설정된 관계 방향, 실제 상관계수, 설정 가중치를 사용해 점검 우선순위를 계산한다.
- NVIDIA 설정이 있으면 LLM이 계산 결과를 설명한다. 설정이 없거나 호출 실패 시에는 계산 기반 대체 문구를 사용한다.
- MCP 도구: 기간 분석, 운영 데이터 조회/추가/수정/삭제, 관리기준 조회/추가/수정/삭제, 관계/가중치 조회·저장.

## 실행

```powershell
node server/server.js
```

브라우저에서 `http://localhost:3000`을 연다. MCP 등록은 `server/codex-mcp.toml.example`을 참조한다.

## 다음 작업

1. `.env`에 `NVIDIA_MODEL`을 설정한 뒤, 실제 NVIDIA 응답을 한 번 확인한다.
2. 운영 데이터가 실제로 들어오는 시스템의 API 호출을 `POST /api/observations`에 연결한다.
3. 화면의 나머지 테이블·KPI·그래프도 프론트엔드 정적 데이터가 아니라 DB 조회 API를 쓰도록 순차 전환한다.
