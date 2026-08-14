function activeStandard(standards, metricId, asOf) {
  return standards
    .filter((item) => item.metricId === metricId && (!item.effectiveFrom || item.effectiveFrom <= asOf))
    .sort((a, b) => (a.effectiveFrom || '').localeCompare(b.effectiveFrom || ''))
    .at(-1) || null;
}

function statusFor(value, standard) {
  if (!standard) return 'unknown';
  const abnormal = (standard.warningMax != null && value > standard.warningMax) || (standard.warningMin != null && value < standard.warningMin);
  const warning = (standard.normalMax != null && value > standard.normalMax) || (standard.normalMin != null && value < standard.normalMin);
  return abnormal ? 'abnormal' : warning ? 'warning' : 'normal';
}

function pearson(xs, ys) {
  if (xs.length < 2 || xs.length !== ys.length) return null;
  const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((sum, value, index) => sum + (value - xMean) * (ys[index] - yMean), 0);
  const xSize = Math.sqrt(xs.reduce((sum, value) => sum + (value - xMean) ** 2, 0));
  const ySize = Math.sqrt(ys.reduce((sum, value) => sum + (value - yMean) ** 2, 0));
  return xSize && ySize ? +(numerator / (xSize * ySize)).toFixed(3) : null;
}

function analyzePeriod({ observations, standards, definitions, targetMetricId, relationships }) {
  const target = definitions.find((item) => item.id === targetMetricId);
  const latest = observations.at(-1);
  if (!target || !latest) return { status: 'unknown', candidates: [], limitation: '조회 기간에 분석할 데이터가 없습니다.' };
  const standard = activeStandard(standards, targetMetricId, latest.period);
  const value = latest.metrics[targetMetricId];
  const candidates = relationships
    .filter((item) => item.targetMetricId === targetMetricId)
    .map((relationship) => {
      const pairs = observations.map((row) => [row.metrics[targetMetricId], row.metrics[relationship.candidateMetricId]]).filter(([targetValue, candidateValue]) => Number.isFinite(targetValue) && Number.isFinite(candidateValue));
      if (pairs.length < 2) return null;
      const targetValues = pairs.map(([targetValue]) => targetValue);
      const values = pairs.map(([, candidateValue]) => candidateValue);
      const previous = values.at(-2);
      const current = values.at(-1);
      const change = current - previous;
      const baseline = Math.max(Math.abs(previous), 0.000001);
      const relativeChange = Math.abs(change) / baseline;
      if (relativeChange < 0.01) return null;
      const correlation = pearson(targetValues, values);
      if (correlation == null) return null;
      const definition = definitions.find((item) => item.id === relationship.candidateMetricId) || { label: relationship.candidateMetricId, unit: '' };
      const aligned = relationship.direction === 'inverse' ? correlation < 0 : relationship.direction === 'increase' ? correlation > 0 : true;
      if (!aligned) return null;
      return {
        metricId: relationship.candidateMetricId,
        label: definition.label,
        unit: definition.unit || '',
        change,
        correlation,
        score: +(relativeChange * Math.abs(correlation) * (relationship.weight || 1)).toFixed(4),
        reason: `${definition.label} ${change < 0 ? '감소' : '증가'} (${change.toFixed(3)}${definition.unit || ''})`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  const reference = standard?.normalMax ?? standard?.normalMin ?? standard?.target;
  return {
    target: { metricId: targetMetricId, label: target.label, value, unit: target.unit || '', targetVariance: standard?.target == null ? null : +(value - standard.target).toFixed(3), variance: reference == null ? null : +(value - reference).toFixed(3) },
    status: statusFor(value, standard),
    standard,
    candidates,
    limitation: candidates.length ? null : '현재 데이터와 설정된 변수 관계만으로는 뚜렷한 점검 후보를 특정하기 어렵습니다.',
  };
}

module.exports = { analyzePeriod };
