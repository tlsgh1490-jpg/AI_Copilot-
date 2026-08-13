# Data-Driven UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the approved front-end visual design while making every displayed KPI, event, profit-impact result, table, chart, filter, and tab derive from a replaceable mock operating-data model.

**Architecture:** Add a mock-data module that mirrors future API payloads, plus a small query/calculation service as the only source of status, period comparison, and profit-impact calculations. The existing `app.js` keeps ownership of the approved markup and styling, but reads UI state and invokes shared service functions whenever a user changes a filter, tab, or selection.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js assertion test.

## Global Constraints

- Do not redesign or substantially rearrange the approved UI.
- Keep all monetary amounts in `백만원`.
- Use one common model and calculation functions across overview, Brief, diagnosis, process, and profit-impact views.
- Keep mock payload fields API-ready: period, dimensions, actual, baseline, variance, target/plan where applicable.
- Do not add backend, API calls, or database work in this step.

---

### Task 1: Define the shared mock operating-data contract

**Files:**
- Create: `frontend/data.js`
- Modify: `frontend/index.html`
- Test: `frontend/test-ui.js`

- [ ] Add a failing assertion for the shared data module and its script load order.
- [ ] Run `node frontend/test-ui.js` and confirm the assertion fails because `frontend/data.js` is absent.
- [ ] Create `window.CogMockData` with KPI definitions, effective-dated management standards, daily operating observations, events, and monthly profit-impact rows.
- [ ] Load `data.js` before `app.js`.
- [ ] Run `node frontend/test-ui.js` and confirm the module assertion passes.

### Task 2: Add query and calculation service

**Files:**
- Create: `frontend/data-service.js`
- Modify: `frontend/index.html`, `frontend/test-ui.js`

- [ ] Add failing assertions for `CogDataService`, `getKpiSummaries`, `getCostRecords`, and one explicit `variance` calculation.
- [ ] Run the test and confirm failure before the service exists.
- [ ] Implement date-range filtering, effective-standard lookup, KPI status evaluation, trend series, cost aggregation, and monthly variance calculation.
- [ ] Load `data-service.js` between the model and the UI app.
- [ ] Run `node frontend/test-ui.js` and confirm all checks pass.

### Task 3: Bind approved screens to the shared state

**Files:**
- Modify: `frontend/app.js`, `frontend/test-ui.js`

- [ ] Add a failing assertion for a single data refresh entry point and shared UI state.
- [ ] Run the test and confirm failure.
- [ ] Add state for date range, plant/process/product, selected metrics, analysis mode, and selected profit item.
- [ ] Render overview, Brief, diagnosis, process overview, process comparison, and standard comparison data from the service while retaining their existing DOM layout/classes.
- [ ] Bind filter/select/tab events to the shared refresh entry point.
- [ ] Run `node frontend/test-ui.js` and `node --check frontend/app.js`.

### Task 4: Make profit-impact selection and charts fully data-driven

**Files:**
- Modify: `frontend/app.js`, `frontend/test-ui.js`

- [ ] Add a failing assertion that profit-impact rendering consumes `actualProfitImpact`, `baselineProfitImpact`, and `variance` from `CogDataService`.
- [ ] Run the test and confirm failure.
- [ ] Replace component-local profit values with service records; re-render monthly table, selected item charts, visible values, and tooltip payloads when the period or item changes.
- [ ] Keep actual as bars and baseline as a line, with per-month baseline values and a tooltip that includes month, actual, baseline, and variance.
- [ ] Run full UI tests, syntax checks, and `git diff --check`.
