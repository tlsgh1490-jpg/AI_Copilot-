# Copilot 서버

실행:

```powershell
node server/server.js
```

그 뒤 `http://localhost:3000`으로 접속한다. `.env`에는 `NVIDIA_API_KEY`를 넣는다. 기본 선정 모델은 `meta/llama-3.3-70b-instruct`이다. 키나 생성된 SQLite DB는 Git에 포함되지 않는다.

MCP 도구 서버 실행 명령:

```powershell
node server/mcp-server.js
```

Codex에서 이 서버를 도구로 쓰려면 `server/codex-mcp.toml.example` 내용을 사용자 Codex 설정 파일에 추가한 뒤 Codex를 새로 열어야 한다. 현재 실행 중인 대화에는 설정을 추가해도 도구가 즉시 생기지 않는다.

제공 도구는 분석 조회, 기준·운영 데이터 조회, 추가/수정/삭제다. 계산은 DB와 분석 로직이 수행하고, NVIDIA LLM은 계산 결과를 설명하는 문장에만 사용한다. 동일 조회 조건·데이터 버전·기준 버전에서는 저장된 설명을 재사용한다.
