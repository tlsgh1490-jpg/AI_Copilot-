# Copilot 서버

실행:

```powershell
node server/server.js
```

브라우저에서 `http://localhost:3000`을 엽니다. `.env`에는 아래만 설정합니다. 실제 API 키는 절대 Git에 저장하지 않습니다.

```dotenv
NVIDIA_API_KEY=...
NVIDIA_MODEL=meta/llama-3.1-8b-instruct
# 선택: NVIDIA_TIMEOUT_MS=90000
# 선택: COPILOT_NARRATIVE_TIMEOUT_MS=20000
```

Copilot은 선택한 조회 기간의 DB 데이터에서 관리기준 이탈, 변화량, 연속 이탈, 설정된 변수 관계·가중치, 실제 상관계수를 계산한 뒤 NVIDIA NIM에 JSON Brief 생성을 요청합니다. 응답은 `예상원인`, `영향KPI`, `점검우선순위`, `brief_summary` 네 필드를 모두 가져야 표시됩니다.

키가 없거나 API·네트워크·시간 제한·JSON 형식 문제가 있으면 서비스는 중단되지 않습니다. 같은 계산 근거로 만든 `계산 기반 설명`을 표시하며, 이 경우 NVIDIA 호출 결과는 사용되지 않습니다. LLM은 계산이나 원가 산식을 바꾸지 않고, 계산 결과를 운전원용 문장으로 설명하는 역할만 합니다.

MCP 도구 서버 실행:

```powershell
node server/mcp-server.js
```

Codex에 연결하려면 [codex-mcp.toml.example](codex-mcp.toml.example)의 내용을 Codex MCP 설정에 추가한 뒤 새 세션을 엽니다. MCP는 기간 분석, 운영 데이터·관리기준·관계/가중치의 조회와 변경을 제공합니다.
