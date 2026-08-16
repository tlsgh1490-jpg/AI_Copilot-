const fs = require('node:fs');

function readDotEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  return Object.fromEntries(fs.readFileSync(filePath, 'utf8').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#')).map((line) => {
    const index = line.indexOf('=');
    return index < 0 ? [line, ''] : [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
}

function createNvidiaNarrativeGenerator({ envFile }) {
  const settings = { ...readDotEnv(envFile), ...process.env };
  const key = settings.NVIDIA_API_KEY;
  const model = settings.NVIDIA_MODEL;
  const baseUrl = settings.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
  return async (analysis, { timeoutMs } = {}) => {
    if (!key || !model) return null;
    const prompt = [
      '당신은 제조 공정 Copilot입니다. 아래 계산된 근거만 사용해 현장 운전원용 Brief를 작성하세요.',
      '확정 원인이라고 말하지 말고 “점검 후보”, “확인 필요”로 표현하세요. 제공되지 않은 수치·원인·관계를 만들지 마세요.',
      '반드시 코드 블록 없이 아래 JSON 객체만 반환하세요. 네 값은 모두 한국어의 간결한 문자열이어야 합니다.',
      '{"예상원인":"공학적 점검 후보 1문장","영향KPI":"직·간접 영향 KPI 목록","점검우선순위":"즉각 점검 가이드 1문장","brief_summary":"[주의/이상/정상] 종합 요약과 권고"}',
      `계산 근거: ${JSON.stringify(analysis)}`,
    ].join('\n');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: AbortSignal.timeout(Number(timeoutMs || settings.NVIDIA_TIMEOUT_MS || 90000)),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 350 }),
    });
    if (!response.ok) throw new Error(`NVIDIA NIM request failed (${response.status})`);
    const result = await response.json();
    return result.choices?.[0]?.message?.content?.trim() || null;
  };
}

module.exports = { createNvidiaNarrativeGenerator };
