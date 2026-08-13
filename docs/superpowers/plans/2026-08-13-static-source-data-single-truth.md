# Static Source Data Single Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every dashboard result derive from the selected interval of the workbook-derived daily and hourly source records.

**Architecture:** `daily-observations.js`, `cost-observations.js`, and `source-standards.js` are the canonical static source layer. `data-service.js` filters and aggregates that layer, and `app.js` renders only service results. Legacy generated fallback observations are isolated so they cannot silently become a screen data source.

**Tech Stack:** Vanilla JavaScript, Node `assert`, Playwright.

## Global Constraints

- Do not change approved UI structure or visual design.
- Do not add a backend, API, or database.
- Keep the existing workbook-derived static data files as the source of truth.
- A date or time range must affect all data-dependent screen content.

---

### Task 1: Prove canonical static-source selection

**Files:**
- Modify: `frontend/test-data-service.js`
- Modify: `frontend/data.js`
- Test: `frontend/test-data-service.js`

**Interfaces:**
- Consumes: `window.CogSourceDailyObservations`, `window.CogRawCostObservations`, `window.CogSourceStandards`
- Produces: `window.CogMockData.dailyObservations`, `costObservations`, and `standards` that are canonical source arrays.

- [ ] **Step 1: Write the failing test**

```js
assert.strictEqual(CogMockData.dailyObservations, context.window.CogSourceDailyObservations);
assert.strictEqual(CogMockData.costObservations, context.window.CogRawCostObservations);
assert.strictEqual(CogMockData.standards, context.window.CogSourceStandards);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node frontend/test-data-service.js`
Expected: FAIL if any source can be replaced by fallback generated observations.

- [ ] **Step 3: Write minimal implementation**

Assign the three canonical arrays in `data.js` only from their extracted source globals and isolate legacy generated fallback arrays from production queries.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/test-data-service.js`
Expected: PASS.

### Task 2: Make interval aggregation precise

**Files:**
- Modify: `frontend/test-data-service.js`
- Modify: `frontend/data-service.js`
- Test: `frontend/test-data-service.js`

**Interfaces:**
- Consumes: `{ start?: string, end?: string }`
- Produces: `getObservations`, `getKpiSummaries`, `getCostRecords`, `getCostSummary`, and `getEvents` filtered to exactly the selected interval.

- [ ] **Step 1: Write the failing tests**

```js
assert.notStrictEqual(
  CogDataService.getKpiSummaries({ start: '2025-12-01', end: '2025-12-01' }).find((item) => item.id === 'purifiedVolume').value,
  CogDataService.getKpiSummaries({ start: '2025-12-02', end: '2025-12-02' }).find((item) => item.id === 'purifiedVolume').value,
);
assert.notStrictEqual(
  CogDataService.getCostSummary({ start: '2025-12-01T07:00:00', end: '2025-12-01T07:00:00' }).actualProfitImpact,
  CogDataService.getCostSummary({ start: '2025-12-01T08:00:00', end: '2025-12-01T08:00:00' }).actualProfitImpact,
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node frontend/test-data-service.js`
Expected: FAIL if daily or hourly aggregation reuses a monthly/fallback result.

- [ ] **Step 3: Write minimal implementation**

Normalize date-only boundaries to the whole calendar day, preserve explicit hours, and never aggregate from `costRecords` while raw source observations exist.

- [ ] **Step 4: Run test to verify it passes**

Run: `node frontend/test-data-service.js`
Expected: PASS.

### Task 3: Prove screens render selected source intervals

**Files:**
- Modify: `frontend/e2e.spec.js`
- Modify: `frontend/app.js` only if a rendered value bypasses `CogDataService`
- Test: `frontend/e2e.spec.js`

**Interfaces:**
- Consumes: selected overview, Brief, diagnosis, impact, process, and analysis filters.
- Produces: rendered values derived from the selected interval.

- [ ] **Step 1: Write failing E2E checks**

```js
await page.locator('#overview-start').fill('2025-12-01T07:00');
await page.locator('#overview-end').fill('2025-12-01T07:00');
await page.getByRole('button', { name: '조회' }).click();
const firstValue = await page.locator('[data-overview-profit]').textContent();
await page.locator('#overview-start').fill('2025-12-01T08:00');
await page.locator('#overview-end').fill('2025-12-01T08:00');
await page.getByRole('button', { name: '조회' }).click();
expect(await page.locator('[data-overview-profit]').textContent()).not.toBe(firstValue);
```

- [ ] **Step 2: Run E2E to verify failure**

Run: `Push-Location frontend; npx playwright test e2e.spec.js --reporter=line; Pop-Location`
Expected: FAIL if the target page retains a stale value.

- [ ] **Step 3: Write minimal implementation**

Route every filter handler through the existing common refresh function and replace any remaining fixed output with service-derived result fields, without changing DOM layout.

- [ ] **Step 4: Run full verification**

Run: `node frontend/test-data-service.js; Push-Location frontend; npx playwright test e2e.spec.js --reporter=line; Pop-Location; git diff --check`
Expected: all tests pass and no whitespace errors.
