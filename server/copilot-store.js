const { DatabaseSync } = require('node:sqlite');

class CopilotStore {
  constructor(databasePath) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS observations (
        period TEXT PRIMARY KEY,
        metrics_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS standards (
        metric_id TEXT PRIMARY KEY,
        standard_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS standard_versions (
        metric_id TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        standard_json TEXT NOT NULL,
        PRIMARY KEY (metric_id, effective_from)
      );
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS copilot_cache (
        cache_key TEXT PRIMARY KEY,
        data_version INTEGER NOT NULL,
        standards_version INTEGER NOT NULL,
        result_json TEXT NOT NULL
      );
    `);
    this.database.prepare("INSERT OR IGNORE INTO metadata (key, value) VALUES ('data_version', 1), ('standards_version', 1)").run();
  }

  seed({ observations, standards }) {
    const observationCount = this.database.prepare('SELECT COUNT(*) AS count FROM observations').get().count;
    const standardCount = this.database.prepare('SELECT COUNT(*) AS count FROM standard_versions').get().count;
    if (observationCount && standardCount) return;
    const observationStatement = this.database.prepare('INSERT INTO observations (period, metrics_json) VALUES (?, ?)');
    const standardStatement = this.database.prepare('INSERT INTO standard_versions (metric_id, effective_from, standard_json) VALUES (?, ?, ?)');
    this.database.exec('BEGIN');
    try {
      if (!observationCount) observations.forEach((item) => observationStatement.run(item.period, JSON.stringify(item.metrics)));
      if (!standardCount) standards.forEach((item) => standardStatement.run(item.metricId, item.effectiveFrom || '0000-01-01', JSON.stringify({ ...item, effectiveFrom: item.effectiveFrom || '0000-01-01' })));
      this.database.exec('COMMIT');
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  versions() {
    const values = this.database.prepare('SELECT key, value FROM metadata').all();
    return Object.fromEntries(values.map((item) => [item.key, item.value]));
  }

  observations({ start, end } = {}) {
    const rows = this.database.prepare('SELECT period, metrics_json FROM observations WHERE (? IS NULL OR period >= ?) AND (? IS NULL OR period <= ?) ORDER BY period').all(start || null, start || null, end || null, end || null);
    return rows.map((item) => ({ period: item.period, metrics: JSON.parse(item.metrics_json) }));
  }

  standards() {
    return this.database.prepare('SELECT standard_json FROM standard_versions ORDER BY metric_id, effective_from').all().map((item) => JSON.parse(item.standard_json));
  }

  upsertObservation(observation) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(observation.period || '') || !observation.metrics || typeof observation.metrics !== 'object') throw new Error('period and metrics are required');
    if (!Object.values(observation.metrics).every(Number.isFinite)) throw new Error('each metric must be a finite number');
    this.database.prepare('INSERT INTO observations (period, metrics_json) VALUES (?, ?) ON CONFLICT(period) DO UPDATE SET metrics_json = excluded.metrics_json').run(observation.period, JSON.stringify(observation.metrics));
    this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'data_version'").run();
  }

  deleteObservation(period) {
    const result = this.database.prepare('DELETE FROM observations WHERE period = ?').run(period);
    if (result.changes) this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'data_version'").run();
    return result.changes > 0;
  }

  upsertStandard(standard) {
    if (!standard.metricId || typeof standard.metricId !== 'string') throw new Error('metricId is required');
    if (!['normalMin', 'normalMax', 'warningMin', 'warningMax', 'target'].every((key) => standard[key] == null || Number.isFinite(standard[key]))) throw new Error('standard thresholds must be finite numbers');
    const normalized = { ...standard, effectiveFrom: standard.effectiveFrom || '0000-01-01' };
    this.database.prepare('INSERT INTO standard_versions (metric_id, effective_from, standard_json) VALUES (?, ?, ?) ON CONFLICT(metric_id, effective_from) DO UPDATE SET standard_json = excluded.standard_json').run(normalized.metricId, normalized.effectiveFrom, JSON.stringify(normalized));
    this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'standards_version'").run();
  }

  deleteStandard(metricId) {
    const result = this.database.prepare('DELETE FROM standard_versions WHERE metric_id = ?').run(metricId);
    if (result.changes) this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'standards_version'").run();
    return result.changes > 0;
  }

  getCached(cacheKey, versions) {
    const row = this.database.prepare('SELECT result_json FROM copilot_cache WHERE cache_key = ? AND data_version = ? AND standards_version = ?').get(cacheKey, versions.data_version, versions.standards_version);
    return row ? JSON.parse(row.result_json) : null;
  }

  putCached(cacheKey, versions, result) {
    this.database.prepare('INSERT INTO copilot_cache (cache_key, data_version, standards_version, result_json) VALUES (?, ?, ?, ?) ON CONFLICT(cache_key) DO UPDATE SET data_version = excluded.data_version, standards_version = excluded.standards_version, result_json = excluded.result_json').run(cacheKey, versions.data_version, versions.standards_version, JSON.stringify(result));
  }

  close() {
    this.database.close();
  }
}

module.exports = { CopilotStore };
