const assert = require('node:assert/strict');
const test = require('node:test');
const { fallbackBrief, parseBriefJson } = require('./brief-narrative');

test('parses a complete Brief JSON response including a markdown fence', () => {
  const result = parseBriefJson('```json\n{"예상원인":"스팀 변동 확인 필요","영향KPI":"품질함량","점검우선순위":"스팀 M01 점검","brief_summary":"[이상] 우선 점검 필요"}\n```');
  assert.deepEqual(result, {
    예상원인: '스팀 변동 확인 필요',
    영향KPI: '품질함량',
    점검우선순위: '스팀 M01 점검',
    brief_summary: '[이상] 우선 점검 필요',
  });
});

test('rejects incomplete or non-JSON Brief text', () => {
  assert.equal(parseBriefJson('분석 문구'), null);
  assert.equal(parseBriefJson('{"예상원인":"확인 필요"}'), null);
});

test('normalizes an affected-KPI list returned by the model', () => {
  const result = parseBriefJson('{"예상원인":"점검 후보","영향KPI":["품질함량","스팀 사용량"],"점검우선순위":"현장 확인","brief_summary":"[이상] 점검"}');
  assert.equal(result.영향KPI, '품질함량, 스팀 사용량');
});

test('builds a non-conclusive calculation fallback from actual candidates', () => {
  const brief = fallbackBrief({
    status: 'abnormal',
    target: { label: '품질함량', value: 0.73, unit: '%', variance: 0.01, consecutiveDays: 2 },
    candidates: [{ label: '스팀 M01', reason: '역방향 관계와 일치', correlation: -0.81 }],
    limitation: '',
  });
  assert.match(brief.예상원인, /확정 원인/);
  assert.match(brief.영향KPI, /품질함량/);
  assert.match(brief.점검우선순위, /스팀 M01/);
  assert.match(brief.brief_summary, /이상/);
});
