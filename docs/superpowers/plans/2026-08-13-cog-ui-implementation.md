# COG AI Copilot UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a browser-ready front-end prototype that merges the approved COG AI Copilot information architecture with the best visual patterns from the Stitch reference screens.

**Architecture:** Build a dependency-free static front end under `frontend/` so it does not alter existing analysis scripts or data outputs. One HTML application shell contains the three approved top-level areas and renders subviews using local mock data; a stylesheet owns the shared industrial design system and a script owns view navigation and lightweight UI interactions.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, existing synthetic-data terminology and mock display values.

## Global Constraints

- Do not modify backend, API, database, Excel, CSV, or Python analysis code.
- Preserve the approved top-level navigation: 통합 현황, 공정 데이터 분석, 기준 체계.
- Use only deterministic local mock data for this UI phase.
- Keep all anomaly-cause copy qualified as expected cause/check candidates.
- Use no separate abnormal-event flow timeline.

### Task 1: Build the shared application shell and consolidated overview

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/styles.css`
- Create: `frontend/app.js`

- [ ] **Step 1: Create an HTML smoke-test checklist**

Add a `frontend/README.md` checklist requiring the app to expose the three top-level menu labels and the four overview summary cards.

- [ ] **Step 2: Verify baseline absence**

Run: `Test-Path frontend/index.html`
Expected: `False`.

- [ ] **Step 3: Build the minimum shell**

Create the fixed sidebar, utility header, design tokens, and 통합 현황 default view. Use cards for KPI status, Brief & Copilot, 이상 진단, 원가 영향, and selected KPI trends.

- [ ] **Step 4: Verify structure**

Run: `Select-String -Path frontend/index.html -Pattern '통합 현황|공정 데이터 분석|기준 체계'`
Expected: all three labels found.

### Task 2: Add integrated-status detail views

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/styles.css`
- Modify: `frontend/app.js`

- [ ] **Step 1: Add the Brief & Copilot and 이상 진단 view assertions to the checklist**

Require headings `Brief & Copilot`, `Copilot`, and `이상 진단` plus the non-confirmed-cause disclaimer.

- [ ] **Step 2: Verify the new markup is absent**

Run: `Select-String -Path frontend/index.html -Pattern '이상 진단'`
Expected: no detailed-view heading before implementation.

- [ ] **Step 3: Implement contextual details**

Build vertically stacked Brief & Copilot content and an abnormal-diagnosis view with evidence, expected causes, recommendation list, and trend cards without an event-flow timeline.

- [ ] **Step 4: Verify detail headings**

Run: `Select-String -Path frontend/index.html -Pattern 'Brief & Copilot|예상 원인·점검 후보|권장 점검'`
Expected: all headings found.

### Task 3: Add cost, process comparison, and standards views

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/styles.css`
- Modify: `frontend/app.js`

- [ ] **Step 1: Add checklist expectations**

Require the ordered process-analysis sections `1. 분석 지표 선택`, `2. 기간 비교`, `3. 분석 결과` and the standards history heading `기준 변경 이력`.

- [ ] **Step 2: Verify headings are absent before implementation**

Run: `Select-String -Path frontend/index.html -Pattern '기준 변경 이력'`
Expected: no result before implementation.

- [ ] **Step 3: Implement the three views**

Add cost-impact cards/table/formula panel; a simple multi-select, arbitrary comparison-period form and results table; and standards, rules, version history, and update modal UI.

- [ ] **Step 4: Verify required headings**

Run: `Select-String -Path frontend/index.html -Pattern '1. 분석 지표 선택|2. 기간 비교|3. 분석 결과|기준 변경 이력'`
Expected: all headings found.

### Task 4: Validate the complete static front end

**Files:**
- Modify if needed: `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`

- [ ] **Step 1: Check HTML structure**

Run: `python -c "from html.parser import HTMLParser; HTMLParser().feed(open('frontend/index.html', encoding='utf-8').read()); print('HTML OK')"`
Expected: `HTML OK`.

- [ ] **Step 2: Check JavaScript syntax**

Run: `node --check frontend/app.js`
Expected: exit code 0.

- [ ] **Step 3: Review the completed UI against the specification**

Confirm all top-level menus, relevant subviews, visual status treatment, synthetic-data labeling, and no-timeline condition are represented.
