# Copilot 서버

실행:

```powershell
node server/server.js
```

그 뒤 `http://localhost:3000`으로 접속한다. `.env`에는 `NVIDIA_API_KEY`, `NVIDIA_MODEL`을 넣는다. 키나 생성된 SQLite DB는 Git에 포함되지 않는다.

MCP 도구 서버 실행 명령:

```powershell
node server/mcp-server.js
```

제공 도구는 `analyze_copilot_period`, `get_management_standards`다. 계산은 DB와 분석 로직이 수행하고, NVIDIA LLM은 계산 결과를 설명하는 문장에만 사용한다. 동일 조회 조건·데이터 버전·기준 버전에서는 저장된 설명을 재사용한다.
