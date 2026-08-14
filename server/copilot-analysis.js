function activeStandard(standards, metricId) {
  return standards.filter((item) => item.metricId === metricId).at(-1) || null;
}

function statusFor(value, standard) {
  if (!standard) return 'unknown';
  const abnormal = (standard.warningMax != null && value > standard.warningMax) || (standard.warningMin != null && value < standard.warningMin);
  const warning = (standard.normalMax != null && value > standard.normalMax) || (standard.normalMin != null && value < standard.normalMin);
  return abnormal ? 'abnormal' : warning ? 'warning' : 'normal';
}

function analyzePeriod({ observations, standards, definitions, targetMetricId, relationships }) {
  const target = definitions.find((item) => item.id === targetMetricId);
  const latest = observations.at(-1);
  if (!target || !latest) return { status: 'unknown', candidates: [], limitation: '조회 기간에 분석할 데이터가 없습니다.' };
  const standard = activeStandard(standards, targetMetricId);
  const value = latest.metrics[targetMetricId];
  const candidates = relationships
    .filter((item) => item.targetMetricId === targetMetricId)
    .map((relationship) => {
      const values = observations.map((row) => row.metrics[relationship.candidateMetricId]).filter(Number.isFinite);
      if (values.length < 2) return null;
      const previous = values.at(-2);
      const current = values.at(-1);
      const change = current - previous;
      const baseline = Math.max(Math.abs(previous), 0.000001);
      const relativeChange = Math.abs(change) / baseline;
      if (relativeChange < 0.01) return null;
      const definition = definitions.find((item) => item.id === relationship.candidateMetricId) || { label: relationship.candidateMetricId, unit: '' };
      const aligned = relationship.direction === 'inverse' ? change < 0 : relationship.direction === 'increase' ? change > 0 : true;
      if (!aligned) return null;
      return {
        metricId: relationship.candidateMetricId,
        label: definition.label,
        unit: definition.unit || '',
        change,
        score: +(relativeChange * (relationship.weight || 1)).toFixed(4),
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
