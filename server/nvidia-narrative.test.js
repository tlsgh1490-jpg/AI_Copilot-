const assert = require('node:assert/strict');
const test = require('node:test');
const { createNvidiaNarrativeGenerator } = require('./nvidia-narrative');

test('does not make an external request when NVIDIA settings are absent', async () => {
  const generateNarrative = createNvidiaNarrativeGenerator({ envFile: 'does-not-exist.env' });
  const result = await generateNarrative({ status: 'normal' });
  assert.equal(result, null);
});
