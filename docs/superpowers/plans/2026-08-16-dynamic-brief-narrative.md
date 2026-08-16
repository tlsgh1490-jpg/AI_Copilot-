# Dynamic Brief Narrative Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate the Copilot Brief from the selected period's calculated evidence through NVIDIA NIM, while retaining a truthful calculation-based fallback.

**Architecture:** The existing server remains the only runtime entry point. A small Brief module converts the calculation result into a fixed JSON shape; the NVIDIA adapter asks for that same shape and rejects malformed answers. The static Python export keeps its legacy fields but stops presenting scenario IDs as confirmed causes.

**Tech Stack:** Node.js standard library, `node:test`, SQLite store already in the project, NVIDIA NIM OpenAI-compatible HTTP API, existing static frontend.

## Global Constraints

- Do not edit the user-restored source-data files, workbooks, or existing cost-calculation formulas.
- Keep `daily_status` and `event_analysis` field names compatible with the current frontend.
- Use only computed deviations, streaks, configured relationships/weights, and correlations as LLM evidence.
- Never present an unverified cause as a fact; NVIDIA/network/JSON failures must return a calculation-based fallback.
- Keep the NVIDIA key only in `.env`; do not commit or display it.

---

### Task 1: Structured Brief contract

**Files:**
- Create: `server/brief-narrative.js`
- Create: `server/brief-narrative.test.js`

**Interfaces:**
- Produces: `fallbackBrief(analysis): { 예상원인, 영향KPI, 점검우선순위, brief_summary }`
- Produces: `parseBriefJson(text): Brief | null`
- Consumes: `analysis` returned by `analyzePeriod`.

- [ ] **Step 1: Write failing tests**

```js
assert.deepEqual(parseBriefJson('{"예상원인":"확인 필요","영향KPI":"품질","점검우선순위":"점검","brief_summary":"주의"}'), expected);
assert.equal(parseBriefJson('not json'), null);
assert.match(fallbackBrief(abnormalAnalysis).brief_summary, /확정 원인/);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/brief-narrative.test.js`

Expected: FAIL because `server/brief-narrative.js` does not exist.

- [ ] **Step 3: Implement the smallest contract**

```js
function parseBriefJson(text) {
  const parsed = JSON.parse(stripMarkdownFence(text));
  return requiredKeys.every((key) => typeof parsed[key] === 'string' && parsed[key].trim()) ? pickRequired(parsed) : null;
}
```

`fallbackBrief` must derive names and status from `analysis`, use no scenario ID, and say it is a check candidate rather than a confirmed cause.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test server/brief-narrative.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/brief-narrative.js server/brief-narrative.test.js
git commit -m "feat: add structured copilot brief fallback"
```

### Task 2: NVIDIA JSON generation and service response

**Files:**
- Modify: `server/nvidia-narrative.js`
- Modify: `server/copilot-service.js`
- Modify: `server/server.js`
- Modify: `server/nvidia-narrative.test.js`
- Modify: `server/copilot-service.test.js`

**Interfaces:**
- Consumes: `parseBriefJson(text)` and `fallbackBrief(analysis)` from Task 1.
- Produces: `service.analyze(...)` response with existing `analysis`, `narrative`, and `narrativeSource`, plus `brief` and `briefSource`.

- [ ] **Step 1: Write failing tests**

```js
const result = await service.analyze({ targetMetricId: 'qualityContent' });
assert.equal(result.brief.예상원인, '스팀 변동 확인 필요');
assert.equal(result.briefSource, 'nvidia');
```

Add a malformed-NVIDIA-result case that asserts `briefSource === 'calculation'` and all four required Brief keys remain present.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test server/copilot-service.test.js server/nvidia-narrative.test.js`

Expected: FAIL because `brief` is not returned.

- [ ] **Step 3: Implement the smallest integration**

The NVIDIA prompt must include only serialized computed context: target value/standard/variance/status, any streak count, candidate labels/directions/weights/correlations, and provided profit impact. Ask for JSON only with the four Korean keys. Parse the answer before accepting it. Keep the existing short `narrative` field as `brief.brief_summary` so current consumers remain compatible.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test server/copilot-service.test.js server/nvidia-narrative.test.js server/server.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/nvidia-narrative.js server/copilot-service.js server/server.js server/nvidia-narrative.test.js server/copilot-service.test.js
git commit -m "feat: generate validated NVIDIA copilot briefs"
```

### Task 3: Copilot UI and legacy export safety

**Files:**
- Modify: `frontend/copilot-api.js`
- Modify: `_analysis_work/build_analysis_data.py`
- Modify: `server/server.test.js`

**Interfaces:**
- Consumes: `/api/copilot` `brief` and `briefSource` from Task 2.
- Produces: the existing Copilot panel with Brief cause candidates, affected KPIs, and check priority.
- Produces: legacy `analysis_data.json` rows with unchanged key names and non-conclusive fallback text.

- [ ] **Step 1: Write a failing route/UI-contract test**

```js
assert.equal(response.briefSource, 'calculation');
assert.equal(typeof response.brief.점검우선순위, 'string');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test server/server.test.js`

Expected: FAIL because the route has no Brief contract.

- [ ] **Step 3: Implement minimal presentation and export changes**

Render the three additional Brief fields only when present. Preserve the existing panel layout and the clear `AI 설명` / `계산 기반 설명` label. Replace Python `scenario_info` conclusions with a single generic compatibility message that tells the viewer to use the selected-period Copilot analysis; do not add Python API calls because Python is not the runtime service and is not available in this environment.

- [ ] **Step 4: Run tests and syntax checks**

Run: `node --test server/*.test.js; node --check frontend/copilot-api.js; node --check server/server.js`

Expected: all tests pass and syntax checks exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/copilot-api.js _analysis_work/build_analysis_data.py server/server.test.js
git commit -m "feat: display dynamic brief without scenario conclusions"
```

### Task 4: End-to-end validation and handoff

**Files:**
- Modify: `server/README.md`
- Modify: `docs/copilot-mcp-implementation-status.md`

**Interfaces:**
- Documents: `.env` variables, server start command, fallback behavior, and the distinction between runtime analysis and legacy build export.

- [ ] **Step 1: Verify automated tests**

Run: `node --test server/*.test.js; node frontend/test-data-service.js`

Expected: all pass.

- [ ] **Step 2: Verify actual local route without exposing secrets**

Run the server with a temporary database and request `/api/copilot`; assert that it returns `analysis`, `brief`, and a `briefSource`, then stop the exact server process.

- [ ] **Step 3: Document operation and fallback**

Document `NVIDIA_API_KEY`, optional model/timeout settings, `node server/server.js`, and that fallback means no token/API call succeeded.

- [ ] **Step 4: Commit and push only intended files**

```bash
git add server/README.md docs/copilot-mcp-implementation-status.md
git commit -m "docs: explain dynamic copilot brief operation"
git push origin codex/llm-mcp-copilot
```

## Self-review

- The plan covers structured JSON, malformed/network fallback, evidence-only prompting, UI compatibility, and legacy export compatibility.
- No source-data file, workbook, or cost formula is in the change list.
- All function names and response fields used by later tasks are defined by earlier tasks.
