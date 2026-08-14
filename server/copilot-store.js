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
    const count = this.database.prepare('SELECT COUNT(*) AS count FROM observations').get().count;
    if (count) return;
    const observationStatement = this.database.prepare('INSERT INTO observations (period, metrics_json) VALUES (?, ?)');
    const standardStatement = this.database.prepare('INSERT INTO standards (metric_id, standard_json) VALUES (?, ?)');
    this.database.exec('BEGIN');
    try {
      observations.forEach((item) => observationStatement.run(item.period, JSON.stringify(item.metrics)));
      standards.forEach((item) => standardStatement.run(item.metricId, JSON.stringify(item)));
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
    return this.database.prepare('SELECT standard_json FROM standards ORDER BY metric_id').all().map((item) => JSON.parse(item.standard_json));
  }

  upsertObservation(observation) {
    this.database.prepare('INSERT INTO observations (period, metrics_json) VALUES (?, ?) ON CONFLICT(period) DO UPDATE SET metrics_json = excluded.metrics_json').run(observation.period, JSON.stringify(observation.metrics));
    this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'data_version'").run();
  }

  upsertStandard(standard) {
    this.database.prepare('INSERT INTO standards (metric_id, standard_json) VALUES (?, ?) ON CONFLICT(metric_id) DO UPDATE SET standard_json = excluded.standard_json').run(standard.metricId, JSON.stringify(standard));
    this.database.prepare("UPDATE metadata SET value = value + 1 WHERE key = 'standards_version'").run();
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
