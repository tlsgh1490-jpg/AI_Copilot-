# Diagnosis and Comparison Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the anomaly diagnosis immediately identify the breached KPI and replace process-analysis change badges with per-metric comparison charts.

**Architecture:** Keep the prototype static. Extend the existing semantic HTML with clear breach-summary and compact SVG comparison cells; CSS supplies blue success-state tokens without changing mock data or navigation behavior.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node static assertion script.

## Global Constraints

- Modify only `frontend/` UI files and their static assertion test.
- Do not change backend, API, DB, Excel, CSV, or analysis code.
- Retain red for anomaly and amber for warning; use blue for normal, positive, and improvement states.
- Do not add an event-flow timeline.

---

### Task 1: Add failing UI assertions

**Files:**
- Modify: `frontend/test-ui.js`

- [ ] **Step 1: Assert the new breach summary and comparison-chart hooks**

Add assertions for `breach-summary`, `comparison-trend`, and the quality KPI label.

- [ ] **Step 2: Verify failure**

Run: `node frontend/test-ui.js`
Expected: FAIL because these UI hooks are absent.

### Task 2: Implement focused anomaly and process-result markup

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/styles.css`

- [ ] **Step 1: Add an explicit anomaly breach summary**

Place a compact block above the diagnosis trend with KPI name, current value, limit, breach magnitude, and target variance.

- [ ] **Step 2: Replace process-result change cells with small SVG comparisons**

Render one compact chart per listed metric with a labelled baseline, comparison line, and current-period emphasis.

- [ ] **Step 3: Apply blue normal/positive styles**

Override the normal and positive state palette using the shared blue token; leave brand teal available only for controls.

- [ ] **Step 4: Verify pass**

Run: `node frontend/test-ui.js && node --check frontend/app.js && git diff --check`
Expected: all commands exit 0.
