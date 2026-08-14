const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { CopilotStore } = require('./copilot-store');

function temporaryDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'copilot-store-'));
  return { directory, databasePath: path.join(directory, 'copilot.sqlite') };
}

test('keeps a generated narrative until data or standards change', () => {
  const { directory, databasePath } = temporaryDatabase();
  let store;
  try {
    store = new CopilotStore(databasePath);
    store.seed({
      observations: [{ period: '2026-01-01', metrics: { qualityContent: 0.70 } }],
      standards: [{ metricId: 'qualityContent', normalMax: 0.72, warningMax: 0.725 }],
    });
    const versions = store.versions();
    store.putCached('quality-jan', versions, { text: '저장된 설명' });
    assert.equal(store.getCached('quality-jan', versions).text, '저장된 설명');

    store.upsertObservation({ period: '2026-01-02', metrics: { qualityContent: 0.73 } });
    assert.equal(store.getCached('quality-jan', store.versions()), null);

    const beforeStandardChange = store.versions().standards_version;
    store.upsertStandard({ metricId: 'qualityContent', normalMax: 0.71, warningMax: 0.72 });
    assert.equal(store.versions().standards_version, beforeStandardChange + 1);

    store.upsertStandard({ metricId: 'qualityContent', effectiveFrom: '2027-01-01', normalMax: 0.70, warningMax: 0.71 });
    assert.equal(store.standards().filter((item) => item.metricId === 'qualityContent').length, 2);

    store.upsertRelationship({ targetMetricId: 'qualityContent', candidateMetricId: 'steamM01', direction: 'inverse', weight: 0.82 });
    assert.equal(store.relationships('qualityContent')[0].weight, 0.82);

    store.deleteObservation('2026-01-02');
    assert.equal(store.observations().length, 1);
  } finally {
    store?.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('rejects non-numeric operating values before they reach the database', () => {
  const { directory, databasePath } = temporaryDatabase();
  const store = new CopilotStore(databasePath);
  try {
    assert.throws(() => store.upsertObservation({ period: '2026-01-01', metrics: { qualityContent: 'bad' } }), /finite number/);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
