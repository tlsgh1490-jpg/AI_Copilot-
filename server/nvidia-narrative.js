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
  return async (analysis) => {
    if (!key || !model) return null;
    const prompt = [
      '당신은 제조 공정 Copilot입니다. 아래 계산 결과만 근거로 한국어 2~3문장으로 요약하세요.',
      '확정 원인이라고 말하지 말고 점검 후보라고 표현하세요. 제공되지 않은 사실이나 수치를 만들지 마세요.',
      JSON.stringify(analysis),
    ].join('\n');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.2, max_tokens: 250 }),
    });
    if (!response.ok) throw new Error(`NVIDIA NIM request failed (${response.status})`);
    const result = await response.json();
    return result.choices?.[0]?.message?.content?.trim() || null;
  };
}

module.exports = { createNvidiaNarrativeGenerator };
